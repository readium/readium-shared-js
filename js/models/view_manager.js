/**
 * @class 
 */
ReadiumSDK.Models.ViewManager = function(spine, createViewForItem) {
    var self = this;

    var _cachedViews = [];
    
    var _spine = spine;

    var _iframeRereferences = [];

    this.getViewForSpineItem = function(spineItem, currentView, viewerSettings, viewCreationParams, callback) {
        if (currentView) {
            currentView.hide();
            currentView.setCached(true);
            currentView.off();
        }

        var cachedView = self.getCachedViewForSpineItem(spineItem);
        self.cacheNeighboursForSpineItem(spineItem, currentView, viewCreationParams);
        //self.expireCachedItems(spineItem);

        // there's a cached view, lets reset the _currentView then.
        if (cachedView !== undefined) {
            cachedView.setCached(false);
            cachedView.show();
            currentView = cachedView;
            currentView.setViewSettings(viewerSettings);
            // this is questionable as hell.. exposing the internals of the reader view to trigger the event. there's gotta be a better way.
            var spineAndIframe = currentView.getLoadedContentFrames()[0];
            currentView.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED,spineAndIframe.$iframe, spineAndIframe.spineItem);
            callback(true);
        } else {
            currentView = createViewForItem(spineItem, viewCreationParams);
            saveViewOnceLoaded(currentView);
            currentView.render(); 
            currentView.once(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function($iframe, spineItem) {
                // proxy this event through to the reader
                _.defer(function() {
                    setTimeout(function(){
                            callback(true);
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


    //////////////////
    // private helpers

    // dont actually add the view to the cached array until it's been fully loaded and ready to show. this is 
    // so that if the users exceeds the cache we can just show them the regular spinner.
    function saveViewOnceLoaded (view) {
        if (_.isUndefined(view)) {
            return;
        }
        view.once(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function() {
            // try to make sure that we don't load duplicate views.
            var spineItemForView = view.getLoadedSpineItems()[0];
            if (_.isUndefined(self.getCachedViewForSpineItem(spineItemForView))) {
                console.log('%c View loaded in the background...%d cached views', 'background: grey; color: blue', _cachedViews.length);
                _cachedViews.push(view);    
            } 
        })
    };



    // TODODM: this needs to take spine item as a parameter, not an index. maybe.
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
            var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, self);
            if (setToPage === "last") {
                openPageRequest.setLastPage();
            } else {
                openPageRequest.setFirstPage();
            }

            cachedView.render();
            // cachedView.setViewSettings(_viewerSettings);
            cachedView.openPage(openPageRequest,2);
            cachedView.setCached(true);
            // cachedView.hide();
        }
        return cachedView;
    };


    //based on https://docs.google.com/spreadsheet/ccc?key=0AoPMUkQhc4wcdDI0anFvWm96N0xRT184ZE96MXFRdFE&usp=drive_web#gid=0 document
    function deduceDesiredViewType(spineItem, viewerSettings) {
        console.assert(!_.isUndefined(viewerSettings, "View creation params must be passed in!"));
        //check settings
        if(viewerSettings.scroll == "scroll-doc") {
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        if(viewerSettings.scroll == "scroll-continuous") {
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        //is fixed layout ignore flow
        if(spineItem.isFixedLayout()) {
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_FIXED;
        }

        //flow
        if(spineItem.isFlowScrolledDoc()) {
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        if(spineItem.isFlowScrolledContinuous()) {
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        return ReadiumSDK.Views.ReaderView.VIEW_TYPE_COLUMNIZED;
    }



    function createViewForItem(spineItem, viewCreationParams) {

        var view = undefined;
        var desiredViewType = deduceDesiredViewType(spineItem, viewCreationParams);
        console.assert(!_.isUndefined(viewCreationParams, "View creation params must be passed in!"));

        view = self.createViewForType(desiredViewType, viewCreationParams);
        return view;
    }


    this.viewTypeForView = function(view) {

        if(!view) {
            return undefined;
        }

        if(view instanceof ReadiumSDK.Views.ReflowableView) {
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_COLUMNIZED;
        }

        if(view instanceof ReadiumSDK.Views.FixedView) {
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_FIXED;
        }

        if(view instanceof ReadiumSDK.Views.ScrollView) {
            if(view.isContinuousScroll()) {
                return ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
            }

            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        if(view instanceof ReadiumSDK.Views.FallbackScrollView) {
            // fake a columnized view because it's a fallback of it
            return ReadiumSDK.Views.ReaderView.VIEW_TYPE_COLUMNIZED;
        }

        console.error("Unrecognized view type");
        return undefined;
    };


       /**
     * Create a view based on the given view type.
     * @param {ReadiumSDK.Views.ReaderView.ViewType} viewType
     * @param {ReadiumSDK.Views.ReaderView.ViewCreationOptions} options
     * @returns {*}
     */
    this.createViewForType = function(viewType, options) {
        var createdView;

        // NOTE: _$el == options.$viewport
        //_$el.css("overflow", "hidden");
        options.$viewport.css("overflow", "hidden"); 
        
        switch(viewType) {
            case ReadiumSDK.Views.ReaderView.VIEW_TYPE_FIXED:

                options.$viewport.css("overflow", "auto"); // for content pan, see self.setZoom()
                
                createdView = new ReadiumSDK.Views.FixedView(options, self);
                break;
            case ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC:
                createdView = new ReadiumSDK.Views.ScrollView(options, false, self);
                break;
            case ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS:
                createdView = new ReadiumSDK.Views.ScrollView(options, true, self);
                break;
            default:
                createdView = new ReadiumSDK.Views.ReflowableView(options, self);
                break;
        }

        return createdView;
    };

};
