var utils = require('util');

module.exports.routes = function(app){
  var SupplierModel = require('../models/supplier');
  var supplierController = new SupplierModel();


  app.get('/suppliers', function(req, res){
    res.render('index',{
      title: 'Suppliers'
    });
  });

  app.get('/suppliers/:supplierId/edit', function(req, res){
    res.render('index',{
      title: 'Edit Suppliers'
    });
  });

  app.get("/api/suppliers/page/:page/limit/:limit", function(req, res, next){
    var options = {
      page: req.params.page || 1,
      limit: req.params.limit
    };
    supplierController.list(options, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json(i);
      }
    });
  });

  //Search for suppliers by name
  app.get('/api/suppliers/search/query', function(req, res, next){
    supplierController.search(req.query, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json(i);
      }
    });
  });

  //Fetch one supplier record
  app.get("/api/suppliers/:supplierId", function(req, res, next){

    supplierController.one(req.params.supplierId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json(i);
      }
    });
  });
  //Fetch one supplier record
  app.get("/api/suppliers/:supplierId/tag", function(req, res, next){

    supplierController.matchByDsId(req.params.supplierId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json(i);
      }
    });
  });


  //Typeahead for suppliers' name
  app.get('/api/supplier/typeahead/term/supplierName/query/:query', function(req, res, next){
    supplierController.typeahead(req.params.query, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json(i);
      }
    });
  });

  //requests to add a new supplier
  app.post('/api/suppliers', function(req, res, next){
    //return next(new Error('lol'));
    supplierController.add(req.body, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json({});
      }

    });
  });

  app.post('/api/suppliers/:supplierId/notify', function(req, res, next){
    supplierController.sendNotice(req.params.supplierId, req.query.type, req.body, function(r){
      if(utils.isError(r)){
        next(r);
      }else{
        res.status(200).json(r);
      }
    });
  });

  app.put('/api/suppliers/:supplierId', function(req, res, next){
    supplierController.update(req.body, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json({});
      }
    });
  });

  app.delete('/api/suppliers/:supplierId', function(req, res, next){
    supplierController.remove(req.params.supplierId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.status(200).json({});
      }
    });
  });


};
