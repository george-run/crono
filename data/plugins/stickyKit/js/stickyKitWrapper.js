function initPhotonStick(container) {

    var $container = $(container || 'body');

    var stickSelector = ".stick";
    var $stickElements = $container.find(stickSelector);

    var offsetTop = $('.navbar-fixed-top').outerHeight();

    //Min extra height for sticky parent element, if is less the stick element does not work correctly
    var MIN_HEIGHT_STICKY_PARENT_ELEMENT = 3;
    var RECALCULATION_INTERVAL = 50;

    resetStickElementsToDefault($stickElements);

    $.each($stickElements, function () {
        var $this = $(this);
        var parents = $this.parents();
        var isHidden = false;

        $.each(parents, function() {
            if($(this).css('display') == 'none'){
                isHidden = true;
                return;
            }
        });

        if(!isHidden){
            $this.parent().css({'min-height': calculateMinHeightOfElement($this)});
            var $siblingsAndChildren = $this.parent().find(stickSelector);

            $siblingsAndChildren.each(function () {
                setPositionTop(this, $this);
            });

            $($siblingsAndChildren.get().reverse()).each(function (index) {
                setMinPosibleIndex(this, index);
            });

            addOffsetTopValue(this);
        }
    });

    setMaxIndexToAllElementSticked();

    $(document.body).on('click', '.stick-with-no-parent', function () {
        setMaxIndexToChildren(this);
    });

    $(window).off('scroll', setMaxIndexToAllElementSticked);
    $(window).on('scroll', setMaxIndexToAllElementSticked);

    function setMaxIndexToAllElementSticked() {
        $('.stick-with-no-parent').each(function () {
            setMaxIndexToChildren(this);
        });
    }

    function calculateMinHeightOfElement($this){
        return $this.outerHeight() + MIN_HEIGHT_STICKY_PARENT_ELEMENT;
    }

    function setMaxIndexToChildren(stickyContainer) {
        var highestIndex = getMaxIndexOfChildren(stickyContainer);
        $(stickyContainer).find(stickSelector).each(function () {
            var minPosibleIndex = this.minPosibleIndex;
            $(this).css({'z-index': minPosibleIndex + highestIndex});
        });
    }

    function getMaxIndexOfChildren(stickyContainer) {
        var highestIndex = 0;
        $(stickyContainer).find('input, div, select, ul').not(stickSelector).each(function () {
            var currentIndex = parseInt($(this).css("zIndex"), 10);
            if (currentIndex > highestIndex) {
                highestIndex = currentIndex;
            }
        });
        return highestIndex;
    }

    function addOffsetTopValue(stickElement) {
        $stickElement = $(stickElement);

        if (stickElement.posTop) {
            $stickElement.stick_in_parent({'offset_top': offsetTop + stickElement.posTop - parseInt($stickElement.css("marginTop")), 'recalc_every': RECALCULATION_INTERVAL}); //if RECALCULATION_INTERVAL = 1, the unstick event will not be triggered
        } else {
            //has no parent
            $stickElement.parent().addClass('stick-with-no-parent');
            $stickElement.stick_in_parent({'offset_top': offsetTop - parseInt($stickElement.css("marginTop")), 'recalc_every': RECALCULATION_INTERVAL}); //if RECALCULATION_INTERVAL = 1, the unstick event will not be triggered
        }
    }

    function setMinPosibleIndex(siblingAndChildren, index) {
        var minPosibleIndex = index + 1;
        siblingAndChildren.minPosibleIndex = minPosibleIndex;
    }

    function setPositionTop(siblingAndChildren, $stickElement) {
        //if is not current obj
        if (!$(siblingAndChildren).is($stickElement)) {
            if (siblingAndChildren.posTop) {
                siblingAndChildren.posTop += $stickElement.outerHeight();
            } else {
                siblingAndChildren.posTop = $stickElement.outerHeight();
            }
        }
    }

    function resetStickElementsToDefault($stickElements){
        $(document.body).off('click', '.stick-with-no-parent');
        $.each($stickElements, function() {
            this.posTop = null;
            this.minPosibleIndex = null;
            $this = $(this);
            $this.trigger("sticky_kit:detach");
            $this.parent().removeClass('stick-with-no-parent');
        });
    }
}

$(window).on('minimize.photon.sidebar maximize.photon.sidebar hidden.bs.collapse hidden.bs.tab shown.bs.collapse shown.bs.tab show.bs.tab show.bs.collapse resize', function () {
    setTimeout(function () {
        $(document.body).trigger("sticky_kit:recalc");
    }, 0)
});

$(document.body).on('click', '.tool', function (event) {
    $.each($(event.target).closest('.panel').find('.ui-jqgrid-hdiv'), function (index, value) {
        var _this = $(this);
        setTimeout(function () {
            var $tableBody = _this.parent().find('.ui-jqgrid-bdiv');
            _this.scrollLeft($tableBody.scrollLeft());
        }, 100)
    });
});