
/**
 * Module dependencies.
 */

var
    Supplier = require('./user/supplier-schema'),
    sendSMS = require('../../lib/smsSend'),
    util = require('util'),
    Admin = require('./admin'),
    _ = require('lodash');



function SupplierModel (){

}

SupplierModel.prototype.constructor = Supplier;

/**
 * [add description]
 * @param {[type]}   supplierData [description]
 * @param {Function} callback     [description]
 */
SupplierModel.prototype.add = function(supplierData, callback){
  if(_.isEmpty(supplierData)){
    return callback(new Error('empty submission'));
  }
  var supplier = new Supplier(supplierData);
  supplier.save(function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [list Gets All the Suppliers]
 * @param  {[type]}   options  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
SupplierModel.prototype.list = function(options, callback){
  var limit = options.limit || 10;
  Supplier
  .find({})
  .limit(limit)
  .skip(options.page * limit)
  .sort({
    supplierName: 1
  })
  .exec(function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [update updates the supplierData]
 * @param  {[type]}   supplierData [description]
 * @param  {Function} callback     [description]
 * @return {[type]}                [description]
 */
SupplierModel.prototype.update = function(supplierData, callback){
  var omitted = _.omit(supplierData, "_id");
  Supplier.update({_id: supplierData._id}, omitted, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [one fetches data on a supplier]
 * @param  {[type]}   supplierId [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
SupplierModel.prototype.one = function(supplierId, callback){
  Supplier.findById(supplierId, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};
/**
 * [one fetches data on a supplier]
 * @param  {[type]}   supplierId [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
SupplierModel.prototype.search = function(query, callback){
  query.limit = 20;
  Supplier.search(query, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [remove remove a supplier]
 * @param  {[type]}   supplier_id [description]
 * @param  {Function} callback    [description]
 * @return {[type]}               [description]
 */
SupplierModel.prototype.remove= function(supplier_id, callback){
  Supplier.remove({"_id": supplier_id}, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [typeahead typeahead functions ]
 * @param  {[type]}   query    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
SupplierModel.prototype.typeahead  = function(query, callback){
  Supplier.autocomplete(query, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

SupplierModel.prototype.sendNotice = function(id, type, order, cb){
  var admin = new Admin();
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
  function get_user_phone_numbers (d) {
    var phones = [];
    if(type === 'sms' && (d.contactPersonPhone || d.phoneNumber)){
      if (d.contactPersonPhone) {
        phones = _.union(phones, d.contactPersonPhone.split(','));
      }

      if (d.phoneNumber) {
        phones = _.union(phones, d.phoneNumber.split(','));
      }
      phones = _.map(phones, function(v){
        return v.trim();
      });

      return phones;
    }

    return(new Error('no phone numbers found'));
  }

  Supplier.findOne({
    _id: id
  }, function(err, i){
    if(err){
      cb(err);
    }else{
      admin.fetchUser('ck_74d23e186250997246f0c198148441d4')
      .then(function (adminUser) {
        var user = returnAddresses(adminUser);
        var msg = util.format('%s %s', user.first_name, user.last_name) + '\n' ;
        msg += util.format('%s',user.address_1) + '\n';
        msg += util.format('%s', user.city) + '\n';

        _.each(order, function (o) {
          msg += util.format('%s-%d', o.itemName, o.orderAmount);
        });
        sendSMS.sendSMS(msg, get_user_phone_numbers(i))
        .then(function () {
          cb(true);
        }, function (err) {
          cb(err);
        });
      });
    }
  });

};


SupplierModel.prototype.matchByDsId = function matchByDsId (dsid, cb) {
  Supplier.findOne({
    'ds_sup.dist_meta_key': dsid
  })
  .exec(function(err, doc) {
    if (err) {
      return cb(err);
    }
    cb(doc);
  })
}
module.exports = SupplierModel;