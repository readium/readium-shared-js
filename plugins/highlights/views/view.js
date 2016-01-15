define(["jquery", "underscore", "../lib/class", "../lib/length", "../models/text_line_inferrer", "../models/copied_text_styles"],
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
