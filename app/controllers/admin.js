
var util = require('util'),
    Admin = require('../models/admin'),
    Order = require('../models/order').order,
    DSItems = require('../models/dsitem');





module.exports.routes = function(app, jobQueue){
  var admin = new Admin(), order = new Order();
  app.get('/admin',function(req, res){
    res.render('index',{
      title: 'Admin Area'
    });
  });

  app.get('/api/admin/updates',  function(req, res, next){
    var dsitem = new DSItems(jobQueue);
    //return  res.json(200,['happu']);
    dsitem.checkProductUpdates()
    .then(function(r){
      order.postOrders()
      .then(function () {
        res.json(r);
      }, function (err) {
        next(err);
      });
    }, function (err) {
      res.status(400).json(err.message);

    });
  });

  app.route('/api/admin/user-profile')
  .get(function (req, res, next) {
    if (!req.cookies.ckey) {
      return res.status(200).json({});
    }
    admin.fetchUser(req.cookies.ckey)
    .then(function (user) {
       if (user) {
        return res.json(user);
       }
       return res.status(404).json();
    }, function (err) {
      next(err);
    });
  })
  .post(function (req, res, next) {
    admin.updateUserProfile(req.cookies.ckey, req.body)
    .then(function (r) {
      res.json(r);
    }, function (err) {
      next(err);
    });
  });

  app.post('/api/admin/update-product-information',  function(req, res){
    var dsitem = new DSItems(jobQueue);
    // dsitem.jobQueue = jobQueue;
    dsitem.refreshProductInformation(req)
    .then(function(r){
        res.json(r);
    }, function (err) {
      res.status(400).json(err);
    });
  });

  app.post('/api/admin/setup', function(req, res, next){
    admin.createMainLocation(function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.delete('/api/admin/reset', function(req, res, next){
    function cb(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, {count: r});
      }
    }
    switch(req.query.aspect){
      case 'items':
        admin.removeAllItems(cb);
        break;
      case 'stock':
        admin.removeAllStockCount(cb);
        break;
      case 'dispense':
        admin.removeAllDispense(cb);
        break;
      case 'bills':
        admin.removeAllBills(cb);
        break;
      case 'billprofiles':
        admin.removeAllBillProfiles(cb);
        break;
      case 'billrules':
        admin.removeAllRules(cb);
        break;
      case 'stockhistory':
        admin.removeAllStockHistory(cb);
        break;
      case 'orders':
        admin.removeAllOrders(cb);
        break;
      case 'orderstatuses':
        admin.removeAllOrderStatus(cb);
        break;
      case 'transactions':
        admin.removeAllTransactions(cb);
        break;
      case 'locations':
        admin.removeAllLocations(cb);
        break;
      default:
        cb(new Error('Can not find the target aspect; reset failed'));
      break;
    }
  });

  app.delete('/api/admin/updates', function(req, res){
    var t = new Date();
    req.session.lastUpdate = t.toJSON();
    res.json(200, true);
  });

  app.post('/admin/session', function(req, res, next){
    var dsitem = new DSItems(jobQueue);

//    return ;
    dsitem.checkConsumerByEmail(req.body)
    .then(function(d){
      if (d.ID) {

        // d.customer_id = d.ID;
        admin.updateUserProfile(d.key, {
          customer_id: d.ID,
          consumer_key: d.key,
          consumer_secret: d.secret,
          email: d.user_email,
          username: d.user_login
        })
        .then(function () {
          res.cookie('ckey', d.key, {
            httpOnly: true,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });
          res.json(true);
        }, function (err) {
          next(err);
        });
      } else {
        next(new Error('failed login'));
      }
    }, function (err) {
      next(err);
    });
  });

  app.delete('/admin/session', function(req, res) {
    if (req.cookies.ckey) {
      res.clearCookie('ckey');
      res.json(true);
    } else {
      res.status(400);
    }
  });
  //Get facility information
  app.get('/api/admin/facility', function (req, res, next) {

  });

  //update facility information
  app.put('/api/admin/facility', function (req, res, next) {

  });

}