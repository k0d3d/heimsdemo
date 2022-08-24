var cors = require ('../../config/middlewares/cors'),
    util = require ('util');

module.exports.routes = function(app){
  var DispenseController = require('../models/dispense').dispense;
  var dispense = new DispenseController();

  app.get('/dispensary',function(req, res){
    res.render('index',{
      title: 'Dispense Drugs'
    });
  });
  app.get('/dispensary/:dispense_id',function(req, res){
    res.render('index',{
      title: 'Dispense Drugs'
    });
  });

  //Gets a prescription record by locationId
  app.get('/api/items/locations/records/status/:status', dispense.getDispenseRecord);

  app.get('/api/items/prescribe/:prescribeId', function(req, res, next){
    dispense.getPrescription(req.params.prescribeId, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  //Creates a new record for a prescription
  app.post('/api/items/prescribe',cors,  function(req, res, next){
    var o = {
      location: {
        id: req.body.location.locationId,
        name: req.body.location.locationName,
        authority: req.body.location.locationAuthority
      },
      patientName : req.body.patientName,
      patientId:  req.body.patientId,
      doctorId: req.body.doctorId,
      doctorName: req.body.doctorName,
      drugs: req.body.drugs,
      otherDrugs: req.body.otherDrugs,
      class: req.body.class
    };
    dispense.prescribeThis(o, function(r){

      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  //Creates a new record for a prescription
  app.post('/api/items/dispense', function(req, res, next){
    var o = req.body;
    dispense.dispenseThis(o, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, true);
      }
    });
  });

  //Updates a presciption record to show its been dispensed
  app.put('/api/items/dispense', function(req, res, next){
    dispense.dispenseThis(o, function(r){

    });
  });
};