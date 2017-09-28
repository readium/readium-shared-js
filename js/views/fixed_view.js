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

define (["../globals", "jquery", "underscore", "eventEmitter", "../models/bookmark_data", "../models/current_pages_info",
    "../models/fixed_page_spread", "./one_page_view", "../models/page_open_request", "../helpers"],
    function(Globals, $, _, EventEmitter, BookmarkData, CurrentPagesInfo,
             Spread, OnePageView, PageOpenRequest, Helpers) {
/**
 * View for rendering fixed layout page spread
 * @param options
 * @param reader
 * @constructor
 */
var FixedView = function(options, reader){

    $.extend(this, new EventEmitter());

    var self = this;

    var _$el;
    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _bookStyles = options.bookStyles;
    var _zoom = options.zoom || {style: 'default'};
    var _currentScale;
    var _iframeLoader = options.iframeLoader;
    var _viewSettings = undefined;

    var _leftPageView = createOnePageView("fixed-page-frame-left");
    var _rightPageView = createOnePageView("fixed-page-frame-right");
    var _centerPageView = createOnePageView("fixed-page-frame-center");

    var _pageViews = [];
    _pageViews.push(_leftPageView);
    _pageViews.push(_rightPageView);
    _pageViews.push(_centerPageView);

    var _spread = new Spread(_spine, false);
    var _bookMargins;
    var _contentMetaSize;
    var _isRedrowing = false;
    var _redrawRequest = false;

    function createOnePageView(elementClass) {

        var pageView = new OnePageView(options,
        [elementClass],
        false, //enableBookStyleOverrides
        reader
        );


        pageView.on(OnePageView.Events.SPINE_ITEM_OPEN_START, function($iframe, spineItem) {
            
            Globals.logEvent("OnePageView.Events.SPINE_ITEM_OPEN_START", "ON", "fixed_view.js [ " + spineItem.href + " ]");

            Globals.logEvent("CONTENT_DOCUMENT_LOAD_START", "EMIT", "fixed_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOAD_START, $iframe, spineItem);
        });

        pageView.on(Globals.Events.CONTENT_DOCUMENT_UNLOADED, function($iframe, spineItem) {

            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "ON", "fixed_view.js [ " + spineItem.href + " ]");

            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "fixed_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, $iframe, spineItem);
        });

        return pageView;
    }

    this.isReflowable = function() {
        return false;
    };

    this.setZoom = function(zoom){
        _zoom = zoom;

        resizeBook(false); 
    }

    this.render = function(){

        var template = Helpers.loadTemplate("fixed_book_frame", {});

        _$el = $(template);

        Helpers.CSSTransition(_$el, "all 0 ease 0");
        
        _$el.css("overflow", "hidden");
        
        // Removed, see one_page_view@render()
        // var settings = reader.viewerSettings();
        // if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
        // {
        //     //defaults
        //     settings = new Globals.Models.ViewerSettings({});
        // }
        // if (settings.enableGPUHardwareAccelerationCSS3D) {
        //
        //     // This fixes rendering issues with WebView (native apps), which crops content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
        //     _$el.css("transform", "translateZ(0)");
        // }
        
        _$viewport.append(_$el);

        self.applyStyles();

        return this;
    };

    this.remove = function() {

        _$el.remove();
    };


    this.setViewSettings = function(settings, docWillChange) {
        
        _viewSettings = settings;
        
        _spread.setSyntheticSpread(Helpers.deduceSyntheticSpread(_$viewport, getFirstVisibleItem(), _viewSettings) == true); // force boolean value (from truthy/falsey return value)

        var views = getDisplayingViews();
        for(var i = 0, count = views.length; i < count; i++) {
            views[i].setViewSettings(settings, docWillChange);
        }
    };

    function getFirstVisibleItem() {

        var visibleItems = _spread.validItems();
        return visibleItems[0];
    }

    function redraw(initiator, paginationRequest) {

        if(_isRedrowing) {
            _redrawRequest = {initiator: initiator, paginationRequest: paginationRequest};
            return;
        }

        _isRedrowing = true;

        var context = {isElementAdded : false};

        var pageLoadDeferrals = createPageLoadDeferrals([
            {pageView: _leftPageView, spineItem: _spread.leftItem, context: context},
            {pageView: _rightPageView, spineItem: _spread.rightItem, context: context},
            {pageView: _centerPageView, spineItem: _spread.centerItem, context: context}]);

        $.when.apply($, pageLoadDeferrals).done(function(){
            _isRedrowing = false;

            if(_redrawRequest) {
                var p1 = _redrawRequest.initiator;
                var p2 = _redrawRequest.paginationRequest;
                _redrawRequest = undefined;
                redraw(p1, p2);
            }
            else {
                
                if(context.isElementAdded) {
                    //self.applyStyles();
                    
                    Helpers.setStyles(_userStyles.getStyles(), _$el.parent());
                    updateBookMargins();
                    // updateContentMetaSize() and resizeBook() are invoked in onPagesLoaded below
                }

                if (paginationRequest)
                {
                    onPagesLoaded(initiator, paginationRequest.spineItem, paginationRequest.elementId)
                }
                else
                {
                    onPagesLoaded(initiator);
                }
            }

        });

    }

    // dir: 0 => new or same page, 1 => previous, 2 => next
    var updatePageSwitchDir = function(dir, hasChanged)
    {
        // irrespective of display state
        if (_leftPageView) _leftPageView.updatePageSwitchDir(dir, hasChanged);
        if (_rightPageView) _rightPageView.updatePageSwitchDir(dir, hasChanged);
        if (_centerPageView) _centerPageView.updatePageSwitchDir(dir, hasChanged);

        // var views = getDisplayingViews();
        // for(var i = 0, count = views.length; i < count; i++) {
        //     views[i].updatePageSwitchDir(dir, hasChanged);
        // }
    };
    

    this.applyStyles = function() {

        Helpers.setStyles(_userStyles.getStyles(), _$el.parent());
        updateBookMargins();
        
        updateContentMetaSize();
        resizeBook();
    };

    this.applyBookStyles = function() {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            views[i].applyBookStyles();
        }
    };

    function createPageLoadDeferrals(viewItemPairs) {

        var pageLoadDeferrals = [];

        for(var i = 0; i < viewItemPairs.length; i++) {

            var dfd = updatePageViewForItem(viewItemPairs[i].pageView, viewItemPairs[i].spineItem, viewItemPairs[i].context);
            pageLoadDeferrals.push(dfd);
        }

        return pageLoadDeferrals;

    }

    function onPagesLoaded(initiator, paginationRequest_spineItem, paginationRequest_elementId) {
        
        updateContentMetaSize();
        resizeBook();
        
        window.setTimeout(function () {
            
            Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "EMIT", "fixed_view.js");
            self.emit(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, {
                paginationInfo: self.getPaginationInfo(),
                initiator: initiator,
                spineItem: paginationRequest_spineItem,
                elementId: paginationRequest_elementId
            });
        }, 60);
        //this delay of 60ms is to ensure that it triggers
        // after any other 10-50ms timers that defer the pagination process in OnePageView
    }

    this.onViewportResize = function() {

        //because change of the viewport orientation can alter pagination behaviour we have to check if
        //visible content stays same

        var firstVisibleItem = getFirstVisibleItem();
        if(!firstVisibleItem) {
            return;
        }

        var isSyntheticSpread = Helpers.deduceSyntheticSpread(_$viewport, firstVisibleItem, _viewSettings) == true; // force boolean value (from truthy/falsey return value)

        if(isSpreadChanged(firstVisibleItem, isSyntheticSpread)) {
            _spread.setSyntheticSpread(isSyntheticSpread);
            var paginationRequest = new PageOpenRequest(firstVisibleItem, self);
            self.openPage(paginationRequest);
        }
        else {
            resizeBook(true);
        }
    };

    function isSpreadChanged(firstVisibleItem, isSyntheticSpread) {

        var tmpSpread = new Spread(_spine, isSyntheticSpread);
        tmpSpread.openItem(firstVisibleItem);

        return _spread.leftItem != tmpSpread.leftItem || _spread.rightItem != tmpSpread.rightItem || _spread.centerItem != tmpSpread.centerItem;
    }

    this.getViewScale = function(){
        return _currentScale;
    };

    function isContentRendered() {

        if(!_contentMetaSize || !_bookMargins) {
            return false;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        return viewportWidth && viewportHeight;
    }

    function resizeBook(viewportIsResizing) {

        updatePageSwitchDir(0, false);
        
        if(!isContentRendered()) {
            return;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        var leftPageMargins = _leftPageView.isDisplaying() ? Helpers.Margins.fromElement(_leftPageView.element()) : Helpers.Margins.empty();
        var rightPageMargins = _rightPageView.isDisplaying() ? Helpers.Margins.fromElement(_rightPageView.element()) : Helpers.Margins.empty();
        var centerPageMargins = _centerPageView.isDisplaying() ? Helpers.Margins.fromElement(_centerPageView.element()) : Helpers.Margins.empty();

        var pageMargins = getMaxPageMargins(leftPageMargins, rightPageMargins, centerPageMargins);

        var potentialTargetElementSize = {   width: viewportWidth - _bookMargins.width(),
                                             height: viewportHeight - _bookMargins.height()};

        var potentialContentSize = {    width: potentialTargetElementSize.width - pageMargins.width(),
                                        height: potentialTargetElementSize.height - pageMargins.height() };

        if(potentialTargetElementSize.width <= 0 || potentialTargetElementSize.height <= 0) {
            return;
        }

        var horScale = potentialContentSize.width / _contentMetaSize.width;
        var verScale = potentialContentSize.height / _contentMetaSize.height;
        
        _$viewport.css("overflow", "auto");
            
        var scale;
        if (_zoom.style == 'fit-width'){
            scale = horScale;
        }
        else if (_zoom.style == 'fit-height'){
            scale = verScale;
        }
        else if (_zoom.style == 'user'){
            scale = _zoom.scale;
        }
        else{
            scale = Math.min(horScale, verScale);

            // no need for pan during "viewport fit" zoom
            _$viewport.css("overflow", "hidden");
        }

        _currentScale = scale;

        var contentSize = { width: _contentMetaSize.width * scale,
                            height: _contentMetaSize.height * scale };

        var targetElementSize = {   width: contentSize.width + pageMargins.width(),
                                    height: contentSize.height + pageMargins.height() };

        var bookSize = {    width: targetElementSize.width + _bookMargins.width(),
                            height: targetElementSize.height + _bookMargins.height() };


        var bookLeft = Math.floor((viewportWidth - bookSize.width) / 2);
        var bookTop = Math.floor((viewportHeight - bookSize.height) / 2);

        if(bookLeft < 0) bookLeft = 0;
        if(bookTop < 0) bookTop = 0;
        
        _$el.css("left", bookLeft + "px");
        _$el.css("top", bookTop + "px");
        _$el.css("width", targetElementSize.width + "px");
        _$el.css("height", targetElementSize.height + "px");

        var left = _bookMargins.padding.left;
        var top = _bookMargins.padding.top;

        var transFunc = viewportIsResizing ? "transformContentImmediate" : "transformContent";

        if(_leftPageView.isDisplaying()) {

             _leftPageView[transFunc](scale, left, top);
        }

        if(_rightPageView.isDisplaying()) {

            left += _contentMetaSize.separatorPosition * scale;

            if(_leftPageView.isDisplaying()) {
                left += leftPageMargins.left;
            }

            _rightPageView[transFunc](scale, left, top);
        }

        if(_centerPageView.isDisplaying()) {

            _centerPageView[transFunc](scale, left, top);
        }
        
        Globals.logEvent("FXL_VIEW_RESIZED", "EMIT", "fixed_view.js");
        self.emit(Globals.Events.FXL_VIEW_RESIZED);
    }

    function getMaxPageMargins(leftPageMargins, rightPageMargins, centerPageMargins) {

         var sumMargin = {
            left: Math.max(leftPageMargins.margin.left, rightPageMargins.margin.left, centerPageMargins.margin.left),
            right: Math.max(leftPageMargins.margin.right, rightPageMargins.margin.right, centerPageMargins.margin.right),
            top: Math.max(leftPageMargins.margin.top, rightPageMargins.margin.top, centerPageMargins.margin.top),
            bottom: Math.max(leftPageMargins.margin.bottom, rightPageMargins.margin.bottom, centerPageMargins.margin.bottom)
        };

        var sumBorder = {
            left: Math.max(leftPageMargins.border.left, rightPageMargins.border.left, centerPageMargins.border.left),
            right: Math.max(leftPageMargins.border.right, rightPageMargins.border.right, centerPageMargins.border.right),
            top: Math.max(leftPageMargins.border.top, rightPageMargins.border.top, centerPageMargins.border.top),
            bottom: Math.max(leftPageMargins.border.bottom, rightPageMargins.border.bottom, centerPageMargins.border.bottom)
        };

        var sumPAdding = {
            left: Math.max(leftPageMargins.padding.left, rightPageMargins.padding.left, centerPageMargins.padding.left),
            right: Math.max(leftPageMargins.padding.right, rightPageMargins.padding.right, centerPageMargins.padding.right),
            top: Math.max(leftPageMargins.padding.top, rightPageMargins.padding.top, centerPageMargins.padding.top),
            bottom: Math.max(leftPageMargins.padding.bottom, rightPageMargins.padding.bottom, centerPageMargins.padding.bottom)
        };

        return new Helpers.Margins(sumMargin, sumBorder, sumPAdding);

    }

    function updateContentMetaSize() {

        _contentMetaSize = {};

        if(_centerPageView.isDisplaying()) {
            _contentMetaSize.width = _centerPageView.meta_width();
            _contentMetaSize.height = _centerPageView.meta_height();
            _contentMetaSize.separatorPosition = 0;
        }
        else if(_leftPageView.isDisplaying() && _rightPageView.isDisplaying()) {
            if(_leftPageView.meta_height() == _rightPageView.meta_height()) {
                _contentMetaSize.width = _leftPageView.meta_width() + _rightPageView.meta_width();
                _contentMetaSize.height = _leftPageView.meta_height();
                _contentMetaSize.separatorPosition = _leftPageView.meta_width();
            }
            else {
                //normalize by height
                _contentMetaSize.width = _leftPageView.meta_width() + _rightPageView.meta_width() * (_leftPageView.meta_height() / _rightPageView.meta_height());
                _contentMetaSize.height = _leftPageView.meta_height();
                _contentMetaSize.separatorPosition = _leftPageView.meta_width();
            }
        }
        else if(_leftPageView.isDisplaying()) {
            _contentMetaSize.width = _leftPageView.meta_width() * 2;
            _contentMetaSize.height = _leftPageView.meta_height();
            _contentMetaSize.separatorPosition = _leftPageView.meta_width();
        }
        else if(_rightPageView.isDisplaying()) {
            _contentMetaSize.width = _rightPageView.meta_width() * 2;
            _contentMetaSize.height = _rightPageView.meta_height();
            _contentMetaSize.separatorPosition = _rightPageView.meta_width();
        }
        else {
            _contentMetaSize = undefined;
        }

    }

    function updateBookMargins() {
        _bookMargins = Helpers.Margins.fromElement(_$el);
    }

    // dir: 0 => new or same page, 1 => previous, 2 => next
    this.openPage =  function(paginationRequest, dir) {

        if(!paginationRequest.spineItem) {
            return;
        }

        var leftItem = _spread.leftItem;
        var rightItem = _spread.rightItem;
        var centerItem = _spread.centerItem;

        var isSyntheticSpread = Helpers.deduceSyntheticSpread(_$viewport, paginationRequest.spineItem, _viewSettings) == true; // force boolean value (from truthy/falsey return value)
        _spread.setSyntheticSpread(isSyntheticSpread);
        _spread.openItem(paginationRequest.spineItem);
        
        var hasChanged = leftItem !== _spread.leftItem || rightItem !== _spread.rightItem || centerItem !== _spread.centerItem;
        
        if (dir === null || typeof dir === "undefined") dir = 0;
        
        updatePageSwitchDir(dir === 0 ? 0 : (_spread.spine.isRightToLeft() ? (dir === 1 ? 2 : 1) : dir), hasChanged);
        
        redraw(paginationRequest.initiator, paginationRequest);
    };


    this.openPagePrev = function(initiator) {

        _spread.openPrev();
        
        updatePageSwitchDir(_spread.spine.isRightToLeft() ? 2 : 1, true);
        
        redraw(initiator, undefined);
    };

    this.openPageNext = function(initiator) {

        _spread.openNext();
        
        updatePageSwitchDir(_spread.spine.isRightToLeft() ? 1 : 2, true);
        
        redraw(initiator, undefined);
    };

    function updatePageViewForItem(pageView, item, context) {

        var dfd = $.Deferred();

        if(!item) {
            if(pageView.isDisplaying()) {
                pageView.remove();
            }

            dfd.resolve();
        }
        else {

            //if(pageView.isDisplaying()) { // always DO (no iframe reuse, as this creates problems with BlobURIs, and navigator history ... just like the reflowable view, we re-create an iframe from the template whenever needed for a new spine item URI)
            pageView.remove();
            
            //if(!pageView.isDisplaying()) { // always TRUE
            _$el.append(pageView.render().element());
            context.isElementAdded = true;
        

            pageView.loadSpineItem(item, function(success, $iframe, spineItem, isNewContentDocumentLoaded, context){

                if(success && isNewContentDocumentLoaded) {

                    //if we a re loading fixed view meta size should be defined
                    if(!pageView.meta_height() || !pageView.meta_width()) {
                        console.error("Invalid document " + spineItem.href + ": viewport is not specified!");
                    }

                    Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "fixed_view.js [ " + spineItem.href + " ]");
                    self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
                }

                dfd.resolve();

            }, context);
        }

        return dfd.promise();
    }

    this.getPaginationInfo = function() {

        var paginationInfo = new CurrentPagesInfo(_spine, true);

        var spreadItems = [_spread.leftItem, _spread.rightItem, _spread.centerItem];

        for(var i = 0; i < spreadItems.length; i++) {

            var spreadItem = spreadItems[i];

            if(spreadItem) {
                paginationInfo.addOpenPage(0, 1, spreadItem.idref, spreadItem.index);
            }
        }

        return paginationInfo;
    };

    this.bookmarkCurrentPage = function() {

        var views = getDisplayingViews();
        var loadedSpineItems = this.getLoadedSpineItems();

        if (views.length > 0) {
            return views[0].getFirstVisibleCfi();
        } else if (loadedSpineItems.length > 0) {
            return new BookmarkData(this.getLoadedSpineItems()[0].idref, null);
        }

        return undefined;
    };

    function getDisplayingViews() {

        var viewsToCheck = [];

        if( _spine.isLeftToRight() ) {
            viewsToCheck = [_leftPageView, _centerPageView, _rightPageView];
        }
        else {
            viewsToCheck = [_rightPageView, _centerPageView, _leftPageView];
        }

        var views = [];

        for(var i = 0, count = viewsToCheck.length; i < count; i++) {
            if(viewsToCheck[i].isDisplaying()) {
                views.push(viewsToCheck[i]);
            }
        }

        return views;
    }

    this.getLoadedSpineItems = function() {

        return _spread.validItems();
    };

    function callOnPageView(spineItemIdref, fn) {
        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.currentSpineItem().idref == spineItemIdref) {
                return fn(view);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    }

    this.getElement = function (spineItemIdref, selector) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElement(spineItemIdref, selector);
        });
    };

    this.getElementById = function (spineItemIdref, id) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElementById(spineItemIdref, id);
        });
    };


    this.getElementByCfi = function(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElementByCfi(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist);
        });
    };
    
    this.getFirstVisibleMediaOverlayElement = function() {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            var el = views[i].getFirstVisibleMediaOverlayElement();
            if (el) return el;
        }

        return undefined;
    };

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        //TODO: during zoom+pan, playing element might not actually be visible

    };
    
    this.getElements = function(spineItemIdref, selector) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElements(spineItemIdref, selector);
        });
    };
    
    this.isElementVisible = function($element){

        //for now we assume that for fixed layouts, elements are always visible
        return true;
    };
    
    this.getVisibleElementsWithFilter = function(filterFunction, includeSpineItems) {

        var elements = [];

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            //for now we assume that for fixed layouts, elements are always visible
            elements.push(views[i].getAllElementsWithFilter(filterFunction, includeSpineItems));
        }

        return elements;
    };

    this.getVisibleElements = function (selector, includeSpineItems) {

        var elements = [];

        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {
            //for now we assume that for fixed layouts, elements are always visible
            if (includeSpineItems) {
                elements.push({elements: views[i].getElements(views[i].currentSpineItem().idref, selector), spineItem: views[i].currentSpineItem()});
            } else {
                elements.push(views[i].getElements(views[i].currentSpineItem().idref, selector));
            }
        }

        return elements;
    };

    this.isElementVisible = function($element){

        //for now we assume that for fixed layouts, elements are always visible
        return true;
    };
    
    this.isVisibleSpineItemElementCfi = function (spineItemIdref, partialCfi) {

        return callOnPageView(spineItemIdref, function (view) {
            //for now we assume that for fixed layouts, everything is always visible
            return true;
        });
    };

    this.getNodeRangeInfoFromCfi = function (spineItemIdref, partialCfi) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getNodeRangeInfoFromCfi(spineItemIdref, partialCfi);
        });
    };


    this.getFirstVisibleCfi = function () {
        var views = getDisplayingViews();
        if (views.length > 0) {
            return views[0].getFirstVisibleCfi();
        }
        return undefined;
    };

    this.getLastVisibleCfi = function () {
        var views = getDisplayingViews();
        if (views.length > 0) {
            return views[views.length - 1].getLastVisibleCfi();
        }
        return undefined;
    };

    this.getDomRangesFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        var views = getDisplayingViews();
        if (rangeCfi2 && rangeCfi.idref !== rangeCfi2.idref) {
            var ranges = [];
            for (var i = 0, count = views.length; i < count; i++) {
                var view = views[i];
                if (view.currentSpineItem().idref === rangeCfi.idref) {
                    var last = view.getLastVisibleCfi();
                    ranges.push(view.getDomRangeFromRangeCfi(rangeCfi.contentCFI, last.contentCFI, inclusive));
                } else if (view.currentSpineItem().idref === rangeCfi2.idref) {
                    var first = view.getFirstVisibleCfi();
                    ranges.push(view.getDomRangeFromRangeCfi(first.contentCFI, rangeCfi2.contentCFI, inclusive));
                }
            }
            return ranges;
        }

        return [this.getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive)];
    },

    this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        var views = getDisplayingViews();
        if (rangeCfi2 && rangeCfi.idref !== rangeCfi2.idref) {
            console.error("getDomRangeFromRangeCfi: both CFIs must be scoped under the same spineitem idref");
            return undefined;
        }
        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.currentSpineItem().idref === rangeCfi.idref) {
                return view.getDomRangeFromRangeCfi(rangeCfi.contentCFI, rangeCfi2 ? rangeCfi2.contentCFI : null, inclusive);
            }
        }

        return undefined;
    };

    this.getRangeCfiFromDomRange = function (domRange) {

        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.getLoadedContentFrames()[0].$iframe[0].contentDocument === domRange.startContainer.ownerDocument) {
                return view.getRangeCfiFromDomRange(domRange);
            }
        }

        return undefined;
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint, spineItemIdref) {
        if (!spineItemIdref) {
            throw new Error("getVisibleCfiFromPoint: Spine item idref must be specified for this fixed layout view.");
        }
        return callOnPageView(spineItemIdref, function (view) {
            return view.getVisibleCfiFromPoint(x,y, precisePoint);
        });
    };

    this.getRangeCfiFromPoints = function (startX, startY, endX, endY, spineItemIdref) {
        if (!spineItemIdref) {
            throw new Error("getRangeCfiFromPoints: Spine item idref must be specified for this fixed layout view.");
        }
        return callOnPageView(spineItemIdref, function (view) {
            return view.getRangeCfiFromPoints(startX, startY, endX, endY);
        });
    };

    this.getCfiForElement = function (element) {

        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.getLoadedContentFrames()[0].$iframe[0].contentDocument === element.ownerDocument) {
                return view.getCfiForElement(element);
            }
        }

        return undefined;
    };

    this.getElementFromPoint = function (x, y, spineItemIdref) {
        if (!spineItemIdref) {
            throw new Error("getElementFromPoint: Spine item idref must be specified for this fixed layout view.");
        }
        return callOnPageView(spineItemIdref, function (view) {
            return view.getElementFromPoint(x,y);
        });
    };

    this.getStartCfi = function () {
        return getDisplayingViews()[0].getStartCfi();
    };

    this.getEndCfi = function () {
        return getDisplayingViews()[0].getEndCfi();
    };

    this.getNearestCfiFromElement = function(element) {
        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.getLoadedContentFrames()[0].$iframe[0].contentDocument === element.ownerDocument) {
                return view.getNearestCfiFromElement(element);
            }
        }

    };

};
    return FixedView;
});
