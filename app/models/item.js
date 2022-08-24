var

    Item = require('./item/item-schema').Item,
    ItemCategory = require('./item/item-schema').ItemCategory,
    ItemForm = require('./item/item-schema').ItemForm,
    ItemPackaging = require('./item/item-schema').ItemPackaging,

    Order = require('./stock/order-schema').Order,
    OrderStatus = require('./stock/order-schema').OrderStatus,

    PointLocation = require('./stock/location-schema'),
    StockHistory = require('./stock/stockhistory-schema'),
    StockCount = require('./stock/stockcount-schema'),
    _ = require('lodash'),
    NafdacDrugsModel = require('./item/nafdacdrugs'),
    Stock = require('./stock').manager,
    EventRegister = require('../../lib/event_register').register,
    nconf = require('nconf'),
    Q = require('q'),
    util = require('util');

// var Order = OrderSchema.Order, OrderStatus = OrderSchema.OrderStatus;


/**
 * Module dependencies.
 */


function ItemsObject(){
  Item.setKeywords();
  NafdacDrugsModel.setKeywords();
  // console.log(Item);
  this.searchResult = {};
}


ItemsObject.prototype.constructor = ItemsObject;

/**
 * Creates a new drug item or medical equipment.
 * It also checks if an invoice number is present in
 * the request. If an invoice number is found, a new
 * order is placed, set to supplied, here by increasing
 * the stock amount to the amount sent with the invoice
 * number.
 *
 * @param  {[type]}   itemBody [description]
 * @param  {Function} cb [description]
 * @return {[type]}            [description]
 */
