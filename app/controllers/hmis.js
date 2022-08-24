// HMIS Plug and Play Integration
// ------------------------------


// This document explains how RESTful request
// can be made to DIMS to carry out inventory
// specific operations like ordering and item
// querying. DIMS HTTP server runs on port 8888.
//
var util = require('util'),
    request = require('request'),
    apiConfig = require('config').api,
    Q = require('q'),
    _ = require('lodash'),
    Items = require('../models/item/item-schema').Item,
    Supplier = require('../models/user/supplier-schema');





module.exports.routes = function(app){


  function createOrUpdateItem (items, ref) {
    var q = Q.defer();
    var item = items.pop();
    var allerrs = [];

    Items.findOne({
      linkedIds: item[ref]
    }, function (err, doc) {
      if (err) {
        allerrs.push(err);
      }
      if (doc) {
        if (doc.linkedIds.length) {
          if (_.indexOf(doc.linkedIds, item[ref]) === -1) {
            doc.itemName = item.itemname;
            doc.itemPurchaseRate = item.unitcost;
            doc.itemSize = item.unitquantity;
            doc.linkedIds.push(item[ref]);
            doc.save(function (err) {
               if (err) {
                allerrs.push(err);
               }
            });
          }
        }
      } else {
        var new_item = new Items();
        new_item.linkedIds.push(item[ref]);
        new_item.itemName = item.itemname;
        doc.itemPurchaseRate = item.unitcost;
        doc.itemSize = item.unitquantity;
        new_item.save(function (err) {
          if (err) {
            allerrs.push(err);
          }
        });
      }
      if (items.length) {
        createOrUpdateItem(items, ref);
      } else {
        q.resolve(true);
      }
    });

    return q.promise;
  }


  function createOrUpdateSupplier (sups, ref) {
    var q = Q.defer();
    var item = sups.pop();
    var allerrs = [];

    Supplier.findOne({
      linkedIds: item[ref]
    }, function (err, doc) {
      if (err) {
        allerrs.push(err);
      }
      if (doc) {
        if (doc.linkedIds.length) {
          if (_.indexOf(doc.linkedIds, item[ref]) === -1) {
            doc.supplierName = item.suppliername;
            doc.phoneNumber = item.contactphone;
            doc.email = item.emailaddress;
            doc.address = item.contactaddress;
            doc.contactPerson = item.contactperson;
            doc.linkedIds.push(item[ref]);
            doc.save(function (err) {
               if (err) {
                allerrs.push(err);
               }
            });
          }
        }
      } else {
        var new_item = new Supplier();
        new_item.linkedIds.push(item[ref]);
        new_item.supplierName = item.suppliername;
        new_item.phoneNumber = item.contactphone;
        new_item.email = item.emailaddress;
        new_item.address = item.contactaddress;
        new_item.contactPerson = item.contactperson;
        new_item.save(function (err) {
          if (err) {
            allerrs.push(err);
          }
        });
      }
      if (sups.length) {
        createOrUpdateItem(sups, ref);
      } else {
        q.resolve(true);
      }
    });

    return q.promise;
  }


  app.get('/hmisdemo/items', function (req, res) {
    res.json({'items':[
      {'itemcode':'PAC01', 'itemname':'PANADOL', 'unitquantity':'12', 'unitcost':'300'},
      {'itemcode':'PAC02', 'itemname':'PANADOL', 'unitquantity':'12', 'unitcost':'300'},
      {'itemcode':'PAC03', 'itemname':'PANADOL', 'unitquantity':'12', 'unitcost':'300'}
    ]});
  });
  app.get('/hmisdemo/suppliers', function (req, res) {
    res.json({'suppliers':[
{'suppliername':'ADFEM1', 'contactphone':'098888888', 'contactaddress':'12 ,layoutdrive , lagos', 'emailaddress':'adfem1@yahoo.com', 'contactperson':'OLUMIDE OLUFEMI'},
{'suppliername':'ADFEM2', 'contactphone':'098888888', 'contactaddress':'12 ,layoutdrive , lagos', 'emailaddress':'adfem2@yahoo.com', 'contactperson':'OLUMIDE OLUFEMI'},
{'suppliername':'ADFEM3', 'contactphone':'098888888', 'contactaddress':'12 ,layoutdrive , lagos', 'emailaddress':'adfem3@yahoo.com', 'contactperson':'OLUMIDE OLUFEMI'}
]});
  });

  //get all items from the hmis system.
  //TODO: add a date or timestamp parameter
  //to query for items added after a specific date.
  //this way, a large payload is avoided after a
  //major or initial pull request
  //This route expects the a GET request which must contain a
  //ref query parameter where the value of 'ref' is the a string
  //which is stored as an element of the linkedIds array
  //on DIMS item-schema that matches an item on DIMS to an item
  //on the HMIS. eg
  //
  //`var ItemSchema = new Schema({
  //   itemID: {type: Number, default: ''},
  //   itemType: {type: String, default: ''},
  //   itemName: {type: String, default: ''},
  //   sciName: {type: String, default: ''},
  //   itemCategory: [
  //     {type: String}
  //   ],
  //   linkedIds : [{**itemcode**}],
  // });`
  //
  //By default, the JSON response for this request is an array of items.
  //If your response is wrapped as the value of a property eg. {items: [{Object}, {Object}]},
  //you need to supply a query parameter called wrap where its value is the name of the
  //the property containg the array of items requested e.g '?wrap = items'.
  app.get('/hmis/items', function (req, res, next) {
    if (!req.query.ref) {
      return res.status(400).json({
        error: 1,
        message: 'Reference value is absent.',
        tip: 'Your query should contain a "ref=??" eg. http://dims:8888?ref=itemCode'
      });
    }
    request({
      baseUrl: apiConfig.HMIS_URL,
      url :  apiConfig.HMIS_ROUTES.ALL_ITEMS,
      method: 'GET'
      },
      function (e, r, body) {
        if (e) {
          return next(e);
        }

        var b = JSON.parse(body);
        if (req.query.wrap) {
          if (!req.query.wrap.length) {
            return res.status(400).json({
              error: 1,
              message: 'Empty value for "wrap"',
              tip: 'Provide a value for "wrap" or remove it'
            });
          }
          b = b[req.query.wrap];
        }
        if (b && b.length) {
          var itemsCount = b.length;
          createOrUpdateItem(b, req.query.ref)
          .then(function (done) {
            if (done) {
              return res.json({no: itemsCount});
            }
          }, function (err) {
            return next(err);
          });
        } else {
          res.status(400).json({
            error: 1,
            message: 'Request expects a Array-like response',
            tip: 'Respond with array of objects [{object}, {Object}]'
          });
        }

    });
  });

  //get all suppliers from the hmis system
  //TODO: the same date parameter should be passed
  //along with query.
  app.get('/hmis/suppliers', function (req, res, next) {
    if (!req.query.ref) {
      return res.status(400).json({
        error: 1,
        message: 'Reference value is absent.',
        tip: 'Your query should contain a "ref=??" eg. http://dims:8888?ref=supplierId'
      });
    }

    request({
      baseUrl: apiConfig.HMIS_URL,
      url :  apiConfig.HMIS_ROUTES.ALL_SUPPLIERS,
      method: 'GET'
      }, function (e, r, body) {
        if (e) {
          return next(e);
        }

        var b = JSON.parse(body);
        if (req.query.wrap) {
          if (!req.query.wrap.length) {
            return res.status(400).json({
              error: 1,
              message: 'Empty value for "wrap"',
              tip: 'Provide a value for "wrap" or remove it'
            });
          }
          b = b[req.query.wrap];
        }
        if (b && b.length) {
          var suplCount = b.length;
          createOrUpdateSupplier(b, req.query.ref)
          .then(function (done) {
            if (done) {
              return res.json({no: suplCount});
            }
          }, function (err) {
            return next(err);
          });
        } else {
          res.status(400).json({
            error: 1,
            message: 'Request expects a Array-like response',
            tip: 'Respond with array of objects [{object}, {Object}]'
          });
        }
    });
  });

  //dummy routes to test data
  //
  //items
  //suppliers
  //low items


};