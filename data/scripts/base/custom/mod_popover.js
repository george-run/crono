+function ($, document) {
    "use strict";

    $(function () {
        $('[data-toggle="popover"]').popover({
            container: 'body'
        });
    });

    $(document.body).on('shown.bs.popover', '[data-toggle="popover"]', function (e) {
        var $target = $(e.target);
        var popoverType = $target.data('type');
        var popoverContainer = $(this).attr('aria-describedby');
        $('#' + popoverContainer).addClass('popover-' + popoverType);
    })
}(jQuery, document);