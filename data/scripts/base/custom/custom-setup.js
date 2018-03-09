/* Function for displaying notifications */
/* Ex. usage: addNotifications("This is an informational message", "info") */
(function ($) {
    $.extend(Notify.prototype, {
        styleDismiss: function () {
            this.$ele.find('[data-notify="dismiss"]').css({
                right: 0,
                top: 0,
                zIndex: this.settings.z_index + 2
            });
        }
    });
});
function addNotification(message, type){
    const SCREEN_XS_MAX = 767;
    const DEFAULT_OFFSET = 100;
    var BOTTOM_LEFT_OFFSET = 20;
    try {
        BOTTOM_LEFT_OFFSET = parseInt($('.page-content').eq(0).css('padding-left'));
    } catch(err) {}

    var highestZIndex = 1;
    if ($('.modal').length) {
        var highestZIndex = findHighestZIndex('div');
    }

    var notificationClass = 'notification-default';
    if (type === 'black') {
        notificationClass = 'notification-bottom-left';
    }

    var fontawesomeIcons = {
        "info": "fa-info-circle",
        "info-full-color": "fa-info-circle",
        "success": "fa-check-circle",
        "success-full-color": "fa-check-circle",
        "warning": "fa-warning",
        "warning-full-color": "fa-warning",
        "danger": "fa-exclamation-circle",
        "danger-full-color": "fa-exclamation-circle"
    };

    if (message.indexOf('fa fa') == -1) {
        var dummyMessage = message;
        message = '<i class="fa ' + fontawesomeIcons[type] + '"></i>' + dummyMessage;
    }

    var defaultOptions = {
        type: type,
        template: '<div data-notify="container" class="col-xs-11 col-sm-4 alert alert-{0} ' + notificationClass + '" role="alert" style="z-index: ' + highestZIndex + '"><button type="button" aria-hidden="true" class="close" data-notify="dismiss"><i class="fa fa-remove"></i></button><span data-notify="icon"></span> <span data-notify="title">{1}</span> <span data-notify="message">{2}</span><div class="progress" data-notify="progressbar"><div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div></div><a href="{3}" target="{4}" data-notify="url"></a></div>',
        placement: {
            from: 'top',
            align: 'center'
        },
        offset: {
            y: DEFAULT_OFFSET
        },
        z_index: highestZIndex,
        animate: {
            enter: 'animations scaleIn',
            exit: 'animations scaleOut'
        }
    };

    if (type === 'black') {
        defaultOptions.placement = {
            from: 'bottom',
            align: 'left'
        };

        defaultOptions.offset.y = ($('.footer-content').eq(0).outerHeight() + BOTTOM_LEFT_OFFSET);

        if (window.innerWidth > SCREEN_XS_MAX) {
            defaultOptions.offset.x = $('#sidebar').outerWidth() + BOTTOM_LEFT_OFFSET;
        } else {
            defaultOptions.offset.x = BOTTOM_LEFT_OFFSET;
        }
    }

    var notify = $.notify(message, defaultOptions);
}
function realignNotifications() {
    const SCREEN_XS_MAX = 767;
    var BOTTOM_LEFT_OFFSET = 20;
    try {
        BOTTOM_LEFT_OFFSET = parseInt($('.page-content').eq(0).css('padding-left'));
    } catch(err) {}

    if (window.innerWidth > SCREEN_XS_MAX) {
        $('.notification-bottom-left').css({
            'left': ($('#sidebar').outerWidth() + BOTTOM_LEFT_OFFSET)
        });
    } else {
        $('.notification-bottom-left').css({
            'left': BOTTOM_LEFT_OFFSET
        });
    }
}

function hideBodyOverlayer() {
    $('.modal-backdrop').addClass('hidden');
}

function activateDraggableForModal($modal) {
    $modal.find('.modal-content:first').draggable({
        containment: 'body',
        cancel : '.modal-body'
    });
}

/* Function for finding the highest z-index */

function findHighestZIndex(elem) {
    var elems = document.getElementsByTagName(elem);
    var highest = 0;
    for (var i = 0; i < elems.length; i++) {
        var zindex = document.defaultView.getComputedStyle(elems[i], null).getPropertyValue("z-index");
        if ((zindex > highest) && (zindex != 'auto')) {
            highest = zindex;
        }
    }
    return highest;
}

