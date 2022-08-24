
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
/**
 * Item Schema
 */
var StockHistorySchema = new Schema({
  item: {type: Schema.ObjectId, ref: 'item'},
  locationId: {type: Schema.ObjectId, ref: 'location'},
  locationName: String,
  date: {type: Date, default: Date.now},
  amount: {type: Number, min: 0},
  action: String,
  reference: {type: String, unique: true},
  visible: {type: Number, default: 1},
  transactionId: {type: Schema.ObjectId}
});


StockHistorySchema.methods = {
  /**
   * [augumentStock adds or removes stock from ]
   * @param  {[type]}   list     [description]
   * @param  {[type]}   location [description]
   * @param  {[type]}   others   [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  log: function log(itemObj, location, others, callback){
    this.item = itemObj.id;
    this.locationId = location.id || location._id;
    this.locationName = location.name || location.locationName;
    this.amount = itemObj.amount;
    this.action = others.action;
    this.reference = others.reference;
    this.transactionId = others.transactionId;
    this.save(function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i.toJSON());
      }
    });
  }
};

StockHistorySchema.statics = {
  /**
   * [lookUp description]
   * @param  {[type]}   id       [description]
   * @param  {[type]}   location [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  lookUp: function lookUp(id, locationId, callback){
    var q = this.findOne({item: id, locationId: locationId});
    q.sort({date: -1});
    q.limit(1);
    q.exec(function(err, i){
      console.log(i);
      callback(i);
    });
  }
};



mongoose.model('stockHistory', StockHistorySchema);

module.exports = mongoose.model('stockHistory');