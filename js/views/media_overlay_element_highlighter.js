//  LauncherOSX
//
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

ReadiumSDK.Views.MediaOverlayElementHighlighter = function(reader) {

    var DEFAULT_MO_ACTIVE_CLASS = "mo-active-default";
    //var BACK_COLOR = "#99CCCC";

    var _highlightedElement = undefined;

    var _activeClass = "";
    var _playbackActiveClass = "";

    var _reader = reader;

    var self = this;

    var $userStyle = undefined;
    this.clearUserStyle = function()
    {
        if ($userStyle)
        {
            $userStyle.remove();
        }
        $userStyle = undefined;
    };

    function ensureUserStyle($element)
    {
        if ($userStyle)
        {
            if ($userStyle[0].ownerDocument === $element[0].ownerDocument)
            {
                return;
            }

            //self.clearUserStyle();
        }

        var style = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS);
        if (!style)
        {
            return;
        }

        $head = $("head", $element[0].ownerDocument.documentElement);

        $userStyle = $("<style type='text/css'> </style>").appendTo($head);

        $userStyle.append("." + DEFAULT_MO_ACTIVE_CLASS + " {");
        for(var prop in style.declarations)
        {
            if(!style.declarations.hasOwnProperty(prop))
            {
                continue;
            }

            $userStyle.append(prop + ": " + style.declarations[prop] + "; ");
        }
        $userStyle.append("}");

//console.debug($userStyle[0].textContent);
    }

    this.highlightElement = function(element, activeClass, playbackActiveClass) {

        if(!element || element === _highlightedElement) {
            return;
        }

        this.reset();

        _highlightedElement = element;
        _activeClass = activeClass;
        _playbackActiveClass = playbackActiveClass;

        if (_playbackActiveClass && _playbackActiveClass !== "")
        {
            //console.debug("MO playbackActiveClass: " + _playbackActiveClass);
            $(_highlightedElement.ownerDocument.documentElement).addClass(_playbackActiveClass);
            //console.debug("MO playbackActiveClass 2: " + _highlightedElement.ownerDocument.documentElement.classList);
        }

        if (_activeClass && _activeClass !== "")
        {
            //console.debug("MO activeClass: " + _activeClass);
            $(_highlightedElement).addClass(_activeClass);
        }
        else
        {
            //console.debug("MO active NO CLASS: " + _activeClass);

            var $hel = $(_highlightedElement);
            ensureUserStyle($hel);
            $hel.addClass(DEFAULT_MO_ACTIVE_CLASS);

            //$(_highlightedElement).css("background", BACK_COLOR);
        }
    };

    this.reset = function() {

        if(_highlightedElement) {

            if (_playbackActiveClass && _playbackActiveClass !== "")
            {
                //console.debug("MO RESET playbackActiveClass: " + _playbackActiveClass);
                $(_highlightedElement.ownerDocument.documentElement).removeClass(_playbackActiveClass);
            }

            if (_activeClass && _activeClass !== "")
            {
                //console.debug("MO RESET activeClass: " + _activeClass);
                $(_highlightedElement).removeClass(_activeClass);
            }
            else
            {
                //console.debug("MO RESET active NO CLASS: " + _activeClass);
                $(_highlightedElement).removeClass(DEFAULT_MO_ACTIVE_CLASS);
                //$(_highlightedElement).css("background", '');
            }

            _highlightedElement = undefined;
            _activeClass = "";
            _playbackActiveClass = "";
        }
    }

};