/* Function for enabling/disabling a blocking overlay */

function showThisLoader(type, colorClass) {
    type = typeof type !== 'undefined' ? type : "dots";
    colorClass = typeof colorClass !== 'undefined' ? colorClass : 'dark';

    var loader = {
        dots :  '<div class="loader-dots '+ colorClass +'">' +
        '<div class="sk-bounce1"></div>' +
        '<div class="sk-bounce2"></div>' +
        '<div class="sk-bounce3"></div>' +
        '</div>',
        cubeGrid :  '<div class="loader-cube-grid '+ colorClass +'">' +
        '<div class="sk-cube sk-cube1"></div>' +
        '<div class="sk-cube sk-cube2"></div>' +
        '<div class="sk-cube sk-cube3"></div>' +
        '<div class="sk-cube sk-cube4"></div>' +
        '<div class="sk-cube sk-cube5"></div>' +
        '<div class="sk-cube sk-cube6"></div>' +
        '<div class="sk-cube sk-cube7"></div>' +
        '<div class="sk-cube sk-cube8"></div>' +
        '<div class="sk-cube sk-cube9"></div>' +
        '</div>',
        fadingCircle:   '<div class="loader-fading-circle '+ colorClass +'">' +
        '<div class="sk-circle1 sk-circle"></div>' +
        '<div class="sk-circle2 sk-circle"></div>' +
        '<div class="sk-circle3 sk-circle"></div>' +
        '<div class="sk-circle4 sk-circle"></div>' +
        '<div class="sk-circle5 sk-circle"></div>' +
        '<div class="sk-circle6 sk-circle"></div>' +
        '<div class="sk-circle7 sk-circle"></div>' +
        '<div class="sk-circle8 sk-circle"></div>' +
        '<div class="sk-circle9 sk-circle"></div>' +
        '<div class="sk-circle10 sk-circle"></div>' +
        '<div class="sk-circle11 sk-circle"></div>' +
        '<div class="sk-circle12 sk-circle"></div>' +
        '</div>'
    };

    if(loader[type] == undefined) {
        return type;
    } else {
        return loader[type];
    }

};

(function ( $ ) {
    $.fn.blockControl = function(options) {
        var pageOverlay = false;
        var settings = $.extend({
            // These are the defaults.
            loadingIconType: "dots",
            iconColorClass: "dark",
            overlayColor: "#fff",
            target: this,
            blurElement: null
        }, options);

        if(settings.blurElement){
            $(settings.blurElement).blur();
        }


        if(settings.target.selector == "body" || settings.target.selector == "html") {
            var pageOverlay = true;
        }

        function conditionalMessage(settings, pageOverlay){
            if (pageOverlay) {
                return '<div class="lock-center fixed">'+ showThisLoader(settings.loadingIconType, settings.iconColorClass) +'</div>'
            } else {
                return showThisLoader(settings.loadingIconType, settings.iconColorClass)
            }
        }

        $(settings.target).block({
            message: conditionalMessage(settings, pageOverlay),
            css: {
                border: 'none',
                padding: '0',
                backgroundColor: 'transparent',
                '-webkit-border-radius': '0',
                '-moz-border-radius': '0',
                width: "auto"

            },
            overlayCSS:  {
                backgroundColor: settings.overlayColor,
                opacity:         0.6,
                cursor:          'wait'
            },
            baseZ: 2000
        });
    };
}( jQuery ));

(function ( $ ) {
    $.fn.unblockControl = function(options) {
        $(this).unblock();

        var settings = $.extend({
            focusElement: null
        }, options);

        if(settings.focusElement){
            $(settings.focusElement).focus();
        }
    };

}( jQuery ));

(function ( $ ) {

    var browser = window.navigator.appName;
    var browserVersion = navigator.appVersion;
    var browserEngine = navigator.product;
    var platform = navigator.platform;

    console.log("Browser: " + browser + " | Version: " + browserVersion + " | Product: " + browserEngine + " | OS: " + platform);

}( jQuery ));

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

function addMoreActions(context) {
    $(context).find('.more-actions').each(function() {
        var drop = new Drop({
            target: $(this)[0],
            classes: 'drop-actions',
            content:    $(this).attr('data-content'),
            position: 'bottom right',
            openOn: 'click',
            constrainToWindow: true,
            constrainToScrollParent: false,
            tetherOptions: {
                offset: '-5px 0'
            }
        });
    });
}

