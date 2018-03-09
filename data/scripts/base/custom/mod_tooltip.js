+function ($, document) {
    "use strict";

    $(function () {
        $('[data-toggle="tooltip"]').tooltip({
            container: 'body'
        });
    });

    $(document.body).on('shown.bs.tooltip', '[data-toggle="tooltip"]', function (e) {
        var $target = $(e.target);
        var tooltipType = $target.data('type');
        var tooltipContainer = $(this).attr('aria-describedby');
        $('#' + tooltipContainer).addClass('tooltip-' + tooltipType);
    })
}(jQuery, document);