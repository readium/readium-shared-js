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
    //styles applied to the container divs
    var _userStyles = new ReadiumSDK.Collections.StyleCollection();
    //styles applied to the content documents
    var _bookStyles = new ReadiumSDK.Collections.StyleCollection();
    var _internalLinksSupport = new ReadiumSDK.Views.InternalLinksSupport(this);
    var _mediaOverlayPlayer;
    var _mediaOverlayDataInjector;
    var _iframeLoader;
    var _$el;
    var _annotationsManager = new ReadiumSDK.Views.AnnotationsManager(self, options);

    //We will call onViewportResize after user stopped resizing window
    var lazyResize = _.debounce(function() { self.handleViewportResize() }, 100);
    $(window).on("resize.ReadiumSDK.readerView", _.bind(lazyResize, self));

    if (options.el instanceof $) {
        _$el = options.el;
        console.log("** EL is a jQuery selector:" + options.el.attr('id'));
    } else {
        _$el = $(options.el);
        console.log("** EL is a string:" + _$el.attr('id'));
    }
    

    if(options.iframeLoader) {
        _iframeLoader = options.iframeLoader;
    }
    else {
        _iframeLoader = new ReadiumSDK.Views.IFrameLoader();
    }

    function createViewForType(viewType, options) {

        switch(viewType) {
            case ReadiumSDK.Views.ReaderView.VIEW_TYPE_FIXED:
                return new ReadiumSDK.Views.FixedView(options);
            case ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC:
                return new ReadiumSDK.Views.ScrollView(options, false);
            case ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS:
                return new ReadiumSDK.Views.ScrollView(options, true);
            default:
                return new ReadiumSDK.Views.ReflowableView(options);
        }

    }

    function getViewType(view) {

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

        console.error("Unrecognized view type");
        return undefined;
    }

    // returns true is view changed
    function initViewForItem(spineItem) {

         var desiredViewType;

        if(_viewerSettings.isScrollViewDoc) {
            desiredViewType = ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }
        else if(_viewerSettings.isScrollViewContinuous) {
            desiredViewType = ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }
        else if(spineItem.isFixedLayout()) {
            desiredViewType = ReadiumSDK.Views.ReaderView.VIEW_TYPE_FIXED;
        }
        else if(spineItem.isScrolledDoc()) {
            desiredViewType = ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }
        else if(spineItem.isScrolledContinuous()) {
            desiredViewType = ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }
        else {
            desiredViewType = ReadiumSDK.Views.ReaderView.VIEW_TYPE_COLUMNIZED;
        }

        if(_currentView) {

            if(getViewType(_currentView) == desiredViewType) {
                return false;
            }

            resetCurrentView();
        }

        var viewCreationParams = {
            $viewport: _$el,
            spine: _spine,
            userStyles: _userStyles,
            bookStyles: _bookStyles,
            iframeLoader: _iframeLoader
        };


        _currentView = createViewForType(desiredViewType, viewCreationParams);

        _currentView.setViewSettings(_viewerSettings);

        _currentView.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function($iframe, spineItem) {

            applySwitches($iframe);
            registerTriggers($iframe);

            _mediaOverlayDataInjector.attachMediaOverlayData($iframe, spineItem, _viewerSettings);
            _internalLinksSupport.processLinkElements($iframe, spineItem);
            _annotationsManager.attachAnnotations($iframe, spineItem);

            self.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
        });

        _currentView.on(ReadiumSDK.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, function( pageChangeData ){

            //we call on onPageChanged explicitly instead of subscribing to the ReadiumSDK.Events.PAGINATION_CHANGED by
            //mediaOverlayPlayer because we hve to guarantee that mediaOverlayPlayer will be updated before the host
            //application will be notified by the same ReadiumSDK.Events.PAGINATION_CHANGED event
            _mediaOverlayPlayer.onPageChanged(pageChangeData);

            self.trigger(ReadiumSDK.Events.PAGINATION_CHANGED, pageChangeData);
        });

        _currentView.render();

        return true;
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

        _currentView.off(ReadiumSDK.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED);

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
     * @param openBookData object with open book data:
     *
     *     openBookData.package: packageData, (required)
     *     openBookData.openPageRequest: openPageRequestData, (optional) data related to open page request
     *     openBookData.settings: readerSettings, (optional)
     *     openBookData.styles: cssStyles (optional)
     *
     *
     */
    this.openBook = function(openBookData) {

		var packageData = openBookData.package ? openBookData.package : openBookData;

        _package = new ReadiumSDK.Models.Package(packageData);

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

            if(bookMark && bookMark.idref) {

                var spineItem = _spine.getItemById(bookMark.idref);
                var isViewChanged = initViewForItem(spineItem);

                if(!isViewChanged) {
                    _currentView.setViewSettings(_viewerSettings);
                }

                self.openSpineItemElementCfi(bookMark.idref, bookMark.contentCFI, self);
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
        var spineItem = _spine.items[pageIndex];
        if(!spineItem) {
            return;
        }


        if(_package.isFixedLayout()) {
            var spineItem = _spine.items[pageIndex];
            if(!spineItem) {
                return;
            }

            pageRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
            pageRequest.setPageIndex(0);
        }
        else {

            var spineItems = this.getLoadedSpineItems();
            if(spineItems.length > 0) {
                pageRequest = new ReadiumSDK.Models.PageOpenRequest(spineItems[0], initiator);
                pageRequest.setPageIndex(pageIndex);
            }
        }

        openPage(pageRequest);
    };

    function openPage(pageRequest) {

        initViewForItem(pageRequest.spineItem);
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
     * Set CSS Styles to the reader container
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

    /**
     * Set CSS Styles to the content documents
     *
     * @method setBookStyles
     *
     * @param styles {object} style object contains selector property and declarations object
     */
    this.setBookStyles = function(styles) {

        var count = styles.length;

        for(var i = 0; i < count; i++) {
            _bookStyles.addStyle(styles[i].selector, styles[i].declarations);
        }

        if(_currentView) {
            _currentView.applyBookStyles();
        }

    };

    this.getElement = function(spineItem, selector) {

        if(_currentView) {
            return _currentView.getElement(spineItem, selector);
        }

        return undefined;

    };

    function applyStyles() {

        ReadiumSDK.Helpers.setStyles(_userStyles.getStyles(), _$el);

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
     * @method clearStyles
     */
    this.clearStyles = function() {

        _userStyles.resetStyleValues();
        applyStyles();
        _userStyles.clear();
    };

    /**
     * Resets all the custom styles set by setBookStyle callers at runtime
     *
     * @method clearBookStyles
     */
    this.clearBookStyles = function() {

        if(_currentView) {

            _bookStyles.resetStyleValues();
            _currentView.applyBookStyles();
        }

        _bookStyles.clear();
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

    this.pauseMediaOverlay = function() {

        _mediaOverlayPlayer.pause();
    };

    this.playMediaOverlay = function() {

        _mediaOverlayPlayer.play();
    };

    this.isPlayingMediaOverlay = function() {

        return _mediaOverlayPlayer.isPlaying();
    };

//
// should use ReadiumSDK.Events.SETTINGS_APPLIED instead!
//    this.setRateMediaOverlay = function(rate) {
//
//        _mediaOverlayPlayer.setRate(rate);
//    };
//    this.setVolumeMediaOverlay = function(volume){
//
//        _mediaOverlayPlayer.setVolume(volume);
//    };


    this.getVisibleMediaOverlayElements = function() {

        if(_currentView) {
            return _currentView.getVisibleMediaOverlayElements();
        }

        return [];
    };

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        if(_currentView) {
            _currentView.insureElementVisibility(spineItemId, element, initiator);
        }
    }

    this.handleViewportResize = function(){
        if (_currentView){
            _currentView.onViewportResize();
        }
    }

    /**
     * Returns current selection partial Cfi, useful for workflows that need to check whether the user has selected something.
     *
     * @method getCurrentSelectionCfi 
     * @returns {object | undefined} partial cfi object or undefined if nothing is selected
    *
     */

    this.getCurrentSelectionCfi =  function() {
        return _annotationsManager.getCurrentSelectionCfi();
    };

    /**
     * Creates a higlight based on given parameters
     *
     * @method addHighlight 
     * @param {string} spineIdRef spine idref that defines the partial Cfi
     * @param {string} CFI partial CFI (withouth the indirection step) relative to the spine index
     * @param {string} id id of the highlight. must be unique
     * @param {string} type currently "highlight" only
     *
     * @returns {object | undefined} partial cfi object of the created highlight
    *
     */

    this.addHighlight = function(spineIdRef, Cfi, id, type, styles) {
        return _annotationsManager.addHighlight(spineIdRef, Cfi, id, type, styles) ;
    };
    

    /**
     * Creates a higlight based on current selection
     *
     * @method addSelectionHighlight
     * @param {string} id id of the highlight. must be unique
     * @param {string} type currently "highlight" only
     *
     * @returns {object | undefined} partial cfi object of the created highlight
    *
     */

    this.addSelectionHighlight =  function(id, type) {
        return _annotationsManager.addSelectionHighlight(id,type);
    };

    /**
     * Removes given highlight
     *
     * @method removeHighlight
     * @param {string} id id of the highlight.
     *
     * @returns {undefined} 
    *
     */

    this.removeHighlight = function(id) {
        return _annotationsManager.removeHighlight(id);
    };


    function registerTriggers($iframe) {

        var contentDocument = $iframe[0].contentDocument;

        $('trigger', contentDocument).each(function() {
            var trigger = new ReadiumSDK.Models.Trigger(this);
            trigger.subscribe(contentDocument);

        });
    }

    // Description: Parse the epub "switch" tags and hide
    // cases that are not supported
    function applySwitches($iframe) {

        var contentDocument = $iframe[0].contentDocument;

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

        $('switch', contentDocument).each( function() {

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
};

ReadiumSDK.Views.ReaderView.VIEW_TYPE_COLUMNIZED = 1;
ReadiumSDK.Views.ReaderView.VIEW_TYPE_FIXED = 2;
ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_DOC = 3;
ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS = 4;
