// Start of local namespace
;(function($, window, document, undefined) {
    'use strict';

    // prevent duplicate loading
    if ( $.ui.TreeType ) {
        return;
    }

    var Class = {
        $widget: {},
        options: {},
        element: {},
        modalContentInitialized: false,
        create: function() {
            return function() {
                this.initialize.apply(this, arguments);
            };
        }
    };

    var TreeType = Class.create();

    TreeType.prototype = {
        initialize: function($widget) {
            var $this = this;

            /**
             * TreeType initialization
             */
            $this.$widget = $widget;
            $this.options = $widget.options;
            $this.element = $widget.element;

            $this.modalContentInitialized = false;
            $this.programmaticallyNodeSelection = false;

            $this.options.modalTitle = this.options.modalTitle || null;
            $this.options.typeId = this.element.attr('id');
            $this.options.treeData = this.options.treeData || (this.element.attr('json-data') || null);
            $this.options.modalId = this.options.typeId + '_modal';
            $this.options.treeId = this.options.treeId || this.options.typeId + '_container';
            $this.options.treeSearchId = this.options.typeId + '_treeSearch';
            $this.options.treeUnmatchedId = this.options.typeId + '_treeUnmatched';
            $this.options.treeSelectHierarchyId = this.options.typeId + '_treeSelectHierarchy';
            $this.options.modalOkBtnClass = this.options.typeId + '_category-modal-ok-btn';
            $this.options.modalResetBtnClass = this.options.typeId + '_category-modal-reset-btn';
            $this.options.modalCancelBtnClass = this.options.typeId + '_category-modal-cancel-btn';
            $this.options.selectMode = ($this.options.selectHierarchyChecked == true) ? 3 : $this.options.selectMode;

            if ($('#' + $this.options.selectId).is(':disabled') || $('#' + $this.options.selectId).attr('readonly') == 'readonly') {
                $this.options.selectOnlyLeaves = true;
            }

            if ($('#' + $this.options.selectId).is(':disabled')) {
                $this.element.attr('disabled','disabled');
                $this.element.next().attr('disabled','disabled');
            }

            /**
             * Construct modal
             */
            $this._constructModal.call($this);

            /**
             * Update TreeType displayed info
             */
            $this._updateInfo();

            /**
             * TreeType click
             */
            $this.element.off('click').on('click', function(e){
                if(e.target != this) return;
                $this.modal.show();
            });
            $this.element.next().off('click').on('click', function(e){
                $this.modal.show();
            });

            /**
             * Select update
             */
            $('#' + $this.options.selectId).on('change', function() {
                $this._updateInfo();
                if ($this.$tree != undefined) {
                    $this._syncSelectToTree();
                }
            });

            /**
             * Parent form reset action
             */
            $('#' + $this.options.typeId).parents('form').on('reset', function() {
                $('#' + $this.options.selectId + ' option[value!=""]:selected').removeAttr('selected').prop('selected', false);
                if ($this.$tree != undefined) {
                    $this._resetSearch();
                    $this._syncSelectToTree();
                }
                $this._updateInfo();
            });
        },

        _constructModal: function(){
            var $this = this;

            var unmatched = $this.options.searchUnmatched ? 'checked="checked"' : '';
            var selectHierarchyChecked = $this.options.selectHierarchyChecked ? 'checked="checked"' : '';
            var fancytreeDisabledClass = '';

            var noItemMatchedContent =
                '<div class="row no-item-matched hidden">' +
                '<div class="col-lg-12">' +
                '<div class="alert alert-info text-center no-margin-top-bottom">' +
                $this.options.noResults +
                '</div>' +
                '</div>' +
                '</div>';

            var modalContent =
                '<div class="row">' +
                '<div class="col-lg-12">' +
                '<div>' +
                '<label for="' + $this.options.treeSearchId + '">' + $this.options.searchPlaceholder + '</label>' +
                '<div class="input-group input-group-no-separation">' +
                '<input type="text" id="' + $this.options.treeSearchId + '" class="form-control">' +
                '<span class="input-group-addon"><i class="fa fa-search"></i></span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col-lg-6">' +
                '<div class="checkbox">' +
                '<label>' +
                '<input type="checkbox" id="' + this.options.treeUnmatchedId + '" ' + unmatched + ' class="form-checkbox-control" /> ' + $this.options.textUnmatched + ' ' +
                '</label>' +
                '</div>' +
                '</div>';
            if ($this.options.selectOnlyLeaves == false) {
                modalContent +=
                    '<div class="col-lg-6">' +
                    '<div class="checkbox">' +
                    '<label>' +
                    '<input type="checkbox" id="' + this.options.treeSelectHierarchyId + '" ' + selectHierarchyChecked + ' class="form-checkbox-control" /> ' + $this.options.textSelectHierarchy + ' ' +
                    '</label>' +
                    '</div>' +
                    '</div>';
            }

            if ($('#' + $this.options.selectId).is(':disabled')) {
                fancytreeDisabledClass = ' class="fancytree-disabled"'
            }
            modalContent +=
                '</div>' +
                '<div class="row">' +
                '<div class="col-lg-12">' +
                '<div id="' + $this.options.treeId + '"' + fancytreeDisabledClass + '></div>' +
                '</div>' +
                '</div>' + noItemMatchedContent;

            $this.modal = new PhotonModal({
                id: $this.options.modalId,
                type: 'preview',
                recreateOnShow: false,
                title: $this.options.modalTitle,
                content: modalContent,
                buttons: {
                    'reset': {
                        label: $this.options.modalResetLabel,
                        class: 'btn-default pull-left ' + $this.options.modalResetBtnClass
                    },
                    'cancel': {
                        label: $this.options.modalCancelLabel,
                        class: 'btn-default pull-right ' + $this.options.modalCancelBtnClass,
                        closeModal: true
                    },
                    'ok': {
                        label:  $this.options.modalOkLabel,
                        class: 'btn-primary pull-right ' + $this.options.modalOkBtnClass,
                        closeModal: true
                    }
                },
                showCallback: function() {
                    /**
                     * Initialize modal content on first display
                     */
                    if (!$this.modalContentInitialized) {
                        /**
                         * Correct modal footer buttons display
                         */
                        $('#' + $this.options.modalId).find('.panel-controls').css('width', '100%');

                        /**
                         * Construct tree
                         */
                        $this._constructTree();

                        /**
                         * Construct search
                         */
                        if ($this.options.searchable) {
                            $this._constructSearch();
                        }

                        $this.modalContentInitialized = true;
                    } else {
                        $this._syncSelectToTree();
                    }
                },
                hideCallback: function() {
                    $this._syncSelectToTree();
                }
            });

            /**
             * Reset button action
             */
            $('body').off('click', '.' + $this.options.modalResetBtnClass).on('click', '.' + $this.options.modalResetBtnClass, function(e) {
                /** Remove class for hiding icon for collapse */
                $('.fancytree-visibility-none').removeClass('fancytree-visibility-none');

                $this._syncSelectToTree();
            });

            /**
             * OK button action
             */
            $('body').off('click', '.' + $this.options.modalOkBtnClass).on('click', '.' + $this.options.modalOkBtnClass, function(e) {
                /** Remove class for hiding icon for collapse */
                $('.fancytree-visibility-none').removeClass('fancytree-visibility-none');

                $this.$tree.visit(function(node) {
                    $this._addCollapseIcon(node);
                });

                $this._updateElement();
            });

            /**
             * Cancel button action
             */
            $('body').off('click', '.' + $this.options.modalCancelBtnClass).on('click', '.' + $this.options.modalCancelBtnClass, function(e) {
                /** Remove class for hiding icon for collapse */
                $('.fancytree-visibility-none').removeClass('fancytree-visibility-none');

                $this.$tree.visit(function(node) {
                    $this._addCollapseIcon(node);
                });
            });

            $(document).keyup(function(e) {
                if (e.keyCode == 27 && $this.$tree) { /** When ESC key it is pressed */

                    //class for hiding icon for collapse
                $('.fancytree-visibility-none').removeClass('fancytree-visibility-none');

                    $this.$tree.visit(function(node) {
                        $this._addCollapseIcon(node);
                    });

                    $this.modal.hide();
                }
            });
        },

        _constructTree: function() {
            var $this = this;

            if (!$this.options.useAjax) {
                $this.tree = $('#' + $this.options.treeId).fancytree({
                    extensions: ['filter'],
                    source: $this.options.treeData,
                    checkbox: true,
                    icon: false,
                    toggleEffect: false,
                    activeVisible: true,
                    debugLevel: 0,
                    selectMode: $this.options.selectMode,
                    beforeSelect: function(event, data) {
                        return $this._beforeNodeSelection();
                    },
                    select: function(event, data) {
                        $this._nodeSelection(event, data);
                    }
                });
            } else {
                $this.tree = $('#' + $this.options.treeId).fancytree({
                    extensions: ['filter'],
                    source: $this.options.treeData,
                    checkbox: true,
                    icon: false,
                    toggleEffect: false,
                    activeVisible: true,
                    debugLevel: 0,
                    selectMode: $this.options.selectMode,
                    beforeSelect: function(event, data) {
                        return $this._beforeNodeSelection();
                    },
                    select: function(event, data) {
                        $this._nodeSelection(event, data);
                    },
                    lazyLoad: function(event, data) {
                        var node = data.node;
                        /** Issue an ajax request to load child nodes */
                        data.result = {
                            url: $this.options.ajaxRoute,
                            data: {key: node.key}
                        }
                    }
                });
            }

            $this.$tree = $this.tree.fancytree('getTree');

            /**
             * Modal close event
             */
            $(document).on('hidden.bs.modal',function() {
                /** Remove hide class for search results */
                $('.fancytree-visibility-none').removeClass('fancytree-visibility-none');
                $this.$tree.visit(function(node) {
                    $this._addCollapseIcon(node);
                });
            });

            $this._syncSelectToTree();
        },

        _constructSearch: function() {
            var $this = this;

            $this.$tree.options.filter.mode = $this.options.searchUnmatched ? 'hide' : 'dimm';

            $('#' + $this.options.treeSearchId).off('input').on('input', function (event) {
                $this._searchHandler.call($this);
            });

            $('#' + $this.options.treeSelectHierarchyId).off('change').on('change', function () {
                if ($(this).is(':checked')) {
                    $this.tree.fancytree('option', 'selectMode', 3);
                    $this.$tree.visit(function(node) {
                        if (node.selected == true) {
                            $this.programmaticallyNodeSelection = true;

                            node.setSelected(false);
                            node.setSelected(true);

                            $this.programmaticallyNodeSelection = false;
                        }
                    });
                } else {
                    $this.tree.fancytree('option', 'selectMode', 2);
                    $this.$tree.visit(function(node) {
                        if (node.partsel) {
                            node.partsel = false;
                            node.render(true);
                        }
                    });
                }
            });

            $('#' + $this.options.treeUnmatchedId).off('change').on('change', function () {
                $this._unmatchedHandler.call($this);
            });
        },

        _syncSelectToTree: function () {
            var $this = this;

            /** Reset search */
            $this._resetSearch();

            /** Uncheck all tree items */
            var selectedNodes = $this.$tree.getSelectedNodes();
            $(selectedNodes).each(function (index, node) {
                $this.programmaticallyNodeSelection = true;

                var parents = node.getParentList();
                $(parents).each(function (index, parentNode) {
                    parentNode.setExpanded(false, {noAnimation: false});
                });

                node.setSelected(false);

                $this.programmaticallyNodeSelection = false;
            });

            /** Check tree items and expand from hidden select tag */
            $('#' + $this.options.selectId + ' option:selected').each(function(){
                var optionValue = $(this).val();

                var node = $this.$tree.getNodeByKey(optionValue);

                if (node) {
                    $this.programmaticallyNodeSelection = true;

                    node.setSelected(true);

                    node.makeVisible({
                        noAnimation: true,
                        noEvents: false,
                        scrollIntoView: false
                    });

                    $this.programmaticallyNodeSelection = false;
                }
            });
        },

        _updateInfo: function(){
            var $this = this;

            var selected = $('#' + $this.options.selectId + ' option[value!=""]:selected');

            var treeTypeInfo = selected.length + ' ' + $this.options.textSelected;

            $this.element.html(treeTypeInfo);
        },

        _updateElement: function() {
            var $this = this;

            var selected = $this.$tree.getSelectedNodes();

            $('#' + $this.options.selectId + ' option:selected').removeAttr('selected');
            $('#' + $this.options.selectId + ' option:selected').prop('selected', false);

            $(selected).each(function () {
                if ( $('#' + $this.options.selectId + ' option[value="' + this.key + '"]').length == 0 ) {
                    $('<option/>', {
                        value: this.key,
                        html: this.title
                    }).appendTo('#' + $this.options.selectId);
                }
                $('#' + $this.options.selectId + ' option[value="' + this.key + '"]').prop('selected', true);
            });

            $('#' + $this.options.selectId).trigger('change');
        },

        _addCollapseIcon: function(node) {
            /** Remove fancytree-visibility-none class (which hides the collapse icon) for node */
            if(node.extraClasses != undefined) {
                if (node.extraClasses.indexOf('fancytree-visibility-none') != -1) {
                    var extraClass = node.extraClasses.replace('fancytree-visibility-none','');
                    node.extraClasses = extraClass;
                    node.render(true);
                }
            }
        },

        _beforeNodeSelection: function() {
            var $this = this;

            if (!$this.programmaticallyNodeSelection && ($('#' + $this.options.selectId).is(':disabled') || $('#' + $this.options.selectId).attr('readonly') == 'readonly')) {
                return false;
            }
        },

        _nodeSelection: function(event, data) {
            this._checkPartialSelection(event, data);
            this._uncheckUncheckebleNodes();
        },

        _checkPartialSelection: function(event, data) {
            if (data.node.selected == false) {
                /** Set partial selection false for node */
                data.node.partsel = false;
                data.node.render(true);

                /** Check all parents if they have to disable partial selection property */
                var nodeParents = data.node.getParentList(false, data.node.hasChildren());
                $.each(nodeParents, function(index, parentNode){
                    if (!parentNode.selected) {
                        /**
                         * If parent it is not selected, check if there are any child nodes selected.
                         * If there are no child nodes selected set partial selection false for parent too.
                         */
                        var childNodesSelected = false;
                        $.each(parentNode.children, function(index, childNode) {
                            if (childNode.selected) {
                                childNodesSelected = true;
                                return false;                   /** This will break the loop. */
                            }
                        });
                        if (childNodesSelected == false) {
                            parentNode.partsel = false;
                            parentNode.render(true);
                        }
                    }
                });
            }
        },

        _uncheckUncheckebleNodes: function() {
            this.$tree.visit(function (node) {
                if (node.unselectable === true && node.selected === true) {
                    node.selected = false;
                    node.partsel = false;
                    node.renderStatus();
                }
            });
        },

        _unmatchedHandler: function(){
            var $this = this;

            $this.options.searchUnmatched = $('#' + $this.options.treeUnmatchedId).is( ':checked' );
            $this.$tree.options.filter.mode = $this.options.searchUnmatched ? 'hide' : 'dimm';
            $this.$tree.clearFilter();
            $('#' + $this.options.treeSearchId).trigger('input');
            if ($('#' + $this.options.treeSearchId).val().length == 0 ) {
                $('#' + $this.options.treeId).removeClass('fancytree-ext-filter fancytree-ext-filter-dimm');
                $('#' + $this.options.treeId).find('.fancytree-visibility-none').removeClass('fancytree-visibility-none');
            }
        },

        _resetSearch: function() {
            var $this = this;

            if($('#' + $this.options.treeSearchId).length !== 0){
                $('#' + $this.options.treeSearchId).val('');
            }
            $this.$tree.clearFilter();
            /** Fix for http://jira.emag.local:8080/browse/UI-1246 bug */
            if ($('#' + $this.options.treeUnmatchedId).length) {
                $('#' + $this.options.treeUnmatchedId).prop('checked', true);
                $this._unmatchedHandler();
            }
            /** END - Fix for http://jira.emag.local:8080/browse/UI-1246 bug */
        },

        _searchHandler: function() {
            var $this = this;

            var searchString = $('#' + $this.options.treeSearchId).val().trim();

            if ($this.options.useAjax && $this.options.searchAjaxRoute != '') {
                if (searchString.length >= 2) {
                    var existingNodes = [];

                    $.getJSON(
                        $this.options.searchAjaxRoute,
                        {
                            search: searchString
                        },
                        function (data) {
                            if (data.search == $('#' + $this.options.treeSearchId).val().trim()) {
                                for (var $i = 0; $i < data.data.length; $i++ ) {
                                    var node = data.data[$i];
                                    var possibleNewNode = $this.$tree.getNodeByKey(node.key.toString());

                                    if (possibleNewNode == null) {
                                        var parentNode = $this.$tree.getNodeByKey(node.parentId.toString());

                                        if (parentNode != null) {
                                            var newNode = {
                                                key: node.key,
                                                title: node.title,
                                                selected: false,
                                                extraClasses: 'tree-inactive-item',
                                                folder: false,
                                                lazy: false,
                                                children: []
                                            };
                                            if (node.status == 'active') {
                                                newNode.extraClasses = '';
                                            }
                                            if (node.leaf > 1) {
                                                newNode.folder = true;
                                                newNode.lazy = true;
                                            }
                                            parentNode.addChildren(newNode);
                                        }
                                    }
                                }
                            }

                            $this._searchHandlerAction();
                        }
                    );
                } else if (searchString.length == 1) {
                    this.$tree.filterNodes(function (node) {
                        return true;
                    });
                    $this.tree.removeClass('fancytree-ext-filter fancytree-ext-filter-dimm fancytree-ext-filter-hide');
                    $this.tree.find('.fancytree-visibility-none').removeClass('fancytree-visibility-none');
                } else {
                    $this._searchHandlerAction();
                }
            } else {
                $this._searchHandlerAction();
            }

        },

        _searchHandlerAction: function() {
            var $this = this;

            var searchString = $('#' + $this.options.treeSearchId).val().trim().toLowerCase();

            /** Remove class for hiding icon for collapse*/
            $('.fancytree-visibility-none').removeClass('fancytree-visibility-none');

            /** Regex for finding the pattern in node title */
            var matchesNo = this.$tree.filterNodes(function (node) {
                $this._addCollapseIcon(node);

                var nodeHasSearchString = node.title.toLowerCase().indexOf(searchString) == -1 ? false : true;

                if (nodeHasSearchString == true) {
                    // the algorithm should apply only if the irrelevant values from search are hidden
                    if ($this.$tree.options.filter.mode != 'dimm') {
                        //count visible nodes from tree
                        var howManyVisibleNodes = 0;
                        //the icon could not be hidden if the node was not collapsed - so it should come collapsed by default
                        node.setExpanded(false, {noAnimation: false});

                        if (node.children) {
                            //get all nodes recursively - even children of children
                            node.visit(function (childNode) {
                                if (childNode.isVisible() || childNode.title.toLowerCase().indexOf(searchString) != -1) {
                                    howManyVisibleNodes++;
                                }
                            });
                        }
                        //if children of node are not visible put the class to hide collapsing icon
                        if (howManyVisibleNodes == 0 && searchString.length != 0) {
                            //add just one time the class
                            if (node.extraClasses == undefined || node.extraClasses.indexOf('fancytree-visibility-none') == -1) {
                                node.extraClasses += ' fancytree-visibility-none';
                            }
                        }
                    } else {
                        $('.fancytree-visibility-none').removeClass('fancytree-visibility-none');
                    }
                }
                return nodeHasSearchString;
            });
            var $categoryTreeModal = $('#' + $this.options.modalId);
            var $categoryTreeContainer = $('#' + $this.options.treeId);
            var $categoryTreeOkButton = $('.' + $this.options.modalOkBtnClass);
            var hideUnmatched = $('#' + $this.options.treeUnmatchedId).is( ':checked' );

            if (matchesNo === 0 && hideUnmatched) {
                $categoryTreeModal.find('.no-item-matched').removeClass('hidden');
                $categoryTreeContainer.addClass('hidden');
                $categoryTreeOkButton.attr('disabled', true);
            } else {
                $categoryTreeModal.find('.no-item-matched').addClass('hidden');
                $categoryTreeContainer.removeClass('hidden');
                $categoryTreeOkButton.attr('disabled', false);
            }
            if ( searchString.length == 0 ) {
                $this.tree.removeClass('fancytree-ext-filter fancytree-ext-filter-dimm fancytree-ext-filter-hide');
                $this.tree.find('.fancytree-visibility-none').removeClass('fancytree-visibility-none');
            }
        },

        destroy: function() {
            var $this = this;

            if ($this.tree) {
                $this.tree.fancytree('destroy');
            }
            $('#' + $this.options.modalId).remove();
            $($this.element).off('click');
            $($this.element).html('');
        }
    };

    $.widget( 'ui.TreeType', {
        options: {
            modalTitle: 'Selectează',
            noResults: 'Nici un rezultat găsit',
            modalResetLabel: 'Resetează',
            modalCancelLabel: 'Anulează',
            modalOkLabel: 'Selectează',
            textUnmatched: 'Ascunde rezultatele nerelevante',
            textSelectHierarchy: 'Selectare multiplă ierarhică',
            textSelected: 'selectate',
            searchPlaceholder: 'Caută',
            typeId: null,
            treeData: null,
            selectId: null,
            treeId: null,
            selectMode: 2,
            searchable: true,
            searchUnmatched: true,
            selectHierarchyChecked: false,
            selectOnlyLeaves: false,
            useAjax: false,
            ajaxRoute: '',
            searchAjaxRoute: ''
        },
        _create: function() {
            this.TreeType = new TreeType(this);
        },
        _destroy: function() {
            if (this.TreeType) {
                this.TreeType.destroy();
            }
        },
        treeData: function(value) {
            if (value === undefined) {
                return this.options.treeData;
            }

            this.TreeType.options.treeData = value;
            if (this.TreeType.tree) {
                this.TreeType.tree.fancytree('destroy');
                this.TreeType._constructTree();
            }
        }
    });

}(jQuery, window, document));