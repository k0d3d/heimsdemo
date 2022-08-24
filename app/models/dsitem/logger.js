/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


var updatelogSchema = new Schema ({

  lastUpdateTime:  {type: Date, default: Date.now},
  logID: {type: String},
  scope: {type: String},
  /**
   * 1: Requesting
   * 2: Success
   * 3: Processing
   * 4: Processed
   * 5: Failed
   * 6: Error
   * @type {Object}
   */
  state: {type: Boolean}

});


mongoose.model('updatelog', updatelogSchema);
module.exports  = mongoose.model('updatelog');