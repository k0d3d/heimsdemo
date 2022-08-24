/*
Module Dependencies
 */
var
    Bill = require('./stock/bill-schema').Bill,
    BillRules = require('./stock/bill-schema').BillRule,
    BillingProfile = require('./stock/bill-schema').BillingProfile,
    BillService = require('./stock/bill-schema').BillService,
    lingua = require('lingua'),
    _ = require('lodash');



function BillsController (){
    this.figure = 0;
}

BillsController.prototype.constructor =  BillsController;

/**
 * [newRule Creates a new billing rule]
 * @param  {[type]}   rule     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
BillsController.prototype.newRule = function(rule, callback){
    if(_.isEmpty(rule)) return callback(new Error('Empty Request'));
    var _r = _.omit(rule, 'reference');
    var b = new BillRules(_r);
    b.servicename = rule.reference.name;
    b.servicetype = rule.reference.type;
    b.serviceid =  rule.reference.id || 0;
    b.save(function(err, i){
        if(err){
            callback(err);
        }else{
            callback(i);
        }
    });
};

/**
 * [allRules fetch all billing rules]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
BillsController.prototype.allRules = function(callback){
    BillRules.find({}, function(err, foundBills){
        if(err){
            callback(err);
        }else{
            var p = [];
            _.each(foundBills, function(v){
                p.push({
                    _id: v._id,
                    by: v.by,
                    directive: v.directive,
                    name: v.name,
                    serviceid: v.serviceid,
                    servicename: v.servicename,
                    servicetype: v.servicetype,
                    value: v.value
                });
            });
            callback(p);
        }
    });
};


BillsController.prototype.getRule = function(){

};

/**
 * [createNewProfile Creates a new profile, and saves all the attached rules]
 * @param  {[type]}   name  [description]
 * @param  {[type]}   rules  [Rules to be attached to this profile]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
BillsController.prototype.createNewProfile = function(name, rules, callback){
    var p = new BillingProfile();
    if(_.isEmpty(name)) return callback(new Error('Empty Request'));
    if(!_.isEmpty(rules)){
        p.rules = rules;
    }
    p.profileName = name;
    p.save(function(err, i){
        if(err){
            callback(err);
        }else{
            callback(i);
        }
    });
};

/**
 * [updateProfile Updates a billing profile and the list of rules]
 * @param  {[type]}   prodile_id [description]
 * @param  {[type]}   rules      [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
BillsController.prototype.updateProfile = function(profile_id, rules, callback){
  var o =[];
  _.each(rules, function(v){
    o.push({
        _id: v._id,
        by: v.by,
        directive: v.directive,
        name: v.name,
        serviceid: v.serviceid,
        servicename: v.servicename,
        servicetype: v.servicetype,
        value: v.value
    });
  });
  BillingProfile.update({_id: profile_id},{
    $set:{
      rules: o
    }
  }, function(err, i){
    if(err){
        callback(err);
    }else{
        callback(i);
    }
  });
};

/**
 * [removeProfile removes the billing profile and its contained rules]
 * @param  {[type]}   profileId [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
BillsController.prototype.removeProfile = function(profileId, callback){
    BillingProfile.remove({_id: profileId}, function(err, i){
        if(err){
            callback(err);
        }else{
            callback(i);
        }
    });
};

BillsController.prototype.addRule = function(rules, profileId, callback){
    BillingProfile.update({_id: profileId}, {
        $push: {
            rules: {
                $each: rules
            }
        }
    }, function(err, i){
        if(err){
            callback(err);
        }else{
            callback(i);
        }
    });
};

/**
 * [getBills description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
BillsController.prototype.getBills = function(req, res){
  var q  = Bill.find();
  q.populate('dispenseID');
  q.sort({billedOn: -1});
  q.exec(function(err, i){
    res.json(200, i);
  });
};

//Fetches one bill, one bill by associated dispense_id, look up a dictionary, blah
BillsController.prototype.oneBill = function(dispense_id, callback){
    var q = Bill.findOne({dispenseID: dispense_id});
  q.populate('dispenseID');
  q.populate('billClass');
  q.exec(function(err, i){
    // console.log(i.dispenseID.drugs);
    if(err){
        callback(err);
    }else{
        if(i.billCost === 0){
            return BillsController.fixCost(i, function(fixed){
              //fixes situations whr the billing class isnt available
              //ideally should use the default billing class.
              //TOBE DISCUSSED
              if (i.billClass) {
                fixed.billClassName = i.billClass.profileName;
                return callback(fixed);
              } else if (i.dispenseID.billClass){
                BillingProfile.findOne({
                  _id: i.dispenseID.billClass
                }, 'profileName')
                .exec(function (err, i) {
                  fixed.billClassName = i.profileName;
                  return callback(fixed);
                });
              } else {
                callback(fixed);
              }
            });
        }
        callback(i);
    }
  });
};

/**
 * [fixCost Attaches additional bills based on the patients
 * billing profile]
 * @param  {[type]}   bp       [Billing Object, contains the billing class/profile, and the billable items ]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
BillsController.fixCost = function(bp, callback){
  var rules = bp.billrules;
  var omit_from_all = _.pluck(rules, 'serviceid');
  function _adjust (cost, value, by, directive){
    if(by === 'Percentage'){
      //Increse or decrease the cost by percentage
      if(directive === 'Increment'){
        return (value / 100  * cost) + cost;
      }else if(directive === 'Decrement'){
        return cost - (value / 100  * cost);
      }
    }

    if(by === 'Value'){
      //Increse or decrease the cost by value
      if(directive === 'Increment'){
        return value + cost;
      }else if(directive === 'Decrement'){
        return cost - value;
      }
    }
    if(by === 'Flat Fee'){
      //Increse or decrease the cost by value
      return value ;
    }
  }

  //Oya! Lets process rules that have to do with
  //drug items on the billing profile
  function oya_drugs(){

    //I think i need a recursive function
    //Dont trust loops that much.
    var total = rules.length;
    var _rz = rules.pop();
    //First step if we have a drugs-item related rules
    //on this billing profile, oya lets walk the drug
    //rule over this bill
    if(_rz.servicetype === 'drugs' || _rz.servicetype === 'drug'){
      //Now lets do the same thing to every drug item
      if(_rz.servicename === 'All'){
        //For every drug on dispensed, we check
        //if this rule matches / is to be applied
        _.each(bp.dispenseID.drugs, function(v, i){
          //If the service/rule matches (by comparing the service name and id)
          //to the dispensed drug being checked. and the item is not in our list
          //of items that should be exempted from an 'All rule' (omit_from_all)
          if(_rz.servicename === 'All' && (_.indexOf(omit_from_all, v.itemId.toString()) === -1)){
            bp.dispenseID.drugs[i].cost = _adjust(v.cost * v.unitQuantity, _rz.value, _rz.by, _rz.directive);
          }
        });
      }
      //Next we need to check if this rule applies to a
      //specific item or to all items
      if(_rz.servicename !== 'All'){
        //For every drug on dispensed, we check
        //if this rule matches / is to be applied
        _.each(bp.dispenseID.drugs, function(v, i){
          //If the service/rule matches (by comparing the service name and id)
          //to the dispensed drug being checked
          if(_rz.servicename === v.itemName || _rz.serviceid === v.itemId){
            bp.dispenseID.drugs[i].cost = _adjust(v.cost * v.unitQuantity, _rz.value, _rz.by, _rz.directive);
          }
        });
      }

      //Insert processing for all drug items

      //Now when we done looping thru the
      //drugs, lets check for recursion
      if(--total){
        oya_drugs();
      }else{
        //At this point, we gone thru all the rules
        //in the profile, so we call _mia to finishup
        _mia();
      }
    }
  }

  function _mia(){
    var b = {
        billedItems: [],
        billCost: 0,
        billClass: bp.billClass,
        billedOn:bp.billedOn,
        patientName: bp.patientName,
        patientId: bp.patientId,
        _id: bp._id,
        paymentHistory: bp.paymentHistory

    };
    _.each(bp.dispenseID.drugs, function(v){
        b.billedItems.push({
            item: v.itemName,
            cost: v.cost,
            amount: v.amount
        });
        b.billCost = b.billCost + v.cost;
    });
    b.sofar = 0;
    _.each(b.paymentHistory, function(v){
      b.sofar = v.amount + b.sofar;
    });

    callback(b);
  }

  //This starts the adjustment for drug items
  oya_drugs();
};

/**
 * [serveBill Process a bill for a dispensed prescription]
 * @param  {[type]}   d        [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
BillsController.serveBill = function(d, callback){
  BillingProfile.findOne({_id: d.billClass},'rules', function(err, rules){
    if(err){
      callback(err);
    }else{
      var bill = new Bill();
      bill.billCost = 0;
      bill.billClass = d.billClass;
      bill.dispenseID = d.dispenseID;
      bill.patientName = d.patientName;
      bill.patientId =  d.patientId;
      _.each(rules.rules, function(v){
        bill.billrules.push(v);
      });
      bill.save(function(err, i){
        if(err) return callback(err);
        callback(i);
      });
    }
  });
};

/**
 * [allProfiles Fetch all billing profiles]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
BillsController.prototype.allProfiles = function(callback){
    BillingProfile.find({}, 'profileName', function(err, i){
        if(err){
            callback(err);
        }else{
            callback(i);
        }
    });
};

/**
 * [profileRules Fetches all rules belonging to a billing profile]
 * @param  {[type]}   profile_id [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
BillsController.prototype.profileRules = function(profile_id, callback){
    BillingProfile.findOne({_id: profile_id})
    .exec(function(err, i){
        if(err){
            callback(err);
        }else{
            callback(i.rules);
        }
    });
};

BillsController.prototype.typeahead = function(query, callback){
    BillingProfile.autocomplete(query, function(err, i){
        if(err){
            callback(err);
        }else{
            callback(i);
        }
    });
};

BillsController.prototype.postpay = function(amount, bill_id, callback){
  //first of all! look up the payment history
  Bill.find({_id: bill_id}, 'paymentHistory billCost', function(err, i){
    if(err){
      callback(err);
    }else{
      //Add the amount paid so far to the amount
      //just being paid in.
      var a = 0;
      console.log(i);
      _.each(i.paymentHistory, function(v){
        a = v.amount + a;
      });
      //if amount paid + the new payment exceeds the bill cost / amount billed
      //callback an error
      if((a + amount) > i.billCost){
        return callback(new Error('exceeding bill cost'));
      }else{
        //add the new amount being paid to the payment history
        Bill.update({_id: bill_id}, {
          $push: {
            paymentHistory: {
              amount: amount,
              date: Date.now()
            }
          }
        }, function(err, i){
          if(err){
            callback(err);
          }else{
            callback(i);
          }
        });
      }
    }
  });
};

/**
 * Adds a new billable service to the database. An example of
 * a billable service is consultation, admission hours/days, tests
 * etc.
 * @param  {String}   name The name of the billing service to create
 * @param  {Function} cb   executes with returned object as an argument.
 * @return {Object}        a json object with the objectId
 */
