var
  AdminModel = require('../app/models/admin');


module.exports = function(){
  var adminModel = new AdminModel();
  adminModel.findOrCreateMainStockLocation()
  .then(function (l) {
    console.log('Boot complete');
  });

};