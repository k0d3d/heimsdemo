var utils = require('util');

module.exports.routes = function(app, jobQueue){
  var Orders = require('../models/order').order;
  var orders = new Orders(jobQueue);
  var ndls = require('../models/nafdac').ndl;

  app.get('/dashboard/order', function(req, res){
      res.render('index',{
        title: 'Place new order'
      });
    }
  );
  app.get('/dashboard/order/:id', function(req, res){
      res.render('index',{
        title: 'Place new order'
      });
    }
  );

  app.get('/orders', function(req, res){
      res.render('index',{
        title: 'All orders'
      });
    }
  );

  app.get('/orders/pending/:type', function(req, res){
      res.render('index',{
        title: 'All orders'
      });
    }
  );
  app.get('/dashboard/orders/cart', function(req, res){
      res.render('index',{
        title: 'Order Cart'
      });
    }
  );
  //Order  GET routes
  app.get('/api/orders',orders.getOrders);
  app.get('/api/cart',orders.getOrderCart);
  app.get('/api/orders/count', function(req, res, next){
    orders.count(function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(r);
      }
    });
  });
  // app.get('/api/orders/supplier', orders.allSuppliers);
  // app.get('/api/orders/supplier/:id', orders.getSupplier);
  app.get('/api/orders/supplier/typeahead/:query', orders.suppliersTypeahead);

  // Order POST Routes
  app.post('/api/orders', function(req, res,next){
    orders.createOrder(req.body, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(true);
      }
    });
  });
  // Order POST Routes
  app.post('/api/orders/cart', function(req, res,next){
    orders.placeCart(req.body, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(r);
      }
    });
  });
  //app.post('/api/orders/supplier', orders.createSupplier);

  //Order PUT Routes
  app.put('/api/orders/:orderId', function(req, res, next){
    var orderbody = req.body;
    var orderId = req.params.orderId;

    orders.updateOrder(orderbody, orderId, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json({"task": true, "result": r});
      }
    });
  });

  //Delete Order (logically)
  app.delete('/api/orders/:order_id', function(req, res, next){
    orders.removeOrder(req.param('order_id'), function(err){
      if(utils.isError(err)){
        next(err);
        return;
      }else{
        res.json({state: 1});
      }
    });
  });

  //Search for nafdac reg drugs by composition
  app.get('/api/orders/ndl/:needle/composition/:page', function(req, res, next){
    var limit = req.query.limit || 10;
    ndls.searchComposition(req.params.needle, req.params.page, limit, function(r){
      if(utils.isError(r)){
        next(r);
        return;
      }else{
        res.json(r);
      }
    });
  });

  //Search for nafdac reg drugs by category
  app.get('/api/orders/ndl/:needle/category/:page', function(req, res, next){
    ndls.searchCategory(req.params.needle, req.params.page, function(r){
      if(utils.isError(r)){
        next(r);
        return;
      }else{
        res.json(r);
      }
    });
  });
  //Search for nafdac reg drugs by category
  app.get('/api/orders/ndl/:drugId/summary', function(req, res, next){
    ndls.summary(req.params.drugId, function(r){
      if(utils.isError(r)){
        next(r);
        return;
      }else{
        res.json(r);
      }
    });
  });
};