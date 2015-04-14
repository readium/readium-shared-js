//  Created by Juan Corona <juanc@evidentpoint.com>
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

//TODO: This could be made into a plugin in the future.
ReadiumSDK.Views.FontLoader = function ($iframe, options) {
    options = options || {};

    var debug = options.debug || false;

    var document = $iframe[0].contentDocument;
    var styleSheets = $iframe[0].contentDocument.styleSheets;
    var fontFamilies = [];
    var fontFamilyRules = [];
    _.each(styleSheets, function (styleSheet) {
        _.each(styleSheet.cssRules || styleSheet.rules, function (rule) {
            var fontFamily = null;
            if (rule.style && (rule.style.getPropertyValue || rule.style.fontFamily)) {
                fontFamily = rule.style.getPropertyValue("font-family") || rule.style.fontFamily;
            }
            if (fontFamily) {
                if (rule.type === CSSRule.FONT_FACE_RULE) {
                    fontFamilies.push([fontFamily.replace(/(^['"]|['"]$)/g, '').replace(/\\(['"])/g, '$1'), fontFamily]);
                } else {
                    fontFamilyRules.push(rule);
                }
            }
        });
    });
    if (debug) {
        console.log(fontFamilies);
    }
    var usedFontFamilies = [];
    _.each(fontFamilyRules, function (rule) {
        var usedFontFamily = _.find(fontFamilies, function (family) {
            if (rule.style.fontFamily && ~rule.style.fontFamily.indexOf(family[1])) {
                return true;
            }
        });

        if (usedFontFamily
            && rule.selectorText
            && !_.contains(usedFontFamilies, usedFontFamily[0])
            && document.querySelector(rule.selectorText)) {

            usedFontFamilies.push(usedFontFamily[0]);
        }
    });

    if (debug) {
        console.log(usedFontFamilies);
    }

    this.waitForFonts = function (callback) {
        if (!window.FontLoader) {
            return;
        }
        callback = _.once(callback);
        var loadCount = 0;

        var fontLoader = new FontLoader(usedFontFamilies, {
            "fontsLoaded": function(error) {
                if (debug) {
                    if (error !== null) {
                        // Reached the timeout but not all fonts were loaded
                        console.log(error.message);
                        console.log(error.notLoadedFontFamilies);
                    } else {
                        // All fonts were loaded
                        console.log("all fonts were loaded");
                    }
                }
                callback();
            },
            "fontLoaded": function(fontFamily) {
                loadCount++;
                if (debug) {
                    console.log("font loaded: " + fontFamily);
                }
                if (usedFontFamilies.length > 3 && (loadCount / usedFontFamilies.length) >= 0.75) {
                    if (debug) {
                        console.log('font loader: early callback');
                    }
                    callback();
                }
            }
        }, 1500, document);

        fontLoader.loadFonts();
    };
};