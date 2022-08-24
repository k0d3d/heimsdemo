// Some general UI pack related JS
// Extend JS String with repeat method
String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
};

(function($) {

  // Add segments to a slider
  $.fn.addSliderSegments = function (amount) {
    return this.each(function () {
      var segmentGap = 100 / (amount - 1) + "%"
        , segment = "<div class='ui-slider-segment' style='margin-left: " + segmentGap + ";'></div>";
      $(this).prepend(segment.repeat(amount - 2));
    });
  };

  $(function() {
  
    // Todo list
    $(".todo li").click(function() {
        $(this).toggleClass("todo-done");
    });

    // Custom Select

    // Tooltips
    $("[data-toggle=tooltip]").tooltip("show");

    // Tags Input
    $(".tagsinput").tagsInput();

    // Make pagination demo work
    $(".pagination a").on('click', function() {
      $(this).parent().siblings("li").removeClass("active").end().addClass("active");
    });

    $(".btn-group a").on('click', function() {
      $(this).siblings().removeClass("active").end().addClass("active");
    });

    // Disable link clicks to prevent page scrolling
    $('[href="#fakelink"]').on('click', function (e) {
      e.preventDefault();
    });

    $('.bell a').on('click', function(e){
      e.preventDefault();
    });

    // Switch
    $("[data-toggle='switch']").wrap('<div class="switch" />').parent().bootstrapSwitch();

    $('.md-close').on('click', function(e){
      $(this).parents('.md-modal').removeClass('md-show');
    });
    $('#home.panorama').panorama({
       //nicescroll: false,
       showscrollbuttons: false,
       keyboard: true,
       parallax: false
    });     
  });
  
})(jQuery);

var __cleanJSON = function(jsonObj){
  return JSON.stringify(jsonObj, function(k, v){
        if(k == '$$hashKey') return undefined;
        return v;
  });
};
$(document).on('click focus', 'input.editable-input', function(e){
  e.stopPropagation();
});
// $(document).on('click', function(e){
//   $('.on-edit').removeClass('on-edit');
//   $('.editable-input').remove();
// });