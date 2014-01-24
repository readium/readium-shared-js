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

ReadiumSDK.Views.ScrollView = function(options){

    _.extend(this, Backbone.Events);

    var SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE = 5;

    var self = this;

    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _isWaitingFrameRender = false;
    var _deferredPageRequest;
    var _$contentFrame;
    var _$el;
    var _onePageView;

    var _firePageChangeOnScroll = true;

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

        _onePageView = new ReadiumSDK.Views.OnePageView(options);
        _$contentFrame.append(_onePageView.render().element());

        _onePageView.on(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED, function($iframe, spineItem, isNewContentDocumentLoaded){

            if(isNewContentDocumentLoaded) {

                self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);

                onPageLoaded();
            }
        });


//        _$iframe = $("#epubContentIframe", _$el);
//        _$iframe.css("width", "100%");
//        _$iframe.css("height", "100%");
//
//        _$iframe.css("left", "");
//        _$iframe.css("right", "");
//        _$iframe.css(_spine.isLeftToRight() ? "left" : "right", "0px");
//        _$iframe.css("width", "100%");


        var lazyScroll = _.debounce(onScroll, 100);

        _$contentFrame.scroll(function(){
            lazyScroll();
        });

        return self;
    };

    function onScroll() {

        if(_firePageChangeOnScroll) {
            onPaginationChanged(self, _onePageView.currentSpineItem());
        }
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

        if(_onePageView) {
            resizePageView();
            onPaginationChanged(self, _onePageView.currentSpineItem());
        }

    };

    this.setViewSettings = function(settings) {

    };

    function loadSpineItem(spineItem) {

        if(_onePageView.currentSpineItem() != spineItem) {
            _isWaitingFrameRender = true;
            _onePageView.loadSpineItem(spineItem);
        }
    }


    function resizePageView() {

        if(!_onePageView || !_$contentFrame) {
            return;
        }

        if(_onePageView.currentSpineItem().isFixedLayout()) {
            _onePageView.scaleToWidth(_$contentFrame.width());
        }
        else {
            _onePageView.resizeIFrameToContent();
        }
    }

    function onPageLoaded() {

        _isWaitingFrameRender = false;

        //while we where loading frame new request came
        if(_deferredPageRequest && _deferredPageRequest.spineItem != _onePageView.currentSpineItem()) {
            loadSpineItem(_deferredPageRequest.spineItem);
            return;
        }

        self.applyBookStyles();

        self.applyStyles();

        setTimeout(function(){
            resizePageView();
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

        if(_onePageView) {
            _onePageView.applyBookStyles();
        }
    };


    this.openPage = function(pageRequest) {

        if(_isWaitingFrameRender) {
            _deferredPageRequest = pageRequest;
            return;
        }

        // if no spine item specified we are talking about current spine item
        if(pageRequest.spineItem && pageRequest.spineItem != _onePageView.currentSpineItem()) {
            _deferredPageRequest = pageRequest;
            loadSpineItem(pageRequest.spineItem);
            return;
        }

        var topOffset = 0;
        var pageCount;
        var $element;
        var navigator = _onePageView.getNavigator();

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

            $element = navigator.getElementBuyId(pageRequest.elementId);

            if(!$element) {
                console.warn("Element id=" + pageRequest.elementId + " not found!");
                return;
            }

            topOffset = navigator.getVerticalOffsetForElement($element);
        }
        else if(pageRequest.elementCfi) {

            $element = navigator.getElementByCfi(pageRequest.elementCfi);

            if(!$element) {
                console.warn("Element cfi=" + pageRequest.elementCfi + " not found!");
                return;
            }

            topOffset = navigator.getVerticalOffsetForElement($element);
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

    this.openPagePrev = function (initiator) {

        if(!_onePageView) {
            return;
        }

        var pageRequest;

        if(scrollTop() > 0) {

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(_onePageView.currentSpineItem(), initiator);
            pageRequest.scrollTop = scrollTop() - (viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);
            if(pageRequest.scrollTop < 0) {
                pageRequest.scrollTop = 0;
            }

        }
        else {

            var prevSpineItem = _spine.prevItem(_onePageView.currentSpineItem());
            if(prevSpineItem) {

                pageRequest = new ReadiumSDK.Models.PageOpenRequest(prevSpineItem, initiator);
                pageRequest.scrollTop = scrollHeight() - viewHeight();
            }

        }

        if(pageRequest) {
            self.openPage(pageRequest);
        }
    };

    this.openPageNext = function (initiator) {

        if(!_onePageView) {
            return;
        }

        var pageRequest;

        if(scrollBottom() > 0) {

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(_onePageView.currentSpineItem(), initiator);
            pageRequest.scrollTop = scrollTop() + Math.min(scrollBottom(), viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        }
        else {

            var nextSpineItem = _spine.nextItem(_onePageView.currentSpineItem());
            if(nextSpineItem) {

                pageRequest = new ReadiumSDK.Models.PageOpenRequest(nextSpineItem, initiator);
                pageRequest.scrollTop = 0;
            }
        }

        if(pageRequest) {
            self.openPage(pageRequest);
        }
    };


    this.getFirstVisibleElementCfi = function() {

        return _onePageView.getNavigator().getFirstVisibleElementCfi(scrollTop());
    };

    this.getPaginationInfo = function() {

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(_spine.items.length, true, _spine.direction);

        if(!_onePageView) {
            return paginationInfo;
        }

        var spineItem = _onePageView.currentSpineItem();
        var pageInx = getCurrentPageIndex();
        paginationInfo.addOpenPage(pageInx, calculatePageCount(), spineItem.idref, spineItem.index);

        return paginationInfo;
    };


    this.bookmarkCurrentPage = function() {

        if(!_onePageView) {

            return new ReadiumSDK.Models.BookmarkData("", "");
        }

        return new ReadiumSDK.Models.BookmarkData(_onePageView.currentSpineItem().idref, self.getFirstVisibleElementCfi());
    };


    this.getLoadedSpineItems = function() {
        return _onePageView ? [_onePageView.currentSpineItem()] : [];
    };

    this.getElement = function(spineItem, selector) {

        if(spineItem != _onePageView.currentSpineItem()) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return _onePageView.getNavigator().getElement(selector);
    };

    this.getVisibleMediaOverlayElements = function() {

        return _onePageView.getNavigator().getVisibleMediaOverlayElements(visibleOffsets());
    };

    function visibleOffsets() {

        return {

            top: scrollTop(),
            bottom: scrollTop() + viewHeight()
        }
    }

    this.insureElementVisibility = function(element, initiator) {

        var $element = $(element);


        var navigator = _onePageView.getNavigator();

        if(navigator.isElementVisible($element, visibleOffsets())) {
            return;
        }

        var page = navigator.getPageForElement($element);

        if(page == -1) {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(_onePageView.currentSpineItem(), initiator);
        openPageRequest.setPageIndex(page);

        self.openPage(openPageRequest);
    }

};
