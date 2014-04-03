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

    options.enablePageTransitions = false; // force (not fixed layout!)

    var SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE = 5;
    var ITEM_LOAD_SCROLL_BUFFER = 2000;
    var ON_SCROLL_TIME_DALAY = 300;

    var self = this;

    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _deferredPageRequest;
    var _$contentFrame;
    var _$el;

    var _stopTransientViewUpdate = false;

    //this flags used to prevent onScroll event triggering pagination changed when internal layout modifications happens
    //if we trigger pagination change without reference to the original request that started the change - we brake the
    //Media Overlay bechaviyour
    //We can't reuse same flag for all of this action because this actions mey happen in parallel
    var _isPerformingLayoutModifications = false; //performing asynch  actions that may trigger onScroll;
    var _isSettingScrollPosition = false; //this happens when we set scroll position based on open element request
    var _isLoadingNewSpineItemOnPageRequest = false; //

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

        var lazyScroll = _.debounce(onScroll, ON_SCROLL_TIME_DALAY);

        _$contentFrame.on('scroll', function(e){
            lazyScroll(e);
        });

        return self;
    };

    function updateLoadedViewsTop(callback, checkScroll) {

        if(_stopTransientViewUpdate) {
            callback();
            return;
        }

        var viewPage = firstLoadedView();
        if(!viewPage) {
            callback();
            return;
        }

        var viewPortRange = getVisibleRange(0);
        var firstViewRange = getPageViewRange(viewPage);

        if((viewPortRange.top - firstViewRange.bottom) > ITEM_LOAD_SCROLL_BUFFER) {
            removePageView(viewPage);
            scrollTo(viewPortRange.top - (firstViewRange.bottom - firstViewRange.top), undefined);
            checkScroll("updateLoadedViewsTop 1");
            updateLoadedViewsTop(callback, checkScroll); //recursion
        }
        else if((viewPortRange.top - firstViewRange.top) < ITEM_LOAD_SCROLL_BUFFER) {
            addToTopOf(viewPage, function(isElementAdded){
                if(isElementAdded) {
                    checkScroll("updateLoadedViewsTop 2");
                    updateLoadedViewsTop(callback, checkScroll); //recursion
                }
                else {
                    callback();
                }
            });
        }
        else {
            callback();
        }

    }

    function updateLoadedViewsBottom(callback, checkScroll) {

        if(_stopTransientViewUpdate) {
            callback();
            return;
        }

        var viewPage = lastLoadedView();
        if(!viewPage) {
            callback();
            return;
        }

        var viewPortRange = getVisibleRange(0);
        var lastViewRange = getPageViewRange(viewPage);

        if((lastViewRange.top - viewPortRange.bottom) > ITEM_LOAD_SCROLL_BUFFER) {
            removePageView(viewPage);
            checkScroll("updateLoadedViewsBottom 1");
            updateLoadedViewsBottom(callback, checkScroll); //recursion
        }
        else if((lastViewRange.bottom - viewPortRange.bottom) < ITEM_LOAD_SCROLL_BUFFER) {
            addToBottomOf(viewPage, function(newPageLoaded) {
                checkScroll("updateLoadedViewsBottom 2");
                if(newPageLoaded) {
                    updateLoadedViewsBottom(callback, checkScroll); //recursion
                }
                else {
                    callback();
                }
            });
        }
        else {
            callback();
        }

    }

    function updateTransientViews(pageView) {

        if(!isContinuousScroll) {
            return;
        }

        var scrollPosBefore = undefined;
        if (pageView)
        {
            // _$el.css("transition", "background-color 500ms ease-out");
            // _$el.css("background-color", "#dddddd");
            //_$contentFrame.css("transform", "translate(3000px, 0px)");
            // _$contentFrame.css("transform-origin", "50% 50%");
            // _$contentFrame.css("transform", "scale(0.5)");
            
            var offset = pageView.offset();
            if (offset) scrollPosBefore = offset.top;
        }

        var checkScroll = function(msg)
        {
            if (!scrollPosBefore) return;
            var scrollPosAfter = undefined;
        
            var offset = pageView.offset();
            if (offset) scrollPosAfter = offset.top;
            
            if (!scrollPosAfter) return;

            var diff = scrollPosAfter - scrollPosBefore;
            if (Math.abs(diff) > 1)
            {
                console.debug("SCROLL ADJUST (" + msg + ") " + diff + " -- " + pageView.currentSpineItem().href);
                
                _$contentFrame[0].scrollTop = _$contentFrame[0].scrollTop + diff;
            }
        };

        _isPerformingLayoutModifications = true;
        updateLoadedViewsBottom(function() {
            // if (pageView)
            // {
            //     _$contentFrame.css("transform", "scale(0.75)");
            // }
            updateLoadedViewsTop(function() {
                setTimeout(function(){

                        // _$el.css("transition", "all 0 ease 0");
                        // _$el.css("background-color", "transparent");
                        // _$contentFrame.css("transform", "none");

                    _isPerformingLayoutModifications = false;
                }, ON_SCROLL_TIME_DALAY + 100);
            }, checkScroll);
        }, checkScroll);
    }

    function onScroll(e) {

        if(    !_isPerformingLayoutModifications
            && !_isSettingScrollPosition
            && !_isLoadingNewSpineItemOnPageRequest) {

            updateTransientViews();
            onPaginationChanged(self);
        }
    }

    function scrollTo(offset, pageRequest) {

        _$contentFrame[0].scrollTop = offset;

        if(pageRequest) {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    }

    function checkHeightDiscrepancy(updateScroll, pageView, iframe, href, fixedLayout, metaWidth, msg)
    {
        var MAX_ATTEMPTS = 10;
        var TIME_MS = 300;
    

        var w = undefined;
        var d = undefined;
        
        try
        {
            w = iframe.contentWindow;
            d = iframe.contentDocument;
        }   
        catch (ex)
        {
            console.error(ex);
        }
        if (!w || !d)
        {
            console.log("checkHeightDiscrepancy ! win && doc (iFrame disposed?)");
            return;
        }
        
        var previousPolledContentHeight = parseInt(Math.round(parseFloat(w.getComputedStyle(d.documentElement).height))); //body can be shorter!;
        if (previousPolledContentHeight <= 100) console.debug("SHORT previousPolledContentHeight: " + previousPolledContentHeight);
        
        var initialContentHeight = previousPolledContentHeight;
        
        var tryAgainFunc = function(tryAgain)
        {
            if (tryAgain !== MAX_ATTEMPTS)
            {
                console.log("tryAgainFunc - " + tryAgain + ": " + href + "  <" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
            }
            
            tryAgain--;
            if (tryAgain < 0)
            {
                console.error("tryAgainFunc abort: " + href);
                return;
            }
    
            setTimeout(function()
            {
                try
                {
                    var win = iframe.contentWindow;
                    var doc = iframe.contentDocument;
                    if (win && doc)
                    {
                        var iframeHeight = parseInt(Math.round(parseFloat(window.getComputedStyle(iframe).height)));

                        var scale = 1;
                        if (fixedLayout) {
                            //var iframeWidth = parseInt(Math.round(parseFloat(window.getComputedStyle(iframe).width)));
                            scale = _$contentFrame.width() / metaWidth;
                        }
                    
                        var docHeight = parseInt(Math.round(parseFloat(win.getComputedStyle(doc.documentElement).height) * scale)); //body can be shorter!
                        
                        if (previousPolledContentHeight != docHeight)
                        {
                            previousPolledContentHeight = docHeight;
                            tryAgainFunc(tryAgain);
                            return;
                        }
                        
                        // CONTENT HEIGHT IS NOW STABILISED
                        
                        var diff = iframeHeight-docHeight;
                        if (Math.abs(diff) > 4)
                        {
                            console.log("$$$ IFRAME HEIGHT ADJUST: " + href + "  [" + diff +"]<" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
                            console.log(msg);

                            // var iframeHeightBefore = iframeHeight;
                            // var scrollPos = scrollTop();

                            //_debounced_updatePageViewSize();
                            updatePageViewSize(pageView);
                    
                            var win = iframe.contentWindow;
                            var doc = iframe.contentDocument;
                            if (win && doc)
                            {
                                var docHeightAfter = parseInt(Math.round(parseFloat(win.getComputedStyle(doc.documentElement).height) * scale)); //body can be shorter!
                                var iframeHeightAfter = parseInt(Math.round(parseFloat(window.getComputedStyle(iframe).height)));
    // 
    // 
    //                             var iframeHeightDiff = iframeHeightAfter - iframeHeightefore;
    //                             if (Math.abs(iframeHeightDiff) > 0)
    //                             {
    //                                 // updateScroll
    //                                 // 0 => top
    //                                 // 1 => page
    //                                 // 2 => bottom
    //                                 
    //                                 var factor = 0;
    //                                 if (updateScroll === 0)
    //                                 {
    //                                     factor = -1;
    //                                 }
    //                                 else if (updateScroll === 1)
    //                                 {
    //                                     factor = 0;
    //                                 }
    //                                 else if (updateScroll === 2)
    //                                 {
    //                                     factor = 0;
    //                                 }
    //                                 
    // if (factor !== 0)
    // {
    // // console.debug("SCROLL ADJUST");
    // // console.log("updateScroll: " + updateScroll);
    // // console.log("scrollPos: " + scrollPos);
    // // console.log("iframeHeightDiff: " + iframeHeightDiff);
    // // console.log("factor: " + factor);
    // 
    // scrollTo(scrollPos + factor * iframeHeightDiff, undefined);
    // }
    //                             }
                            
    
                                var newdiff = iframeHeightAfter-docHeightAfter;
                                if (Math.abs(newdiff) > 4)
                                {
                                    console.error("## IFRAME HEIGHT ADJUST: " + href + "  [" + newdiff +"]<" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
                                    console.log(msg);
                            
                                    tryAgainFunc(tryAgain);
                                }
                                else
                                {
                                    console.log(">> IFRAME HEIGHT ADJUSTED OKAY: " + href + "  ["+diff+"]<" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
                                    // console.log(msg);
                                }
                            }
                            else
                            {
                                console.log("tryAgainFunc ! win && doc (iFrame disposed?)");
                            }
                        }
                        else
                        {
                            // console.debug("IFRAME HEIGHT NO ADJUST: " + href);
                            // console.log(msg);
                        }
                    }
                    else
                    {
                        console.log("tryAgainFunc ! win && doc (iFrame disposed?)");
                    }
                }
                catch(ex)
                {
                    console.error(ex);
                }
            }, TIME_MS);
        };
        
        tryAgainFunc(MAX_ATTEMPTS);
    }
    

    function addToTopOf(topView, callback) {

        var prevSpineItem = _spine.prevItem(topView.currentSpineItem(), true);
        if(!prevSpineItem) {
            callback(false);
            return;
        }

        var tmpView = createPageViewForSpineItem(true);
                
        // add to the end first to avoid scrolling during load
        var lastView = lastLoadedView();
        tmpView.element().insertAfter(lastView.element());

        tmpView.loadSpineItem(prevSpineItem, function(success, $iframe, spineItem, isNewlyLoaded, context){
            if(success) {

                updatePageViewSize(tmpView);
                var range = getPageViewRange(tmpView);

                // var tmpRange = getPageViewRange(tmpView);
                // var tmpHeight = tmpRange.bottom - tmpRange.top;
                // var tmpContentHeight = tmpView.getContentDocHeight();
                // spineItem.href
                // var tmpIframeHeight = Math.round(parseFloat(window.getComputedStyle($iframe[0]).height));
                // var doc = _$iframe[0].contentDocument; //_$epubHtml[0].documentOwner
                // var win = _$iframe[0].contentWindow;

                removePageView(tmpView);
                                

                var scrollPos = scrollTop();

                var newView = createPageViewForSpineItem();
                newView.setHeight(range.bottom - range.top);
                newView.element().insertBefore(topView.element());
                scrollTo(scrollPos + (range.bottom - range.top), undefined);

                newView.loadSpineItem(prevSpineItem, function(success, $iframe, spineItem, isNewlyLoaded, context){
                    if(success) {
                    
                        updatePageViewSize(newView);
                        
                        // var newRange = getPageViewRange(newView);
                        // var newHeight = newRange.bottom - newRange.top;
                        // var newContentHeight = newView.getContentDocHeight();
                        // spineItem.href
                        // var newIframeHeight = Math.round(parseFloat(window.getComputedStyle($iframe[0]).height));

                        onPageViewLoaded(newView, success, $iframe, spineItem, isNewlyLoaded, context);

                        callback(true);

                        checkHeightDiscrepancy(0, newView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? newView.meta_width() : 0, "addToTopOf"); // //onIFrameLoad called before this callback, so okay.
                    }
                    else {
                        console.error("Unable to open 2 " + prevSpineItem.href);
                        removePageView(newView);
                        callback(false);
                    }

                });
            }
            else {
                console.error("Unable to open 1 " + prevSpineItem.href);
                removePageView(tmpView);
                callback(false);
            }

        });
    }

    function updatePageViewSize(pageView) {

        if(pageView.currentSpineItem().isFixedLayout()) {
            pageView.scaleToWidth(_$contentFrame.width());
        }
        else {
            pageView.resizeIFrameToContent();
        }
    }

    function addToBottomOf(bottomView, callback) {

        var nexSpineItem = _spine.nextItem(bottomView.currentSpineItem(), true);
        if(!nexSpineItem) {
            callback(false);
            return;
        }

        var newView = createPageViewForSpineItem();
        newView.element().insertAfter(bottomView.element());

        newView.loadSpineItem(nexSpineItem, function(success, $iframe, spineItem, isNewlyLoaded, context) {
            if(success) {
                updatePageViewSize(newView);
                
                onPageViewLoaded(newView, success, $iframe, spineItem, isNewlyLoaded, context);
                
                callback(true);
                
                checkHeightDiscrepancy(2, newView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? newView.meta_width() : 0, "addToBottomOf"); // //onIFrameLoad called before this callback, so okay.
            }
            else {
                console.error("Unable to load " + nexSpineItem.href);
                callback(false);
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

    // 
    // //var _debounced_onViewportResize = _.bind(_.debounce(this.onViewportResize, 100), self);
    // var _debounced_updatePageViewSize = _.debounce(function(){
    //     //self.onViewportResize();
    // 
    //     if(!_$contentFrame) {
    //         return;
    //     }
    // 
    //     forEachItemView(function(pageView){
    // 
    //         updatePageViewSize(pageView);
    //     }, false);
    // 
    // }, 100);
    // 
    this.onViewportResize = function() {

        if(!_$contentFrame) {
            return;
        }

        forEachItemView(function(pageView){

            updatePageViewSize(pageView);
        }, false);

        onPaginationChanged(self);
        
        updateTransientViews();
    };

    var _viewSettings = undefined;
    this.setViewSettings = function(settings) {
        
        _viewSettings = settings;

        forEachItemView(function(pageView){

            pageView.setViewSettings(settings);

        }, false);
    };

    function createPageViewForSpineItem(isTemporaryView) {

        var pageView = new ReadiumSDK.Views.OnePageView(
            options,
            ["content-doc-frame"],
            true); //enableBookStyleOverrides
            
        pageView.render();
        if (_viewSettings) pageView.setViewSettings(_viewSettings);

        if(!isTemporaryView) {
            pageView.element().data("pageView", pageView);
        }
        

        if (isContinuousScroll)
        {
            pageView.decorateIframe();
        }

        return pageView;
    }

    function findPageViewForSpineItem(spineItem, reverse) {

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

        }, reverse);

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

    function onPageViewLoaded(pageView, success, $iframe, spineItem, isNewlyLoaded, context) {

        if(success && isNewlyLoaded) {
            self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
        }

    }

    function loadSpineItem(spineItem, callback) {

        removeLoadedItems();

        var loadedView = createPageViewForSpineItem();

        _$contentFrame.append(loadedView.element());

        loadedView.loadSpineItem(spineItem, function(success, $iframe, spineItem, isNewlyLoaded, context) {

            if(success) {
                updatePageViewSize(loadedView);
                
                onPageViewLoaded(loadedView, success, $iframe, spineItem, isNewlyLoaded, context);
            
                callback(loadedView);
            
                checkHeightDiscrepancy(1, loadedView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? loadedView.meta_width() : 0, "openPage"); // //onIFrameLoad called before this callback, so okay.
            }
            else {
                console.error("Unable to load " + spineItem.href);
                
                removePageView(loadedView);
                loadedView = undefined;
            }

            callback(loadedView);

        });

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

        _stopTransientViewUpdate = true;

        //local helper function
        var doneLoadingSpineItem = function(pageView, pageRequest) {

            _deferredPageRequest = undefined;
            openPageViewElement(pageView, pageRequest);
            _stopTransientViewUpdate = false;
            updateTransientViews(pageView);
        };

        if(pageRequest.spineItem) {

            var pageView = findPageViewForSpineItem(pageRequest.spineItem);
            if(pageView) {
                doneLoadingSpineItem(pageView, pageRequest);
            }
            else {
                _deferredPageRequest = pageRequest;
                _isLoadingNewSpineItemOnPageRequest = true;
                
                loadSpineItem(pageRequest.spineItem, function(pageView) {

                    setTimeout(function(){
                        _isLoadingNewSpineItemOnPageRequest = false;
                    }, ON_SCROLL_TIME_DALAY + 100);

                    if(pageView && _deferredPageRequest) {
                        if(pageView.currentSpineItem() === _deferredPageRequest.spineItem) {
                            doneLoadingSpineItem(pageView, _deferredPageRequest);
                        }
                        else { //while we where waiting for load new request come
                            self.openPage(_deferredPageRequest); //recursion
                        }
                    }
                    else {
                        onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
                    }

                });
            }
        }
        else {
            doneLoadingSpineItem(undefined, pageRequest);
        }
    };

    function openPageViewElement(pageView, pageRequest) {

// var si = pageView ? pageView.currentSpineItem() : undefined;
// console.log("openPageViewElement: " + (si ? si.href : (pageRequest ? pageRequest.scrollTop : undefined)));

        var topOffset = 0;
        var pageCount;
        var $element;
        var sfiNav;
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
        else if(pageView && pageRequest.elementId) {

            pageRange = getPageViewRange(pageView);
            sfiNav = pageView.getNavigator();
            $element = sfiNav.getElementById(pageRequest.elementId);

            if(!$element || !$element.length) {
                console.warn("Element id=" + pageRequest.elementId + " not found!");
                return;
            }

            if(isElementVisibleOnScreen(pageView, $element, 60)) {
                //TODO refactoring required
                // this is artificial call because MO player waits for this event to continue playing.
                onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
                return;
            }

            topOffset = sfiNav.getVerticalOffsetForElement($element) + pageRange.top;

        }
        else if(pageView && pageRequest.elementCfi) {

            pageRange = getPageViewRange(pageView);
            sfiNav = pageView.getNavigator();
            $element = sfiNav.getElementByCfi(pageRequest.elementCfi);

            if(!$element || !$element.length) {
                console.warn("Element cfi=" + pageRequest.elementCfi + " not found!");
                return;
            }

            if(isElementVisibleOnScreen(pageView, $element, 60)) {
                //TODO refactoring required
                // this is artificial call because MO player waits for this event to continue playing.
                onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
                return;
            }

            topOffset = sfiNav.getVerticalOffsetForElement($element) + pageRange.top;

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
        else if (pageView) {

            pageRange = getPageViewRange(pageView);
            topOffset = pageRange.top;
        }
        else {
            topOffset = 0;
        }

        if(scrollTop() != topOffset ) {

            _isSettingScrollPosition = true;
            scrollTo(topOffset, pageRequest);

            setTimeout(function() {
                _isSettingScrollPosition = false;
            }, ON_SCROLL_TIME_DALAY + 100); //we have to wait more than scroll delay to make sure that we don't react on onScroll

        }
        else {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    }

    function calculatePageCount() {

        return Math.ceil(scrollHeight() / viewHeight());
    }

    function onPaginationChanged(initiator, paginationRequest_spineItem, paginationRequest_elementId) {
        self.trigger(ReadiumSDK.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, { paginationInfo: self.getPaginationInfo(), initiator: initiator, spineItem: paginationRequest_spineItem, elementId: paginationRequest_elementId } );
    }

    function scrollTop() {
        return  _$contentFrame[0].scrollTop;
    }

    function scrollBottom() {
        return scrollHeight() - (scrollTop() + viewHeight());
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
            openPageViewElement(undefined, pageRequest);
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

            openPageViewElement(undefined, pageRequest);
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
        var spineItem;
        var pageCount;
        var pageView;
        var pageViewRange;
        var heightAboveViewport;
        var heightBelowViewport;
        var pageCountAbove;
        var pageCountBelow;

        var viewPortRange = getVisibleRange();
        var viewPortHeight = viewPortRange.bottom - viewPortRange.top;

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(_spine.items.length, false, _spine.direction);

        var visibleViews = getVisiblePageViews();

        for(var i = 0, count = visibleViews.length; i < count; i++) {

            pageView = visibleViews[i];
            spineItem = pageView.currentSpineItem();
            pageViewRange = getPageViewRange(pageView);

            heightAboveViewport = Math.max(viewPortRange.top - pageViewRange.top, 0);
            heightBelowViewport = Math.max(pageViewRange.bottom - viewPortRange.bottom, 0);

            pageCountAbove = Math.ceil(heightAboveViewport / viewPortHeight);
            pageCountBelow = Math.ceil(heightBelowViewport / viewPortHeight);
            pageCount =  pageCountAbove + pageCountBelow + 1;

            paginationInfo.addOpenPage(pageCountAbove, pageCount, spineItem.idref, spineItem.index);
        }

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
    
    this.getElementById = function(spineItem, id) {
        
        var found = undefined;
        
        forEachItemView(function(pageView){
            if(pageView.currentSpineItem() == spineItem) {

                found = pageView.getNavigator().getElementById(id);
                return false;
            }

            return true;

        }, false);

        if(!found) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return found;
    };
    
    this.getFirstVisibleMediaOverlayElement =  function() {
        var viewPortRange = getVisibleRange();

        var moElement = undefined;
        var normalizedRange = {top: 0, bottom: 0};
        var pageViewRange;

        var steppedToVisiblePage = false;

        forEachItemView(function(pageView) {
            pageViewRange = getPageViewRange(pageView);

            normalizedRange.top = Math.max(pageViewRange.top, viewPortRange.top) - pageViewRange.top;
            normalizedRange.bottom = Math.min(pageViewRange.bottom, viewPortRange.bottom) - pageViewRange.top;

            if(rangeLength(normalizedRange) > 0) {
                steppedToVisiblePage = true;

                moElement = pageView.getNavigator().getFirstVisibleMediaOverlayElement(normalizedRange);
                if(moElement) {
                    return false;
                }
            }
            else if(steppedToVisiblePage) {
                return false;
            }

            return true; //continue iteration

        }, false);

        return moElement;
    };
    
    // /**
    //  * @deprecated
    //  */
    // this.getVisibleMediaOverlayElements = function() {
    //     var viewPortRange = getVisibleRange();
    // 
    //     var pageMoElements;
    //     var moElements = [];
    //     var normalizedRange = {top: 0, bottom: 0};
    //     var pageViewRange;
    // 
    //     forEachItemView(function(pageView){
    //         pageViewRange = getPageViewRange(pageView);
    // 
    //         normalizedRange.top = Math.max(pageViewRange.top, viewPortRange.top) - pageViewRange.top;
    //         normalizedRange.bottom = Math.min(pageViewRange.bottom, viewPortRange.bottom) - pageViewRange.top;
    // 
    //         if(rangeLength(normalizedRange) > 0) {
    //             pageMoElements = pageView.getNavigator().getVisibleMediaOverlayElements(normalizedRange);
    //             moElements.push.apply(moElements, pageMoElements);
    //         }
    //     }, false);
    // 
    //     return moElements;
    // };

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

    function isElementVisibleOnScreen(pageView, $element, percentVisible) {

        var elementRange = getElementRange(pageView, $element);

        return isRangeIsVisibleOnScreen(elementRange, percentVisible);
    }

    function isRangeIsVisibleOnScreen(range, percentVisible) {

        var visibleRange = getVisibleRange();

        var smallestVisibleLength = Math.min(rangeLength(visibleRange), rangeLength(range));
        if(smallestVisibleLength === 0) {
            smallestVisibleLength = 5; // if element is 0 height we will set it to arbitrary 5 pixels - not to divide by 0
        }

        var intersectionRange = intersectRanges(visibleRange, range);

        var visiblePercent = (rangeLength(intersectionRange) / smallestVisibleLength) * 100;

        return visiblePercent >= percentVisible;
    }

    function getElementRange(pageView, $element) {

        var pageRange = getPageViewRange(pageView);

        var elementRange = {top:0, bottom:0};
        elementRange.top = $element.offset().top + pageRange.top;
        elementRange.bottom = elementRange.top + $element.height();

        return elementRange;
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

        var elementRange = getElementRange(pageView, $element);

        if(!isRangeIsVisibleOnScreen(elementRange, 60)) {

            var spineItem = _spine.getItemById(spineItemId);
            var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
            openPageRequest.scrollTop = elementRange.top;

            self.openPage(openPageRequest);
        }

    }

};


