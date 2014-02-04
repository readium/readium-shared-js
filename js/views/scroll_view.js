//  Created by Boris Schneiderman.
// Modified by Daniel Weck
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

ReadiumSDK.Views.ScrollView = function(options, isContinuousScroll){

    _.extend(this, Backbone.Events);

    var SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE = 5;

    var self = this;

    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _isWaitingFramesLoad = false;
    var _deferredPageRequest;
    var _$contentFrame;
    var _$el;

    var _firePageChangeOnScroll = true;

    this.isContinuousScroll = function() {
        return isContinuousScroll;
    };

    this.render = function(){

        var template = ReadiumSDK.Helpers.loadTemplate("scrolled_book_frame", {});

        _$el = $(template);
        _$viewport.append(_$el);

        _$contentFrame = $("#scrolled-content-frame", _$el);
        _$contentFrame.css("overflow", "");
        _$contentFrame.css("overflow-y", "auto");
        _$contentFrame.css("overflow-x", "hidden");
        _$contentFrame.css("-webkit-overflow-scrolling", "touch");
        _$contentFrame.css("width", "100%");
        _$contentFrame.css("height", "100%");

        self.applyStyles();

        if(isContinuousScroll) {
            loadSpineItems(_spine.items, onPagesLoaded);
        }

        var lazyScroll = _.debounce(onScroll, 100);

        _$contentFrame.scroll(function(){
            lazyScroll();
        });

        return self;
    };

    function onScroll() {

        if(_firePageChangeOnScroll) {
            onPaginationChanged(self);
        }
    }

    function loadSpineItems(spineItemsToLoad, callBack) {

        if(!isContinuousScroll) {
            _$contentFrame.empty();
        }

        var promises = [];

        for(var i = 0, count = spineItemsToLoad.length; i < count; i++) {
            promises.push(createPageViewForSpineItem(spineItemsToLoad[i]));
        }

        $.when.apply($, promises).done(function() {
            callBack();
        });
    }


    function setFrameSizesToRectangle(rectangle) {
        _$contentFrame.css("left", rectangle.left);
        _$contentFrame.css("top", rectangle.top);
        _$contentFrame.css("right", rectangle.right);
        _$contentFrame.css("bottom", rectangle.bottom);

    }

    this.remove = function() {

          _$el.remove();
    };

    this.onViewportResize = function() {

        if(!_$contentFrame) {
            return;
        }

        forEachItemView(resizePageView);
        onPaginationChanged(self);
    };

    this.setViewSettings = function(settings) {

    };


    function createPageViewForSpineItem(spineItemToLoad) {

        var pageView = new ReadiumSDK.Views.OnePageView(options);
        var $elem = pageView.render().element();
        $elem.data("pageView", pageView);

        insertPageView(pageView, spineItemToLoad.index);

        var dfd = $.Deferred();

        pageView.on(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED, function($iframe, spineItem, isNewContentDocumentLoaded){

            pageView.off(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED);

            if(isNewContentDocumentLoaded) {
                self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);

                if(spineItem.isFixedLayout()) {
                    pageView.scaleToWidth(_$contentFrame.width());
                }
                else {
                    pageView.resizeIFrameToContent();
                }
            }

            dfd.resolve();
        });

        pageView.loadSpineItem(spineItemToLoad);

        return dfd.promise();
    }

    function findPageViewForSpineItem(spineItem) {

        var pageNodes = _$contentFrame.children();

        for(var i = 0, count = pageNodes.length; i < count; i++) {

            var $element = pageNodes.eq(i);
            var curView = $element.data("pageView");

            if(curView.currentSpineItem() == spineItem) {
                 return curView;
            }
        }

        return undefined;
    }

    function insertPageView(pageView, index) {

        var pageNodes = _$contentFrame.children();

        for(var i = 0, count = pageNodes.length; i < count; i++) {

            var $element = pageNodes.eq(i);
            var curView = $element.data("pageView");

            if(index < curView.currentSpineItem().index) {
                pageView.element().insertBefore($element);
                return;
            }
        }

        _$contentFrame.append(pageView.element());
    }

    function forEachItemView(func) {

        var pageNodes = _$contentFrame.children();

        for(var i = 0, count = pageNodes.length; i < count; i++) {

            var $element = pageNodes.eq(i);
            var curView = $element.data("pageView");

            if(func(curView) === false) {
                return;
            }
        }

    }

    function resizePageView(pageView) {

        if(pageView.currentSpineItem().isFixedLayout()) {
            pageView.scaleToWidth(_$contentFrame.width());
        }
        else {
            pageView.resizeIFrameToContent();
        }
    }


    function onPagesLoaded() {

        _isWaitingFramesLoad = false;

        //while we where loading frames new request came
        if(_deferredPageRequest && _deferredPageRequest.spineItem) {
            var loadedView = findPageViewForSpineItem(_deferredPageRequest.spineItem);

            if(!loadedView) {
                loadSpineItems([_deferredPageRequest.spineItem], onPagesLoaded);
                return;
            }
        }

        setTimeout(function(){
            openDeferredElement();
        }, 50);
    }


    function openDeferredElement() {

        if(!_deferredPageRequest) {
            return;
        }

        var deferredData = _deferredPageRequest;
        _deferredPageRequest = undefined;
        self.openPage(deferredData);
    }

    this.applyStyles = function() {

        ReadiumSDK.Helpers.setStyles(_userStyles.getStyles(), _$el.parent());

        //because left, top, bottom, right setting ignores padding of parent container
        //we have to take it to account manually
        var elementMargins = ReadiumSDK.Helpers.Margins.fromElement(_$el);
        setFrameSizesToRectangle(elementMargins.padding);

    };

    this.applyBookStyles = function() {

        forEachItemView(function(pageView) {
            pageView.applyBookStyles();
        });
     };


    this.openPage = function(pageRequest) {

        if(_isWaitingFramesLoad) {
            _deferredPageRequest = pageRequest;
            return;
        }

        var pageView;

        // if no spine item specified we are talking about current spine item
        if(pageRequest.spineItem) {

            pageView = findPageViewForSpineItem(pageRequest.spineItem);

            if(!pageView) {

                _deferredPageRequest = pageRequest;
                loadSpineItems([pageRequest.spineItem], onPagesLoaded);
                return;
            }
        }

        var topOffset = 0;
        var pageCount;
        var $element;
        var navigator;

        if(pageRequest.scrollTop !== undefined) {

            topOffset = pageRequest.scrollTop;
        }
        else if(pageRequest.spineItemPageIndex !== undefined) {

            var pageIndex;
            pageCount = calculatePageCount();
            if(pageRequest.spineItemPageIndex < 0) {
                pageIndex = 0;
            }
            else if(pageRequest.spineItemPageIndex >= pageCount) {
                pageIndex = pageCount - 1;
            }
            else {
                pageIndex = pageRequest.spineItemPageIndex;
            }

            topOffset = pageIndex * viewHeight();
        }
        else if(pageRequest.elementId) {

            navigator = pageView.getNavigator();
            $element = navigator.getElementBuyId(pageRequest.elementId);

            if(!$element) {
                console.warn("Element id=" + pageRequest.elementId + " not found!");
                return;
            }

            topOffset = navigator.getVerticalOffsetForElement($element) + pageView.element().position().top;
        }
        else if(pageRequest.elementCfi) {

            navigator = pageView.getNavigator();
            $element = navigator.getElementByCfi(pageRequest.elementCfi);

            if(!$element) {
                console.warn("Element cfi=" + pageRequest.elementCfi + " not found!");
                return;
            }

            topOffset = navigator.getVerticalOffsetForElement($element) + pageView.element().position().top;
        }
        else if(pageRequest.firstPage) {

            topOffset = 0;
        }
        else if(pageRequest.lastPage) {
            pageCount = calculatePageCount();

            if(pageCount === 0) {
                return;
            }

            topOffset = scrollHeight() - viewHeight() - 5;
        }
        else {
            console.debug("No criteria in pageRequest");
        }

        if(scrollTop() != topOffset ) {
            scrollTo(topOffset, pageRequest);
        }
        else {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    };

    function scrollTo(offset, pageRequest) {

        _firePageChangeOnScroll = false;
        _$contentFrame.animate({
            scrollTop: offset
        }, 50, undefined, function(){
            _firePageChangeOnScroll = true;
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        });
    }

    function calculatePageCount() {

        return Math.ceil(scrollHeight() / viewHeight());
    }

    function onPaginationChanged(initiator, paginationRequest_spineItem, paginationRequest_elementId) {

        self.trigger(ReadiumSDK.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, { paginationInfo: self.getPaginationInfo(), initiator: initiator, spineItem: paginationRequest_spineItem, elementId: paginationRequest_elementId } );
    }

    function scrollTop() {
        return  _$contentFrame.scrollTop()
    }

    function scrollBottom() {
        return scrollHeight() - (scrollTop() + viewHeight());
    }

    function getCurrentPageIndex() {

        return Math.ceil(scrollTop() / _$contentFrame.height());
    }

    function viewHeight() {
        return _$contentFrame.height();
    }

    function scrollHeight() {
        return _$contentFrame[0].scrollHeight;
    }

    this.openPageNext = function (initiator) {

        var pageRequest;

        if(scrollBottom() > 0) {

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(undefined, initiator);
            pageRequest.scrollTop = scrollTop() + Math.min(scrollBottom(), viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        }
        else {

            var pageView = getLastVisiblePageView();
            var nextSpineItem = _spine.nextItem(pageView.currentSpineItem());
            if(nextSpineItem) {

                pageRequest = new ReadiumSDK.Models.PageOpenRequest(nextSpineItem, initiator);
                pageRequest.scrollTop = 0;
            }
        }

        if(pageRequest) {
            self.openPage(pageRequest);
        }
    };


    this.openPagePrev = function (initiator) {

        var pageRequest;

        if(scrollTop() > 0) {

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(undefined, initiator);
            pageRequest.scrollTop = scrollTop() - (viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);
            if(pageRequest.scrollTop < 0) {
                pageRequest.scrollTop = 0;
            }

        }
        else {

            var pageView = getFirstVisiblePageView();
            var prevSpineItem = _spine.prevItem(pageView.currentSpineItem());
            if(prevSpineItem) {

                pageRequest = new ReadiumSDK.Models.PageOpenRequest(prevSpineItem, initiator);
                pageRequest.scrollTop = scrollHeight() - viewHeight();
            }
        }

        if(pageRequest) {
            self.openPage(pageRequest);
        }
    };


    function getLastVisiblePageView() {

        var visiblePageView = undefined;

        var range  = getVisibleRange(SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        forEachItemView(function(pageView){

            if( isPageViewVisibleInRange(pageView, range) ) {

                visiblePageView = pageView;
            }
            else if(visiblePageView) {
                return false;
            }

            return true;

        });

        return visiblePageView;
    }

    function getFirstVisiblePageView() {

        var visiblePageView = undefined;

        var range  = getVisibleRange(SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        forEachItemView(function(pageView){

            if( isPageViewVisibleInRange(pageView, range) ) {

                visiblePageView = pageView;
                return false;
            }

            return true;
        });

        return visiblePageView;
    }

    function isPageViewVisibleInRange(pageView, range) {

        var pageViewRange = getPageViewRange(pageView);
        return rangeLength(intersectRanges(pageViewRange, range)) > 0;
    }

    function getPageViewRange(pageView) {

        var range = {top: 0, bottom: 0};

        range.top = pageView.element().position().top + scrollTop();
        range.bottom = range.top + pageView.element().height();

        return range;
    }


    this.getFirstVisibleElementCfi = function() {

        var visibleViewPage = getFirstVisiblePageView();
        if(visibleViewPage) {
            return visibleViewPage.getNavigator().getFirstVisibleElementCfi(scrollTop());
        }

        return undefined;
    };

    this.getPaginationInfo = function() {

        var pageView = getFirstVisiblePageView();

        var isFixedLayout = pageView ? pageView.currentSpineItem().isFixedLayout() : false;

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(_spine.items.length, isFixedLayout, _spine.direction);

        if(!pageView) {
            return paginationInfo;
        }

        var spineItem = pageView.currentSpineItem();
        var pageInx = getCurrentPageIndex();
        paginationInfo.addOpenPage(pageInx, calculatePageCount(), spineItem.idref, spineItem.index);

        return paginationInfo;
    };


    this.bookmarkCurrentPage = function() {

        var pageView = getFirstVisiblePageView();

        if(!pageView) {

            return new ReadiumSDK.Models.BookmarkData("", "");
        }

        return new ReadiumSDK.Models.BookmarkData(pageView.currentSpineItem().idref, self.getFirstVisibleElementCfi());
    };


    this.getLoadedSpineItems = function() {

        var spineItems = [];

        forEachItemView(function(pageView){
            spineItems.push(pageView.currentSpineItem());
        });

        return spineItems;
    };

    this.getElement = function(spineItem, selector) {

        var element = undefined;

        forEachItemView(function(pageView){

            if(pageView.currentSpineItem() == spineItem) {

                element = pageView.getNavigator().getElement(selector);

                return false;
            }

            return true;

        });

        return element;
    };

    this.getVisibleMediaOverlayElements = function() {

        var range = getVisibleRange(SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        var moElements = [];

        forEachItemView(function(pageView){

            if(isPageViewVisibleInRange(pageView, range)){

                moElements.push.apply(moElements, pageView.getNavigator().getVisibleMediaOverlayElements(range));
            }

        });

        return moElements;
    };

    function getVisibleRange(expand) {

        return {

            top: scrollTop() + expand,
            bottom: scrollTop() + viewHeight() - expand
        }
    }

    function intersectRanges(r1, r2) {

        return {

            top: Math.max(r1.top, r2.top),
            bottom: Math.min(r1.bottom, r2.bottom)
        };
    }

    function rangeLength(range) {
        if(range.bottom < range.top) {
            return 0;
        }

        return range.bottom - range.top;
    }

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        var pageView = undefined;

        forEachItemView(function(pv){

            if(pv.currentSpineItem().idref === spineItemId) {

                pageView = pv;
                return false;
            }

            return true;
        });

        if(!pageView) {
            console.warn("Page for element " + element + " not found");
            return;
        }

        var $element = $(element);

        var visibleRange = getVisibleRange(0);
        var pageRange = getPageViewRange(pageView);

        var elementRange = {top:0, bottom:0};
        elementRange.top = $element.offset().top + pageRange.top;
        elementRange.bottom = elementRange.top + $element.height();

        var smallestVisibleLength = Math.min(rangeLength(visibleRange), rangeLength(elementRange));

        var intersectionRange = intersectRanges(visibleRange, elementRange);

        var visiblePercent = (rangeLength(intersectionRange) / smallestVisibleLength) * 100;

        // if element less than 60 % visible
        if(visiblePercent < 60 ) {

            var spineItem = _spine.getItemById(spineItemId);
            var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
            openPageRequest.scrollTop = elementRange.top;
            self.openPage(openPageRequest);
        }

    }

};
