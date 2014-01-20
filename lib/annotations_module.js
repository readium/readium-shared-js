var EpubAnnotationsModule = function (contentDocumentDOM, bbPageSetView, annotationCSSUrl) {
    
    var EpubAnnotations = {};

    // Rationale: The order of these matters
    EpubAnnotations.TextLineInferrer = Backbone.Model.extend({

    initialize : function (attributes, options) {},

    // ----------------- PUBLIC INTERFACE --------------------------------------------------------------

    inferLines : function (rectList) {

        var inferredLines = [];
        var numRects = rectList.length;
        var numLines = 0;
        var currLine;
        var currRect;
        var rectAppended;

        // Iterate through each rect
        for (var currRectNum = 0; currRectNum <= numRects - 1; currRectNum++) {
            currRect = rectList[currRectNum];

            // Check if the rect can be added to any of the current lines
            rectAppended = false;
            for (var currLineNum = 0; currLineNum <= numLines - 1; currLineNum++) {
                currLine = inferredLines[currLineNum];

                if (this.includeRectInLine(currLine, currRect.top, currRect.left, currRect.width, currRect.height)) {
                    this.expandLine(currLine, currRect.left, currRect.top, currRect.width, currRect.height);
                    rectAppended = true;
                    break;   
                }
            } 
            
            if (rectAppended) {
                continue;
            }
            // If the rect can't be added to any existing lines, create a new line
            else {
                inferredLines.push(this.createNewLine(currRect.left, currRect.top, currRect.width, currRect.height));
                numLines = numLines + 1; // Update the number of lines, so we're not using .length on every iteration
            }
        }

        return inferredLines;
    },


    // ----------------- PRIVATE HELPERS ---------------------------------------------------------------

    includeRectInLine : function (currLine, rectTop, rectLeft, rectWidth, rectHeight) {

        // is on an existing line : based on vertical position
        if (this.rectIsWithinLineVertically(rectTop, rectHeight, currLine.maxTop, currLine.maxBottom)) {
            if (this.rectIsWithinLineHorizontally(rectLeft, rectWidth, currLine.left, currLine.width, currLine.avgHeight)) {
                return true;
            }
        }

        return false;
    },

    rectIsWithinLineVertically : function (rectTop, rectHeight, currLineMaxTop, currLineMaxBottom) {

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
        }
        else if (rectTop < currLineMaxTop && rectBottom < currLineMaxBottom && rectBottom > currLineMaxTop) {
            return true;
        }
        else if (rectTop > currLineMaxTop && rectBottom > currLineMaxBottom && rectTop < currLineMaxBottom) {
            return true;
        }
        else if (rectTop > currLineMaxTop && rectBottom < currLineMaxBottom) {
            return true;
        }
        else if (rectTop < currLineMaxTop && rectBottom > currLineMaxBottom) {
            return true;
        }
        else {
            return false;
        }
    },

    rectIsWithinLineHorizontally : function (rectLeft, rectWidth, currLineLeft, currLineWidth, currLineAvgHeight) {

        var lineGapHeuristic = 2 * currLineAvgHeight;
        var rectRight = rectLeft + rectWidth;
        var currLineRight = rectLeft + currLineWidth;

        if ((currLineLeft - rectRight) > lineGapHeuristic) {
            return false;
        }
        else if ((rectLeft - currLineRight) > lineGapHeuristic) {
            return false;
        }
        else {
            return true;
        }
    },

    createNewLine : function (rectLeft, rectTop, rectWidth, rectHeight) {

        var maxBottom = rectTop + rectHeight;

        return {
            left : rectLeft,
            startTop : rectTop,
            width : rectWidth, 
            avgHeight : rectHeight, 
            maxTop : rectTop,
            maxBottom : maxBottom,
            numRects : 1
        };
    },

    expandLine : function (currLine, rectLeft, rectTop, rectWidth, rectHeight) {

        var lineOldRight = currLine.left + currLine.width; 

        // Update all the properties of the current line with rect dimensions
        var rectRight = rectLeft + rectWidth;
        var rectBottom = rectTop + rectHeight;
        var numRectsPlusOne = currLine.numRects + 1;

        // Average height calculation
        var currSumHeights = currLine.avgHeight * currLine.numRects;
        var avgHeight = ((currSumHeights + rectHeight) / numRectsPlusOne);
        currLine.avgHeight = avgHeight;
        currLine.numRects = numRectsPlusOne;

        // Expand the line vertically
        currLine = this.expandLineVertically(currLine, rectTop, rectBottom);
        currLine = this.expandLineHorizontally(currLine, rectLeft, rectRight);        

        return currLine;
    },

    expandLineVertically : function (currLine, rectTop, rectBottom) {

        if (rectTop < currLine.maxTop) {
            currLine.maxTop = rectTop;
        } 
        if (rectBottom > currLine.maxBottom) {
            currLine.maxBottom = rectBottom;
        }

        return currLine;
    },

    expandLineHorizontally : function (currLine, rectLeft, rectRight) {

        var newLineLeft = currLine.left <= rectLeft ? currLine.left : rectLeft;
        var lineRight = currLine.left + currLine.width;
        var newLineRight = lineRight >= rectRight ? lineRight : rectRight;
        var newLineWidth = newLineRight - newLineLeft;
        currLine.left = newLineLeft;
        currLine.width = newLineWidth;

        return currLine;
    }
});
    EpubAnnotations.Highlight = Backbone.Model.extend({

    defaults : {
        "isVisible" : false
    },

    initialize : function (attributes, options) {}
});
    EpubAnnotations.HighlightGroup = Backbone.Model.extend({

    defaults : function () {
        return {
            "selectedNodes" : [],
            "highlightViews" : []
        };
    },

    initialize : function (attributes, options) {
        this.set("scale", attributes.scale);
        this.constructHighlightViews();
    },

    // --------------- PRIVATE HELPERS ---------------------------------------

    highlightGroupCallback : function (event) {

        var that = this;
        
        // Trigger this event on each of the highlight views (except triggering event)
        if (event.type === "click") {
            that.get("bbPageSetView").trigger("annotationClicked", "highlight", that.get("CFI"), that.get("id"), event);
            return;
        }


        // Trigger this event on each of the highlight views (except triggering event)
        if (event.type === "contextmenu") {
            that.get("bbPageSetView").trigger("annotationRightClicked", "highlight", that.get("CFI"), that.get("id"), event);
            return;
        }


        // Events that are called on each member of the group
        _.each(this.get("highlightViews"), function (highlightView) {

            if (event.type === "mouseenter") {
                highlightView.setHoverHighlight();    
            }
            else if (event.type === "mouseleave") {
                highlightView.setBaseHighlight();
            }
        });
    },

    constructHighlightViews : function () {

        var that = this;
        var rectList = [];
        var inferrer;
        var inferredLines;

        _.each(this.get("selectedNodes"), function (node, index) {

            var rects;
            var range = document.createRange();
            range.selectNodeContents(node);
            rects = range.getClientRects();

            // REFACTORING CANDIDATE: Maybe a better way to append an array here
            _.each(rects, function (rect) {
                rectList.push(rect);
            });
        });

        inferrer = new EpubAnnotations.TextLineInferrer();
        inferredLines = inferrer.inferLines(rectList);

        var scale = this.get("scale");

        _.each(inferredLines, function (line, index) {

            var highlightTop = line.startTop / scale;;
            var highlightLeft = line.left / scale;;
            var highlightHeight = line.avgHeight / scale;
            var highlightWidth = line.width / scale;;

            var highlightView = new EpubAnnotations.HighlightView({
                CFI : that.get("CFI"),
                top : highlightTop + that.get("offsetTopAddition"),
                left : highlightLeft + that.get("offsetLeftAddition"),
                height : highlightHeight,
                width : highlightWidth,
                styles : that.get('styles'),
                highlightGroupCallback : that.highlightGroupCallback,
                callbackContext : that
            });

            that.get("highlightViews").push(highlightView);
        });
    },

    resetHighlights : function (viewportElement, offsetTop, offsetLeft) {

        if (offsetTop) {
            this.set({ offsetTopAddition : offsetTop });
        }
        if (offsetLeft) {
            this.set({ offsetLeftAddition : offsetLeft });
        }

        this.destroyCurrentHighlights();
        this.constructHighlightViews();
        this.renderHighlights(viewportElement);
    },

    // REFACTORING CANDIDATE: Ensure that event listeners are being properly cleaned up. 
    destroyCurrentHighlights : function () { 

        _.each(this.get("highlightViews"), function (highlightView) {
            highlightView.remove();
            highlightView.off();
        });

        this.get("highlightViews").length = 0;
    },

    renderHighlights : function (viewportElement) {

        _.each(this.get("highlightViews"), function (view, index) {
            $(viewportElement).append(view.render());
        });
    },

    toInfo : function () {

        return {

            id : this.get("id"),
            type : "highlight",
            CFI : this.get("CFI")
        };
    },

    setStyles : function (styles) {
        var highlightViews = this.get('highlightViews');

        this.set({styles : styles});

        _.each(highlightViews, function(view, index) {
            view.setStyles(styles);
        });
    }
});

    EpubAnnotations.Underline = Backbone.Model.extend({

    defaults : {
        "isVisible" : false
    },

    initialize : function (attributes, options) {}
});
    EpubAnnotations.UnderlineGroup = Backbone.Model.extend({

    defaults : function () {
        return {
            "selectedNodes" : [],
            "underlineViews" : []
        };
    },

    initialize : function (attributes, options) {

        this.constructUnderlineViews();
    },

    // --------------- PRIVATE HELPERS ---------------------------------------

    underlineGroupCallback : function (event) {

        var that = this;

        // Trigger this event on each of the underline views (except triggering event)
        if (event.type === "click") {
            that.get("bbPageSetView").trigger("annotationClicked", "underline", that.get("CFI"), that.get("id"), event);
            return;
        }

        // Events that are called on each member of the group
        _.each(this.get("underlineViews"), function (underlineView) {

            if (event.type === "mouseenter") {
                underlineView.setHoverUnderline();
            }
            else if (event.type === "mouseleave") {
                underlineView.setBaseUnderline();
            }
        });
    },

    constructUnderlineViews : function () {

        var that = this;
        var rectList = [];
        var inferrer;
        var inferredLines;

        _.each(this.get("selectedNodes"), function (node, index) {

            var rects;
            var range = document.createRange();
            range.selectNodeContents(node);
            rects = range.getClientRects();

            // REFACTORING CANDIDATE: Maybe a better way to append an array here
            _.each(rects, function (rect) {
                rectList.push(rect);
            });
        });

        inferrer = new EpubAnnotations.TextLineInferrer();
        inferredLines = inferrer.inferLines(rectList);

        _.each(inferredLines, function (line, index) {

            var underlineTop = line.startTop;
            var underlineLeft = line.left;
            var underlineHeight = line.avgHeight;
            var underlineWidth = line.width;

            var underlineView = new EpubAnnotations.UnderlineView({
                CFI : that.get("CFI"),
                top : underlineTop + that.get("offsetTopAddition"),
                left : underlineLeft + that.get("offsetLeftAddition"),
                height : underlineHeight,
                width : underlineWidth,
                styles : that.get("styles"),
                underlineGroupCallback : that.underlineGroupCallback,
                callbackContext : that
            });

            that.get("underlineViews").push(underlineView);
        });
    },

    resetUnderlines : function (viewportElement, offsetTop, offsetLeft) {

        if (offsetTop) {
            this.set({ offsetTopAddition : offsetTop });
        }
        if (offsetLeft) {
            this.set({ offsetLeftAddition : offsetLeft });
        }

        this.destroyCurrentUnderlines();
        this.constructUnderlineViews();
        this.renderUnderlines(viewportElement);
    },

    // REFACTORING CANDIDATE: Ensure that event listeners are being properly cleaned up. 
    destroyCurrentUnderlines : function () { 

        _.each(this.get("underlineViews"), function (underlineView) {
            underlineView.remove();
            underlineView.off();
        });

        this.get("underlineViews").length = 0;
    },

    renderUnderlines : function (viewportElement) {

        _.each(this.get("underlineViews"), function (view, index) {
            $(viewportElement).append(view.render());
        });
    },

    toInfo : function () {

        return {

            id : this.get("id"),
            type : "underline",
            CFI : this.get("CFI")
        };
    },

    setStyles : function (styles) {
        
        var underlineViews = this.get('underlineViews');

        this.set({styles : styles});

        _.each(underlineViews, function(view, index) {
            view.setStyles(styles);
        });
    },
});

    EpubAnnotations.Bookmark = Backbone.Model.extend({

    defaults : {
        "isVisible" : false,
        "bookmarkCenteringAdjustment" : 15,
        "bookmarkTopAdjustment" : 45
    },

    initialize : function (attributes, options) {

        // Figure out the top and left of the bookmark
        // This should include the additional offset provided by the annotations object
    },

    getAbsoluteTop : function () {

        var targetElementTop = $(this.get("targetElement")).offset().top;
        var bookmarkAbsoluteTop = this.get("offsetTopAddition") + targetElementTop - this.get("bookmarkTopAdjustment");
        return bookmarkAbsoluteTop;
    },

    getAbsoluteLeft : function () {

        var targetElementLeft = $(this.get("targetElement")).offset().left;
        var bookmarkAbsoluteLeft = this.get("offsetLeftAddition") + targetElementLeft - this.get("bookmarkCenteringAdjustment");
        return bookmarkAbsoluteLeft;
    },

    toInfo : function () {

        return {

            id : this.get("id"),
            type : "bookmark",
            CFI : this.get("CFI")
        };
    }
});
    EpubAnnotations.ReflowableAnnotations = Backbone.Model.extend({

    initialize : function (attributes, options) {
        
        this.epubCFI = EPUBcfi;
        this.annotations = new EpubAnnotations.Annotations({
            offsetTopAddition : 0, 
            offsetLeftAddition : 0, 
            readerBoundElement : $("html", this.get("contentDocumentDOM"))[0],
            scale: 0,
            bbPageSetView : this.get("bbPageSetView")
        });
        // inject annotation CSS into iframe 

        
        var annotationCSSUrl = this.get("annotationCSSUrl");
        if (annotationCSSUrl)
        {
            this.injectAnnotationCSS(annotationCSSUrl);
        }

        // emit an event when user selects some text.
        var epubWindow = $(this.get("contentDocumentDOM"));
        var self = this;
        epubWindow.on("mouseup", function(event) {
            var range = self.getCurrentSelectionRange();
            if (range === undefined) {
                return;
            }
            if (range.startOffset - range.endOffset) {
                self.annotations.get("bbPageSetView").trigger("textSelectionEvent", event);
            }
        });


    },

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    redraw : function () {

        var leftAddition = -this.getPaginationLeftOffset();
        this.annotations.redrawAnnotations(0, leftAddition);
    },

   removeHighlight: function(annotationId) {
        return this.annotations.removeHighlight(annotationId)
    },



    addHighlight : function (CFI, id, type, styles) {

        var CFIRangeInfo;
        var range;
        var rangeStartNode;
        var rangeEndNode;
        var selectedElements;
        var leftAddition;
        var startMarkerHtml = this.getRangeStartMarker(CFI, id);
        var endMarkerHtml = this.getRangeEndMarker(CFI, id);

        // TODO webkit specific?
        var $html = $(this.get("contentDocumentDOM"));
        var matrix = $('html', $html).css('-webkit-transform');
        var scale = new WebKitCSSMatrix(matrix).a;
        this.set("scale", scale);

        try {
            CFIRangeInfo = this.epubCFI.injectRangeElements(
                CFI,
                this.get("contentDocumentDOM"),
                startMarkerHtml,
                endMarkerHtml,
                ["cfi-marker"],
                [],
                ["MathJax_Message"]
                );

            // Get start and end marker for the id, using injected into elements
            // REFACTORING CANDIDATE: Abstract range creation to account for no previous/next sibling, for different types of
            //   sibiling, etc. 
            rangeStartNode = CFIRangeInfo.startElement.nextSibling ? CFIRangeInfo.startElement.nextSibling : CFIRangeInfo.startElement;
            rangeEndNode = CFIRangeInfo.endElement.previousSibling ? CFIRangeInfo.endElement.previousSibling : CFIRangeInfo.endElement;
            range = document.createRange();
            range.setStart(rangeStartNode, 0);
            range.setEnd(rangeEndNode, rangeEndNode.length);

            selectionInfo = this.getSelectionInfo(range);
            leftAddition = -this.getPaginationLeftOffset();

            if (type === "highlight") {
                this.annotations.set('scale', this.get('scale'));
                this.annotations.addHighlight(CFI, selectionInfo.selectedElements, id, 0, leftAddition, CFIRangeInfo.startElement, CFIRangeInfo.endElement, styles);
            }
            else if (type === "underline") {
                this.annotations.addUnderline(CFI, selectionInfo.selectedElements, id, 0, leftAddition, styles);
            }

            return {
                CFI : CFI, 
                selectedElements : selectionInfo.selectedElements
            };

        } catch (error) {
            console.log(error.message);
        }
    },

    addBookmark : function (CFI, id, type) {

        var selectedElements;
        var bookmarkMarkerHtml = this.getBookmarkMarker(CFI, id);
        var $injectedElement;
        var leftAddition;

        try {
            $injectedElement = this.epubCFI.injectElement(
                CFI,
                this.get("contentDocumentDOM"),
                bookmarkMarkerHtml,
                ["cfi-marker"],
                [],
                ["MathJax_Message"]
            );

            // Add bookmark annotation here
            leftAddition = -this.getPaginationLeftOffset();
            this.annotations.addBookmark(CFI, $injectedElement[0], id, 0, leftAddition, type);

            return {

                CFI : CFI, 
                selectedElements : $injectedElement[0]
            };

        } catch (error) {
            console.log(error.message);
        }
    },

    addImageAnnotation : function (CFI, id) {

        var selectedElements;
        var bookmarkMarkerHtml = this.getBookmarkMarker(CFI, id);
        var $targetImage;

        try {
            $targetImage = this.epubCFI.getTargetElement(
                CFI,
                this.get("contentDocumentDOM"),
                ["cfi-marker"],
                [],
                ["MathJax_Message"]
            );
            this.annotations.addImageAnnotation(CFI, $targetImage[0], id);

            return {

                CFI : CFI, 
                selectedElements : $targetImage[0]
            };

        } catch (error) {
            console.log(error.message);
        }
    },

    // this returns a partial CFI only!!
    getCurrentSelectionCFI: function() {
        var currentSelection = this.getCurrentSelectionRange();
        var CFI;
        if (currentSelection) {
            selectionInfo = this.getSelectionInfo(currentSelection);
            CFI = selectionInfo.CFI;
        }

        return CFI;
    },

    // this returns a partial CFI only!!
    getCurrentSelectionOffsetCFI: function() {
        var currentSelection = this.getCurrentSelectionRange();

        var CFI;
        if (currentSelection) {
            CFI = this.generateCharOffsetCFI(currentSelection);
        }
        return CFI;
    },


    /// TODODM refactor thhis using getCurrentSelectionCFI (above)


    addSelectionHighlight : function (id, type, styles) {

        var arbitraryPackageDocCFI = "/99!"
        var generatedContentDocCFI;
        var CFI;
        var selectionInfo;
        var currentSelection = this.getCurrentSelectionRange();
        var annotationInfo;

        if (currentSelection) {

            selectionInfo = this.getSelectionInfo(currentSelection);
            generatedContentDocCFI = selectionInfo.CFI;
            CFI = "epubcfi(" + arbitraryPackageDocCFI + generatedContentDocCFI + ")";
            if (type === "highlight") {
                annotationInfo = this.addHighlight(CFI, id, type, styles);
            }
            else if (type === "underline") {
                annotationInfo = this.addHighlight(CFI, id, type, styles);
            }

            // Rationale: The annotationInfo object returned from .addBookmark(...) contains the same value of 
            //   the CFI variable in the current scope. Since this CFI variable contains a "hacked" CFI value -
            //   only the content document portion is valid - we want to replace the annotationInfo.CFI property with
            //   the partial content document CFI portion we originally generated.
            annotationInfo.CFI = generatedContentDocCFI;            
            return annotationInfo;
        }
        else {
            throw new Error("Nothing selected");
        }
    },

    addSelectionBookmark : function (id, type) {

        var arbitraryPackageDocCFI = "/99!"
        var generatedContentDocCFI;
        var CFI;
        var currentSelection = this.getCurrentSelectionRange();
        var annotationInfo;

        if (currentSelection) {

            generatedContentDocCFI = this.generateCharOffsetCFI(currentSelection);
            CFI = "epubcfi(" + arbitraryPackageDocCFI + generatedContentDocCFI + ")";
            annotationInfo = this.addBookmark(CFI, id, type);

            // Rationale: The annotationInfo object returned from .addBookmark(...) contains the same value of 
            //   the CFI variable in the current scope. Since this CFI variable contains a "hacked" CFI value -
            //   only the content document portion is valid - we want to replace the annotationInfo.CFI property with
            //   the partial content document CFI portion we originally generated.
            annotationInfo.CFI = generatedContentDocCFI;
            return annotationInfo;
        }
        else {
            throw new Error("Nothing selected");
        }
    },

    addSelectionImageAnnotation : function (id) {

        var arbitraryPackageDocCFI = "/99!"
        var generatedContentDocCFI;
        var CFI;
        var selectionInfo;
        var currentSelection = this.getCurrentSelectionRange();
        var annotationInfo;
        var firstSelectedImage;

        if (currentSelection) {

            selectionInfo = this.getSelectionInfo(currentSelection, ["img"]);
            firstSelectedImage = selectionInfo.selectedElements[0];
            generatedContentDocCFI = this.epubCFI.generateElementCFIComponent(
                firstSelectedImage,
                ["cfi-marker"],
                [],
                ["MathJax_Message"]
            );
            CFI = "epubcfi(" + arbitraryPackageDocCFI + generatedContentDocCFI + ")";
            annotationInfo = this.addImageAnnotation(CFI, id);

            // Rationale: The annotationInfo object returned from .addBookmark(...) contains the same value of 
            //   the CFI variable in the current scope. Since this CFI variable contains a "hacked" CFI value -
            //   only the content document portion is valid - we want to replace the annotationInfo.CFI property with
            //   the partial content document CFI portion we originally generated.
            annotationInfo.CFI = generatedContentDocCFI;
            return annotationInfo;
        }
        else {
            throw new Error("Nothing selected");
        }
    },

    updateAnnotationView : function (id, styles) {

        var annotationViews = this.annotations.updateAnnotationView(id, styles);

        return annotationViews;
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    getSelectionInfo : function (selectedRange, elementType) {

        // Generate CFI for selected text
        var CFI = this.generateRangeCFI(selectedRange);
        var intervalState = {
            startElementFound : false,
            endElementFound : false
        };
        var selectedElements = [];

        if (!elementType) {
            var elementType = ["text"];
        }

        this.findSelectedElements(
            selectedRange.commonAncestorContainer, 
            selectedRange.startContainer, 
            selectedRange.endContainer,
            intervalState,
            selectedElements, 
            elementType
        );

        // Return a list of selected text nodes and the CFI
        return {
            CFI : CFI,
            selectedElements : selectedElements
        };
    },

    generateRangeCFI : function (selectedRange) {

        var startNode = selectedRange.startContainer;
        var endNode = selectedRange.endContainer;
        var startOffset;
        var endOffset;
        var rangeCFIComponent;

        if (startNode.nodeType === Node.TEXT_NODE && endNode.nodeType === Node.TEXT_NODE) {

            startOffset = selectedRange.startOffset;
            endOffset = selectedRange.endOffset;

            rangeCFIComponent = this.epubCFI.generateCharOffsetRangeComponent(
                startNode, 
                startOffset, 
                endNode, 
                endOffset,
                ["cfi-marker"],
                [],
                ["MathJax_Message"]
                );
            return rangeCFIComponent;
        }
        else {
            throw new Error("Selection start and end must be text nodes");
        }
    },

    generateCharOffsetCFI : function (selectedRange) {

        // Character offset
        var startNode = selectedRange.startContainer;
        var startOffset = selectedRange.startOffset;
        var charOffsetCFI;

        if (startNode.nodeType === Node.TEXT_NODE) {
            charOffsetCFI = this.epubCFI.generateCharacterOffsetCFIComponent(
                startNode,
                startOffset,
                ["cfi-marker"],
                [],
                ["MathJax_Message"]
            );
        }
        return charOffsetCFI;
    },

    // REFACTORING CANDIDATE: Convert this to jquery
    findSelectedElements : function (currElement, startElement, endElement, intervalState, selectedElements, elementTypes) {

        if (currElement === startElement) {
            intervalState.startElementFound = true;
        }

        if (intervalState.startElementFound === true) {
            this.addElement(currElement, selectedElements, elementTypes);
        }

        if (currElement === endElement) {
            intervalState.endElementFound = true;
            return;
        }

        if (currElement.firstChild) {
            this.findSelectedElements(currElement.firstChild, startElement, endElement, intervalState, selectedElements, elementTypes);
            if (intervalState.endElementFound) {
                return;
            }
        }

        if (currElement.nextSibling) {
            this.findSelectedElements(currElement.nextSibling, startElement, endElement, intervalState, selectedElements, elementTypes);
            if (intervalState.endElementFound) {
                return;
            }
        }
    },

    addElement : function (currElement, selectedElements, elementTypes) {

        // Check if the node is one of the types
        _.each(elementTypes, function (elementType) {

            if (elementType === "text") {
                if (currElement.nodeType === Node.TEXT_NODE) {
                    selectedElements.push(currElement);
                }
            }
            else {
                if ($(currElement).is(elementType)) {
                    selectedElements.push(currElement);    
                }
            }
        });
    },

    // Rationale: This is a cross-browser method to get the currently selected text
    getCurrentSelectionRange : function () {

        var currentSelection;
        var iframeDocument = this.get("contentDocumentDOM");
        if (iframeDocument.getSelection) {
            currentSelection = iframeDocument.getSelection();

            if (currentSelection && currentSelection.rangeCount && (currentSelection.anchorOffset !== currentSelection.focusOffset)) {
                return currentSelection.getRangeAt(0);
            }else{
                return undefined;
            }
        }
        else if (iframeDocument.selection) {
            return iframeDocument.selection.createRange();
        }
        else {
            return undefined;
        }
    },

    getPaginationLeftOffset : function () {

        var $htmlElement = $("html", this.get("contentDocumentDOM"));
        var offsetLeftPixels = $htmlElement.css("left");
        var offsetLeft = parseInt(offsetLeftPixels.replace("px", ""));
        return offsetLeft;
    },

    getBookmarkMarker : function (CFI, id) {

        return "<span class='bookmark-marker cfi-marker' id='" + id + "' data-cfi='" + CFI + "'></span>";
    },

    getRangeStartMarker : function (CFI, id) {

        return "<span class='range-start-marker cfi-marker' id='start-" + id + "' data-cfi='" + CFI + "'></span>";
    },

    getRangeEndMarker : function (CFI, id) {

        return "<span class='range-end-marker cfi-marker' id='end-" + id + "' data-cfi='" + CFI + "'></span>";
    },

    injectAnnotationCSS : function (annotationCSSUrl) {

        var $contentDocHead = $("head", this.get("contentDocumentDOM"));
        $contentDocHead.append(
            $("<link/>", { rel : "stylesheet", href : annotationCSSUrl, type : "text/css" })
        );
    }
});

    EpubAnnotations.Annotations = Backbone.Model.extend({

    defaults : function () {
        return {
            "bookmarkViews" : [],
            "highlights" : [],
            "markers"    : {},
            "underlines" : [],
            "imageAnnotations" : [],
            "annotationHash" : {},
            "offsetTopAddition" : 0,
            "offsetLeftAddition" : 0,
            "readerBoundElement" : undefined
        };
    },

    initialize : function (attributes, options) {},


    remove: function() {
        var that = this;
        _.each(this.get("highlights"), function (highlightGroup) {
            highlightGroup.remove();
        });
    },

    redrawAnnotations : function (offsetTop, offsetLeft) {

        var that = this;
        // Highlights
        _.each(this.get("highlights"), function (highlightGroup) {
            highlightGroup.resetHighlights(that.get("readerBoundElement"), offsetTop, offsetLeft);
        });

        // Bookmarks
        _.each(this.get("bookmarkViews"), function (bookmarkView) {
            bookmarkView.resetBookmark(offsetTop, offsetLeft);
        });

        // Underlines
        _.each(this.get("underlines"), function (underlineGroup) {
            underlineGroup.resetUnderlines(that.get("readerBoundElement"), offsetTop, offsetLeft);
        });
    },

    getBookmark : function (id) {

        var bookmarkView = this.get("annotationHash")[id];
        if (bookmarkView) {
            return bookmarkView.bookmark.toInfo();
        }
        else {
            return undefined;
        }
    },

    getHighlight : function (id) {

        var highlight = this.get("annotationHash")[id];
        if (highlight) {
            return highlight.toInfo();
        }
        else {
            return undefined;
        }
    },

    getUnderline : function (id) {

        var underline = this.get("annotationHash")[id];
        if (underline) {
            return underline.toInfo();
        }
        else {
            return undefined;
        }
    },

    getBookmarks : function () {

        var bookmarks = [];
        _.each(this.get("bookmarkViews"), function (bookmarkView) {

            bookmarks.push(bookmarkView.bookmark.toInfo());
        });
        return bookmarks;
    },

    getHighlights : function () {

        var highlights = [];
        _.each(this.get("highlights"), function (highlight) {

            highlights.push(highlight.toInfo());
        });
        return highlights;
    },

    getUnderlines : function () {

        var underlines = [];
        _.each(this.get("underlines"), function (underline) {

            underlines.push(underline.toInfo());
        });
        return underlines;
    },

    getImageAnnotations : function () {

        var imageAnnotations = [];
        _.each(this.get("imageAnnotations"), function (imageAnnotation) {

            imageAnnotations.push(imageAnnotation.toInfo());
        });
        return imageAnnotations;
    },

    addBookmark : function (CFI, targetElement, annotationId, offsetTop, offsetLeft, type) {

        if (!offsetTop) {
            offsetTop = this.get("offsetTopAddition");
        }
        if (!offsetLeft) {
            offsetLeft = this.get("offsetLeftAddition");
        }

        annotationId = annotationId.toString();
        this.validateAnnotationId(annotationId);

        var bookmarkView = new EpubAnnotations.BookmarkView({
            CFI : CFI,
            targetElement : targetElement, 
            offsetTopAddition : offsetTop,
            offsetLeftAddition : offsetLeft,
            id : annotationId.toString(),
            bbPageSetView : this.get("bbPageSetView"),
            type : type
        });
        this.get("annotationHash")[annotationId] = bookmarkView;
        this.get("bookmarkViews").push(bookmarkView);
        $(this.get("readerBoundElement")).append(bookmarkView.render());
    },

    removeHighlight: function(annotationId) {
        var annotationHash = this.get("annotationHash");
        var highlights = this.get("highlights");
        var markers = this.get("markers");

        if (!markers[annotationId])
            return;

        var startMarker =  markers[annotationId].startMarker;
        var endMarker = markers[annotationId].endMarker;

        startMarker.remove();
        endMarker.remove();

        delete markers[annotationId];

        delete annotationHash[annotationId];

        highlights = _.reject(highlights, 
                              function(obj) { 
                                  if (obj.id == annotationId) {
                                      obj.destroyCurrentHighlights();
                                      return true;
                                  } else {
                                      return false;
                                  }
                              }
                             );


                             this.set("highlights", highlights);
    },

    addHighlight : function (CFI, highlightedTextNodes, annotationId, offsetTop, offsetLeft, startMarker, endMarker, styles) {
        if (!offsetTop) {
            offsetTop = this.get("offsetTopAddition");
        }
        if (!offsetLeft) {
            offsetLeft = this.get("offsetLeftAddition");
        }

        annotationId = annotationId.toString();
        this.validateAnnotationId(annotationId);

        var highlightGroup = new EpubAnnotations.HighlightGroup({
            CFI : CFI,
            selectedNodes : highlightedTextNodes,
            offsetTopAddition : offsetTop,
            offsetLeftAddition : offsetLeft,
            styles: styles, 
            id : annotationId,
            bbPageSetView : this.get("bbPageSetView"),
            scale: this.get("scale")
        });
        this.get("annotationHash")[annotationId] = highlightGroup;
        this.get("highlights").push(highlightGroup);
        this.get("markers")[annotationId] = {"startMarker": startMarker, "endMarker":endMarker};
        highlightGroup.renderHighlights(this.get("readerBoundElement"));
    },

    addUnderline : function (CFI, underlinedTextNodes, annotationId, offsetTop, offsetLeft, styles) {

        if (!offsetTop) {
            offsetTop = this.get("offsetTopAddition");
        }
        if (!offsetLeft) {
            offsetLeft = this.get("offsetLeftAddition");
        }

        annotationId = annotationId.toString();
        this.validateAnnotationId(annotationId);

        var underlineGroup = new EpubAnnotations.UnderlineGroup({
            CFI : CFI,
            selectedNodes : underlinedTextNodes,
            offsetTopAddition : offsetTop,
            offsetLeftAddition : offsetLeft,
            styles: styles,
            id : annotationId,
            bbPageSetView : this.get("bbPageSetView")
        });
        this.get("annotationHash")[annotationId] = underlineGroup;
        this.get("underlines").push(underlineGroup);
        underlineGroup.renderUnderlines(this.get("readerBoundElement"));
    },

    addImageAnnotation : function (CFI, imageNode, annotationId) {

        annotationId = annotationId.toString();
        this.validateAnnotationId(annotationId);

        var imageAnnotation = new EpubAnnotations.ImageAnnotation({
            CFI : CFI,
            imageNode : imageNode,
            id : annotationId,
            bbPageSetView : this.get("bbPageSetView")
        });
        this.get("annotationHash")[annotationId] = imageAnnotation;
        this.get("imageAnnotations").push(imageAnnotation);
        imageAnnotation.render();
    },

    updateAnnotationView : function (id, styles) {
        var annotationViews = this.get("annotationHash")[id];

        annotationViews.setStyles(styles);

        return annotationViews;
    },

    // REFACTORING CANDIDATE: Some kind of hash lookup would be more efficient here, might want to 
    //   change the implementation of the annotations as an array
    validateAnnotationId : function (id) {

        if (this.get("annotationHash")[id]) {
            throw new Error("That annotation id already exists; annotation not added");
        }
    }
});

    EpubAnnotations.BookmarkView = Backbone.View.extend({

    el : "<div></div>",

    events : {
        "mouseenter" : "setHoverBookmark",
        "mouseleave" : "setBaseBookmark",
        "click" : "clickHandler"
    },

    initialize : function (options) {

        this.bookmark = new EpubAnnotations.Bookmark({
            CFI : options.CFI,
            targetElement : options.targetElement, 
            offsetTopAddition : options.offsetTopAddition,
            offsetLeftAddition : options.offsetLeftAddition,
            id : options.id,
            bbPageSetView : options.bbPageSetView,
            type : options.type
        });
    },

    resetBookmark : function (offsetTop, offsetLeft) {

        if (offsetTop) {
            this.bookmark.set({ offsetTopAddition : offsetTop });
        }

        if (offsetLeft) {
            this.bookmark.set({ offsetLeftAddition : offsetLeft });
        }
        this.setCSS();
    },

    render : function () {

        this.setCSS();
        return this.el;
    },

    setCSS : function () {

        var absoluteTop;
        var absoluteLeft;

        if (this.bookmark.get("type") === "comment") {
            absoluteTop = this.bookmark.getAbsoluteTop();
            absoluteLeft = this.bookmark.getAbsoluteLeft();
            this.$el.css({ 
                "top" : absoluteTop + "px",
                "left" : absoluteLeft + "px",
                "width" : "50px",
                "height" : "50px",
                "position" : "absolute"
            });
            this.$el.addClass("comment");
        }
        else {
            this.$el.addClass("bookmark");
        }
    },

    setHoverBookmark : function (event) {

        event.stopPropagation();
        if (this.$el.hasClass("comment")) {
            this.$el.removeClass("comment");
            this.$el.addClass("hover-comment");
        }
    },

    setBaseBookmark : function (event) {

        event.stopPropagation();
        if (this.$el.hasClass("hover-comment")) {
            this.$el.removeClass("hover-comment");
            this.$el.addClass("comment");
        }
    },

    clickHandler : function (event) {

        event.stopPropagation();
        var type;
        if (this.bookmark.get("type") === "comment") {
            type = "comment";
        }
        else {
            type = "bookmark";
        }

        this.bookmark.get("bbPageSetView").trigger("annotationClicked", 
            type, 
            this.bookmark.get("CFI"), 
            this.bookmark.get("id"),
            this.$el.css("top"),
            this.$el.css("left"),
            event
        );
    }
});

    EpubAnnotations.HighlightView = Backbone.View.extend({

    el : "<div class='highlight'></div>",

    events : {
        "mouseenter" : "highlightEvent",
        "mouseleave" : "highlightEvent",
        "click" : "highlightEvent",
        "contextmenu" : "highlightEvent"
    },

    initialize : function (options) {

        this.highlight = new EpubAnnotations.Highlight({
            CFI : options.CFI,
            top : options.top,
            left : options.left,
            height : options.height,
            width : options.width,
            styles: options.styles,
            highlightGroupCallback : options.highlightGroupCallback,
            callbackContext : options.callbackContext
        });
    },

    render : function () {

        this.setCSS();
        return this.el;
    },

    resetPosition : function (top, left, height, width) {

        this.highlight.set({
            top : top,
            left : left,
            height : height,
            width : width
        });
        this.setCSS();
    },

    setStyles : function (styles) {

        this.highlight.set({
            styles : styles,
        });
        this.render();
    },

    setCSS : function () {

        var styles = this.highlight.get("styles") || {};
        
        this.$el.css({ 
            "top" : this.highlight.get("top") + "px",
            "left" : this.highlight.get("left") + "px",
            "height" : this.highlight.get("height") + "px",
            "width" : this.highlight.get("width") + "px",
            "background-color" : styles.fill_color || "normal",
        });
    },

    setBaseHighlight : function () {

        this.$el.addClass("highlight");
        this.$el.removeClass("hover-highlight");
    },

    setHoverHighlight : function () {

        this.$el.addClass("hover-highlight");
        this.$el.removeClass("highlight");
    },

    highlightEvent : function (event) {

        event.stopPropagation();
        var highlightGroupCallback = this.highlight.get("highlightGroupCallback");
        var highlightGroupContext = this.highlight.get("callbackContext");
        highlightGroupContext.highlightGroupCallback(event);
    }
});

    EpubAnnotations.UnderlineView = Backbone.View.extend({

    el : "<div class='underline-range'> \
             <div class='transparent-part'></div> \
             <div class='underline-part'></div> \
          </div>",

    events : {
        "mouseenter" : "underlineEvent",
        "mouseleave" : "underlineEvent",
        "click" : "underlineEvent"
    },

    initialize : function (options) {

        this.underline = new EpubAnnotations.Underline({
            CFI : options.CFI,
            top : options.top,
            left : options.left,
            height : options.height,
            width : options.width,
            styles : options.styles,
            underlineGroupCallback : options.underlineGroupCallback,
            callbackContext : options.callbackContext
        });

        this.$transparentElement = $(".transparent-part", this.$el);
        this.$underlineElement = $(".underline-part", this.$el);
    },

    render : function () {

        this.setCSS();
        return this.el;
    },

    resetPosition : function (top, left, height, width) {

        this.underline.set({
            top : top,
            left : left,
            height : height,
            width : width
        });
        this.setCSS();
    },

    setStyles : function (styles) {

        this.underline.set({
            styles : styles,
        });
        this.render();
    },

    setCSS : function () {
        var styles = this.underline.get("styles") || {};
        
        this.$el.css({ 
            "top" : this.underline.get("top") + "px",
            "left" : this.underline.get("left") + "px",
            "height" : this.underline.get("height") + "px",
            "width" : this.underline.get("width") + "px",
        });

        // Underline part
        this.$underlineElement.css({
            "background-color" : styles.fill_color || "normal",
        });

        
        this.$underlineElement.addClass("underline");
    },

    underlineEvent : function (event) {

        event.stopPropagation();
        var underlineGroupCallback = this.underline.get("underlineGroupCallback");
        var underlineGroupContext = this.underline.get("callbackContext");
        underlineGroupContext.underlineGroupCallback(event);
    },

    setBaseUnderline : function () {

        this.$underlineElement.addClass("underline");
        this.$underlineElement.removeClass("hover-underline");
    },

    setHoverUnderline : function () {

        this.$underlineElement.addClass("hover-underline");
        this.$underlineElement.removeClass("underline");
    },
});

    // Rationale: An image annotation does NOT have a view, as we don't know the state of an image element within an EPUB; it's entirely
//   possible that an EPUB image element could have a backbone view associated with it already, which would cause problems if we 
//   tried to associate another backbone view. As such, this model modifies CSS properties for an annotated image element.
//   
//   An image annotation view that manages an absolutely position element (similar to bookmarks, underlines and highlights) can be
//   added if more functionality is required. 

EpubAnnotations.ImageAnnotation = Backbone.Model.extend({

    initialize : function (attributes, options) {

        // Set handlers here. Can use jquery handlers
        var that = this;
        var $imageElement = $(this.get("imageNode"));
        $imageElement.on("mouseenter", function () {
            that.setMouseenterBorder();
        });
        $imageElement.on("mouseleave", function () {
            that.setMouseleaveBorder();
        });
        $imageElement.on("click", function () {
            that.get("bbPageSetView").trigger("annotationClicked", "image", that.get("CFI"), that.get("id"),event);
        });
    },

    render : function () {

        this.setCSS();
    },

    setCSS : function () {
        
        $(this.get("imageNode")).css({
            "border" : "5px solid rgb(255, 0, 0)",
            "border" : "5px solid rgba(255, 0, 0, 0.2)",
            "-webkit-background-clip" : "padding-box",
            "background-clip" : "padding-box"
        });
    },

    setMouseenterBorder : function () {

        $(this.get("imageNode")).css({
            "border" : "5px solid rgba(255, 0, 0, 0.4)"
        });
    },

    setMouseleaveBorder : function () {

        $(this.get("imageNode")).css({
            "border" : "5px solid rgba(255, 0, 0, 0.2)"
        });
    }
});



    var reflowableAnnotations = new EpubAnnotations.ReflowableAnnotations({
        contentDocumentDOM : contentDocumentDOM, 
        bbPageSetView : bbPageSetView,
        annotationCSSUrl : annotationCSSUrl,
    });

    // Description: The public interface
    return {

        addSelectionHighlight : function (id, type, styles) { 
            return reflowableAnnotations.addSelectionHighlight(id, type, styles); 
        },
        addSelectionBookmark : function (id, type) { 
            return reflowableAnnotations.addSelectionBookmark(id, type); 
        },
        addSelectionImageAnnotation : function (id) {
            return reflowableAnnotations.addSelectionImageAnnotation(id);
        },
        addHighlight : function (CFI, id, type, styles) { 
            return reflowableAnnotations.addHighlight(CFI, id, type, styles); 
        },
        addBookmark : function (CFI, id, type) { 
            return reflowableAnnotations.addBookmark(CFI, id, type);
        },
        addImageAnnotation : function (CFI, id) { 
            return reflowableAnnotations.addImageAnnotation(CFI, id); 
        },
        updateAnnotationView : function (id, styles) {
            return reflowableAnnotations.updateAnnotationView(id, styles);
        },
        redraw : function () { 
            return reflowableAnnotations.redraw(); 
        },
        getBookmark : function (id) { 
            return reflowableAnnotations.annotations.getBookmark(id); 
        },
        getBookmarks : function () { 
            return reflowableAnnotations.annotations.getBookmarks(); 
        }, 
        getHighlight : function (id) { 
            return reflowableAnnotations.annotations.getHighlight(id); 
        },
        getHighlights : function () { 
            return reflowableAnnotations.annotations.getHighlights(); 
        },
        getUnderline : function (id) { 
            return reflowableAnnotations.annotations.getUnderline(id); 
        },
        getUnderlines : function () { 
            return reflowableAnnotations.annotations.getUnderlines();
        },
        getImageAnnotation : function () {

        },
        getImageAnnotations : function () {

        }, 
        removeAnnotation: function (annotationId) {
            return reflowableAnnotations.remove(annotationId);
        },
        getCurrentSelectionCFI: function () {
            return reflowableAnnotations.getCurrentSelectionCFI();
        },
        getCurrentSelectionOffsetCFI: function () {
            return reflowableAnnotations.getCurrentSelectionOffsetCFI();
        },
        removeHighlight: function (annotationId) {
            return reflowableAnnotations.removeHighlight(annotationId);
        }
    };
};
