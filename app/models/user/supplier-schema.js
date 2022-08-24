
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var SuppliersSchema = new Schema({
  supplierName: String,
  phoneNumber: String,
  email: String,
  address: String,
  otherContact: String,
  contactPerson: String,
  contactPersonPhone: String,
  daysSupply: String,
  daysPayment: String,
  addedOn: {type: Date, default: Date.now},
  linkedIds: [{type: String}],
  ds_sup: {
    dist_meta_key: {type: String},
    distributor_id: {type: String}
  }
});

/**
 * [statics SupplierSchema]
 * @type {Object}
 */
SuppliersSchema.statics = {
  /**
  * Auto Complete
  * @function autocomplete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    console.log(name);
    var wit = this.find({});
    wit.regex('supplierName',new RegExp(name, 'i'))
    .limit(10)
    .exec(cb);

  },
  search: function(query, cb){
    console.log(query);
    var wit = this.find({});
    if(query.name){
      wit.regex('supplierName',new RegExp(query.name, 'i'));
    }
    if(query.limit){
      wit.limit(query.limit);
    }
    wit.exec(cb);

  }
};
mongoose.model('supplier', SuppliersSchema);

module.exports = mongoose.model('supplier');