ItemsObject.prototype.create = function (itemBody, cb) {
  var register = new EventRegister(),
    stockHistory = new StockHistory(),
    hasOrder = false,
    itemObject = null,
    result = null;


  register.once('checksort', function(data, isDone){
    // return;
    if(!data.item){
      return isDone(new Error('Empty Request Item'));
    }
    //copy the item category property into a variable
    var shark = data.item.itemCategory;
    var grouped_items_list = data.item.groupedItems;

    //omit the itemCategory property
    var joel = _.omit(data.item, 'itemCategory');

    itemObject = new Item(joel);

    if(shark){
      _.each(shark, function(v){
        itemObject.itemCategory.push(v._id);
      });
    }
    if(grouped_items_list){
      _.each(grouped_items_list, function(v){
        itemObject.itemCategory.push(v._id);
      });
    }

    isDone(data);
  });

  register.once('getMainLocation', function(data, isDone){
    //Skip to the next is hasOrder is false;
    //if(!hasOrder) return isDone(data);
    PointLocation.findOne({locationType: 'default'},
      function(err, i){
        if(err){
          isDone(err);
        }else{
          data.location = {
            id: i._id,
            name: i.locationName
          };
          isDone(data);
        }
      });
  });

  //This registers this new item as an order which has been supplied
  //if the invoice data is available
  register.once('checkInvoice', function(data, isDone){
    //if orderInvoiceData is defined
    if(data.item.orderInvoiceData !== undefined){
      //lets check if the order Invoice number is also present
      if (!data.item.orderInvoiceData.orderInvoiceNumber.length) {
        return isDone(data);
      }
      hasOrder = true;

      //Creates a new order.
      var order = new Order();

      //Push the itemName and Item ObjectId into the itemData array
      //on the order object.
      order.itemName = data.item.itemName;
      order.itemId = data.item.id;

      order.orderSupplier = data.item.suppliers[0];
      order.orderInvoiceNumber = data.item.orderInvoiceData.orderInvoiceNumber;
      order.orderStatus = 3;
      order.orderType = data.item.itemType;
      order.orderAmount= data.item.orderInvoiceData.orderInvoiceAmount;
      order.amountSupplied= data.item.orderInvoiceData.orderInvoiceAmount;
      order.orderItemSize = data.item.itemSize * data.item.orderInvoiceData.orderInvoiceAmount;
      order.orderDate= data.item.orderInvoiceData.orderInvoiceDate;
      order.orderPrice = data.item.itemPurchaseRate;
      order.save(function(err, i){
        if(err){
          isDone(err);
        }else{
          data.order = i;
          isDone(data);
        }
      });
    }else{
      isDone(data);
    }
  });

  register.once('saveItem', function(data, isDone){
    itemObject.save(function (err, i) {
      if (!err) {
        result = {
          _id: i._id,
          itemName: i.itemName,
          itemCategory: i.itemCategory,
          //Saving this on the stockcount collection
          itemBoilingPoint: data.item.itemBoilingPoint
        };

        data.item.id = i._id;
        isDone(data);

      }else{
        isDone(err);
      }
    });
  });

  register.once('stockCountpre', function(data, isDone){
    //Skip to the next is hasOrder is false;
    if(!hasOrder) return isDone(data);
    // Check if this record has been created for this order using the orderid and the reference field
    // on the StockHistoryShema
    StockCount.count({'reference': 'create-'+data.order._id}, function(err, count){
      if(count > 0){
        isDone(new Error('Invalid Order::old'));
      }else{
        isDone(data);
      }
    });
  });

  register.once('stockHistory', function(data, isDone){
    //Skip to the next if hasOrder is false;
    if(!hasOrder) return isDone(data);
    var itemObj = {
      id: data.item.id,
      amount: data.item.orderInvoiceData.orderInvoiceAmount * data.item.itemSize
    };

    var options = {
      action: 'Stock Up',
      reference: 'create-'+data.order._id
    };

    //Create a stock history record.
    stockHistory.log(itemObj, data.location, options ,function(g){
      data.stock = g;
      isDone(data);
    });
  });

  register.once('stockCountpost', function(data, isDone){
    // Creates a stock count for the item
    // This event stage is very important cause it
    // saves the boiling point on  the stock
    // count collection.
    var stockcount = new StockCount(data.stock);
    stockcount.itemBoilingPoint = data.item.itemBoilingPoint;
    stockcount.item = data.item.id;
    stockcount.locationId = data.location.id;
    stockcount.locationName = data.location.name;
    stockcount.save(function(err){
      if(err){
        isDone(err);
      }else{
        isDone(data);
      }
    });
  });


  register.once('statusUpdate', function(data, isDone){
    //Skip to the next if hasOrder is false;
    if(!hasOrder) return isDone(data);

    //Updates the order statuses, these are useful for order history
    //queries, etc.
    //Creates a new record to show when this order was
    //updated and what action was taken.
    var orderstatus = new OrderStatus();
    orderstatus.status = 2;
    orderstatus.order_id = data.order._id;
    orderstatus.save(function(err){
      if(err){
        isDone(err);
      }else{
        isDone(true);
      }
    });
  });

  register
  .queue('checksort', 'saveItem', 'checkInvoice', 'getMainLocation', 'stockCountpre', 'stockHistory', 'stockCountpost', 'statusUpdate')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(){
    cb(result);
  })
  .start(itemBody);
};



/**
 * List
 */

ItemsObject.prototype.list = function(){
    var q = Q.defer();


    //Some Callback hell, when team comes
    //major code upgrade.. till then, unto
    //the damned to strain eyes
    //
    var options = {
      'fields': 'itemName itemCategory itemBoilingPoint'
    };
    var x, listofItems = [], mainStockLocationId, mainInventory;

    //msc means main stock count, #humorMe
    function mscProcess(){
      if(x === 0){
        return q.resolve(listofItems);
      }
      var _item = mainInventory.pop();

      StockCount.mainStockCount(_item._id, mainStockLocationId, function(stock){
        var it = {
          _id: _item._id,
          itemName: _item.itemName,
          itemBoilingPoint: stock.itemBoilingPoint,
          itemCategory: _item.itemCategory,
          currentStock: (stock === null)? 0 : stock.amount,
        };
        listofItems.push(it);

        if(--x){
          mscProcess();
        }else{
          return q.resolve(listofItems);
        }
      });
    }

    Item.list(options, function(err, r) {
      if (err) return q.reject(err);
      PointLocation.findOne({locationType: 'default'},
        function(err, i){
          if(err){
            return q.reject(err);
          }else{

          mainInventory = r;
          x = r.length;
          mainStockLocationId= i._id;

          /**
           * Gets the current stock for all items in the inventory
           */
          mscProcess();
          }
        });

    });

    return q.promise;
};


