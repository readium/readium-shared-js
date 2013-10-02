//  Created by Boris Schneiderman.
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
ReadiumSDK.Views.ReaderView = Backbone.View.extend({

    currentView: undefined,
    package: undefined,
    spine: undefined,
    viewerSettings:undefined,
    userStyles: undefined,
    mediaOverlayPlayer: undefined,

    initialize: function() {

        debugger;
        this.viewerSettings = new ReadiumSDK.Models.ViewerSettings({});
        this.userStyles = new ReadiumSDK.Collections.StyleCollection();
    },

    renderCurrentView: function(isReflowable) {

        if(this.currentView){

            //current view is already rendered
            if( this.currentView.isReflowable() === isReflowable) {
                return;
            }

            this.resetCurrentView();
        }

        if(isReflowable) {

            this.currentView = new ReadiumSDK.Views.ReflowableView({$viewport: this.$el, spine:this.spine, userStyles: this.userStyles});
        }
        else {

            this.currentView = new ReadiumSDK.Views.FixedView({$viewport: this.$el, spine:this.spine, userStyles: this.userStyles});
        }

        this.currentView.setViewSettings(this.viewerSettings);

        this.currentView.render();

        var self = this;
        this.currentView.on(ReadiumSDK.Events.CURRENT_VIEW_PAGINATION_CHANGED, function( pageChangeData ){

            //we call on onPageChanged explicitly instead of subscribing to the ReadiumSDK.Events.PAGINATION_CHANGED by
            //mediaOverlayPlayer because we hve to guarantee that mediaOverlayPlayer will be updated before the host
            //application will be notified by the same ReadiumSDK.Events.PAGINATION_CHANGED event
            self.mediaOverlayPlayer.onPageChanged(pageChangeData);

            self.trigger(ReadiumSDK.Events.PAGINATION_CHANGED, pageChangeData);

        });

        this.currentView.on(ReadiumSDK.Events.CONTENT_LOADED, function() {

            var spineItems = self.currentView.getLoadedSpineItems();

            for(var i = 0, count = spineItems.length; i < count; i++) {

                self.attachMediaOverlayData(spineItems[i]);
            }

        });

    },

    resetCurrentView: function() {


        if(!this.currentView) {
            return;
        }

        this.currentView.off(ReadiumSDK.Events.CURRENT_VIEW_PAGINATION_CHANGED);
        this.currentView.remove();
        this.currentView = undefined;
    },

    attachMediaOverlayData: function(spineItem) {

        var self = this;

        if(!spineItem.media_overlay_id) {
            return;
        }

        var smil = this.package.media_overlay.getSmilById(spineItem.media_overlay_id);
        if(!smil) {
            return;
        }

        var iter = new ReadiumSDK.Models.SmilIterator(smil);

        var first = true;

        while(iter.currentPar) {

            if(iter.currentPar.text.srcFragmentId) {

                var element = this.currentView.getElement(spineItem, "#" + iter.currentPar.text.srcFragmentId);
                if(element) {
                    iter.currentPar.element = element;
                    $(element).data("mediaOverlayData", {par: iter.currentPar});

                    if (element.ownerDocument && element.ownerDocument.body)
                    {
                        if (first)
                        {
                            $(element.ownerDocument.body).click(function(event) {
                                var elem = $(this)[0]; // body
                                elem = event.target;
                                console.debug("MO CLICK (BODY): " + elem.id);

                                var data = $(elem).data("mediaOverlayData");
                                if (data && data.par)
                                {
                                    var par = data.par;
                                    self.mediaOverlayPlayer.playUserPar(par);
                                }
                                else
                                {
                                    var readaloud = $(elem).attr("ibooks:readaloud");
                                    if (!readaloud)
                                    {
                                        readaloud = $(elem).attr("epub:readaloud");
                                    }
                                    if (readaloud)
                                    {
                                        console.debug("MO readaloud attr: " + readaloud);

                                        var isPlaying = self.mediaOverlayPlayer.isPlaying();
                                        if (readaloud === "start" && !isPlaying ||
                                            readaloud === "stop" && isPlaying ||
                                            readaloud === "startstop")
                                        {
                                            self.mediaOverlayPlayer.toggleMediaOverlay();
                                        }
                                    }
                                }
                            });
                        }

                        first = false;
                    }
                    else
                    {
                        $(element).click(function() {
                            var elem = $(this)[0];
                            console.debug("MO CLICK (ELEM): " + elem.id);

                            var par = $(this).data("mediaOverlayData").par;
                            self.mediaOverlayPlayer.playUserPar(par);
                        });
                    }
                }
                else
                {
                    console.error("!! CANNOT FIND ELEMENT: " + iter.currentPar.text.srcFragmentId + " /// " + spineItem.href);
                }
            }

            iter.next();
        }
    },

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
    openBook: function(openBookData) {

        this.package = new ReadiumSDK.Models.Package({packageData: openBookData.package});
        this.spine = this.package.spine;

        if(this.mediaOverlayPlayer) {
            this.mediaOverlayPlayer.reset();
        }

        this.mediaOverlayPlayer = new ReadiumSDK.Views.MediaOverlayPlayer(this, $.proxy(this.onMediaPlayerStatusChanged, this));

        this.resetCurrentView();

        if(openBookData.settings) {
            this.updateSettings(openBookData.settings);
        }

        if(openBookData.styles) {
            this.setStyles(openBookData.styles);
        }

        if(openBookData.openPageRequest) {

            var pageRequestData = openBookData.openPageRequest;

            if(pageRequestData.idref) {

                if(pageRequestData.spineItemPageIndex) {
                    this.openSpineItemPage(pageRequestData.idref, pageRequestData.spineItemPageIndex, this);
                }
                else if(pageRequestData.elementCfi) {
                    this.openSpineItemElementCfi(pageRequestData.idref, pageRequestData.elementCfi, this);
                }
                else {
                    this.openSpineItemPage(pageRequestData.idref, 0, this);
                }
            }
            else if(pageRequestData.contentRefUrl && pageRequestData.sourceFileHref) {
                this.openContentUrl(pageRequestData.contentRefUrl, pageRequestData.sourceFileHref, this);
            }
            else {
                console.log("Invalid page request data: idref required!");
            }
        }
        else {// if we where not asked to open specific page we will open the first one

            var spineItem = this.spine.first();
            if(spineItem) {
                var pageOpenRequest = new ReadiumSDK.Models.PageOpenRequest(spineItem, this);
                pageOpenRequest.setFirstPage();
                this.openPage(pageOpenRequest);
            }

        }

    },

    onMediaPlayerStatusChanged: function(status) {

        this.trigger(ReadiumSDK.Events.MEDIA_OVERLAY_STATUS_CHANGED, status);
    },

    /**
     * Flips the page from left to right. Takes to account the page progression direction to decide to flip to prev or next page.
     * @method openPageLeft
     */
    openPageLeft: function() {

        if(this.package.spine.isLeftToRight()) {
            this.openPagePrev();
        }
        else {
            this.openPageNext();
        }
    },

    /**
     * Flips the page from right to left. Takes to account the page progression direction to decide to flip to prev or next page.
     * @method openPageRight
     */
    openPageRight: function() {

        if(this.package.spine.isLeftToRight()) {
            this.openPageNext();
        }
        else {
            this.openPagePrev();
        }

    },

    /**
     * Updates reader view based on the settings specified in settingsData object
     * @param settingsData
     */
    updateSettings: function(settingsData) {

        console.log("UpdateSettings: " + JSON.stringify(settingsData));

        this.viewerSettings.update(settingsData);

        if(this.currentView) {

            var bookMark = this.currentView.bookmarkCurrentPage();

            this.currentView.setViewSettings(this.viewerSettings);

            if(bookMark) {
                this.openSpineItemElementCfi(bookMark.idref, bookMark.elementCfi, this);
            }
        }

        this.trigger(ReadiumSDK.Events.SETTINGS_APPLIED);
    },

    /**
     * Opens the next page.
     */
    openPageNext: function() {

        var paginationInfo = this.currentView.getPaginationInfo();

        if(paginationInfo.openPages.length == 0) {
            return;
        }

        var lastOpenPage = paginationInfo.openPages[paginationInfo.openPages.length - 1];

        if(lastOpenPage.spineItemPageIndex < lastOpenPage.spineItemPageCount - 1) {
            this.currentView.openPageNext(this);
            return;
        }

        var currentSpineItem = this.spine.getItemById(lastOpenPage.idref);

        var nextSpineItem = this.spine.nextItem(currentSpineItem);

        if(!nextSpineItem) {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(nextSpineItem, this);
        openPageRequest.setFirstPage();

        this.openPage(openPageRequest);
    },

    /**
     * Opens the previews page.
     */
    openPagePrev: function() {

        var paginationInfo = this.currentView.getPaginationInfo();

        if(paginationInfo.openPages.length == 0) {
            return;
        }

        var firstOpenPage = paginationInfo.openPages[0];

        if(firstOpenPage.spineItemPageIndex > 0) {
            this.currentView.openPagePrev(this);
            return;
        }

        var currentSpineItem = this.spine.getItemById(firstOpenPage.idref);

        var prevSpineItem = this.spine.prevItem(currentSpineItem);

        if(!prevSpineItem) {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(prevSpineItem, this);
        openPageRequest.setLastPage();

        this.openPage(openPageRequest);
    },

    getSpineItem: function(idref) {

        if(!idref) {

            console.log("idref parameter value missing!");
            return undefined;
        }

        var spineItem = this.spine.getItemById(idref);
        if(!spineItem) {
            console.log("Spine item with id " + idref + " not found!");
            return undefined;
        }

        return spineItem;

    },

    /**
     * Opens the page of the spine item with element with provided cfi
     *
     * @method openSpineItemElementCfi
     *
     * @param {string} idref Id of the spine item
     * @param {string} elementCfi CFI of the element to be shown
     * @param {object} initiator optional
     */
    openSpineItemElementCfi: function(idref, elementCfi, initiator) {

        var spineItem = this.getSpineItem(idref);

        if(!spineItem) {
            return;
        }

        var pageData = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
        if(elementCfi) {
            pageData.setElementCfi(elementCfi);
        }

        this.openPage(pageData);
    },

    /**
     *
     * Opens specified page index of the current spine item
     *
     * @method openPageIndex
     *
     * @param {number} pageIndex Zero based index of the page in the current spine item
     * @param {object} initiator optional
     */
    openPageIndex: function(pageIndex, initiator) {

        if(!this.currentView) {
            return;
        }

        var pageRequest;
        if(this.package.isFixedLayout()) {
            var spineItem = this.package.spine.items[pageIndex];
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

        this.openPage(pageRequest);
    },

    openPage: function(pageRequest) {

        this.renderCurrentView(pageRequest.spineItem.isReflowable());
        this.currentView.openPage(pageRequest);
    },


    /**
     *
     * Opens page index of the spine item with idref provided
     *
     * @param {string} idref Id of the spine item
     * @param {number} pageIndex Zero based index of the page in the spine item
     * @param {object} initiator optional
     */
    openSpineItemPage: function(idref, pageIndex, initiator) {

        var spineItem = this.getSpineItem(idref);

        if(!spineItem) {
            return;
        }

        var pageData = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
        if(pageIndex) {
            pageData.setPageIndex(pageIndex);
        }

        this.openPage(pageData);
    },

    /**
     * Set CSS Styles to the reader
     *
     * @method setStyles
     *
     * @param styles {object} style object contains selector property and declarations object
     */
    setStyles: function(styles) {

        var count = styles.length;

        for(var i = 0; i < count; i++) {
            this.userStyles.addStyle(styles[i].selector, styles[i].declarations);
        }

        this.applyStyles();

    },

    applyStyles: function() {

        ReadiumSDK.Helpers.setStyles(this.userStyles.styles, this.$el);

        if(this.currentView) {
            this.currentView.applyStyles();
        }
    },


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
    openContentUrl: function(contentRefUrl, sourceFileHref, initiator) {

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

        var spineItem = this.spine.getItemByHref(hrefPart);

        if(!spineItem) {
            return;
        }

        var pageData = new ReadiumSDK.Models.PageOpenRequest(spineItem, initiator);
        if(elementId){
            pageData.setElementId(elementId);
        }

        this.openPage(pageData);
    },

    /**
     *
     * Returns the bookmark associated with currently opened page.
     *
     * @method bookmarkCurrentPage
     *
     * @returns {string} Stringified ReadiumSDK.Models.BookmarkData object.
     */
    bookmarkCurrentPage: function() {
        return JSON.stringify(this.currentView.bookmarkCurrentPage());
    },

    /**
     * Resets all the custom styles set by setStyle callers at runtime
     *
     * @method resetStyles
     */
    clearStyles: function() {

        var styles = this.userStyles.styles;
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

        this.applyStyles();

        this.userStyles.clear();
    },

    /**
     *
     * Returns true if media overlay available for one of the open pages.
     *
     * @method isMediaOverlayAvailable
     *
     * @returns {boolean}
     */
    isMediaOverlayAvailable: function() {

        return this.mediaOverlayPlayer.isMediaOverlayAvailable();
    },

/*
    setMediaOverlaySkippables: function(items) {

        this.mediaOverlayPlayer.setMediaOverlaySkippables(items);
    },

    setMediaOverlayEscapables: function(items) {

        this.mediaOverlayPlayer.setMediaOverlayEscapables(items);
    },
*/

    /**
     * Starts/Stop playing media overlay on current page
     *
     */
    toggleMediaOverlay: function() {

        this.mediaOverlayPlayer.toggleMediaOverlay();
    },

   /**
    * Plays next fragment media overlay
    *
    */
   nextMediaOverlay: function() {

        this.mediaOverlayPlayer.nextMediaOverlay();

   },

    /**
     * Plays previous fragment media overlay
     *
     */
    previousMediaOverlay: function() {

        this.mediaOverlayPlayer.previousMediaOverlay();

    },

    /**
     * Plays next available fragment media overlay that is outside of the current escapable scope
     *
     */
    escapeMediaOverlay: function() {

        this.mediaOverlayPlayer.escape();

    },

    getVisibleMediaOverlayElements: function() {

        if(this.currentView) {
            return this.currentView.getVisibleMediaOverlayElements();
        }

        return [];
    },

    insureElementVisibility: function(element, initiator) {

        if(this.currentView) {
            this.currentView.insureElementVisibility(element, initiator);
        }

    }

});