
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
Schema = mongoose.Schema;

/**
 * Pharmacy Schema
 */
var DispenseSchema = new Schema({
  patientName: {type: String},
  patientId: {type: Number},
  /**
   * this is actually, billing profile.
   * @type {Object}
   */
  billClass: {type: Schema.ObjectId},
  locationId: {type: Schema.ObjectId, ref: 'location'},
  drugs: [{
    itemId: {type: Schema.ObjectId, ref: 'item'},
    itemName: {type: String},
    amount: {type: Number},
    unitQuantity: {type: Number},
    status: {type: String},
    dosage: {type: String},
    period: {type: Number},
    cost: {type: Number},
    dose: {type: String}
  }],
  otherDrugs: [{
    itemName: {type: String},
    amount: {type: Number},
    dosage: {type: String},
    period: {type: Number}
  }],
  doctorId: String,
  doctorName: String,
  issueDate: {type: Date, default: Date.now},
  dispenseDate: {type: Date},
  status: {type: String, default: 'pending'},
  timerId: {type: String}
});



mongoose.model('dispense', DispenseSchema);

module.exports = mongoose.model('dispense');