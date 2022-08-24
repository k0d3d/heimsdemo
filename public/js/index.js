$(document).ready(function(){
     $(document).on('click','li.index',function(e){
        e.preventDefault();
        var totalOffset = 0;
        var ltr = $(this).text();
        var that = $('#section'+ltr).prevAll();
        $.each($(that), function(i, v){
            if(i){
                var w = $(v).outerWidth(true);
                totalOffset = totalOffset + w;
            }
        });
        totalOffset = totalOffset + $(that).outerWidth();
        var inpx = '-'+totalOffset+'px';
        $('.sectionAZ').css({"margin-left":inpx});
     });
     $(document).on('change', 'select.stockFilter', function(e){
        console.log(e);
        e.preventDefault();
        $('.card').show();
        var toHide = $(this).find('option:selected').val();
        console.log(toHide);
        if(toHide.length > 0)$('.card').not('.'+toHide).hide();
     });
    //$("select.select-block").selectpicker({style: 'btn-primary', menuStyle: 'dropdown-inverse'});
    $('#home.panorama').panorama({
       //nicescroll: false,
       showscrollbuttons: false,
       keyboard: true,
       parallax: false
    }); 
});