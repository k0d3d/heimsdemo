
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    searchPlugin = require('mongoose-search-plugin'),
    Schema = mongoose.Schema;

/**
 * Item Schema
 */
var ItemSchema = new Schema({
  itemID: {type: Number, default: ''},
  itemType: {type: String, default: ''},
  itemName: {type: String, default: ''},
  sciName: {type: String, default: ''},
  manufacturerName: {type: String},
  itemCategory: [
    {type: String}
  ],
  itemTags: [
    {type: String}
  ],
  itemDescription: {type: String},
  itemPackaging:{type: String},
  itemForm: {type: String},
  itemPurchaseRate: {type: Number},
  dsPurchaseRate: [
    {
      sid: {type: String},
      stype: {type: String},
      price: {type: Number}
    }
  ],
  sellingPrice: {type: Number},
  packageSize: {type: Number},
  itemSize: {type: Number},
  icdcode: {type: String},
  suppliers: [{
    supplierID: {type: Schema.ObjectId},
    supplierName: {type: String},
  }],
  linkedIds : [{type: String}],
  nafdacId: {type: Schema.ObjectId},
  importer: {type: String},
  nafdacRegNo: {type: String},
  sku: {type: String},
  product_id: {type: Number},
  updated_on: {type: Date},
  groupedItems: [{
    itemId: {type: Schema.ObjectId},
    itemName: {type: String}
  }],
  lowNotice: {type: Boolean}
});

var ItemCategorySchema = new Schema({
  categoryName: {type: String, required: true},
  categoryParent: {type: Schema.ObjectId},
  categoryType: {type: String, default: 'system'}
});

var ItemFormSchema = new Schema({
  formName: {type: String, required: true},
  formType: {type: String, default: 'system'}
});

var ItemPackagingSchema = new Schema ({
  packagingName: {type: String, default: ''},
  packagingType: {type: String, default: 'system'}
});

/**
 * Statics
 */

ItemSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb);
  },

  /**
   * List items
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {};
    var fields = options.fields || {};
    this.find(criteria,fields)
    .populate("itemCategory", 'categoryName categoryType categoryParent')
    //.populate("suppliers.supplierID")
    .exec(cb);
  },
  /**
   * List One item
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  listOne: function (options, cb) {
    var criteria = options.criteria || {};
    var fields = options.fields || {};
    this.findOne(criteria,fields)
    .populate("itemCategory")
    .exec(cb);
  },

  /**
  * Auto Complete
  * @param {regex} itemName
  * @param {function} cb
  * @api private
  */
  autocomplete: function(name, cb){
    this.find({$or:[
        {'itemName': {$regex: new RegExp(name, 'i')}},
        {'sciName': {$regex: new RegExp(name, 'i')}}
      ]},'itemName').exec(cb);

  }

};

ItemSchema.plugin(searchPlugin, {
    fields: ['itemName', 'sciName', 'itemCategory', 'itemDescription', 'sku', 'product_id', 'nafdacRegNo']
});


/**
 * ItemCategory Schema Statics
 */
ItemCategorySchema.statics = {
  list: function(callback){
    this.find().exec(function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  },

  delete: function(id, callback){
    this.remove({"_id": id, "categoryType": "user"}, function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  }
};

/**
 * ItemCategory Schema Methods
 */
ItemCategorySchema.methods = {
  create: function(name, parent, callback){
    this.categoryName = name;
    this.categoryType = 'user';
    this.categoryParent = parent;
    this.save(function(err, i){
      console.log(err);
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  }
};

/**
 * ItemForm Schema Statics
 */

ItemFormSchema.statics = {
  list: function(callback){
    this.find().exec(function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  },

  delete: function(id, callback){
    this.remove({"_id": id, "formType": "user"}, function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  }
};

/**
 * ItemForm Methods
 */
ItemFormSchema.methods = {
  create: function(name, callback){
    this.formName = name;
    this.formType = 'user';
    this.save(function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  }
};


/**
 * ItemPackaging Schema
 */
ItemPackagingSchema.statics = {
  list: function(callback){
    this.find().exec(function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  },

  delete: function(id, callback){
    this.remove({"_id": id, "packagingType": "user"}, function(err, i){
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  }
};

/**
 * ItemPackaing Schema Methods
 */
ItemPackagingSchema.methods = {
  create: function(name, callback){
    this.packagingName = name;
    this.packagingType = 'user';
    this.save(function(err, i){
      console.log(err);
      if(err){
        callback(err);
      }else{
        callback(i);
      }
    });
  }
};

mongoose.model('itemForm', ItemFormSchema);
mongoose.model('itemPackaging', ItemPackagingSchema);
mongoose.model('itemCategory', ItemCategorySchema);
mongoose.model('item', ItemSchema);

module.exports.Item = mongoose.model('item');
module.exports.ItemPackaging = mongoose.model('itemPackaging');
module.exports.ItemCategory = mongoose.model('itemCategory');
module.exports.ItemForm = mongoose.model('itemForm');

