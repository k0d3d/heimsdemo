var utils = require('util'), cors = require ('../../config/middlewares/cors') ;

module.exports.routes = function(app){
  var BillsController= require('../models/bill').bills;
  var bills = new BillsController();

  app.get('/bills',function(req, res){
    res.render('index',{
      title: 'Dispense Drugs'
    });
  });

  //updates a bill
  app.put('/api/bills/:bill_id', function(req, res, next){
    bills.postpay(req.body.amount, req.params.bill_id, function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, true);
        }
    });
  });

  //Fetches all billing profiles
  app.get('/api/bills/profiles', cors, function(req, res, next){

    bills.allProfiles(function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });

  //Fetches one bill to be viewed
  app.get('/api/bills/dispense/:dispense_id', function(req, res, next){
    bills.oneBill(req.params.dispense_id, function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });

  //Fetches all rules entirely
  app.get('/api/bills/rules', function(req, res, next){
    bills.allRules(function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });

  //Fetches all rules attached to a billing profile
  app.get('/api/bills/profiles/:profileId/rules', function(req, res, next){
    bills.profileRules(req.params.profileId, function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });

  //Fetches all billable services for this facility
  app.get('/api/bills/services', function(req, res, next){
    bills.allServices(function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/bills/services/s', function(req, res, next){
    bills.autoCompleteService(req.query.s, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  //Creates a new billable service
  app.post('/api/bills/services', function(req, res, next){
    bills.newService(req.body.name, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  //Creates a new billing profile and attaches it's rules if any provided
  app.post('/api/bills/profiles', function(req, res, next){
    bills.createNewProfile(req.body.name, req.body.rules, function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });

  // //updates a billable service
  // app.put('/api/bills/services/:serviceId', function(req, res, next){
  //   if(utils.isError(r)){
  //       next(r);
  //   }else{
  //       res.json(200, true);
  //   }
  // });


  //Updates a billing profile and it's rules
  app.put('/api/bills/profiles/:profile_id', function(req, res, next){
    bills.updateProfile(req.params.profile_id, req.body.rules, function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, true);
        }
    });
  });

  //Billing profiles typeahead
  app.get('/api/bills/profiles/typeahead/:query', function(req, res, next){
    bills.typeahead(req.params.query, function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, r);
        }
    });
  });

  //Creates a new billing rule
  app.post('/api/bills/rules', function(req, res, next){
    bills.newRule(req.body, function(r){
        if(utils.isError(r)){
            next(r);
        }else{
            res.json(200, true);
        }
    });
  });

  app.delete('/api/bills/services/:serviceId', function(req, res, next){
    bills.deleteService(req.params.serviceId, function(r){
      if(utils.isError(r)){
          next(r);
      }else{
          res.json(200, true);
      }
    });
  });

};