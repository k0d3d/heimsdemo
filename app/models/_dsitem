var DsItems = require('./dsitem/dsitem'),
    Items = require('./item'),
    Logger = require('./dsitem/logger'),
    Admin = require('./admin'),
    config = require('config'),
    Q = require('q'),
    moment = require('moment'),
    OrderController = require('./order').order,
    request = require('request'),
    _ = require('lodash'),
    util = require('util');

function DSClass () {
  console.log('Init DSClass');
  DsItems.setKeywords(function (err) {
    console.log(err);
    console.log('Indexing DSItems');
  });
  // this.requestLib = request;
  this.DS_CLOUD_URL = config.api.DS_CLOUD_URL;
  this.DS_CLOUD_ROUTES = config.api.DS_CLOUD_ROUTES;
  this.lastUpdateLog = {};
  this.requestOptions = {
    headers: {
      'Authorization': 'Basic ZHJ1Z3N0b2M6ZHJ1Z3N0b2M='
    },
    baseUrl: this.DS_CLOUD_URL,
    qs : {
    consumer_key : 'ck_74d23e186250997246f0c198148441d4',
    consumer_secret :'cs_f80adcc85109c0611a2a5aedce731df7',
    consumer_email : 'ddadmin@drugstoc.ng',
    'filter[limit]' : config.api.DS_CLOUD_PAGE_LIMIT
    }
  };

  this.getLastUpdateLog = function () {
      var q = Q.defer();

      Logger.findOne()
      .limit(1)
      .sort('-lastUpdateTime')
      .exec(function (err, i) {
        if (err) {
          return q.reject(err);
        }
        if (i) {
          q.resolve(i);
        } else {

          q.resolve({lastUpdateTime: moment().format('YYYY-MM-DD')});
        }
      });
      return q.promise;
  };

  this.setLastUpdateLog = function (scope) {
    var q = Q.defer();

    var logger = new Logger({
      scope: scope
    });

    logger.save(function (err, log) {
        if (err) {
          return q.reject(err);
        }
        return q.resolve(log);
    });
    return q.promise;
  };

  this.DsItemsModel = DsItems;

}

DSClass.prototype.constructor = DSClass;


DSClass.prototype.checkConsumerByEmail = function checkConsumerByEmail (deets) {
  var q = Q.defer(), DSC = this;

  request(_.extend(DSC.requestOptions, {
    url : DSC.DS_CLOUD_ROUTES.ACTIVE_CONSUMER + '/' + deets.email,
    method: 'GET',
    qs : {
      consumer_key : deets.consumer_key,
      consumer_secret :deets.consumer_secret
      }
    }),
    function (e, r, body) {
      if (e) {
        return q.reject(e);
      }

      var b = JSON.parse(body).customer;
      b.consumer_key = deets.consumer_key;
      b.consumer_secret = deets.consumer_secret;
      q.resolve(b);
  });

  return q.promise;
};

DSClass.prototype.postDSCloudOrders = function postDSCloudOrders (orders, extraQs) {
  var q = Q.defer(), DSC = this;
  extraQs = extraQs || {};
  var admin = new Admin();

  function sortOrdersToArray (o) {
    return {
      'product_id' : o.product_id,
      'quantity' : o.orderAmount
    };
  }
  admin.fetchUser('ck_74d23e186250997246f0c198148441d4')
  .then(function (adminUser) {
    function returnAddresses (a) {
      return {
        first_name: a.first_name,
        last_name: a.last_name,
        address_1: a.address_1,
        address_2: a.address_2,
        city: a.city,
        state: a.state,
        postcode: a.postcode,
        country: 'NG',
        phone: a.phone,
      };
    }
    var orderData;
    try {

      orderData = {
        'payment_details': {
          'method_id': 'cod',
          'method_title': 'Cash on Delivery',
          'paid': 'true'
        },
        'billing_address' : returnAddresses(adminUser),
        'shipping_address' : returnAddresses(adminUser),
        'customer_id' : adminUser.customer_id,
        'line_items' : _.map(orders, sortOrdersToArray)
        // 'line_items' : _.map(orders, function (order) {
        //   return {
        //     'product_id' : order.itemData.id.product_id,
        //     'quantity' : order.orderAmount
        //   };
        // })
      };
    } catch (e) {
      console.log(e.stack);
    }
    request(_.extend(DSC.requestOptions, {
      url : extraQs.url || DSC.DS_CLOUD_ROUTES.CREATE_ORDER,
      method: 'POST',
      qs : _.extend(DSC.requestOptions.qs, extraQs.qs),
      body: {order: orderData},
      json: true
      }),
      function (e, r, body) {
        if (e) {
          return q.reject(e);
        }
        if (body.errors) {
          q.reject(body.errors);
        } else {
          if (!body.order.order_number) {
            return q.reject(new Error('failed with unknown errors. NullOrderNumber'));
          }
          q.resolve(body);
        }
    });

  });


  return q.promise;
};

