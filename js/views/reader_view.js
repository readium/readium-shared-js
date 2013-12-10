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

/**
 *
 * Top level View object. Interface for view manipulation public APIs
 *
 * @class ReadiumSDK.Views.ReaderView
 *
 * */
ReadiumSDK.Views.ReaderView = function(options) {

    _.extend(this, Backbone.Events);

    var self = this;
    var _currentView = undefined;
    var _package = undefined;
    var _spine = undefined;
    var _viewerSettings = new ReadiumSDK.Models.ViewerSettings({});
    var _userStyles = new ReadiumSDK.Collections.StyleCollection();
    var _internalLinksSupport = new ReadiumSDK.Views.InternalLinksSupport(this);
    var _mediaOverlayPlayer;
    var _mediaOverlayDataInjector;
    var _iframeLoader;
    var _$el = $(options.el);
    
 

    if(options.iframeLoader) {
        _iframeLoader = options.iframeLoader;
    }
    else {
        _iframeLoader = new ReadiumSDK.Views.IFrameLoader();
    }


    function renderCurrentView(isReflowable) {

        if(_currentView){

            //current view is already rendered
            if( _currentView.isReflowable() === isReflowable) {
                return;
            }

            resetCurrentView();
        }

        var viewCreationParams = {
            $viewport: _$el,
            spine: _spine,
            userStyles: _userStyles,
            iframeLoader: _iframeLoader
        };

        if(isReflowable) {

            _currentView = new ReadiumSDK.Views.ReflowableView(viewCreationParams);
        }
        else {

            _currentView = new ReadiumSDK.Views.FixedView(viewCreationParams);
        }

        _currentView.setViewSettings(_viewerSettings);


        _currentView.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function($iframe, spineItem) {

            _mediaOverlayDataInjector.attachMediaOverlayData($iframe, spineItem, _viewerSettings);
            _internalLinksSupport.processLinkElements($iframe, spineItem);

            self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);

        });

        _currentView.on(ReadiumSDK.Events.CURRENT_VIEW_PAGINATION_CHANGED, function( pageChangeData ){

            //we call on onPageChanged explicitly instead of subscribing to the ReadiumSDK.Events.PAGINATION_CHANGED by
            //mediaOverlayPlayer because we hve to guarantee that mediaOverlayPlayer will be updated before the host
            //application will be notified by the same ReadiumSDK.Events.PAGINATION_CHANGED event
            _mediaOverlayPlayer.onPageChanged(pageChangeData);

            self.trigger(ReadiumSDK.Events.PAGINATION_CHANGED, pageChangeData);
        });

        _currentView.render();
    }

    this.getLoadedSpineItems = function() {

        if(_currentView) {
            return _currentView.getLoadedSpineItems();
        }

        return [];
    };

    function resetCurrentView() {

        if(!_currentView) {
            return;
        }

        _currentView.off(ReadiumSDK.Events.CURRENT_VIEW_PAGINATION_CHANGED);
        _currentView.remove();
        _currentView = undefined;
    }

    this.viewerSettings = function() {
        return _viewerSettings;
    };

    this.package = function() {
        return _package;
    };

    this.spine = function() {
        return _spine;
    };

    this.userStyles = function() {
        return _userStyles;
    };

    /**
     * Triggers the process of opening the book and requesting resources specified in the packageData
     *
     * @method openBook
     * @param openBookData object with open book data in format:
     * {
     *     package: packageData, (required)
     *     openPageRequest: openPageRequestData, (optional) data related to open page request
     *     settings: readerSettings, (optional)
     *     styles: cssStyles (optional)
     * }
     *
     */
    this.openBook = function(openBookData) {

		var pack = openBookData.package ? openBookData.package : openBookData;

        _package = new ReadiumSDK.Models.Package({packageData: pack});

        _spine = _package.spine;

        if(_mediaOverlayPlayer) {
            _mediaOverlayPlayer.reset();
        }

        _mediaOverlayPlayer = new ReadiumSDK.Views.MediaOverlayPlayer(self, $.proxy(onMediaPlayerStatusChanged, self));

        _mediaOverlayDataInjector = new ReadiumSDK.Views.MediaOverlayDataInjector(_package.media_overlay, _mediaOverlayPlayer);

        resetCurrentView();

        if(openBookData.settings) {
            self.updateSettings(openBookData.settings);
        }

        if(openBookData.styles) {
            self.setStyles(openBookData.styles);
        }

        if(openBookData.openPageRequest) {

            var pageRequestData = openBookData.openPageRequest;

            if(pageRequestData.idref) {

                if(pageRequestData.spineItemPageIndex) {
                    self.openSpineItemPage(pageRequestData.idref, pageRequestData.spineItemPageIndex, self);
                }
                else if(pageRequestData.elementCfi) {
                    self.openSpineItemElementCfi(pageRequestData.idref, pageRequestData.elementCfi, self);
                }
                else {
                    self.openSpineItemPage(pageRequestData.idref, 0, self);
                }
            }
            else if(pageRequestData.contentRefUrl && pageRequestData.sourceFileHref) {
                self.openContentUrl(pageRequestData.contentRefUrl, pageRequestData.sourceFileHref, self);
            }
            else {
                console.log("Invalid page request data: idref required!");
            }
        }
        else {// if we where not asked to open specific page we will open the first one

            var spineItem = _spine.first();
            if(spineItem) {
                var pageOpenRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, self);
                pageOpenRequest.setFirstPage();
                openPage(pageOpenRequest);
            }

        }

    };

    function onMediaPlayerStatusChanged(status) {
        self.trigger(ReadiumSDK.Events.MEDIA_OVERLAY_STATUS_CHANGED, status);
    }

    /**
     * Flips the page from left to right. Takes to account the page progression direction to decide to flip to prev or next page.
     * @method openPageLeft
     */
    this.openPageLeft = function() {

        if(_package.spine.isLeftToRight()) {
            self.openPagePrev();
        }
        else {
            self.openPageNext();
        }
    };

    /**
     * Flips the page from right to left. Takes to account the page progression direction to decide to flip to prev or next page.
     * @method openPageRight
     */
    this.openPageRight = function() {

        if(_package.spine.isLeftToRight()) {
            self.openPageNext();
        }
        else {
            self.openPagePrev();
        }

    };

    /**
     * Updates reader view based on the settings specified in settingsData object
     * @param settingsData
     */
    this.updateSettings = function(settingsData) {

//console.debug("UpdateSettings: " + JSON.stringify(settingsData));

        _viewerSettings.update(settingsData);

        if(_currentView && !settingsData.doNotUpdateView) {

            var bookMark = _currentView.bookmarkCurrentPage();

            _currentView.setViewSettings(_viewerSettings);

            if(bookMark) {
                self.openSpineItemElementCfi(bookMark.idref, bookMark.elementCfi, self);
            }
        }

        self.trigger(ReadiumSDK.Events.SETTINGS_APPLIED);
    };

    /**
     * Opens the next page.
     */
    this.openPageNext = function() {

        var paginationInfo = _currentView.getPaginationInfo();

        if(paginationInfo.openPages.length == 0) {
            return;
        }

        var lastOpenPage = paginationInfo.openPages[paginationInfo.openPages.length - 1];

        if(lastOpenPage.spineItemPageIndex < lastOpenPage.spineItemPageCount - 1) {
            _currentView.openPageNext(this);
            return;
        }

        var currentSpineItem = _spine.getItemById(lastOpenPage.idref);

        var nextSpineItem = _spine.nextItem(currentSpineItem);

        if(!nextSpineItem) {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(nextSpineItem, self);
        openPageRequest.setFirstPage();

        openPage(openPageRequest);
    };

    /**
     * Opens the previews page.
     */
    this.openPagePrev = function() {

        var paginationInfo = _currentView.getPaginationInfo();

        if(paginationInfo.openPages.length == 0) {
            return;
        }

        var firstOpenPage = paginationInfo.openPages[0];

        if(firstOpenPage.spineItemPageIndex > 0) {
            _currentView.openPagePrev(self);
            return;
        }

        var currentSpineItem = _spine.getItemById(firstOpenPage.idref);

        var prevSpineItem = _spine.prevItem(currentSpineItem);

        if(!prevSpineItem) {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(prevSpineItem, self);
        openPageRequest.setLastPage();

        openPage(openPageRequest);
    };

    function getSpineItem(idref) {

        if(!idref) {

            console.log("idref parameter value missing!");
            return undefined;
        }

        var spineItem = _spine.getItemById(idref);
        if(!spineItem) {
            console.log("Spine item with id " + idref + " not found!");
            return undefined;
        }

        return spineItem;

    }

    /**
     * Opens the page of the spine item with element with provided cfi
     *
     * @method openSpineItemElementCfi
     *
     * @param {string} idref Id of the spine item
     * @param {string} elementCfi CFI of the element to be shown
     * @param {object} initiator optional
     */
    this.openSpineItemElementCfi = function(idref, elementCfi, initiator) {

        var spineItem = getSpineItem(idref);

        if(!spineItem) {
            return;
        }

        var pageData = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
        if(elementCfi) {
            pageData.setElementCfi(elementCfi);
        }

        openPage(pageData);
    };

    /**
     *
     * Opens specified page index of the current spine item
     *
     * @method openPageIndex
     *
     * @param {number} pageIndex Zero based index of the page in the current spine item
     * @param {object} initiator optional
     */
    this.openPageIndex = function(pageIndex, initiator) {

        if(!_currentView) {
            return;
        }

        var pageRequest;
        if(_package.isFixedLayout()) {
            var spineItem = _spine.items[pageIndex];
            if(!spineItem) {
                return;
            }

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
            pageRequest.setPageIndex(0);
        }
        else {

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(undefined, initiator);
            pageRequest.setPageIndex(pageIndex);

        }

        openPage(pageRequest);
    };

    function openPage(pageRequest) {

        renderCurrentView(pageRequest.spineItem.isReflowable());
        _currentView.openPage(pageRequest);
    }


    /**
     *
     * Opens page index of the spine item with idref provided
     *
     * @param {string} idref Id of the spine item
     * @param {number} pageIndex Zero based index of the page in the spine item
     * @param {object} initiator optional
     */
    this.openSpineItemPage = function(idref, pageIndex, initiator) {

        var spineItem = getSpineItem(idref);

        if(!spineItem) {
            return;
        }

        var pageData = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
        if(pageIndex) {
            pageData.setPageIndex(pageIndex);
        }

        openPage(pageData);
    };

    /**
     * Set CSS Styles to the reader
     *
     * @method setStyles
     *
     * @param styles {object} style object contains selector property and declarations object
     */
    this.setStyles = function(styles) {

        var count = styles.length;

        for(var i = 0; i < count; i++) {
            _userStyles.addStyle(styles[i].selector, styles[i].declarations);
        }

        applyStyles();

    };

    this.getElement = function(spineItem, selector) {

        if(_currentView) {
            return _currentView.getElement(spineItem, selector);
        }

        return undefined;

    };

    function applyStyles() {

        ReadiumSDK.Helpers.setStyles(_userStyles.styles, _$el);

        if(_currentView) {
            _currentView.applyStyles();
        }

        _mediaOverlayPlayer.applyStyles();
    }

    //TODO: this is public function - should be JS Doc-ed
    this.mediaOverlaysOpenContentUrl = function(contentRefUrl, sourceFileHref, offset) {
        _mediaOverlayPlayer.mediaOverlaysOpenContentUrl(contentRefUrl, sourceFileHref, offset);
    };


    /**
     * Opens the content document specified by the url
     *
     * @method openContentUrl
     *
     * @param {string} contentRefUrl Url of the content document
     * @param {string | undefined} sourceFileHref Url to the file that contentRefUrl is relative to. If contentRefUrl is
     * relative ot the source file that contains it instead of the package file (ex. TOC file) We have to know the
     * sourceFileHref to resolve contentUrl relative to the package file.
     * @param {object} initiator optional
     */
    this.openContentUrl = function(contentRefUrl, sourceFileHref, initiator) {

        var combinedPath = ReadiumSDK.Helpers.ResolveContentRef(contentRefUrl, sourceFileHref);


        var hashIndex = combinedPath.indexOf("#");
        var hrefPart;
        var elementId;
        if(hashIndex >= 0) {
            hrefPart = combinedPath.substr(0, hashIndex);
            elementId = combinedPath.substr(hashIndex + 1);
        }
        else {
            hrefPart = combinedPath;
            elementId = undefined;
        }
//console.debug("============ openContentUrl - hrefPart: " + hrefPart);

        var spineItem = _spine.getItemByHref(hrefPart);
        if(!spineItem) {
            return;
        }

        self.openSpineItemElementId(spineItem.idref, elementId, initiator);

//console.debug("------- openContentUrl - elementId: " + elementId);

    };

    /**
     * Opens the page of the spine item with element with provided cfi
     *
     * @method openSpineItemElementId
     *
     * @param {string} idref Id of the spine item
     * @param {string} elementId id of the element to be shown
     * @param {object} initiator optional
     */
    this.openSpineItemElementId = function(idref, elementId, initiator) {

        var spineItem = _spine.getItemById(idref);
        if(!spineItem) {
            return;
        }

        var pageData = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);

        if(elementId){
            pageData.setElementId(elementId);
        }


        openPage(pageData);
    };

    /**
     *
     * Returns the bookmark associated with currently opened page.
     *
     * @method bookmarkCurrentPage
     *
     * @returns {string} Stringified ReadiumSDK.Models.BookmarkData object.
     */
    this.bookmarkCurrentPage = function() {
        return JSON.stringify(_currentView.bookmarkCurrentPage());
    };

    /**
     * Resets all the custom styles set by setStyle callers at runtime
     *
     * @method resetStyles
     */
    this.clearStyles = function() {

        var styles = _userStyles.styles;
        var count = styles.length;

        for(var i = 0; i < count; i++) {

            var style = styles[i];
            var declarations = style.declarations;

            for(var prop in declarations) {
                if(declarations.hasOwnProperty(prop)) {
                    declarations[prop] = '';
                }
            }
        }

        self.applyStyles();

        _userStyles.clear();
    };

    /**
     *
     * Returns true if media overlay available for one of the open pages.
     *
     * @method isMediaOverlayAvailable
     *
     * @returns {boolean}
     */
    this.isMediaOverlayAvailable = function() {

        return _mediaOverlayPlayer.isMediaOverlayAvailable();
    };

/*
    this.setMediaOverlaySkippables = function(items) {

        _mediaOverlayPlayer.setMediaOverlaySkippables(items);
    };

    this.setMediaOverlayEscapables = function(items) {

        _mediaOverlayPlayer.setMediaOverlayEscapables(items);
    };
*/

    /**
     * Starts/Stop playing media overlay on current page
     *
     */
    this.toggleMediaOverlay = function() {

        _mediaOverlayPlayer.toggleMediaOverlay();
    };


    /**
    * Plays next fragment media overlay
    *
    */
   this.nextMediaOverlay = function() {

        _mediaOverlayPlayer.nextMediaOverlay();

   };

    /**
     * Plays previous fragment media overlay
     *
     */
    this.previousMediaOverlay = function() {

        _mediaOverlayPlayer.previousMediaOverlay();

    };

    /**
     * Plays next available fragment media overlay that is outside of the current escapable scope
     *
     */
    this.escapeMediaOverlay = function() {

        _mediaOverlayPlayer.escape();
    };

    this.ttsEndedMediaOverlay = function() {

        _mediaOverlayPlayer.onTTSEnd();
    };


    this.getVisibleMediaOverlayElements = function() {

        if(_currentView) {
            return _currentView.getVisibleMediaOverlayElements();
        }

        return [];
    };

    this.insureElementVisibility = function(element, initiator) {

        if(_currentView) {
            _currentView.insureElementVisibility(element, initiator);
        }
    }

    // REfactor with boris
    function setPackageDocument(packageDoc) {
        var parser = new window.DOMParser;
        if (_.isString(packageDoc))
            this.packageDoc = parser.parseFromString(packageDoc, "text/xml");
        else
            this.packageDoc = packageDoc;
    };

    this.isThisCfiForVisibleSpineItems = function(CFI){ 
        var result = false;
        self.forEachVisibleSpineItemThatMatchesCfi(CFI, function() {
            result = true;
        });
        return result;
    };

    function createFullyQualifiedCfi(cfi, spineIndex) {
        if (cfi === undefined)
            return undefined;
        var packageDocCFIComponent = EPUBcfi.generatePackageDocumentCFIComponentWithSpineIndex(spineIndex, this.packageDoc);
        var completeCFI = EPUBcfi.generateCompleteCFI(packageDocCFIComponent, cfi);
        return completeCFI;
    };


    function getAnnotaitonsManagerForCurrentSpineItem() {
        // TODO DM this needs to be abstracted better. should be the same handler regardless of whether it's reflowable or fixed.
        if (self.currentView.isReflowable())
            return {"annotationManager": self.currentView.annotations, "spineItemIndex" : self.currentView.spineItemIndex};
        else
            return self.currentView.getAnnotaitonsManagerForCurrentSpineItem();
    };

    this.getCurrentSelectionCFI =  function() {
        var cfi = undefined;
        _currentView.getDisplayingViews().forEach(function(view) {
                cfi = view.annotations.getCurrentSelectionCFI();
                cfi = self.createFullyQualifiedCfi(cfi, view.currentSpineItem.index);
                if (cfi)
                    return false;
        });
        return cfi;
    };

    this.addHighlight = function(CFI, id, type, styles) {
        var paginationInfo = _currentView.getPaginationInfo();
        var contentDocHrefFromCfi = EPUBcfi.getContentDocHref(CFI, this.packageDoc);
        var spineFromCfi = _spine.getItemByHref(contentDocHrefFromCfi);
        var result = undefined;
        _currentView.getDisplayingViews().forEach(function(view) {
            if (view.currentSpineItem.idref === spineFromCfi.idref)
            {
                result = view.annotations.addHighlight(CFI, id, type, styles);
                return false;
            }
        });
        return result;
    };

    this.updateAnnotationView = function(id, styles) {
        return self.getAnnotaitonsManagerForCurrentSpineItem().updateAnnotationView(id, styles);
    };

    
    this.addSelectionHighlight =  function(id, type) {
        var annotation;
        var spineItemIndex;
        _currentView.getDisplayingViews().forEach(function(view) {
            if (view.annotations.getCurrentSelectionCFI()) {
                annotation = view.annotations.addSelectionHighlight(id, type);
                spineItemIndex = view.currentSpineItem.index;
                return false;
            }
        });
        annotation.CFI = createFullyQualifiedCfi(annotation.CFI, spineItemIndex); 
        return annotation; 
    };

    this.showPageByCFI  = function (CFI, callback, callbackContext) {
        var contentDocHref = EPUBcfi.getContentDocHref(CFI, this.packageDoc);
        var spine = _spine.getItemByHref(contentDocHref);
        var idref = spine.idref;
        var targetElementCFI; 

        // TODODM: this is hacky replace it properly
        // what i'm doing here is essentially saying that we only expect one indirection step
        // between package document and content document. to properly make this work, we need
        // to wait until the content document is open and resolve the indirection then? 
        // at least that's hwo justin does it.
        var cfiWrapperPattern = new RegExp("^.*!")
        // remove epubcfi( and indirection step
        var partiallyNakedCfi = CFI.replace(cfiWrapperPattern, "");
        // remove last paren
        var nakedCfi = partiallyNakedCfi.substring(0, partiallyNakedCfi.length -1);
        console.log("idref: " + idref + " nakedCfi=" + nakedCfi);
        return self.openSpineItemElementCfi(idref, nakedCfi);
    }; 

    this.removeAnnotation = function(id) {
        var result;
        _currentView.getDisplayingViews().forEach(function(view) {
            console.log("Remove annotation=" + id);
            result = view.annotations.removeHighlight(id);
        });
        return result;
    }; 

    this.getCfiForCurrentPage = function() {
        var bookmark = $.parseJSON(self.bookmarkCurrentPage());
        return createFullyQualifiedCfi(bookmark.contentCFI)
    };

    // refactor with boris?
    // needs a comment as to why this is needed
    // TODO DM
    this.redraw = function() {
        _currentView.getDisplayingViews().forEach(function(view) {
            view.onViewportResize();
        });
    };

    this.getVisibleAnnotationMidpoints = function () {
        var midpointsArray = [];
        _currentView.getDisplayingViews().forEach(function(view) {
            var visibleMidpoints = view.getVisibleAnnotationMidpoints();
            midpointsArray = midpointsArray.concat(visibleMidpoints);
        });
        return midpointsArray;
    };

    this.isVisibleCFI =  function(cfi) {
        return this.isThisCfiForCurrentSpineItem(cfi) && _currentView.isVisibleCFI(cfi);
    };

    function forEachVisibleSpineItem(callback) {
        var paginationInfo = _currentView.getPaginationInfo();
        _.each(paginationInfo.openPages, function(openPage) {
            callback(openPage);
        });
    };

    function forEachVisibleSpineItemThatMatchesCfi(cfi, callback) {
        var idref = getSpineIdRefFromCfi(cfi);
        var result = undefined;
        forEachVisibleSpineItem(function(page){
           if (idref === page.idref) 
           {
               result = callback(page);
               return false;
           }
        });
        return result;
    };

    function getSpineIdRefFromCfi(cfi) {
        var contentDocHrefFromCfi = EPUBcfi.getContentDocHref(cfi, this.packageDoc);
        var spineFromCfi = _spine.getItemByHref(contentDocHrefFromCfi);
        return spineFromCfi.idref;
    };


};
