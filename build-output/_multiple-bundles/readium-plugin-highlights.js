/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
define('readium_plugin_highlights/lib/class',[],function() {

    var initializing = false,
        fnTest = /xyz/.test(function() {
            xyz;
        }) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    var Class = function() {};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn) {
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if (!initializing && this.init)
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };

    return Class;
});

define('readium_plugin_highlights/helpers',[],function() {
    var HighlightHelpers = {
        getMatrix: function($obj) {
            var matrix = $obj.css("-webkit-transform") ||
                $obj.css("-moz-transform") ||
                $obj.css("-ms-transform") ||
                $obj.css("-o-transform") ||
                $obj.css("transform");
            return matrix === "none" ? undefined : matrix;
        },
        getScaleFromMatrix: function(matrix) {
            var matrixRegex = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*(-?\d*\.?\d+),\s*0,\s*0\)/,
                matches = matrix.match(matrixRegex);
            return matches[1];
        }
    };

    return HighlightHelpers;
});

define('readium_plugin_highlights/models/text_line_inferrer',["../lib/class"], function(Class) {
    var TextLineInferrer = Class.extend({

        init: function(options) {
            this.lineHorizontalThreshold = options.lineHorizontalThreshold || 0;
            this.lineHorizontalLimit = options.lineHorizontalLimit || 0;
        },

        // ----------------- PUBLIC INTERFACE --------------------------------------------------------------

        inferLines: function(rectTextList) {
            var inferredLines = [];
            var numRects = rectTextList.length;
            var numLines = 0;
            var currLine;
            var currRect;
            var currRectTextObj;
            var rectAppended;

            // Iterate through each rect
            for (var currRectNum = 0; currRectNum <= numRects - 1; currRectNum++) {
                currRectTextObj = rectTextList[currRectNum];
                currRect = currRectTextObj.rect;
                // Check if the rect can be added to any of the current lines
                rectAppended = false;

                if (inferredLines.length > 0) {
                    currLine = inferredLines[inferredLines.length - 1];

                    if (this.includeRectInLine(currLine.line, currRect.top, currRect.left,
                            currRect.width, currRect.height)) {
                        rectAppended = this.expandLine(currLine.line, currRect.left, currRect.top,
                            currRect.width, currRect.height);

                        currLine.data.push(currRectTextObj);
                    }
                }

                if (!rectAppended) {
                    inferredLines.push({
                        data: [currRectTextObj],
                        line: this.createNewLine(currRect.left, currRect.top,
                            currRect.width, currRect.height)
                    });
                    // Update the number of lines, so we're not using .length on every iteration
                    numLines = numLines + 1;
                }
            }
            return inferredLines;
        },


        // ----------------- PRIVATE HELPERS ---------------------------------------------------------------

        includeRectInLine: function(currLine, rectTop, rectLeft, rectWidth, rectHeight) {
            // is on an existing line : based on vertical position
            if (this.rectIsWithinLineVertically(rectTop, rectHeight, currLine.maxTop, currLine.maxBottom)) {
                if (this.rectIsWithinLineHorizontally(rectLeft, rectWidth, currLine.left,
                        currLine.width, currLine.avgHeight)) {
                    return true;
                }
            }
            return false;
        },

        rectIsWithinLineVertically: function(rectTop, rectHeight, currLineMaxTop, currLineMaxBottom) {
            var rectBottom = rectTop + rectHeight;
            var lineHeight = currLineMaxBottom - currLineMaxTop;
            var lineHeightAdjustment = (lineHeight * 0.75) / 2;
            var rectHeightAdjustment = (rectHeight * 0.75) / 2;

            rectTop = rectTop + rectHeightAdjustment;
            rectBottom = rectBottom - rectHeightAdjustment;
            currLineMaxTop = currLineMaxTop + lineHeightAdjustment;
            currLineMaxBottom = currLineMaxBottom - lineHeightAdjustment;

            if (rectTop === currLineMaxTop && rectBottom === currLineMaxBottom) {
                return true;
            } else if (rectTop < currLineMaxTop && rectBottom < currLineMaxBottom &&
                rectBottom > currLineMaxTop) {
                return true;
            } else if (rectTop > currLineMaxTop && rectBottom > currLineMaxBottom &&
                rectTop < currLineMaxBottom) {
                return true;
            } else if (rectTop > currLineMaxTop && rectBottom < currLineMaxBottom) {
                return true;
            } else if (rectTop < currLineMaxTop && rectBottom > currLineMaxBottom) {
                return true;
            } else {
                return false;
            }
        },

        rectIsWithinLineHorizontally: function(rectLeft, rectWidth, currLineLeft, currLineWidth,
            currLineAvgHeight) {
            var lineGapHeuristic = 2 * currLineAvgHeight;
            var rectRight = rectLeft + rectWidth;
            var currLineRight = rectLeft + currLineWidth;

            if ((currLineLeft - rectRight) > lineGapHeuristic) {
                return false;
            } else if ((rectLeft - currLineRight) > lineGapHeuristic) {
                return false;
            } else {
                return true;
            }
        },

        createNewLine: function(rectLeft, rectTop, rectWidth, rectHeight) {
            var maxBottom = rectTop + rectHeight;

            return {
                left: rectLeft,
                startTop: rectTop,
                width: rectWidth,
                avgHeight: rectHeight,
                maxTop: rectTop,
                maxBottom: maxBottom,
                numRects: 1
            };
        },

        expandLine: function(currLine, rectLeft, rectTop, rectWidth, rectHeight) {
            var lineOldRight = currLine.left + currLine.width;

            // Update all the properties of the current line with rect dimensions
            var rectRight = rectLeft + rectWidth;
            var rectBottom = rectTop + rectHeight;
            var numRectsPlusOne = currLine.numRects + 1;

            // Average height calculation
            var currSumHeights = currLine.avgHeight * currLine.numRects;
            var avgHeight = Math.ceil((currSumHeights + rectHeight) / numRectsPlusOne);
            currLine.avgHeight = avgHeight;
            currLine.numRects = numRectsPlusOne;

            // Expand the line vertically
            currLine = this.expandLineVertically(currLine, rectTop, rectBottom);
            currLine = this.expandLineHorizontally(currLine, rectLeft, rectRight);

            return currLine;
        },

        expandLineVertically: function(currLine, rectTop, rectBottom) {
            if (rectTop < currLine.maxTop) {
                currLine.maxTop = rectTop;
            }
            if (rectBottom > currLine.maxBottom) {
                currLine.maxBottom = rectBottom;
            }

            return currLine;
        },

        expandLineHorizontally: function(currLine, rectLeft, rectRight) {
            var newLineLeft = currLine.left <= rectLeft ? currLine.left : rectLeft;
            var lineRight = currLine.left + currLine.width;
            var newLineRight = lineRight >= rectRight ? lineRight : rectRight;
            var newLineWidth = newLineRight - newLineLeft;

            //cancel the expansion if the line is going to expand outside a horizontal limit
            //this is used to prevent lines from spanning multiple columns in a two column epub view
            var horizontalThreshold = this.lineHorizontalThreshold;
            var horizontalLimit = this.lineHorizontalLimit;

            var leftBoundary = Math.floor(newLineLeft / horizontalLimit) * horizontalLimit;
            var centerBoundary = leftBoundary + horizontalThreshold;
            var rightBoundary = leftBoundary + horizontalLimit;
            if ((newLineLeft > leftBoundary && newLineRight > centerBoundary && newLineLeft < centerBoundary) || (newLineLeft > centerBoundary && newLineRight > rightBoundary)) {
                return undefined;
            }

            currLine.left = newLineLeft;
            currLine.width = newLineWidth;

            return currLine;
        }
    });

    return TextLineInferrer;
});

// https://github.com/heygrady/Units
//
// Copyright (c) 2013 Grady Kuhnline
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