function correctSummerNoteFullscreenDimensions($button) {
    var $noteEditor;
    if ($button) {
        $noteEditor = $button.parents('.note-editor.note-frame');
    } else {
        $noteEditor = $('.note-editor.note-frame').eq(0);
    }
    
    if ($noteEditor.hasClass('fullscreen')) {
        setTimeout(function () {
            $noteEditor.css({
                left: $('#sidebar').outerWidth(),
                top: $('.navbar.navbar-fixed-top').outerHeight(),
                width: ($(window).width() - $('#sidebar').outerWidth()),
                height: ($(window).height() - $('.navbar.navbar-fixed-top').outerHeight())
            });
            $noteEditor.find('textarea.note-codable, .note-editable').css({
                height: ($(window).height() - $('.navbar.navbar-fixed-top').outerHeight() - $noteEditor.find('.note-toolbar').outerHeight())
            })
        }, 0);
    } else {
        $noteEditor.css({
            left: '',
            top: '',
            width: '',
            height: ''
        });
    }
}

function displayFormFieldsErrors (form, fields) {
    var $form = $(form);
    var formName = $form.attr('name');
    $form.find('.has-error .help-block').remove();
    $form.find('.has-error').removeClass('has-error');

    for (var fieldIndex in fields) {
        var fieldData = fields[fieldIndex];
        var fieldName = fieldData.field.name || '';

        if (fieldName) {
            var messageTemplate = fieldData.message_template || '';
            var parameters = fieldData.parameters || {};
            var errorMessage = fieldData.message || '';

            if (messageTemplate && Translator && typeof Translator.trans === 'function') {
                var translatedErrorMessage = Translator.trans(messageTemplate, parameters);

                if (translatedErrorMessage !== messageTemplate) {
                    errorMessage = translatedErrorMessage;
                }
            }

            if ($form.find('[name="' + fieldName + '"]').length === 0) {
                var fieldNameParts = fieldName.split('.');
                var childFormNameParts = fieldNameParts[0].split('[');
                var childFormName = childFormNameParts[0] || '';
                var childFormIndex = childFormNameParts[1].replace(']', '') || '';
                var childFormFieldName = fieldNameParts[1] || '';

                fieldName = formName + '[' + childFormName + '][' + childFormIndex + '][' + childFormFieldName + ']';
            }

            $formGroup = $form.find('[name="' + fieldName + '"]').parents('.form-group');
            $formGroup.addClass('has-error');
            $formGroup.append('<div class="help-block">' + errorMessage + '</div>')
        }
    }
}

$(window).on('resize', function () {
    realignNotifications();
    correctSummerNoteFullscreenDimensions();
});

$(function() {
    $('body').on('click', '.note-editor.note-frame .note-toolbar .note-btn.btn-fullscreen, .note-editor.note-frame .note-toolbar .note-btn.btn-codeview', function () {
        correctSummerNoteFullscreenDimensions($(this));
    })
});

const colorScheme = {
    'brand_primary' : '#005eb7',
    'brand_info' : '#2790f3',
    'brand_success' : '#38833a',
    'brand_warning' : '#f4b350',
    'brand_danger' : '#e1302b',
    'black' : '#000000',
    'gray_76' : '#c3c3c3',
    'gray_80' : '#cccccc',
    'gray_87' : '#dedede',
    'gray_93' : '#eeeeee',
    'gray_96' : '#f6f6f6',
    'gray_98' : '#fafafa',
    'white' : '#ffffff',
}

$(function () {
    var elm = document.body;
    var lastHeight = elm.clientHeight;

    updateHeight(elm, lastHeight);
});

function updateHeight (elm, lastHeight) {
    var newHeight = elm.clientHeight;
    if (lastHeight != newHeight) {
        $(document.body).trigger('bodyHeightChanged');
    }

    lastHeight = newHeight;

    if (elm.onElementHeightChangeTimer) {
        clearTimeout(elm.onElementHeightChangeTimer);
    }

    elm.onElementHeightChangeTimer = setTimeout(function () {
        updateHeight(elm, lastHeight);
    }, 0);
}

