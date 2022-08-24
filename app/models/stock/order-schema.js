
/**
 * Module dependencies.55F4AD4B
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Orders Schema
 */
var OrderSchema = new Schema({
  orderType: {type: String, default: 'Medical Equipment'},
  itemName: {type: String, default: ''},
  itemId: {type: Schema.ObjectId, ref: 'Item'},
  orderItemSize: {type: Number},
  product_id : {type: Number},
  sku: {type: String},
  nafdacRegNo: {type: String},
  nafdacRegName: {type: String},
  orderAmount: {type: Number, default: '0'},
  orderDate: {type: Date, default: Date.now },
  orderDescription: {type: String, default: 'None'},
  orderSupplier: {
    supplierID: {type: String, default: ''},
    supplierName: {type: String, default: ''},
    dsId: {type: String}
  },
  amountSupplied: {type: Number},
  orderInvoiceNumber: {type: String, default: ''},
  /*
  cancelled: -1
  cart: 0
  pending order: 1
  received: 2
  supplied: 3
  paid: 4
  complete: 5
  returned: 6
   */
  orderStatus: {type: Number, default: 0},
  orderVisibility: {type: Boolean, default: true},
  order_number: {type: String},
  order_group_id: {type: Number},
  orderExpDate: {type: Date},
  orderPrice: {type: Number},
  paymentReferenceType: {type: String},
  paymentReferenceID: {type: String},
  isDrugStocOrder: {type: Boolean, default: false},

});

var OrderStatusSchema = new Schema({
  order_id: {type: Schema.ObjectId},
  date: {type: Date, default: Date.now},
  status: String
});


// OrderSchema.toObject({ getters: true, virtuals: false });

/**
 * Statics
 */

OrderSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec(cb);
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var conditions = options.conditions || {};
    var q = this.find(conditions);
    q.sort({'orderDate':  -1});
    q.exec(cb);
  }
};


mongoose.model('order', OrderSchema);
mongoose.model('orderStatus', OrderStatusSchema);

module.exports.Order = mongoose.model('order');
module.exports.OrderStatus = mongoose.model('orderStatus');
