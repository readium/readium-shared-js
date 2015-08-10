//  Created by Dmitry Markushevich (dmitrym@evidentpoint.com)
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

define(["jquery", "underscore", "../globals", "./page_open_request", "../views/fixed_view",
        "../views/scroll_view", "../views/reflowable_view"],
    function($, _, Globals, PageOpenRequest, FixedView, ScrollView, ReflowableView) {

/**
 * @class
 */
var ViewManager = function(spine, reader) {
    var self = this;

    var _cachedViews = [];

    var _spine = spine;

    // debugging
    ReadiumSDK.cacheStats = function () {
        console.log(_cachedViews);
    };


    // given a spine item and current view, will return a new or cached view for spine item and hide the "old" current view.
    this.getViewForSpineItem = function(spineItem, currentView, viewerSettings, viewCreationParams, callback) {

        if (currentView) {
            currentView.hide();
            currentView.setCached(true);
        }

        var cachedView = self.getCachedViewForSpineItem(spineItem);
        self.cacheNeighboursForSpineItem(spineItem, currentView, viewCreationParams);
        self.expireCachedItems(spineItem);

        // there's a cached view, lets reset the _currentView then.
        var desiredViewType = deduceDesiredViewType(spineItem, viewerSettings);
        if (cachedView && self.viewTypeForView(cachedView) === desiredViewType) {
            cachedView.setCached(false);
            cachedView.show();
            currentView = cachedView;
            currentView.setViewSettings(viewerSettings);

            currentView.onContentDocumentLoadStart(spineItem);
            currentView.onContentDocumentLoaded(spineItem);

            callback(false, currentView); // view doesn't change!
        } else {
            if (cachedView) {
                self.destroyView(cachedView);
            }
            currentView = createViewForItem(spineItem, viewCreationParams);
            saveViewOnceLoaded(currentView);
            currentView.render();
            currentView.openPage(new PageOpenRequest(spineItem),0);
            currentView.once(Globals.Events.CONTENT_DOCUMENT_LOADED, function($iframe, spineItem) {
                // proxy this event through to the reader
                _.defer(function() {
                    setTimeout(function(){
                            callback(true, currentView);
                        }, 150);
                });
            });



        }
        return currentView;
    };


    // we need to find whether we've already cached a particular spine item.
    // lets ask all of the existing views for the spine items that they are
    // holding (remember, each view may hold more than one)
    this.getCachedViewForSpineItem = function (spineItem) {
        return _.find(_cachedViews, function(view){
            var loadedspines = view.getLoadedSpineItems();
            var foundView = _.find(loadedspines, function(spine) {
                 return spine.index === spineItem.index;
            });
            return foundView;
        });
    };


    // given a spine item, cache it's neigbhours. It's assumed that the spine item is currently visible on screen.
    this.cacheNeighboursForSpineItem = function(spineItem, currentView, viewCreationParams) {
        // the next spine item to cache might be either +1 or +2. For a reflowable view it'll be +1,
        // for a synthetic spread it's going to be 2. In any case, this information is encapsulated
        // in the number of currently loaded spines within the current view.
        var spinesWithinTheCurrentView = _.isUndefined(currentView)  ? 1 : currentView.getLoadedSpineItems().length;

        // make a copy of the viewCreationParams so that we can apply the current settings to the cached views.
        var localViewCreationParams = _.extend({}, viewCreationParams);
        localViewCreationParams.cachedView = true;

        var rightSpineItemToPrefetch = _spine.items[spineItem.index + spinesWithinTheCurrentView];
        var leftSpineItemToPrefetch = _spine.items[spineItem.index - spinesWithinTheCurrentView];

        if (rightSpineItemToPrefetch && _.isUndefined(self.getCachedViewForSpineItem(rightSpineItemToPrefetch))) {
            var rightView = createPrefetchedViewForSpineItem(rightSpineItemToPrefetch, "first", localViewCreationParams);
            saveViewOnceLoaded(rightView);
        }

        if (leftSpineItemToPrefetch && _.isUndefined(self.getCachedViewForSpineItem(leftSpineItemToPrefetch))) {
             var leftView = createPrefetchedViewForSpineItem(leftSpineItemToPrefetch, "last", localViewCreationParams);
             saveViewOnceLoaded(leftView);
        }
    }

    // given current spine item (the one that's on screen), prune cached items.
    this.expireCachedItems = function(currentSpineItem) {
        var currentSpineItemIndex = currentSpineItem.index;
        // get all views that have an spine index more than 3 removed. it's simplistic but should work
        // for both single and double fixed page layouts..
        var cachedViewsToRemove = _.filter(_cachedViews, function(cachedView){
            var spineItemForCachedView = cachedView.getLoadedSpineItems()[0];
            return (Math.abs(spineItemForCachedView.index - currentSpineItemIndex) > 3);
        });

        console.log("Pruning cached views, removing %d from the cached views list.", cachedViewsToRemove.length);

        // remove views from the dom.
        _.each(cachedViewsToRemove, function(viewToRemove) {
            viewToRemove.remove();
        });

        // remove cached views from our local table.
        _cachedViews = _.difference(_cachedViews, cachedViewsToRemove);
    };

    this.destroyView = function(cachedView) {
        cachedView.remove();

        _cachedViews = _.without(_cachedViews, cachedView);
    };

    // given a view returns it's type
    this.viewTypeForView = function(view) {

        if (!view) {
            return undefined;
        }

        if (view instanceof ReflowableView) {
            return ViewManager.VIEW_TYPE_COLUMNIZED;
        }

        if (view instanceof FixedView) {
            return ViewManager.VIEW_TYPE_FIXED;
        }

        if (view instanceof ScrollView) {
            if (view.isContinuousScroll()) {
                return ViewManager.VIEW_TYPE_SCROLLED_CONTINUOUS;
            }

            return ViewManager.VIEW_TYPE_SCROLLED_DOC;
        }

        console.error("Unrecognized view type");
        return undefined;
    };

    //////////////////
    // private helpers

    // dont actually add the view to the cached array until it's been fully loaded and ready to show. this is
    // so that if the users exceeds the cache we can just show them the regular spinner.
    function saveViewOnceLoaded (view) {
        if (_.isUndefined(view)) {
            return;
        }
        view.once(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            // try to make sure that we don't load duplicate views.
            var spineItemForView = view.getLoadedSpineItems()[0];
            if (_.isUndefined(self.getCachedViewForSpineItem(spineItemForView))) {
                console.log('%c View loaded in the background...%d cached views', 'background: grey; color: blue', _cachedViews.length);
                _cachedViews.push(view);
            }
        })
    };



    // create a cached view for a given spine item.
    function createPrefetchedViewForSpineItem(spineItem, setToPage, viewCreationParams) {
        var cachedView = self.getCachedViewForSpineItem(spineItem);
        if (cachedView === undefined) {
            // var desiredViewType = deduceDesiredViewType(spineItem);

            // var viewCreationParams = {
            //     $viewport: _$el,
            //     spine: _spine,
            //     userStyles: _userStyles,
            //     bookStyles: _bookStyles,
            //     iframeLoader: _iframeLoader,
            //     cachedView: true
            // };

            cachedView = createViewForItem(spineItem, viewCreationParams);
            var openPageRequest = new PageOpenRequest(spineItem, self);
            var direction  = 0;
            if (setToPage === "last") {
                openPageRequest.setLastPage();
                direction = 1;
            } else {
                openPageRequest.setFirstPage();
                direction = 2;
            }

            cachedView.render();
            // cachedView.setViewSettings(_viewerSettings);
            cachedView.openPage(openPageRequest,direction);
            cachedView.setCached(true);
            cachedView.hide();
        }
        return cachedView;
    };


    //based on https://docs.google.com/spreadsheet/ccc?key=0AoPMUkQhc4wcdDI0anFvWm96N0xRT184ZE96MXFRdFE&usp=drive_web#gid=0 document
    function deduceDesiredViewType(spineItem, viewerSettings) {
        console.assert(!_.isUndefined(viewerSettings, "Viewer settings must be passed in!"));
        //check settings
        if (viewerSettings.scroll == "scroll-doc") {
            return ViewManager.VIEW_TYPE_SCROLLED_DOC;
        }

        if (viewerSettings.scroll == "scroll-continuous") {
            return ViewManager.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        //is fixed layout ignore flow
        if (spineItem.isFixedLayout()) {
            return ViewManager.VIEW_TYPE_FIXED;
        }

        //flow
        if (spineItem.isFlowScrolledDoc()) {
            return ViewManager.VIEW_TYPE_SCROLLED_DOC;
        }

        if (spineItem.isFlowScrolledContinuous()) {
            return ViewManager.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        return ViewManager.VIEW_TYPE_COLUMNIZED;
    }



    function createViewForItem(spineItem, viewCreationParams) {

        var view = undefined;
        var desiredViewType = deduceDesiredViewType(spineItem, viewCreationParams.viewSettings);
        console.assert(!_.isUndefined(viewCreationParams, "View creation params must be passed in!"));

        view = createViewForType(desiredViewType, viewCreationParams);
        return view;
    }


       /**
     * Create a view based on the given view type.
     * @param {ViewManager.ViewType} viewType
     * @param {ReaderView.ViewCreationOptions} options
     * @returns {*}
     */
    function createViewForType(viewType, options) {
        var createdView;

        // NOTE: _$el == options.$viewport
        //_$el.css("overflow", "hidden");
        options.$viewport.css("overflow", "hidden");

        switch(viewType) {
            case ViewManager.VIEW_TYPE_FIXED:

                options.$viewport.css("overflow", "auto"); // for content pan, see self.setZoom()

                createdView = new FixedView(options, self);
                break;
            case ViewManager.VIEW_TYPE_SCROLLED_DOC:
                createdView = new ScrollView(options, false, reader);
                break;
            case ViewManager.VIEW_TYPE_SCROLLED_CONTINUOUS:
                createdView = new ScrollView(options, true, reader);
                break;
            default:
                createdView = new ReflowableView(options, self);
                break;
        }

        return createdView;
    };

};

/**
 * View Type
 * @typedef {object} ViewManager.ViewType
 * @property {number} VIEW_TYPE_COLUMNIZED          Reflowable document view
 * @property {number} VIEW_TYPE_FIXED               Fixed layout document view
 * @property {number} VIEW_TYPE_SCROLLED_DOC        Scrollable document view
 * @property {number} VIEW_TYPE_SCROLLED_CONTINUOUS Continuous scrollable document view
 */
ViewManager.VIEW_TYPE_COLUMNIZED = 1;
ViewManager.VIEW_TYPE_FIXED = 2;
ViewManager.VIEW_TYPE_SCROLLED_DOC = 3;
ViewManager.VIEW_TYPE_SCROLLED_CONTINUOUS = 4;

return ViewManager;

});