/**
 * [listOne Does a summary thingy fetch]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.listOne = function(item, option, location, cb){
  var register = new EventRegister();

  register.once('findItem', function(data, isDone){
    var options = {criteria: {}, fields: {}};
    var reg = /^[0-9a-fA-F]{24}$/;
    if(item){
      if(reg.test(item)){
        options.criteria = {'_id': item};
      }else{
        options.criteria = {'itemName': item};
      }
      if(option === 'quick'){
        //options.fields = " _id itemID itemName sciName manufacturerName itemSupplier.supplierName itemPurchaseRate itemBoilingPoint";
        options.fields = '';
      }
      Item.listOne(options, function(err, r){
        //console.log(itemsResult);
        if (err) return isDone(err);
        if (r) {
          data = r.toJSON();
        }
        isDone(data);
      });
    }
  });
  register.once('findStock', function(data, isDone){
        /**
         * Get the current stock and last order date and
         * add it to the object.
         * Since dispensing is carried out from a stockdown location,
         * we pass in the location object when fetching stock amount
         */
        if(location === 'main' || location === 'Main'){
          //Get Stock count by name
          StockCount.getStockAmountbyName(data._id,{name: 'Main'} ,function(stock){
            // it = {
            //   _id: r._id,
            //   itemID: r.itemID,
            //   itemName: r.itemName,
            //   sciName: r.sciName,
            //   manufacturerName: r.manufacturerName,
            //   itemPurchaseRate: r.itemPurchaseRate,
            //   itemBoilingPoint: r.itemBoilingPoint,
            //   itemForm: r.itemForm,
            //   itemPackaging: r.itemPackaging,
            //   packageSize: r.packageSize,
            //   suppliers : r.suppliers,
            //   currentStock: (stock === null)? 0 : stock.amount,
            //   lastSupplyDate: (stock === null)? '' : stock.lastOrderDate,
            //   nafdacId: r.nafdacId,
            //   nafdacRegNo: r.nafdacRegNo
            // };
            // res.json(200, it);
            data.currentStock =  (stock === null)? 0 : stock.amount;
            data.lastSupplyDate =  (stock === null)? '' : stock.lastOrderDate;
            isDone(data);
          });
        }else{
          //Get stock count by location id
          StockCount.getStockAmountbyId(data._id,{id: location} ,function(stock){
            data.currentStock =  (stock === null)? 0 : stock.amount;
            data.lastSupplyDate =  (stock === null)? '' : stock.lastOrderDate;

            isDone(data);
          });
        }
  });

  register.on('itemCosts', function(data, isDone){
    //get last 3 order prices, itempurchaserate and dspurchase rate
    Order.find({'itemId': data._id,
      $or:[
        {'orderStatus': 2},
        {'orderStatus': 3},
        {'orderStatus': 4},
    ]}, 'orderPrice')
    // .distinct('orderPrice')
    .sort({'orderDate': 1})
    .limit(3)
    .exec(function(err, i){
      if(err){
        isDone(err);
      }else{
        data.orderPrice = (function(){
          var k =  _.map(i, function(v){
            return v.orderPrice;
          });
          k.sort(function(a, b){
            return b-a;
          });
          return k;
        }());
        //Now query the items itemPurchasePrice and DSProductPrice
        Item.findOne({
          _id: data._id
        }, 'itemPurchaseRate dsPurchaseRate')
        .exec(function (err, itemDoc) {
          if (err) {
            isDone(err);
          }
          data.orderPrice.push(itemDoc.itemPurchaseRate);
          data.orderPrice.push(itemDoc.dsPurchaseRate);
          data.orderPrice = _.unique(data.orderPrice);
          isDone(data);
        });
      }
    });

  });


  register
  .queue('findItem', 'findStock', 'itemCosts')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(r){
    cb(r);
  })
  .start({});
};

