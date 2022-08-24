/**
*  item Module
*
* Description
*/
angular.module('item', [])

.config(['$routeProvider', function ($routeProvider){
	$routeProvider.when('/items', {templateUrl: '/items/index', controller: 'itemIndexController'})
  .when('/items/view/:state', {templateUrl: '/items/index', controller: 'itemIndexController'})
  .when('/items/add', {templateUrl: '/items/new', controller: 'itemAddController'})
  .when('/items/:itemId/edit/:action',{templateUrl: '/items/edit', controller: 'itemAddController'})
  .when('/items/:itemId/ds-add/:action',{templateUrl: '/items/new', controller: 'itemAddController'});
}])
.controller('itemIndexController', [
  '$scope',
  '$location',
  '$routeParams',
  'itemsService',
  'stockService',
  'ordersService',
  function itemIndexController($scope, $location, $routeParams,itemsService, sS, ordersService){
    function init(){
      $scope.summary = {};
      $scope.form = {};
      $scope.itemsList = '';
      $scope.hasItems = false;
      itemsService.items(function(data){
        if(data.length > 0){
          $scope.hasItems = true;
          sortItems(data, function(lol){
            $scope.itemsList = lol;
          });
          $scope.enabledIndex = Object.keys($scope.itemsList);
        }
      });
      $scope.$on('onFinishLoaded', function(event, data){
        if(data === true){
          if($routeParams.state == 'low'){
            $('.card').not('.low-stock').hide();
          }
        }
      });
    }
    init();
    function sortItems(data, callback){
      var o = {};
      angular.forEach(data, function(ele,index,arr){
        if(ele.itemName){
          var fchar = ele.itemName.split('');
          var fCharUpper  = fchar[0].toUpperCase();
          if(o[fCharUpper] ===  undefined){
            o[fCharUpper] = [];
          }
          o[fCharUpper].push(ele);
        }
        if(arr.length === index + 1){
         callback(o);
       }
      });
    }
    function atoz(){
      var a = [], i = 65;
      for (i;i<=90;i++){
        a[a.length] = String.fromCharCode(i);
      }
      return a;
    }
    $scope.stockFilters = [{
      'value': '',
      'text': 'All Stock'
    },{
      'value': 'good-stock',
      'text': 'Good Stock'
    },{
      'value': 'low-stock',
      'text': 'Low Stock'
    },{
      'value': 'empty-stock',
      'text': 'Empty Stock'
    }];
    $scope.indexes =  atoz();
    $scope.summaryDo =  function (event, id){
      //We use 0 for the location to indicate the Main Inventory

      //Set the current item var
      $scope.currentItem = id;
      itemsService.summary(id._id,'main',function(res){
        $scope.delConfirm = true;
        $scope.delBtnText = 'Delete Item';
        $scope.summary = res;
        $scope.spmenu = 'cbp-spmenu-open';

        //Click out closes side panel
        $('html').one('click', function(){
          $scope.spmenu = '';
          $scope.smpane = '';
          $scope.shpane = '';
          $scope.a2cpane = '';
          $scope.$apply();
        });
        $('nav.cbp-spmenu').click(function(event){
          event.stopPropagation();
        });
      });
    };


    $scope.deleteItem = function(id){
      itemsService.delete(id, function(data){
        if(data.state === 1){
          delete $scope.currentItem;
          $scope.spmenu = '';
        }
      });
    };

    $scope.stockhistory = function (id){
      sS.stockhistory(id, 'Main', function(r){
        //$scope.shpane = {right: 0};
        $scope.smpane = {right:'240px'};
        $scope.shpane = {right:'0px'};
        $scope.a2cpane = {right:'-240px'};
        $scope.shz = r;
      });
    };

    $scope.addToCart = function (summary){

      var toOrder = {
        itemId: summary._id,
        itemName: summary.itemName,
        sciName: summary.sciName,
        orderAmount: summary.orderAmount,
        orderPrice: (summary.supplierSelected === 'user_entry')? summary.itemPurchaseRate || 0 : summary.dsPurchaseRate,
        orderSupplier: (summary.supplierSelected === 'user_entry') ? summary.orderSupplier || summary.suppliers[0] : {},
        isDrugStocOrder: (summary.supplierSelected === 'user_entry') ? false: true,
        orderItemSize: summary.itemSize,
        orderDate: Date.now(),
        product_id: summary.product_id,
        sku: summary.sku
      };

      $scope.orderCart.push(toOrder);
      ordersService.save(toOrder)
      .then(function () {
        ordersService.cartUpdated(toOrder);
      });
      //Store Cart Locally
      // $scope.$storage.orderCart = __cleanJSON($scope.orderCart);
    };

    $scope.addPane = function(){
      $scope.smpane = {right:'240px'};
      $scope.a2cpane = {right:'0px'};
      $scope.shpane = {right:'-240px'};
    };


}])
.controller('itemAddController', [
  '$scope',
  '$location',
  '$routeParams',
  'itemsService',
  function itemAddController ($scope, $location, $routeParams,itemsService){
  $scope.form = {
    itemCategory: [],
    suppliers: []
  };
  $scope.catList = [];
  $scope.formList = [];
  $scope.packagingList = [];

  //Initialization function
  function init(){

    if(!_.isUndefined($routeParams.itemId) && $routeParams.action === 'iv-edit'){
      itemsService.getItemFields($routeParams.itemId, function(item){
        $scope.form = item;
      });
    }

    if(!_.isUndefined($routeParams.itemId) && $routeParams.action === 'ds-add'){
      itemsService.getDSProductFields($routeParams.itemId, function(item){
        var attributes = _.reduce(item.attributes, function (result, n) {
          result[n.name] = n.options;
          return result;
        });
        $scope.form = {
          itemName: item.title,
          sciName: $(item.description).text(),
          manufacturerName: (attributes.Manufacturer) ? attributes.Manufacturer[0]: '',
          importer: (attributes.Manufacturer) ? attributes.Manufacturer[0]: '',
          nafdacRegNo: (attributes['Nafdac-no']) ? attributes['Nafdac-no'][0]: '',
          itemCategory: item.categories,
          sku: item.sku,
          dsPurchaseRate: item.price,
          itemPurchaseRate: item.price,
          product_id: item.product_id,
          itemTags: item.tags,
          itemForm: (attributes['Item-form']) ? attributes['Item-form'][0]: '',
          itemPackaging: '',
          suppliers: []
        };
      });
    }

    itemsService.listCategory(function(r){
      angular.forEach(r, function(v){
        $scope.catList.push(v);
      });
    });
    itemsService.listForm(function(r){
      angular.forEach(r, function(v){
        $scope.formList.push(v);
      });
    });
    itemsService.listPackaging(function(r){
      angular.forEach(r, function(v){
        $scope.packagingList.push(v);
      });
    });
  }
  //Run initialization
  init();

  $scope.saveButtonClass = 'btn-primary';
  $scope.isDisabled = false;
  $scope.saveitem = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    itemsService.save($scope.form, function(status){
      $scope.saveButtonText = 'Save Item';
      if(status){
        $scope.form = {
          itemCategory: [],
          suppliers: []
        };
        $scope.saveButtonClass = 'btn-primary';
      }
    });
  };

  $scope.attachSKU = function attachSKU (dsProduct, form) {
    form.itemName = dsProduct.title;
    form.sciName = $(dsProduct.description).text();
    form.itemPurchaseRate = dsProduct.price;
    form.sku = dsProduct.sku;
    form.product_id = dsProduct.product_id;
    $scope.dsListOfMatchingProducts.length = 0;
  };

  //Add Category
  $scope.addCat = function(){
    if($scope.catInput.length > 0){
      itemsService.addCategory($scope.catInput, function(r){
        $scope.catList.push(r);
        $scope.catInput ='';
      });
    }
  };
  //Add Category
  $scope.addForm = function(name){
    if(name.length > 0){
      itemsService.addForm(name, function(r){
        $scope.catList.push(r);
        $scope.catInput ='';
      });
    }
  };

  //Remove/Delete a Category
  $scope.removeCat = function(index){
    itemsService.delCategory($scope.catList[index]._id, function(){
      $scope.catList.splice(index, 1);
    });
  };

  //Remove/Delete a Category
  $scope.removeGroupedItem = function(index){
    $scope.form.groupedItems.splice(index,1);
  };

  //Add a category to the item's category list
  $scope.addToItem = function(index){
    var i = $scope.catList[index];
    $scope.form.itemCategory.push(i.categoryName);
  };

  $scope.removeItemCat = function(index){
    $scope.form.itemCategory.splice(index,1);
  };

  //Remove Supplier From List
  $scope.removeItemSup = function(index){
    $scope.form.suppliers.splice(index,1);
  };

  $scope.updateItem = function(){
    itemsService.update($scope.form, function(){
      $scope.saveButtonText = 'Save Item';
    });
  };

  $scope.getByRegNo = function(){
    itemsService.getByRegNo($scope.form.nafdacRegNo, function(r){
      $scope.form.itemName = r.productName;
      $scope.form.nafdacRegNo = r.regNo;
      $scope.form.importer = r.man_imp_supp;
      $scope.form.sciName = r.composition;
      $scope.form.nafdacId = r._id;
    });
  };

}])
.controller('itemEditController', function itemEditController($scope, $location, $routeParams,itemsService){
  $scope.form = {
    itemSupplier: {}
  };
  if(isNaN($routeParams.itemId)){
    itemsService.getItemFields($routeParams.itemId, function(item){
      $scope.form = item;
    });
  }
  $scope.saveitem = function(){
    $scope.saveButtonClass = 'btn-info';
    itemsService.update($scope.form, function(){
      $scope.saveButtonText = 'Save Item';
    });
  };
})