BillsController.prototype.newService = function(name, cb){
  if(name.length === 0) return cb(new Error(lingua.general.errors.required));
  var service = new BillService();
  service.name = name;
  service.save(function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i.toJSON());
    }
  });
};

/**
 * Fetches all billables services from the database including
 * system defaults and user entries.
 *
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
BillsController.prototype.allServices = function(cb){
  BillService.find({})
  .exec(function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  });
};

/**
 * Removes user entered services from the database.
 * Setting the serviceType field on the query to 'user',
 * request to remove system default services will be
 * denied.
 * @param  {ObjectId}   serviceId The ObjectId for the service to be removed
 * @param  {Function} cb        [description]
 * @return {[type]}             [description]
 */
BillsController.prototype.deleteService = function(serviceId, cb){
  BillService.remove({
    _id: serviceId,
    serviceType: 'user'
  })
  .exec(function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  });
};

/**
 * Changes a the name of the service.
 * Setting the serviceType field on the query to 'user',
 * request to remove system default services will be
 * denied.
 * @param  {ObjectId}   serviceId The ObjectId for the service to be changed
 * @param  {String}   newName   A string thats the new name of the service
 * @param  {Function} cb        [description]
 * @return {[type]}             [description]
 */
BillsController.prototype.updateService = function(serviceId, newName, cb){
  BillService.update({
    _id: serviceId,
    serviceType: 'user'
  }, {
    $set:{
      name: newName
    }
  }, function(err, i){
    if(err){
      cb(err);
    }else{
      cb(i);
    }
  });
};

BillsController.prototype.autoCompleteService = function(query, cb){
  BillService.autocomplete(query, function(r){
    console.log(r);
    cb(r);
  });
};

module.exports.bills = BillsController;

