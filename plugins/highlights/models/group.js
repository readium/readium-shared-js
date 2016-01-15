define(["jquery", "underscore", "../lib/class", "./text_line_inferrer", "../views/view", "../views/border_view", "../helpers"],
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