/**
 * [typeahead description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.typeahead = function(needle, cb){

  //options.criteria[term] = '/'+needle+'/i';
  Item.autocomplete(needle, function(err,itemsResult){
    if (err) {
      cb(err);
    } else {
      cb(itemsResult);
    }
  });
};


/**
 * [nafdacTypeAhead description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.nafdacTypeAhead = function(needle){
  var q = Q.defer();

  //options.criteria[term] = '/'+needle+'/i';
  NafdacDrugsModel.autocomplete(needle, function(err,itemsResult){
    if (err) return q.reject(err);
    q.resolve(itemsResult);
  });

  return q.promise;
};


/**
 * [updateItem description]
 * @param  {String|Object}   itemId [description]
 * @param  {[type]}   body   [description]
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
ItemsObject.prototype.updateItem = function(itemId, body, cb){
  var register = new EventRegister();

  register.once('updateItem', function(data, isDone){
    var category = [], query;
    if (_.isObject(itemId)) {
      query = itemId;
    } else {
      query = {_id: itemId};
    }

    var o = _.omit(data, ['_id', 'itemID']);
    //i think unnecessary
    // if (data.itemCategory) {
    //   _.each(data.itemCategory, function(v){
    //     category.push(v._id);
    //   });
    //   o.itemCategory = category;
    // }

    Item.update(query, {
      $set: o
    }, function(err){
      if(err){
        isDone(err);
      }else{
        isDone(data);
      }
    });
  });

  register.once('updateBP', function(data, isDone){
    //TODO:
    //Update BP code here
    if (data.itemBoilingPoint) {

      var stock = new Stock();
      stock.updateBp(itemId, data.itemBoilingPoint, nconf.get('app:main_stock_id'), function(){
        isDone(data);
      });
    } else {
        isDone(data);

    }

  });

  register
  .queue('updateItem', 'updateBP')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(i){
    cb(i);
  })
  .start(body);

};


ItemsObject.prototype.updateByReg = function(upd){
  _.each(upd, function(v){
    Item.update({nafdacRegNo: v.product_id.regNo}, {
      itemPurchaseRate: v.price
    }, function(err){
      if(err) util.puts(err);
    });
  });
};



/**
 * [itemFields used for querying an item document e.g. when editing / updating an item]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
ItemsObject.prototype.itemFields = function (itemId, body, cb){
  var register = new EventRegister();

  register.once('checknSave', function(data, isDone){
    var options = {criteria: {}, fields: {}};
    var reg = /^[0-9a-fA-F]{24}$/;
    if(itemId.length > 0){
      if(reg.test(itemId)){
        options.criteria = {"_id": itemId};
      }else{
        options.criteria = {"itemName": itemId};
      }

      Item.listOne(options, function(err, r){
        if (err){
          isDone(err);
        }else{
          isDone(r.toJSON());
        }
      });
    }
  });

  register.once('getBP', function(data, isDone){
    StockCount.findOne({
      item: data._id,
      locationId: nconf.get("app:main_stock_id")
    }, function(err, i){
      if(err){
        isDone(err);
      }else if (i) {
        data.itemBoilingPoint = i.itemBoilingPoint;
        isDone(data);
      }else{
        data.itemBoilingPoint = 0;
        isDone(data);
      }
    });
  });

  register
  .queue('checknSave', 'getBP')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(r){
    cb(r);
  })
  .start({});
};

/**
 * [deleteItem description]
 * @param  {Integer}   itemId   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ItemsObject.prototype.deleteItem = function(itemId, callback){
  Item.remove({_id: itemId}, function(err, i){
    if(util.isError(err)){
      callback(err);
      return;
    }
    callback(i);
  });

};

/**
 * [addCategory Adds a new category for items]
 * @param {[type]}   name     [description]
 * @param {[type]}   parent   [description]
 * @param {Function} callback [description]
 */
