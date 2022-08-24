/**
*  Admin Module
*
* Description
*/
angular.module('admin', [])

.config(['$routeProvider', function ($routeProvider){
  $routeProvider.when('/admin', {templateUrl: '/admin/index', controller: 'adminController'});
}])
.controller('adminController', [
  '$scope',
  'billsService',
  'adminService',
  'Transaction',
  'serviceService',
  function adminController($scope, biller, as, T, serviceService){

    function init(){

      //Objects holds scope properties
      //for the bill management template
      $scope.bill = {};

      //Object holds scope properties
      //for the services management template
      $scope.srvs = {};

      //Holds the new rule form
      $scope.bill.newrule = {
         reference:{}
       };

      //holds the list of all created billing profiles
      $scope.bill.p = [];

      //Holds the list of select billing profiles
      $scope.bill.activeProfile = null;

      //Holds the list of visible rules
      $scope.bill.listrules = [];

      //Holds just the names as elements of an array
      $scope.bill.l = [];

      $scope.bill.profileInput = {
        name: '',
        id: 0
      };

      //the array holds all d list of all
      //services loaded from the server and
      //created.
      $scope.service = [];

      //Calls for the list of created profiles
      biller.profiles(function(r){
        $scope.bill.profiles = r;
        angular.forEach(r, function(value, index){
          $scope.bill.p.push(value.profileName);
        });
      });

      //Fetches all services
      serviceService.all(function(r){
        $scope.srvs.services = r;
      });

      //Loads our template
      $scope.template = {};

    }
    //Run the init code
    init();

    // Saves a new rule.
    $scope.bill.newruleC = function(){
      biller.newruleR($scope.bill.newrule, function(){

      });
    };

    $scope.bill.popRules = function(){
      biller.allrules(function(r){
        $scope.bill.rulez =r;
      });
    };

    $scope.bill.pushrule = function(index){
      if(_.indexOf($scope.bill.l, $scope.bill.rulez[index].name) > -1) return false;
      $scope.bill.l.push($scope.bill.rulez[index].name);
      $scope.bill.listrules.push($scope.bill.rulez[index]);
    };

    $scope.bill.js = function(){
      if($scope.bill.activeProfile){
        var n = $scope.bill.activeProfile;
        $scope.bill.profileInput.name = n.profileName;
        $scope.bill.profileInput.id = n._id;

        //Fetch the rules belonging to this billing profile
        biller.brules(n._id, function(r){
          //Holds just the names as elements of an array
          $scope.bill.l =[];
          //use angular or underscore maping function
          $scope.bill.l = _.map(r, function(value, index){
            return value.name;
          });
          // angular.forEach(r, function(value, index){
          //   $scope.l.push(value.name);
          // });
          $scope.bill.listrules =  r;
        });
      }
    };

    $scope.bill.removeFromList = function(index){
      $scope.bill.listrules.splice(index, 1);
    };

    //Creates a new billing profile
    $scope.bill.saveProfile = function(){
      //If No Profile Name is Set or Selected
      if($scope.bill.profileInput.name.length === 0){
        alert('No Profile Name! Select a Profile or Enter a name to save.');
        return false;
      }
      //If we can find the profile name in the list of profiles created.
      //Update the profile wit the rules displayed.
      //If we cant, create a new profile and save the rules to it
      if(_.indexOf($scope.bill.p, $scope.bill.profileInput.name) > -1){
        biller.updateProfile($scope.bill.profileInput, $scope.bill.listrules, function(r){

        });
      }else{
        biller.createProfile($scope.bill.profileInput, $scope.bill.listrules, function(r){
          $scope.bill.p.push($scope.bill.profileInput.name);
        });
      }
    };
    // send the request to remove a service from the list
    $scope.srvs.removeService = function(index){
      serviceService.delService($scope.srvs.services[index]._id, function(r){
        $scope.srvs.services.splice(index, 1);
      });
    };

    // send a request to make/ create a new service
    $scope.srvs.makeNewService = function(){
      serviceService.newService($scope.srvs.new_name, function(r){
        //Add the item to d list.
        $scope.srvs.services.push(r);
        //reset the field
        $scope.srvs.new_name = '';
      });
    };


    $scope.trylogin = function(){
      console.log($scope.email);
      as.login($scope.email, $scope.password, function(r){

      });
    };

    $scope.updateProduct = function updateProduct () {
      as.updateProductInformation();
    };



  }])
