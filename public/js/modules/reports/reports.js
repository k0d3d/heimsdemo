/**
* reports Module
*
* Description
*/
angular.module('report', []).

config(['$routeProvider',function($routeProvider){
  $routeProvider.when('/reports', {templateUrl: '/reports/dashboard', controller: 'reportsDashboardController'});
}]).
controller('reportsDashboardController', ['$scope', '$http', '$location', 'ordersService', function($scope, $http, $location, ordersService){
  $scope.template = {
    url: 'templates/dashboard-report-tpl'
  };

}])
.controller('reportsLocation',['$scope','itemsService', 'reportsService', 'stockService', function($scope, itemsService, rS, sS){
    // Gets the stock down points from the server
    sS.getAllLocations(function(res){
      $scope.locations = res;
    });

    $scope.getReport = function(){
      rS.fetchReportbyLocation($scope.searchform, function(r){
        if(!_.isEmpty(r)){
          $scope.reports = r;
        }
      });
    };


}])
.factory('reportsService', ['$http', function($http){
  var r = {};

  r.fetchReportbyLocation = function( searchForm, cb){
    $http.get('/api/reports/location/?'+$.param(searchForm))
    .success(function(d){
      cb(d);
    })
    .error(function(err){
      cb(err);
    });
  };

  return r;
}])
.directive('locationItem', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
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
            scope.searchform.itemName = r.itemName;
            scope.searchform._id = r._id;
            // scope.form.suppliers = {
            //   supplierID : r.suppliers[0]._id,
            //   supplierName: r.suppliers[0].supplierName
            // };
            // scope.form.nafdacRegNo = r.nafdacRegNo;
            // scope.form.nafdacRegName = r.itemName;            
            // scope.summary = r;
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
;