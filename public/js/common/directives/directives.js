/* Directives */
  /**
  * directives Modules
  *
  * Description
  */
  var appDirectives = angular.module('directives', []);
  appDirectives.directive('typeAhead',function(ordersService, itemsService){
    var ser;

    var linker = function(scope, element, attrs){
        ser = {
          suppliername : ordersService.getSupplierName,
          itemname : itemsService.getItemName,
          nafdacdrugs: itemsService.getNafdacDrug
        };
        scope.selectedItem ={
          suppliername: '',
          itemname: '',
          nafdacDrug: ''
        };
        element.typeahead({
          source: function(query, process){
            return ser[attrs.thName](query,function(results, s){
              ser.listOfItems = s;
              return process(results);
            });
          },
          updater: function(item){
            var selectedItemId = _.find(ser.listOfItems, function (name) {
              return name.itemName === item;
            });
            scope.selectedItem[attrs.thName] = selectedItemId;

            if (scope.typeAction === 'add_grouped_item') {
              scope.form.groupedItems = scope.form.groupedItems || [];
              scope.form.groupedItems.push({
                itemName: selectedItemId.itemName,
                itemId: selectedItemId._id
              });
            }

            scope.$apply();
            return item;
          }
        });
    };
    return{
      restrict: 'A',
      link: linker,
      controller: 'dispensaryController',
      scope: {
        typeAction: '@',
        form: '=typeAhead',
        selectedItem: '='
      }
    };
  });
  appDirectives.directive('onFinish',function($timeout){
    return {
      restrict: 'A',
      link: function(scope, element, attr){
        if(scope.$last === true){
          $timeout(function(){
            switch (attr.onFinish){
              case "panorama":
                $('.panorama').panorama({
                   //nicescroll: false,
                   showscrollbuttons: false,
                   keyboard: true,
                   parallax: false
                });
              break;
              case "tableheader":
                $('table.table').fixedHeader();
              break;
              case "checkViewState":
                scope.$emit('onFinishLoaded', true);
              break;
              default:
              break;
            }
          });

        }
      }
    };
  });
  appDirectives.directive('modalbox', [function(){
    return {
      link: function($scope, iElm, iAttrs, controller) {
        $(iElm).on('click',function(){
          $('#mopop').modal('show');
        });
      }
    };
  }]);
  /**
  * directives Module
  *
  * Description
  */
  appDirectives.directive('toggleActiveList', [function(){
    // Runs during compile
    return {
      link: function($scope, iElm, iAttrs, controller) {
        iElm.on('click','li',function(e){
          e.preventDefault();
          $('ul.list-block li').removeClass('active');
          $(e.currentTarget).addClass('active');
        });
      }
    };
  }]);
  appDirectives.directive('orderActionButton', function(ordersService){
    function getStatus (status){
        var d;
        switch(status){
          case 'pending order':
            d = 'supplied';
            //scope.orders[attrs.thisIndex].next ="Supplied";
          break;
          case 'supplied':
            d = 'paid';
            //scope.orders[attrs.thisIndex].next ="Paid";
          break;
          case 'paid':
           d = 'Complete';
          break;
          case 'received':
           d = 'paid';
          break;
          default:
          break;
        }
        return d;
    }

    return {
      link: function(scope, element, attrs, controller){
        var invoiceNo, index;
        //Observe index
        attrs.$observe('index', function(newValue){
          index = newValue;
          scope.kush.next = getStatus(scope.kush.orderStatus);
          //bindEmAll(index, scope, element);
          //console.log(scope.kush);
        });

        //Bind to
        element.on('click', function(e){
          e.preventDefault();

          var o ={
            status : getStatus(scope.kush.orderStatus),
            itemData : scope.kush.itemData[0],
            amount : scope.kush.orderAmount,
            order_id : scope.kush._id,
            invoiceno : scope.kush.orderInvoice,
            amountSupplied: scope.kush.amountSupplied
          }
          //scope.$apply();
          ordersService.updateOrder(o, function(r){
            scope.kush.orderStatus = r.result;
            scope.kush.next = getStatus(r.result);
            console.log(r);
          });
        });
      },
      scope : {
        kush : "="
      }
    };
  });

  appDirectives.directive('tooltip', function(){
      return {
          link: function(scope, element, attrs){
              element.tooltip({
                placement: attrs.tooltipPosition || 'top'
              });
          }
      }
  });

  appDirectives.directive('scrollBar', function(){
      return {
          link: function(scope, element, attrs){
            //if(attrs.activate)
              $(element).on('scrollbar', function(){
                  if(element.height() >= attrs.maxContainerHeight){
                      element.slimScroll({
                          height: attrs.maxContainerHeight+'px',
                          distance: '0'
                      });
                  }
              });
          }
      };
  });
  appDirectives.directive('pagination', [function(){
    function link(scope, element, attrs){
      scope.pageno = 0;
      scope.limit = 10;
      $('button.prevbtn', element).on('click', function(e){
        var page = scope.pageno - 1;
        if(scope.pageno === 1) return false;
        scope.pageTo({pageNo: page, limit: scope.limit, cb: function(r){
          if(r) scope.pageno--;
        }});
      });
      $('button.nextbtn', element).on('click', function(e){
        var page = scope.pageno + 1;
        scope.pageTo({pageNo: page, limit: scope.limit, cb: function(r){
          if(r) scope.pageno++;
        }});
      });
      scope.pagelimit = function(limit){
        scope.pageTo({pageNo: scope.pageno, limit: limit, cb: function(r){
          if(r) scope.limit = limit;
        }});
      };
    }
    return {
      link: link,
      scope: {
        pageTo: '&'
      },
      templateUrl: '/templates/pagination'
    };
  }]);
  appDirectives.directive('panorama', function(){
    return {
      link: function (scope, element, attrs){
        element.panorama({
           //nicescroll: false,
           showscrollbuttons: false,
           keyboard: true,
           parallax: false
        });
      }
    };
  });
  appDirectives.directive('editable', [function(){
    function link(scope, element, attrs){

      // $(document).on('focusout','.editable-input', function(e){
      //   var changed = $(e.currentTarget).val();
      //   if(changed.length > 0){
      //     console.log(attrs.index);
      //   }
      // });
      element.on('click', function(e){
        var ct = e.currentTarget;

        if($(ct).hasClass('on-edit')) return false;
        $('<input type="text" focus class="editable-input" placeholder="'+$(element).text()+'">').insertAfter(ct);
        $(ct).addClass('on-edit');

        var inputElement = $(element).next('input.editable-input')[0];
        $(inputElement).one('focusout', function(e){
          var changed = $(e.currentTarget).val();
          if(changed.length > 0){
            scope.lcn({name: changed, index: attrs.index});
          }
          $(ct).removeClass('on-edit');
          inputElement.remove();
        });
      });
    }
    return {
      link:link,
      scope: {
        lcn: '&editable'
      }
    };
  }]);

