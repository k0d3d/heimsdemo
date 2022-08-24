var
    TransactionModel = require('./stock/transaction-schema');



function TransactionModel(){
    this.props = null;
}

TransactionModel.prototype.constructor = TransactionModel;

/**
 * This will start a new transaction session.
 * This method creates an instance of the transaction
 * model and assigns it to the 'transModel'  property on
 * TransactionModel instrance.
 *
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
TransactionModel.prototype.initiate = function(){
    //Holds the new transaction model instaa
    this.transModel = new TransactionModel();
};

/**
* Creates / Saves initial
 * @param  {[type]} stage [description]
 * @return {[type]}       [description]
 */
TransactionModel.prototype.insertRecord = function(request, originLocation, destinationLocation, cb){
    var operation;
    switch(request.action){
    case 'Requested Stock':
        operation = 'add';
        break;
    case 'Dispense':
        operation = 'subtract';
        break;
    case 'Stock Up':
        operation = 'add';
        break;
    default:
        break;
    }
    var self = this;
    self.transModel.origin = (originLocation) ? originLocation.id : undefined;
    self.transModel.destination = (destinationLocation) ? destinationLocation.id : undefined;
    self.transModel.item = request.id;
    self.transModel.operation = operation;
    self.transModel.status = 'initial';
    //The _id on the request object is the ObjectId
    //for the Stock History just created for this
    //transaction
    //self.transModel.historyId = request._id;
    self.transModel.amount = request.amount;
    self.transModel.save(function(err, i){

        if(err){

            //Should log this.
            cb(err);

        }else{
            //Id like to save the current transaction
            //and some other info into a public property
            self.currentTransaction = {
                origin: originLocation,
                destination: destinationLocation,
                id: i._id
            };
            //delete the trans object
            delete self.transModel;
            cb(self.currentTransaction);
        }
    });
};

TransactionModel.prototype.makePending = function(cb){
    TransactionModel.update({
        _id: this.currentTransaction.id
    },{
        $set:{
            status: 'pending',
            updated: Date.now()
        }
    }, function(err){
        if(err){
            cb(err);
        }else{
            cb(true);
        }
    });
};

TransactionModel.prototype.makeCommited = function(cb){
    var self = this;
    TransactionModel.update({
        _id: self.currentTransaction.id
    },{
        $set:{
            status: 'commited',
            updated: Date.now()
        }
    }, function(err){
        if(err){
            cb(err);
        }else{
            cb(true);
        }
    });
};

TransactionModel.prototype.cleanPending = function(dependency, locationId, itemId,  cb){
    var self = this;
    dependency.update({
        locationId: locationId,
        item: itemId
    }, {
        $pull: {pendingTransactions: self.currentTransaction.id}
    }, function(err){
        if(err){
            cb(err);
        }else{
            cb(true);
        }
    });

};

TransactionModel.prototype.makeDone = function(cb){
    var self = this;
    TransactionModel.update({
        _id: self.currentTransaction.id
    },{
        $set:{
            status: 'done',
            updated: Date.now()
        }
    }, function(err){
        if(err){
            cb(err);
        }else{
            cb(true);
        }
    });
};

TransactionModel.prototype.getTransactions = function(cb){
    TransactionModel.find()
    .populate('origin')
    .populate('destination')
    .populate('item')
    .exec(function(err, i){
        if(err){
            cb(err);
        }else{
            cb(i);
        }
    });
};


module.exports = TransactionModel;