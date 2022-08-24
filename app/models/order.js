var
    Items = require('./item'),
    Order = require('./stock/order-schema').Order,
    DsItems = require('./dsitem'),
    OrderStatus = require('./stock/order-schema').OrderStatus,
    PointLocation = require('./stock/location-schema'),
    Supplier = require('./user/supplier-schema'),
    _ = require('lodash'),
    Q = require('q'),
    EventRegister = require('../../lib/event_register').register,
    StockManager = require('./stock').manager,
    debug = require('debug'),
    utils = require('util');
/**
 * Module dependencies.
 */

function OrderModel (jobQueue) {
  this.jobQueue = jobQueue;
}

OrderModel.prototype.constructor = OrderModel;

OrderModel.prototype.updateTracking = function updateTracking (r) {
  var q = Q.defer();

  Order.update({
    orderStatus: 1,
    orderVisibility: true
  }, {
    $set: {
      orderStatus: 2,
      order_number: r.order_number
    }
  }, {multi: true}, function (err, n) {
    if (err) {
      return q.reject(err);
    }
    q.resolve(n);
    // console.log(err);
    // console.log(n);
  });

  return q.promise;

};

OrderModel.prototype.postOrders = function postOrders (){
    var q = Q.defer();
    var thisOrder = this;

    Order
    .find({
      orderStatus: 1,
      orderVisibility: true
    }, 'itemId product_id itemName orderAmount orderDate orderSupplier nafdacRegNo nafdacRegName')
    .where('isDrugStocOrder', true)
    .populate({
      path: 'itemId',
      model: 'item'
    })
    .exec(function(err, i){
      // var one = JSON.stringify(i);
      if(err){
        return debug(err);
      }else
      if (i.length) {
        var dsItems = new DsItems(thisOrder.jobQueue);

        dsItems.postDSCloudOrders(i)
        .then(function (r) {
          thisOrder.updateTracking(r.order)
          .then(function (n) {
            q.resolve(n);
          });
        }, function (err) {
          console.log(err);
          return q.reject(err);
        })
        .catch(function (err) {
          console.log(err.stack);
          return q.reject(err);
        });
        return;
      } else {
        q.resolve([]);
      }
      return;
    });
    return q.promise;
};


OrderModel.prototype.placeCart = function(cartObj, cb){
  if(_.isEmpty(cartObj)) return cb(new Error('Empty Request'));
  var doneIds = [],
      i = Date.now().toString(),
      order_group_id = i.substring(i.length - 6), selfOrder = this;

  function _create(){
    var item = cartObj.pop();
    var l = cartObj.length;

    Order.update({
      _id: item.orderId,
    }, {
      $set: {
        orderStatus: 1,
        order_group_id: order_group_id
      }
    }, function (err, n) {

      //Check if the object returned is an error
      if(err){
        //if we have some processed results
        //return that
        if(doneIds.length){
          return cb(doneIds);
        }else{
          return cb(n);
        }

      }else{
        //Add another done/placed order
        doneIds.push(item.orderId);
        if(l--){
          _create();
        }else{
          selfOrder.postOrders();
          cb(doneIds);
        }
      }
    });
  }

  _create();
};



/**
 * Create an order
 */
OrderModel.prototype.createOrder = function (orderObj, cb) {
  var selfOrder = this;
  var register = new EventRegister();

  //Checks if an itemId is present in a request.
  //the absence of an itemId creates a new item
  register.once('checkId', function(data, isDone){
    // console.log(data);
    // return isDone(data);
    var isDrugStocOrder = data.isDrugStocOrder;

    if(isDrugStocOrder && !data.itemId){
      //Lets go create a new Item and return its id
      var item = new Items();
      item.create({
        item: data
      }, function(d){
        data.id = d._id;
        isDone(data);
      });
    }else{
      isDone(data);
    }
  });

  register.once('saveOrder', function(data, isDone){

    var order = new Order(data);

    order.save(function (err, newOrder) {
      if (err) {
        isDone(err);
      }

      if (newOrder.orderStatus > 0) {
        selfOrder.postOrders();
      }
      isDone(true);
    });
  });



  register
  .queue('saveOrder')
  // .queue('checkId', 'saveOrder')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(i){
    cb(i);
  })
  .start(orderObj);


};


/**
 * List All Orders
 */

OrderModel.prototype.getOrders = function(req, res){

  var options = {
    conditions: {
      orderVisibility: true,
      orderStatus: {'$ne' : 0}
    }
  };

  Order.list(options, function(err, orders) {
    if (err) return res.render('500');
    res.json(orders);
  });
};


/**
 * List All Cart
 */

OrderModel.prototype.getOrderCart = function getOrderCart (req, res){

  var options = {
    conditions: {
      orderVisibility: true,
      orderStatus : 0
    }
  };

  Order.list(options, function(err, orders) {
    if (err) return res.render('500');
    res.json(orders);
  });
};

/**
 * Updates an order status and creates a stock record
 */

