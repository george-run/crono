(function($, window) {
    'use strict';

    /** Prevent duplicate loading */
    if ($.ui.HierarchicalSelect) {
        return;
    }

    var Class = {
        create: function() {
            return function() {
                this.initialize.apply(this, arguments);
            };
        }
    };

    var HierarchicalSelect = Class.create();

    HierarchicalSelect.prototype = {
        _errorMessages: {
            rootStructureIncorrect: 'Hierarchical Select Error: Data structure for root select group is incorrect. Please use as data something like: \n' +
            '{\n' +
            '\t0: [\n' +
            '\t\t{\n' +
            '\t\t\tkey: 97,\n' +
            '\t\t\ttitle: "Air Conditioners",\n' +
            '\t\t\tfolder: true,\n' +
            '\t\t\tselected: false\n' +
            '\t\t},\n' +
            '\t\t{\n' +
            '\t\t\tkey: 531,\n' +
            '\t\t\ttitle: "Conditioning",\n' +
            '\t\t\tfolder: false,\n' +
            '\t\t\tselected: false\n' +
            '\t\t}\n' +
            '\t]\n' +
            '}\n',
            ajaxRouteEmpty: 'Hierarchical Select Error: AJAX route is not set.'
        },

        initialize: function ($widget) {
            var self = this;

            self._initWidgetOptions($widget);

            self._initHtml();

            self._initSliderVariables();
            self._initConstants();

            self._initSelectGroups();
            self._initEvents();
        },
        _initWidgetOptions: function ($widget) {
            this.$widget = $widget;
            this.options = $widget.options;
            this.element = $widget.element;
            this.$select = $($widget.options.select);

            this._selectedOptionsInSelectGroups = [];

            this.searchPlaceholder = this.options.searchPlaceholder;

            this.displayedSelects = this.options.displayedSelects || [0];

            this.data = this.options.data || null;
            if (!this._hasDataStructure(this.data[0])) {
                console.error(this._errorMessages.rootStructureIncorrect);
                return false;
            }

            this.ajaxRoute = this.options.ajaxRoute || '';
            if (this.ajaxRoute == '') {
                console.error(this._errorMessages.ajaxRouteEmpty);
                return false;
            }
        },
        _initHtml: function () {
            this.element
                .addClass('hierarchical')
                .html(  '<button type="button" class="controls prev disabled fa fa-chevron-left"></button>'+
                '<button type="button" class="controls next disabled fa fa-chevron-right"></button>'+
                '<div class="row hierarchical-overflow-container"><div class="hierarchical-items-container"></div></div>'
            );

            this.$btnNext = this.element.find('.next');
            this.$btnPrev = this.element.find('.prev');
            this.$overflowContainer = this.element.find('.hierarchical-overflow-container');
            this.$containerItems = this.element.find('.hierarchical-items-container');
        },
        _initSliderVariables: function() {
            this.currentPos = 0;
            this.outsideLeftPosition = 0;
            this.currentMaxVisibleItems = 0;
            this.itemWidth = 0;
            this.itemOuterWidth = 0;
            this.visibleRemainingWidthOfItem = 0;
        },
        _initConstants: function() {
            this.ANIMATE_TIME = 100;
            this.MOUSE_UP_DELAY = 150;

            this.TAB_KEY_CODE = 9;
            this.LEFT_ARROW_KEY_CODE = 37;
            this.RIGHT_ARROW_KEY_CODE = 39;
        },
        _initSelectGroups: function () {
            var self = this;
            var newGroupKey = 0;
            $.each(self.displayedSelects, function (key, selectGroupId) {
                self._newSelectGroup(newGroupKey, self.data[selectGroupId]);
                newGroupKey++;
            });
        },
        _initEvents: function () {
            var self = this;

            self.$btnNext.on('click', function () {
                self._next();
            });

            self.$btnPrev.on('click', function () {
                self._prev();
            });

            self.$overflowContainer.on('scroll', function () {
                self._onScroll();
            }).on('mousedown', function (event) {
                if (event.which == 2) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            });

            $(document).on('keydown keypress keyup', function(event) {
                if ($.inArray(event.which, [self.TAB_KEY_CODE, self.LEFT_ARROW_KEY_CODE, self.RIGHT_ARROW_KEY_CODE]) !== -1) {
                    setTimeout(function () {
                        self._onMouseUp();
                    }, self.MOUSE_UP_DELAY);
                }
            });

            self.element.parents('.widget-box').find('a[data-action="collapse"]').on('click', function () {
                setTimeout(function () {
                    self._updateWidths();
                }, self.MOUSE_UP_DELAY);
            });

            $(window).resize(function () {
                self._updateWidths();
            });
        },

        _newSelectGroup: function (key, categories) {
            var $selectGroup = this._createSelectGroup(key, categories);
            this._addSelectGroupEvents($selectGroup, categories);
            this.$containerItems.append($selectGroup);
            if (this._isFirstSelectGroup()) {
                this.$firstSelectGroup = this.$containerItems.find('.hierarchical-select-group').eq(0);
            }
            this._unblockAllSelectGroups();

            this.currentPos = this._getNoOfExistingGroups();
            this._updateWidths();
            this.$btnNext.addClass('disabled');
            this._animateAction('append');
        },
        _createSelectGroup: function (key, categories) {
            var self = this;
            var $selectGroup = $('<div class="hierarchical-select-group col-xs-12 col-sm-6 col-md-4 col-lg-3">' +
                '<div class="hierarchical-select-group-search-container">' +
                '<input type="text" class="hierarchical-select-group-search form-control" placeholder="' + this.searchPlaceholder + '">' +
                '<span class="fa fa-search form-control-feedback" aria-hidden="true"></span>' +
                '</div>' +
                '<select data-key="' + key + '" size="6" class="hierarchical-select-group-select form-control">' +
                '</select>' +
                '</div>');
            var $select = $selectGroup.find('.hierarchical-select-group-select');

            $.each(categories, function(index, category) {
                self._createSelectOption($select, category.key, category.title, category.selected, category.folder);
            });

            return $($selectGroup);
        },
        _addSelectGroupEvents: function ($selectGroup, categories) {
            var $input = $selectGroup.find('.hierarchical-select-group-search');
            var $select = $selectGroup.find('.hierarchical-select-group-select');

            this._filterByText($input, $select, categories);
            this._selectGroupSelect($select);
        },
        _filterByText: function ($input, $select, categories) {
            $input.on('input change keyup', function() {
                var search = $.trim($(this).val());
                var regex = new RegExp(search,'gi');

                $select.find('option').each(function(index, option) {
                    if ($(option).text().match(regex) !== null) {
                        $(option).removeClass('hidden').removeAttr('disabled');
                    } else {
                        $(option).addClass('hidden').attr('disabled', 'disabled');
                    }
                })
            });
        },
        _selectGroupSelect: function ($select) {
            var self = this;

            $select.on('change', function() {
                var $this = $(this);
                var selectGroupKey = self._getSelectGroupKey($select);
                var categoryKey = $this.val();

                self._blockAllSelectGroups();

                self._saveSelectSelection(selectGroupKey, categoryKey);
                self._removeFollowingSelectGroups(selectGroupKey);
                self._loadChildrenForSelection($this, categoryKey);
            }).on('keydown keypress keyup', function(event) {
                if ($.inArray(event.which, [self.LEFT_ARROW_KEY_CODE, self.RIGHT_ARROW_KEY_CODE]) !== -1) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            });
        },
        _createSelectOption: function ($select, value, text, selected, folder) {
            if (selected) {
                selected = 'selected="selected"';
            } else {
                selected = '';
            }
            folder = folder || false;

            $select.append('<option value="' + value + '"' + selected + ' data-folder="' + folder + '">' + text + '</option>');
        },
        _saveSelectSelection: function(selectGroupKey, categoryKey) {
            this._selectedOptionsInSelectGroups[selectGroupKey] = categoryKey;

            this.$select.find('option').removeAttr('selected');
            if (this.$select.find('option[value="' + categoryKey + '"]').length == 0) {
                this._createSelectOption(this.$select, categoryKey, '', true, false);
            } else {
                this.$select.val(categoryKey);
            }
        },
        _removeFollowingSelectGroups: function(selectGroupKey) {
            this._cleanSelectedOptionsInSelectGroups(selectGroupKey);

            while (this._isNotLastSelectGroup(selectGroupKey)) {
                this._removeLastSelectGroup();
            }
        },
        _loadChildrenForSelection: function ($select, categoryKey) {
            var self = this;

            if (this._categoryHasChildren($select, categoryKey)) {
                var newGroupKey = this._getNoOfExistingGroups();

                if (this._categoryChildrenAreLoaded(categoryKey)) {
                    this._newSelectGroup(newGroupKey, this.data[categoryKey]);
                } else {
                    $.get(this.ajaxRoute,
                        {
                            key: categoryKey
                        },
                        function(categoryChildrenData) {
                            self.data[categoryKey] = [];

                            $.each(categoryChildrenData, function(index, categoryData) {
                                self.data[categoryKey].push({
                                    key: categoryData.key,
                                    title: categoryData.title,
                                    folder: ( categoryData.folder ? categoryData.folder : false ),
                                    selected: ( categoryData.selected ? categoryData.selected : false )
                                });
                            });

                            self._newSelectGroup(newGroupKey, self.data[categoryKey]);
                        },
                        'json'
                    );
                }
            } else {
                this._unblockAllSelectGroups($select);
            }
        },

        _updateWidths: function () {
            this._resetWidths();
            this._calculateNewWidths();
            this._setNewWidths();

            this._setCurrentPosAfterResize();

            this._setButtonsState();
            this._animateAction('resize');
        },
        _resetWidths: function () {
            var selectGroups = this.$containerItems.find('.hierarchical-select-group');

            this.$containerItems.css({
                'width': '',
                'left': ''
            });
            $.each(selectGroups, function (key, value) {
                $(this).css({
                    'width': ''
                })
            });
        },
        _calculateNewWidths: function() {
            this.itemWidth = this.$firstSelectGroup.width() - 1;
            this.itemOuterWidth = this.$firstSelectGroup.outerWidth() - 1;
            this.currentMaxVisibleItems = Math.floor(this.$overflowContainer.width() / this.itemWidth);
        },
        _setNewWidths: function() {
            var self = this;
            var selectGroups = self.$containerItems.find('.hierarchical-select-group');

            $.each(selectGroups, function () {
                $(this).width(self.itemWidth);
            });

            self.$containerItems.width(self._getNoOfExistingGroups() * this.itemOuterWidth);

            self.visibleRemainingWidthOfItem = 0;
            self.isScrolling = false;
        },

        _onScroll: function () {
            var self = this;

            if (!self.isScrolling) {
                self.isScrolling = true;
                self.$overflowContainer.off('mouseup');
                self.$overflowContainer.on('mouseup', function (e) {
                    setTimeout(function () {
                        self._onMouseUp();
                    }, self.MOUSE_UP_DELAY);
                });
            }
        },
        _animateAction: function (typeOfInteraction) {
            var scrollLeftPos = Math.max(0, (this.currentPos - this.currentMaxVisibleItems) * this.itemOuterWidth);

            switch (typeOfInteraction) {
                case 'append':
                    this.$containerItems.parent().scrollLeft(scrollLeftPos - this.itemOuterWidth);
                    this.$containerItems.parent().stop().animate({scrollLeft: scrollLeftPos}, this.ANIMATE_TIME);
                    break;
                case 'removeLast':
                    this.$containerItems.parent().scrollLeft(scrollLeftPos);
                    break;
                case 'next':
                case 'prev':
                    this.$containerItems.parent().stop().animate({scrollLeft: scrollLeftPos}, this.ANIMATE_TIME);
                    break;
                case 'resize':
                    this.$containerItems.parent().scrollLeft(scrollLeftPos);
                    break;
            }
        },
        _setCurrentPosAfterResize: function () {
            var noOfExistingGroups = this._getNoOfExistingGroups();

            if (noOfExistingGroups >= this.currentMaxVisibleItems) {
                if (this.visibleRemainingWidthOfItem !== 0) {
                    this.currentPos = Math.max(this.currentPos + 1, this.currentMaxVisibleItems);
                } else {
                    this.currentPos = Math.max(this.currentPos, this.currentMaxVisibleItems);
                }
            } else {
                this.currentPos = noOfExistingGroups;
            }
        },
        _setButtonsState: function () {
            var self = this;
            var noOfExistingGroups = self._getNoOfExistingGroups();

            setTimeout(function() {
                if (self.currentPos >= noOfExistingGroups) {
                    self.$btnNext.addClass('disabled');
                } else {
                    self.$btnNext.removeClass('disabled');
                }

                if (noOfExistingGroups <= self.currentMaxVisibleItems || self.$containerItems.parent().scrollLeft() == 0) {
                    self.$btnPrev.addClass('disabled');
                } else {
                    self.$btnPrev.removeClass('disabled');
                }
            }, self.MOUSE_UP_DELAY);
        },

        _next: function () {
            if (this.visibleRemainingWidthOfItem !== 0) {
                var nextFullyViewedItemXPos = this.$containerItems.parent().scrollLeft() + this.visibleRemainingWidthOfItem;
                this.visibleRemainingWidthOfItem = 0;
                this._setCurrentPosToNextFullyViewedItem(nextFullyViewedItemXPos);
            } else {
                this.currentPos = Math.min(this._getNoOfExistingGroups(), this.currentPos + 1);
            }

            this._setButtonsState();
            this._animateAction('next');
        },
        _setCurrentPosToNextFullyViewedItem: function (nextFullyViewedItemXPos) {
            this.currentPos = Math.min(Math.floor(nextFullyViewedItemXPos / this.itemOuterWidth) + this.currentMaxVisibleItems, this._getNoOfExistingGroups());
        },
        _prev: function () {
            var previousFullyViewedItemXPos = this.$containerItems.parent().scrollLeft() - (this.itemOuterWidth - this.visibleRemainingWidthOfItem);
            this.visibleRemainingWidthOfItem = 0;
            this._setCurrentPosToPreviousFullyViewedItem(previousFullyViewedItemXPos);
            this._setButtonsState();
            this._animateAction('prev');
        },
        _setCurrentPosToPreviousFullyViewedItem: function (previousFullyViewedItemXPos) {
            this.currentPos = Math.round(previousFullyViewedItemXPos / this.itemOuterWidth) + this.currentMaxVisibleItems;
        },
        _onMouseUp: function () {
            var noOfExistingGroups = this._getNoOfExistingGroups();

            this.outsideLeftPosition = this.$containerItems.parent().scrollLeft();
            this.visibleRemainingWidthOfItem = this.itemOuterWidth - (this.outsideLeftPosition % this.itemOuterWidth);

            if (this.visibleRemainingWidthOfItem == this.itemOuterWidth) {
                this.visibleRemainingWidthOfItem = 0
            }

            if (this.outsideLeftPosition > 0) {
                var itemsNotVisible = this._getNoOfItemsNotVisible();
                this.currentPos = Math.min(itemsNotVisible + this.currentMaxVisibleItems, noOfExistingGroups);
            } else {
                this.currentPos = this.currentMaxVisibleItems;
            }

            this.isScrolling = true;

            this._setButtonsState();
        },
        _getNoOfItemsNotVisible: function () {
            return Math.round(this.outsideLeftPosition / this.itemOuterWidth);
        },

        _isFirstSelectGroup: function () {
            return (this._getNoOfExistingGroups() == 1);
        },
        _getSelectGroupKey: function ($select) {
            return parseInt($select.attr('data-key'));
        },
        _isGroupKeyOption: function (selectGroupKey, key) {
            return this._selectedOptionsInSelectGroups[selectGroupKey] == key;
        },
        _hasDataStructure: function(data) {
            return (data instanceof Array && data.length > 0)
        },
        _getNoOfExistingGroups: function() {
            return this.element.find('.hierarchical-select-group').length;
        },
        _cleanSelectedOptionsInSelectGroups: function(selectGroupKey) {
            this._selectedOptionsInSelectGroups.splice(selectGroupKey + 1, this._selectedOptionsInSelectGroups.length);
        },
        _isNotLastSelectGroup: function(selectGroupKey) {
            var noOfExistingGroups = this._getNoOfExistingGroups();
            return (noOfExistingGroups > selectGroupKey + 1);
        },
        _removeLastSelectGroup: function() {
            this.$overflowContainer.off('mouseup');

            this.element.find('.hierarchical-select-group:last').remove();

            this.currentPos = this._getNoOfExistingGroups();
            this._updateWidths();
            this._animateAction('removeLast');
        },
        _categoryHasChildren: function ($select, categoryKey) {
            return ( $select.find('option[value="' + categoryKey + '"]').attr('data-folder') == 'true' ? true : false );
        },
        _categoryChildrenAreLoaded: function (categoryKey) {
            return ( this.data[categoryKey] && this._hasDataStructure(this.data[categoryKey]) );
        },
        _blockAllSelectGroups: function() {
            this.element.find('select').blur().css('overflow-y', 'hidden');
            this.element.find('input, select').attr('disabled', 'disabled');
            this.$overflowContainer.blockControl();
        },
        _unblockAllSelectGroups: function($select) {
            this.element.find('select').css('overflow-y', 'scroll').blur();
            this.element.find('input, select').removeAttr('disabled');
            this.$overflowContainer.unblockControl();

            if ($select) {
                $select.focus();
            } else {
                var noOfExistingGroups = this._getNoOfExistingGroups();
                this.element.find('select').eq(noOfExistingGroups - 2).focus();
            }
        }
    };

    $.widget('ui.HierarchicalSelect', {
        options: {
            searchPlaceholder: 'Search',
            select: '',
            data: null,
            displayedSelects: [0],
            ajaxRoute: ''
        },
        _create: function() {
            this.HierarchicalSelect = new HierarchicalSelect(this);
        }
    });

}(jQuery, window));