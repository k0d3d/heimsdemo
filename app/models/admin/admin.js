/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var adminSchema = new Schema({
  hospitalId: {type: String},
  access_token: {type: String},
  lastUpdate: {type: Date, default: Date.now},
  accountType: {type: String, default: 'default'},
  facility: {
    name: {type: String},
    address: {type: String},
    city: {type: String},
    state: {type: String},
    service_type: {type: String},
    phone_number: {type: String}
  }
});


mongoose.model('admin', adminSchema);
module.exports  = mongoose.model('admin');