(function($) {
    return $.fn.ajaxChosen = function(settings, callback) {
        var chosenXhr, defaultOptions, options, select;
        if (settings == null) {
            settings = {};
        }
        defaultOptions = {
            minTermLength: 3,
            afterTypeDelay: 500,
            jsonTermKey: "term",
            keepTypingMsg: "Keep typing...",
            lookingForMsg: "Looking for"
        };

        var typingTimer;
        var doneTypingInterval = 1200;  //time in ms
        var selected_values = [];

        function createSelectOptionsWithoutMultiple(option, itemsLength) {
            if (option.val().length > 0 && itemsLength > 0) {
                return $(option).remove();
            } else {
                return selected_values.push($(option).val() + "-" + $(option).text());
            }
        }

        function createSelectOptionsWithMultiple(option) {
            if (!$(option).is(":selected")) {
                return $(option).remove();
            } else {
                return selected_values.push($(option).val() + "-" + $(option).text());
            }
        }

        function calculateFieldWidth(field, chosenSearchContainer) {
            var div, f_width, style, style_block, styles, w, _i, _len, fieldVal;
            fieldVal = field.val();
            style_block = "position:absolute; left: -1000px; top: -1000px; display:none;";

            styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
            for (_i = 0, _len = styles.length; _i < _len; _i++) {
                style = styles[_i];
                style_block += style + ":" + field.css(style) + ";";
            }

            div = $('<div />', {
                'style': style_block
            });
            div.text(fieldVal);
            $('body').append(div);
            w = div.width() + 25;
            div.remove();

            f_width = $(chosenSearchContainer).width();

            if (w > f_width - 10) {
                w = f_width - 10;
            }

            return w;
        }

        select = this;
        chosenXhr = null;
        options = $.extend({}, defaultOptions, $(select).data(), settings);
        this.chosen(options);
        var chosenSearchContainer;
        //Chosen multiple
        if($(this).next(".chosen-container").find(".chosen-choices").length) {
            chosenSearchContainer = $(this).next(".chosen-container").find(".chosen-choices");
        }
        return this.each(function() {
            return $(this).next(".chosen-container").find(".chosen-search input, .chosen-choices input").on('keyup', function() {
                clearTimeout(typingTimer);
                $this = $(this);
                if($(this).val().length == 0) {
                    $(chosenSearchContainer).removeClass(".chosen-container");
                    $(this).removeAttr('readonly');
                }
                else {
                    typingTimer = setTimeout(function(){

                        field = $this;
                        var field, msg, success, untrimmed_val, val;
                        untrimmed_val = $this.val();
                        val = $.trim($this.val());
                        msg = val.length < options.minTermLength ? options.keepTypingMsg : options.lookingForMsg + (" '" + val + "'");
                        select.next('.chosen-container').find('.no-results').text(msg);
                        $this.data('prevVal', val);
                        if ($this[0].timer) {
                            clearTimeout($this[0].timer);
                        }
                        if (val.length < options.minTermLength) {
                            return false;
                        }

                        if (options.data == null) {
                            $(chosenSearchContainer).removeClass('chosen-readonly');
                            field.removeAttr('readonly');
                            options.data = {};
                        }
                        options.data[options.jsonTermKey] = val;
                        if (options.dataCallback != null) {
                            options.data = options.dataCallback(options.data);
                        }
                        success = options.success;
                        $this.attr('readonly',true);
                        $(chosenSearchContainer).addClass('chosen-readonly');
                        options.success = function (data) {
                            var items, nbItems;
                            if (data == null) {
                                return;
                            }
                            selected_values = [];
                            items = callback != null ? callback(data, field) : data;

                            var isMultiple = select.attr('multiple') ? true : false;
                            var itemsLength = Object.keys(items).length;
                            var selectOptions = select.find('option');

                            $(selectOptions).each(function() {
                                if(isMultiple) {
                                    createSelectOptionsWithMultiple($(this));
                                } else {
                                    createSelectOptionsWithoutMultiple($(this), itemsLength);
                                }
                            });
                            select.find('optgroup:empty').each(function () {
                                return $this.remove();
                            });
                            nbItems = 0;
                            $.each(items, function (i, element) {
                                var group, text, value;
                                nbItems++;
                                if (element.group) {
                                    group = select.find("optgroup[label='" + element.text + "']");
                                    if (!group.size()) {
                                        group = $("<optgroup />");
                                    }
                                    group.attr('label', element.text).appendTo(select);
                                    return $.each(element.items, function (i, element) {
                                        var text, value;
                                        if (typeof element === "string") {
                                            value = i;
                                            text = element;
                                        } else {
                                            value = element.value;
                                            text = element.text;
                                        }
                                        if ($.inArray(value + "-" + text, selected_values) === -1) {
                                            return $("<option />").attr('value', value).html(text).appendTo(group);
                                        }
                                    });
                                } else {
                                    if (typeof element === "string") {
                                        value = i;
                                        text = element;
                                    } else {
                                        value = element.value;
                                        text = element.text;
                                    }
                                    var data_label = element.search_label ? element.search_label : text;
                                    if ($.inArray(value + "-" + text, selected_values) === -1) {
                                        return $("<option />").attr({'value': value, 'data-search-label': data_label}).html(text).appendTo(select);
                                    }
                                }
                            });

                            field.removeAttr('readonly');
                            $(chosenSearchContainer).removeClass('chosen-readonly');
                            select.data().chosen.no_results_clear();

                            if (nbItems) {
                                select.trigger("chosen:updated");
                            } else {
                                //If not default value in entity ajax
                                if(select.data().chosen.current_selectedIndex !== 0) {
                                    //Create div that displays "No results"
                                    var fieldVal = field.val();
                                    select.data().chosen.results_showing = false;
                                    select.trigger("chosen:updated");
                                    select.data().chosen.results_showing = true;
                                    select.data().chosen.no_results_clear();
                                    select.data().chosen.no_results(fieldVal);
                                    field.width(calculateFieldWidth(field, chosenSearchContainer));
                                } else {
                                    select.data().chosen.no_results(field.val());
                                }
                            }
                            if (settings.success != null) {
                                settings.success(data);
                            }
                            return field.val(untrimmed_val);
                        };

                        return $this[0].timer = setTimeout(function () {
                            if (chosenXhr) {
                                chosenXhr.abort();
                            }
                            return chosenXhr = $.ajax(options);
                        }, options.afterTypeDelay);
                    }, doneTypingInterval);
                }
            });
        });
    };
})(jQuery);