define('readium_plugin_highlights/lib/length',[],function() {
    return function(document) {
        "use strict";

        // create a test element
        var testElem = document.createElement('test'),
            docElement = document.documentElement,
            defaultView = document.defaultView,
            getComputedStyle = defaultView && defaultView.getComputedStyle,
            computedValueBug,
            runit = /^(-?[\d+\.\-]+)([a-z]+|%)$/i,
            convert = {},
            conversions = [1 / 25.4, 1 / 2.54, 1 / 72, 1 / 6],
            units = ['mm', 'cm', 'pt', 'pc', 'in', 'mozmm'],
            i = 6; // units.length

        // add the test element to the dom
        docElement.appendChild(testElem);

        // test for the WebKit getComputedStyle bug
        // @see http://bugs.jquery.com/ticket/10639
        if (getComputedStyle) {
            // add a percentage margin and measure it
            testElem.style.marginTop = '1%';
            computedValueBug = getComputedStyle(testElem).marginTop === '1%';
        }

        // pre-calculate absolute unit conversions
        while (i--) {
            convert[units[i] + "toPx"] = conversions[i] ? conversions[i] * convert.inToPx : toPx(testElem, '1' + units[i]);
        }

        // remove the test element from the DOM and delete it
        docElement.removeChild(testElem);
        testElem = undefined;

        // convert a value to pixels
        function toPx(elem, value, prop, force) {
            // use width as the default property, or specify your own
            prop = prop || 'width';

            var style,
                inlineValue,
                ret,
                unit = (value.match(runit) || [])[2],
                conversion = unit === 'px' ? 1 : convert[unit + 'toPx'],
                rem = /r?em/i;

            if (conversion || rem.test(unit) && !force) {
                // calculate known conversions immediately
                // find the correct element for absolute units or rem or fontSize + em or em
                elem = conversion ? elem : unit === 'rem' ? docElement : prop === 'fontSize' ? elem.parentNode || elem : elem;

                // use the pre-calculated conversion or fontSize of the element for rem and em
                conversion = conversion || parseFloat(curCSS(elem, 'fontSize'));

                // multiply the value by the conversion
                ret = parseFloat(value) // conversion;
            } else {
                // begin "the awesome hack by Dean Edwards"
                // @see http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

                // remember the current style
                style = elem.style;
                inlineValue = style[prop];

                // set the style on the target element
                try {
                    style[prop] = value;
                } catch (e) {
                    // IE 8 and below throw an exception when setting unsupported units
                    return 0;
                }

                // read the computed value
                // if style is nothing we probably set an unsupported unit
                ret = !style[prop] ? 0 : parseFloat(curCSS(elem, prop));

                // reset the style back to what it was or blank it out
                style[prop] = inlineValue !== undefined ? inlineValue : null;
            }

            // return a number
            return ret;
        }

        // return the computed value of a CSS property
        function curCSS(elem, prop) {
            var value,
                pixel,
                unit,
                rvpos = /^top|bottom/,
                outerProp = ["paddingTop", "paddingBottom", "borderTop", "borderBottom"],
                innerHeight,
                parent,
                i = 4; // outerProp.length

            if (getComputedStyle) {
                // FireFox, Chrome/Safari, Opera and IE9+
                value = getComputedStyle(elem)[prop];
            } else if (pixel = elem.style['pixel' + prop.charAt(0).toUpperCase() + prop.slice(1)]) {
                // IE and Opera support pixel shortcuts for top, bottom, left, right, height, width
                // WebKit supports pixel shortcuts only when an absolute unit is used
                value = pixel + 'px';
            } else if (prop === 'fontSize') {
                // correct IE issues with font-size
                // @see http://bugs.jquery.com/ticket/760
                value = toPx(elem, '1em', 'left', 1) + 'px';
            } else {
                // IE 8 and below return the specified style
                value = elem.currentStyle[prop];
            }

            // check the unit
            unit = (value.match(runit) || [])[2];
            if (unit === '%' && computedValueBug) {
                // WebKit won't convert percentages for top, bottom, left, right, margin and text-indent
                if (rvpos.test(prop)) {
                    // Top and bottom require measuring the innerHeight of the parent.
                    innerHeight = (parent = elem.parentNode || elem).offsetHeight;
                    while (i--) {
                        innerHeight -= parseFloat(curCSS(parent, outerProp[i]));
                    }
                    value = parseFloat(value) / 100 // innerHeight + 'px';
                } else {
                    // This fixes margin, left, right and text-indent
                    // @see https://bugs.webkit.org/show_bug.cgi?id=29084
                    // @see http://bugs.jquery.com/ticket/10639
                    value = toPx(elem, value);
                }
            } else if ((value === 'auto' || (unit && unit !== 'px')) && getComputedStyle) {
                // WebKit and Opera will return auto in some cases
                // Firefox will pass back an unaltered value when it can't be set, like top on a static element
                value = 0;
            } else if (unit && unit !== 'px' && !getComputedStyle) {
                // IE 8 and below won't convert units for us
                // try to convert using a prop that will return pixels
                // this will be accurate for everything (except font-size and some percentages)
                value = toPx(elem, value) + 'px';
            }
            return value;
        }

        // export the conversion function
        return {
            toPx: toPx
        };
    };
});

define('readium_plugin_highlights/models/copied_text_styles',[],function() {
    return [
        "color",
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        //"line-height",
        "text-decoration",
        "text-transform",
        "text-shadow",
        "letter-spacing",

        "text-rendering",
        "font-kerning",
        "font-language-override",
        "font-size-adjust",
        "font-stretch",
        "font-synthesis",
        "font-variant",
        "font-variant-alternates",
        "font-variant-caps",
        "font-variant-east-asian",
        "font-variant-ligatures",
        "font-variant-numeric",
        "font-variant-position",
        "-webkit-font-smoothing ",

        "-ms-writing-mode",
        "-webkit-writing-mode",
        "-moz-writing-mode",
        "-ms-writing-mode",
        "writing-mode",

        "-webkit-text-orientation",
        "-moz-text-orientation",
        "-ms-text-orientation",
        "text-orientation: mixed"
    ];
});

define('readium_plugin_highlights/views/view',["jquery", "underscore", "../lib/class", "../lib/length", "../models/text_line_inferrer", "../models/copied_text_styles"],
function($, _, Class, Length, TextLineInferrer, CopiedTextStyles) {
    // This is not a backbone view.

    var HighlightView = Class.extend({
        // this is an element that highlight will be associated with, it is not styled at this point
        template: "<div class=\"rd-highlight\"></div>",

        init: function(context, options) {
            this.context = context;

            this.lengthLib = new Length(this.context.document);

            this.highlight = {
                id: options.id,
                CFI: options.CFI,
                type: options.type,
                top: options.top,
                left: options.left,
                height: options.height,
                width: options.width,
                styles: options.styles,
                contentRenderData: options.contentRenderData
            };

            this.swipeThreshold = 10;
            this.swipeVelocity = 0.65; // in px/ms
        },

        render: function() {
            this.$el = $(this.template, this.context.document);
            this.$el.attr('data-id', this.highlight.id);
            this.updateStyles();
            this.renderContent();
            return this.$el;
        },

        remove: function() {
            this.highlight = null;
            this.context = null;
            this.$el.remove();
        },



        resetPosition: function(top, left, height, width) {
            _.assign(this.highlight, {
                top: top,
                left: left,
                height: height,
                width: width
            });
            this.setCSS();
        },

        setStyles: function(styles) {
            this.highlight.styles = styles;
            this.updateStyles();
        },

        update: function(type, styles) {
            // save old type
            var oldType = this.highlight.type;

            _.assign(this.highlight, {
                type: type,
                styles: styles
            });

            // we need to fully restyle view elements
            // remove all the "inline" styles
            this.$el.removeAttr("style");

            // remove class applied by "type"
            this.$el.removeClass(oldType);

            this.updateStyles();
        },

        updateStyles: function() {
            this.setBaseHighlight();
            this.setCSS();
        },

        // Will return null or false if :first-line/letter would not apply to the first text node child
        getFirstTextNodeChild: function(elem) {
            for (var i = 0; i < elem.childNodes.length; i++) {
                var child = elem.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    return child;
                }

                if (child.nodeType === Node.ELEMENT_NODE) {
                    var doc = child.ownerDocument;
                    var style = doc.defaultView.getComputedStyle(child);
                    // If it's not an element we can definitely ignore
                    if ((style['position'] !== 'absolute' && style['position'] !== 'fixed') &&
                        style['float'] === 'none' && style['display'] !== 'none') {
                        if (style['display'] === 'inline') {
                            var result = this.getFirstTextNodeChild(child);
                            if (result) {
                                return result;
                            } else if (result === false) {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    }
                }
            }
            return null;
        },

        // Returns the styles which apply to the first line of the specified element, or null if there aren't any
        // Assumes that the specified argument is a block element
        getFirstLineStyles: function(elem) {
            var win = elem.ownerDocument.defaultView;
            if (!win.getMatchedCSSRules) {
                // Without getMatchingCSSRules, we can't get first-line styles
                return null;
            }
            while (elem) {
                var styles = win.getMatchedCSSRules(elem, 'first-line');
                if (styles) {
                    return styles[0].style;
                }

                // Go through previous siblings, return null if there's a non-empty text node, or an element that's
                // not display: none; - both of these prevent :first-line styles from the parents from applying
                var sibling = elem;
                while (sibling = sibling.previousSibling) {
                    if (sibling.nodeType === Node.ELEMENT_NODE) {
                        var siblingStyles = win.getComputedStyle(sibling);
                        if (siblingStyles['display'] !== 'none') {
                            return null;
                        }
                    } else if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent.match(/\S/)) {
                        return null;
                    }
                };
                elem = elem.parentNode;
            }
        },

        renderContent: function() {
            var that = this;
            var renderData = this.highlight.contentRenderData;
            if (renderData) {
                _.each(renderData.data, function(data) {
                    var $ancestor = $(data.ancestorEl);
                    var $blockAncestor = $(data.blockAncestorEl);
                    var document = data.ancestorEl.ownerDocument;

                    var el = document.createElement("div");
                    el.style.position = 'absolute';
                    el.style.top = (data.rect.top - renderData.top) + "px";
                    el.style.left = (data.rect.left - renderData.left) + "px";
                    el.style.width = (data.rect.width + 1) + "px";
                    el.style.height = data.rect.height + "px";

                    var copyStyles = function(copyFrom, copyTo) {
                        _.each(CopiedTextStyles, function(styleName) {
                            var style = copyFrom[styleName];
                            if (style) {
                                copyTo[styleName] = style;
                            }
                        });
                    };

                    var copiedStyles = $ancestor.data("rd-copied-text-styles");
                    if (!copiedStyles) {
                        copiedStyles = {};
                        var computedStyle = document.defaultView.getComputedStyle(data.ancestorEl);
                        copyStyles(computedStyle, copiedStyles);
                        $ancestor.data("rd-copied-text-styles", copiedStyles);
                    }

                    var copiedFirstLineStyles = $blockAncestor.data("rd-copied-first-line-styles");
                    if (copiedFirstLineStyles === undefined) {
                        copiedFirstLineStyles = null;
                        var firstLineStyles = that.getFirstLineStyles(data.blockAncestorEl);
                        if (firstLineStyles) {
                            copiedFirstLineStyles = {};
                            copyStyles(firstLineStyles, copiedFirstLineStyles);
                            // Delete text-transform because it doesn't apply in Chrome on :first-line
                            delete copiedFirstLineStyles['text-transform'];
                            _.each(["font-size", "letter-spacing"], function(styleName) {
                                if (copiedFirstLineStyles[styleName]) {
                                    copiedFirstLineStyles[styleName] = that.lengthLib.toPx(data.ancestorEl, copiedFirstLineStyles[styleName]) + "px";
                                }
                            });
                        }
                        $blockAncestor.data("rd-copied-first-line-styles", copiedFirstLineStyles);
                    }

                    if (copiedFirstLineStyles) {
                        var textNode = that.getFirstTextNodeChild(data.blockAncestorEl);
                        var range = document.createRange();
                        range.setStart(textNode, 0);
                        range.setEnd(data.node, data.startOffset + 1);
                        var rects = range.getClientRects();
                        var inferrer = new TextLineInferrer({
                            lineHorizontalThreshold: $("body", document).clientWidth,
                            lineHorizontalLimit: document.defaultView.innerWidth
                        });
                        if (inferrer.inferLines(_.map(rects, function(rect) {
                                return {
                                    rect: rect
                                }
                            })).length > 1) {
                            copiedFirstLineStyles = null;
                        }
                    }

                    _.each(copiedStyles, function(style, styleName) {
                        style = copiedFirstLineStyles ? copiedFirstLineStyles[styleName] || style : style;
                        el.style[styleName] = style;
                    });
                    el.style["line-height"] = data.rect.height + "px";

                    el.appendChild(document.createTextNode(data.text));
                    that.$el[0].appendChild(el);
                });
                processedElements = null;
                computedStyles = null;
            }
        },

        setCSS: function() {
            // set highlight's absolute position
            this.$el.css({
                "position": "absolute",
                "top": this.highlight.top + "px",
                "left": this.highlight.left + "px",
                "height": this.highlight.height + "px",
                "width": this.highlight.width + "px"
            });

            // apply styles, if any
            var styles = this.highlight.styles || {};
            try {
                this.$el.css(styles);
            } catch (ex) {
                console.log('EpubAnnotations: invalid css styles');
            }
        },

        setBaseHighlight: function(removeFocus) {
            var type = this.highlight.type;
            this.$el.addClass(type);
            this.$el.removeClass("hover-" + type);
            if (removeFocus) {
                this.$el.removeClass("focused-" + type);
            }
        },

        setHoverHighlight: function() {
            var type = this.highlight.type;
            this.$el.addClass("hover-" + type);
            this.$el.removeClass(type);
        },

        setFocusedHighlight: function() {
            var type = this.highlight.type;
            this.$el.addClass("focused-" + type);
            this.$el.removeClass(type).removeClass("hover-" + type);
        },

        setVisibility: function(value) {
            if (value) {
                this.$el.css('display', '');
            } else {
                this.$el.css('display', 'none');
            }
        },

    });

    return HighlightView;
});