.controller('configController', ['$scope', 'adminService', function($scope, adminService){
  //$scope.run_setup =  adminService.initSetup();
}])
.controller('usersController', ['$scope', 'adminService', function ($scope, adminService) {
    $scope.facility = {};
    adminService.loadUserProfile()
    .then(function (userInfo) {
      if (userInfo.data) {
        $scope.facility = userInfo.data;
      }
    });

    $scope.login_user = function (f) {
      adminService.login(f);
    };

    $scope.saveFacilityInformation = function saveFacilityInformation (data){
      adminService.saveUserProfile(data)
      .then(function (res) {

      }, function (err) {
        console.log(err);
      });
    };
}])
.controller('transactionController', ['$scope', 'Transaction', function($scope, T){

    //Load Transactions
    T.getTransactions(function(d){
      $scope.transactions = d;
    });

  }])

.factory('adminService', ['$http', 'Notification', 'Language',  function(http, N, L){
  var a = {};

  a.getUpdates = function(cb){
    http.get('/api/admin/updates')
    .success(function(d){
      cb(d);
    })
    .error(function(){
      N.notifier({
        message: L[L.set].admin.update.error,
        type: 'error'
      });
    });
  };

  a.saveUserProfile = function saveUserProfile (data) {
    return http.post('/api/admin/user-profile', data);
  };

  a.loadUserProfile = function loadUserProfile () {
    return http.get('/api/admin/user-profile');
  };

  a.updateProductInformation = function updateProductInformation() {
    return http.post('/api/admin/update-product-information')
    .then(function () {
      N.notifier({
        message: L[L.set].admin.update.success,
        type: 'success'
      });
    }, function (err) {
      console.log(err);
      N.notifier({
        message: err.data,
        type: 'error'
      });
    });

  };

  a.clear = function(cb){
    http.delete('/api/admin/updates')
    .success(function(d){
      cb(d);
    })
    .error(function(er){
      N.notifier({
        message: L[L.set].admin.clear.error,
        type: 'error'
      });
    });
  };

  a.login = function(deets){
    return http.post('/admin/session', {
      email: deets.email,
      consumer_key: deets.consumer_key,
      consumer_secret: deets.consumer_secret
    })
    .then(function () {

      N.notifier({
        message: L[L.set].admin.login.success,
        type: 'success'
      });
    }, function () {

      N.notifier({
        message: L[L.set].admin.login.error,
        type: 'error'
      });
    });

  };

  a.initSetup = function(cb){

    http.post('/api/admin/setup?init=true')
    .then(cb, function(err){
      console.log('err');
    });
  };

  return a;
}])
.directive('propdrug', ["itemsService", function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
    element.typeahead({
      source: function(query, process){
        if(query === "all" || query === "ALL" || query === "All" || query === "*" ) return process(["All"]);
        return itemsService.getItemName(query,function(results, s){
          nx = s;
          return process(results);
        });
      },
      updater: function(name){
        _.some(nx, function(v,i){
          if(v.itemName === name){
            scope.bill.newrule.reference.id = v._id;
            scope.bill.newrule.reference.name = v.itemName;
            return true;
          }
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
.directive('propmedserv', ["serviceService", function(serviceService){
  var linker = function(scope, element, attrs){
    var nx;
    element.typeahead({
      source: function(query, process){
        if(query === "all" || query === "ALL" || query === "All" || query === "*" ) return process(["All"]);
        return serviceService.getItemName(query,function(results, s){
          console.log(results);
          nx = s;
          return process(results);
        });
      },
      updater: function(name){
        _.some(nx, function(v,i){
          if(v.name === name){
            scope.bill.newrule.reference.id = v._id;
            scope.bill.newrule.reference.name = v.name;
            return true;
          }
        });
        scope.$apply();
        return name;
      }
    });
  };
  return {
    link: linker
  };
}]);