ItemsObject.prototype.addCategory = function(name, parent, callback){
  if(name.length === 0 ){
    return callback(new Error('Empty name'));
  }
  if(parent.length === 0){
    parent = undefined;
  }
  var ic = new ItemCategory();
  ic.create(name, parent, function(r){
    callback(r);
  });
};

/**
 * [listCategory list out all saved categories]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ItemsObject.prototype.listCategory = function(callback){
  return ItemCategory.list(function(i){
    callback(i);
  });
};


/**
 * [delCat description]
 * @param  {[type]}   cat_id [description]
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
ItemsObject.prototype.delCat = function(cat_id, cb){
  ItemCategory.remove({_id: cat_id, categoryType: 'user'}, function(err, i){
    if(err) return cb(err);
    cb(i);
  });
};

/**
 * [addForm Adds an item form ]
 * @param {[type]}   name     [description]
 * @param {Function} callback [description]
 */
ItemsObject.prototype.addForm = function(name, callback){
  if(name.length === 0 ){
    return callback(new Error('Empty name'));
  }
  var ic = new ItemForm();
  ic.create(name, function(r){
    console.log(r);
    callback(r);
  });
};

/**
 * [listForm List all item forms]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
ItemsObject.prototype.listForm = function(callback){
  return ItemForm.list(function(i){
    callback(i);
  });
};


ItemsObject.prototype.listPackaging = function(callback){
  return ItemPackaging.list(function(i){
    callback(i);
  });
};

ItemsObject.prototype.addPackaging = function(name, callback){
  if(name.length === 0 ){
    return callback(new Error('Empty name'));
  }

  var ic = new ItemPackaging();
  ic.create(name, function(r){
    callback(r);
  });
};

ItemsObject.prototype.fetchByRegNo = function(query, cb){
  NafdacDrugsModel.findOne({
    regNo: query
  }, function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  });
};

ItemsObject.prototype.findRegisteredItem = function findRegisteredItem (query_string, query_options, countOrDoc, cb) {
  var
      queryString = new RegExp(query_string, 'i'),
      result = this.searchResult,
      self = this, method = countOrDoc || 'find';

  var builder = NafdacDrugsModel[method]({
      $or :       [
          {
            'productName' : queryString,
          },
          {
            'composition' : queryString,
          },
          {
           'man_imp_supp' :  queryString
          },
        ]
    });
  builder.limit(query_options.limit);
  builder.skip(query_options.skip);
  builder.exec(function (err, doc) {
    if (err) {
      return cb(err);
    }
    // return q.resolve(doc);
    if (countOrDoc && countOrDoc === 'count') {
      result.totalCount = doc;
      if (cb) {
        cb(result);
      }
      // return q.resolve(result);
    } else {
      result.results = doc;
      self.findRegisteredItem(query_string, query_options, 'count', cb);

    }
  });
};


ItemsObject.prototype.findItem = function findItem (query_string, query_options, countOrDoc, cb) {
  var
    queryString = new RegExp(query_string, 'i'),
    result = this.searchResult,
    self = this, method = countOrDoc || 'find';
  var builder = Item[method]({
      $or :       [
          {
            'manufacturerName' : queryString,
          },
          {
            'sciName' : queryString,
          },
          {
           'itemName' :  queryString
          },
        ]
    });
  builder.limit(query_options.limit);
  builder.skip(query_options.skip);
  builder.exec(function (err, doc) {
    if (err) {
      return cb(err);
    }
    // return q.resolve(doc);
    if (countOrDoc && countOrDoc === 'count') {
      console.log('count query');
      result.totalCount = doc;
      if (cb) {
        cb(result);
      }
      // return q.resolve(result);
    } else {
      console.log('result');
      result.results = doc;
      self.findItem(query_string, query_options, 'count', cb);

    }
  });
};

ItemsObject.prototype.searchInventory = function searchInventory (query) {
  var q = Q.defer();

  Item.findOne(query)
  .exec(function (err, doc) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(doc);
  });
  return q.promise;
};




module.exports = ItemsObject;