DSClass.prototype.checkUpdates = function(req, cb){
  var r = [];
  var dt = new Date();
  var ld = req.session.lastUpdate || dt.toJSON();
  //var ld = '2013-10-29T16:42:17.158Z';
  var spoken = [];
  var DSC = this;


  function speakPrice (){
    _.each(r[1], function(v){
      spoken.push(
        v.product_id.productName + ' by ' + v.product_id.man_imp_supp + ' updates price to ' + v.price
      );
    });
  }

  function speakOrders () {
    _.each(r[0], function(v){
      spoken.push(
        'Order for ' + v.order_id.orderAmount + ' ' +  v.order_id.nafdacRegName + ' from ' + v.order_id.orderSupplier[0].supplierName + ' is ' + v.status
      );
    });
  }

  function orderCheck(){
    rest.get(DSC.DS_CLOUD_URL + '/api/orders/hospital/1008/updates/' + ld)
    .on('success', function(data){
      if(!_.isEmpty(data)){
        var orders = new OrderController();
        orders.isDispatched(data);
      }
      r.push(data);
      drugCheck(ld);
    })
    .on('error', function(err){
      cb(err);
    })
    .on('fail', function(err){
      cb(err);
    });
  }
  function drugCheck(){
    rest.get(DSC.DS_CLOUD_URL + '/api/drugs/updates/'+ld)
    .on('success', function(data){
      if(!_.isEmpty(data)){
        var ndl = new NDL();
        ndl.priceUpdated(data);
        var items = new Items();
        items.updateByReg(data);
      }
      r.push(data);

      speakPrice();
      speakOrders();

        //Final Callback :: remember to set last update
        req.session.lastUpdate = dt.toJSON();
        cb(spoken);
    })
    .on('error', function(err){
      cb(err);
    })
    .on('fail', function(err){
      cb(err);
    });
  }



  orderCheck();


};

DSClass.prototype.checkProductUpdates = function checkProductUpdates () {
  var q = Q.defer(), DSC = this;


  DSC.getLastUpdateLog()
  .then(function (logObj) {
    DSC.runProductUpdateRequest(0, {
      qs: {'filter[updated_at_min]': logObj.lastUpdateTime}
    })
    .then(function () {
      q.resolve();
    }, function (err) {
      q.reject(err);
    });

  });

  return q.promise;
};

DSClass.prototype.saveProductUpdates =   function saveProductUpdates (products, count, num) {
  var q = Q.defer();
  num = num || 0;

  function mapImgSrc (img) {
    return img.src;
  }

  function mapProductAttribs (attrs) {
    return {
      'name': attrs.name,
      'options': attrs.options
    };
  }

  var s = {
    product_id : products[num].id,
    title: products[num].title,
    sku: products[num].sku,
    price: products[num].price,
    regular_price: products[num].regular_price,
    description: products[num].description,
    categories: products[num].categories,
    tags: products[num].tags,
    imagesSrc: _.map(products[num].images, mapImgSrc),
    attributes: _.map(products[num].attributes, mapProductAttribs),
    created_at: products[num].created_at,
    updated_at: products[num].updated_at,
    permalink: products[num].permalink
  };

  DsItems.update({
    sku: products[num].sku
  },s ,{
    upsert: true
  }, function (err, didUpdate) {
    if (err) {
      console.log(err);
      return q.reject(err);
    }
    var item = new Items();
    item.updateItem({
      product_id: s.product_id
    }, {
      dsPurchaseRate: s.regular_price
    }, function () {
      if (didUpdate && (num < count - 1)) {
        return saveProductUpdates(products, count, num + 1);
      }
      q.resolve(count);
      console.log(num, count, num < count);
    });
  });
  return q.promise;
};

DSClass.prototype.runProductUpdateRequest =   function runProductUpdateRequest (page, extraQs) {
    var q = Q.defer(), DSC = this;
    console.log('runProductUpdateRequest');
    page = page || 0;
    extraQs = extraQs || {};

    request(_.extend(DSC.requestOptions, {
      url : extraQs.url || DSC.DS_CLOUD_ROUTES.ALL_WC_PRODUCTS,
      method: 'GET',
      qs : _.extend(DSC.requestOptions.qs, {page: page}, extraQs.qs)
      }),
      function (e, r, body) {
        if (e) {
          return q.reject(e);
        }
        var payload = JSON.parse(body);

        if (!payload) return q.reject(new Error(util.format('Update Failed: %s', payload)));

        if (!payload.products && payload.errors) return q.reject(payload.errors[0].message);

        if (payload.products.length) {
          console.log(payload.products.length);
          console.log(page);

          DSC.saveProductUpdates(payload.products, payload.products.length);
          DSC.runProductUpdateRequest(page + 1);

          //do nothing
          DSC.setLastUpdateLog('PRODUCT')
          .then(function () {
            return q.resolve(payload.length);
          });

        } else {
          //do nothing
          DSC.setLastUpdateLog('PRODUCT')
          .then(function () {
            return q.resolve(true);
          });
        }
    });
    return q.promise;
  };

DSClass.prototype.refreshProductInformation = function refreshProductInformation () {
  var q = Q.defer(), DSC = this;

  DSC.runProductUpdateRequest()
  .then(function(b){
    q.resolve(b);
  }, function (err) {
    q.reject(err);
  });

  return q.promise;
};

DSClass.prototype.findByNafdacNo = function findByNafdacNo(regNo) {
  var q = Q.defer();

  DsItems.find({
    'attributes.name' : 'Nafdac-no',
    'attributes.options' : regNo
  })
  .exec(function (err, docs) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(docs);
  });

  return q.promise;
};

DSClass.prototype.findDrugstocProduct = function findDrugstocProduct (query_string, query_options) {
  var q = Q.defer();
  // var dsItem = new DsItem();
  DsItems.search(query_string, null, query_options, function (err, data) {
    if (err) {
      return q.reject(err);
    }
    q.resolve(data);
  });
  return q.promise;
};

DSClass.prototype.findDrugstocProductById = function findDrugstocProductById (query_string) {
  var q = Q.defer();
  // var dsItem = new DsItem();

  DsItems.findOne( {
    '_id' : query_string
  })
  .exec(function (err, doc) {
    if (err) {
      return q.reject(err);
    }
    if (!doc) {
      return q.reject(new Error('document not found'));
    }
    q.resolve(doc);
  });

  return q.promise;
};
module.exports = DSClass;