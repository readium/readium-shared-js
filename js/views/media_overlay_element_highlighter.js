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
    
    var USE_RANGY = true && (typeof rangy !== "undefined");
    var _rangyCSS = undefined;
    var _rangyRange = undefined;
    
    var HIGHLIGHT_ID = "MO_SPEAK";
    
    var self = this;

    var $userStyle = undefined;
    this.clearUserStyle = function()
    {
        this.reset();
        
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

        var $hel = $(_highlightedCfi.cfiTextParent);

        var hasAuthorStyle = _activeClass && _activeClass !== "";
        var overrideWithUserStyle = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS); // TODO: performance issue?

        ensureUserStyle($hel);

        var clazz = (overrideWithUserStyle || !hasAuthorStyle) ? DEFAULT_MO_ACTIVE_CLASS : _activeClass;

        if (USE_RANGY)
        {
            var doc = _highlightedCfi.cfiTextParent.ownerDocument;

            _rangyRange = rangy.createRange(doc); //createNativeRange

            var startCFI = "epubcfi(" + _highlightedCfi.partialStartCfi + ")";
            var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, doc);
//console.log(infoStart);

            var endCFI = "epubcfi(" + _highlightedCfi.partialEndCfi + ")";
            var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, doc);
//console.log(infoEnd);
            
            _rangyRange.setStartAndEnd(
                infoStart.textNode[0], infoStart.textOffset,
                infoEnd.textNode[0], infoEnd.textOffset
            );
            
            if (false && // we use CssClassApplier instead, because surroundContents() has no trivial undoSurroundContents() function (inc. text nodes normalisation, etc.)
                _rangyRange.canSurroundContents())
            {
                _rangyRange.MO_createCssClassApplier = false;
                
                var span = doc.createElementNS("http://www.w3.org/1999/xhtml", 'span');
                span.id = HIGHLIGHT_ID;
                span.setAttribute("id", span.id);
                span.setAttribute("class", clazz);
            
                _rangyRange.surroundContents(span);
            }
            else
            {
                _rangyRange.MO_createCssClassApplier = true;
                
                if (!_rangyCSS || _rangyCSS.cssClass !== clazz)
                {
                    _rangyCSS = rangy.createCssClassApplier(clazz,
                    {
                        elementTagName: "span",
                        elementProperties: undefined,
                        ignoreWhiteSpace: true,
                        applyToEditableOnly: false,
                        normalize: true
                    },
                    ["span"]);
                }

                _rangyCSS.applyToRange(_rangyRange);
            }
        }
        else
        {
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
            }
        }
    };
    
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

    this.reset = function() {
        
        if (_highlightedCfi)
        {
            var doc = _highlightedCfi.cfiTextParent.ownerDocument;
            if (USE_RANGY)
            {
                if (_rangyCSS && _rangyRange.MO_createCssClassApplier)
                {
                    _rangyCSS.undoToRange(_rangyRange);
                }
                else
                {
                    var toRemove = undefined;
                    while ((toRemove = doc.getElementById(HIGHLIGHT_ID)) !== null)
                    {
                        var txt = toRemove.textContent; // TODO: innerHTML? or better: hasChildNodes loop + detach and re-attach
                        var txtNode = doc.createTextNode(txt);
                        
                        toRemove.parentNode.replaceChild(txtNode, toRemove);
                        txtNode.parentNode.normalize();
                    }
                }
        
                //_rangyCSS = undefined;
                _rangyRange = undefined;
            }
            else
            {
                try
                {
                    _reader.removeHighlight(HIGHLIGHT_ID);
        
                    var toRemove = undefined;
                    while ((toRemove = doc.getElementById("start-" + HIGHLIGHT_ID)) !== null)
                    {
            console.log("toRemove START");
            console.log(toRemove);
                        toRemove.parentNode.removeChild(toRemove);
                    }
                    while ((toRemove = doc.getElementById("end-" + HIGHLIGHT_ID)) !== null)
                    {
            console.log("toRemove END");
            console.log(toRemove);
                        toRemove.parentNode.removeChild(toRemove);
                    }
                }
                catch(error)
                {
                    console.error(error);
                }
            }
            
            _highlightedCfi = undefined;
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
        }

        _activeClass = "";
        _playbackActiveClass = "";
    }

};