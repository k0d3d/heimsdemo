var util = require('util');

module.exports.routes = function(app){
    var TransactionModel = require('../models/transaction');
    var transactionController = new TransactionModel();
    app.get('/api/transactions', function(req, res, next){
        transactionController.getTransactions(function(r){
            if(util.isError(r)){
                next(r);
            }else{
                res.json(200, r);
            }
        });
    });
};