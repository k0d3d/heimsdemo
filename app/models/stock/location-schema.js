
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Stock Down Location Schema
 */
var LocationSchema = new Schema({
  locationId: {type: Number},
  locationName: {type: String},
  locationAuthority:{type: String},
  locationDescription: {type: String},
  locationType: {type: String},
  createdAt: {type: Date, default: Date.now}
});
LocationSchema.statics = {
  /**
  *List All Stock Down Points
  */
  list: function(type, callback){
    this.find()
    .where('locationType', type)
    .exec(callback);
  }
};

mongoose.model('location', LocationSchema);

module.exports = mongoose.model('location');