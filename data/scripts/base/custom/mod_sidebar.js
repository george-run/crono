/* ========================================================================
 * Photon Admin: mod_sidebar.js v1.0.0
 *
 * ========================================================================
 * Copyright 2011-2016 eMAG, Inc.
 * Licensed under MIT
 * ======================================================================== */

function initScrollbarForSidebar() {
    $('#sidebar .sidebar-outer').customScrollbar({
        skin: 'default-skin',
        hScroll: false,
        updateOnWindowResize: true
    });
}

function updateScrollbar() {
    $('#sidebar .sidebar-outer').customScrollbar('resize', true);
}

function newScrollbarHeight($sidebarInner, $menuItem) {
    var rowHeight = $('.sidebar-inner > .menu-item:first-of-type').outerHeight();
    return Math.max(
        ((rowHeight * ($sidebarInner.find(' > .menu-item').index($menuItem) + 1)) + $menuItem.find('.sidebar-submenu').outerHeight()),
        $sidebarInner.height()
    );
}

function updateSidebarHeight() {
    var $sidebarInner = $('#sidebar .sidebar-inner');

    $sidebarInner.css('height', '');
    var $sidebarInner = $('#sidebar .sidebar-inner');
    var $firstActiveMenuItem = $('#sidebar .menu-item.active').eq(0);
    var newHeight = newScrollbarHeight($sidebarInner, $firstActiveMenuItem);

    $sidebarInner.height(newHeight);
}

function updateSidebarHeightByMenuItem($menuItem) {
    var $sidebarInner = $('#sidebar .sidebar-inner');

    if ($menuItem.parent().hasClass('sidebar-inner')) {
        $sidebarInner.css('height', '');

        if ($menuItem.hasClass('active')) {
            var newHeight = newScrollbarHeight($sidebarInner, $menuItem);
            $sidebarInner.height(newHeight);
        }
    } else {
        if ($menuItem.hasClass('active')) {
            $sidebarInner.height($sidebarInner.height() + $menuItem.find('.sidebar-submenu').outerHeight());
        } else {
            $sidebarInner.height($sidebarInner.height() - $menuItem.find('.sidebar-submenu').outerHeight());
        }
    }
}

function staticNavigation(path) {
    path = (typeof path === 'undefined') ? window.location.pathname + window.location.hash : path;

    $('#sidebar .menu-item').removeClass('active');

    $('#sidebar .menu-item > a').each(function () {
        var href = $(this).attr('href');
        if (href == '#') {
            href = $(this).attr('data-href');
        }
        if (path === href) {
            $(this).parents('.menu-item-has-children').addClass('active');
            $(this).closest('.menu-item').addClass('active');
        }
    });

    $(window).resize();
}

