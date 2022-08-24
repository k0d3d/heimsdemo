/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    searchPlugin = require('mongoose-search-plugin'),
    Schema = mongoose.Schema;


var NafdacdrugSchema = new Schema ({
  productName : {type: String},
  composition : {type: String},
  regNo : {type: String},
  man_imp_supp : {type: String},
  mis_address : {type: String},
  mis_regDate : {type: String},
  mis_expDate : {type: String},
  category : {type: String},
  onlineId: {type: Schema.ObjectId},
  currentPrice:{type: Number},
  lastUpdated: {type: Date}
});


NafdacdrugSchema.statics = {
  /**
  * Auto Complete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    // var wit = this.find({}).limit(20);
    // wit.or([
    //   {'productName': {$regex: new RegExp(name, 'i')}},
    //   {'composition': {$regex: new RegExp(name, 'i')}}
    // ])
    // .exec(cb);
    var wit = this.find({});
    wit.regex('productName',new RegExp(name, 'i')).exec(cb);
  }
};

NafdacdrugSchema.plugin(searchPlugin, {
    fields: ['productName', 'composition', 'regNo']
});

mongoose.model('nafdacdrug', NafdacdrugSchema);
module.exports = mongoose.model('nafdacdrug');
