/**
* orders Module
*
* Description
*/
angular.module('order', []).

config(['$routeProvider',function($routeProvider){
  $routeProvider.when('/orders', {templateUrl: '/orders/all', controller: 'ordersIndexController'})
  .when('/orders/pending/:type', {templateUrl: '/orders/all', controller: 'ordersIndexController'})
  .when('/dashboard/orders/cart', {templateUrl: '/orders/cart', controller: 'orderCartController'})
  .when('/dashboard/order', {templateUrl: '/orders/add', controller: 'orderAddController'})
  .when('/dashboard/order/by/:by', {templateUrl: '/orders/add', controller: 'orderAddController'})
  .when('/dashboard/order/:itemId', {templateUrl: '/orders/add', controller: 'orderAddController'});
}])
/** jshint maxlen: 300 */
.controller('orderCartController', [
  '$scope',
  '$http',
  'ordersService',
  function($scope, $http, ordersService){

  $scope.print_purchase_order = function(ele){
    // return cb(true);
    $(ele).printThis({
       debug: false,
       importCSS: true,
       importStyle: false,
       printContainer: false,
       pageTitle: 'Purchase Order',
       formValues: true
    });
    // $('#dialog-view-bill .modal-body').printArea({
    //   mode: 'iframe'
    // });
  };

  $scope.selectedCart = [];

  $scope.form = {
    suppliers: []
  };

  $scope.selectedSuplier = $scope.form.suppliers;
  $scope.selectedView = false;

  $scope.checkAllClick = function () {
    $scope.selectedCart = angular.copy($scope.orderCart);
  };


  $scope.placeOrder = function () {

    if (!$scope.check_send_sms && !$scope.check_send_email) {
      alert('Please select sms or email to notify supplier');
      return false;
    }

    if (!confirm('Confirm you want to place an order for these items!')) {
      return false;
    }

    if (!$scope.selectedCart.length) {
      alert('Please select items you want');
      return false;
    }

    if ($scope.check_send_sms) {
      $scope.sms_purchase_order();
    }

    if ($scope.check_send_email) {

    }


    ordersService.postCart($scope.selectedCart, function () {
      $scope.selectedCart.length = 0;
      ordersService.getCartContent()
      .then(function (d) {
        $scope.cart_is_checkedout = true;
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
            isDrugStocOrder:item.isDrugStocOrder
          };
        });
        ordersService.cartLoaded(toOrder);
      });
    });
  };

  $scope.sms_purchase_order = function sms_purchase_order (){

    $scope.sms_is_sent = false;
    if ($scope.printOrderToSupplier && $scope.selectedCart) {
      $scope.printOrderToSupplier.isRequesting = true;
      ordersService.notifySupplier($scope.printOrderToSupplier._id, 'sms', $scope.selectedCart, function(){
        $scope.printOrderToSupplier.isRequesting = false;
        $scope.sms_is_sent = true;
      });
    }

  };

  $scope.removeFromCart = function removeFromCart (order_id, index){
    ordersService.remove(order_id, function(){
      $scope.orderCart.splice(index, 1);
    });
  };

}])
.controller('ordersIndexController', [
  '$scope',
  '$http',
  '$location',
  '$routeParams',
  'ordersService',
  // '$q',
  function($scope, $http, $location, $routeParams, ordersService){

  $scope.ordersfilter = {
    orderStatus : ''
  };
  (function(){
    $scope.orders = [];

    ordersService.orders(function(r){
        $scope.orders = r;

      switch($routeParams.type){
        case 'invoices':
        $scope.ordersfilter.orderStatus = 2;
        break;
        case 'order':
        console.log('message');
        $scope.ordersfilter.orderStatus = 0;
        break;
        default:
        $scope.ordersfilter.orderStatus = '';
        break;
      }
    });


  }());

  $scope.removeOrder = function(event, order_id){
    var currentItem = event.currentTarget;
    console.log(currentItem);
    ordersService.remove(order_id, function(o){
      if(o.state === 1){
        $(currentItem).parents('tr').remove();
      }
    });
  };
  // $scope.changeStatus = function(){
  //   var o = {
  //     status : $scope.uo.status,
  //     itemData : $scope.uo.itemData,
  //     amount : $scope.uo.amount,
  //     order_id : $scope.uo.order_id,
  //     invoiceno : $scope.uo.invoiceno
  //   };
  //   ordersService.updateOrder(o,function(r){

  //   });
  // };
}])
.controller('orderAddController',[
  '$scope',
  '$http',
  '$location',
  'ordersService',
  'itemsService',
  '$routeParams',
  '$q',
  function($scope, $http, $location, ordersService,itemsService, $routeParams, Q){

  $scope.form = {
    itemData: {},
    supplierData: {}
  };
  $scope.modal = {};
  // if($routeParams.itemId){
  //   itemsService.summary($routeParams.itemId, 'main', function(r){
  //     $scope.summary = r;
  //     $scope.form.itemData.itemName = r.itemName;
  //     $scope.form.itemData.id = r._id;
  //     $scope.form.nafdacRegNo = r.nafdacRegNo;
  //     $scope.form.nafdacRegName = r.itemName;
  //     $scope.form.orderPrice = r.itemPurchaseRate;
  //     $scope.form.suppliers = {
  //       supplierName : r.supplierName,
  //       supplierID : r.supplierID
  //     };
  //   });
  // }

  $scope.set_ds_product = function (ds) {
    $scope.now_product = ds;
  };

  //should set product being viewed and
  $scope.tag_ds_product = function () {
    var product = $scope.now_product, inventory_item = $scope.selectedItem.itemname;
    // var attributes = _.reduce(product.attributes, function (result, n) {
    //   result[n.name] = n.options;
    //   return result;
    // });
    var form = {
      _id: inventory_item._id,
      // itemName: product.title,
      // sciName: $(product.description).text(),
      // manufacturerName: attributes['Manufacturer'][0],
      // importer: attributes['Manufacturer'][0],
      // nafdacRegNo: attributes['Nafdac-no'][0],
      // itemCategory: product.categories,
      sku: product.sku,
      dsPurchaseRate: product.price,
      product_id: product.product_id,
      itemBoilingPoint: 0,
      itemPurchaseRate: product.price
      // itemTags: product.tags,
      // itemForm: attributes['Item-form'][0]
    };
    itemsService.update(form, function(){
      delete $scope.now_product;
      // var i = $interpolate('Good work! You can now <a ng-href="/dashboard/order?s={{itemName}}&tab=iv&productId={{productId}}">order this</a> item.');
      $scope.attach_status = {itemName: inventory_item.itemName, productId: product.product_id};
    });
  };

  $scope.more_info = function () {

  };

  if($location.by === 'composition'){
    $scope.plcordr = true;
  }else{
    $scope.searchndl = true;
  }

  $scope.toggle = function(){
    $scope.plcordr = !$scope.plcordr;
    $scope.searchndl = !$scope.searchndl;
  };

  $scope.searchcmp = function(searchQuery, query){
    $scope.searching_icon = true;
    Q.all([
      itemsService.request_search(searchQuery, 'inventory', query),
      itemsService.request_search(searchQuery, 'drugstoc', query),
      itemsService.request_search(searchQuery, 'nafdac', query)
    ])
    .then(function (resolvedPromise) {
      $scope.searching_icon = false;
      $scope.inventoryResults = resolvedPromise[0].data.results;
      $scope.drugstocResults = resolvedPromise[1].data.results;
      $scope.nafdacResults = resolvedPromise[2].data.results;

      $scope.inventoryCount = resolvedPromise[0].data.totalCount;
      $scope.drugstocCount = resolvedPromise[1].data.totalCount;
      $scope.nafdacCount = resolvedPromise[2].data.totalCount;
      if (!$scope.activePane) {
        $scope.activePane = 'iv';
      }
    });
    // ordersService.searchCmp(searchQuery)
    // .
  };

  $scope.currentPage = {
    'inventory' : 0,
    'drugstoc': 0,
    'nafdac': 0
  };

  $scope.skipSearch = function skipSearch(searchQuery, page, scope) {
    ordersService.request_search(searchQuery, scope, {page: page})
    .then(function (result) {
      if (scope === 'inventory') {
        $scope.inventoryResults = result.data.results;
      }
      if (scope === 'drugstoc') {
        $scope.drugstocResults = result.data.results;
      }
      if (scope === 'nafdac') {
        $scope.nafdacResults = result.data.results;
      }
      $scope.currentPage[scope] = page;
    });
  };


  $scope.more = function (index) {
    ordersService.moreInfo($scope.cmps[index]._id, function(r){
      $scope.ds = r;
      $scope.ds.index = index;
    });
  };

  $scope.order_by_ds_product = function (product_id) {
    itemsService.request_search(product_id, 'checkProduct', {page: 0})
    .then(function () {
        $('#modal-tag-ds-product').modal('toggle');
      // if (!result) {
      // }
    });
  };
  // $scope.orderthis = function(){
  //   if($scope.ds.length === 0) return false;
  //   $scope.form = {
  //     orderType: 'Medication',
  //     itemData : {
  //       itemName: $scope.ds.productName,
  //       sciName: $scope.ds.composition
  //     },
  //     suppliers:{
  //       supplierName: $scope.ds.man_imp_supp
  //     },
  //     nafdacRegNo: $scope.ds.regNo,
  //     nafdacRegName: $scope.ds.productNameja
  //   };
  //   $scope.toggle();
  // };

  $scope.orderItem = function orderItem (item, scope) {

      var toOrder = {
        itemName: item.itemName || item.title,
        sciName: item.sciName || item.description,
        orderAmount: item.orderAmount,
        orderDate: Date.now(),
        product_id: item.product_id,
        sku: item.sku,
        orderSupplier: item.suppliers[0]
      };
      if (scope === 'sup') {
        toOrder.itemId = item._id;
        toOrder.isDrugStocOrder = false;
        toOrder.orderPrice = item.itemPurchaseRate;
      }
      if (scope === 'ds') {
        toOrder.isDrugStocOrder = true;
        toOrder.orderPrice = item.dsPurchaseRate;
      }
      ordersService.save(toOrder)
      .then(function () {
        ordersService.cartUpdated(toOrder);
      });

  };

  $scope.saveButtonClass = 'btn-primary';
  // $scope.submitOrder = function(){
  //   ordersService.save($scope.form, function(data){
  //     $scope.form = '';
  //   });
  // };
  if ($location.search().s) {
    var queryVars = $location.search();
    $scope.searchcmp(queryVars.s, {'page' : 0});
    $scope.activePane = queryVars.tab;
    $scope.product_id_filter = queryVars.productId;
    $scope.searchQuery = queryVars.s;
  }
}])
.factory('ordersService',[
  '$http',
  'Notification',
  'Language',
  '$rootScope',
  function($http, Notification, Lang, $rootScope){
    var f = {};

    f.cart = [];

    f.cartUpdated = function (item) {
      this.cart.push(item);
      $rootScope.$broadcast('cart-updated');
    };

    f.cartLoaded = function (cart) {
      this.cart = cart;
      $rootScope.$broadcast('cart-updated');
    };

    f.searchCmp = function(srchstr, catrcmp, page, callback){
      $http.get('/api/orders/ndl/'+srchstr+'/'+catrcmp+'/'+page)
      .success(function(d){
        if(_.isEmpty(d)){
          Notification.notifier({
            message: Lang.eng.order.search.notfound,
            type: 'error'
          });
        }
        callback(d);
      })
      .error(function(){
        Notification.notifier({
          message: Lang.eng.order.search.error,
          type: 'error'
        });
      });
    };

    f.getAllSuppliers = function(callback){
      $http.get('/api/orders/suppliers/').success(function(data){
        callback(data);
      });
    };
    f.getSupplierName = function(query, callback){
      // $http.get('/api/orders/supplier/typeahead/'+query).success(function(data){
      //   callback(data);
      // });
      $.getJSON('/api/orders/supplier/typeahead/'+ query, function(s) {
          var results = [];
          $.each(s,function(){
            results.push(this.supplierName);
          });
          callback(results);
      });
    };
    f.orders = function(callback){
      var res = [];
      $http.get('/api/orders').success(function(data){
        var r = data;
        angular.copy(r,res);
        return callback(res);
      });
    };
    f.getCartContent = function getCartContent (){
      return $http.get('/api/cart');
    };
    // Progresses / Moves an order from the cart to pending.
    f.postCart = function(form, callback){
      $http.post('/api/orders/cart', form).
        success(function(data) {
          Notification.notifier({
            message : Lang.eng.order.place.success,
            type: 'success'
          });
            callback(data);
        }).
        error(function(){
          Notification.notifier({
            message : Lang.eng.order.place.error,
            type: 'error'
          });
        });
    };
    //Saves an order to the cart
    f.save = function(form){
      return $http.post('/api/orders', form)
        .then(function() {
          Notification.notifier({
            message : Lang.eng.order.cart.success,
            type: 'success'
          });
        }, function(){
          Notification.notifier({
            message : Lang.eng.order.cart.error,
            type: 'error'
          });
        });
    };
    f.updateOrder = function(o, callback){
      $http.put('/api/orders/' + o._id, o)
      .success(function(data){
        Notification.notifier({
          message: Lang.eng.order.update.success,
          type: 'success'
        });
        callback(data);
      })
      .error(function(){
        Notification.notifier({
          message: Lang.eng.order.update.error,
          type: 'error'
        });
      });

    };
    f.count = function(callback){
      $http.get('api/orders/count').
        success(function(d){
          callback(d);
        });
    };
    f.remove = function(order_id, callback){
      $http.delete('/api/orders/'+order_id)
      .success(callback);
    };
    f.moreInfo = function (id, callback) {
      $http.get('/api/orders/ndl/' + id + '/summary')
      .success(function (d) {
        callback(d);
      })
      .error(function () {
        Notification.notifier({
          message: Lang[Lang.set].order.summary.error,
          type: 'error'
        });
      });
    };

    f.notifySupplier = function(id, type, orders, cb){
      $http.post('/api/suppliers/'+id+'/notify?type='+type, orders)
      .success(function(d){
        cb(d);
      })
      .error(function(){
        //Fit in error here
      });
    };

    return f;
}])
.directive('orderSupplierTypeAhead', ['itemsService', function (itemsService){
  var linker = function(scope, element){
    var nx;
    var typeFunc = {
      source: function(query, process){
        return itemsService.getSupplierName(query,function(results, s){
          nx = s;
          return process(results);
        });
      },
      updater: function(name){
        _.some(nx, function(v){
          if(v.supplierName === name){
            scope.printOrderToSupplier = v;
            return true;
          }
        });
        scope.$apply();
        return '';
      }
    };

    element.typeahead(typeFunc);
  };
  return {
    link: linker
  };
}])

