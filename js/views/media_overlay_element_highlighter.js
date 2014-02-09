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
    var _highlightedCfi = undefined;

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


        $head = $("head", $element[0].ownerDocument.documentElement);

        $userStyle = $("<style type='text/css'> </style>");

        $userStyle.append("." + DEFAULT_MO_ACTIVE_CLASS + " {");
        
        var style = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS);        
        if (style)
        {
            for(var prop in style.declarations)
            {
                if(!style.declarations.hasOwnProperty(prop))
                {
                    continue;
                }

                $userStyle.append(prop + ": " + style.declarations[prop] + "; ");
            }
        }
        
        $userStyle.append("}");
        
        
        // ---- CFI
        //$userStyle.append(" .highlight {background-color: blue; border: 2x solid green;}"); //.hover-highlight
        
        
        $userStyle.appendTo($head);

//console.debug($userStyle[0].textContent);
    }
    
    this.highlightElement = function(element, activeClass, playbackActiveClass) {

        if(!element || element === _highlightedElement) {
            return;
        }

        this.reset();

        _highlightedElement = element;
        _highlightedCfi = undefined;
        _activeClass = activeClass;
        _playbackActiveClass = playbackActiveClass;

        if (_playbackActiveClass && _playbackActiveClass !== "")
        {
            //console.debug("MO playbackActiveClass: " + _playbackActiveClass);
            $(_highlightedElement.ownerDocument.documentElement).addClass(_playbackActiveClass);
            //console.debug("MO playbackActiveClass 2: " + _highlightedElement.ownerDocument.documentElement.classList);
        }

        var $hel = $(_highlightedElement);

        var hasAuthorStyle = _activeClass && _activeClass !== "";
        var overrideWithUserStyle = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS); // TODO: performance issue?

        ensureUserStyle($hel);
                
        if (overrideWithUserStyle || !hasAuthorStyle)
        {
            //console.debug("MO active NO CLASS: " + _activeClass);

            $hel.addClass(DEFAULT_MO_ACTIVE_CLASS);

            //$(_highlightedElement).css("background", BACK_COLOR);
        }
        else
        {
            //console.debug("MO activeClass: " + _activeClass);
            $hel.addClass(_activeClass);
        }
        
        
// ---- CFI
//         try
//         {
//             // //noinspection JSUnresolvedVariable
//             // var cfi = EPUBcfi.Generator.generateElementCFIComponent(_highlightedElement); //$hel[0]
//             // if(cfi[0] == "!") {
//             //     cfi = cfi.substring(1);
//             // }
// 
// //console.log(_highlightedElement);
//         
//             var firstTextNode = getFirstTextNode(_highlightedElement);
//             var txtFirst = firstTextNode.textContent;
// //console.log(txtFirst);
// 
//             var lastTextNode = getLastTextNode(_highlightedElement);
//             var txtLast = lastTextNode.textContent;
// //console.log(txtLast);
//         
//             var cfi = EPUBcfi.Generator.generateCharOffsetRangeComponent(
//                     firstTextNode, 
//                     0, 
//                     lastTextNode, 
//                     txtLast.length,
//                     ["cfi-marker"],
//                     [],
//                     ["MathJax_Message"]
//                     );
//             
//             var id = $hel.data("mediaOverlayData").par.getSmil().spineItemId;
//             _reader.addHighlight(id, cfi, HIGHLIGHT_ID,
//             "highlight", //"underline"
//             undefined // styles
//                         );
//         }
//         catch(error)
//         {
//             console.error(error);
//         
//             removeHighlight();
//         }
    };
    
    this.highlightCfi = function(par, activeClass, playbackActiveClass) {

        this.reset();

        _highlightedElement = undefined;
        _highlightedCfi = par.cfi;
        _activeClass = activeClass;
        _playbackActiveClass = playbackActiveClass;

        var $hel = $(_highlightedCfi.cfiRangeStart.textNode[0].parentNode);

        var hasAuthorStyle = _activeClass && _activeClass !== "";
        var overrideWithUserStyle = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS); // TODO: performance issue?

        ensureUserStyle($hel);

        var clazz = (overrideWithUserStyle || !hasAuthorStyle) ? DEFAULT_MO_ACTIVE_CLASS : _activeClass;
        
        // TODO: use Rangy span-based highlighter? (instead of readium-annotation div overlay)
        // http://rangy.googlecode.com/svn/trunk/demos/highlighter.html
        // https://code.google.com/p/rangy/wiki/HighlighterModule
        try
        {
            //var id = $hel.data("mediaOverlayData").par.getSmil().spineItemId;
            var id = par.getSmil().spineItemId;
            _reader.addHighlight(id, par.cfi.partialRangeCfi, HIGHLIGHT_ID,
            "highlight", //"underline"
            undefined // styles
                        );
        }
        catch(error)
        {
            console.error(error);
        
            removeHighlight();
        }
    };
    
    var HIGHLIGHT_ID = "MO_SPEAK";
    
// ---- CFI
//     
//     function getFirstTextNode(node)
//     {
//         if (node.nodeType === Node.TEXT_NODE)
//         {
//             if (node.textContent.trim().length > 0)
//                 return node;
//         }
//         
//         for (var i = 0; i < node.childNodes.length; i++)
//         {
//             var child = node.childNodes[i];
//             var first = getFirstTextNode(child);
//             if (first)
//             {
//                 return first;
//             }
//         }
//         
//         return undefined;
//     }
//     
//     function getLastTextNode(node)
//     {
//         if (node.nodeType === Node.TEXT_NODE)
//         {
//             if (node.textContent.trim().length > 0)
//                 return node;
//         }
//         
//         for (var i = node.childNodes.length-1; i >= 0; i--)
//         {
//             var child = node.childNodes[i];
//             var last = getLastTextNode(child);
//             if (last)
//             {
//                 return last;
//             }
//         }
//         
//         return undefined;
//     }
//     
    function removeHighlight()
    {
        _reader.removeHighlight(HIGHLIGHT_ID);
        
        var toRemove = undefined;
        while ((toRemove = document.getElementById("start-" + HIGHLIGHT_ID)) !== null)
        {
console.log("toRemove START");
console.log(toRemove);
            toRemove.parent.removeChild(toRemove);
        }
        while ((toRemove = document.getElementById("end-" + HIGHLIGHT_ID)) !== null)
        {
console.log("toRemove END");
console.log(toRemove);
            toRemove.parent.removeChild(toRemove);
        }
    }

    this.reset = function() {

        try
        {
            removeHighlight();
        }
        catch(error)
        {
            console.error(error);
        }
        

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
            //else
            //{
                //console.debug("MO RESET active NO CLASS: " + _activeClass);
                $(_highlightedElement).removeClass(DEFAULT_MO_ACTIVE_CLASS);
                //$(_highlightedElement).css("background", '');
            //}

            _highlightedElement = undefined;
            _activeClass = "";
            _playbackActiveClass = "";
        }
    }

};