
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

define(["../globals", "jquery", "underscore", "eventEmitter", "../models/bookmark_data", "./cfi_navigation_logic",
    "../models/current_pages_info", "../helpers", "../models/page_open_request",
    "../models/viewer_settings", "ResizeSensor", "../readiumCSS"],
    function(Globals, $, _, EventEmitter, BookmarkData, CfiNavigationLogic,
             CurrentPagesInfo, Helpers, PageOpenRequest,
             ViewerSettings, ResizeSensor, ReadiumCSS) {

/**
 * Renders reflowable content using CSS columns
 * @param options
 * @constructor
 */
var ReflowableView = function(options, reader){
    $.extend(this, new EventEmitter());

    var self = this;

    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _bookStyles = options.bookStyles;
    var _iframeLoader = options.iframeLoader;

    var _currentSpineItem;
    var _isWaitingFrameRender = false;
    var _deferredPageRequest;
    var _fontSize = 100;
    var _fontSelection = 0;
    
    var _navigationLogic;

    // Container elements
    var viewportElement = options.$viewport[0];
    var containerElement;
    var contentFrameElement;

    // Handles to EPUB content iframe references
    var contentFrame;
    var contentWindow;
    var contentDocument;
    var contentDocumentRoot;
    var contentDocumentBody;

    var _lastPageRequest = undefined;

    var _cfiClassBlacklist = ["cfi-marker", "mo-cfi-highlight", "resize-sensor", "resize-sensor-expand", "resize-sensor-shrink", "resize-sensor-inner", "js-hypothesis-config", "js-hypothesis-embed"];
    var _cfiElementBlacklist = ["hypothesis-adder"];
    var _cfiIdBlacklist = ["MathJax_Message", "MathJax_SVG_Hidden"];

    var _htmlBodyIsVerticalWritingMode;
    var _htmlBodyIsLTRDirection;
    var _htmlBodyIsLTRWritingMode;

    var _lastViewPortSize = {
        width: undefined,
        height: undefined
    };

    var _lastBodySize = {
        width: undefined,
        height: undefined
    };

    var _paginationInfo = {

        visibleColumnCount : 2,
        columnGap : 0,
        columnMaxWidth: 550,
        columnMinWidth: 400,
        spreadCount : 0,
        currentSpreadIndex : 0,
        currentPageIndex: 0,
        columnWidth : undefined,
        pageOffset : 0,
        columnCount: 0
    };

    var _readiumCSS;

    this.render = function(){

        containerElement = $(Helpers.loadTemplate("reflowable_book_frame", {}))[0];
        viewportElement.appendChild(containerElement);

        var settings = reader.viewerSettings();
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
        {
            //defaults
            settings = new ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {
            // This fixes rendering issues with WebView (native apps), which clips content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
            containerElement.style.transform = "translateZ(0)";
        }

        // See ReaderView.handleViewportResize
        // var lazyResize = _.debounce(self.onViewportResize, 100);
        // $(window).on("resize.ReadiumSDK.reflowableView", _.bind(lazyResize, self));
        renderIframe();

        return self;
    };

    this.remove = function() {
        containerElement.remove();
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
    this.setViewSettings = function(settings, docWillChange) {

        _viewSettings = settings;

        _paginationInfo.columnGap = settings.columnGap;
        _paginationInfo.columnMaxWidth = settings.columnMaxWidth;
        _paginationInfo.columnMinWidth = settings.columnMinWidth;
        
        _fontSize = settings.fontSize;
        _fontSelection = settings.fontSelection;

        updateViewportSize();

        if (!docWillChange) {
            updateColumnGap();

            updateHtmlFontInfo();
        }
    };
    
    function getFrameDimensions() {
        return {
            width: contentFrame.clientWidth,
            height: contentFrame.clientHeight
        };
    }

    function getPageOffset() {
        if (_paginationInfo.rightToLeft && !_paginationInfo.isVerticalWritingMode) {
            return -_paginationInfo.pageOffset;
        }
        return _paginationInfo.pageOffset;
    }

    function getPaginationOffsets() {
        var offset = getPageOffset();
        if (_paginationInfo.isVerticalWritingMode) {
            return {
                top: offset,
                left: 0
            };
        }
        return {
            top: 0,
            left: offset
        };
    }

    function getScrollRoot() {
        return contentFrame.contentDocument.scrollingElement || contentDocumentRoot;
    }

    function renderIframe() {
        if (contentFrameElement) {
            //destroy old contentFrame
            contentFrameElement.remove();
        }

        var bookFrame = $(Helpers.loadTemplate("reflowable_book_page_frame", {}))[0];
        containerElement.appendChild(bookFrame);

        contentFrameElement = $("#reflowable-content-frame", containerElement)[0];

        var $iframe = $("#epubContentIframe", containerElement);
        contentFrame = $iframe[0];
        $iframe.css("left", "");
        $iframe.css("right", "");
        $iframe.css("position", "relative");
        //_$iframe.css(_spine.isLeftToRight() ? "left" : "right", "0px");
        $iframe.css("overflow", "hidden");

        _navigationLogic = new CfiNavigationLogic({
            $iframe: $iframe,
            frameDimensionsGetter: getFrameDimensions,
            paginationInfo: _paginationInfo,
            paginationOffsetsGetter: getPaginationOffsets,
            classBlacklist: _cfiClassBlacklist,
            elementBlacklist: _cfiElementBlacklist,
            idBlacklist: _cfiIdBlacklist
        });
    }

    function onIFrameUnload() {
        Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "reflowable_view.js [ " + _currentSpineItem.href + " ]");
        self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, $(contentFrame), _currentSpineItem);

        _readiumCSS = null;
    }

    function loadSpineItem(spineItem) {

        if (_currentSpineItem !== spineItem) {

            //create & append iframe to container frame
            renderIframe();
            if (_currentSpineItem) {
                onIFrameUnload();
            }

            self.resetCurrentPosition();

            _paginationInfo.pageOffset = 0;
            _paginationInfo.currentSpreadIndex = 0;
            _paginationInfo.currentPageIndex = 0;
            _currentSpineItem = spineItem;
            
            // TODO: this is a dirty hack!!
            _currentSpineItem.paginationInfo = _paginationInfo; 
            
            _isWaitingFrameRender = true;

            var src = _spine.package.resolveRelativeUrl(spineItem.href);
            
            Globals.logEvent("CONTENT_DOCUMENT_LOAD_START", "EMIT", "reflowable_view.js [ " + spineItem.href + " -- " + src + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOAD_START, $(contentFrame), spineItem);

            contentFrame.style.opacity = '0.01';

            _iframeLoader.loadIframe(contentFrame, src, onIFrameLoad, self, {spineItem : spineItem});
        }
    }

    function updateHtmlFontInfo() {
        //TODO Readium CSS
        //
        // if(_$epubHtml) {
        //     var i = _fontSelection;
        //     var useDefault = !reader.fonts || !reader.fonts.length || i <= 0 || (i-1) >= reader.fonts.length;
        //     var font = (useDefault ?
        //                 {} :
        //                 reader.fonts[i - 1]);
        //     Helpers.UpdateHtmlFontAttributes(_$epubHtml, _fontSize, font, function() {self.applyStyles();});
        // }
        self.applyStyles();
    }

    function updateColumnGap() {

        if (contentDocumentRoot && contentDocumentRoot.style) {
            contentDocumentRoot.style.setProperty("--RS__colGap", _paginationInfo.columnGap + "px");
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
            contentFrame.style.opacity = '1';
            _deferredPageRequest = undefined;
            return;
        }

        Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "reflowable_view.js [ " + _currentSpineItem.href + " ]");
        self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, $(contentFrame), _currentSpineItem);

        contentWindow = contentFrame.contentWindow;
        contentDocument = contentFrame.contentDocument;
        contentDocumentRoot = contentDocument.documentElement;
        contentDocumentBody = contentDocument.body;

        _readiumCSS = new ReadiumCSS(contentDocument, {
            pagination: true,
            scroll: false
        });
        _readiumCSS.inject();

        // TODO: how to address this correctly across all the affected platforms?!
        // Video surface sometimes (depends on the video codec) disappears from CSS column (i.e. reflow page) during playback
        // (audio continues to play normally, but video canvas is invisible).
        // https://github.com/readium/readium-js-viewer/issues/265#issuecomment-73018762
        // ...Meanwhile, reverting https://github.com/readium/readium-js-viewer/issues/239
        // by commenting the code below (which unfortunately only works with some GPU / codec configurations,
        // but actually fails on several other machines!!)
        /*
        if(window.chrome
            && window.navigator.vendor === "Google Inc.") // TODO: Opera (WebKit) sometimes suffers from this rendering bug too (depends on the video codec), but unfortunately GPU-accelerated rendering makes the video controls unresponsive!!
        {
            $("video", _$htmlBody).css("transform", "translateZ(0)");
        }
        */

        _htmlBodyIsVerticalWritingMode = false;
        _htmlBodyIsLTRDirection = true;
        _htmlBodyIsLTRWritingMode = undefined;

        var win = contentFrame.contentDocument.defaultView || contentFrame.contentWindow;

        //Helpers.isIframeAlive
        var htmlBodyComputedStyle = win.getComputedStyle(contentDocumentBody, null);
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
            if (contentDocumentBody.getAttribute("dir") === "rtl" || contentDocumentRoot.getAttribute("dir") === "rtl")
            {
                _htmlBodyIsLTRDirection = false;
            }
        }

        // Some EPUBs may not have explicit RTL content direction (via CSS "direction" property or @dir attribute) despite having a RTL page progression direction. Readium consequently tweaks the HTML in order to restore the correct block flow in the browser renderer, resulting in the appropriate CSS columnisation (which is used to emulate pagination).
        if (!_spine.isLeftToRight() && _htmlBodyIsLTRDirection && !_htmlBodyIsVerticalWritingMode)
        {
            contentDocumentBody.setAttribute("dir", "rtl");
            _htmlBodyIsLTRDirection = false;
            _htmlBodyIsLTRWritingMode = false;
        }

        _paginationInfo.isVerticalWritingMode = _htmlBodyIsVerticalWritingMode; 

        contentFrame.style.opacity = '';

        // Hide the content until first pagination.
        // For example to hide the shifting of pagination to the last page when navigating backwards.
        contentDocumentRoot.style.opacity = '0';
        self.once(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, function () {
            contentDocumentRoot.style.opacity = '';
        });

        updateViewportSize();

        contentDocumentRoot.style.columnAxis = _htmlBodyIsVerticalWritingMode ? "vertical" : "horizontal";

        self.applyBookStyles();

        updateColumnGap();

        updateHtmlFontInfo();
    }

    this.applyStyles = function() {

        Helpers.setStyles(_userStyles.getStyles(), containerElement.parentNode);

        updateViewportSize();
        updatePagination();
    };

    this.applyBookStyles = function() {

        if(contentDocumentRoot) { // implies _$iframe
            Helpers.setStyles(_bookStyles.getStyles(), contentFrame.contentDocument); //_$epubHtml
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

    function _openPageInternal(pageRequest) {

        if(_isWaitingFrameRender) {
            _deferredPageRequest = pageRequest;
            return false;
        }

        // if no spine item specified we are talking about current spine item
        if (pageRequest.spineItem && pageRequest.spineItem !== _currentSpineItem) {
            _deferredPageRequest = pageRequest;
            loadSpineItem(pageRequest.spineItem);
            return true;
        }

        var pageIndex = undefined;


        if(pageRequest.spineItemPageIndex !== undefined) {
            pageIndex = pageRequest.spineItemPageIndex;
        }
        else if(pageRequest.elementId) {
            pageIndex = _paginationInfo.currentPageIndex + _navigationLogic.getPageIndexDeltaForElementId(pageRequest.elementId);
        }
        else if(pageRequest.firstVisibleCfi && pageRequest.lastVisibleCfi) {
            var firstPageIndex;
            var lastPageIndex;
            try
            {
                firstPageIndex = _navigationLogic.getPageIndexDeltaForCfi(pageRequest.firstVisibleCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
            }
            catch (e)
            {
                firstPageIndex = 0;
                console.error(e);
            }
            try
            {
                lastPageIndex = _navigationLogic.getPageIndexDeltaForCfi(pageRequest.lastVisibleCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
            }
            catch (e)
            {
                lastPageIndex = 0;
                console.error(e);
            }
            // Go to the page in the middle of the two elements
            pageIndex = _paginationInfo.currentPageIndex + Math.round((firstPageIndex + lastPageIndex) / 2);
        }
        else if(pageRequest.elementCfi) {
            try
            {
                pageIndex = _paginationInfo.currentPageIndex + _navigationLogic.getPageIndexDeltaForCfi(pageRequest.elementCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
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

        if (pageIndex < 0 || pageIndex > _paginationInfo.columnCount) {
            console.log('Illegal pageIndex value: ', pageIndex, 'column count is ', _paginationInfo.columnCount);
            pageIndex = pageIndex < 0 ? 0 : _paginationInfo.columnCount;
        }

        _paginationInfo.currentPageIndex = pageIndex;
        _paginationInfo.currentSpreadIndex = Math.floor(pageIndex / _paginationInfo.visibleColumnCount) ;
        onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        return true;
    }

    this.openPage = function(pageRequest) {
        // Go to request page, it will save the new position in onPaginationChanged
        _openPageInternal(pageRequest);
        // Save it for when pagination is updated
        _lastPageRequest = pageRequest;
    };

    this.resetCurrentPosition = function() {
        _lastPageRequest = undefined;
    };

    this.saveCurrentPosition = function() {
        // If there's a deferred page request, there's no point in saving the current position
        // as it's going to change soon
        if (_deferredPageRequest) {
            return;
        }

        var _firstVisibleCfi = self.getFirstVisibleCfi();
        var _lastVisibleCfi = self.getLastVisibleCfi();
        _lastPageRequest = new PageOpenRequest(_currentSpineItem, self);
        _lastPageRequest.setFirstAndLastVisibleCfi(_firstVisibleCfi.contentCFI, _lastVisibleCfi.contentCFI);
    };

    this.restoreCurrentPosition = function() {
        if (_lastPageRequest) {
            _openPageInternal(_lastPageRequest);
        }
    };

    function redraw() {

        var offsetVal =  -_paginationInfo.pageOffset + "px";

        if (_htmlBodyIsVerticalWritingMode)
        {
            contentDocumentRoot.style.top = offsetVal;
        }
        else
        {
            var ltr = _htmlBodyIsLTRDirection || _htmlBodyIsLTRWritingMode;

            contentDocumentRoot.style.left = ltr ? offsetVal : "";
            contentDocumentRoot.style.right = !ltr ? offsetVal : "";
        }
    }

    function updateViewportSize() {

        if (!contentFrameElement) {
            return;
        }

        var newWidth = contentFrameElement.clientWidth;
        var newHeight = contentFrameElement.clientHeight;

        if (_lastViewPortSize.width !== newWidth || _lastViewPortSize.height !== newHeight) {

            _lastViewPortSize.width = newWidth;
            _lastViewPortSize.height = newHeight;
            return true;
        }

        return false;
    }

    function onPaginationChanged_(initiator, paginationRequest_spineItem, paginationRequest_elementId) {
        _paginationInfo.currentPageIndex = _paginationInfo.currentSpreadIndex * _paginationInfo.visibleColumnCount;
        _paginationInfo.pageOffset = (_paginationInfo.columnWidth + _paginationInfo.columnGap) * _paginationInfo.visibleColumnCount * _paginationInfo.currentSpreadIndex;
        
        redraw();

        _.defer(function () {

            if (_lastPageRequest == undefined) {
                self.saveCurrentPosition();
            }
            
            Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "EMIT", "reflowable_view.js");
            self.emit(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, {
                paginationInfo: self.getPaginationInfo(),
                initiator: initiator,
                spineItem: paginationRequest_spineItem,
                elementId: paginationRequest_elementId
            });
        });
    }
    var onPaginationChanged = _.debounce(onPaginationChanged_, 100);

    this.openPagePrev = function (initiator) {

        if(!_currentSpineItem) {
            return;
        }

        if(_paginationInfo.currentSpreadIndex > 0) {
            // Page will change, the current position is not valid any more
            // Reset it so it's saved next time onPaginationChanged is called
            this.resetCurrentPosition();
            _paginationInfo.currentSpreadIndex--;
            onPaginationChanged(initiator, _currentSpineItem);
        }
        else {

            var prevSpineItem = _spine.prevItem(_currentSpineItem, true);
            if(prevSpineItem) {

                var pageRequest = new PageOpenRequest(prevSpineItem, initiator);
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
            // Page will change, the current position is not valid any more
            // Reset it so it's saved next time onPaginationChanged is called
            this.resetCurrentPosition();
            _paginationInfo.currentSpreadIndex++;
            onPaginationChanged(initiator, _currentSpineItem);
        }
        else {

            var nextSpineItem = _spine.nextItem(_currentSpineItem, true);
            if(nextSpineItem) {

                var pageRequest = new PageOpenRequest(nextSpineItem, initiator);
                pageRequest.setFirstPage();
                self.openPage(pageRequest);
            }
        }
    };


    function updatePagination_() {
        if (!contentDocumentRoot) {
            return;
        }

        var isDoublePageSyntheticSpread = Helpers.deduceSyntheticSpread(viewportElement, _currentSpineItem, _viewSettings);

        // excludes 0 and 1 falsy/truthy values which denote non-forced result
        if (isDoublePageSyntheticSpread === 0)
        {
            var readiumCssPreference = contentWindow.getComputedStyle(contentDocumentRoot).getPropertyValue('--RS__colCount');
            isDoublePageSyntheticSpread = parseInt(readiumCssPreference) === 2;
        }

        if (_htmlBodyIsVerticalWritingMode)
        {
            isDoublePageSyntheticSpread = false;
            _paginationInfo.visibleColumnCount = 1;
// console.debug("Vertical Writing Mode => single CSS column, but behaves as if two-page spread");
        }

        _paginationInfo.visibleColumnCount = isDoublePageSyntheticSpread ? 2 : 1;

        contentDocumentRoot.style.setProperty('--RS__colCount', _paginationInfo.visibleColumnCount);

        updateViewportSize();
       
        // In order for the ResizeSensor to work, the content body needs to be "positioned".
        // This may be an issue since it changes the assumptions some content authors might make when positioning their content.
        contentDocumentBody.style.position = 'relative';

        _paginationInfo.rightToLeft = _spine.isRightToLeft();

        _paginationInfo.columnGap = parseInt(contentWindow.getComputedStyle(contentDocumentRoot).getPropertyValue("column-gap"));

        _paginationInfo.columnWidth = ((_htmlBodyIsVerticalWritingMode ? _lastViewPortSize.height : _lastViewPortSize.width) - _paginationInfo.columnGap * (_paginationInfo.visibleColumnCount - 1)) / _paginationInfo.visibleColumnCount;

        var totalDimension = (_htmlBodyIsVerticalWritingMode ? getScrollRoot().scrollHeight : getScrollRoot().scrollWidth);
        if (totalDimension === 0) {
            console.error("Document dimensions zero?!");
        }

        _paginationInfo.columnCount = (totalDimension + _paginationInfo.columnGap) / (_paginationInfo.columnWidth + _paginationInfo.columnGap);
        _paginationInfo.columnCount = Math.round(_paginationInfo.columnCount);
        if (!_paginationInfo.columnCount) {
            console.error("Column count zero?!");
        }

        _paginationInfo.spreadCount =  Math.ceil(_paginationInfo.columnCount / _paginationInfo.visibleColumnCount);

        if (_paginationInfo.currentSpreadIndex >= _paginationInfo.spreadCount) {
            _paginationInfo.currentSpreadIndex = _paginationInfo.spreadCount - 1;
        }

        if (_deferredPageRequest) {
            //if there is a request for specific page we get here
            openDeferredElement();
        } else {
            // we get here on resizing the viewport
            if (_lastPageRequest) {
                // Make sure we stay on the same page after the content or the viewport 
                // has been resized
                _paginationInfo.currentPageIndex = 0; // current page index is not stable, reset it
                self.restoreCurrentPosition();
            } else {
                onPaginationChanged(self, _currentSpineItem); // => redraw()
            }
        }

        // Only initializes the resize sensor once the content has been paginated once,
        // to avoid the pagination process to trigger a resize event during its first
        // execution, provoking a flicker
        initResizeSensor();
    }
    var updatePagination = _.debounce(updatePagination_, 100);

    function initResizeSensor() {
        var bodyElement = contentDocumentBody;
        if (bodyElement.resizeSensor) {
            return;
        }

        // We need to make sure the content has indeed be resized, especially
        // the first time it is triggered
        _lastBodySize.width = bodyElement.scrollWidth;
        _lastBodySize.height = bodyElement.scrollHeight;

        bodyElement.resizeSensor = new ResizeSensor(bodyElement, function() {
            
            var newBodySize = {
                width: bodyElement.scrollWidth,
                height: bodyElement.scrollHeight
            };

            console.debug("ReflowableView content resized ...", newBodySize.width, newBodySize.height, _currentSpineItem.idref);
            
            if (newBodySize.width != _lastBodySize.width || newBodySize.height != _lastBodySize.height) {
                _lastBodySize.width = newBodySize.width;
                _lastBodySize.height = newBodySize.height;
                
                console.debug("... updating pagination.");

                updatePagination();
            } else {
                console.debug("... ignored (identical dimensions).");
            }
        });
    }

    function hideBook()
    {
        contentDocumentRoot.style.opacity = '0';
    }

    function showBook()
    {
        contentDocumentRoot.style.opacity = '';
    }

    this.getPaginationInfo = function() {

        var paginationInfo = new CurrentPagesInfo(_spine, false);

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

    this.bookmarkCurrentPage = function() {

        if(!_currentSpineItem) {

            return undefined;
        }

        return self.getFirstVisibleCfi();
    };

    this.getLoadedSpineItems = function() {
        return [_currentSpineItem];
    };

    this.getElementByCfi = function(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElementByCfi(cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getElementById = function(spineItemIdref, id) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElementById(id);
    };

    this.getElement = function(spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElement(selector);
    };

    this.getFirstVisibleMediaOverlayElement = function() {

        return _navigationLogic.getFirstVisibleMediaOverlayElement();
    };

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        if(_navigationLogic.isElementVisible(element))
        {
            return;
        }

        var elementCfi = _navigationLogic.getCfiForElement(element);

        if (!elementCfi)
        {
            return;
        }

        var openPageRequest = new PageOpenRequest(_currentSpineItem, initiator);
        openPageRequest.setElementCfi(elementCfi);

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
    };

    this.getVisibleElementsWithFilter = function(filterFunction, includeSpineItem) {

        var elements = _navigationLogic.getVisibleElementsWithFilter(null, filterFunction);

        if (includeSpineItem) {
            return [{elements: elements, spineItem:_currentSpineItem}];
        } else {
            return elements;
        }

    };

    this.getVisibleElements = function(selector, includeSpineItem) {

        var elements = _navigationLogic.getAllVisibleElementsWithSelector(selector);

        if (includeSpineItem) {
            return [{elements: elements, spineItem:_currentSpineItem}];
        } else {
            return elements;
        }

    };

    this.isElementVisible = function ($element) {

        return _navigationLogic.isElementVisible($element);

    };

    this.getElements = function(spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElements(selector);
    };

    this.isNodeFromRangeCfiVisible = function (spineIdref, partialCfi) {
        if (_currentSpineItem.idref === spineIdref) {
            return _navigationLogic.isNodeFromRangeCfiVisible(partialCfi);
        }
        return undefined;
    };

    this.isVisibleSpineItemElementCfi = function (spineIdRef, partialCfi) {
        if (_navigationLogic.isRangeCfi(partialCfi)) {
            return this.isNodeFromRangeCfiVisible(spineIdRef, partialCfi);
        }
        var $elementFromCfi = this.getElementByCfi(spineIdRef, partialCfi);
        return ($elementFromCfi && this.isElementVisible($elementFromCfi));
    };

    this.getNodeRangeInfoFromCfi = function (spineIdRef, partialCfi) {
        if (spineIdRef != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getNodeRangeInfoFromCfi(partialCfi);
    };

    function createBookmarkFromCfi(cfi){
        return new BookmarkData(_currentSpineItem.idref, cfi);
    }

    this.getFirstVisibleCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getFirstVisibleCfi());
    };

    this.getLastVisibleCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getLastVisibleCfi());
    };

    this.getStartCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getStartCfi());
    };

    this.getEndCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getEndCfi());
    };

    this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        if (rangeCfi2 && rangeCfi.idref !== rangeCfi2.idref) {
            console.error("getDomRangeFromRangeCfi: both CFIs must be scoped under the same spineitem idref");
            return undefined;
        }
        return _navigationLogic.getDomRangeFromRangeCfi(rangeCfi.contentCFI, rangeCfi2? rangeCfi2.contentCFI: null, inclusive);
    };

    this.getRangeCfiFromDomRange = function (domRange) {
        return createBookmarkFromCfi(_navigationLogic.getRangeCfiFromDomRange(domRange));
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint) {
        return createBookmarkFromCfi(_navigationLogic.getVisibleCfiFromPoint(x, y, precisePoint));
    };

    this.getRangeCfiFromPoints = function(startX, startY, endX, endY) {
        return createBookmarkFromCfi(_navigationLogic.getRangeCfiFromPoints(startX, startY, endX, endY));
    };

    this.getCfiForElement = function(element) {
        return createBookmarkFromCfi(_navigationLogic.getCfiForElement(element));
    };

    this.getElementFromPoint = function(x, y) {
        return _navigationLogic.getElementFromPoint(x,y);
    };

    this.getNearestCfiFromElement = function(element) {
        return createBookmarkFromCfi(_navigationLogic.getNearestCfiFromElement(element));
    };
};
    return ReflowableView;
});
