define(["jquery", "underscore", "./lib/class", "./helpers", "./models/group"],
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
