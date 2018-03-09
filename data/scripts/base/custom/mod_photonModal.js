/**
 * Created by valentin.bica on 02.12.2015.
 */
(function(window, $) {
    "use strict";

    /**
     * ------------------- Private variables that can only be accessed from this execution context -------------------
     */
    /**
     * The container id where the modal will pe appended
     * @private
     * @type {String}
     */
    var _containerId = 'pop_space';
    /**
     * Html template for modal
     * @private
     * @type {String}
     */
    var _template = '';
    /**
     * Types of modal that have a special styling. These modals will have a background change
     * @private
     * @type {Array}
     */
    var _modalNotificationType = ['has-error', 'has-warning', 'has-info', 'has-success'];
    /**
     * Savel label text
     * @private
     * @type {String}
     */
    var _saveLabel = (typeof Translator != "undefined" ? Translator.trans('label.save') : "Save");
    /**
     * Cancel label text
     * @private
     * @type {String}
     */
    var _cancelLabel = (typeof Translator != "undefined" ? Translator.trans('label.cancel') : "Cancel");
    /**
     * OK label text
     * @private
     * @type {String}
     */
    var _okLabel = (typeof Translator != "undefined" ? Translator.trans('label.ok') : "OK");
    /**
     * Allow label text
     * @private
     * @type {String}
     */
    var _allowLabel = (typeof Translator != "undefined" ? Translator.trans('label.allow') : "Allow");
    /**
     * Deny label text
     * @private
     * @type {String}
     */
    var _denyLabel = (typeof Translator != "undefined" ? Translator.trans('label.deny') : "Deny");
    /**
     * Show modal loader variable
     * @private
     * @type {Boolean}
     */
    var _loaderIsVisible = false;

    /**
     * ------------------------- Create private functions and bind the behaviour to PhotonModal -------------------------
     * Create modal hide and show callbacks
     */
    function buildModalEventsCallbacks() {
        setHideCallback.call(this, this.defaults.hideCallback || function(){});
        setShowCallback.call(this, this.defaults.showCallback || function(){});
    }
    /**
     * This is a container used for setting custom events on modals
     */
    function createCustomEvents() {

        var $this = this;
        /**
         * When user inserts content into modal through ajax the modal should show NOT when .show() function is called BUT
         * when the content is received so a special event is needed
         */
        $(document).on('showModalAfterDomRenderedEvent', "#" + $this.defaults.id, function () {
            $this._isVisible ? $("#" + $this.defaults.id).modal('show') : '';
        });
        /**
         * Event for submitting the form
         * @event click
         */
        $(document).on('click', "." + $this.defaults.id + 'btnSubmit', function () {
            saveFormActionUsingAjax.call($this);
        });
        /**
         * Show modal loader
         * @event showModalLoader
         */
        $(document).on('showModalLoader', "#" + $this.defaults.id, function () {
            _loaderIsVisible = true;
            var modalBody = $("#" + $this.defaults.id).find('.modal-body');
            $(modalBody).addClass('pad-top-40').blockControl();
        });
        /**
         * Hide modal loader
         * @event hideModalLoader
         */
        $(document).on('hideModalLoader', "#" + $this.defaults.id, function () {
            _loaderIsVisible = false;
            var modalBody = $("#" + $this.defaults.id).find('.modal-body');
            $(modalBody).removeClass('pad-top-40').unblockControl();
        });
    }
    /**
     * Set callback for show and shown event
     * @param showCallback
     */
    function setShowCallback (showCallback) {
        var $this = this;
        $(document).on("shown.bs.modal", "#" + this.defaults.id, function (e) {
            showCallback(e);
           _loaderIsVisible ? $("#" + $this.defaults.id).trigger('showModalLoader') : '';
        });
    }
    /**
     * Set callback for hidden event
     * @param hiddenCallback
     */
    function setHideCallback (hiddenCallback) {
        var $this = this;
        $(document).on("hidden.bs.modal", "#" + this.defaults.id, function (e) {
            $this._isVisible = false;
            window.alertModalDisplayed = false;
            hiddenCallback(e);
        });
    }
    /**
     * Create modal and insert content from request using ajax
     */
    function createModalUsingAjax () {

        var $this = this;
        buildStaticModal.call(this);
        $this.setModalLoader(true);

        $.ajax($this.defaults.ajaxModalParams).done(function (data) {
            $this.defaults.content = data;
            $this.setModalContent(data);
            $("#" + $this.defaults.id).trigger('hideModalLoader');
            $this.defaults.ajaxDoneCallback(data);
        }).fail(function (data) {
            $this.defaults.ajaxFailCallback(data);
        }).always(function() {

        });
    }
    /**
     * Save form function
     */
    function saveFormActionUsingAjax () {

        var $this = this;
        /**
         * Append options to ajax request or override default ones for creating the ajax request
         */
        $this.defaults.ajaxFormSubmitParams.data = new FormData($("#" + $this.defaults.id).find('form')[0]);
        $this.defaults.ajaxFormSubmitParams.processData =  false;
        $this.defaults.ajaxFormSubmitParams.cache = false;
        $this.defaults.ajaxFormSubmitParams.contentType = false;

        var submitBtn = $("." + $this.defaults.id + 'btnSubmit');
        var modalBody = $("#" + $this.defaults.id).find('.modal-body');

        $(submitBtn).blockControl();
        $("#" + $this.defaults.id).trigger('showModalLoader');

        $.ajax($this.defaults.ajaxFormSubmitParams).done(function (data) {
            /**
             * Custom callback
             */
            $this.defaults.ajaxSubmitDoneCallback(data);
            $this.setModalContent(data);
            $("#" + $this.defaults.id).trigger('hideModalLoader');
        }).fail(function (data) {
            /**
             * Custom callback
             */
            $this.defaults.ajaxSubmitFailCallback(data);
        }).always(function() {
            $(submitBtn).unblockControl();
            $this.initPlugins(modalBody);
        });

    }
    /**
     * Create html for modal
     */
    function buildStaticModal() {
        /**
         * Buttons html variable
         * @type {string}
         */
        var buttonsHtml = '';
        /**
         * Buttons in modal. Override them if user sent them in constructor
         */
        var buttons = this.defaults.buttons || this.geFormStylingJson().buttons;
        /**
         * Type of modal
         * @type {string|string|string|string|string}
         */
        var classOfModal = this.geFormStylingJson().class;

        /**
         * Create buttons html having the following cases:
         * - if the button json have the key 'formSubmitter' on true than a special class is appended and an event for ajax submit is created for that class
         * - the following infos are appended also: button class, button icon, button label
         */
        for (var button in buttons) {
            buttonsHtml +=
                '<button class="btn ' + (buttons[button].formSubmitter ? this.defaults.id + 'btnSubmit ' : '')
                + buttons[button].class + '"' + (button == 'cancel' || buttons[button].closeModal ? 'data-dismiss="modal">' : '>')
                + '<span>' + (buttons[button].icon != undefined ? '<i class="' + buttons[button].icon + '"></i> ' : '') + buttons[button].label + '</span></button>';
        }

        /**
         * Close modal on click outside
         * @type {string}
         */
        var closeOnClickOutsideAttr = '';
        if(this.defaults.closeOnClickOutside == false) {
            closeOnClickOutsideAttr = ' data-backdrop="static" data-keyboard="false"';
        }
        /**
         * Close modal on click outside
         * @type {string}
         */
        var closeButtonHtml = '';
        if(this.defaults.showCloseButton == true) {
            closeButtonHtml = '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fa fa-remove"></i></span></button>';
        }

        /**
         * Footer text
         * @type {string}
         */
        var footerHtml = '';
        if (this.defaults.footerText != '' || buttonsHtml != '') {
            footerHtml = '<div class="modal-footer">' +
                '<div class="pull-left">' +
                this.defaults.footerText +
                '</div>' +
                '<div class="pull-right panel-controls">' +
                buttonsHtml +
                '</div>' +
                '</div>' + '<div class="pull-left"></div>';
        }
        /**
         * Create the html for the page and append it into container that has a containerId
         */
        _template =
            '<div class="modal fade" id="' + this.defaults.id + '" tabindex="-1" role="dialog" aria-labelledby="' +  this.defaults.id + 'Label' + '"' + closeOnClickOutsideAttr + '>' +
            '<div class="modal-dialog ' + (_modalNotificationType.indexOf(this.geFormStylingJson().class) !== -1 ? 'modal-feedback ' + (classOfModal ? ' ' + classOfModal : '') + ' ' : '') + this.getSizeCssClass() + '" role="document">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            closeButtonHtml +
            '<h4 class="modal-title" id="' + this.defaults.id + 'Label' + '">' + this.defaults.title + '</h4>' +
            '</div>' +
            '<div class="modal-body">' +
            this.defaults.content +
            '</div>' +
            footerHtml +
            '</div>' +
            '</div>' +
            '</div>';

        /**
         * If div already exists you should replace only the html and NOT append it again
         */
        if(this.defaults.recreateOnShow) {
            if($('#' + this.defaults.id).length) {
                $('#' + this.defaults.id).replaceWith(_template);
            }
            else {
                $('#' + _containerId).append(_template);
            }
        } else {
            if(!$('#' + this.defaults.id).length) {
                $('#' + _containerId).append(_template);
            }
        }
        $("#" + this.defaults.id).trigger('showModalAfterDomRenderedEvent');
    }
    /**
     * Create html for alert modal
     */
    function buildAlertModal() {
        /**
         * Display background overlay
         * @type {string}
         */
        var backdrop = (this.defaults.showBackgroundOverlay) ? 'static' : 'false';

        /**
         * Title
         * @type {string}
         */
        var titleClass = ' ' + this.getFormStylingJson().titleClass || '';

        /**
         * Title html variable
         * @type {string}
         */
        var titleHtml = '';
        if (this.defaults.title != '') {
            titleHtml = '<h4 class="modal-title alert-modal-title' + titleClass + '" id="' + this.defaults.id + 'Label' + '">' + this.defaults.title + '</h4>';
        }

        /**
         * Buttons in modal. Override them if user sent them in constructor
         */
        var buttons = this.defaults.buttons || this.getFormStylingJson().buttons;

        /**
         * Buttons html variable
         * @type {string}
         */
        var buttonsHtml = '';
        for (var button in buttons) {
            buttonsHtml +=
                '<button class="btn ' + buttons[button].class + '" data-dismiss="modal">' +
                '<span>' + (buttons[button].icon != undefined ? '<i class="' + buttons[button].icon + '"></i> ' : '') + buttons[button].label + '</span></button>';
        }

        /**
         * Footer text
         * @type {string}
         */
        var footerHtml = '';
        if (buttonsHtml != '') {
            footerHtml = '<div class="clearfix">' +
                '<div class="pull-right panel-controls">' +
                buttonsHtml +
                '</div>' +
                '</div>';
        }

        /**
         * Create the html for the page and append it into container that has a containerId
         */
        _template =
            '<div class="modal modal-alert fade" id="' + this.defaults.id + '" tabindex="-1" role="dialog" aria-labelledby="' +  this.defaults.id + 'Label' + '" data-backdrop="' + backdrop + '" data-keyboard="false">' +
            '<div class="modal-dialog ' + this.getSizeCssClass() + '" role="document">' +
            '<div class="modal-content">' +
            '<div class="modal-body">' +
            titleHtml +
            '<div class="alert-modal-content">' +
            this.defaults.content +
            '</div>' +
            footerHtml +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        if ($('#' + this.defaults.id).length) {
            $('#' + this.defaults.id).replaceWith(_template);
        } else {
            $('#' + _containerId).append(_template);
        }

        $("#" + this.defaults.id).trigger('showModalAfterDomRenderedEvent');
    }

    /**
     * @param options {Object} Json with options for modal
     * @constructor
     */
    var PhotonModal = function (options) {
        /**
         * Options used on class instantiation that will override default ones
         */
        /**
         * Default class options
         * @type {Object}
         */
        this.defaults = {
            /**
             * How the modal will be rendered. It accepts the following parameters: small, large, default size
             * @public
             * @type {String}
             */
             size: 'default',
            /**
             * Id of modal
             * @public
             * @type {String}
             */
            id: '',
            /**
             * Recreate modal on show
             * @public
             * @type {Boolean}
             */
            recreateOnShow: true,
            /**
             * Use ajax in modal
             * @public
             * @type {Boolean}
             */
            useAjax: false,
            /**
             *  Buttons for modal
             *  @public
             *  @type {Object}
             */
            buttons: '',
            /**
             * The content of the modal
             * @public
             * @type {String}
             */
            content: '',
            /**
             * Title of modal
             * @public
             * @type {String}
             */
            title: '',
            /**
             * Type of modal
             * @private
             * @type {String}
             */
            type: 'default',
            /**
             * Modal parameters for ajax call
             * @public
             * @type {Object}
             */
            ajaxModalParams: {
                method: 'POST',
                url: ''
            },
            /**
             * Modal save parameters for form submit
             * @public
             * @type {Object}
             */
            ajaxFormSubmitParams: {
                method: 'POST',
                url: ''
            },
            /**
             * Show modal close button
             * @public
             * @type {boolean}
             */
            showCloseButton: true,
            /**
             * Show modal close button
             * @public
             * @type {String}
             */
            footerText: '',
            /**
             * Close modal on click outside
             * @public
             * @type {boolean}
             */
            closeOnClickOutside: true,
            /**
             * Ajax done callback
             * @public
             * @type {function}
             */
            ajaxDoneCallback: function (data) {},
            /**
             * Ajax fail callback
             * @param data
             * @function
             */
            ajaxFailCallback: function (data) {},
            /**
             * Ajax form done submit callback
             * @param data
             * @function
             */
            ajaxSubmitDoneCallback: function (data) {},
            /**
             * Ajax form fail submit callback
             * @param data
             * @function
             */
            ajaxSubmitFailCallback: function (data) {},
            /**
             * Modal hide callback
             * @param data
             * @function
             */
            hideCallback: function (data) {},
            /**
             * Modal show callback
             * @param data
             * @function
             */
            showCallback: function (data) {}
        };

        /**
         * Test to see if modal is visible
         * @private
         * @type {Boolean}
         */
        this._isVisible = false;

        /**
         * Extend default options of class with the ones received from class instantiation
         */
        this.options = options;
        for(var option in options) {
            this.defaults[option] = options[option];
        }
        /**
         * Set modal callbacks for both hide and show events
         */
        buildModalEventsCallbacks.call(this);
        /**
         * Create custom events for modal
         */
        createCustomEvents.call(this);
    };


    /**
     * Photon prototype
     */
    PhotonModal.prototype = {

        //------------------------------------ Getters ------------------------------------
        /**
         * Get message of modal
         * @returns {*}
         */
        getContent: function () {
            return this.defaults.content;
        },
        /**
         * Get css class for modal based on the size passed as parameter by user
         * @returns {*}
         */
        getSizeCssClass: function () {
            switch (this.defaults.size) {
                case 'small':
                    return 'modal-sm';
                case 'large':
                    return 'modal-lg';
                default:
                    return '';
            }
        },
        /**
         * Get css class for modal based on the type passed as parameter by user
         */
        geFormStylingJson: function () {
            switch (this.defaults.type) {
                case 'form':
                    return {
                        type: 'form',
                        class: '',
                        buttons: {
                            save: {
                                label: _saveLabel,
                                class: 'btn-success',
                                icon: 'fa fa-check',
                                formSubmitter: true
                            },
                            cancel: {
                                label: _cancelLabel,
                                class: 'btn-default',
                                icon: 'fa fa-times'
                            }
                        }
                    };
                case 'preview':
                    return {
                        type: 'preview',
                        class: '',
                        buttons: {
                            cancel: {
                                label: _cancelLabel,
                                class: 'btn-link',
                                icon: 'fa fa-times'
                            }
                        }
                    };
                default:
                    return {
                        type: 'default',
                        class: ''
                    };
            }
        },
        //------------------------------------ End of getters ------------------------------------

        //------------------------------------ Setters -------------------------------------------
        /**
         * Set modal loader variable
         * @param modalLoader
         */
        setModalLoader: function (modalLoader) {
            _loaderIsVisible = modalLoader;
        },
        /**
         * Change modal content dynamically
         * @param content
         */
        setModalContent: function (content) {
            this.defaults.content = content;
            $("#" + this.defaults.id).find('.modal-body').html(content);
        },

        //------------------------------------ End of Setters -------------------------------------------
        /**
         * Use init function from layout.html.twig for plugins instantiation
         */
        initPlugins: function () {
            window.initPlugins($("#" + this.defaults.id).find('.modal-body'));
        },
        /**
         * Show modal
         */
        show: function () {
            if (!this._isVisible) {
                this._isVisible = true;
                /**
                 * Build modal through ajax or with static content
                 */
                this.defaults.useAjax ? createModalUsingAjax.call(this) : buildStaticModal.call(this);
            }
        },
        hide: function () {
            this._isVisible = false;
            /**
             * Hide modal
             */
            $("#" + this.defaults.id).modal('hide');
        }
    };

    /**
     * @param options {Object} Json with options for modal
     * @constructor
     */
    var AlertModal = function (options) {
        /**
         * Options used on class instantiation that will override default ones
         */
        /**
         * Default class options
         * @type {Object}
         */
        this.defaults = {
            /**
             * How the modal will be rendered. It accepts the following parameters: small, large, default size
             * @public
             * @type {String}
             */
            size: 'default',
            /**
             * Id of modal
             * @public
             * @type {String}
             */
            id: '',
            /**
             *  Buttons for modal
             *  @public
             *  @type {Object}
             */
            buttons: '',
            /**
             * The content of the modal
             * @public
             * @type {String}
             */
            content: '',
            /**
             * Title of modal
             * @public
             * @type {String}
             */
            title: '',
            /**
             * Type of modal
             * @private
             * @type {String}
             */
            type: 'confirmation',
            /**
             * Show background overlay
             * @public
             * @type {boolean}
             */
            showBackgroundOverlay: true,
            /**
             * Modal hide callback
             * @param data
             * @function
             */
            hideCallback: function (data) {},
            /**
             * Modal show callback
             * @param data
             * @function
             */
            showCallback: function (data) {}
        };

        /**
         * Test to see if modal is visible
         * @private
         * @type {Boolean}
         */
        this._isVisible = false;

        /**
         * Extend default options of class with the ones received from class instantiation
         */
        this.options = options;
        for(var option in options) {
            this.defaults[option] = options[option];
        }
        /**
         * Set modal callbacks for both hide and show events
         */
        buildModalEventsCallbacks.call(this);
        /**
         * Create custom events for modal
         */
        createCustomEvents.call(this);
    };

    AlertModal.prototype = {

        //------------------------------------ Getters ------------------------------------
        /**
         * Get message of modal
         * @returns {*}
         */
        getContent: function () {
            return this.defaults.content;
        },
        /**
         * Get css class for modal based on the size passed as parameter by user
         * @returns {*}
         */
        getSizeCssClass: function () {
            switch (this.defaults.size) {
                case 'small':
                    return 'modal-sm';
                case 'large':
                    return 'modal-lg';
                default:
                    return '';
            }
        },
        /**
         * Get css class for modal based on the type passed as parameter by user
         */
        getFormStylingJson: function () {
            switch (this.defaults.type) {
                case 'error':
                    return {
                        titleClass: 'text-danger',
                        buttons: {
                            ok: {
                                label: _okLabel,
                                class: 'btn-default error-alert-modal-ok'
                            }
                        }
                    };
                case 'confirmation':
                    return {
                        titleClass: '',
                        buttons: {
                            allow: {
                                label: _allowLabel,
                                class: 'btn-success confirmation-alert-modal-allow'
                            },
                            deny: {
                                label: _denyLabel,
                                class: 'btn-default confirmation-alert-modal-deny'
                            }
                        }
                    };
                default:
                    return {
                        type: 'default',
                        class: ''
                    };
            }
        },
        //------------------------------------ End of getters ------------------------------------

        //------------------------------------ Setters -------------------------------------------
        /**
         * Set modal loader variable
         * @param modalLoader
         */
        setModalLoader: function (modalLoader) {
            _loaderIsVisible = modalLoader;
        },
        /**
         * Change modal content dynamically
         * @param content
         */
        setModalContent: function (content) {
            this.defaults.content = content;
            $("#" + this.defaults.id).find('.modal-body').html(content);
        },

        //------------------------------------ End of Setters -------------------------------------------
        /**
         * Use init function from layout.html.twig for plugins instantiation
         */
        initPlugins: function () {
            window.initPlugins($("#" + this.defaults.id).find('.modal-body'));
        },
        /**
         * Show modal
         */
        show: function () {
            if (!this._isVisible) {
                this._isVisible = true;
                window.alertModalDisplayed = true;
                /**
                 * Build alert modal through ajax or with static content
                 */
                buildAlertModal.call(this);
            }
        },
        hide: function () {
            this._isVisible = false;
            window.alertModalDisplayed = false;
            /**
             * Hide modal
             */
            $("#" + this.defaults.id).modal('hide');
        }
    };

    window.PhotonModal = PhotonModal;
    window.AlertModal = AlertModal;
    window.alertModalDisplayed = false;
    window.errorAlertModal = function (content, title, showBackgroundOverlay, size) {
        if (window.alertModalDisplayed === true) {
            return false;
        }

        $('#error_alert_modal').remove();

        var alertTitle = title || '';
        var alertContent = content || '';
        var alertShowBackgroundOverlay = (showBackgroundOverlay === false) ? false : true;
        var alertSize = size || 'default';

        var alertModal = new AlertModal({
            id: 'error_alert_modal',
            content: alertContent,
            title: alertTitle,
            type: 'error',
            showBackgroundOverlay: alertShowBackgroundOverlay,
            size: alertSize
        });
        alertModal.show();
    };
    window.confirmationAlertModal = function (content, title, showBackgroundOverlay, size) {
        if (window.alertModalDisplayed === true) {
            return false;
        }

        $('#confirmation_alert_modal').remove();

        var alertTitle = title || '';
        var alertContent = content || '';
        var alertShowBackgroundOverlay = (showBackgroundOverlay === false) ? false : true;
        var alertSize = size || 'default';

        var alertModal = new AlertModal({
            id: 'confirmation_alert_modal',
            content: alertContent,
            title: alertTitle,
            showBackgroundOverlay: alertShowBackgroundOverlay,
            size: alertSize
        });
        alertModal.show();
    };

}(window, jQuery));