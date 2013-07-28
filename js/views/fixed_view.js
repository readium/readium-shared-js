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
 * View for rendering fixed layout page spread
 * @class ReadiumSDK.Views.FixedView
 */

ReadiumSDK.Views.FixedView = Backbone.View.extend({

    leftPageView: undefined,
    rightPageView: undefined,
    centerPageView: undefined,
    spine: undefined,
    spread: undefined,
    bookMargins: undefined,
    contentMetaSize: undefined,

    $viewport: undefined,

    pageViews: [],

    initialize: function() {

        this.$viewport = this.options.$viewport;

        this.spine = this.options.spine;
        this.spread = new ReadiumSDK.Models.Spread(this.spine);

        this.leftPageView = new ReadiumSDK.Views.OnePageView({spine: this.spine, class: "page-frame-left", contentAlignment: "right"});
        this.rightPageView = new ReadiumSDK.Views.OnePageView({spine: this.spine, class: "page-frame-right", contentAlignment: "left"});
        this.centerPageView = new ReadiumSDK.Views.OnePageView({spine: this.spine, class: "page-frame-center", contentAlignment: "center"});

        this.pageViews.push(this.leftPageView);
        this.pageViews.push(this.rightPageView);
        this.pageViews.push(this.centerPageView);

        //event with namespace for clean unbinding
        $(window).on("resize.ReadiumSDK.readerView", _.bind(this.onViewportResize, this));
    },

    isReflowable: function() {
        return false;
    },

    render: function(){

        this.template = _.template($("#template-fixed-view").html(), {});
        this.setElement(this.template);

        this.$viewport.append(this.$el);

        this.updateBookMargins();

        return this;
    },

    //Temp function for debugging
    //TODO remove this function
    updateLayout: function() {
        this.updateBookMargins();
        this.updateContentMetaSize();
        this.resizeBook();
    },

    remove: function() {

        $(window).off("resize.ReadiumSDK.readerView");

        //base remove
        Backbone.View.prototype.remove.call(this);
    },

    setViewSettings: function(settings) {
        this.spread.setSyntheticSpread(settings.isSyntheticSpread);
    },

    redraw: function() {

        var self = this;

        var pageLoadDeferrals = this.createPageLoadDeferrals([{pageView: this.leftPageView, spineItem: this.spread.leftItem},
                                                              {pageView: this.rightPageView, spineItem: this.spread.rightItem},
                                                              {pageView: this.centerPageView, spineItem: this.spread.centerItem}]);

        if(pageLoadDeferrals.length > 0) {
            $.when.apply($, pageLoadDeferrals).done(function(){
                self.onPagesLoaded()
            });
        }

    },

    createPageLoadDeferrals: function(viewItemPairs) {

        var pageLoadDeferrals = [];

        for(var i = 0; i < viewItemPairs.length; i++) {

            var dfd = this.updatePageViewForItem(viewItemPairs[i].pageView, viewItemPairs[i].spineItem);
            if(dfd) {
                pageLoadDeferrals.push(dfd);
            }

        }

        return pageLoadDeferrals;

    },

    onPagesLoaded: function() {

        this.updateContentMetaSize();
        this.resizeBook();

        this.trigger("ViewPaginationChanged");
    },

    onViewportResize: function() {

        this.resizeBook();
    },

    resizeBook: function() {

        if(!this.contentMetaSize || !this.bookMargins) {
            return;
        }

        var viewportWidth = this.$viewport.width();
        var viewportHeight = this.$viewport.height();

        if(!viewportWidth || !viewportHeight) {
            return;
        }

        var targetContentSize = {   with: viewportWidth - this.bookMargins.width,
                                    height: viewportHeight - this.bookMargins.height };

        if(targetContentSize.width <= 0 || targetContentSize.height <= 0) {
            return;
        }

        var horScale = targetContentSize.with / this.contentMetaSize.width;
        var verScale = targetContentSize.height / this.contentMetaSize.height;

        var scale = Math.min(horScale, verScale);

        var contentWidth = this.contentMetaSize.width * scale;
        var contentHeight = this.contentMetaSize.height * scale;

        var bookLeft = Math.floor((viewportWidth - (contentWidth + this.bookMargins.width)) / 2);
        var bookTop = Math.floor((viewportHeight - (contentHeight + this.bookMargins.height)) / 2);

        if(bookLeft < 0) bookLeft = 0;
        if(bookTop < 0) bookTop = 0;

        this.$el.css("left", bookLeft + "px");
        this.$el.css("top", bookTop + "px");
        this.$el.css("width", contentWidth + "px");
        this.$el.css("height", contentHeight + "px");

        if(this.leftPageView.isDisplaying()) {
            this.leftPageView.transformContent(scale, this.bookMargins.padding.left, this.bookMargins.padding.top);
        }

        if(this.rightPageView.isDisplaying()) {
            this.rightPageView.transformContent(scale, this.contentMetaSize.separatorPosition * scale + this.bookMargins.padding.left, this.bookMargins.padding.top);
        }

        if(this.centerPageView.isDisplaying()) {
            this.centerPageView.transformContent(scale, this.bookMargins.padding.left, this.bookMargins.padding.top);
        }
    },

    updateContentMetaSize: function() {

        this.contentMetaSize = {};

        if(this.centerPageView.isDisplaying()) {
            this.contentMetaSize.width = this.centerPageView.meta_size.width;
            this.contentMetaSize.height = this.centerPageView.meta_size.height;
            this.contentMetaSize.separatorPosition = 0;
        }
        else if(this.leftPageView.isDisplaying() && this.rightPageView.isDisplaying()) {
            if(this.leftPageView.meta_size.height == this.rightPageView.meta_size) {
                this.contentMetaSize.width = this.leftPageView.meta_size.width + this.rightPageView.meta_size.width;
                this.contentMetaSize.height = this.leftPageView.meta_size.height;
                this.contentMetaSize.separatorPosition = this.leftPageView.meta_size.width;
            }
            else {
                //normalize by height
                this.contentMetaSize.width = this.leftPageView.meta_size.width + this.rightPageView.meta_size.width * (this.leftPageView.meta_size.height / this.rightPageView.meta_size.height);
                this.contentMetaSize.height = this.leftPageView.meta_size.height;
                this.contentMetaSize.separatorPosition = this.leftPageView.meta_size.width;
            }
        }
        else if(this.leftPageView.isDisplaying()) {
            this.contentMetaSize.width = this.leftPageView.meta_size.width * 2;
            this.contentMetaSize.height = this.leftPageView.meta_size.height;
            this.contentMetaSize.separatorPosition = this.leftPageView.meta_size.width;
        }
        else if(this.rightPageView.isDisplaying()) {
            this.contentMetaSize.width = this.rightPageView.meta_size.width * 2;
            this.contentMetaSize.height = this.rightPageView.meta_size.height;
            this.contentMetaSize.separatorPosition = this.rightPageView.meta_size.width;
        }
        else {
            this.contentMetaSize = undefined;
        }

    },

    updateBookMargins: function() {
        this.bookMargins = new ReadiumSDK.Helpers.ElementMargins(this.$el);
    },

    openPage: function(paginationRequest) {

        if(!paginationRequest.spineItem) {
            return;
        }

        this.spread.openItem(paginationRequest.spineItem);
        this.redraw();
    },


    openPagePrev: function() {

        this.spread.openPrev();
        this.redraw();
    },

    openPageNext: function() {

        this.spread.openNext();
        this.redraw();
    },

    updatePageViewForItem: function(pageView, item) {

        if(!item) {
            if(pageView.isDisplaying()) {
                pageView.remove();
            }

            return undefined;
        }

        if(!pageView.isDisplaying()) {
            this.$el.append(pageView.render().$el);
        }

        var dfd = $.Deferred();

        pageView.on("PageLoaded", dfd.resolve);

        pageView.loadSpineItem(item);

        return dfd.promise();

    },

    getPaginationInfo: function() {

        var paginationInfo = new ReadiumSDK.Models.CurrentPagesInfo(this.spine.items.length, this.spine.package.isFixedLayout(), this.spine.direction);

        var spreadItems = [this.spread.leftItem, this.spread.rightItem, this.spread.centerItem];

        for(var i = 0; i < spreadItems.length; i++) {

            var spreadItem = spreadItems[i];

            if(spreadItem) {
                paginationInfo.addOpenPage(0, 1, spreadItem.idref, spreadItem.index);
            }
        }

        return paginationInfo;
    },

    bookmarkCurrentPage: function() {

        var viewsToCheck = [];

        if( this.spine.isLeftToRight() ) {
            viewsToCheck = [this.leftPageView, this.centerPageView, this.rightPageView];
        }
        else {
            viewsToCheck = [this.rightPageView, this.centerPageView, this.leftPageView];
        }

        for(var i = 0; i < viewsToCheck.length; i++) {
            if(viewsToCheck[i].isDisplaying()) {

                var idref = viewsToCheck[i].currentSpineItem.idref;
                var cfi = viewsToCheck[i].getFirstVisibleElementCfi();

                if(cfi == undefined) {
                    cfi = "";
                }

                return new ReadiumSDK.Models.BookmarkData(idref, cfi);

            }
        }

        return new ReadiumSDK.Models.BookmarkData("", "");
    }

});