.directive('orderItemTypeAhead', ['itemsService', function(itemsService){
  var linker = function(scope, element){
    var nx;
      element.typeahead({
        source: function(query, process){
          return itemsService.getItemName(query,function(results, s){
            nx = s;
            return process(results);
          });
        },
        updater: function(name){
          itemsService.summary(name,'main', function(r){
            scope.form.itemData.itemName = r.itemName;
            scope.form.itemData.id = r._id;
            scope.form.suppliers = {
              supplierID : r.suppliers[0]._id,
              supplierName: r.suppliers[0].supplierName
            };
            scope.form.nafdacRegNo = r.nafdacRegNo;
            scope.form.nafdacRegName = r.itemName;
            scope.form.orderPrice = r.itemPurchaseRate;
            scope.summary = r;
          });
          scope.$apply();
          return name;
        }
      });
  };
  return {
    link: linker
  };
}])
.filter('orderState', function () {
  return function (num) {
    var returnVal;
    switch (parseInt(num)) {
      case -1:
      returnVal =  'cancelled';
      break;
      case 0:
      returnVal =  'cart';
      break;
      case 1:
      returnVal =  'pending order';
      break;
      case 2:
      returnVal =  'received';
      break;
      case 3:
      returnVal =  'supplied';
      break;
      case 4:
      returnVal =  'paid';
      break;
      case 5:
      returnVal =  'complete';
      break;
      default:
      returnVal =  'processing';
      break;
    }

    return returnVal;
  };
})
.directive('orderList', [function () {
  return {
    link: function () {},
    // controller: Ctrlr,
    scope: {
      orderList: '=',
      ordersFilter: '=',
      getStatus: '&'
    },
    templateUrl: '/templates/order-list'
  };
}])
.directive('crossItemSearchDs', [function () {
  return {
    link : function (scope) {
      function check_against (collection) {
        return _.findIndex(collection, function (index_item) {
          return index_item.product_id === scope.item.product_id;
        });
      }

      if ((check_against(scope.collection) + 1)) {
        scope.item.matching_ds_item = true;
      }
    },
    scope: {
      collection: '=',
      item: '=crossItemSearchDs',
    }
  };
}])
.directive('crossItemSearchIv', [function () {
  return {
    link : function (scope) {
      function check_against (collection) {
        return _.findIndex(collection, function (index_item) {
          return index_item.nafdacRegNo === scope.item.attributes[1].options[0];
        });
      }

      if ((check_against(scope.collection) + 1)) {
        scope.item.matching_iv_item = true;
      }
    },
    scope: {
      collection: '=',
      item: '=crossItemSearchIv',
    }
  };
}])
.directive('orderItemMenu', ['ordersService','Notification','Language', function(OS, N, L){
  function link () {


  }
  function Ctrlr ($scope){

    $scope.updateOrder = function(){
      if (($scope.order.nextStatus()) === 2) return false;
      if($scope.order.nextStatus() === 3 &&
        (!$scope.order.amountSupplied ||
          !$scope.order.orderInvoiceNumber)){
        alert('Please check the required fields: Missing Amount / Invoice Number');
        return false;
      }
      if($scope.order.nextStatus() === 4 &&
        (!$scope.order.paymentReferenceType ||
          !$scope.order.paymentReferenceID)){
        alert('Please check the required fields: Payment ID / Payment Type');
        return false;
      }
      var orderToGo = angular.copy($scope.order);
      orderToGo.orderStatus = $scope.order.nextStatus();
      // var o ={
      //   orderStatus : $scope.order.nextStatus(),
      //   order_id : $scope.order._id,
      //   orderInvoiceNumber : $scope.order.orderInvoice,
      //   amountSupplied: $scope.order.amountSupplied,
      //   paymentReferenceType: $scope.order.paymentReferenceType,
      //   paymentReferenceID: $scope.order.paymentReferenceID
      // };
      OS.updateOrder(orderToGo, function(r){
        $scope.order.orderStatus = $scope.order.nextStatus();
        // $scope.order.orderStatus = r.result;
        // $scope.order.nextStatus = $scope.getStatus({status: r.result});
        if(r.result === 3 && ($scope.order.amountSupplied < $scope.order.orderAmount)){
          N.notifier({
            message: L[L.set].order.update.amountDis,
            type: 'info'
          });
        }
      });
    };


    $scope.removeOrder = function(event, order_id){
      var currentItem = event.currentTarget;
      OS.remove(order_id, function(o){
        if(o.state === 1){
          $(currentItem).parents('tr').remove();
        }
      });
    };

  }
  return {
    link: link,
    controller: Ctrlr,
    // scope: {
    //   orderList: '=',
    //   ordersFilter: '=',
    //   getStatus: '&'
    // }
  };
}])
.directive('orderItemActionBtn', [function () {
  return {
    link: function (scope) {
      scope.order.nextStatus = function () {
        //a drugstoc order and 'next' status is 'received'
        //should only occur when an order is hasnt been sent
        //to drugstoc WC online.once the order is 'received' (2)
        //this will have a nextStatus of supplied (3). Till then
        //return 6 or greater, meaning processing
        if (scope.order.isDrugStocOrder && (scope.order.orderStatus + 1) === 2) {

          return 6;
        }
        //not a drugstoc order and is still pending(1) , the next
        //status is supplied (3).
        if (!scope.order.isDrugStocOrder && scope.order.orderStatus === 1) {

          return 3;
        }
        //if none if the above, we should proceed to the next status
        return scope.order.orderStatus + 1;
      };
      scope.order.orderBtnDisabled = function () {
        return (scope.order.orderStatus + 1) > 5;
      };


    }
  };
}])
;