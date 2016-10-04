    //  Created by Boris Schneiderman.
//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.
//  
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
//  OF THE POSSIBILITY OF SUCH DAMAGE.

define(["./style"], function(Style) {

/**
 *
 * @class Models.StyleCollection
 * @return StyleCollection
 * @constructor
 */

var StyleCollection = function() {

    var _styles = [];

    /**
     * Clears the collection.
     *
     * @method     clear
     */

    this.clear = function() {
        _styles.length = 0;

    };

    /**
     * Finds the style of a selected item
     *
     * @method     findStyle
     * @param      selector
     * @return     {Models.Style}
     */

    this.findStyle = function(selector) {

        var count = _styles.length;
        for(var i = 0; i < count; i++) {
            if(_styles[i].selector === selector) {
                return _styles[i];
            }
        }

        return undefined;
    };

    /**
     * Adds a style to the collection
     *
     * @method     addStyle
     * @param      selector
     * @param      declarations
     * @return     {Models.Style}
     */

    this.addStyle = function(selector, declarations) {

        var style = this.findStyle(selector);

        if(style) {
            style.setDeclarations(declarations);
        }
        else {
            style = new Style(selector, declarations);
            _styles.push(style);
        }

        return style;
    };

    /**
     * Removes a style from the collection
     *
     * @method     addStyle
     * @param      selector
     */

    this.removeStyle = function(selector) {
        
        var count = _styles.length;

        for(var i = 0; i < count; i++) {

            if(_styles[i].selector === selector) {
                _styles.splice(i, 1);
                return;
            }
        }
    };

    /**
     * Gets all styles
     *
     * @method     getStyles
     * @return     {Array}
     */

    this.getStyles = function() {
        return _styles;
    };

    /**
     * Resets the styles
     *
     * @method     resetStyleValues
     */

    this.resetStyleValues = function() {

        var count = _styles.length;

        for(var i = 0; i < count; i++) {

            var style = _styles[i];
            var declarations = style.declarations;

            for(var prop in declarations) {
                if(declarations.hasOwnProperty(prop)) {
                    declarations[prop] = '';
                }
            }
        }
    }

};
    return StyleCollection;
});
