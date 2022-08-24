var
    cors = require('../../config/middlewares/cors'),
    util = require('util');

module.exports.routes = function(app){
  var SC = require('../models/stock').manager;
  var sc = new SC();
  //Stock down view
  app.get('/stock/locations',function(req, res){
    res.render('index',{
      title: 'Stock Down Points'
    });
  });

  //Create a stock down location
  app.post('/api/stock/location', function(req, res, next){
    sc.createLocation(req.body, function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });


  // Process stockdown request
  app.post('/api/stock/stockdown', function(req, res, next){
    // var options = {
    //   action: 'Requested Stock',
    //   reference: 'stockdown-'+ Date.now()
    // };
    var timenow = Date.now();
    var location = {
      origin: {
        id: req.body.location.origin._id,
        name: req.body.location.origin.locationName
      },
      destination: {
        id: req.body.location.destination._id,
        name: req.body.location.destination.locationName
      },
    };
    //Set Options
    location.origin.options = {
      action: util.format('Supplied Stock (%s)', req.body.location.destination.locationName),
      reference: 'stockdown-'+ timenow
    };
    location.destination.options = {
      action: util.format('Requested Stock (%s)', req.body.location.origin.locationName),
      reference: 'stockup-'+timenow
    };
    // quantity sent in should in exact quanity to be deducted from stock
    sc.stocking(req.body.request, location, 'restock', function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(true);
        }
    });
  });

  // Get stock down records for a location
  app.get('/api/stock/location/:locationId', function(req, res, next){
    sc.getStockDown(req.param('locationId'), function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });

  // Edits a stock down record property e.g. name
  app.put('/api/stock/location/:locationId', function(req, res, next){
    sc.updateStockDown(req.param('locationId'), req.body, function(r){
        if(util.isError(r)){
            next(r);
        }else{
            res.json(200, true);
        }
    });
  });



  //Dashboard Count Items
  app.get('/api/stock/count',function(req, res, next){
    sc.count(null, function(l){
      if(util.isError(l)){
        next(l);
      }else{
        res.json(200, {"count": l.totalCount, "low": l.lowCount});
      }

    });
  });

  // get all stock down locations and basic information
  app.get('/api/stock/location', cors, function(req, res, next){
    sc.getAllLocations(req.query.type, function(r){
        if(util.isError(r)){
            next(r);
        }else{
          res.json(200, r);
        }
    });
  });

  //Stock history for an item by location
  app.get('/api/items/:itemId/location/:location/history', function(req, res, next){
    sc.history(req.params.itemId, req.params.location, req.query.date,  function(r){
      if(util.isError(r)){
          next(r);
      }else{
          res.json(200, r);
      }
    });
  });
  //Updates the boiling point of an item on a location
  app.put('/api/items/:itemId/location/:location', function(req, res, next){
    sc.updateBp(req.params.itemId, req.body.bp, req.params.location, function(r){
      if(util.isError(r)){
          next(r);
      }else{
        res.json(200, true);
      }
    });
  });
};