//  Created by Boris Schneiderman.
// Modified by Daniel Weck
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

ReadiumSDK.Views.ScrollView = function(options, isContinuousScroll, reader){

    var _DEBUG = false;

    _.extend(this, Backbone.Events);

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

        var settings = _viewSettings;
        if (!settings)
        {
            //defaults
            settings = new ReadiumSDK.Models.ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {
            // This is a necessary counterpart for the same CSS GPU hardware acceleration trick in one_page_view.js
            // This affects the stacking order and re-enables the scrollbar in Safari (works fine in Chrome otherwise)
            _$contentFrame.css("transform", "translateZ(0)");
        }
        
        // _$contentFrame.css("box-sizing", "border-box");
        // _$contentFrame.css("border", "20px solid red");

        self.applyStyles();

        var lazyScroll = _.debounce(onScroll, ON_SCROLL_TIME_DALAY);

        _$contentFrame.on('scroll', function(e){
            lazyScroll(e);
            onScrollDirect();
        });

        return self;
    };

    function updateLoadedViewsTop(callback, assertScrollPosition) {

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
            var scrollPos = scrollTop();
            removePageView(viewPage);
            scrollTo(scrollPos - (firstViewRange.bottom - firstViewRange.top), undefined);
            assertScrollPosition("updateLoadedViewsTop 1");
            updateLoadedViewsTop(callback, assertScrollPosition); //recursion
        }
        else if((viewPortRange.top - firstViewRange.top) < ITEM_LOAD_SCROLL_BUFFER) {
            addToTopOf(viewPage, function(isElementAdded){
                if(isElementAdded) {
                    assertScrollPosition("updateLoadedViewsTop 2");
                    updateLoadedViewsTop(callback, assertScrollPosition); //recursion
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

    function updateLoadedViewsBottom(callback, assertScrollPosition) {

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
            assertScrollPosition("updateLoadedViewsBottom 1");
            updateLoadedViewsBottom(callback, assertScrollPosition); //recursion
        }
        else if((lastViewRange.bottom - viewPortRange.bottom) < ITEM_LOAD_SCROLL_BUFFER) {
            addToBottomOf(viewPage, function(newPageLoaded) {
                assertScrollPosition("updateLoadedViewsBottom 2");
                if(newPageLoaded) {
                    updateLoadedViewsBottom(callback, assertScrollPosition); //recursion
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
        if (_DEBUG)
        {
            if (pageView)
            {
                var offset = pageView.offset();
                if (offset) scrollPosBefore = offset.top;
            }
        }

        // This function double-checks whether the browser has shifted the scroll position because of unforeseen rendering issues.
        // (this should never happen because we handle scroll adjustments during iframe height resizes explicitely in this code)
        var assertScrollPosition = function(msg)
        {
            if (_DEBUG)
            {
                if (!scrollPosBefore) return;
                var scrollPosAfter = undefined;
        
                var offset = pageView.offset();
                if (offset) scrollPosAfter = offset.top;
            
                if (!scrollPosAfter) return;

                var diff = scrollPosAfter - scrollPosBefore;
                if (Math.abs(diff) > 1)
                {
                    console.debug("@@@@@@@@@@@@@@@ SCROLL ADJUST (" + msg + ") " + diff + " -- " + pageView.currentSpineItem().href);
                    //_$contentFrame[0].scrollTop = _$contentFrame[0].scrollTop + diff;
                }
            }
        };

        _isPerformingLayoutModifications = true;
        updateLoadedViewsBottom(function() {
            updateLoadedViewsTop(function() {
                setTimeout(function(){
                    _isPerformingLayoutModifications = false;
                }, ON_SCROLL_TIME_DALAY + 100);
            }, assertScrollPosition);
        }, assertScrollPosition);
    }

    var _mediaOverlaysWasPlayingLastTimeScrollStarted = false;

    function onScrollDirect(e)
    {
        var settings = reader.viewerSettings();
        if (!settings.mediaOverlaysPreservePlaybackWhenScroll)
        {
            if (!_mediaOverlaysWasPlayingLastTimeScrollStarted && reader.isMediaOverlayAvailable())
            {
                _mediaOverlaysWasPlayingLastTimeScrollStarted = reader.isPlayingMediaOverlay();
                if (_mediaOverlaysWasPlayingLastTimeScrollStarted)
                {
                    reader.pauseMediaOverlay();
                }
            }
        }
    }
    
    function onScroll(e)
    {
        if(    !_isPerformingLayoutModifications
            && !_isSettingScrollPosition
            && !_isLoadingNewSpineItemOnPageRequest) {

            updateTransientViews();
            onPaginationChanged(self);

            var settings = reader.viewerSettings();
            if (!settings.mediaOverlaysPreservePlaybackWhenScroll)
            {
                if (_mediaOverlaysWasPlayingLastTimeScrollStarted)
                {
                    setTimeout(function()
                    {
                        reader.playMediaOverlay();
                        _mediaOverlaysWasPlayingLastTimeScrollStarted = false;
                    }, 100);
                }
            }
        }
    }

    function scrollTo(offset, pageRequest) {

        _$contentFrame[0].scrollTop = offset;

        if(pageRequest) {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    }

    function updatePageViewSizeAndAdjustScroll(pageView)
    {
        var scrollPos = scrollTop();
        var rangeBeforeResize = getPageViewRange(pageView);

        updatePageViewSize(pageView);
        
        var rangeAfterResize = getPageViewRange(pageView);

        var heightAfter = rangeAfterResize.bottom - rangeAfterResize.top;
        var heightBefore = rangeBeforeResize.bottom - rangeBeforeResize.top;

        var delta = heightAfter - heightBefore;

        if (Math.abs(delta) > 0)
        {
            if (_DEBUG)
            {
                console.debug("IMMEDIATE SCROLL ADJUST: " + pageView.currentSpineItem().href + " == " + delta);
            }
            scrollTo(scrollPos + delta);
        }
    }
    
    function reachStableContentHeight(updateScroll, pageView, iframe, href, fixedLayout, metaWidth, msg, callback)
    {
        if (!ReadiumSDK.Helpers.isIframeAlive(iframe))
        {
            if (_DEBUG)
            {
                console.log("reachStableContentHeight ! win && doc (iFrame disposed?)");
            }

            if (callback) callback(false);
            return;
        }

        var MAX_ATTEMPTS = 10;
        var TIME_MS = 300;

        var w = iframe.contentWindow;
        var d = iframe.contentDocument;
        
        var previousPolledContentHeight = parseInt(Math.round(parseFloat(w.getComputedStyle(d.documentElement).height))); //body can be shorter!;
        
        var initialContentHeight = previousPolledContentHeight;

        if (updateScroll === 0)
        {
            updatePageViewSizeAndAdjustScroll(pageView);
        }
        else
        {
            updatePageViewSize(pageView);
        }
        
        var tryAgainFunc = function(tryAgain)
        {
            if (_DEBUG && tryAgain !== MAX_ATTEMPTS)
            {
                console.log("tryAgainFunc - " + tryAgain + ": " + href + "  <" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
            }
            
            tryAgain--;
            if (tryAgain < 0)
            {
                if (_DEBUG)
                {
                    console.error("tryAgainFunc abort: " + href);
                }

                if (callback) callback(true);
                return;
            }

            setTimeout(function()
            {
                try
                {
                    if (ReadiumSDK.Helpers.isIframeAlive(iframe))
                    {
                        var win = iframe.contentWindow;
                        var doc = iframe.contentDocument;
                        
                        var iframeHeight = parseInt(Math.round(parseFloat(window.getComputedStyle(iframe).height)));
                    
                        var docHeight = parseInt(Math.round(parseFloat(win.getComputedStyle(doc.documentElement).height))); //body can be shorter!
                        
                        if (previousPolledContentHeight !== docHeight)
                        {
                            previousPolledContentHeight = docHeight;
                            
                            tryAgainFunc(tryAgain);
                            return;
                        }
                        
                        // CONTENT HEIGHT IS NOW STABILISED
                        
                        var diff = iframeHeight-docHeight;
                        if (Math.abs(diff) > 4)
                        {
                            if (_DEBUG)
                            {
                                console.log("$$$ IFRAME HEIGHT ADJUST: " + href + "  [" + diff +"]<" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
                                console.log(msg);
                            }

                            if (updateScroll === 0)
                            {
                                updatePageViewSizeAndAdjustScroll(pageView);
                            }
                            else
                            {
                                updatePageViewSize(pageView);
                            }
                    
                            if (ReadiumSDK.Helpers.isIframeAlive(iframe))
                            {
                                var win = iframe.contentWindow;
                                var doc = iframe.contentDocument;
                                
                                var docHeightAfter = parseInt(Math.round(parseFloat(win.getComputedStyle(doc.documentElement).height))); //body can be shorter!
                                var iframeHeightAfter = parseInt(Math.round(parseFloat(window.getComputedStyle(iframe).height)));

                                var newdiff = iframeHeightAfter-docHeightAfter;
                                if (Math.abs(newdiff) > 4)
                                {
                                    if (_DEBUG)
                                    {
                                        console.error("## IFRAME HEIGHT ADJUST: " + href + "  [" + newdiff +"]<" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
                                        console.log(msg);
                                    }
                                    
                                    tryAgainFunc(tryAgain);
                                    return;
                                }
                                else
                                {
                                    if (_DEBUG)
                                    {
                                        console.log(">> IFRAME HEIGHT ADJUSTED OKAY: " + href + "  ["+diff+"]<" + initialContentHeight +" -- "+ previousPolledContentHeight + ">");
                                        // console.log(msg);
                                    }
                                }
                            }
                            else
                            {
                                if (_DEBUG)
                                {
                                    console.log("tryAgainFunc ! win && doc (iFrame disposed?)");
                                }
                
                                if (callback) callback(false);
                                return;
                            }
                        }
                        else
                        {
                            //if (_DEBUG)
                            // console.debug("IFRAME HEIGHT NO NEED ADJUST: " + href);
                            // console.log(msg);
                        }
                    }
                    else
                    {
                        if (_DEBUG)
                        {
                            console.log("tryAgainFunc ! win && doc (iFrame disposed?)");
                        }
                
                        if (callback) callback(false);
                        return;
                    }
                }
                catch(ex)
                {
                    console.error(ex);
                
                    if (callback) callback(false);
                    return;
                }
                
                if (callback) callback(true);
                
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

                removePageView(tmpView);
                                

                var scrollPos = scrollTop();

                var newView = createPageViewForSpineItem();
                var originalHeight = range.bottom - range.top;
                
            
                newView.setHeight(originalHeight);
                // iframe is loaded hidden here
                //this.showIFrame();
                //===> not necessary here (temporary iframe)
                
                newView.element().insertBefore(topView.element());

                scrollPos = scrollPos + originalHeight;

                scrollTo(scrollPos, undefined);

                newView.loadSpineItem(prevSpineItem, function(success, $iframe, spineItem, isNewlyLoaded, context){
                    if(success) {
                        
                        var continueCallback = function(successFlag)
                        {
                            onPageViewLoaded(newView, success, $iframe, spineItem, isNewlyLoaded, context);

                            callback(successFlag);
                        };
                        
                        reachStableContentHeight(0, newView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? newView.meta_width() : 0, "addToTopOf", continueCallback); // //onIFrameLoad called before this callback, so okay.
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

        var scrollPos = scrollTop();
        
        var newView = createPageViewForSpineItem();
        newView.element().insertAfter(bottomView.element());

        newView.loadSpineItem(nexSpineItem, function(success, $iframe, spineItem, isNewlyLoaded, context) {
            if(success) {

                var continueCallback = function(successFlag)
                {
                    onPageViewLoaded(newView, success, $iframe, spineItem, isNewlyLoaded, context);
                
                    callback(successFlag);
                };

                reachStableContentHeight(2, newView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? newView.meta_width() : 0, "addToBottomOf", continueCallback); // //onIFrameLoad called before this callback, so okay.
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

        options.disablePageTransitions = true; // force

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

        var scrollPos = scrollTop();

        var loadedView = createPageViewForSpineItem();

        _$contentFrame.append(loadedView.element());

        loadedView.loadSpineItem(spineItem, function(success, $iframe, spineItem, isNewlyLoaded, context) {

            if(success) {
                
                var continueCallback = function(successFlag)
                {
                    onPageViewLoaded(loadedView, success, $iframe, spineItem, isNewlyLoaded, context);
            
                    callback(loadedView);
                    
                    //successFlag should always be true as loadedView iFrame cannot be dead at this stage.
                };
                
                reachStableContentHeight(1, loadedView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? loadedView.meta_width() : 0, "openPage", continueCallback); // //onIFrameLoad called before this callback, so okay.
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
        range.bottom = range.top + pageView.getCalculatedPageHeight();

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

    this.getElementByCfi = function(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var found = undefined;

        forEachItemView(function (pageView) {
            if(pageView.currentSpineItem() == spineItem) {

                found = pageView.getElementByCfi(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist);
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


