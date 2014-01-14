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

//    var _lastViewPortSize = {
//        width: undefined,
//        height: undefined
//    };
//
//    var _paginationInfo = {
//
//        visibleColumnCount : 2,
//        columnGap : 20,
//        spreadCount : 0,
//        currentSpreadIndex : 0,
//        columnWidth : undefined,
//        pageOffset : 0,
//        columnCount: 0
//    };

    this.render = function(){

        var template = ReadiumSDK.Helpers.loadTemplate("reflowable_book_frame", {});

        _$el = $(template);
        _$viewport.append(_$el);

        _$contentFrame = $("#reflowable-content-frame", _$el);
        _$contentFrame.css("overflow", "");
        _$contentFrame.css("overflow-y", "auto");
        _$contentFrame.css("-webkit-overflow-scrolling", "touch");
        _$contentFrame.css("width", "100%");
        _$contentFrame.css("height", "100%");

        _$iframe = $("#epubContentIframe", _$el);
        _$iframe.css("width", "100%");
        _$iframe.css("height", "100%");

        _$iframe.css("left", "");
        _$iframe.css("right", "");
        _$iframe.css(_spine.isLeftToRight() ? "left" : "right", "0px");
        _$iframe.css("width", "100%");


        _navigationLogic = new ReadiumSDK.Views.CfiNavigationLogic(_$contentFrame, _$iframe);

        //We will call onViewportResize after user stopped resizing window
        var lazyResize = _.debounce(self.onViewportResize, 100);
        $(window).on("resize.ReadiumSDK.reflowableView", _.bind(lazyResize, self));

        var lazyScroll = _.debounce(onScroll, 100);
        _$el.on("scroll.ReadiumSDK.reflowableView", _.bind(lazyScroll, self));

        return self;
    };

    function onScroll() {

        console.log("Page Scrolled!!!");
        onPaginationChanged(self);
    }

    function setFrameSizesToRectangle(rectangle) {
        _$contentFrame.css("left", rectangle.left);
        _$contentFrame.css("top", rectangle.top);
        _$contentFrame.css("right", rectangle.right);
        _$contentFrame.css("bottom", rectangle.bottom);

    }

    this.remove = function() {

        $(window).off("resize.ReadiumSDK.reflowableView");
        _$el.off("scroll.ReadiumSDK.reflowableView");
        _$el.remove();
    };

    this.isReflowable = function() {
        return true;
    };

    this.onViewportResize = function() {
        resizeIFrameToContent();
        onPaginationChanged(self);
    };

    this.setViewSettings = function(settings) {

        _fontSize = settings.fontSize;

        updateHtmlFontSize();

        resizeIFrameToContent();
    };


    function registerTriggers(doc) {
        $('trigger', doc).each(function() {
            var trigger = new ReadiumSDK.Models.Trigger(this);
            trigger.subscribe(doc);

        });
    }

    function loadSpineItem(spineItem) {

        if(_currentSpineItem != spineItem) {

            _currentSpineItem = spineItem;
            _isWaitingFrameRender = true;

            var src = _spine.package.resolveRelativeUrl(spineItem.href);
            _iframeLoader.loadIframe(_$iframe[0], src, onIFrameLoad, self);
        }
    }

    function updateHtmlFontSize() {

        if(_$epubHtml) {
            _$epubHtml.css("font-size", _fontSize + "%");
        }
    }

    function resizeIFrameToContent() {

        if(!_$iframe || !_$epubHtml) {
            return;
        }

        var contHeight = _$epubHtml.height();
        _$iframe.css("height", contHeight + "px");
    }

    function onIFrameLoad(success) {

        _isWaitingFrameRender = false;

        //while we where loading frame new request came
        if(_deferredPageRequest && _deferredPageRequest.spineItem != _currentSpineItem) {
            loadSpineItem(_deferredPageRequest.spineItem);
            return;
        }

        if(!success) {
            _deferredPageRequest = undefined;
            return;
        }

        self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, _$iframe, _currentSpineItem);

        var epubContentDocument = _$iframe[0].contentDocument;
        _$epubHtml = $("html", epubContentDocument);

        self.applyBookStyles();

        updateHtmlFontSize();

        self.applyStyles();

        setTimeout(function(){
            resizeIFrameToContent();
            openDeferredElement();
        }, 50);

        applySwitches(epubContentDocument);
        registerTriggers(epubContentDocument);

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

        if(_$epubHtml) {
            ReadiumSDK.Helpers.setStyles(_bookStyles.getStyles(), _$epubHtml);
        }
    };


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

        var topOffset = 0;
        var pageCount;
        var $element;

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

            $element = _navigationLogic.getElementBuyId(pageRequest.elementId);

            if(!$element) {
                console.warn("Element id=" + pageRequest.elementId + " not found!");
                return;
            }

            topOffset = _navigationLogic.getVerticalOffsetForElement($element);
        }
        else if(pageRequest.elementCfi) {

            $element = _navigationLogic.getElementByCfi(pageRequest.elementCfi);

            if(!$element) {
                console.warn("Element cfi=" + pageRequest.elementCfi + " not found!");
                return;
            }

            topOffset = _navigationLogic.getVerticalOffsetForElement($element);
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

        scrollTo(topOffset);
        onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);

    };

    function scrollTo(offset) {
        _$contentFrame.animate({
            scrollTop: offset
        }, 50);
    }

    function calculatePageCount() {

        return Math.ceil(scrollHeight() / viewHeight());
    }

    // Description: Parse the epub "switch" tags and hide
    // cases that are not supported
    function applySwitches(dom) {

        // helper method, returns true if a given case node
        // is supported, false otherwise
        var isSupported = function(caseNode) {

            var ns = caseNode.attributes["required-namespace"];
            if(!ns) {
                // the namespace was not specified, that should
                // never happen, we don't support it then
                console.log("Encountered a case statement with no required-namespace");
                return false;
            }
            // all the xmlns that readium is known to support
            // TODO this is going to require maintenance
            var supportedNamespaces = ["http://www.w3.org/1998/Math/MathML"];
            return _.include(supportedNamespaces, ns);
        };

        $('switch', dom).each( function() {

            // keep track of whether or now we found one
            var found = false;

            $('case', this).each(function() {

                if( !found && isSupported(this) ) {
                    found = true; // we found the node, don't remove it
                }
                else {
                    $(this).remove(); // remove the node from the dom
//                    $(this).prop("hidden", true);
                }
            });

            if(found) {
                // if we found a supported case, remove the default
                $('default', this).remove();
//                $('default', this).prop("hidden", true);
            }
        })
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

        if(!_currentSpineItem) {
            return;
        }

        var pageRequest;

        if(scrollTop() > 0) {

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(_currentSpineItem, initiator);
            pageRequest.scrollTop = scrollTop() - (viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);
            if(pageRequest.scrollTop < 0) {
                pageRequest.scrollTop = 0;
            }

        }
        else {

            var prevSpineItem = _spine.prevItem(_currentSpineItem);
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

        if(!_currentSpineItem) {
            return;
        }

        var pageRequest;

        if(scrollBottom() > 0) {

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(_currentSpineItem, initiator);
            pageRequest.scrollTop = scrollTop() + Math.min(scrollBottom(), viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        }
        else {

            var nextSpineItem = _spine.nextItem(_currentSpineItem);
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

        return _navigationLogic.getFirstVisibleElementCfi(scrollTop());
    };

    this.getPaginationInfo = function() {

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(_spine.items.length, false, _spine.direction);

        if(!_currentSpineItem) {
            return paginationInfo;
        }

        paginationInfo.addOpenPage(getCurrentPageIndex(), calculatePageCount(), _currentSpineItem.idref, _currentSpineItem.index);

        return paginationInfo;

    };


    this.bookmarkCurrentPage = function() {

        if(!_currentSpineItem) {

            return new ReadiumSDK.Models.BookmarkData("", "");
        }

        return new ReadiumSDK.Models.BookmarkData(_currentSpineItem.idref, self.getFirstVisibleElementCfi());
    };


    this.getLoadedSpineItems = function() {
        return [_currentSpineItem];
    };

    this.getElement = function(spineItem, selector) {

        if(spineItem != _currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElement(selector);
    };

    this.getVisibleMediaOverlayElements = function() {

        var visibleContentOffsets = scrollTop();
        return _navigationLogic.getVisibleMediaOverlayElements(visibleContentOffsets);
    };

    this.insureElementVisibility = function(element, initiator) {

        var $element = $(element);
        if(_navigationLogic.isElementVisible($element, scrollTop())) {
            return;
        }

        var page = _navigationLogic.getPageForElement($element);

        if(page == -1) {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(_currentSpineItem, initiator);
        openPageRequest.setPageIndex(page);

        self.openPage(openPageRequest);
    }

};
