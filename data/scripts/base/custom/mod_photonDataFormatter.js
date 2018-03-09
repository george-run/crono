(function(window, $) {
    'use strict';

    function PhotonDataFormatter() {

        var self = this;

        /**
         * Not Available Formatter
         * @param item
         * @return {string}
         */
        this.notAvailable = function (item) {
            var i = getItemStatus(item);

            if (i.hasNoValue) {
                return '<span class="formatter-notavailable label label-default">N/A</span>';
            }

            return item;
        };

        /**
         * DateTime Formatter
         * @param item
         * @return {string}
         */
        this.dateTime = function (item) {
            return dateTimeFormatter(item, 'datetime', false);
        };

        /**
         * DateTime Formatter without icon
         * @param item
         * @return {string}
         */
        this.dateTimeNoIcon = function (item) {
            return dateTimeFormatter(item, 'datetime', true);
        };

        /**
         * Date Formatter
         * @param item
         * @return {string}
         */
        this.date = function (item) {
            return dateTimeFormatter(item, 'date', false);
        };

        /**
         * Date Formatter without icon
         * @param item
         * @return {string}
         */
        this.dateNoIcon = function (item) {
            return dateTimeFormatter(item, 'date', true);
        };

        /**
         * Time Formatter
         * @param item
         * @return {string}
         */
        this.time = function (item) {
            return dateTimeFormatter(item, 'time', false);
        };

        /**
         * Time Formatter without icon
         * @param item
         * @return {string}
         */
        this.timeNoIcon = function (item) {
            return dateTimeFormatter(item, 'time', true);
        };

        /**
         * Id Formatter
         * @param item
         * @returns {string}
         */
        this.id = function (item) {
            var i = getItemStatus(item);

            if (i.hasNoValue) {
                return self.notAvailable();
            }

            return '<span class="formatter-id"><i>#</i> '  + item + '</span>';
        };

        /**
         * Cell UserEmail Formatter
         * @param item
         * @return {string}
         */
        this.userEmail = function (item) {
            return userEmailFormatter(item, false);
        };

        /**
         * Cell UserEmail Formatter without icon
         * @param item
         * @return {string}
         */
        this.userEmailNoIcon = function (item) {
            return userEmailFormatter(item, true);
        };

        /**
         * Country Formatter
         * @param item
         * @param options
         * @param rowObject
         * @return {string}
         */
        this.country = function (item, options, rowObject) {
            var i = getItemStatus(item);

            if (i.hasNoValue || i.isNumber) {
                return self.notAvailable();
            }

            var rCountryCode = rowObject !== undefined ? getItemStatus(rowObject.countryCode) : getItemStatus(null);

            if (rCountryCode.hasNoValue) {
                if (i.isString && !i.isJson) {
                    var countryCode = item.toString();
                    return countryFormatterString({country: item, countryCode: countryCode.toLowerCase()});
                }

                if (i.isJson) {
                    item = JSON.parse(item);
                }
                return countryFormatterString(item);
            }

            return countryFormatterString({country: item, countryCode: rowObject.countryCode});
        };

        /**
         * Actions buttons Formatter
         * @param item
         * @param options
         * @param rowObject
         * @return {string}
         */
        this.actionsButtons = function (item) {
            var i = getItemStatus(item);

            if (i.isJson) {
                item = JSON.parse(item);
                i = getItemStatus(item);
            }

            if (!i.isArray) {
                console.error('jqGrid actions buttons cell data must be array of objects.');
                return '';
            }

            var buttonsGroups = {};

            $.each(item, function(index, element) {
                var currentButtonGroup;


                currentButtonGroup = getCurrentButtonGroup(buttonsGroups, element.group);

                if (typeof(buttonsGroups[currentButtonGroup]) == 'undefined') {
                    buttonsGroups[currentButtonGroup] = $('<div>', { class: 'btn-group' });
                }

                var attr = makeButtonSetup(element);

                if (element.dropdown instanceof Array && element.dropdown.length > 0) {
                    var dropdownContent = getDropdownContent(element.dropdown);

                    attr['data-content'] = dropdownContent.prop('outerHTML');
                }

                buttonsGroups[currentButtonGroup].append($('<a>', attr));
            });

            var actionsButtons = '';

            $.each(buttonsGroups, function(index, element) {
                actionsButtons += $(element).prop('outerHTML');
            });


            return actionsButtons;
        }

        /**
         * Label and info Formatter
         * @param item
         * @param options
         * @param rowObject
         * @return {string}
         */
        this.labelAndTooltip = function (item) {
            var i = getItemStatus(item);

            if (i.hasNoValue) {
                return self.notAvailable();
            }

            if (i.isJson) {
                item = JSON.parse(item);
                i = getItemStatus(item);
            }

            var labelClass = 'label-default';

            if (i.isString) {
                return '<span class="label ' + labelClass + '">' + item + '</span>';
            }

            labelClass = item.labelClass || 'label-default';

            if (item.tooltip) {
                var tooltipType = item.tooltipType || 'default';
                var tooltipPlacement = item.tooltipPlacement || 'top';

                item.tooltip = ' data-toggle="tooltip" data-placement="' + tooltipPlacement + '" data-type="' + tooltipType + '" data-original-title="' + item.tooltip + '"';
                labelClass += ' label-with-tooltip';
            } else {
                item.tooltip = '';
            }

            return '<span class="label ' + labelClass + '"' + item.tooltip + '>' + item.label + '</span>';
        }

        /**
         * Badge Formatter
         * @param item
         * @param options
         * @param rowObject
         * @return {string}
         */
        this.badge = function (item) {
            var i = getItemStatus(item);

            if (i.hasNoValue) {
                return self.notAvailable();
            }

            if ((i.isString && !i.isJson) || i.isNumber) {
                return '<span class="badge">' + item + '</span>';
            }

            if (i.isJson || i.isObject) {
                if (i.isJson) {
                    item = JSON.parse(item);
                }

                var badgeHtml = '';
                if (item.text) {
                    badgeHtml += item.text + ' ';
                }
                badgeHtml += '<span class="badge">' + item.number + '</span>';

                return badgeHtml;
            } else {
                return self.notAvailable();
            }
        }

        /**
         * Price Formatter
         * @param item
         * @param options
         * @param rowObject
         * @return {string}
         */
        this.price = function (item) {
            var i = getItemStatus(item);

            if (i.hasNoValue) {
                return self.notAvailable();
            }

            Number.prototype.formatMoney = function(c, d, t) {
                var n = this;
                var c = isNaN(c = Math.abs(c)) ? 2 : c;
                var d = d || ",";
                var t = t || ".";
                var s = n < 0 ? "-" : "";
                var i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c)));
                var j = (j = i.length) > 3 ? j % 3 : 0;
                return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
            };

            if (i.isJson || i.isObject) {
                if (i.isJson) {
                    item = JSON.parse(item);
                }

                var currency = item.currency || 'RON';
                var value = Number(item.value);

                return '<div class="text-right">' + value.formatMoney() + ' ' + currency + '</div>';
            }

            if (i.isNumber || i.isString) {
                return '<div class="text-right">' + Number(item).formatMoney() + ' RON</div>';
            }
        }

        /**
         * Product Formatter
         * @param item
         * @param options
         * @param rowObject
         * @return {string}
         */
        this.product = function (item) {
            var i = getItemStatus(item);

            if (i.hasNoValue) {
                return self.notAvailable();
            }

            if (i.isJson || i.isObject) {
                if (i.isJson) {
                    item = JSON.parse(item);
                }

                var link = item.link || '';
                var name = item.name;

                if (link) {
                    return '<a href="' + link + '" title="' + name + '">' + name + '</a>';
                }
                return name;
            }

            return item;
        }

        /**
         * Check item properties
         * @param item
         * @return {object}
         */
        function getItemStatus (item) {
            return {
                hasNoValue: ( item == '' || item == null || typeof(item) == 'undefined' ),
                isNumber: (typeof(item) == 'number'),
                isJson: isJson(item),
                isObject: ( Object.prototype.toString.call(item) === '[object Object]' ),
                isString: ( typeof(item) == 'string' ),
                isArray: ( item instanceof Array ),
                isDateTimeArray: ( item instanceof Array && (item.length == 1 || item.length == 2) )
            };
        };

        /**
         * Test to see if it's json
         * @param str
         * @returns {boolean}
         */
        function isJson (str) {
            try {
                JSON.parse(str);
                if (str.indexOf('{') === -1) {
                    return false;
                }
            } catch (e) {
                return false;
            }
            return true;
        };

        /**
         * Create DateTime formatter
         * @param item
         * @param type - Possible values: 'datetime', 'date', 'time'
         * @return {string}
         */
        function dateTimeFormatter(item, type, noIcon) {
            if ($.inArray(type, ['datetime', 'date', 'time']) == -1) {
                return item;
            }

            var i = getItemStatus(item);

            if (i.hasNoValue || i.isNumber) {
                return self.notAvailable();
            }

            if ((i.isString && !i.isJson) || i.isDateTimeArray) {
                var dateTimeArray = item;
                if (i.isString) {
                    dateTimeArray = item.split(' ');
                }

                if (type == 'datetime') {
                    return dateTimeFormatterString({date: dateTimeArray[0], time: dateTimeArray[1]}, type, noIcon);
                } else {
                    var dateOrTime = {};
                    dateOrTime[type] = dateTimeArray[0];
                    return dateTimeFormatterString(dateOrTime, type, noIcon);
                }
            }

            if (i.isJson || i.isObject) {
                var dateTimeObject = item;
                if (i.isJson) {
                    dateTimeObject = JSON.parse(item);
                }

                return dateTimeFormatterString(dateTimeObject, type, noIcon);
            }

            return item;
        };

        /**
         * Generate DateTime formatter's string
         * @param dateTime
         * @param type - Possible values: 'datetime', 'date', 'time'
         * @return {string}
         */
        function dateTimeFormatterString (dateTime, type, noIcon) {
            var result = '<span class="formatter-' + type + '">';

            var iconCalendar = '<i class="fa fa-calendar"></i>' + ' ';
            var iconClock = '<i class="fa fa-clock-o"></i>' + ' ';

            if (noIcon == true) {
                iconCalendar = '';
                iconClock = '';
            }

            if (dateTime.date != '' && dateTime.date != null && typeof(dateTime.date) == 'string') {
                result += '<span class="text-nowrap">'+ iconCalendar + dateTime.date + '</span> ';
            }

            if (dateTime.time != '' && dateTime.time != null && typeof(dateTime.time) == 'string') {
                dateTime.time = timeRemoveMicroseconds(dateTime.time);
                result += '<span class="text-nowrap">'+ iconClock + dateTime.time + '</span> ';
            }

            result += '</span>';

            return result;
        };

        /**
         * Remove microseconds from time format
         * @param time
         * @return {string}
         */
        function timeRemoveMicroseconds (time) {
            return (time.indexOf('.') == -1) ? time : time.substr(0, time.indexOf('.'));
        }

        /**
         * Create UserEmail formatter
         * @param item
         * @param noIcon - Possible values: false, true
         * @return {string}
         */
        function userEmailFormatter (item, noIcon) {
            var i = getItemStatus(item);

            if (i.hasNoValue || i.isNumber) {
                return self.notAvailable();
            }

            if (i.isString && !i.isJson) {
                return userEmailFormatterString(item, '', noIcon);
            }


            if (i.isJson || i.isObject) {
                var userEmail = item;
                if (i.isJson) {
                    var userEmail = JSON.parse(item);
                }

                userEmail.user = getUser(userEmail);

                return userEmailFormatterString(userEmail.email, userEmail.user, noIcon);
            }

            return item;
        };

        /**
         * Generate UserEmail formatter's string
         * @param email
         * @param user
         * @return {string}
         */
        function userEmailFormatterString (email, user, noIcon) {
            var result = '';

            var icon = '<i class="fa fa-user"></i> ';
            if (noIcon == true) {
                icon = '';
            }

            result = '<span class="formatter-useremail">' + icon + '<a href="mailto:' + email + '">';

            if (user != '' && user != null && typeof(user) == 'string') {
                result += user;
            } else {
                result += email;
            }

            result += '</a></span>';

            return result;
        };

        /**
         * Get user from userEmail object
         * @param userEmail
         * @return {string}
         */
        function getUser (userEmail) {
            var posibleVariableName = ['user', 'username', 'displayName', 'displayname', 'email'];
            var user = '';

            $.each(posibleVariableName, function(index, element) {
                if (userEmail[element] != '' && userEmail[element] != null && typeof(userEmail[element]) == 'string') {
                    user = userEmail[element];
                    return false;
                }
            });

            return user;
        };

        /**
         * Generate Country formatter's string
         * @param item
         * @return {string}
         */
        function countryFormatterString (item) {
            return '<span class="formatter-country" data-country="' + item.country + '"><i class="flag-icon flag-icon-' + item.countryCode + '"></i>'+ " " + item.country + '</span>';
        };

        /**
         * Get current button group
         * @param buttonsGroups
         * @param elementGroup
         * @return {*}
         */
        function getCurrentButtonGroup(buttonsGroups, elementGroup) {
            var currentButtonGroup;
            if (typeof(elementGroup) == 'undefined') {
                var buttonsGroupsKeys = Object.keys(buttonsGroups);
                currentButtonGroup = buttonsGroupsKeys[buttonsGroupsKeys.length - 1] + 1;
            } else {
                currentButtonGroup = elementGroup;
            }

            return currentButtonGroup;
        }

        /**
         * Create HTML for dropdown
         * @param elementDropdown
         * @return {object}
         */
        function getDropdownContent(elementDropdown) {
            var dropdownContent = $('<ul>', { class: 'dropdown-menu dropdown-default' });;

            $.each(elementDropdown, function(index, subElement) {
                var liContent = $('<li>');
                liContent.append( $('<a>', makeButtonSetup(subElement, false)) );
                dropdownContent.append(liContent);
            });

            return dropdownContent;
        }

        /**
         *
         * @param buttonData
         * @return {object}
         */
        function makeButtonSetup(buttonData, isButton) {
            var buttonSetup = buttonData.attr || {};
            buttonSetup.class = buttonSetup.class || '';

            if (isButton == undefined) {
                isButton = true;
            }

            if (isButton) {
                buttonSetup.class += ' btn btn-default btn-sm';
            }

            if (buttonData.dropdown instanceof Array && buttonData.dropdown.length > 0) {
                buttonSetup.class += ' more-actions';
            }

            buttonSetup.href = buttonSetup.href || 'javascript:void(0);';

            var buttonContentArray = [];
            if (buttonData.icon) {
                buttonContentArray.push('<i class="fa ' + buttonData.icon + '" aria-hidden="true"></i>');
            }
            if (buttonData.label) {
                buttonContentArray.push('<span>' + buttonData.label + '</span>');
            }
            buttonSetup.html = buttonContentArray.join(' ');

            return buttonSetup;
        };
    };

    var PhotonDataFormatter = new PhotonDataFormatter();

    window.PhotonDataFormatter = PhotonDataFormatter;

}(window, jQuery));