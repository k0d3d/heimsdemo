/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * User Schema
 */
var UserSchema = new Schema({
    /*
    Mini profile
     */
    first_name: {type: String},
    last_name: {type: String},
    address_1: {type: String},
    address_2: {type: String},
    city: {type: String},
    state: {type: String},
    postcode: {type: String},
    country: {type: String, default: 'NG'},
    phone: {type: String, trim: true},

    customer_id: {type: String},

    company: {type: String},

    photo: {type: String, default: 'prettyme.jpg'},
    /*
    account credentials
     */
    email: {type: String, trim: true, unique: true, sparse: true, required: true},
    username: {type: String},
    password: String,

    type: { type: String, default: 'user' },
    /*
    loggin and audit
     */
    createdOn: { type: Date, default: Date.now },
    lastLoggedInOn: { type: Date},
    enabled: { type: Boolean, default: true },

    consumer_key : {type: String},
    consumer_secret : {type: String},
});

/**
 *  Plugins
 */



/**
 * Validations
 */
var validatePresenceOf = function(value) {
    return value && value.length;
};


/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
    if (!this.isNew) return next();
    if (!validatePresenceOf(this.password))
        next(new Error('Invalid password'));
    else
        next();
});


mongoose.model('user', UserSchema);
module.exports.UserModel = mongoose.model('user');