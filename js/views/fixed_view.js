//  Created by Boris Schneiderman.
//  Copyright (c) 2012-2013 The Readium Foundation.
//
//  The Readium SDK is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*
 * View for rendering fixed layout page spread
 * @class ReadiumSDK.Views.FixedView
 */

ReadiumSDK.Views.FixedView = function(options){

    _.extend(this, Backbone.Events);

    var self = this;

    var _$el;
    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _bookStyles = options.bookStyles;
    var _iframeLoader = options.iframeLoader;
    var _enablePageTransitions = options.enablePageTransitions;

    var _leftPageView = createOnePageView("fixed-page-frame-left", "right");
    var _rightPageView = createOnePageView("fixed-page-frame-right", "left");
    var _centerPageView = createOnePageView("fixed-page-frame-center", "center");

    var _pageViews = [];
    _pageViews.push(_leftPageView);
    _pageViews.push(_rightPageView);
    _pageViews.push(_centerPageView);

    var _spread = new ReadiumSDK.Models.Spread(_spine, ReadiumSDK.Helpers.getOrientation(_$viewport));
    var _bookMargins;
    var _contentMetaSize;

    function createOnePageView(cssclass, contentAlignment) {

        var pageView = new ReadiumSDK.Views.OnePageView({

            iframeLoader: _iframeLoader,
            spine: _spine,
            bookStyles: _bookStyles,
            class: cssclass,
            contentAlignment: contentAlignment,
            enablePageTransitions: _enablePageTransitions
        });

        pageView.on(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPEN_START, function($iframe, spineItem) {

            self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOAD_START, $iframe, spineItem);
        });


        return pageView;
    }

    this.isReflowable = function() {
        return false;
    };

    this.render = function(){

        var template = ReadiumSDK.Helpers.loadTemplate("fixed_book_frame", {});

        _$el = $(template);
        _$el.css("-webkit-transition", "all 0 ease 0");
        _$el.css("overflow", "hidden");
        
        _$viewport.append(_$el);

        self.applyStyles();

        //event with namespace for clean unbinding
        $(window).on("resize.ReadiumSDK.readerView", _.bind(self.onViewportResize, self));


        return this;
    };

    this.remove = function() {

        $(window).off("resize.ReadiumSDK.readerView");
        _$el.remove();
    };

    this.setViewSettings = function(settings) {
        _spread.setSyntheticSpread(settings.isSyntheticSpread);
    };

    function redraw(initiator, paginationRequest) {

        var context = {isElementAdded : false};
        var pageLoadDeferrals = createPageLoadDeferrals([{pageView: _leftPageView, spineItem: _spread.leftItem, context: context},
                                                              {pageView: _rightPageView, spineItem: _spread.rightItem, context: context},
                                                              {pageView: _centerPageView, spineItem: _spread.centerItem, context: context}]);
        if(pageLoadDeferrals.length > 0) {

            $.when.apply($, pageLoadDeferrals).done(function(){
                if(context.isElementAdded) {
                    self.applyStyles();
                }

                if (paginationRequest)
                {
                    onPagesLoaded(initiator, paginationRequest.spineItem, paginationRequest.elementId)
                }
                else
                {
                    onPagesLoaded(initiator);
                }
            });
        }
    }

    var updatePageSwitchDir = function(dir, hasChanged)
    {
// console.error("updatePageSwitchDir");
// console.log(dir);
// console.log(hasChanged);
// 
        // irrespective of display state
        if (_leftPageView) _leftPageView.pageSwitchDir(dir, hasChanged);
        if (_rightPageView) _rightPageView.pageSwitchDir(dir, hasChanged);
        if (_centerPageView) _centerPageView.pageSwitchDir(dir, hasChanged);

        // var views = getDisplayingViews();
        // for(var i = 0, count = views.length; i < count; i++) {
        //     views[i].pageSwitchDir(dir, hasChanged);
        // }
    };
    

    this.applyStyles = function() {

        ReadiumSDK.Helpers.setStyles(_userStyles.getStyles(), _$el.parent());

        updateBookMargins();
        updateContentMetaSize();

        updatePageSwitchDir(0, false);
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
            if(dfd) {
                pageLoadDeferrals.push(dfd);
            }

        }

        return pageLoadDeferrals;

    }

    function onPagesLoaded(initiator, paginationRequest_spineItem, paginationRequest_elementId) {

        updateContentMetaSize();
        resizeBook();

        self.trigger(ReadiumSDK.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, { paginationInfo: self.getPaginationInfo(), initiator: initiator, spineItem: paginationRequest_spineItem, elementId: paginationRequest_elementId } );
    }

    this.onViewportResize = function() {

        //because change of the viewport orientation can alter pagination behaviour we have to check if
        //visible content stays same
        var newOrientation = ReadiumSDK.Helpers.getOrientation(_$viewport);
        if(!newOrientation) {
            return;
        }

        var spreadChanged = false;
        var itemToDisplay = undefined;
        if(_spread.orientation != newOrientation) {

            var newPageSpread = new ReadiumSDK.Models.Spread(_spine, newOrientation);

            var visibleItems = _spread.validItems();
            if(visibleItems.length > 0) {
                newPageSpread.openItem(visibleItems[0]);
            }

            spreadChanged = (  _spread.leftItem != newPageSpread.leftItem
                            || _spread.rightItem != newPageSpread.rightItem
                            || _spread.centerItem != newPageSpread.centerItem );

            _spread.orientation = newOrientation;
        }

        if(spreadChanged) {
            itemToDisplay = _spread.validItems()[0];
            if(itemToDisplay) {
                var paginationRequest = new ReadiumSDK.Models.PageOpenRequest(itemToDisplay, self);
                self.openPage(paginationRequest);
            }
        }
        else {
            updatePageSwitchDir(0, false);
            resizeBook(true);
        }
    };

    //event with namespace for clean unbinding
    $(window).on("resize.ReadiumSDK.readerView", _.bind(self.onViewportResize, self));

    function isContentRendered() {

        if(!_contentMetaSize || !_bookMargins) {
            return false;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        return viewportWidth && viewportHeight;
    }

    function resizeBook(viewportIsResizing) {

        if(!isContentRendered()) {
            return;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        var leftPageMargins = _leftPageView.isDisplaying() ? ReadiumSDK.Helpers.Margins.fromElement(_leftPageView.element()) : ReadiumSDK.Helpers.Margins.empty();
        var rightPageMargins = _rightPageView.isDisplaying() ? ReadiumSDK.Helpers.Margins.fromElement(_rightPageView.element()) : ReadiumSDK.Helpers.Margins.empty();
        var centerPageMargins = _centerPageView.isDisplaying() ? ReadiumSDK.Helpers.Margins.fromElement(_centerPageView.element()) : ReadiumSDK.Helpers.Margins.empty();

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

        var scale = Math.min(horScale, verScale);

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

        return new ReadiumSDK.Helpers.Margins(sumMargin, sumBorder, sumPAdding);

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
        _bookMargins = ReadiumSDK.Helpers.Margins.fromElement(_$el);
    }

    this.openPage =  function(paginationRequest, dir) {

        if(!paginationRequest.spineItem) {
            return;
        }

        var leftItem = _spread.leftItem;
        var rightItem = _spread.rightItem;
        var centerItem = _spread.centerItem;
        
        _spread.openItem(paginationRequest.spineItem);
        
        var hasChanged = leftItem !== _spread.leftItem || rightItem !== _spread.rightItem || centerItem !== _spread.centerItem;
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

        if(!item) {
            if(pageView.isDisplaying()) {
                pageView.remove();
            }

            return undefined;
        }

        if(!pageView.isDisplaying()) {

            _$el.append(pageView.render().element());

            context.isElementAdded = true;
        }

        var dfd = $.Deferred();

        pageView.on(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED, function($iframe, spineItem, isNewContentDocumentLoaded){

            pageView.off(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED);

            if(isNewContentDocumentLoaded) {
                self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
            }

            dfd.resolve();
        });

        pageView.loadSpineItem(item);

        return dfd.promise();

    }

    this.getPaginationInfo = function() {

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(_spine.items.length, true, _spine.direction);

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

        if(views.length > 0) {

            var idref = views[0].currentSpineItem().idref;
            var cfi = views[0].getFirstVisibleElementCfi();

            if(cfi == undefined) {
                cfi = "";
            }

            return new ReadiumSDK.Models.BookmarkData(idref, cfi);
        }

        return new ReadiumSDK.Models.BookmarkData("", "");
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

    this.getElement = function(spineItem, selector) {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if(view.currentSpineItem() == spineItem) {
                return view.getElement(spineItem, selector);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    };

    this.getElementById = function(spineItem, id) {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if(view.currentSpineItem() == spineItem) {
                return view.getElementById(spineItem, id);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    };
    
    this.getElementByCfi = function(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if(view.currentSpineItem() == spineItem) {
                return view.getElementByCfi(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    };

    this.getFirstVisibleMediaOverlayElement = function() {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            var el = views[i].getFirstVisibleMediaOverlayElement();
            if (el) return el;
        }

        return undefined;
    };

    this.insureElementVisibility = function(element, initiator) {

        //for now we assume that for fixed layout element is always visible

    }

};