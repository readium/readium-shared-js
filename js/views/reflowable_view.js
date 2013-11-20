
//  LauncherOSX
//
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

/*
 * Renders reflowable content using CSS columns
 *
 * @class ReadiumSDK.Views.ReflowableView
 */

ReadiumSDK.Views.ReflowableView = Backbone.View.extend({

    currentSpineItem: undefined,
    isWaitingFrameRender: false,
    deferredPageRequest: undefined,
    spine: undefined,
    fontSize:100,
    $viewport: undefined,
    $contentFrame: undefined,
    userStyles: undefined,
    navigationLogic: undefined,

    lastViewPortSize : {
        width: undefined,
        height: undefined
    },

    paginationInfo : {

        visibleColumnCount : 2,
        columnGap : 20,
        spreadCount : 0,
        currentSpreadIndex : 0,
        columnWidth : undefined,
        pageOffset : 0,
        columnCount: 0
    },

    initialize: function() {

        this.$viewport = this.options.$viewport;
        this.spine = this.options.spine;
        this.userStyles = this.options.userStyles;
    },

    render: function(){

        this.template = ReadiumSDK.Helpers.loadTemplate("reflowable_book_frame", {});

        this.setElement(this.template);
        this.$viewport.append(this.$el);

        this.$contentFrame = $("#reflowable-content-frame", this.$el);

        this.$iframe = $("#epubContentIframe", this.$el);

        this.$iframe.css("left", "");
        this.$iframe.css("right", "");
        this.$iframe.css(this.spine.isLeftToRight() ? "left" : "right", "0px");

        this.navigationLogic = new ReadiumSDK.Views.CfiNavigationLogic(this.$contentFrame, this.$iframe);

        //We will call onViewportResize after user stopped resizing window
        var lazyResize = _.debounce(this.onViewportResize, 100);
        $(window).on("resize.ReadiumSDK.reflowableView", _.bind(lazyResize, this));

        return this;
    },

    setFrameSizesToRectangle: function(rectangle) {
        this.$contentFrame.css("left", rectangle.left);
        this.$contentFrame.css("top", rectangle.top);
        this.$contentFrame.css("right", rectangle.right);
        this.$contentFrame.css("bottom", rectangle.bottom);

    },

    remove: function() {

        $(window).off("resize.ReadiumSDK.reflowableView");

        //base remove
        Backbone.View.prototype.remove.call(this);
    },

    isReflowable: function() {
        return true;
    },

    onViewportResize: function() {

        if(this.updateViewportSize()) {
            this.updatePagination();
        }

    },

    setViewSettings: function(settings) {

        this.paginationInfo.visibleColumnCount = settings.isSyntheticSpread ? 2 : 1;
        this.paginationInfo.columnGap = settings.columnGap;
        this.fontSize = settings.fontSize;
        this.updateHtmlFontSizeAndColumnGap();

        this.updatePagination();
    },

    registerTriggers: function (doc) {
        $('trigger', doc).each(function() {
            var trigger = new ReadiumSDK.Models.Trigger(this);
            trigger.subscribe(doc);

        });
    },

    loadSpineItem: function(spineItem) {

        if(this.currentSpineItem != spineItem) {

            this.paginationInfo.currentSpreadIndex = 0;
            this.currentSpineItem = spineItem;
            this.isWaitingFrameRender = true;

            var src = this.spine.package.resolveRelativeUrl(spineItem.href);
            ReadiumSDK.Helpers.LoadIframe(this.$iframe[0], src, this.onIFrameLoad, this);
        }
    },

    updateHtmlFontSizeAndColumnGap: function() {

        if(this.$epubHtml) {
            this.$epubHtml.css("font-size", this.fontSize + "%");
            this.$epubHtml.css("-webkit-column-gap", this.paginationInfo.columnGap + "px");
        }
    },

    onIFrameLoad : function(success) {

        this.isWaitingFrameRender = false;

        //while we where loading frame new request came
        if(this.deferredPageRequest && this.deferredPageRequest.spineItem != this.currentSpineItem) {
            this.loadSpineItem(this.deferredPageRequest.spineItem);
            return;
        }

        if(!success) {
            this.deferredPageRequest = undefined;
            return;
        }

        this.trigger(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED);

        var epubContentDocument = this.$iframe[0].contentDocument;
        this.$epubHtml = $("html", epubContentDocument);

        this.$epubHtml.css("height", "100%");
        this.$epubHtml.css("position", "fixed");
        this.$epubHtml.css("-webkit-column-axis", "horizontal");

        this.updateHtmlFontSizeAndColumnGap();


/////////
//Columns Debugging
//                    $epubHtml.css("-webkit-column-rule-color", "red");
//                    $epubHtml.css("-webkit-column-rule-style", "dashed");
//                    $epubHtml.css("background-color", '#b0c4de');
/////////

        this.applyStyles();

        this.applySwitches(epubContentDocument);
        this.registerTriggers(epubContentDocument);

    },


    applyStyles: function() {

        ReadiumSDK.Helpers.setStyles(this.userStyles.styles, this.$el.parent());

        //because left, top, bottom, right setting ignores padding of parent container
        //we have to take it to account manually
        var elementMargins = ReadiumSDK.Helpers.Margins.fromElement(this.$el);
        this.setFrameSizesToRectangle(elementMargins.padding);

        this.updateViewportSize();
        this.updatePagination();

    },

    openDeferredElement: function() {

        if(!this.deferredPageRequest) {
            return;
        }

        var deferredData = this.deferredPageRequest;
        this.deferredPageRequest = undefined;
        this.openPage(deferredData);

    },

    openPage: function(pageRequest) {

        if(this.isWaitingFrameRender) {
            this.deferredPageRequest = pageRequest;
            return;
        }

        // if no spine item specified we are talking about current spine item
        if(pageRequest.spineItem && pageRequest.spineItem != this.currentSpineItem) {
            this.deferredPageRequest = pageRequest;
            this.loadSpineItem(pageRequest.spineItem);
            return;
        }

        var pageIndex = undefined;


        if(pageRequest.spineItemPageIndex !== undefined) {
            pageIndex = pageRequest.spineItemPageIndex;
        }
        else if(pageRequest.elementId) {
            pageIndex = this.navigationLogic.getPageForElementId(pageRequest.elementId);
        }
        else if(pageRequest.elementCfi) {
            pageIndex = this.navigationLogic.getPageForElementCfi(pageRequest.elementCfi);
        }
        else if(pageRequest.firstPage) {
            pageIndex = 0;
        }
        else if(pageRequest.lastPage) {
            pageIndex = this.paginationInfo.columnCount - 1;
        }
        else {
            console.debug("No criteria in pageRequest");
            pageIndex = 0;
        }

        if(pageIndex >= 0 && pageIndex < this.paginationInfo.columnCount) {

            this.paginationInfo.currentSpreadIndex = Math.floor(pageIndex / this.paginationInfo.visibleColumnCount) ;
            this.onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    },

    redraw: function() {

        var offsetVal =  -this.paginationInfo.pageOffset + "px";

        this.$epubHtml.css("left", this.spine.isLeftToRight() ? offsetVal : "");
        this.$epubHtml.css("right", this.spine.isRightToLeft() ? offsetVal : "");
    },

    updateViewportSize: function() {

        var newWidth = this.$contentFrame.width();
        var newHeight = this.$contentFrame.height();

        if(this.lastViewPortSize.width !== newWidth || this.lastViewPortSize.height !== newHeight){

            this.lastViewPortSize.width = newWidth;
            this.lastViewPortSize.height = newHeight;
            return true;
        }

        return false;
    },

    // Description: Parse the epub "switch" tags and hide
    // cases that are not supported
    applySwitches: function(dom) {

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
    },

    onPaginationChanged: function(initiator, paginationRequest_spineItem, paginationRequest_elementId) {

        this.paginationInfo.pageOffset = (this.paginationInfo.columnWidth + this.paginationInfo.columnGap) * this.paginationInfo.visibleColumnCount * this.paginationInfo.currentSpreadIndex;
        this.redraw();
        this.trigger(ReadiumSDK.Events.CURRENT_VIEW_PAGINATION_CHANGED, { paginationInfo: this.getPaginationInfo(), initiator: initiator, spineItem: paginationRequest_spineItem, elementId: paginationRequest_elementId } );
    },

    openPagePrev:  function (initiator) {

        if(!this.currentSpineItem) {
            return;
        }

        if(this.paginationInfo.currentSpreadIndex > 0) {
            this.paginationInfo.currentSpreadIndex--;
            this.onPaginationChanged(initiator);
        }
        else {

            var prevSpineItem = this.spine.prevItem(this.currentSpineItem);
            if(prevSpineItem) {

                var pageRequest = new ReadiumSDK.Models.PageOpenRequest(prevSpineItem, initiator);
                pageRequest.setLastPage();
                this.openPage(pageRequest);
            }
        }
    },

    openPageNext: function (initiator) {

        if(!this.currentSpineItem) {
            return;
        }

        if(this.paginationInfo.currentSpreadIndex < this.paginationInfo.spreadCount - 1) {
            this.paginationInfo.currentSpreadIndex++;
            this.onPaginationChanged(initiator);
        }
        else {

            var nextSpineItem = this.spine.nextItem(this.currentSpineItem);
            if(nextSpineItem) {

                var pageRequest = new ReadiumSDK.Models.PageOpenRequest(nextSpineItem, initiator);
                pageRequest.setFirstPage();
                this.openPage(pageRequest);
            }
        }
    },

    updatePagination: function() {

        if(!this.$epubHtml) {
            return;
        }

        this.$iframe.css("width", this.lastViewPortSize.width + "px");
        this.$iframe.css("height", this.lastViewPortSize.height + "px");

        this.$epubHtml.css("height", this.lastViewPortSize.height + "px");

        this.paginationInfo.columnWidth = (this.lastViewPortSize.width - this.paginationInfo.columnGap * (this.paginationInfo.visibleColumnCount - 1)) / this.paginationInfo.visibleColumnCount;

        //we do this because CSS will floor column with by itself if it is not a round number
        this.paginationInfo.columnWidth = Math.floor(this.paginationInfo.columnWidth);

        this.$epubHtml.css("width", this.paginationInfo.columnWidth);

        this.shiftBookOfScreen();

        this.$epubHtml.css("-webkit-column-width", this.paginationInfo.columnWidth + "px");

        var self = this;
        //TODO it takes time for rendition_layout engine to arrange columns we waite
        //it would be better to react on rendition_layout column reflow finished event
        setTimeout(function(){

            var columnizedContentWidth = self.$epubHtml[0].scrollWidth;

            self.paginationInfo.columnCount = Math.round((columnizedContentWidth + self.paginationInfo.columnGap) / (self.paginationInfo.columnWidth + self.paginationInfo.columnGap));

            self.paginationInfo.spreadCount =  Math.ceil(self.paginationInfo.columnCount / self.paginationInfo.visibleColumnCount);

            if(self.paginationInfo.currentSpreadIndex >= self.paginationInfo.spreadCount) {
                self.paginationInfo.currentSpreadIndex = self.paginationInfo.spreadCount - 1;
            }

            if(self.deferredPageRequest) {

                //if there is a request for specific page we get here
                self.openDeferredElement();
            }
            else {

                //we get here on resizing the viewport

                //We do this to force re-rendering of the document in the iframe.
                //There is a bug in WebView control with right to left columns layout - after resizing the window html document
                //is shifted in side the containing div. Hiding and showing the html element puts document in place.
                self.$epubHtml.hide();
                setTimeout(function() {
                    self.$epubHtml.show();
                    self.onPaginationChanged(self);
                }, 50);

            }

        }, 100);

    },

    shiftBookOfScreen: function() {

        if(this.spine.isLeftToRight()) {
            this.$epubHtml.css("left", (this.lastViewPortSize.width + 1000) + "px");
        }
        else {
            this.$epubHtml.css("right", (this.lastViewPortSize.width + 1000) + "px");
        }
    },

    getFirstVisibleElementCfi: function() {

        var contentOffsets = this.getVisibleContentOffsets();
        return this.navigationLogic.getFirstVisibleElementCfi(contentOffsets.top);
    },

    getPaginationInfo: function() {

        var isFixedLayout = this.currentSpineItem ? this.currentSpineItem.isFixedLayout() : this.spine.package.isFixedLayout();
        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(this.spine.items.length, isFixedLayout, this.spine.direction);

        if(!this.currentSpineItem) {
            return paginationInfo;
        }

        var pageIndexes = this.getOpenPageIndexes();

        for(var i = 0, count = pageIndexes.length; i < count; i++) {

            paginationInfo.addOpenPage(pageIndexes[i], this.paginationInfo.columnCount, this.currentSpineItem.idref, this.currentSpineItem.index);
        }

        return paginationInfo;

    },

    isPageIndexOpen: function(index) {

        var pageIndexes = this.getOpenPageIndexes();

        return pageIndexes.indexOf(index) != -1
    },

    getOpenPageIndexes: function() {

        var indexes = [];

        var currentPage = this.paginationInfo.currentSpreadIndex * this.paginationInfo.visibleColumnCount;

        for(var i = 0; i < this.paginationInfo.visibleColumnCount && (currentPage + i) < this.paginationInfo.columnCount; i++) {

            indexes.push(currentPage + i);
        }

        return indexes;

    },

    bookmarkCurrentPage: function() {

        if(!this.currentSpineItem) {

            return new ReadiumSDK.Models.BookmarkData("", "");
        }

        return new ReadiumSDK.Models.BookmarkData(this.currentSpineItem.idref, this.getFirstVisibleElementCfi());
    },

    getVisibleContentOffsets: function() {
        var columnsLeftOfViewport = Math.round(this.paginationInfo.pageOffset / (this.paginationInfo.columnWidth + this.paginationInfo.columnGap));

        var topOffset =  columnsLeftOfViewport * this.$contentFrame.height();
        var bottomOffset = topOffset + this.paginationInfo.visibleColumnCount * this.$contentFrame.height();

        return {top: topOffset, bottom: bottomOffset};
    },

    getLoadedSpineItems: function() {
        return [this.currentSpineItem];
    },

    getElement: function(spineItem, selector) {

        if(spineItem != this.currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return this.navigationLogic.getElement(selector);
    },

    getVisibleMediaOverlayElements: function() {

        var visibleContentOffsets = this.getVisibleContentOffsets();
        return this.navigationLogic.getVisibleMediaOverlayElements(visibleContentOffsets);
    },

    insureElementVisibility: function(element, initiator) {

        var $element = $(element);
        if(this.navigationLogic.isElementVisible($element, this.getVisibleContentOffsets())) {
            return;
        }

        var page = this.navigationLogic.getPageForElement($element);

        if(page == -1) {
            return;
        }

        var openPageRequest = new ReadiumSDK.Models.PageOpenRequest(this.currentSpineItem, initiator);
        openPageRequest.setPageIndex(page);

        this.openPage(openPageRequest);
    }

});
