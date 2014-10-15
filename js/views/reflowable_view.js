
//  LauncherOSX
//
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

/*
 * Renders reflowable content using CSS columns
 *
 * @class ReadiumSDK.Views.ReflowableView
 */

ReadiumSDK.Views.ReflowableView = function(options, reader){

    _.extend(this, Backbone.Events);

    var self = this;
    
    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _bookStyles = options.bookStyles;
    var _iframeLoader = options.iframeLoader;
    
    var _currentSpineItem;
    var _isWaitingFrameRender = false;    
    var _deferredPageRequest;
    var _fontSize = 100;
    var _$contentFrame;
    var _navigationLogic;
    var _$el;
    var _$iframe;
    var _$epubHtml;
    
    var _$htmlBody;
    
    var _htmlBodyIsVerticalWritingMode;
    var _htmlBodyIsLTRDirection;
    var _htmlBodyIsLTRWritingMode;
    
    
    var _currentOpacity = -1;

    var _lastViewPortSize = {
        width: undefined,
        height: undefined
    };

    var _paginationInfo = {

        visibleColumnCount : 2,
        columnGap : 20,
        spreadCount : 0,
        currentSpreadIndex : 0,
        columnWidth : undefined,
        pageOffset : 0,
        columnCount: 0
    };

    this.render = function(){

        var template = ReadiumSDK.Helpers.loadTemplate("reflowable_book_frame", {});

        _$el = $(template);
        _$viewport.append(_$el);

        var settings = _viewSettings;
        if (!settings)
        {
            //defaults
            settings = new ReadiumSDK.Models.ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {
            // This fixes rendering issues with WebView (native apps), which clips content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
            _$el.css("transform", "translateZ(0)");
        }

        // See ReaderView.handleViewportResize
        // var lazyResize = _.debounce(self.onViewportResize, 100);
        // $(window).on("resize.ReadiumSDK.reflowableView", _.bind(lazyResize, self));
        renderIframe();

        return self;
    };

    function setFrameSizesToRectangle(rectangle) {
        _$contentFrame.css("left", rectangle.left + "px");
        _$contentFrame.css("top", rectangle.top + "px");
        _$contentFrame.css("right", rectangle.right + "px");
        _$contentFrame.css("bottom", rectangle.bottom + "px");

    }

    this.remove = function() {

        //$(window).off("resize.ReadiumSDK.reflowableView");
        _$el.remove();

    };

    this.isReflowable = function() {
        return true;
    };

    this.onViewportResize = function() {

        if(updateViewportSize()) {
            updatePagination();
        }
    };

    var _viewSettings = undefined;
    this.setViewSettings = function(settings) {
        
        _viewSettings = settings;

        _paginationInfo.columnGap = settings.columnGap;
        _fontSize = settings.fontSize;

        updateHtmlFontSize();
        updateColumnGap();
        
        updateViewportSize();
        updatePagination();
    };

    function renderIframe() {
        if (_$contentFrame) {
            //destroy old contentFrame
            _$contentFrame.remove();
        }

        var template = ReadiumSDK.Helpers.loadTemplate("reflowable_book_page_frame", {});
        var $bookFrame = $(template);
        $bookFrame = _$el.append($bookFrame);

        _$contentFrame = $("#reflowable-content-frame", $bookFrame);

        _$iframe = $("#epubContentIframe", $bookFrame);

        _$iframe.css("left", "");
        _$iframe.css("right", "");
        _$iframe.css("position", "relative");
        //_$iframe.css(_spine.isLeftToRight() ? "left" : "right", "0px");
        _$iframe.css("overflow", "hidden");

        _navigationLogic = new ReadiumSDK.Views.CfiNavigationLogic(
            _$contentFrame, _$iframe,
            { rectangleBased: true, paginationInfo: _paginationInfo });
    }

    function loadSpineItem(spineItem) {

        if(_currentSpineItem != spineItem) {

            //create & append iframe to container frame
            renderIframe();

            _paginationInfo.pageOffset = 0;
            _paginationInfo.currentSpreadIndex = 0;
            _currentSpineItem = spineItem;
            _isWaitingFrameRender = true;

            var src = _spine.package.resolveRelativeUrl(spineItem.href);
            self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOAD_START, _$iframe, spineItem);

            _$iframe.css("opacity", "0.01");
            
            _iframeLoader.loadIframe(_$iframe[0], src, onIFrameLoad, self, {spineItem : spineItem});
        }
    }

    function updateHtmlFontSize() {

        if(_$epubHtml) {
            ReadiumSDK.Helpers.UpdateHtmlFontSize(_$epubHtml, _fontSize);
        }
    }

    function updateColumnGap() {

        if(_$epubHtml) {
        
            _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
                _$epubHtml.css(prefix + "column-gap", _paginationInfo.columnGap + "px");
            });
        }
    }

    function onIFrameLoad(success) {

        _isWaitingFrameRender = false;

        //while we where loading frame new request came
        if(_deferredPageRequest && _deferredPageRequest.spineItem != _currentSpineItem) {
            loadSpineItem(_deferredPageRequest.spineItem);
            return;
        }

        if(!success) {
            _$iframe.css("opacity", "1");
            _deferredPageRequest = undefined;
            return;
        }

        self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, _$iframe, _currentSpineItem);

        var epubContentDocument = _$iframe[0].contentDocument;
        _$epubHtml = $("html", epubContentDocument);
        _$htmlBody = $("body", _$epubHtml);
        
        _htmlBodyIsVerticalWritingMode = false;
        _htmlBodyIsLTRDirection = true;
        _htmlBodyIsLTRWritingMode = undefined;
        
        var win = _$iframe[0].contentDocument.defaultView || _$iframe[0].contentWindow;
        
        //Helpers.isIframeAlive
        var htmlBodyComputedStyle = win.getComputedStyle(_$htmlBody[0], null);
        if (htmlBodyComputedStyle)
        {
            _htmlBodyIsLTRDirection = htmlBodyComputedStyle.direction === "ltr";

            var writingMode = undefined;
            if (htmlBodyComputedStyle.getPropertyValue)
            {
                writingMode = htmlBodyComputedStyle.getPropertyValue("-webkit-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-moz-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-ms-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-o-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-epub-writing-mode") || htmlBodyComputedStyle.getPropertyValue("writing-mode");
            }
            else
            {
                writingMode = htmlBodyComputedStyle.webkitWritingMode || htmlBodyComputedStyle.mozWritingMode || htmlBodyComputedStyle.msWritingMode || htmlBodyComputedStyle.oWritingMode || htmlBodyComputedStyle.epubWritingMode || htmlBodyComputedStyle.writingMode;
            }

            if (writingMode)
            {
                _htmlBodyIsLTRWritingMode = writingMode.indexOf("-lr") >= 0; // || writingMode.indexOf("horizontal-") >= 0; we need explicit!
            
                if (writingMode.indexOf("vertical") >= 0 || writingMode.indexOf("tb-") >= 0 || writingMode.indexOf("bt-") >= 0)
                {
                    _htmlBodyIsVerticalWritingMode = true;
                }
            }
        }

        if (_htmlBodyIsLTRDirection)
        {
            if (_$htmlBody[0].getAttribute("dir") === "rtl" || _$epubHtml[0].getAttribute("dir") === "rtl")
            {
                _htmlBodyIsLTRDirection = false;
            }
        }

        // Some EPUBs may not have explicit RTL content direction (via CSS "direction" property or @dir attribute) despite having a RTL page progression direction. Readium consequently tweaks the HTML in order to restore the correct block flow in the browser renderer, resulting in the appropriate CSS columnisation (which is used to emulate pagination).
        if (!_spine.isLeftToRight() && _htmlBodyIsLTRDirection && !_htmlBodyIsVerticalWritingMode)
        {
            _$htmlBody[0].setAttribute("dir", "rtl");
            _htmlBodyIsLTRDirection = false;
            _htmlBodyIsLTRWritingMode = false;
        }
        
        _paginationInfo.isVerticalWritingMode = _htmlBodyIsVerticalWritingMode;
        
        hideBook();
        _$iframe.css("opacity", "1");
        
        updateViewportSize();
        _$epubHtml.css("height", _lastViewPortSize.height + "px");
        
        _$epubHtml.css("position", "relative");
        _$epubHtml.css("margin", "0");
        _$epubHtml.css("padding", "0");

        _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
            _$epubHtml.css(prefix + "column-axis", (_htmlBodyIsVerticalWritingMode ? "vertical" : "horizontal"));
        });

        //
        // /////////
        // //Columns Debugging
        //
        // _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
        //     _$epubHtml.css(prefix + "column-rule-color", "red");
        //     _$epubHtml.css(prefix + "column-rule-style", "dashed");
        //     _$epubHtml.css(prefix + "column-rule-width", "1px");
        // });
        // _$epubHtml.css("background-color", '#b0c4de');
        //
        // ////
        
        self.applyBookStyles();
        resizeImages();

        updateHtmlFontSize();
        updateColumnGap();


        self.applyStyles();
    }

    this.applyStyles = function() {

        ReadiumSDK.Helpers.setStyles(_userStyles.getStyles(), _$el.parent());

        //because left, top, bottom, right setting ignores padding of parent container
        //we have to take it to account manually
        var elementMargins = ReadiumSDK.Helpers.Margins.fromElement(_$el);
        setFrameSizesToRectangle(elementMargins.padding);


        updateViewportSize();
        updatePagination();
    };

    this.applyBookStyles = function() {

        if(_$epubHtml) {
            ReadiumSDK.Helpers.setStyles(_bookStyles.getStyles(), _$epubHtml);
        }
    };

    function openDeferredElement() {

        if(!_deferredPageRequest) {
            return;
        }

        var deferredData = _deferredPageRequest;
        _deferredPageRequest = undefined;
        self.openPage(deferredData);

    }

    this.openPage = function(pageRequest) {

        if(_isWaitingFrameRender) {
            _deferredPageRequest = pageRequest;
            return;
        }

        // if no spine item specified we are talking about current spine item
        if(pageRequest.spineItem && pageRequest.spineItem != _currentSpineItem) {
            _deferredPageRequest = pageRequest;
            loadSpineItem(pageRequest.spineItem);
            return;
        }

        var pageIndex = undefined;


        if(pageRequest.spineItemPageIndex !== undefined) {
            pageIndex = pageRequest.spineItemPageIndex;
        }
        else if(pageRequest.elementId) {
            pageIndex = _navigationLogic.getPageForElementId(pageRequest.elementId);
        }
        else if(pageRequest.elementCfi) {
            try
            {
                pageIndex = _navigationLogic.getPageForElementCfi(pageRequest.elementCfi,
                    ["cfi-marker", "mo-cfi-highlight"],
                    [],
                    ["MathJax_Message"]);
            }
            catch (e)
            {
                pageIndex = 0;
                console.error(e);
            }
        }
        else if(pageRequest.firstPage) {
            pageIndex = 0;
        }
        else if(pageRequest.lastPage) {
            pageIndex = _paginationInfo.columnCount - 1;
        }
        else {
            console.debug("No criteria in pageRequest");
            pageIndex = 0;
        }

        //start the pagination with an initial vertical offset if the page request has this information
        if (pageRequest.initialVerticalOffset) {
            _$htmlBody.css({marginTop: "-" + pageRequest.initialVerticalOffset + "px"});
            _.defer(function(){
                updatePagination();
            });

        }

        if(pageIndex >= 0 && pageIndex < _paginationInfo.columnCount) {
            _paginationInfo.currentSpreadIndex = Math.floor(pageIndex / _paginationInfo.visibleColumnCount) ;
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
        else {
            console.log('Illegal pageIndex value: ', pageIndex, 'column count is ', _paginationInfo.columnCount);
        }
    };

    function redraw() {

        var offsetVal =  -_paginationInfo.pageOffset + "px";

        if (_htmlBodyIsVerticalWritingMode)
        {
            _$epubHtml.css("top", offsetVal);
        }
        else
        {
            var ltr = _htmlBodyIsLTRDirection || _htmlBodyIsLTRWritingMode;

            _$epubHtml.css("left", ltr ? offsetVal : "");
            _$epubHtml.css("right", !ltr ? offsetVal : "");
        }

        showBook(); // as it's no longer hidden by shifting the position
    }

    function updateViewportSize() {

        var newWidth = _$contentFrame.width();
        var newHeight = _$contentFrame.height();

        if(_lastViewPortSize.width !== newWidth || _lastViewPortSize.height !== newHeight){

            _lastViewPortSize.width = newWidth;
            _lastViewPortSize.height = newHeight;
            return true;
        }

        return false;
    }

    function onPaginationChanged(initiator, paginationRequest_spineItem, paginationRequest_elementId) {

        _paginationInfo.pageOffset = (_paginationInfo.columnWidth + _paginationInfo.columnGap) * _paginationInfo.visibleColumnCount * _paginationInfo.currentSpreadIndex;
        
        redraw();
        self.trigger(ReadiumSDK.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, { paginationInfo: self.getPaginationInfo(), initiator: initiator, spineItem: paginationRequest_spineItem, elementId: paginationRequest_elementId } );
    }

    this.openPagePrev = function (initiator) {

        if(!_currentSpineItem) {
            return;
        }

        if(_paginationInfo.currentSpreadIndex > 0) {
            _paginationInfo.currentSpreadIndex--;
            onPaginationChanged(initiator);
        }
        else {

            var prevSpineItem = _spine.prevItem(_currentSpineItem, true);
            if(prevSpineItem) {

                var pageRequest = new ReadiumSDK.Models.PageOpenRequest(prevSpineItem, initiator);
                pageRequest.setLastPage();
                self.openPage(pageRequest);
            }
        }
    };

    this.openPageNext = function (initiator) {

        if(!_currentSpineItem) {
            return;
        }

        if(_paginationInfo.currentSpreadIndex < _paginationInfo.spreadCount - 1) {
            _paginationInfo.currentSpreadIndex++;
            onPaginationChanged(initiator);
        }
        else {

            var nextSpineItem = _spine.nextItem(_currentSpineItem, true);
            if(nextSpineItem) {

                var pageRequest = new ReadiumSDK.Models.PageOpenRequest(nextSpineItem, initiator);
                pageRequest.setFirstPage();
                self.openPage(pageRequest);
            }
        }
    };


    function updatePagination() {
        
        // At 100% font-size = 16px (on HTML, not body or descendant markup!)
        var MAXW = 550; //TODO user/vendor-configurable?
        var MINW = 400;
        
        var isDoublePageSyntheticSpread = ReadiumSDK.Helpers.deduceSyntheticSpread(_$viewport, _currentSpineItem, _viewSettings);
        
        var forced = (isDoublePageSyntheticSpread === false) || (isDoublePageSyntheticSpread === true);
        // excludes 0 and 1 falsy/truthy values which denote non-forced result
        
// console.debug("isDoublePageSyntheticSpread: " + isDoublePageSyntheticSpread);
// console.debug("forced: " + forced);
//
        if (isDoublePageSyntheticSpread === 0)
        {
            isDoublePageSyntheticSpread = 1; // try double page, will shrink if doesn't fit
// console.debug("TRYING SPREAD INSTEAD OF SINGLE...");
        }
        
        _paginationInfo.visibleColumnCount = isDoublePageSyntheticSpread ? 2 : 1;
   
        if (_htmlBodyIsVerticalWritingMode)
        {
            MAXW *= 2;
            isDoublePageSyntheticSpread = false;
            forced = true;
            _paginationInfo.visibleColumnCount = 1;
// console.debug("Vertical Writing Mode => single CSS column, but behaves as if two-page spread");
        }

        if(!_$epubHtml) {
            return;
        }
        
        hideBook(); // shiftBookOfScreen();
        
        var borderLeft = parseInt(_$viewport.css("border-left-width"));
        var borderRight = parseInt(_$viewport.css("border-right-width"));
        var adjustedGapLeft = _paginationInfo.columnGap/2;
        adjustedGapLeft = Math.max(0, adjustedGapLeft-borderLeft)
        var adjustedGapRight = _paginationInfo.columnGap/2;
        adjustedGapRight = Math.max(0, adjustedGapRight-borderRight)

        var filler = 0;
        
//         var win = _$iframe[0].contentDocument.defaultView || _$iframe[0].contentWindow;
//         var htmlBodyComputedStyle = win.getComputedStyle(_$htmlBody[0], null);
//         if (htmlBodyComputedStyle)
//         {
//             var fontSize = undefined;
//             if (htmlBodyComputedStyle.getPropertyValue)
//             {
//                 fontSize = htmlBodyComputedStyle.getPropertyValue("font-size");
//             }
//             else
//             {
//                 fontSize = htmlBodyComputedStyle.fontSize;
//             }
// console.debug(fontSize);
//         }
        
        if (_viewSettings.fontSize)
        {
            var fontSizeAdjust = (_viewSettings.fontSize*0.8)/100;
            MAXW = Math.floor(MAXW * fontSizeAdjust);
            MINW = Math.floor(MINW * fontSizeAdjust);
        }
        
        var availableWidth = _$viewport.width();
        var textWidth = availableWidth - borderLeft - borderRight - adjustedGapLeft - adjustedGapRight;
        if (isDoublePageSyntheticSpread)
        {
            textWidth = (textWidth - _paginationInfo.columnGap) * 0.5;
        }
        
        if (textWidth > MAXW)
        {
// console.debug("LIMITING WIDTH");
            filler = Math.floor((textWidth - MAXW) * (isDoublePageSyntheticSpread ? 1 : 0.5));
        }
        else if (!forced && textWidth < MINW && isDoublePageSyntheticSpread)
        {
//console.debug("REDUCING SPREAD TO SINGLE");
            isDoublePageSyntheticSpread = false;
            _paginationInfo.visibleColumnCount = 1;
            
            textWidth = availableWidth - borderLeft - borderRight - adjustedGapLeft - adjustedGapRight;
            if (textWidth > MAXW)
            {
                filler = Math.floor((textWidth - MAXW) * 0.5);
            }
        }
        
        _$el.css({"left": (filler+adjustedGapLeft + "px"), "right": (filler+adjustedGapRight + "px")});
        updateViewportSize(); //_$contentFrame ==> _lastViewPortSize

        
        _$iframe.css("width", _lastViewPortSize.width + "px");
        _$iframe.css("height", _lastViewPortSize.height + "px");

        _$epubHtml.css("height", _lastViewPortSize.height + "px");
        
        // below min- max- are required in vertical writing mode (height is not enough, in some cases...weird!)
        _$epubHtml.css("min-height", _lastViewPortSize.height + "px");
        _$epubHtml.css("max-height", _lastViewPortSize.height + "px");

        //normalise spacing to avoid interference with column-isation
        _$epubHtml.css('margin', 0);
        _$epubHtml.css('padding', 0);
        _$epubHtml.css('border', 0);
        //_$htmlBody.css('margin', 0);
        _$htmlBody.css('padding', 0);

        var spacing = 0;
        try
        {
            spacing = parseInt(_$htmlBody.css('padding-top')) + parseInt(_$htmlBody.css('border-top-width')) + parseInt(_$htmlBody.css('border-bottom-width'));
        }
        catch(err)
        {
            
        }
        // Needed for Firefox, otherwise content shrinks vertically, resulting in scrollWidth accomodating more columns than necessary
        //_$htmlBody.css("min-height", _lastViewPortSize.height-spacing-9 + "px");
        _$htmlBody.css("min-height", "50%");
        _$htmlBody.css("max-height", _lastViewPortSize.height-spacing + "px");

        _paginationInfo.rightToLeft = _spine.isRightToLeft();

        _paginationInfo.columnWidth = Math.round(((_htmlBodyIsVerticalWritingMode ? _lastViewPortSize.height : _lastViewPortSize.width) - _paginationInfo.columnGap * (_paginationInfo.visibleColumnCount - 1)) / _paginationInfo.visibleColumnCount);

        _$epubHtml.css("width", (_htmlBodyIsVerticalWritingMode ? _lastViewPortSize.width : _paginationInfo.columnWidth) + "px");

        _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
            _$epubHtml.css(prefix + "column-width", _paginationInfo.columnWidth + "px");
        });

        _$epubHtml.css({left: "0", right: "0", top: "0"});
        
        ReadiumSDK.Helpers.triggerLayout(_$iframe);

        _paginationInfo.columnCount = ((_htmlBodyIsVerticalWritingMode ? _$epubHtml[0].scrollHeight : _$epubHtml[0].scrollWidth) + _paginationInfo.columnGap) / (_paginationInfo.columnWidth + _paginationInfo.columnGap);
        console.log('_paginationInfo.columnCount:' +_paginationInfo.columnCount);
        _paginationInfo.columnCount = Math.round(_paginationInfo.columnCount);

        var totalGaps = (_paginationInfo.columnCount-1) * _paginationInfo.columnGap;
        var colWidthCheck = ((_htmlBodyIsVerticalWritingMode ? _$epubHtml[0].scrollHeight : _$epubHtml[0].scrollWidth) - totalGaps) / _paginationInfo.columnCount;
        colWidthCheck = Math.round(colWidthCheck);

        if (colWidthCheck > _paginationInfo.columnWidth)
        {
            console.debug("ADJUST COLUMN");
            console.log(_paginationInfo.columnWidth);
            console.log(colWidthCheck);
            
            _paginationInfo.columnWidth = colWidthCheck;
        }

        _paginationInfo.spreadCount =  Math.ceil(_paginationInfo.columnCount / _paginationInfo.visibleColumnCount);

        if(_paginationInfo.currentSpreadIndex >= _paginationInfo.spreadCount) {
            _paginationInfo.currentSpreadIndex = _paginationInfo.spreadCount - 1;
        }

        if(_deferredPageRequest) {

            //if there is a request for specific page we get here
            openDeferredElement();
        }
        else {

            //we get here on resizing the viewport
            
            onPaginationChanged(self); // => redraw() => showBook(), so the trick below is not needed

            // //We do this to force re-rendering of the document in the iframe.
            // //There is a bug in WebView control with right to left columns layout - after resizing the window html document
            // //is shifted in side the containing div. Hiding and showing the html element puts document in place.
            // _$epubHtml.hide();
            // setTimeout(function() {
            //     _$epubHtml.show();
            //     onPaginationChanged(self); // => redraw() => showBook()
            // }, 50);

        }
    }