define('readium_plugin_highlights/views/border_view',["./view"], function(HighlightView) {

    // This is not a backbone view.

    var HighlightBorderView = HighlightView.extend({

        template: "<div class=\"rd-highlight-border\"></div>",

        setCSS: function() {

            this.$el.css({
                backgroundClip: 'padding-box',
                borderStyle: 'solid',
                borderWidth: '5px',
                boxSizing: "border-box"
            });
            this._super();
        },

        setBaseHighlight: function() {

            this.$el.addClass("highlight-border");
            this.$el.removeClass("hover-highlight-border").removeClass("focused-highlight-border");
        },

        setHoverHighlight: function() {

            this.$el.addClass("hover-highlight-border");
            this.$el.removeClass("highlight-border");
        },

        setFocusedHighlight: function() {
            this.$el.addClass('focused-highlight-border');
            this.$el.removeClass('highlight-border').removeClass('hover-highlight-border');
        }
    });

    return HighlightBorderView;
});

define('readium_plugin_highlights/models/group',["jquery", "underscore", "../lib/class", "./text_line_inferrer", "../views/view", "../views/border_view", "../helpers"],
function($, _, Class, TextLineInferrer, HighlightView, HighlightBorderView, HighlightHelpers) {

    var debouncedTrigger = _.debounce(
        function(fn, eventName) {
            fn(eventName);
        }, 10);

    var HighlightGroup = Class.extend({

        init: function(context, options) {
            this.context = context;

            this.highlightViews = [];

            this.CFI = options.CFI;
            this.selectedNodes = options.selectedNodes;
            this.offsetTopAddition = options.offsetTopAddition;
            this.offsetLeftAddition = options.offsetLeftAddition;
            this.styles = options.styles;
            this.id = options.id;
            this.type = options.type;
            this.scale = options.scale;
            this.selectionText = options.selectionText;
            this.visible = options.visible;
            this.rangeInfo = options.rangeInfo;

            this.constructHighlightViews();
        },

        onHighlightEvent: function(event, type) {
            var that = this;
            var documentFrame = this.context.iframe;
            var topView = this.context.manager;
            var triggerEvent = _.partial(topView.trigger, _, that.type,
                that.CFI, that.id, event, documentFrame);

            if (type === "click" || type === "touchend") {
                debouncedTrigger(triggerEvent, "annotationClicked");

            } else if (type === "contextmenu") {
                triggerEvent("annotationRightClicked");

            } else if (type === "mousemove") {
                triggerEvent("annotationMouseMove");

            } else if (type === "mouseenter") {
                triggerEvent("annotationHoverIn");

            } else if (type === "mouseleave") {
                triggerEvent("annotationHoverOut");

            } else if (type === "mousedown") {
                // prevent selection when right clicking
                var preventEvent = function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    documentFrame.contentDocument.removeEventListener(event.type, preventEvent);
                };
                if (event.button === 2) {
                    event.preventDefault();
                    documentFrame.contentDocument.addEventListener("selectstart", preventEvent);
                    documentFrame.contentDocument.addEventListener("mouseup", preventEvent);
                    documentFrame.contentDocument.addEventListener("click", preventEvent);
                    documentFrame.contentDocument.addEventListener("contextmenu", preventEvent);
                }
            }

            // "mouseenter" and "mouseleave" events not only trigger corresponding named event, but also
            // affect the appearance
            if (type === "mouseenter" || type === "mouseleave") {
                // Change appearance of highlightViews constituting this highlight group
                // do not iterate over secondary highlight views (hightlightViewsSecondary)
                _.each(this.highlightViews, function(highlightView) {

                    if (type === "mouseenter") {
                        highlightView.setHoverHighlight();
                    } else if (type === "mouseleave") {
                        highlightView.setBaseHighlight(false);
                    }
                });
            }

        },

        normalizeRectangle: function(rect) {
            return {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top
            };
        },

        // produces an event string corresponding to "pointer events" that we want to monitor on the
        // bound HL container. We are adding namespace to the event names in order to be able to
        // remove them by specifying <eventname>.<namespace> only, rather than classic callback function
        getBoundHighlightContainerEvents: function() {
            // these are the event names that we handle in "onHighlightEvent"
            var boundHighlightContainerEvents = ["click", "touchstart", "touchend", "touchmove", "contextmenu",
                "mouseenter", "mouseleave", "mousemove", "mousedown"
            ];
            var namespace = ".rdjsam-" + this.id;
            return boundHighlightContainerEvents.map(function(e) {
                return e + namespace;
            }).join(" ");
        },

        getFirstBlockParent: function(elem) {
            var win = elem.ownerDocument.defaultView;
            do {
                var style = win.getComputedStyle(elem);
                if (style['display'] !== 'inline') {
                    return elem;
                }
            } while (elem = elem.parentNode);
        },

        // construct view for each rectangle constituting HL group
        constructHighlightViews: function() {
            var that = this;
            if (!this.visible)
                return;

            var rectTextList = [];

            // this is an array of elements (not Node.TEXT_NODE) that are part of HL group
            // they will presented as HighlightBorderView
            var rectElementList = [];
            var inferrer;
            var inferredLines;
            var allContainerRects = [];
            var hoverThreshold = 2; // Pixels to expand each rect on each side, for hovering/clicking purposes
            var rangeInfo = this.rangeInfo;
            var selectedNodes = this.selectedNodes;
            var includeMedia = this.includeMedia;
            var contentDocumentFrame = this.context.iframe;
            var highlightStyles = this.styles;
            var cloneTextMode = highlightStyles ? highlightStyles['-rd-highlight-mode'] === 'clone-text' : false;

            function pushToRectTextList(range) {
                var match,
                    rangeText = range.toString(),
                    rects = [],
                    node = range.startContainer,
                    ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode,
                    blockAncestor = that.getFirstBlockParent(ancestor),
                    baseOffset = range.startOffset,
                    rgx = /\S+/g;

                if (cloneTextMode) {
                    while (match = rgx.exec(rangeText)) {
                        var startOffset = baseOffset + rgx.lastIndex - match[0].length,
                            endOffset = baseOffset + rgx.lastIndex;
                        range.setStart(node, startOffset);
                        range.setEnd(node, endOffset);
                        var clientRects = range.getClientRects();
                        var curRect = 0;
                        var curStart = startOffset;
                        var curEnd = curStart;
                        while (curRect < clientRects.length) {
                            var saveRect = false;
                            if (clientRects[curRect].width === 0 || clientRects[curRect].height === 0) {
                                curRect++;
                                continue;
                            }
                            if (curRect === clientRects.length - 1) {
                                curEnd = endOffset;
                                saveRect = true;
                            } else {
                                curEnd++;
                                range.setStart(node, curStart);
                                range.setEnd(node, curEnd);
                                var tempRects = range.getClientRects();
                                var tempRect = tempRects[0];
                                // Skip over empty first rect if there is one
                                if (tempRects.length > 1 && (tempRect.width === 0 || tempRect.height === 0)) {
                                    tempRect = tempRects[1];
                                }
                                var differences = 0;
                                _.each(["top", "left", "bottom", "right"], function(prop) {
                                    differences += (tempRects[0][prop] !== clientRects[curRect][prop] ? 1 : 0);
                                });
                                if (differences === 0) {
                                    saveRect = true;
                                }
                            }
                            if (saveRect) {
                                rects.push({
                                    rect: clientRects[curRect],
                                    text: node.textContent.substring(curStart, curEnd),
                                    node: node,
                                    startOffset: curStart
                                });
                                curRect++;
                                curStart = curEnd;
                            }
                        }
                    }
                } else {
                    _.each(range.getClientRects(), function(rect) {
                        rects.push({
                            rect: rect,
                            text: rangeText
                        });
                    });
                }
                _.each(rects, function(rect) {
                    var normalizedRect = that.normalizeRectangle(rect.rect);

                    //filter out empty rectangles
                    if (normalizedRect.width === 0 || normalizedRect.height === 0) {
                        return;
                    }

                    // push both rect and ancestor in the list
                    rectTextList.push({
                        rect: normalizedRect,
                        text: rect.text,
                        ancestorEl: ancestor,
                        blockAncestorEl: blockAncestor,
                        node: rect.node,
                        startOffset: rect.startOffset
                    });
                });
            }

            // if range is within one node
            if (rangeInfo && rangeInfo.startNode === rangeInfo.endNode) {
                var node = rangeInfo.startNode;
                var range = that.context.document.createRange();
                range.setStart(node, rangeInfo.startOffset);
                range.setEnd(node, rangeInfo.endOffset);

                // we are only interested in TEXT_NODE
                if (node.nodeType === Node.TEXT_NODE) {
                    // get client rectangles for the range and push them into rectTextList
                    pushToRectTextList(range);
                    selectedNodes = [];
                }
            }

            // multi-node range, for each selected node
            _.each(selectedNodes, function(node) {
                // create new Range
                var range = that.context.document.createRange();
                if (node.nodeType === Node.TEXT_NODE) {
                    if (rangeInfo && node === rangeInfo.startNode && rangeInfo.startOffset !== 0) {
                        range.setStart(node, rangeInfo.startOffset);
                        range.setEnd(node, node.length);
                    } else if (rangeInfo && node === rangeInfo.endNode && rangeInfo.endOffset !== 0) {
                        range.setStart(node, 0);
                        range.setEnd(node, rangeInfo.endOffset);
                    } else {
                        range.selectNodeContents(node);
                    }

                    // for each client rectangle
                    pushToRectTextList(range);
                } else if (node.nodeType === Node.ELEMENT_NODE && includeMedia) {
                    // non-text node element
                    // if we support this elements in the HL group
                    if (_.contains(["img", "video", "audio"], node.tagName.toLowerCase())) {
                        // set the Range to contain the node and its contents and push rectangle to the list
                        range.selectNode(node);
                        rectElementList.push(range.getBoundingClientRect());
                    }
                }
            });

            var $html = $(that.context.document.documentElement);

            function calculateScale() {
                var scale = that.scale;
                //is there a transform scale for the content document?
                var matrix = HighlightHelpers.getMatrix($html);
                if (!matrix && (that.context.isIe9 || that.context.isIe10)) {
                    //if there's no transform scale then set the scale as the IE zoom factor
                    scale = (window.screen.deviceXDPI / 96); //96dpi == 100% scale
                } else if (matrix) {
                    scale = HighlightHelpers.getScaleFromMatrix(matrix);
                }
                return scale;
            }

            var scale = calculateScale();

            inferrer = new TextLineInferrer({
                lineHorizontalThreshold: $("body", $html).clientWidth,
                lineHorizontalLimit: contentDocumentFrame.contentWindow.innerWidth
            });

            // only take "rect" property when inferring lines
            inferredLines = inferrer.inferLines(rectTextList);
            _.each(inferredLines, function(line, index) {
                var renderData = line.data;
                //console.log(line.data);
                line = line.line;
                var highlightTop = (line.startTop + that.offsetTopAddition) / scale;
                var highlightLeft = (line.left + that.offsetLeftAddition) / scale;
                var highlightHeight = line.avgHeight / scale;
                var highlightWidth = line.width / scale;
                allContainerRects.push({
                    top: highlightTop - hoverThreshold,
                    left: highlightLeft - hoverThreshold,
                    bottom: highlightTop + highlightHeight + hoverThreshold * 2,
                    right: highlightLeft + highlightWidth + hoverThreshold * 2,
                });

                var highlightView = new HighlightView(that.context, {
                    id: that.id,
                    CFI: that.CFI,
                    type: that.type,
                    top: highlightTop,
                    left: highlightLeft,
                    height: highlightHeight,
                    width: highlightWidth,
                    styles: _.extend({
                        "z-index": "1000",
                        "pointer-events": "none"
                    }, highlightStyles),
                    contentRenderData: cloneTextMode ? {
                        data: renderData,
                        top: line.startTop,
                        left: line.left
                    } : null
                });

                that.highlightViews.push(highlightView);
            });

            // deal with non TEXT_NODE elements
            _.each(rectElementList, function(rect) {
                var highlightTop = (rect.top + that.offsetTopAddition) / scale;
                var highlightLeft = (rect.left + that.offsetLeftAddition) / scale;
                var highlightHeight = rect.height / scale;
                var highlightWidth = rect.width / scale;
                allContainerRects.push({
                    top: highlightTop - hoverThreshold,
                    left: highlightLeft - hoverThreshold,
                    bottom: highlightTop + highlightHeight + hoverThreshold * 2,
                    right: highlightLeft + highlightWidth + hoverThreshold * 2,
                });

                var highlightView = new HighlightBorderView(this.context, {
                    highlightId: that.id,
                    CFI: that.CFI,
                    top: highlightTop,
                    left: highlightLeft,
                    height: highlightHeight,
                    width: highlightWidth,
                    styles: highlightStyles
                });

                that.highlightViews.push(highlightView);
            });

            // this is a flag indicating if mouse is currently within the boundary of HL group
            var mouseEntered = false;

            // helper function to test if a point is within a rectangle
            function pointRectangleIntersection(point, rect) {
                return point.x > rect.left && point.x < rect.right &&
                    point.y > rect.top && point.y < rect.bottom;
            };

            that.boundHighlightCallback = function(e) {
                var scale = calculateScale();
                var mouseIsInside = false;

                var x = e.pageX;
                var y = e.pageY;

                if (e.type === 'touchend') {
                    var lastTouch = _.last(e.changedTouches);
                    x = lastTouch.pageX;
                    y = lastTouch.pageY;
                }

                var point = {
                    x: (x + that.offsetLeftAddition) / scale,
                    y: (y + that.offsetTopAddition) / scale
                };

                _.each(allContainerRects, function(rect) {

                    if (pointRectangleIntersection(point, rect)) {
                        mouseIsInside = true;
                        // if event is "click" and there is an active selection
                        if (e.type === "click") {
                            var sel = e.target.ownerDocument.getSelection();
                            // had to add this check to make sure that rangeCount is not 0
                            if (sel && sel.rangeCount && !sel.getRangeAt(0).collapsed) {
                                //do not trigger a click when there is an active selection
                                return;
                            }
                        }

                        var isTouchEvent = e.type.indexOf('touch') !== -1;

                        if (isTouchEvent) {
                            // call "normal" event handler for HL group to touch capable devices
                            that.onHighlightEvent(e, e.type);
                        }

                        // if this is the first time we are mouse entering in the area
                        if (!mouseEntered) {
                            // regardless of the actual event type we want highlightGroupCallback process "mouseenter"
                            that.onHighlightEvent(e, "mouseenter");

                            // set flag indicating that we are in HL group confines
                            mouseEntered = true;
                            return;
                        } else if (!isTouchEvent) {
                            // call "normal" event handler for HL group to desktop devices
                            that.onHighlightEvent(e, e.type);
                        }
                    }
                });

                if (!mouseIsInside && mouseEntered) {
                    // set flag indicating that we left HL group confines
                    mouseEntered = false;
                    that.onHighlightEvent(e, "mouseleave");
                }
            };
            that.boundHighlightElement = $html;
            $html.on(this.getBoundHighlightContainerEvents(), that.boundHighlightCallback);
        },

        resetHighlights: function(viewportElement, offsetTop, offsetLeft) {
            this.offsetTopAddition = offsetTop;
            this.offsetLeftAddition = offsetLeft;
            this.destroyCurrentHighlights();
            this.constructHighlightViews();
            this.renderHighlights(viewportElement);
        },

        destroyCurrentHighlights: function() {
            var that = this;
            _.each(this.highlightViews, function(highlightView) {
                highlightView.remove();
            });

            var events = that.getBoundHighlightContainerEvents();
            var $el = this.boundHighlightElement;
            if ($el) {
                $el.off(events, this.boundHighlightCallback);
            }

            this.boundHighlightCallback = null;
            this.boundHighlightElement = null;

            this.highlightViews.length = 0;
        },

        renderHighlights: function(viewportElement) {
            // higlight group is live, it just doesn't need to be visible, yet.
            if (!this.visible) {
                return;
            }

            _.each(this.highlightViews, function(view, index) {
                $(viewportElement).append(view.render());
            });
        },

        toInfo: function() {
            // get array of rectangles for all the HightligtViews
            var rectangleArray = [];
            var offsetTopAddition = this.offsetTopAddition;
            var offsetLeftAddition = this.offsetLeftAddition;
            var scale = this.scale;
            _.each(this.highlightViews, function(view, index) {
                var hl = view.highlight;
                rectangleArray.push({
                    top: (hl.top - offsetTopAddition) * scale,
                    left: (hl.left - offsetLeftAddition) * scale,
                    height: hl.height * scale,
                    width: hl.width * scale
                });
            });

            return {
                id: this.id,
                type: this.type,
                CFI: this.CFI,
                rectangleArray: rectangleArray,
                selectedText: this.selectionText
            };
        },

        setStyles: function(styles) {
            this.styles = styles;
            _.each(this.highlightViews, function(view, index) {
                view.setStyles(styles);
            });
        },

        update: function(type, styles) {
            this.type = type;
            this.styles = styles;

            // for each View of the HightlightGroup
            _.each(this.highlightViews, function(view, index) {
                view.update(type, styles);
            });
        },

        setState: function(state, value) {
            _.each(this.highlightViews, function(view, index) {
                if (state === "hover") {
                    if (value) {
                        view.setHoverHighlight();
                    } else {
                        view.setBaseHighlight(false);
                    }
                } else if (state === "visible") {
                    view.setVisibility(value);
                } else if (state === "focused") {
                    if (value) {
                        view.setFocusedHighlight();
                    } else {
                        view.setBaseHighlight(true);
                    }

                }
            });
        }
    });

    return HighlightGroup;
});

