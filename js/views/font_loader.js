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
// A plugin would be ideal because we can make a light-weight alternative that doesn't need the FontLoader shim and the CSSOM parser.
define(["jquery", "underscore", "FontLoader", "cssom"], function($, _, FontLoader, CSSOM) {

var FontLoaderFallback = function(document, options) {
    var debug = options.debug;

    var getRestrictedCssRules = function (styleSheet, callback) {
        $.get(styleSheet.href).done(function(data) {
            callback(CSSOM.parse(data).cssRules);
        }).fail(function() {
            callback(null);
        });
    };

    var getUsedFonts = function(callback) {
        var styleSheets = document.styleSheets;
        var fontFamilies = [];
        var fontFamilyRules = [];

        // if no style sheets are found return immediately
        if (!styleSheets || styleSheets.length <= 0) {
            callback([]);
            return;
        }

        var getFontFamilyFromRule = function(rule) {
            if (rule.style && (rule.style.getPropertyValue || rule.style.fontFamily)) {
                return rule.style.getPropertyValue("font-family") || rule.style.fontFamily;
            }
        }

        var returnUsedFonts = function() {
            if (debug) {
                console.log(fontFamilies);
            }
            var usedFontFamilies = [];
            _.each(fontFamilyRules, function(rule) {
                var usedFontFamily = _.find(fontFamilies, function(family) {
                    var fontFamily = getFontFamilyFromRule(rule);
                    if (fontFamily && ~fontFamily.indexOf(family[1])) {
                        return true;
                    }
                });

                if (usedFontFamily && rule.selectorText && !_.contains(usedFontFamilies, usedFontFamily[0]) && document.querySelector(rule.selectorText)) {
                    usedFontFamilies.push(usedFontFamily[0]);
                }
            });

            if (debug) {
                console.log(usedFontFamilies);
            }

            callback(usedFontFamilies);
        };

        var processedCount = 0;
        var processCssRules = function(cssRules) {
            _.each(cssRules, function(rule) {
                var fontFamily = getFontFamilyFromRule(rule);
                if (fontFamily) {
                    if (rule.type === CSSRule.FONT_FACE_RULE) {
                        fontFamilies.push([fontFamily.replace(/(^['"]|['"]$)/g, '').replace(/\\(['"])/g, '$1'), fontFamily]);
                    } else {
                        fontFamilyRules.push(rule);
                    }
                }
            });

            processedCount++;

            if (processedCount >= styleSheets.length) {
                returnUsedFonts();
            }
        };

        _.each(styleSheets, function(styleSheet) {
            var cssRules;
            // Firefox (and possibly IE as well) throw a security exception if the CSS was loaded from a different domain.
            // Other browsers just have null as the value of cssRules for that case.
            try {
                cssRules = styleSheet.cssRules || styleSheet.rules;
            } catch (ignored) {}

            if (!cssRules) {
                getRestrictedCssRules(styleSheet, processCssRules);
            } else {
                processCssRules(cssRules);
            }
        });
    };

    return function(callback) {
        callback = _.once(callback);
        var loadCount = 0;

        getUsedFonts(function(usedFontFamilies){
            var fontLoader = new FontLoader(usedFontFamilies, {
                "fontsLoaded": function(error) {
                    if (debug) {
                        if (error !== null) {
                            // Reached the timeout but not all fonts were loaded
                            console.log("font loader: " + error.message, error.notLoadedFonts);
                        } else {
                            // All fonts were loaded
                            console.log("font loader: all fonts were loaded");
                        }
                    }
                    callback();
                },
                "fontLoaded": function(font) {
                    loadCount++;
                    if (debug) {
                        console.log("font loaded: " + font.family);
                    }
                    if (usedFontFamilies.length > options.minLoadCount && (loadCount / usedFontFamilies.length) >= options.minLoadRatio) {

                        if (debug) {
                            console.log('font loader: early callback');
                        }
                        callback();
                    }
                }
            }, options.timeout, document);

            fontLoader.loadFonts();
        });
    };
};

var FontLoaderNative = function(document, options) {
    var debug = options.debug;

    return function(callback) {
        callback = _.once(callback);
        var loadCount = 0;

        var fontFaceCount = document.fonts.size;
        var fontLoaded = function(font) {
            loadCount++;
            if (debug) {
                console.log("(native) font loaded: " + font.family);
            }
            if (fontFaceCount > options.minLoadCount && (loadCount / fontFaceCount) >= options.minLoadRatio) {

                if (debug) {
                    console.log('(native) font loader: early callback');
                }
                callback();
            }
        }

        var fontIterator = function(font) {
            font.loaded.then(function() {
                fontLoaded(font);
            });
        };

        // For some reason (at this time) Chrome's implementation has a .forEach
        // but it is not Array-like. This is opposite with Firefox's though.
        if (document.fonts.forEach) {
            document.fonts.forEach(fontIterator);
        } else {
            _.each(document.fonts, fontIterator);
        }

        document.fonts.ready.then(function() {
            if (debug) {
                // All fonts were loaded
                console.log("(native) font loader: all fonts were loaded");
            }
            callback();
        });


        window.setTimeout(function() {
            if (debug && loadCount !== fontFaceCount) {
                console.log('(native) font loader: timeout, not all fonts loaded/required');
            } else if (debug) {
                console.log('(native) font loader: timeout');
            }
            callback();
        }, options.timeout);
    }
}

var FontLoaderWrapper = function($iframe, options) {
    options = options || {};

    options.debug = options.debug || false;
    options.timeout = options.timeout || 1500;
    options.minLoadCount = options.minLoadCount || 3;
    options.minLoadRatio = options.minLoadRatio || 0.75;

    var document = $iframe[0].contentDocument;

    // For browsers without CSS Font Loading Module
    var fallbackNeeded = !document.fonts;

    var fontLoader = fallbackNeeded ? FontLoaderFallback : FontLoaderNative;

    this.waitForFonts = fontLoader(document, options);
};

return FontLoaderWrapper;

});
