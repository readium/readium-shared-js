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

ReadiumSDK.Views.MediaOverlayTextHighlighter = function() {

    var _highlightedElement = undefined;

    this.highlightElement = function(element) {
        this.reset();
        $(element).addClass("media-overlay-highlight");
        _highlightedElement = element;
    };

    this.reset = function() {

        if(_highlightedElement) {
            $(_highlightedElement).removeClass("media-overlay-highlight");
        }
    }

};