define('readium_plugin_highlights/controller',["jquery", "underscore", "./lib/class", "./helpers", "./models/group"],
function($, _, Class, HighlightHelpers, HighlightGroup) {
    var HighlightsController = Class.extend({

        highlights: [],
        annotationHash: {},
        offsetTopAddition: 0,
        offsetLeftAddition: 0,
        readerBoundElement: undefined,
        scale: 0,

        init: function(context, options) {
            this.context = context;

            this.epubCFI = EPUBcfi;
            this.readerBoundElement = this.context.document.documentElement;

            if (options.getVisibleCfiRangeFn) {
                this.getVisibleCfiRange = options.getVisibleCfiRangeFn;
            }

            // inject annotation CSS into iframe
            if (this.context.cssUrl) {
                this._injectAnnotationCSS(this.context.cssUrl);
            }

            // emit an event when user selects some text.
            var that = this;
            this.context.document.addEventListener("mouseup", function(event) {
                var range = that._getCurrentSelectionRange();
                if (range === undefined) {
                    return;
                }
                if (range.startOffset - range.endOffset) {
                    that.context.manager.trigger("textSelectionEvent", event, range, that.context.iframe);
                }
            });

            if (!rangy.initialized) {
                rangy.init();
            }
        },

        getVisibleCfiRange: function() {
            // returns {firstVisibleCfi: <>, lastVisibleCfi: <>}
            // implemented in Readium.ReaderView, passed in via options
        },

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        redraw: function() {
            var that = this;

            var leftAddition = -this._getPaginationLeftOffset();
            
            var isVerticalWritingMode = this.context.paginationInfo().isVerticalWritingMode;

            var visibleCfiRange = this.getVisibleCfiRange();

            // Highlights
            _.each(this.highlights, function(highlightGroup) {
                var visible = true;

                if (visibleCfiRange &&
                    visibleCfiRange.firstVisibleCfi &&
                    visibleCfiRange.firstVisibleCfi.contentCFI &&
                    visibleCfiRange.lastVisibleCfi &&
                    visibleCfiRange.lastVisibleCfi.contentCFI) {

                    visible = that._cfiIsBetweenTwoCfis(
                        highlightGroup.CFI,
                        visibleCfiRange.firstVisibleCfi.contentCFI,
                        visibleCfiRange.lastVisibleCfi.contentCFI);
                }
                highlightGroup.visible = visible;
                highlightGroup.resetHighlights(that.readerBoundElement,
                    isVerticalWritingMode ? leftAddition : 0,
                    isVerticalWritingMode ? 0 : leftAddition
                    );

            });
        },

        getHighlight: function(id) {
            var highlight = this.annotationHash[id];
            if (highlight) {
                return highlight.toInfo();
            } else {
                return undefined;
            }
        },

        getHighlights: function() {
            var highlights = [];
            _.each(this.highlights, function(highlight) {
                highlights.push(highlight.toInfo());
            });
            return highlights;
        },

        removeHighlight: function(annotationId) {
            var annotationHash = this.annotationHash;
            var highlights = this.highlights;

            delete annotationHash[annotationId];

            highlights = _.reject(highlights, function(highlightGroup) {
                if (highlightGroup.id == annotationId) {
                    highlightGroup.destroyCurrentHighlights();
                    return true;
                } else {
                    return false;
                }
            });

            this.highlights = highlights;
        },

        removeHighlightsByType: function(type) {
            var annotationHash = this.annotationHash;
            var highlights = this.highlights;

            // the returned list only contains HLs for which the function returns false
            highlights = _.reject(highlights, function(highlightGroup) {
                if (highlightGroup.type === type) {
                    delete annotationHash[highlightGroup.id];
                    highlightGroup.destroyCurrentHighlights();
                    return true;
                } else {
                    return false;
                }
            });

            this.highlights = highlights;
        },

        // generate unique prefix for HL ids
        generateIdPrefix: function() {
            var idPrefix = 'xxxxxxxx'.replace(/[x]/g, function(c) {
                var r = Math.random() * 16 | 0;
                return r.toString(16);
            });
            idPrefix += "_";
            return idPrefix;
        },


        // takes partial CFI as parameter
        addHighlight: function(CFI, id, type, styles) {
            var CFIRangeInfo;
            var range;
            var rangeStartNode;
            var rangeEndNode;
            var selectedElements;
            var leftAddition;

            var contentDoc = this.context.document;
            //get transform scale of content document
            var scale = 1.0;
            var matrix = HighlightHelpers.getMatrix($('html', contentDoc));
            if (matrix) {
                scale = HighlightHelpers.getScaleFromMatrix(matrix);
            }

            //create a dummy test div to determine if the browser provides
            // client rectangles that take transform scaling into consideration
            var $div = $('<div style="font-size: 50px; position: absolute; background: red; top:-9001px;">##</div>');
            $(contentDoc.documentElement).append($div);
            range = contentDoc.createRange();
            range.selectNode($div[0]);
            var renderedWidth = this._normalizeRectangle(range.getBoundingClientRect()).width;
            var clientWidth = $div[0].clientWidth;
            $div.remove();
            var renderedVsClientWidthFactor = renderedWidth / clientWidth;
            if (renderedVsClientWidthFactor === 1) {
                //browser doesn't provide scaled client rectangles (firefox)
                scale = 1;
            } else if (this.context.isIe9 || this.context.isIe10) {
                //use the test scale factor as our scale value for IE 9/10
                scale = renderedVsClientWidthFactor;
            }
            this.scale = scale;

            // form fake full CFI to satisfy getRangeTargetNodes
            var arbitraryPackageDocCFI = "/99!"
            var fullFakeCFI = "epubcfi(" + arbitraryPackageDocCFI + CFI + ")";
            if (this.epubCFI.Interpreter.isRangeCfi(fullFakeCFI)) {
                CFIRangeInfo = this.epubCFI.getRangeTargetElements(fullFakeCFI, contentDoc, ["cfi-marker", "cfi-blacklist", "mo-cfi-highlight"], [], ["MathJax_Message", "MathJax_SVG_Hidden"]);

                var startNode = CFIRangeInfo.startElement,
                    endNode = CFIRangeInfo.endElement;
                range = rangy.createRange(contentDoc);
                if (startNode.length < CFIRangeInfo.startOffset) {
                    //this is a workaround
                    // "Uncaught IndexSizeError: Index or size was negative, or greater than the allowed value." errors
                    // the range cfi generator outputs a cfi like /4/2,/1:125,/16
                    // can't explain, investigating..
                    CFIRangeInfo.startOffset = startNode.length;
                }
                range.setStart(startNode, CFIRangeInfo.startOffset);
                range.setEnd(endNode, CFIRangeInfo.endOffset);
                selectedElements = range.getNodes();
            } else {
                var element = this.epubCFI.getTargetElement(fullFakeCFI, contentDoc, ["cfi-marker", "cfi-blacklist", "mo-cfi-highlight"], [], ["MathJax_Message", "MathJax_SVG_Hidden"]);
                selectedElements = [element ? element[0] : null];
                range = null;
            }

            leftAddition = -this._getPaginationLeftOffset();

            var isVerticalWritingMode = this.context.paginationInfo().isVerticalWritingMode;

            this._addHighlightHelper(
                CFI, id, type, styles, selectedElements, range,
                startNode, endNode,
                isVerticalWritingMode ? leftAddition : 0,
                isVerticalWritingMode ? 0 : leftAddition
                );

            return {
                selectedElements: selectedElements,
                CFI: CFI
            };
        },


        // this returns a partial CFI only!!
        getCurrentSelectionCFI: function() {
            var currentSelection = this._getCurrentSelectionRange();
            var CFI;
            if (currentSelection) {
                selectionInfo = this._getSelectionInfo(currentSelection);
                CFI = selectionInfo.CFI;
            }

            return CFI;
        },

        // this returns a partial CFI only!!
        getCurrentSelectionOffsetCFI: function() {
            var currentSelection = this._getCurrentSelectionRange();

            var CFI;
            if (currentSelection) {
                CFI = this._generateCharOffsetCFI(currentSelection);
            }
            return CFI;
        },

        addSelectionHighlight: function(id, type, styles, clearSelection) {
            var CFI = this.getCurrentSelectionCFI();
            if (CFI) {

                // if clearSelection is true
                if (clearSelection) {
                    var iframeDocument = this.context.document;
                    if (iframeDocument.getSelection) {
                        var currentSelection = iframeDocument.getSelection();
                        currentSelection.collapseToStart();
                    }
                }
                return this.addHighlight(CFI, id, type, styles);
            } else {
                throw new Error("Nothing selected");
            }
        },

        updateAnnotation: function(id, type, styles) {
            var annotationViews = this.annotationHash[id];
            if (annotationViews) {
                annotationViews.update(type, styles);
            }
            return annotationViews;
        },

        replaceAnnotation: function(id, cfi, type, styles) {
            var annotationViews = this.annotationHash[id];
            if (annotationViews) {
                // remove an existing annotatio
                this.removeHighlight(id);

                // create a new HL
                this.addHighlight(cfi, id, type, styles);
            }
            return annotationViews;
        },

        updateAnnotationView: function(id, styles) {
            var annotationViews = this.annotationHash[id];
            if (annotationViews) {
                annotationViews.setStyles(styles);
            }
            return annotationViews;
        },

        setAnnotationViewState: function(id, state, value) {
            var annotationViews = this.annotationHash[id];
            if (annotationViews) {
                annotationViews.setState(state, value);
            }
            return annotationViews;
        },

        setAnnotationViewStateForAll: function(state, value) {
            var annotationViews = this.annotationHash;
            _.each(annotationViews, function(annotationView) {
                annotationView.setState(state, value);
            });
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //



        //return an array of all numbers in the content cfi
        _parseContentCfi: function(cont) {
            return cont.replace(/\[(.*?)\]/, "").split(/[\/,:]/).map(function(n) {
                return parseInt(n);
            }).filter(Boolean);
        },

        _contentCfiComparator: function(cont1, cont2) {
            cont1 = this._parseContentCfi(cont1);
            cont2 = this._parseContentCfi(cont2);

            //compare cont arrays looking for differences
            for (var i = 0; i < cont1.length; i++) {
                if (cont1[i] > cont2[i]) {
                    return 1;
                } else if (cont1[i] < cont2[i]) {
                    return -1;
                }
            }

            //no differences found, so confirm that cont2 did not have values we didn't check
            if (cont1.length < cont2.length) {
                return -1;
            }

            //cont arrays are identical
            return 0;
        },

        // determine if a given Cfi falls between two other cfis.2
        _cfiIsBetweenTwoCfis: function(cfi, firstVisibleCfi, lastVisibleCfi) {
            if (!firstVisibleCfi || !lastVisibleCfi) {
                return null;
            }
            var first = this._contentCfiComparator(cfi, firstVisibleCfi);
            var second = this._contentCfiComparator(cfi, lastVisibleCfi);
            return first >= 0 && second <= 0;
        },

        _addHighlightHelper: function(CFI, annotationId, type, styles, highlightedNodes,
            range, startNode, endNode, offsetTop, offsetLeft) {
            if (!offsetTop) {
                offsetTop = this.offsetTopAddition;
            }
            if (!offsetLeft) {
                offsetLeft = this.offsetLeftAddition;
            }

            var visible;
            // check if the options specify lastVisibleCfi/firstVisibleCfi. If they don't fall back to displaying the highlights anyway.
            var visibleCfiRange = this.getVisibleCfiRange();
            if (visibleCfiRange &&
                visibleCfiRange.firstVisibleCfi &&
                visibleCfiRange.firstVisibleCfi.contentCFI &&
                visibleCfiRange.lastVisibleCfi &&
                visibleCfiRange.lastVisibleCfi.contentCFI) {
                visible = this._cfiIsBetweenTwoCfis(CFI, visibleCfiRange.firstVisibleCfi.contentCFI, visibleCfiRange.lastVisibleCfi.contentCFI);
            } else {
                visible = true;
            }

            annotationId = annotationId.toString();
            if (this.annotationHash[annotationId]) {
                throw new Error("That annotation id already exists; annotation not added");
            }

            var highlightGroup = new HighlightGroup(this.context, {
                CFI: CFI,
                selectedNodes: highlightedNodes,
                offsetTopAddition: offsetTop,
                offsetLeftAddition: offsetLeft,
                styles: styles,
                id: annotationId,
                type: type,
                scale: this.scale,
                selectionText: range ? range.toString() : "",
                visible: visible,
                rangeInfo: range ? {
                    startNode: startNode,
                    startOffset: range.startOffset,
                    endNode: endNode,
                    endOffset: range.endOffset
                } : null
            });

            this.annotationHash[annotationId] = highlightGroup;
            this.highlights.push(highlightGroup);


            highlightGroup.renderHighlights(this.readerBoundElement);
        },

        _normalizeRectangle: function(rect) {
            return {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top
            };
        },

        _getSelectionInfo: function(selectedRange, elementType) {
            // Generate CFI for selected text
            var CFI = this._generateRangeCFI(selectedRange);
            var intervalState = {
                startElementFound: false,
                endElementFound: false
            };
            var selectedElements = [];

            if (!elementType) {
                var elementType = ["text"];
            }

            this._findSelectedElements(
                selectedRange.commonAncestorContainer,
                selectedRange.startContainer,
                selectedRange.endContainer,
                intervalState,
                selectedElements,
                elementType
            );

            // Return a list of selected text nodes and the CFI
            return {
                CFI: CFI,
                selectedElements: selectedElements
            };
        },

        _generateRangeCFI: function(selectedRange) {
            var startNode = selectedRange.startContainer;
            var endNode = selectedRange.endContainer;
            var commonAncestor = selectedRange.commonAncestorContainer;
            var startOffset;
            var endOffset;
            var rangeCFIComponent;

            startOffset = selectedRange.startOffset;
            endOffset = selectedRange.endOffset;

            rangeCFIComponent = this.epubCFI.generateRangeComponent(
                startNode,
                startOffset,
                endNode,
                endOffset, ["cfi-marker", "cfi-blacklist", "mo-cfi-highlight"], [], ["MathJax_Message", "MathJax_SVG_Hidden"]
            );
            return rangeCFIComponent;
        },

        _generateCharOffsetCFI: function(selectedRange) {
            // Character offset
            var startNode = selectedRange.startContainer;
            var startOffset = selectedRange.startOffset;
            var charOffsetCFI;

            if (startNode.nodeType === Node.TEXT_NODE) {
                charOffsetCFI = this.epubCFI.generateCharacterOffsetCFIComponent(
                    startNode,
                    startOffset, ["cfi-marker", "cfi-blacklist", "mo-cfi-highlight"], [], ["MathJax_Message", "MathJax_SVG_Hidden"]
                );
            }
            return charOffsetCFI;
        },

        // REFACTORING CANDIDATE: Convert this to jquery
        _findSelectedElements: function(
            currElement, startElement, endElement, intervalState, selectedElements, elementTypes) {

            if (currElement === startElement) {
                intervalState.startElementFound = true;
            }

            if (intervalState.startElementFound === true) {
                this._addElement(currElement, selectedElements, elementTypes);
            }

            if (currElement === endElement) {
                intervalState.endElementFound = true;
                return;
            }

            if (currElement.firstChild) {
                this._findSelectedElements(currElement.firstChild, startElement, endElement,
                    intervalState, selectedElements, elementTypes);
                if (intervalState.endElementFound) {
                    return;
                }
            }

            if (currElement.nextSibling) {
                this._findSelectedElements(currElement.nextSibling, startElement, endElement,
                    intervalState, selectedElements, elementTypes);
                if (intervalState.endElementFound) {
                    return;
                }
            }
        },

        _addElement: function(currElement, selectedElements, elementTypes) {
            // Check if the node is one of the types
            _.each(elementTypes, function(elementType) {

                if (elementType === "text") {
                    if (currElement.nodeType === Node.TEXT_NODE) {
                        selectedElements.push(currElement);
                    }
                } else {
                    if ($(currElement).is(elementType)) {
                        selectedElements.push(currElement);
                    }
                }
            });
        },

        // Rationale: This is a cross-browser method to get the currently selected text
        _getCurrentSelectionRange: function() {
            var currentSelection;
            var iframeDocument = this.context.document;
            if (iframeDocument.getSelection) {

                currentSelection = iframeDocument.getSelection();
                if (!currentSelection || currentSelection.rangeCount === 0) {
                    return undefined;
                }

                var range = currentSelection.getRangeAt(0);

                if (range.toString() !== '') {
                    return range;
                } else {
                    return undefined;
                }
            } else if (iframeDocument.selection) {
                return iframeDocument.selection.createRange();
            } else {
                return undefined;
            }
        },

        _getPaginationLeftOffset: function() {
        
            var $htmlElement = $(this.context.document.documentElement);
            if (!$htmlElement || !$htmlElement.length) {
                // if there is no html element, we might be dealing with a fxl with a svg spine item
                return 0;
            }

            var offsetLeftPixels = $htmlElement.css(this.context.paginationInfo().isVerticalWritingMode ? "top" : (this.context.isRTL ? "right" : "left"));
            var offsetLeft = parseInt(offsetLeftPixels.replace("px", ""));
            if (isNaN(offsetLeft)) {
                //for fixed layouts, $htmlElement.css("left") has no numerical value
                offsetLeft = 0;
            }
            
            if (this.context.isRTL && !this.context.paginationInfo().isVerticalWritingMode) return -offsetLeft;
             
            return offsetLeft;
        },

        _injectAnnotationCSS: function(annotationCSSUrl) {
            var doc = this.context.document;
            setTimeout(function(){
                var $contentDocHead = $("head", doc);
                $contentDocHead.append(
                    $("<link/>", {
                        rel: "stylesheet",
                        href: annotationCSSUrl,
                        type: "text/css"
                    })
                );
            }, 0);
        }
    });

    return HighlightsController;
});

//  Created by Dmitry Markushevich (dmitrym@evidentpoint.com)
//
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

define('readium_plugin_highlights/manager',['jquery', 'underscore', 'eventEmitter', './controller', './helpers', 'readium_shared_js/models/bookmark_data'], function($, _, EventEmitter, HighlightsController, HighlightHelpers, BookmarkData) {

var defaultContext = {};

//determine if browser is IE9 or IE10
var div = document.createElement("div");
div.innerHTML = "<!--[if IE 9]><i></i><![endif]-->";
defaultContext.isIe9 = (div.getElementsByTagName("i").length == 1);
// IE10 introduced a prefixed version of PointerEvent, but not unprefixed.
defaultContext.isIe10 = window.MSPointerEvent && !window.PointerEvent;

/**
 *
 * @param proxyObj
 * @param options
 * @constructor
 */
var HighlightsManager = function (proxyObj, options) {

    var self = this;

    // live annotations contains references to the annotation _module_ for visible spines
    var liveAnnotations = {};
    var spines = {};
    var proxy = proxyObj;
    var annotationCSSUrl = options.annotationCSSUrl;

    if (!annotationCSSUrl) {
        console.warn("WARNING! Annotations CSS not supplied. Highlighting might not work.");
    }

    _.extend(this, new EventEmitter());

    // this.on("all", function() {
    // });
    //TODO: EventEmitter3 does not support "all" or "*" (catch-all event sink)
    //https://github.com/primus/eventemitter3/blob/master/index.js#L61
    //...so instead we patch trigger() and emit() (which are synonymous, see Bootstrapper.js EventEmitter.prototype.trigger = EventEmitter.prototype.emit;)

    var originalEmit = self['emit'];

    var triggerEmitPatch = function() {
        var args = Array.prototype.slice.call(arguments);
        // mangle annotationClicked event. What really needs to happen is, the annotation_module needs to return a
        // bare Cfi, and this class should append the idref.
        var mangleEvent = function(annotationEvent){
            if (args.length && args[0] === annotationEvent) {
                for (var spineIndex in liveAnnotations)
                {
                    var contentDocumentFrame = args[5];
                    var jQueryEvent = args[4];
                    if (typeof jQueryEvent.clientX === 'undefined') {
                        jQueryEvent.clientX = jQueryEvent.pageX;
                        jQueryEvent.clientY = jQueryEvent.pageY;
                    }

                    var annotationId = args[3];
                    var partialCfi = args[2];
                    var type = args[1];
                    if (liveAnnotations[spineIndex].getHighlight(annotationId)) {
                        var idref = spines[spineIndex].idref;
                        args = [annotationEvent, type, idref, partialCfi, annotationId, jQueryEvent, contentDocumentFrame];
                    }
                }
            }
        }
        mangleEvent('annotationClicked');
        mangleEvent('annotationTouched');
        mangleEvent('annotationRightClicked');
        mangleEvent('annotationHoverIn');
        mangleEvent('annotationHoverOut');

        originalEmit.apply(this, args);
        originalEmit.apply(proxy, args);
    };

    this.trigger = triggerEmitPatch;
    this.emit = triggerEmitPatch;

    this.attachAnnotations = function($iframe, spineItem, loadedSpineItems) {
        var iframe = $iframe[0];

        var context = _.extend({
            document: iframe.contentDocument,
            window: iframe.contentWindow,
            iframe: iframe,
            manager: self,
            cssUrl: annotationCSSUrl,
            isFixedLayout: spineItem.isFixedLayout(),
            isRTL: spineItem.spine.isRightToLeft(),
            paginationInfo: function() { return spineItem.paginationInfo; }
            
        }, defaultContext);

        liveAnnotations[spineItem.index] = new HighlightsController(context, {getVisibleCfiRangeFn: options.getVisibleCfiRangeFn});
        spines[spineItem.index] = spineItem;

        // check to see which spine indicies can be culled depending on the currently loaded spine items
        for(var spineIndex in liveAnnotations) {
            if (liveAnnotations.hasOwnProperty(spineIndex) && !_.contains(loadedSpineItems, spines[spineIndex])) {
                delete liveAnnotations[spineIndex];
            }
        }
    };

    this.getCurrentSelectionCfi = function() {
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            var partialCfi = annotationsForView.getCurrentSelectionCFI();
            if (partialCfi) {
                return {"idref":spines[spine].idref, "cfi":partialCfi};
            }
        }
        return undefined;
    };

    this.addSelectionHighlight = function(id, type, clearSelection, styles) {
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            if (annotationsForView.getCurrentSelectionCFI()) {
                var annotation = annotationsForView.addSelectionHighlight(
                    id, type, clearSelection, styles);
                return new BookmarkData(spines[spine].idref, annotation.CFI);
            }
        }
        return undefined;
    };

    this.addHighlight = function(spineIdRef, partialCfi, id, type, styles) {
        for(var spine in liveAnnotations) {
            if (spines[spine].idref === spineIdRef) {
                var annotationsForView = liveAnnotations[spine];
                var annotation = annotationsForView.addHighlight(partialCfi, id, type, styles);
                if (annotation) {
                    return new BookmarkData(spineIdRef, annotation.CFI);
                }
            }
        }
        return undefined;
    };

    this.removeHighlight = function(id) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result  = annotationsForView.removeHighlight(id);
        }
        return result;
    };

    this.removeHighlightsByType = function(type) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result  = annotationsForView.removeHighlightsByType(type);
        }
        return result;
    };

    this.getHighlight = function(id) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result  = annotationsForView.getHighlight(id);
            if (result !== undefined)
				return result;
        }
        return result;
    };

    this.updateAnnotation = function(id, type, styles) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.updateAnnotation(id, type, styles);
            if(result) {
                break;
            }
        }
        return result;
    };

    this.replaceAnnotation = function(id, cfi, type, styles) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.replaceAnnotation(id, cfi, type, styles);
            if(result) {
                break;
            }
        }
        return result;
    };

    // redraw gets called on pagination change, so for progressive rendering we may have to add annotations that were previously not visible.
    this.redrawAnnotations = function(){
        for(var spine in liveAnnotations) {
            liveAnnotations[spine].redraw();
        }
    };

    this.updateAnnotationView = function(id, styles) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.updateAnnotationView(id,styles);
            if(result){
                break;
            }
        }
        return result;
    };

    this.setAnnotationViewState = function(id, state, value) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.setAnnotationViewState(id, state, value);
            if(result){
                break;
            }
        }
        return result;
    };

    this.setAnnotationViewStateForAll = function(state, value) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.setAnnotationViewStateForAll(state, value);
            if(result){
                break;
            }
        }
        return result;
    };

    this.cfiIsBetweenTwoCfis = function (cfi, lowBoundaryCfi, highBoundaryCfi) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.cfiIsBetweenTwoCfis(cfi, lowBoundaryCfi, highBoundaryCfi);
            if(result){
                break;
            }
        }
        return result;
    };

    this.contentCfiComparator = function(contCfi1, contCfi2) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.contentCfiComparator(contCfi1, contCfi2);
            if(result){
                break;
            }
        }
        return result;
    };

    function getElementFromViewElement(element) {
        //TODO JC: yuck, we get two different collection structures from non fixed and fixed views.. must refactor..
        return element.element ? element.element : element;
    }

    this.getAnnotationMidpoints = function($elementSpineItemCollection){
        var output = [];

        _.each($elementSpineItemCollection, function (item){
            var annotations = [];

            var lastId = null;

            var baseOffset = {top: 0, left: 0};
            if (item.elements && item.elements.length > 0) {
                var firstElement = getElementFromViewElement(item.elements[0]);
                var offsetElement = firstElement.ownerDocument.defaultView.frameElement.parentElement;
                baseOffset = {top: offsetElement.offsetTop, left: offsetElement.offsetLeft};
            }

            _.each(item.elements, function(element){

                var $element = $(getElementFromViewElement(element));
                var elementId = $element.attr('data-id');

                if(!elementId){
                    console.warn('AnnotationsManager:getAnnotationMidpoints: Got an annotation element with no ID??')
                    return;
                }
                if (elementId === lastId) return;
                lastId = elementId;

                //calculate position offsets with scaling
                var scale = 1;
                //figure out a better way to get the html parent from an element..
                var $html = $element.parent();
                //get transformation scale from content document
                var matrix = HighlightHelpers.getMatrix($html);
                if (matrix) {
                    scale = HighlightHelpers.getScaleFromMatrix(matrix);
                }
                var offset = $element.offset();
                offset.top += baseOffset.top + ($element.height() / 2);
                offset.left += baseOffset.left;
                if(scale !== 1){
                    offset = {top: (offset.top * scale)*(1/scale), left: offset.left };
                }
                var $highlighted = {id: elementId, position: offset, lineHeight: parseInt($element.css('line-height'),10)};
                annotations.push($highlighted)
            });

            output.push({annotations:annotations, spineItem: item.spineItem});
        });

        return output;
    };

    this.getAnnotationsElementSelector = function () {
        return 'div.rd-highlight, div.rd-highlight-border';
    };

};

