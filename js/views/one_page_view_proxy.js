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

ReadiumSDK.Views.OnePageViewProxy = function(spineItem, $contentFrame, options, isContinuousScroll){

    var self = this;

    var _pageView = new ReadiumSDK.Views.OnePageView(options, isContinuousScroll);

    _pageView.on(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED, function($iframe, spineItem, isNewContentDocumentLoaded){

        if(isNewContentDocumentLoaded) {
            self.updateSize();
        }
    });

    this.element = function() {
        return _pageView.element();
    };

    this.setViewSettings = function(settings) {
        _pageView.setViewSettings(settings);
    };

    this.render = function() {
        _pageView.render();
        _pageView.element().css("height", $contentFrame.height() + "px");
        return this;
    };

    this.on = function(eventName, callback) {
        _pageView.on(eventName, callback);
    };

    this.off = function(eventName) {
        _pageView.off(eventName);
    };

    this.load = function(callback) {

        if(_pageView.isDisplaying()) {
            if(callback) {
                callback(false);
            }

            return;
        }

        _pageView.loadSpineItem(spineItem, function(){

            _pageView.resizeIFrameToContent();

            if(callback) {
                callback(true);
            }

        });
    };

    this.hide = function(callback) {

        var sizeChanged;

        if(_pageView.isDisplaying()) {
            _pageView.clear();
            sizeChanged = true;
        }
        else {
            sizeChanged = false;
        }

        if(callback) {
            callback(sizeChanged);
        }
    };

    this.elementHeight = function() {
        return _pageView.elementHeight();
    };

    this.currentSpineItem = function() {
        return spineItem;
    };

    this.scaleToWidth = function(width) {

        if(_pageView.isDisplaying()) {
            _pageView.scaleToWidth(width)
        }
    };

    this.applyBookStyles = function() {
        _pageView.applyBookStyles();
    };

    this.getNavigator = function() {
        return _pageView.getNavigator();
    };

    this.updateSize = function() {

        if(!_pageView.isDisplaying()) {
            return;
        }

        if(spineItem.isFixedLayout()) {
            _pageView.scaleToWidth($contentFrame.width());
        }
        else {
            _pageView.resizeIFrameToContent();
        }

    };

    this.isDisplaying = function() {
        return _pageView.isDisplaying();
    }
};