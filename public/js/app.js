// Declare app level module which depends on filters, and services

var integraApp  = angular.module('integraApp', [
  'ngRoute',
  'ngSanitize',
  'admin',
  'order',
  'stock',
  'report',
  'item',
  'bills',
  'dispense',
  'supplier',
  'dashboard',
  'directives',
  'services',
  'language',
  'checklist-model',
  'angular.filter'
  ]);

integraApp.config([
  '$routeProvider',
  '$locationProvider',
  function ($routeProvider, $locationProvider) {
  $routeProvider.
    otherwise({
      redirectTo: '/'
    });
  $locationProvider.html5Mode(true);
}]);


integraApp.controller('MainController', [
  '$scope',
  '$http',
  '$location',
  'Notification',
  'itemsService',
  'adminService',
  'ordersService',
  function($scope, $http, $location, Notification, itemsService, aS, ordersService){

  $scope.modal = {};
  $scope.notification = {};
  $scope.pre_auth = {};
  $scope.waiting = '';
  $scope.updates = [];

  $scope.$on('$routeChangeSuccess', function () {
    $('.modal-backdrop').hide();
  });

  $scope.$on('newNotification', function(){
    $scope.notification = Notification.notice;
  });
  $scope.$on('newEvent', function(){
    $scope.modal = Notification.message;
  });

  $scope.$on('cart-updated', function () {
    $scope.orderCart = ordersService.cart;
  });

  function href(target, useUrl){
    $scope.modal = {};
    if(useUrl == '1'){
      $location.url(target);
    }else{
      $location.path(target);
    }
  }
  function backBtn(){
    history.back();
  }



  var fetchwaiting = function (){
    //Fetches waiting list of patients
    itemsService.fetchDispenseRecords('pending', function(r){
        $scope.waiting = r;
    });
  };

  $scope._stockDirection = function (record) {
    return (record.reference.indexOf('stockdown') > -1) ? 'stockdown' : 'stockup';
  };

  $scope.refreshUpdates = function (){
    $scope.isr = 'fa-spin';
    fetchwaiting();
    aS.getUpdates(function(r){
      _.each(r, function(v){
        $scope.updates.push(v);
      });
      $scope.isr = '';
    });
  };

  //Run Update
  // $scope.refreshUpdates();

  //Fetch updates
  //setInterval($scope.refreshUpdates, 15000);

  $scope.clearUpdates = function(){
    aS.clear(function(){
      $scope.updates = [];
    });
  };

  //List of Item forms
  var itemForm = [
   'Tablets',
   'Pints',
   'Syringes',
   'Capsules',
   'Vials',
   'Caplets',
   'Ampoules',
   'Emugels',
   'Gels',
   'Ointments',
   'Suspensions',
   'Syrup',
   'Powder',
   'Cream',
   'Lotion',
   'Drops',
   'Sprays',
   'Suppositories',
   'Solutions',
   'Sheet'
  ].sort();

  //List of Item Packaging
  var itemPackaging = [
     'Tin',
     'Carton',
     'Sachet',
     'Roll',
     'Piece',
     'Packet',
     'Gallon',
     'Bottle',
     'Bag',
     'Box',
     'Tube',
     'Envelope'
  ].sort();

  $scope.commons = {
    href : href,
    backBtn: backBtn,
    itemForm : itemForm,
    itemPackaging: itemPackaging

  };


  $scope.$on('refresh-cart', function () {
    ordersService.getCartContent()
    .then(function (d) {
      var items = d.data;
      var toOrder = _.map(items, function (item) {
        return {
          itemName: item.itemName,
          orderAmount: item.orderAmount,
          orderPrice: item.orderPrice,
          orderDate: item.orderDate,
          product_id: item.product_id,
          sku: item.sku,
          orderId: item._id,
          orderSupplier: item.orderSupplier,
          isDrugStocOrder:item.isDrugStocOrder,
          supplierName: item.orderSupplier.supplierName
        };
      });
      ordersService.cartLoaded(toOrder);
    });
  });

  $scope.$emit('refresh-cart');


}]);
angular.module('integraApp').filter('moment', function(){
    return function(time){
        var m = moment(time);
        return m.fromNow();
    };
});