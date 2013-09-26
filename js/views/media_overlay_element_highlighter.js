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

ReadiumSDK.Views.MediaOverlayElementHighlighter = function() {

    var _highlightedElement = undefined;
    var BACK_COLOR = "#99CCCC";

    var _activeClass = "";

    this.highlightElement = function(element, activeClass) {

        if(!element || element === _highlightedElement) {
            return;
        }

        this.reset();

        _highlightedElement = element;
        _activeClass = activeClass;

        if (_activeClass && _activeClass !== "")
        {
            console.debug("MO activeClass: " + _activeClass);
            $(_highlightedElement).addClass(_activeClass);
        }
        else
        {
            console.debug("MO active NO CLASS: " + _activeClass);
            $(_highlightedElement).css("background", BACK_COLOR);
        }
    };

    this.reset = function() {

        if(_highlightedElement) {

            if (_activeClass && _activeClass !== "")
            {
                console.debug("MO RESET activeClass: " + _activeClass);
                $(_highlightedElement).removeClass(_activeClass);
            }
            else
            {
                console.debug("MO RESET active NO CLASS: " + _activeClass);
                $(_highlightedElement).css("background", '');
            }

            _highlightedElement = undefined;
            _activeClass = "";
        }
    }

};