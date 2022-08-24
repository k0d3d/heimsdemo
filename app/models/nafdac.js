/**
 * Module Dependencies
 */
var Ndl = require('./item/nafdacdrugs'),
    _ = require('underscore'),
    util = require('util');

function NdlController () {

}

NdlController.prototype.constructor = NdlController;

/**
 * [searchComposition Searches list by drug composition]
 * @param  {[type]}   string   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
NdlController.prototype.searchComposition = function (string, page, limit, callback) {
  var wit = Ndl.find({}, 'productName composition category currentPrice');
  wit.regex('composition',
    new RegExp(string, 'i')
  )
  .limit(limit)
  .skip(page * limit)
  .exec(function (err, i) {
    if (err) {
      callback(err);
    } else {
      callback(i);
    }
  });
};

/**
 * [searchCategory Searches list by drug category]
 * @param  {[type]}   string   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
NdlController.prototype.searchCategory = function(catString, page, callback) {
  Ndl.find({
    category: catString
  },
    'productName composition category currentPrice'
  )
  .limit(10)
  .skip(page * 10)
  .exec(function(err, i){
    if(err){
      callback(err);
    } else {
      callback(i);
    }
  });
};

/**
 * [summary fetches ndl info]
 * @param  {[type]}   id       [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
NdlController.prototype.summary = function (id, callback) {
  Ndl.findOne({ _id : id})
  .exec(function (err, i) {
    if(err){
      callback(err);
    } else {
      callback(i);
    }
  });
};

NdlController.prototype.priceUpdated = function (data) {
  return true;
  _.each(data, function(v){
    Ndl.update({regNo : v.product_id.regNo},{
      currentPrice: v.price,
      lastUpdated: v.lastUpdated
    }, function(err){
      if(err) util.puts(err);
    });

  });
};


module.exports.ndl = NdlController;
//var ndls = new NdlController();
