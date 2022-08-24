var
    ItemFn = require('../models/item'),
    _ = require('lodash'),
    Ndl = require('../models/nafdac').ndl,
    cors = require('../../config/middlewares/cors'),
    DsItem = require('../models/dsitem'),
    util = require('util');








module.exports.routes = function(app, jobQueue){
  var itemInstance = new ItemFn();
  var dsItems = new DsItem(jobQueue);
  var ndls = new Ndl();

  app.get('/items', function(req, res){
      res.render('index',{
        title: 'All Items'
      });
  });
  app.get('/items/index', function(req, res){
      res.render('items/index');
  });

  app.get('/items/view/low', function(req, res){
    res.render('index');
  });


  //Item routes
  app.get('/items/add',function(req,res){
    res.render('index', {
      title: 'New Inventory Item',
    });
  });

  app.get('/items/:itemId/edit/:action',function(req,res){
    res.render('index', {
      title: 'Update Item',
    });
  });

  app.get('/items/:itemId/ds-add/:action',function(req,res){
    res.render('index', {
      title: 'Update Item',
    });
  });

  /**
  *Items Routes
  */
  //List all Items
  // app.get('/api/items/listAll', itemInstance.list);
  app.get('/api/items/listAll', function (req, res, next) {
    itemInstance.list()
    .then(function (listofItems) {
      res.json(listofItems);
    }, function (err) {
      next(err);
    });
  });

  //app.get('/api/items/listOne/:id/:option',listOne);

  //Fetches data on an item, either full or summary by location
  app.get('/api/items/:id/options/:option/locations/:locationId', cors, function(req, res, next){
    var option = req.params.option, itemId = req.params.id, location = req.params.locationId;
    itemInstance.listOne(itemId, option, location, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.status(200).json(r);
      }
    });
  });

  //Fetches data for an item when editing
  app.get('/api/items/:item_id/edit', function(req, res, next){
    var body = req.body;
    var itemId = req.params.item_id;
    itemInstance.itemFields(itemId, body, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  //Fetches data for an item when editing
  app.get('/api/items/:item_id/ds-product', function(req, res, next){
    var itemId = req.params.item_id;
    dsItems.findDrugstocProductById(itemId)
    .then(function(r){

        res.json(r);
    }, function (err) {
        next(err);
    });
  });

  //Updates an Item
  app.put('/api/items/:id/edit', function(req, res, next){
    var itemId = req.params.id;
    var body = req.body;
    itemInstance.updateItem(itemId, body, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, true);
      }
    });
  });

  //Typeahead Route
  app.get('/api/items/typeahead', cors, function (req, res, next) {
    var needle = req.query.q;
    itemInstance.typeahead(needle, function (r) {
      if (util.isError(r)) {
        next(r);
      } else {
        res.json(200, r);
      }
    });
  });

  //Nafdac Typeahead Route
  app.get('/api/nafdacdrugs', cors,  function(req, res, next){
    var limit = req.query.limit;
    ndls.searchComposition(req.params.needle, req.params.page, limit, function(r){
      if(util.isError(r)){
        next(r);
        return;
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/items/search', function(req, res, next) {
    if (!req.query.scope){
      return res.status(400).json({'message' : 'Invalid Request'});
    }

    if (!req.query.s) {
      return res.status(400).json({'message' : 'Empty Query'});
    }
    var options = {
      limit: req.query.limit || 20
    };
    if (req.query.page) {
      options.skip = req.query.page * options.limit;
    }


    var query = req.query.s;
    // if (!isNaN(query)) {
    //   options.conditions = {product_id: query};
    //   // options.conditions = {'product_id': 4207};
    // }

    if (req.query.scope === 'drugstoc') {
      dsItems.findDrugstocProduct(query, options, null, function (r) {
        res.json(r);
      });
      // .then(function (result) {
      //   res.json(result);
      // }, function (err) {
      //   next(err);
      // });
    }
    if (req.query.scope === 'inventory') {
      itemInstance.findItem(query, options, null, function  (result) {
        res.json(result);
      });
    }
    if (req.query.scope === 'nafdac') {
      itemInstance.findRegisteredItem(query, options, null, function  (result) {
        res.json(result);
      });
    }
    if (req.query.scope === 'checkProduct') {
      itemInstance.searchInventory({product_id: query})
      .then(function (result) {
        res.json(result);
      }, function (err) {
        next(err);
      });
    }


  });

  app.get('/api/nafdacdrugs/typeahead/needle/:needle', function (req, res, next) {
    itemInstance.nafdacTypeAhead(req.param('needle'))
    .then(function (matches) {
      res.json(matches);
    }, function (err) {
      next(err);
    });
  });

  //NAFDAC Fetch item by Registeration Number
  app.get('/api/nafdacdrugs/typeahead', function(req, res, next){
    itemInstance.fetchByRegNo(req.query.q, function(r){
      if(util.isError(r)){
        next(r);
      }else if(_.isEmpty(r)){
        res.json(400, false);
      }else{
        res.json(200, r);
      }
    });
  });

  //Create a new Item
  app.post('/api/items',function(req, res, next){
    itemInstance.create(req.body, function(result){
      if (result instanceof Error) {
        return next(result);
      }
      res.json(true);
    });
  });


  //Delete Item
  app.delete('/api/items/:itemId', function(req, res){
    itemInstance.deleteItem(req.param('itemId'), function(i){
      res.json(200, {state: i});
    });
  });

  //Item Category Routes.///
  app.post('/api/items/category', function(req, res, next){
    itemInstance.addCategory(req.body.name, req.body.parent, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/items/category', function(req, res, next){
    itemInstance.listCategory(function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.delete('/api/items/category/:categoryId', function(req, res, next){
    var catId = req.params.categoryId;
    itemInstance.delCat(catId, function(i){
      if(util.isError(i)){
        next(i);
      }else{
        res.json(200, true);
      }
    });
  });
  //Item Form Routes.///
  app.post('/api/items/form', function(req, res, next){
    itemInstance.addForm(req.body.name, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/items/form', function(req, res, next){
    itemInstance.listForm(function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.delete('/api/items/category/:form_id', function(req, res, next){
    var catId = req.params.form_id;
    itemInstance.removeForm(catId, function(i){
      if(util.isError(i)){
        next(i);
      }else{
        res.json(200, true);
      }
    });
  });
  //Item Packaging Routes.///
  app.post('/api/items/packaging', function(req, res, next){
    itemInstance.addPackaging(req.body.name, function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.get('/api/items/packaging', function(req, res, next){
    itemInstance.listPackaging(function(r){
      if(util.isError(r)){
        next(r);
      }else{
        res.json(200, r);
      }
    });
  });

  app.delete('/api/items/category/:package_id', function(req, res, next){
    var catId = req.params.package_id;
    itemInstance.removePackage(catId, function(i){
      if(util.isError(i)){
        next(i);
      }else{
        res.json(200, true);
      }
    });
  });

  app.get('/api/dsproducts', function (req, res, next) {
    dsItems.findByNafdacNo(req.query.s)
    .then(function (r) {
      res.json(r);
    }, function (err) {
      next(err);
      // res.status(400).json(err.message);
    });
  });

};