//    function shiftBookOfScreen() {
//
//        if(_spine.isLeftToRight()) {
//            _$epubHtml.css("left", (_lastViewPortSize.width + 1000) + "px");
//        }
//        else {
//            _$epubHtml.css("right", (_lastViewPortSize.width + 1000) + "px");
//        }
//    }

    function hideBook()
    {
        if (_currentOpacity != -1) return; // already hidden
        
        _currentOpacity = _$epubHtml.css('opacity');
        _$epubHtml.css('opacity', "0");
    }

    function showBook()
    {
        if (_currentOpacity != -1)
        {
            _$epubHtml.css('opacity', _currentOpacity);
        }
        _currentOpacity = -1;
    }

    this.getFirstVisibleElementCfi = function() {

        var contentOffsets = getVisibleContentOffsets();
        return _navigationLogic.getFirstVisibleElementCfi(contentOffsets);
    };

    this.getPaginationInfo = function() {

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(_spine, false);

        if(!_currentSpineItem) {
            return paginationInfo;
        }

        var pageIndexes = getOpenPageIndexes();

        for(var i = 0, count = pageIndexes.length; i < count; i++) {

            paginationInfo.addOpenPage(pageIndexes[i], _paginationInfo.columnCount, _currentSpineItem.idref, _currentSpineItem.index);
        }

        return paginationInfo;

    };

    function getOpenPageIndexes() {

        var indexes = [];

        var currentPage = _paginationInfo.currentSpreadIndex * _paginationInfo.visibleColumnCount;

        for(var i = 0; i < _paginationInfo.visibleColumnCount && (currentPage + i) < _paginationInfo.columnCount; i++) {

            indexes.push(currentPage + i);
        }

        return indexes;

    }

    //we need this styles for css columnizer not to chop big images
    function resizeImages() {

        if(!_$epubHtml) {
            return;
        }

        var $elem;
        var height;
        var width;

        $('img, svg', _$epubHtml).each(function(){

            $elem = $(this);

            // if we set max-width/max-height to 100% columnizing engine chops images embedded in the text
            // (but not if we set it to 99-98%) go figure.
            // TODO: CSS min-w/h is content-box, not border-box (does not take into account padding + border)? => images may still overrun?
            $elem.css('max-width', '98%');
            $elem.css('max-height', '98%');

            if(!$elem.css('height')) {
                $elem.css('height', 'auto');
            }

            if(!$elem.css('width')) {
                $elem.css('width', 'auto');
            }

        });
    }

    this.bookmarkCurrentPage = function() {

        if(!_currentSpineItem) {

            return new ReadiumSDK.Models.BookmarkData("", "");
        }

        return new ReadiumSDK.Models.BookmarkData(_currentSpineItem.idref, self.getFirstVisibleElementCfi());
    };

    function getVisibleContentOffsets() {
        //TODO: _htmlBodyIsVerticalWritingMode ? (_lastViewPortSize.height * _paginationInfo.currentSpreadIndex)
        // NOT used with options.rectangleBased anyway (see CfiNavigationLogic constructor call, here in this reflow engine class)
        var columnsLeftOfViewport = Math.round(_paginationInfo.pageOffset / (_paginationInfo.columnWidth + _paginationInfo.columnGap));

        var topOffset =  columnsLeftOfViewport * _$contentFrame.height();
        var bottomOffset = topOffset + _paginationInfo.visibleColumnCount * _$contentFrame.height();

        return {top: topOffset, bottom: bottomOffset};
    }

    this.getLoadedSpineItems = function() {
        return [_currentSpineItem];
    };

    this.getElementByCfi = function(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if(spineItem != _currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElementByCfi(cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getElementById = function(spineItem, id) {

        if(spineItem != _currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElementById(id);
    };

    this.getElement = function(spineItem, selector) {

        if(spineItem != _currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElement(selector);
    };

    this.getFirstVisibleMediaOverlayElement = function() {

        var visibleContentOffsets = getVisibleContentOffsets();
        return _navigationLogic.getFirstVisibleMediaOverlayElement(visibleContentOffsets);
    };
    
    // /**
    //  * @deprecated
    //  */
    // this.getVisibleMediaOverlayElements = function() {
    // 
    //     var visibleContentOffsets = getVisibleContentOffsets();
    //     return _navigationLogic.getVisibleMediaOverlayElements(visibleContentOffsets);
    // };

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        var $element = $(element);
        if(_navigationLogic.isElementVisible($element, getVisibleContentOffsets()))
        {
            return;
        }

        var page = _navigationLogic.getPageForElement($element);

        if(page == -1)
        {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(_currentSpineItem, initiator);
        openPageRequest.setPageIndex(page);

        var id = element.id;
        if (!id)
        {
            id = element.getAttribute("id");
        }
        
        if (id)
        {
            openPageRequest.setElementId(id);
        }

        self.openPage(openPageRequest);
    }

};
