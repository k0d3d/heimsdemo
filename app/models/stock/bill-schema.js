
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Billing Rules Schema
 * rulename is the name given to this rule
 * by specifies if the rule will be applied by percentage or an actual value
 * value is the amount or number to perform the rule with
 * servicename determines what service the rule will be applied to
 * directive specifies if the calculation will increment or decrement the value.
 */
var BillRulesSchema = new Schema({
  name: {type: String},
  by: {type: String},
  value: {type: Number},
  servicename:{type: String},
  serviceid: {type: String},
  servicetype: {type: String},
  directive: {type: String},
});


/**
 * Bills Schema
 */
var BillSchema = new Schema({
  dispenseID: {type: Schema.ObjectId, ref: 'dispense'},
  otherBill : [{
    tag: String,
    amount: Number
  }],
  patientName: String,
  patientId: String,
  billClass: {type: Schema.ObjectId, ref: 'billingProfile'},
  /**
   * a collection of rules to be
   * applied to this bill. The collection
   * is gotten from the billingProfile.
   * @type {Array}
   */
  billrules: [BillRulesSchema],
  billedItems : [{
    item: {type: String},
    cost: {type: Number}
  }],
  billedOn: {type: Date, default: Date.now},
  billCost: {type: Number},
  billPrice: {type: Number},
  amountPaid: {type: Number},
  paymentHistory : [{
    amount: {type: Number},
    date: {type: Date, default: Date.now}
  }]
});

/**
 * Billing Profile Schema
 */
var BillingProfileSchema = new Schema({
  profileName: String,
  rules:[BillRulesSchema]
});

/**
 * Billing Profile Schema statics
 */
BillingProfileSchema.statics = {


  /**
  * Auto Complete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    var wit = this.find({},'profileName');
    wit.regex('profileName',new RegExp(name, 'i')).exec(cb);
  }
};


/**
 * [ServicesSchema description]
 * @type {Schema}
 */
var ServicesSchema = new Schema({
  name: {type: String, unique: true},
  serviceType: {type: String, default: 'user'}
});

ServicesSchema.statics = {


  /**
  * Auto Complete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    var wit = this.find({},'name');
    wit.regex('name',new RegExp(name, 'i'))
    .exec(function(err, i){
      if(err){
        cb(err);
      }else{
        cb(i);
      }
    });
  }
};


mongoose.model('billingProfile', BillingProfileSchema);
mongoose.model('billRule', BillRulesSchema);
mongoose.model('bill', BillSchema);
mongoose.model('billService', ServicesSchema);


module.exports.BillingProfile = mongoose.model('billingProfile');
module.exports.BillRule = mongoose.model('billRule');
module.exports.Bill = mongoose.model('bill');
module.exports.BillService = mongoose.model('billService');