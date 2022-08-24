

module.exports = function (app, jobQueue) {
  // home route

  var items = require('./controllers/items');
  items.routes(app, jobQueue);
  var orders = require('./controllers/orders');
  orders.routes(app, jobQueue);
  var suppliers = require('./controllers/suppliers');
  suppliers.routes(app);
  var reports = require('./controllers/reports');
  reports.routes(app);
  var dispense = require('./controllers/dispense');
  dispense.routes(app);
  var bills = require('./controllers/bills');
  bills.routes(app);
  var admin = require('./controllers/admin');
  admin.routes(app, jobQueue);
  var stock = require('./controllers/stock');
  stock.routes(app);
  var transaction = require('./controllers/transactions');
  transaction.routes(app);
  var user = require('./controllers/users');
  user.routes(app);
  var hmis = require('./controllers/hmis');
  hmis.routes(app);

  app.get('/', function(req, res){
      res.render('index',{
        title: 'Dashboard'
      });
    }
  );
  app.get('/home/index', function (req, res) {
      res.render('home/index', {
        title: 'Dashboard'
      });
    }
  );
  app.get('/partials/:name', function (req, res) {
      var name = req.params.name;
      res.render('partials/' + name);
    }
  );
  app.get('/templates/:name', function (req, res) {
      var name = req.params.name;
      res.render('templates/' + name, {
        headers: req.headers
      });
    }
  );

  // home route
  app.get('/:parent/:child', function (req, res) {
    var parent = req.params.parent,
        child = req.params.child;
    res.render(parent + '/' + child);
      //res.render('/');
  });

};