function initSidebarEvents() {
    /**
     * Jquery objects for sidebar
     * @type {*|HTMLElement}
     */
    var $toggleNavBtn = $('#toggle-nav-btn');
    var $sidebar = $('#sidebar');
    var $toggleSidebarBtn = $('#toggle-sidebar-btn');
    var $document = $(document);
    /**
     * CSS Classes that trigger the submenu collapse
     * @type {string}
     */
    var menuItemHasChildrenCssClass = '.menu-item-has-children';

    const SCREEN_XS_MAX = 767;

    /**
     * Sidebar elements
     * @event click
     */
    $sidebar.on('click', '.menu-item a', function (e) {
        if ($(this).attr('href') == '#') {
            e.preventDefault();
        }
        var element = $($(this).parents('.menu-item')[0]);

        $sidebar.find('.menu-item').not('.menu-item-has-children').removeClass('active');
        if (element.hasClass('active')) {
            element.removeClass('active');
            element.find(menuItemHasChildrenCssClass).removeClass('active');
        }
        else {
            element.parent().find(menuItemHasChildrenCssClass).removeClass('active');
            element.addClass('active');
        }
    });
    /**
     * Collapse sidebar using the dedicated button from the bottom (Only on desktop/tablet)
     * @event click
     */
    $sidebar.on('click', '#toggle-sidebar-size-btn', function (e) {
        e.preventDefault();
        var $sidebarInner = $('#sidebar .sidebar-inner');

        $(this).find('.menu-icon').toggleClass('fa-arrow-right fa-arrow-left');
        if($sidebar.hasClass('sidebar-min')) {
            $sidebar.removeClass('sidebar-min');
            $(window).trigger('maximize.photon.sidebar');
            setCookie('sidebarStatus', 'open');

            $sidebarInner.css('height', '');
        } else {
            $sidebar.addClass('sidebar-min');
            $(window).trigger('minimize.photon.sidebar');
            setCookie('sidebarStatus', 'close');

            updateSidebarHeight();
        }
        updateScrollbar();
        $(window).resize();
        realignNotifications();
    });
    /**
     * Open/Close sidebar by using the "#toggle-sidebar-btn" button from the main navigation (Only on mobile)
     * @event click
     */
    $document.on('click', '#toggle-sidebar-btn', function (e) {
        e.preventDefault();
        $(this).toggleClass('btn-primary');

        if($sidebar.hasClass('open')) {
            $sidebar.removeClass('open');
            $(window).trigger('close.photon.sidebar');
        } else {
            $sidebar.addClass('open');
            $(window).trigger('open.photon.sidebar');
        }

        if($toggleNavBtn.hasClass('btn-primary')) {
            $toggleNavBtn.toggleClass('btn-primary');
            $toggleNavBtn.find('i.fa').toggleClass('fa-chevron-down fa-chevron-up');
        }
        $('#main-nav').collapse('hide');
    });
    /**
     * Close sidebar on mobile when click out of sidebar
     * @event click
     */
    $document.on('click', function (e) {
        if (!$(e.target).closest('#sidebar, #toggle-sidebar-btn').length) {
            $sidebar.removeClass('open');
            if($toggleSidebarBtn.hasClass('btn-primary')){
                $toggleSidebarBtn.removeClass('btn-primary');
            }
        }
    });

    /** Function to toggle the navbar minimization */
    $(document).on('click', '#toggle-nav-btn', function (e) {
        e.preventDefault();
        $(this).toggleClass('btn-primary');
        $(this).find('i.fa').toggleClass('fa-chevron-down fa-chevron-up');
    });

    $(document).on('click', '.menu-item > a, .menu-item > .menu-item-data > a', function (e) {
        if ($('#sidebar').hasClass('sidebar-min')) {
            var $menuItem = $(this).parents('.menu-item').eq(0);
            updateSidebarHeightByMenuItem($menuItem);
        }

        updateScrollbar();
    });

    $document.on('ready', function () {
        var sidebarStatus = getCookie('sidebarStatus');

        if (sidebarStatus == '') {
            setCookie('sidebarStatus', 'open');
        } else {
            if (sidebarStatus == 'close' && window.innerWidth > SCREEN_XS_MAX) {
                $sidebar.addClass('sidebar-min');
                $sidebar.find('#toggle-sidebar-size-btn .menu-icon').removeClass('fa-arrow-left').addClass('fa-arrow-right');
            }
        }
    });

    $(window).on('resize', function () {
        var sidebarStatus = getCookie('sidebarStatus');
        var $sidebarInner = $('#sidebar .sidebar-inner');

        if (sidebarStatus == 'close' && window.innerWidth > SCREEN_XS_MAX) {
            $sidebar.addClass('sidebar-min');
            $sidebar.find('#toggle-sidebar-size-btn .menu-icon').removeClass('fa-arrow-left').addClass('fa-arrow-right');
            updateSidebarHeight();
        } else {
            $sidebar.removeClass('sidebar-min');
            $sidebar.find('#toggle-sidebar-size-btn .menu-icon').removeClass('fa-arrow-right').addClass('fa-arrow-left');
            $sidebarInner.css('height', '');
        }
    })
}

+function ($) {
    initScrollbarForSidebar();
    initSidebarEvents();
}(jQuery);