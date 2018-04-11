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

define(["../globals", "jquery", "underscore", "eventEmitter", "./fixed_view", "../helpers", "./iframe_loader", "./internal_links_support",
        "./media_overlay_data_injector", "./media_overlay_player", "../models/package", "../models/metadata", "../models/page_open_request",
        "./reflowable_view", "./scroll_view", "../models/style_collection", "../models/switches", "../models/trigger",
        "../models/viewer_settings", "../models/bookmark_data", "../models/node_range_info", "./external_agent_support"],
    function (Globals, $, _, EventEmitter, FixedView, Helpers, IFrameLoader, InternalLinksSupport,
              MediaOverlayDataInjector, MediaOverlayPlayer, Package, Metadata, PageOpenRequest,
              ReflowableView, ScrollView, StyleCollection, Switches, Trigger,
              ViewerSettings, BookmarkData, NodeRangeInfo, ExternalAgentSupport) {
/**
 * Options passed on the reader from the readium loader/initializer
 *
 * @typedef {object} Globals.Views.ReaderView.ReaderOptions
 * @property {jQueryElement|string} el   The element the reader view should create itself in. Can be a jquery wrapped element or a query selector.
 * @property {Globals.Views.IFrameLoader} iframeLoader   An instance of an iframe loader or one expanding it.
 * @property {boolean} needsFixedLayoutScalerWorkAround
 */

/**
 * Top level View object. Interface for view manipulation public APIs
 * @param {Views.ReaderView.ReaderOptions} options
 * @constructor
 */
var ReaderView = function (options) {
    $.extend(this, new EventEmitter());

    var self = this;
    var _currentView = undefined;
    var _package = undefined;
    var _metadata = undefined;
    var _spine = undefined;
    var _viewerSettings = new ViewerSettings({});
    //styles applied to the container divs
    var _userStyles = new StyleCollection();
    //styles applied to the content documents
    var _bookStyles = new StyleCollection();
    var _internalLinksSupport = new InternalLinksSupport(this);
    var _externalAgentSupport = new ExternalAgentSupport(this);
    var _mediaOverlayPlayer;
    var _mediaOverlayDataInjector;
    var _iframeLoader;
    var _$el;

    //We will call onViewportResize after user stopped resizing window
    var lazyResize = Helpers.extendedThrottle(
        handleViewportResizeStart,
        handleViewportResizeTick,
        handleViewportResizeEnd, 250, 1000, self);

    $(window).on("resize.ReadiumSDK.readerView", lazyResize);

    this.fonts = options.fonts;


    if (options.el instanceof $) {
        _$el = options.el;
        console.log("** EL is a jQuery selector:" + options.el.attr('id'));
    } else {
        _$el = $(options.el);
        console.log("** EL is a string:" + _$el.attr('id'));
    }

    if (options.iframeLoader) {
        _iframeLoader = options.iframeLoader;
    }
    else {
        _iframeLoader = new IFrameLoader({mathJaxUrl: options.mathJaxUrl});
    }


    _needsFixedLayoutScalerWorkAround = options.needsFixedLayoutScalerWorkAround;
    /**
     * @returns {boolean}
     */
    this.needsFixedLayoutScalerWorkAround = function () {
        return _needsFixedLayoutScalerWorkAround;
    };

    /**
     * Create a view based on the given view type.
     * @param {Views.ReaderView.ViewType} viewType
     * @param {Views.ReaderView.ViewCreationOptions} options
     * @returns {*}
     */
    this.createViewForType = function (viewType, options) {
        var createdView;

        // NOTE: _$el == options.$viewport
        _$el.css("overflow", "hidden");

        switch (viewType) {
            case ReaderView.VIEW_TYPE_FIXED:

                _$el.css("overflow", "auto"); // for content pan, see self.setZoom()

                createdView = new FixedView(options, self);
                break;
            case ReaderView.VIEW_TYPE_SCROLLED_DOC:
                createdView = new ScrollView(options, false, self);
                break;
            case ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS:
                createdView = new ScrollView(options, true, self);
                break;
            default:
                createdView = new ReflowableView(options, self);
                break;
        }

        return createdView;
    };

    /**
     * Returns the current view type of the reader view
     * @returns {ReaderView.ViewType}
     */
    this.getCurrentViewType = function () {

        if (!_currentView) {
            return undefined;
        }

        if (_currentView instanceof ReflowableView) {
            return ReaderView.VIEW_TYPE_COLUMNIZED;
        }

        if (_currentView instanceof FixedView) {
            return ReaderView.VIEW_TYPE_FIXED;
        }

        if (_currentView instanceof ScrollView) {
            if (_currentView.isContinuousScroll()) {
                return ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
            }

            return ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        console.error("Unrecognized view type");
        return undefined;
    };

    this.getCurrentView = function () {
        return _currentView;
    };

    //based on https://docs.google.com/spreadsheet/ccc?key=0AoPMUkQhc4wcdDI0anFvWm96N0xRT184ZE96MXFRdFE&usp=drive_web#gid=0 document
    function deduceDesiredViewType(spineItem) {

        //check settings
        if (_viewerSettings.scroll == "scroll-doc") {
            return ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        if (_viewerSettings.scroll == "scroll-continuous") {
            return ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        //is fixed layout ignore flow
        if (spineItem.isFixedLayout()) {
            return ReaderView.VIEW_TYPE_FIXED;
        }

        //flow
        if (spineItem.isFlowScrolledDoc()) {
            return ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        if (spineItem.isFlowScrolledContinuous()) {
            return ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        return ReaderView.VIEW_TYPE_COLUMNIZED;
    }

    // returns true is view changed
    function initViewForItem(spineItem, callback) {

        var desiredViewType = deduceDesiredViewType(spineItem);

        if (_currentView) {

            if (self.getCurrentViewType() == desiredViewType) {
                callback(false);
                return;
            }

            resetCurrentView();
        }

        /**
         * View creation options
         * @typedef {object} Globals.Views.ReaderView.ViewCreationOptions
         * @property {jQueryElement} $viewport  The view port element the reader view has created.
         * @property {Globals.Models.Spine} spine The spine item collection object
         * @property {Globals.Collections.StyleCollection} userStyles User styles
         * @property {Globals.Collections.StyleCollection} bookStyles Book styles
         * @property {Globals.Views.IFrameLoader} iframeLoader   An instance of an iframe loader or one expanding it.
         */
        var viewCreationParams = {
            $viewport: _$el,
            spine: _spine,
            userStyles: _userStyles,
            bookStyles: _bookStyles,
            iframeLoader: _iframeLoader
        };


        _currentView = self.createViewForType(desiredViewType, viewCreationParams);
        
        Globals.logEvent("READER_VIEW_CREATED", "EMIT", "reader_view.js");
        self.emit(Globals.Events.READER_VIEW_CREATED, desiredViewType);

        _currentView.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            var contentDoc = $iframe[0].contentDocument;

            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "ON", "reader_view.js (current view) [ " + spineItem.href + " ]");

            if (!Helpers.isIframeAlive($iframe[0])) return;

            // performance degrades with large DOM (e.g. word-level text-audio sync)
            _mediaOverlayDataInjector.attachMediaOverlayData($iframe, spineItem, _viewerSettings);

            _internalLinksSupport.processLinkElements($iframe, spineItem);

            _externalAgentSupport.bindToContentDocument(contentDoc, spineItem);

            Trigger.register(contentDoc);
            Switches.apply(contentDoc);

            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "reader_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
        });

        _currentView.on(Globals.Events.CONTENT_DOCUMENT_LOAD_START, function ($iframe, spineItem) {

            Globals.logEvent("CONTENT_DOCUMENT_LOAD_START", "EMIT", "reader_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOAD_START, $iframe, spineItem);
        });

        _currentView.on(Globals.Events.CONTENT_DOCUMENT_UNLOADED, function ($iframe, spineItem) {
            
            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "reader_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, $iframe, spineItem);
        });

        _currentView.on(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, function (pageChangeData) {
            
            Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "ON", "reader_view.js");

            //we call on onPageChanged explicitly instead of subscribing to the Globals.Events.PAGINATION_CHANGED by
            //mediaOverlayPlayer because we hve to guarantee that mediaOverlayPlayer will be updated before the host
            //application will be notified by the same Globals.Events.PAGINATION_CHANGED event
            _mediaOverlayPlayer.onPageChanged(pageChangeData);

            _.defer(function () {
                Globals.logEvent("PAGINATION_CHANGED", "EMIT", "reader_view.js");
                self.emit(Globals.Events.PAGINATION_CHANGED, pageChangeData);
                
                if (!pageChangeData.spineItem) return;
                _.defer(function () {
                    _externalAgentSupport.updateContentDocument(pageChangeData.spineItem);
                });
            });
        });

        _currentView.on(Globals.Events.FXL_VIEW_RESIZED, function () {
            Globals.logEvent("FXL_VIEW_RESIZED", "EMIT", "reader_view.js");
            self.emit(Globals.Events.FXL_VIEW_RESIZED);
        })

        _currentView.render();

        var docWillChange = true;
        _currentView.setViewSettings(_viewerSettings, docWillChange);

        // we do this to wait until elements are rendered otherwise book is not able to determine view size.
        setTimeout(function () {

            callback(true);

        }, 50);

    }

    /**
     * Returns a list of the currently active spine items
     *
     * @returns {Models.SpineItem[]}
     */
    this.getLoadedSpineItems = function () {

        if (_currentView) {
            return _currentView.getLoadedSpineItems();
        }

        return [];
    };

    function resetCurrentView() {

        if (!_currentView) {
            return;
        }

        Globals.logEvent("READER_VIEW_DESTROYED", "EMIT", "reader_view.js");
        self.emit(Globals.Events.READER_VIEW_DESTROYED);


        Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "OFF", "reader_view.js");
        _currentView.off(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED);
        
        _currentView.remove();
        _currentView = undefined;
    }

    /**
     * Returns the currently instanced viewer settings
     *
     * @returns {Models.ViewerSettings}
     */
    this.viewerSettings = function () {
        return _viewerSettings;
    };

    /**
     * Returns a data object based on the package document
     *
     * @returns {Models.Package}
     */
    this.package = function () {
        return _package;
    };

    /**
     * Returns a data object based on the package document metadata
     *
     * @returns {Models.Metadata}
     */
    this.metadata = function () {
        return _metadata;
    };

    /**
     * Returns a representation of the spine as a data object, also acts as list of spine items
     *
     * @returns {Models.Spine}
     */
    this.spine = function () {
        return _spine;
    };

    /**
     * Returns the user CSS styles collection
     *
     * @returns {Collections.StyleCollection}
     */
    this.userStyles = function () {
        return _userStyles;
    };

    /**
     * Open Book Data
     *
     * @typedef {object} Globals.Views.ReaderView.OpenBookData
     * @property {Globals.Models.Package} package - packageData (required)
     * @property {Globals.Models.PageOpenRequest} openPageRequest - openPageRequestData, (optional) data related to open page request
     * @property {Globals.Views.ReaderView.SettingsData} [settings]
     * @property {Globals.Collections.StyleCollection} styles: [cssStyles]
     * @todo Define missing types
     */

    /**
     * Triggers the process of opening the book and requesting resources specified in the packageData
     *
     * @param {Views.ReaderView.OpenBookData} openBookData Open book data object
     */
    this.openBook = function (openBookData) {

        var packageData = openBookData.package ? openBookData.package : openBookData;

        _package = new Package(packageData);
        _metadata = new Metadata(packageData.metadata);

        _spine = _package.spine;
        _spine.handleLinear(true);

        if (_mediaOverlayPlayer) {
            _mediaOverlayPlayer.reset();
        }

        _mediaOverlayPlayer = new MediaOverlayPlayer(self, $.proxy(onMediaPlayerStatusChanged, self));
        _mediaOverlayPlayer.setAutomaticNextSmil(_viewerSettings.mediaOverlaysAutomaticPageTurn ? true : false); // just to ensure the internal var is set to the default settings (user settings are applied below at self.updateSettings(openBookData.settings);)

        _mediaOverlayDataInjector = new MediaOverlayDataInjector(_package.media_overlay, _mediaOverlayPlayer);


        resetCurrentView();

        if (openBookData.settings) {
            self.updateSettings(openBookData.settings);
        }

        if (openBookData.styles) {
            self.setStyles(openBookData.styles);
        }

        var pageRequestData = undefined;

        if (openBookData.openPageRequest && typeof(openBookData.openPageRequest) === 'function') {
            openBookData.openPageRequest = openBookData.openPageRequest();
        }

        if (openBookData.openPageRequest) {

            if (openBookData.openPageRequest.idref || (openBookData.openPageRequest.contentRefUrl && openBookData.openPageRequest.sourceFileHref)) {
                pageRequestData = openBookData.openPageRequest;
            }
            else {
                console.log("Invalid page request data: idref required!");
            }
        }

        var fallback = false;
        if (pageRequestData) {

            pageRequestData = openBookData.openPageRequest;

            try {
                if (pageRequestData.idref) {

                    if (pageRequestData.spineItemPageIndex) {
                        fallback = !self.openSpineItemPage(pageRequestData.idref, pageRequestData.spineItemPageIndex, self);
                    }
                    else if (pageRequestData.elementCfi) {
                        fallback = !self.openSpineItemElementCfi(pageRequestData.idref, pageRequestData.elementCfi, self);
                    }
                    else {
                        fallback = !self.openSpineItemPage(pageRequestData.idref, 0, self);
                    }
                }
                else {
                    fallback = !self.openContentUrl(pageRequestData.contentRefUrl, pageRequestData.sourceFileHref, self);
                }
            } catch (err) {
                console.error("openPageRequest fail: fallback to first page!")
                console.log(err);
                fallback = true;
            }
        }
        else {
            fallback = true;
        }

        if (fallback) {// if we where not asked to open specific page we will open the first one

            var spineItem = _spine.first();
            if (spineItem) {
                var pageOpenRequest = new PageOpenRequest(spineItem, self);
                pageOpenRequest.setFirstPage();
                openPage(pageOpenRequest, 0);
            }

        }

    };

    function onMediaPlayerStatusChanged(status) {

        Globals.logEvent("MEDIA_OVERLAY_STATUS_CHANGED", "EMIT", "reader_view.js (via MediaOverlayPlayer + AudioPlayer)");
        self.emit(Globals.Events.MEDIA_OVERLAY_STATUS_CHANGED, status);
    }

    /**
     * Flips the page from left to right.
     * Takes to account the page progression direction to decide to flip to prev or next page.
     */
    this.openPageLeft = function () {

        if (_package.spine.isLeftToRight()) {
            self.openPagePrev();
        }
        else {
            self.openPageNext();
        }
    };

    /**
     * Flips the page from right to left.
     * Takes to account the page progression direction to decide to flip to prev or next page.
     */
    this.openPageRight = function () {

        if (_package.spine.isLeftToRight()) {
            self.openPageNext();
        }
        else {
            self.openPagePrev();
        }

    };

    /**
     * Returns if the current child view is an instance of a fixed page view
     *
     * @returns {boolean}
     */
    this.isCurrentViewFixedLayout = function () {
        return _currentView instanceof FixedView;
    };

    /**
     * Zoom options
     *
     * @typedef {object} Globals.Views.ReaderView.ZoomOptions
     * @property {string} style - "user"|"fit-screen"|"fit-width"
     * @property {number} scale - 0.0 to 1.0
     */

    /**
     * Set the zoom options.
     *
     * @param {Views.ReaderView.ZoomOptions} zoom Zoom options
     */
    this.setZoom = function (zoom) {
        // zoom only handled by fixed layout views
        if (self.isCurrentViewFixedLayout()) {
            _currentView.setZoom(zoom);
        }
    };

    /**
     * Returns the current view scale as a percentage
     *
     * @returns {number}
     */
    this.getViewScale = function () {
        if (self.isCurrentViewFixedLayout()) {
            return 100 * _currentView.getViewScale();
        }
        else {
            return 100;
        }
    };

    /**
     * Settings Data
     *
     * @typedef {object} Globals.Views.ReaderView.SettingsData
     * @property {number} fontSize - Font size as percentage
     * @property {number} fontSelection - Font selection as the number in the list of possible fonts, where 0 is special meaning default.
     * @property {(string|boolean)} syntheticSpread - "auto"|"single"|"double"
     * @property {(string|boolean)} scroll - "auto"|true|false
     * @property {boolean} doNotUpdateView - Indicates whether the view should be updated after the settings are applied
     * @property {boolean} mediaOverlaysEnableClick - Indicates whether media overlays are interactive on mouse clicks
     */

    /**
     * Updates reader view based on the settings specified in settingsData object
     *
     * @param {Globals.Views.ReaderView.SettingsData} settingsData Settings data
     * @fires Globals.Events.SETTINGS_APPLIED
     */
    this.updateSettings = function (settingsData) {

//console.debug("UpdateSettings: " + JSON.stringify(settingsData));

        _viewerSettings.update(settingsData);

        if (_mediaOverlayPlayer) {
            _mediaOverlayPlayer.setAutomaticNextSmil(_viewerSettings.mediaOverlaysAutomaticPageTurn ? true : false);
        }

        if (_currentView && !settingsData.doNotUpdateView) {

            var bookMark = _currentView.bookmarkCurrentPage();

            if (bookMark && bookMark.idref) {

                var wasPlaying = false;
                if (_currentView.isReflowable && _currentView.isReflowable()) {
                    wasPlaying = self.isPlayingMediaOverlay();
                    if (wasPlaying) {
                        self.pauseMediaOverlay();
                    }
                }

                var spineItem = _spine.getItemById(bookMark.idref);

                initViewForItem(spineItem, function (isViewChanged) {

                    if (!isViewChanged) {
                        var docWillChange = false;
                        _currentView.setViewSettings(_viewerSettings, docWillChange);
                    }

                    self.once(ReadiumSDK.Events.PAGINATION_CHANGED, function (pageChangeData)
                    {
                        var cfi = new BookmarkData(bookMark.idref, bookMark.contentCFI);
                        self.debugBookmarkData(cfi);
                    });

                    self.openSpineItemElementCfi(bookMark.idref, bookMark.contentCFI, self);

                    if (wasPlaying) {
                        self.playMediaOverlay();
                        // setTimeout(function()
                        // {
                        // }, 60);
                    }

                    Globals.logEvent("SETTINGS_APPLIED 1 (view update)", "EMIT", "reader_view.js");
                    self.emit(Globals.Events.SETTINGS_APPLIED);
                });
                
                return;
            }
        }

        Globals.logEvent("SETTINGS_APPLIED 2 (no view update)", "EMIT", "reader_view.js");
        self.emit(Globals.Events.SETTINGS_APPLIED);
    };

    /**
     * Opens the next page.
     */
    this.openPageNext = function () {

        if (self.getCurrentViewType() === ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS) {
            _currentView.openPageNext(self);
            return;
        }

        var paginationInfo = _currentView.getPaginationInfo();

        if (paginationInfo.openPages.length == 0) {
            return;
        }

        var lastOpenPage = paginationInfo.openPages[paginationInfo.openPages.length - 1];

        if (lastOpenPage.spineItemPageIndex < lastOpenPage.spineItemPageCount - 1) {
            _currentView.openPageNext(self);
            return;
        }

        var currentSpineItem = _spine.getItemById(lastOpenPage.idref);

        var nextSpineItem = _spine.nextItem(currentSpineItem);

        if (!nextSpineItem) {
            return;
        }

        var openPageRequest = new PageOpenRequest(nextSpineItem, self);
        openPageRequest.setFirstPage();

        openPage(openPageRequest, 2);
    };

    /**
     * Opens the previous page.
     */
    this.openPagePrev = function () {

        if (self.getCurrentViewType() === ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS) {
            _currentView.openPagePrev(self);
            return;
        }

        var paginationInfo = _currentView.getPaginationInfo();

        if (paginationInfo.openPages.length == 0) {
            return;
        }

        var firstOpenPage = paginationInfo.openPages[0];

        if (firstOpenPage.spineItemPageIndex > 0) {
            _currentView.openPagePrev(self);
            return;
        }

        var currentSpineItem = _spine.getItemById(firstOpenPage.idref);

        var prevSpineItem = _spine.prevItem(currentSpineItem);

        if (!prevSpineItem) {
            return;
        }

        var openPageRequest = new PageOpenRequest(prevSpineItem, self);
        openPageRequest.setLastPage();

        openPage(openPageRequest, 1);
    };

    function getSpineItem(idref) {

        if (!idref) {

            console.log("idref parameter value missing!");
            return undefined;
        }

        var spineItem = _spine.getItemById(idref);
        if (!spineItem) {
            console.log("Spine item with id " + idref + " not found!");
            return undefined;
        }

        return spineItem;

    }

    /**
     * Opens the page of the spine item with element with provided cfi
     *
     * @param {string} idref Id of the spine item
     * @param {string} elementCfi CFI of the element to be shown
     * @param {object} initiator optional
     */
    this.openSpineItemElementCfi = function (idref, elementCfi, initiator) {

        var spineItem = getSpineItem(idref);

        if (!spineItem) {
            return false;
        }

        var pageData = new PageOpenRequest(spineItem, initiator);
        if (elementCfi) {
            pageData.setElementCfi(elementCfi);
        }

        openPage(pageData, 0);

        return true;
    };

    /**
     * Opens specified page index of the current spine item
     *
     * @param {number} pageIndex Zero based index of the page in the current spine item
     * @param {object} initiator optional
     */
    this.openPageIndex = function (pageIndex, initiator) {

        if (!_currentView) {
            return false;
        }

        var pageRequest;

        if (_package.isFixedLayout()) {
            var spineItem = _spine.items[pageIndex];
            if (!spineItem) {
                return false;
            }

            pageRequest = new PageOpenRequest(spineItem, initiator);
            pageRequest.setPageIndex(0);
        }
        else {

            var spineItems = this.getLoadedSpineItems();
            if (spineItems.length > 0) {
                pageRequest = new PageOpenRequest(spineItems[0], initiator);
                pageRequest.setPageIndex(pageIndex);
            }
        }

        openPage(pageRequest, 0);

        return true;
    };

    // dir: 0 => new or same page, 1 => previous, 2 => next
    function openPage(pageRequest, dir) {

        initViewForItem(pageRequest.spineItem, function (isViewChanged) {

            if (!isViewChanged) {
                var docWillChange = true;
                _currentView.setViewSettings(_viewerSettings, docWillChange);
            }

            _currentView.openPage(pageRequest, dir);
        });
    }


    /**
     * Opens page index of the spine item with idref provided
     *
     * @param {string} idref Id of the spine item
     * @param {number} pageIndex Zero based index of the page in the spine item
     * @param {object} initiator optional
     */
    this.openSpineItemPage = function (idref, pageIndex, initiator) {

        var spineItem = getSpineItem(idref);

        if (!spineItem) {
            return false;
        }

        var pageData = new PageOpenRequest(spineItem, initiator);
        if (pageIndex) {
            pageData.setPageIndex(pageIndex);
        }

        openPage(pageData, 0);

        return true;
    };

    /**
     * Set CSS Styles to the reader container
     *
     * @param {Collections.StyleCollection} styles   Style collection containing selector property and declarations object
     * @param {boolean} doNotUpdateView                         Whether to update the view after the styles are applied.
     */
    this.setStyles = function (styles, doNotUpdateView) {

        var count = styles.length;

        for (var i = 0; i < count; i++) {
            if (styles[i].declarations) {
                _userStyles.addStyle(styles[i].selector, styles[i].declarations);
            }
            else {
                _userStyles.removeStyle(styles[i].selector);
            }
        }

        applyStyles(doNotUpdateView);

    };

    /**
     * Set CSS Styles to the content documents
     *
     * @param {Collections.StyleCollection} styles    Style collection containing selector property and declarations object
     */
    this.setBookStyles = function (styles) {

        var count = styles.length;

        for (var i = 0; i < count; i++) {
            if (styles[i].declarations) {
                _bookStyles.addStyle(styles[i].selector, styles[i].declarations);
            }
            else {
                _bookStyles.removeStyle(styles[i].selector);
            }
        }

        if (_currentView) {
            _currentView.applyBookStyles();
        }

    };

    /**
     * Gets an element from active content documents based on a query selector.
     *
     * @param {Models.SpineItem} spineItem       The spine item object associated with an active content document
     * @param {string} selector                      The query selector
     * @returns {HTMLElement|undefined}
     */
    this.getElement = function (spineItemIdref, selector) {

        if (_currentView) {
            return _currentView.getElement(spineItemIdref, selector);
        }

        return undefined;
    };

    /**
     * Gets an element from active content documents based on an element id.
     *
     * @param {string} spineItemIdref      The spine item idref associated with an active content document
     * @param {string} id                                  The element id
     * @returns {HTMLElement|undefined}
     */
    this.getElementById = function (spineItemIdref, id) {

        if (_currentView) {
            return _currentView.getElementById(spineItemIdref, id);
        }

        return undefined;
    };

    /**
     * Gets an element from active content documents based on a content CFI.
     *
     * @param {string} spineItemIdref     The spine item idref associated with an active content document
     * @param {string} cfi                                The partial content CFI
     * @param {string[]} [classBlacklist]
     * @param {string[]} [elementBlacklist]
     * @param {string[]} [idBlacklist]
     * @returns {HTMLElement|undefined}
     */
    this.getElementByCfi = function (spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if (_currentView) {
            return _currentView.getElementByCfi(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist);
        }

        return undefined;

    };

    function applyStyles(doNotUpdateView) {

        Helpers.setStyles(_userStyles.getStyles(), _$el);

        if (_mediaOverlayPlayer)
            _mediaOverlayPlayer.applyStyles();

        if (doNotUpdateView) return;

        if (_currentView) {
            _currentView.applyStyles();
        }
    }

    /**
     * Opens a content url from a media player context
     *
     * @param {string} contentRefUrl
     * @param {string} sourceFileHref
     * @param offset
     */
    this.mediaOverlaysOpenContentUrl = function (contentRefUrl, sourceFileHref, offset) {
        _mediaOverlayPlayer.mediaOverlaysOpenContentUrl(contentRefUrl, sourceFileHref, offset);
    };


    /**
     * Opens the content document specified by the url
     *
     * @param {string} contentRefUrl Url of the content document
     * @param {string | undefined} sourceFileHref Url to the file that contentRefUrl is relative to. If contentRefUrl is
     * relative ot the source file that contains it instead of the package file (ex. TOC file) We have to know the
     * sourceFileHref to resolve contentUrl relative to the package file.
     * @param {object} initiator optional
     */
    this.openContentUrl = function (contentRefUrl, sourceFileHref, initiator) {

        var combinedPath = Helpers.ResolveContentRef(contentRefUrl, sourceFileHref);

        var hashIndex = combinedPath.indexOf("#");
        var hrefPart;
        var elementId;
        if (hashIndex >= 0) {
            hrefPart = combinedPath.substr(0, hashIndex);
            elementId = combinedPath.substr(hashIndex + 1);
        }
        else {
            hrefPart = combinedPath;
            elementId = undefined;
        }

        var spineItem = _spine.getItemByHref(hrefPart);
        if (!spineItem) {
            console.warn('spineItem ' + hrefPart + ' not found');
            // sometimes that happens because spine item's URI gets encoded,
            // yet it's compared with raw strings by `getItemByHref()` -
            // so we try to search with decoded link as well
            var decodedHrefPart = decodeURIComponent(hrefPart);
            spineItem = _spine.getItemByHref(decodedHrefPart);
            if (!spineItem) {
                console.warn('decoded spineItem ' + decodedHrefPart + ' missing as well');
                return false;
            }
        }

        return self.openSpineItemElementId(spineItem.idref, elementId, initiator);
    };

    /**
     * Opens the page of the spine item with element with provided cfi
     *
     * @param {string} idref Id of the spine item
     * @param {string} elementId id of the element to be shown
     * @param {object} initiator optional
     */
    this.openSpineItemElementId = function (idref, elementId, initiator) {

        var spineItem = _spine.getItemById(idref);
        if (!spineItem) {
            return false;
        }

        var pageData = new PageOpenRequest(spineItem, initiator);

        if (elementId) {
            pageData.setElementId(elementId);
        }


        openPage(pageData, 0);

        return true;
    };

    //var cfi = new BookmarkData(bookmark.idref, bookmark.contentCFI);
    this.debugBookmarkData = function(cfi) {

        if (!ReadiumSDK) return;

        var DEBUG = true; // change this to visualize the CFI range
        if (!DEBUG) return;
            
        var paginationInfo = this.getPaginationInfo();
        console.log(JSON.stringify(paginationInfo));
        
        if (paginationInfo.isFixedLayout) return;
    
        try {
            ReadiumSDK._DEBUG_CfiNavigationLogic.clearDebugOverlays();
            
        } catch (error) {
            //ignore
        }
        
        try {
            console.log(cfi);
            
            var range = this.getDomRangeFromRangeCfi(cfi);
            console.log(range);
            
            var res = ReadiumSDK._DEBUG_CfiNavigationLogic.drawDebugOverlayFromDomRange(range);
            console.log(res);
        
            var cfiFirst = ReadiumSDK.reader.getFirstVisibleCfi();
            console.log(cfiFirst);
            
            var cfiLast  = ReadiumSDK.reader.getLastVisibleCfi();
            console.log(cfiLast);
            
        } catch (error) {
            //ignore
        }
        
        setTimeout(function() {
            try {
                ReadiumSDK._DEBUG_CfiNavigationLogic.clearDebugOverlays();
            } catch (error) {
                //ignore
            }
        }, 2000);
    };

    /**
     * Returns the bookmark associated with currently opened page.
     *
     * @returns {string} Serialized ReadiumSDK.Models.BookmarkData object as JSON string.
     *          {null} If a bookmark could not be created successfully.
     */
    this.bookmarkCurrentPage = function() {
        var bookmark = _currentView.bookmarkCurrentPage();
        return bookmark ? bookmark.toString() : null;
    };

    /**
     * Resets all the custom styles set by setStyle callers at runtime
     */
    this.clearStyles = function () {

        _userStyles.resetStyleValues();
        applyStyles();
        _userStyles.clear();
    };

    /**
     * Resets all the custom styles set by setBookStyle callers at runtime
     */
    this.clearBookStyles = function () {

        if (_currentView) {

            _bookStyles.resetStyleValues();
            _currentView.applyBookStyles();
        }

        _bookStyles.clear();
    };

    /**
     * Returns true if media overlay available for one of the open pages.
     *
     * @returns {boolean}
     */
    this.isMediaOverlayAvailable = function () {

        if (!_mediaOverlayPlayer) return false;

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
     */
    this.toggleMediaOverlay = function () {

        _mediaOverlayPlayer.toggleMediaOverlay();
    };


    /**
     * Plays next fragment media overlay
     */
    this.nextMediaOverlay = function () {

        _mediaOverlayPlayer.nextMediaOverlay();

    };

    /**
     * Plays previous fragment media overlay
     */
    this.previousMediaOverlay = function () {

        _mediaOverlayPlayer.previousMediaOverlay();

    };

    /**
     * Plays next available fragment media overlay that is outside of the current escapable scope
     */
    this.escapeMediaOverlay = function () {

        _mediaOverlayPlayer.escape();
    };

    /**
     * End media overlay TTS
     * @todo Clarify what this does with Daniel.
     */
    this.ttsEndedMediaOverlay = function () {

        _mediaOverlayPlayer.onTTSEnd();
    };

    /**
     * Pause currently playing media overlays.
     */
    this.pauseMediaOverlay = function () {

        _mediaOverlayPlayer.pause();
    };

    /**
     * Start/Resume playback of media overlays.
     */
    this.playMediaOverlay = function () {

        _mediaOverlayPlayer.play();
    };

    /**
     * Determine if media overlays are currently playing.
     * @returns {boolean}
     */
    this.isPlayingMediaOverlay = function () {

        return _mediaOverlayPlayer.isPlaying();
    };

//
// should use Globals.Events.SETTINGS_APPLIED instead!
//    this.setRateMediaOverlay = function(rate) {
//
//        _mediaOverlayPlayer.setRate(rate);
//    };
//    this.setVolumeMediaOverlay = function(volume){
//
//        _mediaOverlayPlayer.setVolume(volume);
//    };

    /**
     * Get the first visible media overlay element from the currently active content document(s)
     * @returns {HTMLElement|undefined}
     */
    this.getFirstVisibleMediaOverlayElement = function () {

        if (_currentView) {
            return _currentView.getFirstVisibleMediaOverlayElement();
        }

        return undefined;
    };

    /**
     * Used to jump to an element to make sure it is visible when a content document is paginated
     * @param {string}      spineItemId   The spine item idref associated with an active content document
     * @param {HTMLElement} element       The element to make visible
     * @param [initiator]
     */
    this.insureElementVisibility = function (spineItemId, element, initiator) {

        if (_currentView) {
            _currentView.insureElementVisibility(spineItemId, element, initiator);
        }
    };

    var _resizeBookmark = null;
    var _resizeMOWasPlaying = false;

    function handleViewportResizeStart() {

        _resizeBookmark = null;
        _resizeMOWasPlaying = false;

        if (_currentView) {

            if (_currentView.isReflowable && _currentView.isReflowable()) {
                _resizeMOWasPlaying = self.isPlayingMediaOverlay();
                if (_resizeMOWasPlaying) {
                    self.pauseMediaOverlay();
                }
            }

            _resizeBookmark = _currentView.bookmarkCurrentPage(); // not self! (JSON string)
        }
    }

    function handleViewportResizeTick() {
        if (_currentView) {
            self.handleViewportResize(_resizeBookmark);
        }
    }

    function handleViewportResizeEnd() {
        //same as doing one final tick for now
        handleViewportResizeTick();

        if (_resizeMOWasPlaying) self.playMediaOverlay();
    }

    this.handleViewportResize = function (bookmarkToRestore) {
        if (!_currentView) return;

        _currentView.onViewportResize();
    };

    /**
     * Lets user to subscribe to iframe's window events
     *
     * @param {string} eventName              Event name.
     * @param {function} callback             Callback function.
     * @param {object} context                User specified data passed to the callback function.
     * @returns {undefined}
     */
    this.addIFrameEventListener = function (eventName, callback, context) {
        _iframeLoader.addIFrameEventListener(eventName, callback, context);
    };

    var BackgroundAudioTrackManager = function (readerView) {
        var _spineItemIframeMap = {};
        var _wasPlaying = false;

        var _callback_playPause = undefined;
        this.setCallback_PlayPause = function (callback) {
            _callback_playPause = callback;
        };

        var _callback_isAvailable = undefined;
        this.setCallback_IsAvailable = function (callback) {
            _callback_isAvailable = callback;
        };

        this.playPause = function (doPlay) {
            _playPause(doPlay);
        };

        var _playPause = function (doPlay) {
            if (_callback_playPause) {
                _callback_playPause(doPlay);
            }

            try {
                var $iframe = undefined;

                for (var prop in _spineItemIframeMap) {
                    if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                    var data = _spineItemIframeMap[prop];
                    if (!data || !data.active) continue;

                    if ($iframe) console.error("More than one active iframe?? (pagination)");

                    $iframe = data["$iframe"];
                    if (!$iframe) continue;

                    var $audios = $("audio", $iframe[0].contentDocument);

                    $.each($audios, function () {

                        var attr = this.getAttribute("epub:type") || this.getAttribute("type");

                        if (!attr) return true; // continue

                        if (attr.indexOf("ibooks:soundtrack") < 0 && attr.indexOf("media:soundtrack") < 0 && attr.indexOf("media:background") < 0) return true; // continue

                        if (doPlay && this.play) {
                            this.play();
                        }
                        else if (this.pause) {
                            this.pause();
                        }

                        return true; // continue (more than one track?)
                    });
                }
            }
            catch (err) {
                console.error(err);
            }
        };

        this.setPlayState = function (wasPlaying) {
            _wasPlaying = wasPlaying;
        };

        readerView.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "ON", "reader_view.js (via BackgroundAudioTrackManager) [ " + spineItem.href + " ]");;
            
            try {
                if (spineItem && spineItem.idref && $iframe && $iframe[0]) {
                    // console.log("CONTENT_DOCUMENT_LOADED");
                    // console.debug(spineItem.href);
                    // console.debug(spineItem.idref);

                    _spineItemIframeMap[spineItem.idref] = {"$iframe": $iframe, href: spineItem.href};
                }
            }
            catch (err) {
                console.error(err);
            }
        });

        readerView.on(Globals.Events.PAGINATION_CHANGED, function (pageChangeData) {
            Globals.logEvent("PAGINATION_CHANGED", "ON", "reader_view.js (via BackgroundAudioTrackManager)");
            
            // console.log("PAGINATION_CHANGED");
            // console.debug(pageChangeData);
            //
            // if (pageChangeData.spineItem)
            // {
            //     console.debug(pageChangeData.spineItem.href);
            //     console.debug(pageChangeData.spineItem.idref);
            // }
            // else
            // {
            //     //console.error(pageChangeData);
            // }
            //
            // if (pageChangeData.paginationInfo && pageChangeData.paginationInfo.openPages && pageChangeData.paginationInfo.openPages.length)
            // {
            //     for (var i = 0; i < pageChangeData.paginationInfo.openPages.length; i++)
            //     {
            //         console.log(pageChangeData.paginationInfo.openPages[i].idref);
            //     }
            // }

            var atLeastOne = false;

            try {
                for (var prop in _spineItemIframeMap) {
                    if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                    var isActive = pageChangeData.spineItem && pageChangeData.spineItem.idref === prop;

                    var isDisplayed = false;

                    if (pageChangeData.paginationInfo && pageChangeData.paginationInfo.openPages.length) {
                        var allSame = true;

                        for (var i = 0; i < pageChangeData.paginationInfo.openPages.length; i++) {
                            if (pageChangeData.paginationInfo.openPages[i].idref === prop) {
                                isDisplayed = true;
                            }
                            else {
                                allSame = false;
                            }
                        }

                        if (!isActive && allSame) isActive = true;
                    }

                    if (isActive || isDisplayed) {
                        var data = _spineItemIframeMap[prop];
                        if (!data) continue;

                        _spineItemIframeMap[prop]["active"] = isActive;

                        var $iframe = data["$iframe"];
                        var href = data.href;

                        var $audios = $("audio", $iframe[0].contentDocument);
                        $.each($audios, function () {

                            var attr = this.getAttribute("epub:type") || this.getAttribute("type");

                            if (!attr) return true; // continue

                            if (attr.indexOf("ibooks:soundtrack") < 0 && attr.indexOf("media:soundtrack") < 0 && attr.indexOf("media:background") < 0) return true; // continue

                            this.setAttribute("loop", "loop");
                            this.removeAttribute("autoplay");

                            // DEBUG!
                            //this.setAttribute("controls", "controls");

                            if (isActive) {
                                // DEBUG!
                                //$(this).css({border:"2px solid green"});
                            }
                            else {
                                if (this.pause) this.pause();

                                // DEBUG!
                                //$(this).css({border:"2px solid red"});
                            }

                            atLeastOne = true;

                            return true; // continue (more than one track?)
                        });

                        continue;
                    }
                    else {
                        if (_spineItemIframeMap[prop]) _spineItemIframeMap[prop]["$iframe"] = undefined;
                        _spineItemIframeMap[prop] = undefined;
                    }
                }
            }
            catch (err) {
                console.error(err);
            }

            if (_callback_isAvailable) {
                _callback_isAvailable(atLeastOne);
            }

            if (atLeastOne) {
                if (_wasPlaying) {
                    _playPause(true);
                }
                else {
                    _playPause(false); // ensure correct paused state
                }
            }
            else {
                _playPause(false); // ensure correct paused state
            }
        });

        readerView.on(Globals.Events.MEDIA_OVERLAY_STATUS_CHANGED, function (value) {
            Globals.logEvent("MEDIA_OVERLAY_STATUS_CHANGED", "ON", "reader_view.js (via BackgroundAudioTrackManager)");
            
            if (!value.smilIndex) return;
            var packageModel = readerView.package();
            var smil = packageModel.media_overlay.smilAt(value.smilIndex);
            if (!smil || !smil.spineItemId) return;

            var needUpdate = false;
            for (var prop in _spineItemIframeMap) {
                if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                var data = _spineItemIframeMap[prop];
                if (!data) continue;

                if (data.active) {
                    if (prop !== smil.spineItemId) {
                        _playPause(false); // ensure correct paused state
                        data.active = false;
                        needUpdate = true;
                    }
                }
            }

            if (needUpdate) {
                for (var prop in _spineItemIframeMap) {
                    if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                    var data = _spineItemIframeMap[prop];
                    if (!data) continue;

                    if (!data.active) {
                        if (prop === smil.spineItemId) {
                            data.active = true;
                        }
                    }
                }

                if (_wasPlaying) {
                    _playPause(true);
                }
            }
        });
    };
    this.backgroundAudioTrackManager = new BackgroundAudioTrackManager(self);

    function getCfisForVisibleRegion() {
        return {firstVisibleCfi: self.getFirstVisibleCfi(), lastVisibleCfi: self.getLastVisibleCfi()};
    }


    this.isVisibleSpineItemElementCfi = function(spineIdRef, partialCfi){
        var spineItem = getSpineItem(spineIdRef);

        if (!spineItem) {
            return false;
        }

        if (_currentView) {

            if(!partialCfi || (partialCfi && partialCfi === '')){
                var spines = _currentView.getLoadedSpineItems();
                for(var i = 0, count = spines.length; i < count; i++) {
                    if(spines[i].idref == spineIdRef){
                        return true;
                    }
                }
            }
            return _currentView.isVisibleSpineItemElementCfi(spineIdRef, partialCfi);

        }
        return false;
    };

    /**
     * Gets all elements from active content documents based on a query selector.
     *
     * @param {string} spineItemIdref    The spine item idref associated with the content document
     * @param {string} selector          The query selector
     * @returns {HTMLElement[]}
     */
    this.getElements = function(spineItemIdref, selector) {

        if(_currentView) {
            return _currentView.getElements(spineItemIdref, selector);
        }

        return undefined;
    };

    /**
     * Determine if an element is visible on the active content documents
     *
     * @param {HTMLElement} element The element.
     * @returns {boolean}
     */
    this.isElementVisible = function (element) {
        return _currentView.isElementVisible($(element));

    };

    /**
     * Resolve a range CFI into an object containing info about it.
     * @param {string} spineIdRef    The spine item idref associated with the content document
     * @param {string} partialCfi    The partial CFI that is the range CFI to resolve
     * @returns {Models.NodeRangeInfo}
     */
    this.getNodeRangeInfoFromCfi = function (spineIdRef, partialCfi) {
        if (_currentView && spineIdRef && partialCfi) {
            var nodeRangeInfo = _currentView.getNodeRangeInfoFromCfi(spineIdRef, partialCfi);
            if (nodeRangeInfo) {
                return new NodeRangeInfo(nodeRangeInfo.clientRect)
                    .setStartInfo(nodeRangeInfo.startInfo)
                    .setEndInfo(nodeRangeInfo.endInfo);
            }
        }
        return undefined;
    };

    /**
     * Get the pagination info from the current view
     *
     * @returns {ReadiumSDK.Models.CurrentPagesInfo}
     */
    this.getPaginationInfo = function(){
        return _currentView.getPaginationInfo();
    };
    /**
     * Get CFI of the first element visible in the viewport
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getFirstVisibleCfi = function() {
        if (_currentView) {
            return _currentView.getFirstVisibleCfi();
        }
        return undefined;
    };

    /**
     * Get CFI of the last element visible in the viewport
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getLastVisibleCfi = function() {
        if (_currentView) {
            return _currentView.getLastVisibleCfi();
        }
        return undefined;
    };

    /**
     * Get CFI of the first element from the base of the document
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getStartCfi = function() {
        if (_currentView) {
            return _currentView.getStartCfi();
        }
        return undefined;
    };

    /**
     * Get CFI of the last element from the base of the document
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getEndCfi = function() {
        if (_currentView) {
            return _currentView.getEndCfi();
        }
        return undefined;
    };

    /**
     *
     * @param {string} rangeCfi
     * @param {string} [rangeCfi2]
     * @param {boolean} [inclusive]
     * @returns {array}
     */
    this.getDomRangesFromRangeCfi = function(rangeCfi, rangeCfi2, inclusive) {
        if (_currentView) {
            if (_currentView.getDomRangesFromRangeCfi) {
                return _currentView.getDomRangesFromRangeCfi(rangeCfi, rangeCfi2, inclusive);
            } else {
                return [_currentView.getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive)];
            }
        }
        return undefined;
    };

    /**
     *
     * @param {ReadiumSDK.Models.BookmarkData} startCfi starting CFI
     * @param {ReadiumSDK.Models.BookmarkData} [endCfi] ending CFI
     * optional - may be omited if startCfi is a range CFI
     * @param {boolean} [inclusive] optional indicating if the range should be inclusive
     * @returns {array}
     */
    this.getDomRangesFromRangeCfi = function(rangeCfi, rangeCfi2, inclusive) {
        if (_currentView) {
            if (_currentView.getDomRangesFromRangeCfi) {
                return _currentView.getDomRangesFromRangeCfi(rangeCfi, rangeCfi2, inclusive);
            } else {
                return [_currentView.getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive)];
            }
        }
        return undefined;
    };

    /**
     *
     * @param {ReadiumSDK.Models.BookmarkData} startCfi starting CFI
     * @param {ReadiumSDK.Models.BookmarkData} [endCfi] ending CFI
     * optional - may be omited if startCfi is a range CFI
     * @param {boolean} [inclusive] optional indicating if the range should be inclusive
     * @returns {DOM Range} https://developer.mozilla.org/en-US/docs/Web/API/Range
     */
    this.getDomRangeFromRangeCfi = function(startCfi, endCfi, inclusive) {
        if (_currentView) {
            return _currentView.getDomRangeFromRangeCfi(startCfi, endCfi, inclusive);
        }
        return undefined;
    };

    /**
     * Generate range CFI from DOM range
     * @param {DOM Range} https://developer.mozilla.org/en-US/docs/Web/API/Range
     * @returns {string} - represents Range CFI for the DOM range
     */
    this.getRangeCfiFromDomRange = function(domRange) {
        if (_currentView) {
            return _currentView.getRangeCfiFromDomRange(domRange);
        }
        return undefined;
    };

    /**
     * @param x
     * @param y
     * @param [precisePoint]
     * @param [spineItemIdref] Required for fixed layout views
     * @returns {string}
     */
    this.getVisibleCfiFromPoint = function (x, y, precisePoint, spineItemIdref) {
        if (_currentView) {
            return _currentView.getVisibleCfiFromPoint(x, y, precisePoint, spineItemIdref);
        }
        return undefined;
    };

    /**
     *
     * @param startX
     * @param startY
     * @param endX
     * @param endY
     * @param [spineItemIdref] Required for fixed layout views
     * @returns {*}
     */
    this.getRangeCfiFromPoints = function(startX, startY, endX, endY, spineItemIdref) {
        if (_currentView) {
            return _currentView.getRangeCfiFromPoints(startX, startY, endX, endY, spineItemIdref);
        }
        return undefined;
    };

    /**
     *
     * @param {HTMLElement} element
     * @returns {*}
     */
    this.getCfiForElement = function(element) {
        if (_currentView) {
            return _currentView.getCfiForElement(element);
        }
        return undefined;
    };
       
    /**
     * Useful for getting a CFI that's as close as possible to an invisible (not rendered, zero client rects) element
     * @param {HTMLElement} element
     * @returns {*}
     */
    this.getNearestCfiFromElement = function(element) {
        if (_currentView) {
            return _currentView.getNearestCfiFromElement(element);
        }
        return undefined;
    };
    
};

/**
 * View Type
 * @typedef {object} Globals.Views.ReaderView.ViewType
 * @property {number} VIEW_TYPE_COLUMNIZED          Reflowable document view
 * @property {number} VIEW_TYPE_FIXED               Fixed layout document view
 * @property {number} VIEW_TYPE_SCROLLED_DOC        Scrollable document view
 * @property {number} VIEW_TYPE_SCROLLED_CONTINUOUS Continuous scrollable document view
 */
ReaderView.VIEW_TYPE_COLUMNIZED = 1;
ReaderView.VIEW_TYPE_FIXED = 2;
ReaderView.VIEW_TYPE_SCROLLED_DOC = 3;
ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS = 4;
return ReaderView;
});
