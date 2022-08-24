/*
Module dependencies
 */
var Stock = require('./stock').manager,
    util = require('util');

/*
Reports Class
 */

function ReportController (){

}

ReportController.prototype.constructor = ReportController;

/**
 * [itemBylocation description]
 * @param  {[type]}   item_id    the item id
 * @param  {[type]}   location   the location id being queried
 * @param  {Object}   timePeriod An Object containing the start and end properties of the time period being queried
 * @param  {Function} cb         callback function when complete
 * @return {[type]}              [description]
 */
ReportController.prototype.itemBylocation = function(item_id, location,timePeriod , cb){
  var stock = new Stock();
  stock.history(item_id, location, timePeriod, function(r){
    cb(r);
  });
};

var report = new ReportController();
module.exports.report = ReportController;
/**
 *Report Routes
 */

module.exports.routes = function(app){
  //Move this route to seperate file
  app.get('/reports', function(req, res){
    res.render('index');
  });


  app.get('/reports/bills', function(req, res){
    res.render('index');
  });
  //Reports for locations
  app.get('/reports/stock', function(req, res){
    res.render('index');
  });

  //Lookup all bills
  //app.get('/api/bills', item.getBills); 
  
  app.get('/api/reports/location', function(req, res, next){
    report.itemBylocation(
      req.query._id, 
      req.query.location._id,
      {
        start: req.query.from,
        end: req.query.to
      },
      function(r){
        if(util.isError(r)){
          next(r);
        }else{
          res.json(200, r);
        }
      });
  });
};