.factory('itemsService', [
  '$http',
  'Language',
  'Notification',
  function($http, Language, Notification){
  var i = {};
  i.items =  function(callback){
    $http.get('/api/items/listAll')
    .success(function(data){
      Notification.notifier({
        message: Language.eng.items.list.fetch.success,
        type: 'success'
      });
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.list.fetch.error,
        type: 'error'
      });
    });
  };


  i.request_search = function request_search (query, scope, options) {
    return $http.get('/api/items/search?s=' + query + '&scope=' + scope + '&' + $.param(options));
  };

  //Typeahead Query
  i.getItemName = function(query, callback){
    $.getJSON('/api/items/typeahead/?q='+encodeURI(query), function(s) {
        var results = [];
        _.forEach(s, function (i) {
          results.push(i.itemName);
        });

        callback(results, s);
    });
  };

  //Query Supplier Typeahead
  i.getSupplierName = function(query, callback){
    $http.get('/api/supplier/typeahead/term/supplierName/query/'+encodeURI(query))
    .success(function(s){
      var results = [];
      $.each(s,function(){
        results.push(this.supplierName);
      });
      callback(results, s);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.supplier.typeahead.error,
        type: 'error'
      });
    });
  };
  i.getNafdacDrug = function(query, callback){

    $.getJSON('/api/nafdacdrugs/typeahead/needle/'+encodeURI(query), function(s) {
        var results = [];
        $.each(s,function(){
          results.push(this.productName);
        });
        callback(results, s);
    });
  };

  i.fetchDSProductInformation = function fetchDSProductInformation (regNo) {
    return $http.get('/api/dsproducts/?s=' + regNo);
  };

  i.summary = function(id, locationId, callback){
      $http.get('/api/items/'+encodeURI(id)+'/options/quick/locations/'+encodeURI(locationId)).success(callback);
  };

  i.save =  function(post, callback){
      $http.post('/api/items', {item: post}).success(function(data, status){
        Notification.modal({
          heading: 'Item Added',
          body: Language.eng.items.save.success,
          type: 'success',
        });
        callback(true,status);
      }).
      error(function(data, status){
        Notification.modal({
          heading: 'Error Adding Item',
          body: Language.eng.items.save.error,
          type: 'error',
        });
        callback(false, status);
      });
    };

  i.saveLocation = function(post,callback){
    $http.post('/api/items/location',post)
    .success(function(data){
      Notification.notifier({
        message : Language.eng.stock.location.create.success,
        type: 'success'
      });
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message : Language.eng.stock.location.create.error,
        type: 'error'
      });
    });
  };

  //Gets dispense records from the server
  i.fetchDispenseRecords = function(status,callback){
    $http.get('/api/items/locations/records/status/'+status).
    success(function(data){
      callback(data);
    });
  };

  //Post a dispense record
  i.dispense = function(list, callback){
    $http.post('/api/items/dispense',list).
    success(function(){
      Notification.notifier({
        message : Language.eng.dispense.approve.success,
        type: 'success'
      });
      Notification.message.close();
      callback();
    }).
    error(function(){
      Notification.notifier({
        message : Language.eng.dispense.approve.error,
        type: 'error'
      });
    });
  };


  //Fetches fields data for an Item
  i.getItemFields = function(itemId, callback){
    $http.get('/api/items/'+encodeURI(itemId)+'/edit').success(callback);
  };

  //Fetches fields data for an Item
  i.getDSProductFields = function(itemId, callback){
    $http.get('/api/items/'+ itemId +'/ds-product').success(callback);
  };


  //Post updated item fields
  i.update = function(form, callback){
    $http.put('/api/items/'+form._id+'/edit', form)
    .success(function(){
      Notification.notifier({
        message : Language.eng.items.update.success,
        type: 'success'
      });
      callback(true);
    })
    .error(function(){
      Notification.notifier({
        message : Language.eng.items.update.error,
        type: 'error'
      });
    });
  };

  //Delete Item
  i.delete = function(id, callback){
    $http.delete('/api/items/'+id)
    .success(callback);
  };

  //Add an item category
  i.addCategory = function(name, callback){
    $http.post('/api/items/category/', {name: name, parent: ''})
    .success(function(data){
      Notification.notifier({
        message: Language.eng.items.category.add.success,
        type: 'success'
      });
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.category.add.error,
        type: 'error'
      });
    });
  };
  //remove an item category
  i.delCategory = function(name, callback){
    $http.delete('/api/items/category/'+ name)
    .success(function(){
      Notification.notifier({
        message: Language.eng.items.category.delete.success,
        type: 'success'
      });
      callback();
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.category.delete.error,
        type: 'error'
      });
    });
  };
  //Add an item form
  i.addForm = function(name, callback){
    $http.post('/api/items/form/', {name: name})
    .success(function(data){
      Notification.notifier({
        message: Language.eng.items.form.add.success,
        type: 'success'
      });
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.form.add.error,
        type: 'error'
      });
    });
  };
  //Add an item packaging
  i.addPackaging = function(name, callback){
    $http.post('/api/items/packaging/', {name: name, parent: ''})
    .success(function(data){
      Notification.notifier({
        message: Language.eng.items.packaging.add.success,
        type: 'success'
      });
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.packaging.add.error,
        type: 'error'
      });
    });
  };

  //List Categories
  i.listCategory = function(callback){
    $http.get('/api/items/category')
    .success(function(data){
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.category.list.error,
        type: 'error'
      });
    });
  };
  //List Forms
  i.listForm = function(callback){
    $http.get('/api/items/form')
    .success(function(data){
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.form.list.error,
        type: 'error'
      });
    });
  };
  //List packaging
  i.listPackaging = function(callback){
    $http.get('/api/items/packaging')
    .success(function(data){
      callback(data);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.items.packaging.list.error,
        type: 'error'
      });
    });
  };

  //Prescription Record
  i.prdt = function(id, cb){
    $http.get('/api/items/prescribe/'+id)
    .success(function(d){
      cb(d);
    })
    .error(function(){
      Notification.notifier({
        message: Language.eng.dispense.prescribe.error,
        type: 'error'
      });
    });
  };

  i.getByRegNo = function(query, cb){
    console.log(query);
    $http.get('/api/nafdacdrugs/typeahead?q='+encodeURI(query))
    .success(function(d){
      cb(d);
    })
    .error(function(){
      alert('An Error Occurred, please check your request');
    });
  };

  return i;
}])
.directive('brandNameTypeAhead', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
      element.typeahead({
        source: function(query, process){
          return itemsService.getNafdacDrug(query,function(results, s){
            nx = s;
            return process(results);
          });
        },
        updater: function(item){
          scope.form.itemName = item;
          var v = _.find(nx, function (thisItem) {
            return thisItem.productName === item;
          });
          if (v && scope.typeAction !== 'add_grouped_item') {
            scope.form.nafdacRegNo = v.regNo;
            scope.form.importer = v.man_imp_supp;
            scope.form.sciName = v.composition;
            scope.form.nafdacId = v._id;
            // check ds cloud list for matching products

          }

          return item;
        }
      });
  };
  return {
    link: linker,
  };
}])
.directive('supplierNameTypeAhead', ['itemsService', function (itemsService){
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
            scope.form.suppliers.push({
              supplierID : v._id,
              supplierName: v.supplierName
            });
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
.directive('cartSupplier', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
    var typeFunc = {
      source: function(query, process){
        return itemsService.getSupplierName(query,function(results, s){
          scope.checker = nx = s;
          return process(results);
        });
      },
      updater: function(name){
        var selectedItemId = _.find(nx, function (name) {
          return name.supplierName = name;
        });
        scope.orderSupplier = {
          supplierID : selectedItemId._id,
          supplierName: selectedItemId.supplierName
        };

        scope.$apply();
        return name;
      }
    };

    element.typeahead(typeFunc);
  };
  return {
    link: linker
  };
}])
.directive('newModal', function(){
    function link($scope, element, attributes){
      element.on('click', function(){
        $(attributes.newModal).modal('toggle');
      });
    }
    return {
      link: link
    };
})
.directive('nafdacTypeahead', ['itemsService', function(itemsService){
  var linker = function(scope, element){
      element.typeahead({
        source: function(query, process){
          return itemsService.getByRegNo(query,function(results){
            return process(results);
          });
        },
        updater: function(item){
          scope.form.itemName = item;
          _.some(nx, function(v){
            if(v.productName === item){
              scope.form.nafdacRegNo = v.regNo;
              scope.form.importer = v.man_imp_supp;
              scope.form.sciName = v.composition;
              scope.form.nafdacId = v._id;
              return true;
            }
          });
          scope.$apply();
          return item;
        }
      });
  };
  return {
    link: linker
  };
}])
.filter('stockclass',function(){
    return function(cs, bp){
      if(cs === 0){
        return 'empty-stock';
      }else if(cs <= bp){
        return 'low-stock';
      }else{
        return 'good-stock';
      }
    };
  })
.filter('indexclass',function(){
    return function (enabledIndex, index){
      if($.inArray(index, enabledIndex) > -1){
        return 'active';
      }else{
        return 'inactive';
      }
    };
});