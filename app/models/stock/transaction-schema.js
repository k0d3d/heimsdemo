
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
/**
 * [TransactionSchema description]
 * @type {Schema}
 */
var TransactionSchema = new Schema({
	origin: {type: Schema.ObjectId, ref: 'location'},
	destination: {type: Schema.ObjectId, ref: 'location'},
	item: {type: Schema.ObjectId, ref: 'item'},
	amount: {type: Number},
	recordId: {type: String},
	status: {type: String},
	started: {type: Date, default: Date.now},
	stage:[],
	updated: {type: Date},
	operation: {type: String},
});

mongoose.model('transaction', TransactionSchema);

module.exports = mongoose.model('transaction');