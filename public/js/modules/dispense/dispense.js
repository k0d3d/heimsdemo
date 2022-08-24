/**
*  dispense Module
*
* Description
*/
angular.module('dispense', [])

.config(['$routeProvider', function ($routeProvider){
	$routeProvider.when('/dispensary', {templateUrl: '/items/dispense', controller: 'dispensaryController'})
  .when('/dispensary/:dispenseID', {templateUrl: '/items/prescribe', controller: 'dispensaryController'});
}])
.controller('dispensaryController', [
  '$scope',
  '$location',
  '$routeParams',
  'itemsService',
  'Notification',
  'Language',
  'billsService',
  'stockService',
  function dispensaryController($scope,$location,$routeParams,itemsService, Notification, Lang, biller, sS){
  function init(){
    //Holds the form for dispensing drugs to a patient.
    //Patient Name, Number, Type and the Drugs list
    $scope.dispenseform = {
      prescription: []
    };
    // Gets the stock down points from the server
    sS.getAllLocations(function(res){
      $scope.locations = res;
    });
    $scope.drugsList = [];

    //Holds the selected drugs to be prescribed along with
    //the options, dosage, and amount
    $scope.d = [];
    //Previously Dispensed Records. Get populated by the init function
    itemsService.fetchDispenseRecords('complete', function(r){
      $scope.dispenseHistory = r;
    });

    //Form input drug name
    $scope.drugname = '';
  }

  //Initialize
  init();

  $scope.is_fluid = function is_fluid (str) {
    return [
     'Vials',
     'Emugels',
     'Gels',
     'Ointments',
     'Suspensions',
     'Syrup',
     'Cream',
     'Lotion',
     'Drops',
     'Sprays',
     'Solutions',
    ].indexOf(str) > -1;
  };

  //populates the waiting list object
  function chip_form(wl){
    return {
      'patientName': wl.patientName,
      'class': wl.class,
      'patientno': wl.patientId,
      'doctorName': wl.doctorName,
      'doctorId': wl.doctorId,
      'id': wl._id,
      'location' : wl.locationId,
      'prescription': []

    };
  }
  // Populates the list of drugs to be prescribed
  function chip_d(wl){
    return _.map(wl.drugs, function(v){
      return {
        _id: v.itemId._id,
        itemName: v.itemId.itemName,
        amount: v.amount,
        currentStock: v.currentStock,
        itemPurchaseRate: v.cost,
        dosage: v.dosage,
        period: v.period,
        status: v.status,
        dose: v.dose
      };
    });
  }
  // Populates the list of drugs to be prescribed
  function chip_otherDrugs(wl){
    return _.map(wl.otherDrugs, function(v){
      return {
        itemName: v.itemName,
        amount: v.amount,
        dosage: v.dosage,
        period: v.period,
      };
    });
  }

  // Populates drugsList array
  function chip_dl(wl){

    return _.map(wl.drugs, function(v){
      return v.itemId.itemName;
    }) ;
  }

  //If a dispense Id is present, work out a form
  if($routeParams.dispenseID){
    $scope.n_w = true;
    $scope.all = false;
    $scope.btnState = true;
    itemsService.prdt($scope.waiting[$routeParams.dispenseID]._id, function(r){
      //chip_form function copies and formats the waiting list object properties
      // into the dispense form
      $scope.dispenseform = chip_form(r);
      //chip_d function copies and formats the drugs prescribed
      $scope.d = chip_d(r);
      $scope.od = chip_otherDrugs(r);
      //Push item Names into drug list
      $scope.drugsList = chip_dl(r);

    });
  }else{
    $scope.n_w = false;
    $scope.all = true;
    $scope.btnState = false;
  }

  $scope.addButtonText = 'Add';
  $scope.addHelpText = '';
  // $scope.$watch('selectedItem.itemname', function(newValue, oldValue){
  //   if(newValue !== oldValue){
  //     $scope.thisItemName = newValue;
  //   }
  // });

  $scope.addDrug = function(){
    if($scope.drugname.length === 0 || _.isUndefined($scope.dispenseform.location)) return false;
    $scope.addHelpText = '';
    var itemId = $scope.selectedItem.itemname.itemId || $scope.selectedItem.itemname._id;
    itemsService.summary(itemId, $scope.dispenseform.location._id,function(c){
      if(_.indexOf($scope.drugsList, $scope.selectedItem.itemname.itemName) < 0){
        $scope.drugsList.push($scope.selectedItem.itemname.itemName);
        $scope.d.push(c);
        //Empty the drugname field
        $scope.drugname = '';

        //lets check if this item has any grouped items that
        //should be dispensed along with it
        if (c.groupedItems && c.groupedItems.length) {
          var i = 0;
          angular.forEach(c.groupedItems, function (group_item) {
            $scope.selectedItem.itemname = group_item;
            // $scope.selectedItem.itemname._id = group_item.itemId;
            $scope.drugname = $scope.selectedItem.itemname.itemName;
            $scope.addDrug();
            i++;
          });
        }
      }else{
        Notification.notifier({
          message : Lang.eng.dispense.addDrug.error,
          type: 'error'
        });
      }
    });
  };

  //Confirm this drug to be prescribed
  $scope.prescribeThis = function(index){
    $scope.drugname = '';

    if($scope.d[index].options === 'alternative'){
      // $scope.addHelpText = 'This is an alternative to ' + d.itemName;
      // $scope.dispenseform.prescription.push();
      $scope.d[index].ready = true;
      return;
    }
    // Check if the amount to be dispensed is available
    // (lesser than) from the current stock for the item
    if($scope.d[index].amount <= $scope.d[index].currentStock){
      $scope.dispenseform.prescription.push($scope.d[index]);
      $scope.d[index].ready = true;
    }else{
      Notification.notifier({
        message: Lang.eng.dispense.confirm.amount.error,
        type: 'error'
      });
    }
  };

  $scope.clrForm = init();

  //Pull up modal with summary
  $scope.approveThis = function(){
    if($scope.dispenseform.prescription.length === 0){
      Notification.notifier({
        message: Lang.eng.dispense.approve.fail,
        type : 'error'
      });
      return false;
    }else{
      Notification.modal({
        heading: 'Confirm Prescription',
        type: 'success'
      });
    }
  };

  // Send prescript
  $scope.sendDis = function(){
    var drugs = [];
    _.forEach($scope.dispenseform.prescription, function(v){
      drugs.push({
        '_id':v._id,
        'amount':v.amount,
        'itemName':v.itemName,
        'status':v.options,
        'dosage': v.dosage,
        'period': v.period,
        'cost': v.cost,
        'unitQuantity': v.unitQuantity
      });
    });
    var toSend = {
      'patientName':$scope.dispenseform.patientName,
      'patientId': $scope.dispenseform.patientId,
      'id': $scope.dispenseform.id,
      'doctorName': $scope.dispenseform.doctorName,
      'doctorId': $scope.dispenseform.doctorId,
      'billClass': $scope.dispenseform.billClass._id || $scope.dispenseform.billClass,
      'drugs': drugs,
      'location': $scope.dispenseform.location
    };
    itemsService.dispense(toSend, function(){
      //Empty all necessary scope, reset form
      $scope.dispenseform = '';
      $scope.d = '';
      $scope.drugsList = '';
      if($scope.waiting.length > 0 || $routeParams.dispenseID){
        $scope.waiting.splice($routeParams.dispenseID, 1);
      }
    });
  };
  $scope.removeDrug = function(index){
    $scope.drugname = '';
    $scope.drugsList.splice(index, 1);
    $scope.d.splice(index, 1);
  };

  $scope.viewBill = function(dispense_id){
    $scope.activeBill = {};
    biller.aBill(dispense_id, function(r){
      $scope.activeBill = r;
      $scope.activeBill.outstanding = Math.round((r.billCost - r.sofar));
    });
  };

  $scope.markpaid = function(amount, bill_id){
    biller.postpay(amount, bill_id, function(){
      $scope.activeBill.paymentHistory.push({
        amount: amount,
        date: $.now()
      });
      $scope.newpaymentamount = 0;
      $scope.activeBill.outstanding = Math.round(($scope.activeBill.outstanding - amount));
    });
  };

  $scope.adjust_amount = function(index){
    var val, d = $scope.d[index];
    switch($scope.d[index].dosage){
      case '1':
        val = 1 * d.qty;
      break;
      case '2':
        val = 2 * d.qty;
      break;
      case '3':
        val = 3 * d.qty;
      break;
      case '4':
        val = 4 * d.qty;
      break;
      default:
        val = d.qty;
      break;
    }

    var calc_dosage = val * d.dose * d.period;
    console.log(calc_dosage);
    var dosage_count_in_package_size = Math.ceil(calc_dosage / d.packageSize);

    $scope.d[index].unitQuantity = dosage_count_in_package_size;
    // $scope.d[index].unitQuantity = Math.ceil((val * $scope.d[index].period) /
    //                                 $scope.d[index].packageSize / $scope.d[index].dose);

    $scope.d[index].amount = $scope.d[index].unitQuantity * $scope.d[index].packageSize;

    $scope.d[index].cost = $scope.d[index].selected_price / ($scope.d[index].itemSize / $scope.d[index].packageSize );
  };

  $scope.print_bill = function(ele){
    // return cb(true);
    $(ele).printThis({
       debug: false,
       importCSS: true,
       importStyle: false,
       printContainer: false,
       pageTitle: 'Bill',
       formValues: true
    });
    // $('#dialog-view-bill .modal-body').printArea({
    //   mode: 'iframe'
    // });
  };

  // $scope.quantityChanges = function (reqIndex) {
  //   reqIndex.amount = reqIndex.unitQuantity * reqIndex.packageSize;
  // };

  //Calls for the list of created profiles
  biller.profiles(function(r){
      $scope.profiles = r;
  });
}])
.controller('viewBillController', ['$scope', 'billsService', function($scope, biller){
  $scope.activeBill = {
    paymentHistory: []
  };
  biller.aBill(dispense_id, function(r){
    console.log('why');
    $scope.activeBill = r;
    if(r.paymentHistory.length === 0){
      console.log('hello');
      $scope.activeBill.paymentHistory.push({
         amount: '',
         date: '$.now()'
      });
    }
  });
}]);