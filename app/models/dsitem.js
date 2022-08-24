var DsItems = require('./dsitem/dsitem'),
    Items = require('./item'),
    Logger = require('./dsitem/logger'),
    Admin = require('./admin'),
    config = require('config'),
    Q = require('q'),
    moment = require('moment'),
    // OrderController = require('./order').order,
    request = require('request'),
    _ = require('lodash'),
    debug = require('debug')('ddims'),
    util = require('util');

function DSClass (jobQueue) {
  DsItems.setKeywords(function (err) {
    debug(err);
    debug('Indexing DSItems');
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

  this.request = request.defaults(this.requestOptions);

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
  this.searchResult = {};

  function mapImgSrc (img) {
    return img.src;
  }

  function mapProductAttribs (attrs) {
    return {
      'name': attrs.name,
      'options': attrs.options
    };
  }



  var DSC = this;
  jobQueue.on('job enqueue', function(id, type){
    console.log( 'Job %s got queued of type %s', id, type );

  });
  jobQueue.process('save_requested_product_list', 100, function (products, done){
    console.log('adding products to child queue');
    function cb () {
      console.log('added to child queue');
      done();

    }
    /* carry out all the job function here */
    //appends the list of products gotten from the request
    //to  a job queue. which will in turn , for the amount of
    //products in returned from the request (in 'products.data' object/ array)
    //add the  each product to an 'child' job queue (save_one_product) that handles
    //the updates necessary.
    //TODO: use callback before calling done();
    DSC.saveProductUpdates(products.data, products.data.length, 0, cb);
  });

  // process for save_one_product
  jobQueue.process('save_one_product', 100, function (product, done){
    /* carry out all the job function here */
    console.log('processing save_one_product');
    var s = {
      product_id : product.data.id,
      title: product.data.title,
      sku: product.data.sku,
      price: product.data.price,
      regular_price: product.data.regular_price,
      description: product.data.description,
      categories: product.data.categories,
      tags: product.data.tags,
      imagesSrc: _.map(product.data.images, mapImgSrc),
      attributes: _.map(product.data.attributes, mapProductAttribs),
      created_at: product.data.created_at,
      updated_at: product.data.updated_at,
      permalink: product.data.permalink,
      suppliers: _.map(product.data.price_meta, function (v,sid) { return { sid: sid, stype: 'ds', price: v};})
    };

    DsItems.update({
      sku: product.data.sku
    }, s,{
      upsert: true
    }, function (err, didUpdate) {
      console.log('one product upserted ', didUpdate);
      if (err) {
        console.log(err.stack);
        return done(err);
      }
      var item = new Items();
      item.updateItem({
        product_id: s.product_id
      }, {
        dsPurchaseRate: s.suppliers,
        updated_on: Date.now()
      }, function (reslt_err) {
        console.log('processed save_one_product');
        if (util.isError(reslt_err)) {
          console.log(reslt_err.stack);
          return done(reslt_err);
        }

        done();
        // if (didUpdate && done) {
        // }
      });
    });
  });

this.jobQueue = jobQueue;
}

DSClass.prototype.constructor = DSClass;

//drugstocpasword2015*!@

DSClass.prototype.checkConsumerByEmail = function checkConsumerByEmail (deets) {
  var q = Q.defer(), DSC = this;

  request({
    baseUrl: DSC.DS_CLOUD_URL,
    url : DSC.DS_CLOUD_ROUTES.ACTIVE_CONSUMER ,
    method: 'POST',
    // json: true,
    form : {
      'username' : deets.email,
      'password' :deets.password,
      'auth_token': 'jZ.<|xWE%-@)H%cX(d)[?fzVnG,*SV1|V=NofI&v #vl/B[T)B+U!.|0p{a,/l5}'
      }
    },
    function (e, r, body) {
      if (e) {
        return q.reject(e);
      }

      var b = JSON.parse(body);
      // b.consumer_key = deets.key;
      // b.consumer_secret = deets.secret;
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
      'quantity' : o.orderAmount,
      //'meta' :
      'supplier_key': o.orderSupplier.sup,
      'supplier_id': o.orderSupplier.dsId
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

/**
 * creates a job for each item in the products argument.
 * @param  {[type]} products [description]
 * @param  {[type]} count    [description]
 * @param  {[type]} num      [description]
 * @return {[type]}          [description]
 */
DSClass.prototype.saveProductUpdates =   function saveProductUpdates (products, count, num, cb) {
  num = num || 0;
  var jobQueue = this.jobQueue, DSC = this;
  // var cb = arguments[3];
  if (!jobQueue) {
    console.log('unavailable jobQueue');
    cb(new Error('unavailable job queue for process'));
    return;
  }


  //should add chunk processing to job queue
  var job = jobQueue.create('save_one_product', products[num]);
  job.on('complete', function (){
      console.log('Job save_one_product: ', job.id, ' has completed');
  });
  job.on('failed', function (){
      console.log('Job save_one_product: ', job.id, ' has failed');
  });
  job.save(function (err) {
    if (err) {
      console.log(err.stack);
    }
    var next_product = num + 1;

    console.log('saved item: %d', next_product);
    if (products[next_product]) {
      DSC.saveProductUpdates(products, count, next_product, cb);
    } else {
      // this will call the done() function on the jobQueue
      // instance.
      //
      cb();
    }

  });


};

/**
 * creates a job queue for every request made to the Drugstoc
 * server. Each job created is a collection of product objects.
 * For each product object, another job queue is created (DSClass.saveProductUpdates).
 * This handles the actual update of the product.
 * @param  {[type]} page    [description]
 * @param  {[type]} extraQs [description]
 * @param  {[type]} q       A promise that represent the initial promise created when this
 * method is called. This promise should be resolved when all request have been made, or if
 * there are no products to update in the response of an update.
 * @return {[type]}         [description]
 */
DSClass.prototype.runProductUpdateRequest =   function runProductUpdateRequest (page, extraQs, q) {
    var q = q || Q.defer();
    var DSC = this;
    console.log('runProductUpdateRequest');

    DSC.getDsSuppliers();
    return;
    page = page || 0;
    extraQs = extraQs || {};
    var jobQueue = this.jobQueue;

    if (!jobQueue) {
      q.reject(new Error('unavailable job queue for process'));
      return q.promise;
    }

    DSC.request(_.extend(DSC.requestOptions, {
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
          //should add list of products in this request to a processing queue
          var job = jobQueue.create('save_requested_product_list', payload.products);
          job.on('complete', function (){
              console.log('Job save_requested_product_list: ', job.id, ' has completed');
          });
          job.on('failed', function (){
              console.log('Job save_requested_product_list: ', job.id, ' has failed');
          });
          job.save(function (err) {
            if (err) {
              console.log(err.stack);
              q.reject(new Error('update has errors'));
            }
            // q.resolve({jobId: job.id});
            DSC.runProductUpdateRequest(page + 1, extraQs, q);
          });

        } else {

          //do nothing, cause we have no products to
          //update or create. Just log the last request
          //timestamp
          DSC.setLastUpdateLog('PRODUCT')
          .then(function () {
          });
        }
        return q.resolve(true);
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

DSClass.prototype.findDrugstocProduct = function findDrugstocProduct (query_string, query_options, countOrDoc, cb) {
  var
    queryString = new RegExp(query_string, 'i'), self = this,
    result = this.searchResult, builder, method = countOrDoc || 'find';
  // var dsItem = new DsItem();


    builder = DsItems[method]({
      $or :       [
          {
            'title' : queryString,
          },
          {
            'description' : queryString,
          },
          {
           'tags' :  queryString
          },
        ]
    });

  // if (countOrDoc && countOrDoc === 'count') {
  //   builder = DsItems.count({
  //     $or :       [
  //         {
  //           'title' : queryString,
  //         },
  //         {
  //           'description' : queryString,
  //         },
  //         {
  //          'tags' :  queryString
  //         },
  //       ]
  //   });
  // }

  if (!isNaN(query_string)) {
    builder.where('product_id').eq(query_string);
  }
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
      self.findDrugstocProduct(query_string, query_options, 'count', cb);

    }


  });

  // return q.promise;
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

DSClass.prototype.getDsSuppliers = function getDsSuppliers () {
  var q = Q.defer();
  var DSC = this;
  var Supplier = require('./supplier');
  var SupplierModel = require('./user/supplier-schema.js');

  function save_a_supp (sup) {
    if (sup && sup.length) {
      var s_this = sup.pop();
      var sup_data = {
        supplierName: s_this.institution,
        phoneNumber: s_this.phonenumber,
        email: s_this.email,
        // linkedIds: [s_this.username],
        ds_sup: {
          dist_meta_key: s_this.dist_meta_key,
          distributor_id: s_this.id
        }
      };

      SupplierModel.findOne({
        'ds_sup.dist_meta_key': s_this.dist_meta_key
      }, function (err, sup) {
        if (err) {
          console.log(err)
        }
        if (sup && sup._id) {
          _.forEach(sup_data, function (v, key) {
            sup[key] = v;
          });

          if (_.indexOf(sup.linkedIds, s_this.username) === -1) {
            sup.linkedIds.push(s_this.username)
          }

          sup.save(function (err, doc) {
            if (err) {
              console.log(err);
            }
          });
        } else {
          var supplierInstance = new Supplier();
          supplierInstance.add(sup_data, function(d) {
            if (d instanceof Error) {
              console.log(d);
            }
            if (sup.length) {
              save_a_supp(sup);
            }
          });
        }
        if (sup.length) {
          return save_a_supp(sup);
        }
      })


    }
  }

  DSC.request(_.extend(DSC.requestOptions, {
      url : DSC.DS_CLOUD_ROUTES.ALL_SUPPLIERS,
      method: 'GET',
      json: true
      }),
  function (e ,r, body) {

    if (_.isObject(body.suppliers)) {
      save_a_supp(body.suppliers);
    } else {
      //Json parse
      var k = JSON.parse(body);
      save_a_supp(k.suppliers);
    }
  })

  return q.promise;
}
module.exports = DSClass;