/**
*  Module
*
* Description
*/
angular.module('dashboard', [])

.config(['$routeProvider', function ($routeProvider){
	$routeProvider.when('/', {templateUrl: '/home/index', controller: 'dashboardIndexController'});
}])
.controller('dashboardIndexController', ['$scope', 'stockService', 'ordersService', function($scope,stockService,ordersService){
	stockService.count(function(data){
		$scope.itemsCount = data;
	});
	ordersService.count(function(data){
		$scope.ordersCount = data;
	});
}])
.controller('dashboardOrderController', function(){
	
});