return HighlightsManager;
});

define('readium_plugin_highlights/main',['readium_js_plugins', 'readium_shared_js/globals', './manager'], function (Plugins, Globals, HighlightsManager) {
    var config = {};

    Plugins.register("highlights", function (api) {
        var reader = api.reader, _highlightsManager, _initialized = false, _initializedLate = false;

        var self = this;

        function isInitialized() {
            if (!_initialized) {
                api.plugin.warn('Not initialized!')
            }
            return _initialized;
        }

        this.initialize = function (options) {
            options = options || {};

            setTimeout(isInitialized, 1000);

            if (_initialized) {
                api.plugin.warn('Already initialized!');
                return;
            }

            if (reader.getFirstVisibleCfi && reader.getLastVisibleCfi && !options.getVisibleCfiRangeFn) {
                options.getVisibleCfiRangeFn = function () {
                    return {firstVisibleCfi: reader.getFirstVisibleCfi(), lastVisibleCfi: reader.getLastVisibleCfi()};
                };
            }

            _highlightsManager = new HighlightsManager(self, options);

            if (_initializedLate) {
                api.plugin.warn('Unable to attach to currently loaded content document.\n' +
                'Initialize the plugin before loading a content document.');
            }

            _initialized = true;
        };

        this.getHighlightsManager = function() {
            return _highlightsManager;
        };

        /**
         * Returns current selection partial Cfi, useful for workflows that need to check whether the user has selected something.
         *
         * @returns {object | undefined} partial cfi object or undefined if nothing is selected
         */
        this.getCurrentSelectionCfi = function() {
            return _highlightsManager.getCurrentSelectionCfi();
        };

        /**
         * Creates a higlight based on given parameters
         *
         * @param {string} spineIdRef		Spine idref that defines the partial Cfi
         * @param {string} cfi				Partial CFI (withouth the indirection step) relative to the spine index
         * @param {string} id				Id of the highlight. must be unique
         * @param {string} type 			Name of the class selector rule in annotations stylesheet.
         * 									The style of the class will be applied to the created hightlight
         * @param {object} styles			Object representing CSS properties to be applied to the highlight.
         * 									e.g., to apply background color pass in: {'background-color': 'green'}
         *
         * @returns {object | undefined} partial cfi object of the created highlight
         */
        this.addHighlight = function(spineIdRef, cfi, id, type, styles) {
            return _highlightsManager.addHighlight(spineIdRef, cfi, id, type, styles);
        };

        /**
         * Creates a higlight based on the current selection
         *
         * @param {string} id id of the highlight. must be unique
         * @param {string} type - name of the class selector rule in annotations.css file.
         * @param {boolean} clearSelection - set to true to clear the current selection
         * after it is highlighted
         * The style of the class will be applied to the created hightlight
         * @param {object} styles - object representing CSS properties to be applied to the highlight.
         * e.g., to apply background color pass this {'background-color': 'green'}
         *
         * @returns {object | undefined} partial cfi object of the created highlight
         */
        this.addSelectionHighlight =  function(id, type, styles, clearSelection) {
            return _highlightsManager.addSelectionHighlight(id, type, styles, clearSelection);
        };

        /**
         * Removes a given highlight
         *
         * @param {string} id  The id associated with the highlight.
         *
         * @returns {undefined}
         *
         */
        this.removeHighlight = function(id) {
            return _highlightsManager.removeHighlight(id);
        };

        /**
         * Removes highlights of a given type
         *
         * @param {string} type type of the highlight.
         *
         * @returns {undefined}
         *
         */
        this.removeHighlightsByType = function(type) {
            return _highlightsManager.removeHighlightsByType(type);
        };

        /**
         * Client Rectangle
         * @typedef {object} ReadiumSDK.Views.ReaderView.ClientRect
         * @property {number} top
         * @property {number} left
         * @property {number} height
         * @property {number} width
         */

        /**
         * Highlight Info
         *
         * @typedef {object} ReadiumSDK.Views.ReaderView.HighlightInfo
         * @property {string} id - unique id of the highlight
         * @property {string} type - highlight type (css class)
         * @property {string} CFI - partial CFI range of the highlight
         * @property {ReadiumSDK.Views.ReaderView.ClientRect[]} rectangleArray - array of rectangles consituting the highlight
         * @property {string} selectedText - concatenation of highlight nodes' text
         */

        /**
         * Gets given highlight
         *
         * @param {string} id id of the highlight.
         *
         * @returns {ReadiumSDK.Views.ReaderView.HighlightInfo} Object describing the highlight
         */
        this.getHighlight = function(id) {
            return _highlightsManager.getHighlight(id);
        };

        /**
         * Update annotation by the id, reapplies CSS styles to the existing annotaion
         *
         * @param {string} id id of the annotation.
         * @property {string} type - annotation type (name of css class)
         * @param {object} styles - object representing CSS properties to be applied to the annotation.
         * e.g., to apply background color pass this {'background-color': 'green'}.
         */
        this.updateAnnotation = function(id, type, styles) {
            _highlightsManager.updateAnnotation(id, type, styles);
        };

        /**
         * Replace annotation with this id. Current annotation is removed and a new one is created.
         *
         * @param {string} id id of the annotation.
         * @property {string} cfi - partial CFI range of the annotation
         * @property {string} type - annotation type (name of css class)
         * @param {object} styles - object representing CSS properties to be applied to the annotation.
         * e.g., to apply background color pass this {'background-color': 'green'}.
         */
        this.replaceAnnotation = function(id, cfi, type, styles) {
            _highlightsManager.replaceAnnotation(id, cfi, type, styles);
        };


        /**
         * Redraws all annotations
         */
        this.redrawAnnotations = function() {
            _highlightsManager.redrawAnnotations();
        };

        /**
         * Updates an annotation to use the supplied styles
         *
         * @param {string} id
         * @param {string} styles
         */
        this.updateAnnotationView = function(id, styles) {
            _highlightsManager.updateAnnotationView(id, styles);
        };

        /**
         * Updates an annotation view state, such as whether its hovered in or not.
         * @param {string} id       The id associated with the highlight.
         * @param {string} state    The state type to be updated
         * @param {string} value    The state value to apply to the highlight
         * @returns {undefined}
         */
        this.setAnnotationViewState = function(id, state, value) {
            return _highlightsManager.setAnnotationViewState(id, state, value);
        };

        /**
         * Updates an annotation view state for all views.
         * @param {string} state    The state type to be updated
         * @param {string} value    The state value to apply to the highlights
         * @returns {undefined}
         */
        this.setAnnotationViewStateForAll = function (state, value) {
            return _highlightsManager.setAnnotationViewStateForAll(state, value);
        };

        /**
         * Gets a list of the visible midpoint positions of all annotations
         *
         * @returns {HTMLElement[]}
         */
        this.getVisibleAnnotationMidpoints = function () {
            if (reader.getVisibleElements) {
                var $visibleElements = reader.getVisibleElements(_highlightsManager.getAnnotationsElementSelector(), true);

                var elementMidpoints = _highlightsManager.getAnnotationMidpoints($visibleElements);
                return elementMidpoints || [];
            } else {
                // FIXME: Expose the getVisibleElements call from the reader's internal views.
                console.warn('getAnnotationMidpoints won\'t work with this version of Readium');
            }
        };

        reader.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            if (_initialized) {
                _highlightsManager.attachAnnotations($iframe, spineItem, reader.getLoadedSpineItems());
            } else {
                _initializedLate = true;
            }
        });

        ////FIXME: JCCR mj8: this is sometimes faulty, consider removal
        //// automatically redraw annotations.
        //reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, _.debounce(function () {
        //    self.redrawAnnotations();
        //}, 10, true));



    });

    return config;
});

define('readium_plugin_highlights', ['readium_plugin_highlights/main'], function (main) { return main; });


define("readium-plugin-highlights", function(){});

require(["readium_plugin_highlights"]);

//# sourceMappingURL=readium-plugin-highlights.js.map