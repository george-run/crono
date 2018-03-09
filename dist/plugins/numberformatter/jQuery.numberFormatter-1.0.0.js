/**
 * jQuery custom numeric input formatter plugin
 * Created on 20/07/2015.
 * Copyright (c) 2015 Ionut Vornicescu
 * Licensed under the MIT license
 * Version: 1.0.1
 */

(function ( $ ) {

    $.fn.numberFormatter = function( options ) {
        var self = this;

        /**
         * Set component settings
         */
        this.settings = $.extend( {
            decimal_separator: ",",
            thousands_separator: ".",
            no_of_decimals: 2,
            max_int_number_length: 10
        }, options );

        /**
         * The maximmum number of decimals is 4
         */
        if ( self.settings.no_of_decimals > 4 ) {
            self.settings.no_of_decimals = 4;
        }

        this.valBeforeDrop = $(self).val();

        /**
         * Set caret position at the end of the number in input field
         */
        this.setCaretPositionToInput = function () {
            var pos = $(self).val().length + 2;
            document.getElementById( $(self).attr('id') ).setSelectionRange( pos, pos );
        };/** END - setCaretPositionToInput */

        /**
         * Check if the given character is a digit
         *
         * @param {string} character
         * @returns {boolean}
         */
        this.isDigit = function ( character ) {
            var c = character.charAt(0);
            return ( c >= '0' && c <= '9' );
        };/** END - isDigit */

        /**
         * Format the value from input according to the settings of the component
         *
         * @returns {string}
         */
        this.formatNumber = function () {
            var newValueIntPart = [],           /** Array that holds the integer part of the number */
            newValueDecimalPart = [];       /** Array that holds the decimal part of the number */

            var currentValue = $(this).val();

            var total_no_of_digits = self.settings.no_of_decimals + self.settings.max_int_number_length;

            /**
             * Put all digits from input field into newValueIntPart
             */
            for ( i = 0; i < currentValue.length; i++ ) {
                if ( self.isDigit( currentValue[i] ) && newValueIntPart.length < total_no_of_digits ) {
                    newValueIntPart.push( currentValue[i] );
                }
            }

            /**
             * Take the decimal digits from newValueIntPart and put them into newValueDecimalPart
             */
            for ( i = 0; i < self.settings.no_of_decimals; i++ ) {
                var new_digit = newValueIntPart.pop();
                if ( new_digit != undefined ) {
                    newValueDecimalPart.unshift( new_digit );
                } else {
                    newValueDecimalPart.unshift(0);
                }
            }

            if ( newValueIntPart.length == 0 ) {
                newValueIntPart.push(0);
            }

            var newValueIntPartString = parseInt( newValueIntPart.join('')).toString();
            var newValueDecimalPartString = newValueDecimalPart.join('');

            var extraThirdLength = ( extraThirdLength = newValueIntPartString.length ) > 3 ? extraThirdLength % 3 : 0;

            /**
             * Format the numbers from arrays an concatenate them in order to obtain the formatted number
             * @type {string}
             */
            var newValue = ( extraThirdLength ? newValueIntPartString.substr(0, extraThirdLength) + self.settings.thousands_separator : "" )
                + newValueIntPartString.substr(extraThirdLength).replace( /(\d{3})(?=\d)/g, "$1" + self.settings.thousands_separator )
                + ( self.settings.no_of_decimals ? self.settings.decimal_separator + newValueDecimalPartString : "");

            return newValue;
        };/** END - formatNumber */

        this.on('keydown', function( event ) {
            /**
             * If any of the arrows keys are pressed the default event is stopped
             * and the caret it is moved to the end of the number
             */
            if ( ( event.keyCode == 65 && event.ctrlKey == true )               /** Ctrl + A = Select all */
                || event.keyCode == 8 || event.keyCode == 46                /** 8 = Backspace; 46 = Delete */
                || ( event.keyCode >= 48 && event.keyCode <= 57 )           /** Numbers from alphanumeric keys */
                || ( event.keyCode >= 96 && event.keyCode <= 105 ) ) {      /** Numpad numbers */

                /**
                 * For these keys standard behavior should happen after
                 * the caret have been moved to the end of the number
                 */
                self.setCaretPositionToInput();

            } else if ( event.keyCode == 17                                     /** Ctrl */
                || ( event.keyCode == 67 && event.ctrlKey == true )             /** Ctrl + C = Copy to clipboard */
                || event.keyCode == 9) {                                        /** Tab
                /**
                 * For these keys standard behavior should happen
                 */
            } else {
                /**
                 * For other keys standard behavior should never happen
                 */
                event.preventDefault();
            }
        } );

        this.on('focus', function( event ) {
            /**
             * When input field is focused the caret it is moved to the end of the number
             */
            self.setCaretPositionToInput();
        } );

        this.on('paste', function( event ) {
            /**
             * Paste event is disabled
             */
            event.preventDefault();
        } );

        this.on('drop', function( event ) {
            /**
             * Drop event is disabled
             */
            event.preventDefault();
        } );

        this.on('change input', function( event ) {
            /**
             * When the number is changed it is reformatted and the caret it is moved to the end of the number
             */
            $(this).val( self.formatNumber() );
            self.setCaretPositionToInput();
        } );

        /**
         * Keep chaining
         */
        return this;
    };

}( jQuery ));