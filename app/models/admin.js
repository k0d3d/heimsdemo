var
    // Items = require('./item').Item,
    // OrderModel = require('./order').Order,
    // OrderStatus = require('./order').OrderStatus,
    // Dispense = require('./stock/dispense-schema'),
    // Bills = require('./stock/bill-schema').Bill,
    // BillRules = require('./stock/bill-schema').BillRule,
    // BillingProfile = require('./stock/bill-schema').BillingProfile,
    PointLocation = require('./stock/location-schema'),
    // StockHistory = require('./stock/stockhistory-schema'),
    // StockCount = require('./stock/stockcount-schema'),
    // Transactions = require('./stock/transaction-schema'),
    UserModel = require('./user/user-schema').UserModel,
    _ = require('lodash'),
    Q = require('q');

function AdminMethods () {

}

AdminMethods.prototype.constructor = AdminMethods;



AdminMethods.prototype.findOrCreateMainStockLocation = function findOrCreateMainStockLocation (){
  var q = Q.defer();

  //Check for a default location
  PointLocation.findOne({
    locationType: 'default'
  }, function(err, i){
    if (err) {
      return q.reject(err);
    }
    if(i){
      q.resolve(i);
    }else{
      //Create a default loaction
      var pl = new PointLocation();
      pl.locationName =  'Main';
      pl.locationType = 'default';
      pl.locationDescription = 'Main Stock Location';
      pl.save(function(err, i){
        if (err) {
          return q.reject(err);
        }
        q.resolve(i);
      });
    }
  });

  return q.promise;
};

AdminMethods.prototype.fetchUser = function fetchUser (csKey) {
  var q = Q.defer();


    UserModel.findOne({
      consumer_key: csKey
    })
    .exec(function (err, user) {
      if (err) {
        return q.reject(err);
      }
      if (user) {
        var u = user.toObject();
        u.isLoggedIn = true;
        q.resolve(_.omit(u, ['consumer_key', 'consumer_secret']));
      } else {
        q.reject(new Error('User not found'));
      }
    });

  return q.promise;
};


AdminMethods.prototype.updateUserProfile = function updateUserProfile (csKey, user) {
  var q = Q.defer();
  UserModel.update({
    consumer_key : csKey
  }, user,
  {upsert: true},
  function (err, done) {
    if (err) {
      return q.reject(err);
    }
    return q.resolve(done);
  });
  return q.promise;
};

module.exports = AdminMethods;