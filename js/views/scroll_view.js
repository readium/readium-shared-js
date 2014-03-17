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
    var ITEM_LOAD_SCROLL_BUFFER = 1000;

    var self = this;

    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _isWaitingFramesLoad = false;
    var _deferredPageRequest;
    var _$contentFrame;
    var _$el;

    var _lastScrollPos;

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
        _$contentFrame.css("position", "relative");


        self.applyStyles();

        var lazyScroll = _.debounce(onScroll, 100);

        _$contentFrame.scroll(function(){
            lazyScroll();
        });

        _lastScrollPos = scrollTop();

        return self;
    };

    function shouldAddToTopOf() {

        if(!isContinuousScroll) {
            return undefined;
        }

        var viewPage = firstLoadedView();
        if(!viewPage) {
            return undefined
        }

        if(_spine.isFirstItem(viewPage.currentSpineItem)) {
            return undefined;
        }

        if(_$contentFrame.scrollTop < ITEM_LOAD_SCROLL_BUFFER) {
            return viewPage;
        }

        return undefined;
    }

    function shouldAddToBottomOf() {

        if(!isContinuousScroll) {
            return undefined;
        }

        var viewPage = lastLoadedView();
        if(!viewPage) {
            return undefined
        }

        if(_spine.isLastItem(viewPage.currentSpineItem())) {
            return undefined;
        }

        if((_$contentFrame[0].scrollHeight - _$contentFrame.scrollTop) < ITEM_LOAD_SCROLL_BUFFER) {
            return viewPage;
        }

        return undefined;
    }

    function updateLoadedViewsTop() {

        var firstLoadedItem = shouldAddToTopOf();

        if(firstLoadedItem) {
            addToTopOf(firstLoadedItem);
        }
    }

    function updateLoadedViewsBottom() {

        var lastLoadedView = shouldAddToBottomOf();

        if(lastLoadedView) {
            addToBottomOf(lastLoadedView);
        }
    }

    function onScroll() {

        var newScrollPos = scrollTop();

        if(newScrollPos > _lastScrollPos) { //scrolling down
            updateLoadedViewsBottom();
            updateLoadedViewsTop();
        }
        else { //scrolling up
            updateLoadedViewsTop();
            updateLoadedViewsBottom();
        }

        _lastScrollPos = newScrollPos;

        if(_firePageChangeOnScroll) {
            onPaginationChanged(self);
        }

    }

    function addToTopOf(topView) {

        var prevSpineItem = _spine.prevItem(topView.currentSpineItem());
        var newView = createPageViewForSpineItem(prevSpineItem);
        topView.element().insertBefore(newView.element());

        newView.load(function(wasResized){
               if(wasResized) {
                   console.log("--- loaded spineItem: " + newView.currentSpineItem().href);
                   scrollTo(scrollTop() +  newView.elementHeight());
               }
        });
    }

    function addToBottomOf(bottomView) {

        var nexSpineItem = _spine.nextItem(bottomView.currentSpineItem());
        var newView = createPageViewForSpineItem(nexSpineItem);
        bottomView.element().insertAfter(newView.element());

        newView.load(function(wasResized) {

            if(wasResized) {
                console.log("--- loaded spineItem: " + newView.currentSpineItem().href);
            }
        });
    }

    function removeLoadedItems() {

        var loadedPageViews = [];

        forEachItemView(function(pageView) {
            loadedPageViews.push(pageView);
        }, false);

        for(var i = 0, count = loadedPageViews.length; i < count; i++) {
            removePageView(loadedPageViews[i]);
        }
    }

    function removePageView(pageView) {

        pageView.off(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED);
        pageView.element().remove();
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

        forEachItemView(function(pageView){
            pageView.updateSize();
        }, false);

        onPaginationChanged(self);
    };

    this.setViewSettings = function(settings) {

        forEachItemView(function(pageView){

            pageView.setViewSettings(settings);

        }, false);

    };

    function createPageViewForSpineItem(spineItem) {

        var pageView = new ReadiumSDK.Views.OnePageViewProxy(spineItem, _$contentFrame, options, ["content-doc-frame"]);
        var $elem = pageView.render().element();
        $elem.data("pageView", pageView);

        pageView.on(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED, function($iframe, spineItem, isNewContentDocumentLoaded){

            if(isNewContentDocumentLoaded) {
                self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
            }

        });

        return pageView;
    }

    function findPageViewForSpineItem(spineItem) {

        var retView = undefined;

        forEachItemView(function(pageView) {

            if(pageView.currentSpineItem() == spineItem) {
                retView = pageView;
                //brake the iteration
                return false;
            }
            else {
                return true;
            }

        }, false);

        return retView;
    }

    function forEachItemView(func, reverse) {

        var pageNodes = _$contentFrame.children();

        var count = pageNodes.length;
        var iter = reverse ? function(ix) { return ix - 1}
                           : function(ix) { return ix + 1};

        var compare = reverse ? function(ix) { return ix >= 0}
                              : function(ix) { return ix < count };

        var start = reverse ? count - 1 : 0;

        for(var i = start; compare(i); i = iter(i)) {

            var $element = pageNodes.eq(i);
            var curView = $element.data("pageView");

            if(curView) {

                if(func(curView) === false) {
                    return;
                }
            }
        }
    }

    function firstLoadedView() {

        var firstView = undefined;

        forEachItemView(function(pageView) {

            firstView = pageView;
            return false;

        }, false);

        return firstView;
    }

    function lastLoadedView() {

        var lastView = undefined;

        forEachItemView(function(pageView) {

            lastView = pageView;
            return false;

        }, true);

        return lastView;
    }

    function onSpineItemLoaded(sucsess, pageView) {

        if(!_deferredPageRequest) {
            return;
        }

        if(pageView.currentSpineItem() !== _deferredPageRequest.spineItem) {
            return;
        }

        var pageRequest = _deferredPageRequest;
        _deferredPageRequest = undefined;

        if(sucsess) {
            setTimeout(function(){
                openPageViewElement(pageView, pageRequest);
            }, 50);
        }
    }

    function loadSpineItem(spineItem) {

        if(!isContinuousScroll) {
            removeLoadedItems();
        }

        var loadedView = findPageViewForSpineItem(spineItem);

        if(!loadedView) {
            loadedView = createPageViewsForItems([spineItem]);
        }

        _isWaitingFramesLoad = true;
        loadedView.load(function(sucsess){
            _isWaitingFramesLoad = false;
            onSpineItemLoaded(sucsess, loadedView);
        });
    }

    function createPageViewsForItems(spineItems) {

        for(var i = 0, count = spineItems.length; i < count; i++) {
            createPageViewForSpineItem(spineItems[i]);
        }

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
        }, false);
     };


    this.openPage = function(pageRequest) {

        _deferredPageRequest = pageRequest;

        if(!_isWaitingFramesLoad) {
            loadSpineItem(pageRequest.spineItem);
        }
    };

    function openPageViewElement(pageView, pageRequest) {

        var topOffset = 0;
        var pageCount;
        var $element;
        var navigator;
        var pageRange;

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

            pageRange = getPageViewRange(pageView);
            navigator = pageView.getNavigator();
            $element = navigator.getElementBuyId(pageRequest.elementId);

            if(!$element) {
                console.warn("Element id=" + pageRequest.elementId + " not found!");
                return;
            }

            topOffset = navigator.getVerticalOffsetForElement($element) + pageRange.top;
        }
        else if(pageRequest.elementCfi) {

            pageRange = getPageViewRange(pageView);
            navigator = pageView.getNavigator();
            $element = navigator.getElementByCfi(pageRequest.elementCfi);

            if(!$element) {
                console.warn("Element cfi=" + pageRequest.elementCfi + " not found!");
                return;
            }

            topOffset = navigator.getVerticalOffsetForElement($element) + pageRange.top;
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
            pageRange = getPageViewRange(pageView);
            topOffset = pageRange.top;
        }

        if(scrollTop() != topOffset ) {
            scrollTo(topOffset, pageRequest);
        }
        else {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    }

    function scrollTo(offset, pageRequest) {

        _$contentFrame.scrollTop = offset;

        _firePageChangeOnScroll = true;
        if(pageRequest) {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }

//        console.log("---- scrollTo:" + offset);
//
//        _firePageChangeOnScroll = false;
//
//        _$contentFrame.animate({
//            scrollTop: offset
//        }, 10, undefined, function() {
//            _firePageChangeOnScroll = true;
//            if(pageRequest) {
//                onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
//            }
//        });
    }

    function calculatePageCount() {

        return Math.ceil(scrollHeight() / viewHeight());
    }



    function onPaginationChanged(initiator, paginationRequest_spineItem, paginationRequest_elementId) {
        console.log("----- onPaginationChanged");
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

    function getVisiblePageViews() {

        var views = [];

        var range  = getVisibleRange(-SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        forEachItemView(function(pageView){

            if( isPageViewVisibleInRange(pageView, range) ) {

                views.push(pageView);
            }
            else if(views.length > 0) {

                return false;
            }

            return true;

        }, false);

        return views;

    }

    function getLastVisiblePageView() {

        var visibleViews = getVisiblePageViews();

        return visibleViews[visibleViews.length - 1];
    }

    function getFirstVisiblePageView() {

        var visibleViews = getVisiblePageViews();

        return visibleViews[0];
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
        }, false);

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

        }, false);

        return element;
    };

    this.getVisibleMediaOverlayElements = function() {

        var viewPortRange = getVisibleRange();

        var pageMoElements;
        var moElements = [];
        var normalizedRange = {top: 0, bottom: 0};
        var pageViewRange;

        forEachItemView(function(pageView){

            pageViewRange = getPageViewRange(pageView);

            normalizedRange.top = Math.max(pageViewRange.top, viewPortRange.top) - pageViewRange.top;
            normalizedRange.bottom = Math.min(pageViewRange.bottom, viewPortRange.bottom) - pageViewRange.top;

            if(rangeLength(normalizedRange) > 0) {
                pageMoElements = pageView.getNavigator().getVisibleMediaOverlayElements(normalizedRange);
                moElements.push.apply(moElements, pageMoElements);
            }
        }, false);

        return moElements;
    };

    function getVisibleRange(expand) {

        if(expand !== 0 && !expand) {
            expand = 0;
        }

        var range =  {

            top: scrollTop() - expand,
            bottom: scrollTop() + viewHeight() + expand
        };

        if(range.top < 0) {
            range.top = 0;
        }

        if(range.bottom > scrollHeight()) {
            range.bottom = scrollHeight();
        }

        return range;

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
        }, false);

        if(!pageView) {
            console.warn("Page for element " + element + " not found");
            return;
        }

        var $element = $(element);

        var visibleRange = getVisibleRange();
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