appDirectives.directive('printable', [
  '$compile',
  '$http',
  '$timeout',
  function($compile, $http, $timeout){
  var template = '';

  function link (scope, element, attrs){
    var templateFile = attrs.printTpl;
    var toPrint = '#'+attrs.printable;
    element.on('click', function(e){
      scope.checkfunc({cb: function(r){
        if(!r) return false;
        //Remove the print-div html if
        //it exist in the DOM
        $('.print-div', toPrint).remove();

        //Get the HTML for the target (element to be printed ) DOM element
        var sourceHTML = $(toPrint).html();

        //Create a new DOM element
        var target = $('<div>').addClass('print-div');
        return;
        //Fetch the template from the server
        $http.get('/templates/'+templateFile+'-tpl.jade')
        .success( function(data){
          //Add the template returned
          template = $compile(data)(scope);

          //insert the template into the new DOM element
          target.html(template);

          //Add the new DOM element to the
          //source DOM element container
          $(toPrint).append(target);

          //Fix the order sheet html into the template
          $('.print-div', toPrint).find('.source-html').html(sourceHTML);

          //Remove elements we dont want in our print-out
          $('.print-div', toPrint).find('.noprint').remove();

          $timeout(function(){
            var w = window.open('');
            //var w = $window.open(null, 'PrintWindow', "width=420,height=230,resizable,scrollbars=yes,status=1");
            // $(w.document.body).html($('.print-div', toPrint).html());
          }, 500);
        });
      }});
    });

  }
  function printfunc(){

  }
  return {
    //templateUrl: '/templates/supplier-cart-tpl.jade',
    link: link,
    controller: printfunc,
    scope: {
      printable: '@',
      printTpl: '@',
      printScope: '=',
      checkfunc: '&'
    }
  };
}]);