OrderModel.prototype.updateOrder = function(orderbody, orderId, cb){

  var register = new EventRegister();

  //Switch / Conditional Event Queue
  var whatOrder;

  register.once('supplyUpdate', function(data, isDone){
    //Updates the order statuses, these are useful for order history
    //queries, etc

    //Updates the order status
    Order.update({
      '_id':orderId
    },{
      $set: {
        'orderStatus':data.orderbody.orderStatus,
        'orderInvoiceNumber': data.orderbody.orderInvoiceNumber,
        'amountSupplied': data.orderbody.amountSupplied,
      }
    })
    .exec(function(err){
      if(err){
        isDone(err);
      }else{
        isDone(data);
      }

    });
  });

  register.once('paidUpdate', function(data, isDone){
    //Updates the order statuses, these are useful for order history
    //queries, etc

    //Updates the order status
    Order.update({
      '_id':orderId
    },{
      $set: {
        'orderStatus':data.orderbody.orderStatus,
        'paymentReferenceType': data.orderbody.paymentReferenceType,
        'paymentReferenceID': data.orderbody.paymentReferenceID
      }
    })
    .exec(function(err){

      if(err){
        isDone(err);
      }else{
        isDone(data);
      }

    });
  });

  register.once('statusUpdate', function(data, isDone){
    //Creates a new record to show when this order was
    //updated and what action was taken.
    var orderstatus = new OrderStatus();
    orderstatus.status = data.orderbody.status;
    orderstatus.order_id = orderId;
    orderstatus.save(function(err){
      if(err)return isDone(err);
      isDone(data.orderbody.status);
    });
  });

  register.once('supplyOrder', function(data, isDone){
      var stockman = new StockManager();
      //return console.log(stockman);

      //For reference
      data.location.destination.options = {
        action: 'Stock Up',
        reference: 'orders-'+ orderId
      };

      //Since Orders for main stock have no
      //internal source location (they come from the supplier)
      //set this to true to overide our source.
      data.isMain = true;

      var reqObject = [
        {
          id: data.orderbody.itemId,
          itemName: data.orderbody.itemName,
          amount: data.orderbody.amountSupplied * data.orderbody.orderItemSize,
        }
      ];

      //This will handle stocking down
      stockman.stocking(reqObject, data.location, 'order',  function(){
        isDone(data);
      });
  });


  register.once('getMainLocation', function(data, isDone){
    PointLocation.findOne({locationType: 'default'},
      function(err, i){
        if(err){
          isDone(err);
        }else{
          data.location = {
            destination:{
              id: i._id,
              name: i.locationName
            }
          };
          isDone(data);
        }
      });
  });

  //Switch / Conditional Event Queue
  switch(orderbody.orderStatus){
    case 4: //paid
      whatOrder = ['paidUpdate', 'statusUpdate'];
      break;
    case 3: //supplied
      whatOrder = ['getMainLocation', 'supplyOrder', 'supplyUpdate', 'statusUpdate'];
      break;
    default:
      whatOrder = ['statusUpdate'];
      break;
  }

  register
  .queue(whatOrder)
  .onError(function(r){
    cb(r);
  })
  .onEnd(function(r){
    cb(r);
  })
  .start({orderbody: orderbody, orderId: orderId});

};

/**
 * [count description]
 *
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
OrderModel.prototype.count = function(cb){

  //TODO:: Use mongodb agreegators for this
  var register = new EventRegister();

  register.once('doInvoice', function(data, isDone){
    var d = Order.count({orderVisibility: true, orderStatus: 3});
    d.exec(function(err,y){
      if(err){
        cb(err);
      }else{
        data.pendingpayment = y;
        isDone(data);
      }
    });
  });

  register.once('doOrder', function(data, isDone){
    var d = Order.count({orderVisibility: true, orderStatus: 1});
    // d.or([{orderStatus: 'pending order'}, {orderStatus: 'Pending Order'}, {orderStatus: 'PENDING ORDER'}]);
    d.exec(function(err,y){
      if(err){
        cb(err);
      }else{
        data.pendingorders = y;
        isDone(data);
      }
    });
  });

  register
  .queue('doInvoice', 'doOrder')
  .onError(function(err){
    cb(err);
  })
  .onEnd(function(r){
    cb(r);
  })
  .start({'pendingpayment':0,'pendingorders':0});
};

/**
 * [createSupplier description]
 * @method createSupplier
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var createSupplier = function(req,res){

};
/**
 * [allSuppliers description]
 * @method allSuppliers
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var allSuppliers = function(req, res){

};

/**
 * [getSupplier description]
 * @method getSupplier
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var getSupplier = function(req, res){

};

/**
 * [suppliersTypeahead description]
 * @method suppliersTypeahead
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
OrderModel.prototype.suppliersTypeahead = function(req, res){
  Supplier.autocomplete(req.param('query'), function(err, suppliers){
    if (err) return res.render('500');
     res.json(suppliers);
  });
};

/**
 * [removeOrder description]
 * @param  {[type]}   order_id   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
OrderModel.prototype.removeOrder = function(order_id, callback){
  Order.update({_id: order_id}, {
    $set:{
      orderVisibility: false
    }
  }, callback);
};


OrderModel.prototype.isDispatched = function(order){
  var lala = [];
  return false;
  if (!order.length) {
  }
  _.each(order, function(v){
    var orderId = v.order_id.h_order_Id.substr(v.hospitalId.length + 1);
    Order.update({_id: orderId}, {
      orderStatus: 0
    }, function(err){
      if(err){
        utils.puts(err);
      }
    });

    var o = new OrderStatus();
    o.status = 0;
    o.order_id = orderId;
    o.save(function(err){
      if(err){
        utils.puts(err);
      }
    });

  });
};

module.exports.order = OrderModel;