/**
 * @class 
 */
ReadiumSDK.Models.CacheManager = function() {
    var self = this;

    var _cachedViews = [];

    var _iframeRereferences = [];



    //////////////////
    // private helpers

    // we need to find whether we've already cached a particular spine item. 
    // lets ask all of the existing views for the spine items that they are 
    // holding (remember, each view may hold more than one)
    function getCachedViewForSpineItem(spineItem) {
        return _.find(_cachedViews, function(view){
            var loadedspines = view.getLoadedSpineItems();
            var foundView = _.find(loadedspines, function(spine) {
                 return spine.index === spineItem.index;
            });
            return foundView;
        });
    };


    function expireCachedItems(currentSpineItem) {
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


    // TODODM: this needs to take spine item as a parameter, not an index. maybe.
    function createPrefetchedViewForSpineItemIndex(spineItemIndex, setToPage) {
        var spineItem = _spine.items[spineItemIndex];
        var cachedView = getCachedViewForSpineItem(spineItem);
        if (cachedView === undefined) {
            var desiredViewType = deduceDesiredViewType(spineItem);

            var viewCreationParams = {
                $viewport: _$el,
                spine: _spine,
                userStyles: _userStyles,
                bookStyles: _bookStyles,
                iframeLoader: _iframeLoader,
                cachedView: true
            };

            cachedView = self.createViewForType(desiredViewType, viewCreationParams);
            var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, self);
            if (setToPage === "last") {
                openPageRequest.setLastPage();
            } else {
                openPageRequest.setFirstPage();
            }

            cachedView.render();
            cachedView.setViewSettings(_viewerSettings);
            cachedView.openPage(openPageRequest,2);
            cachedView.setCached(true);
            cachedView.hide();
        }
        return cachedView;
    };

};
