//  LauncherOSX
//
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

define(['jquery', 'rangy', 'readium_cfi_js'], function($, rangy, epubCfi) {
/**
 *
 * @param reader
 * @constructor
 */
var MediaOverlayElementHighlighter = function(reader) {

    this.includeParWhenAdjustingToSeqSyncGranularity = true;

    var DEFAULT_MO_ACTIVE_CLASS = "mo-active-default";
    var DEFAULT_MO_SUB_SYNC_CLASS = "mo-sub-sync";
    
    //var BACK_COLOR = "#99CCCC";

    var _highlightedElementPar = undefined;
    this.isElementHighlighted = function(par)
    {
        return _highlightedElementPar && par === _highlightedElementPar;
    };
    
    var _highlightedCfiPar = undefined;
    this.isCfiHighlighted = function(par)
    {
        return _highlightedCfiPar && par === _highlightedCfiPar;
    };

    var _activeClass = "";
    var _playbackActiveClass = "";

    var _reader = reader;
    
    var USE_RANGY = true && (typeof rangy !== "undefined");
    var _rangyCSS = undefined;
    var _rangyRange = undefined;
    
    var HIGHLIGHT_ID = "MO_SPEAK";
    
    var self = this;

    var $userStyle = undefined;
    
    this.reDo = function()
    {
        //this.reset();
        
        if ($userStyle)
        {
            $userStyle.remove();
        }
        $userStyle = undefined;

        var he = _highlightedElementPar;
        var hc = _highlightedCfiPar;
        var c1 = _activeClass;
        var c2 = _playbackActiveClass;
        
        if (_highlightedElementPar)
        {
            this.reset();

            this.highlightElement(he, c1, c2);
        }
        else if (_highlightedCfiPar)
        {
            this.reset();

            this.highlightCfi(hc, c1, c2);
        }
    };

    function ensureUserStyle($element, hasAuthorStyle, overrideWithUserStyle)
    {
        if ($userStyle)
        {
            try
            {
                if ($userStyle[0].ownerDocument === $element[0].ownerDocument)
                {
                    return;
                }
            }
            catch (e)
            {
                
            }
        }


        $head = $("head", $element[0].ownerDocument.documentElement);

        $userStyle = $("<style type='text/css'> </style>");

        $userStyle.append("." + DEFAULT_MO_ACTIVE_CLASS + " {");
        
        var fallbackUserStyle = "background-color: yellow !important; color: black !important; border-radius: 0.4em;";
        
        var style = overrideWithUserStyle; //_reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS);
        if (style)
        {
            var atLeastOne = false;
            for(var prop in style.declarations)
            {
                if(!style.declarations.hasOwnProperty(prop))
                {
                    continue;
                }

                atLeastOne = true;
                $userStyle.append(prop + ": " + style.declarations[prop] + "; ");
            }
            
            if (!atLeastOne && !hasAuthorStyle)
            {
                $userStyle.append(fallbackUserStyle);
            }
        }
        else if (!hasAuthorStyle)
        {
            $userStyle.append(fallbackUserStyle);
        }
        
        $userStyle.append("}");
        
        
        // ---- CFI
        //$userStyle.append(" .highlight {background-color: blue; border: 2x solid green;}"); //.hover-highlight
        
        
        $userStyle.appendTo($head);

//console.debug($userStyle[0].textContent);
    };
    
    this.highlightElement = function(par, activeClass, playbackActiveClass) {

        if(!par || par === _highlightedElementPar) {
            return;
        }

        this.reset();

        _highlightedElementPar = par;
        _highlightedCfiPar = undefined;
        
        _activeClass = activeClass;
        _playbackActiveClass = playbackActiveClass;

        var seq = this.adjustParToSeqSyncGranularity(_highlightedElementPar);
        var element = seq.element;
        
        if (_playbackActiveClass && _playbackActiveClass !== "")
        {
            //console.debug("MO playbackActiveClass: " + _playbackActiveClass);
            $(element.ownerDocument.documentElement).addClass(_playbackActiveClass);
            //console.debug("MO playbackActiveClass 2: " + element.ownerDocument.documentElement.classList);
        }

        var $hel = $(element);

        var hasAuthorStyle = _activeClass && _activeClass !== "";
        var overrideWithUserStyle = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS);

        ensureUserStyle($hel, hasAuthorStyle, overrideWithUserStyle);
                
        if (overrideWithUserStyle || !hasAuthorStyle)
        {
            //console.debug("MO active NO CLASS: " + _activeClass);

            if (hasAuthorStyle)
            {
                $hel.addClass(_activeClass);
            }
            
            $hel.addClass(DEFAULT_MO_ACTIVE_CLASS);

            //$(element).css("background", BACK_COLOR);
        }
        else
        {
            //console.debug("MO activeClass: " + _activeClass);
            $hel.addClass(_activeClass);
        }
        
        if (this.includeParWhenAdjustingToSeqSyncGranularity || _highlightedElementPar !== seq)
        {
            $(_highlightedElementPar.element).addClass(DEFAULT_MO_SUB_SYNC_CLASS);
        }
        
// ---- CFI
//         try
//         {
//             // //noinspection JSUnresolvedVariable
//             // var cfi = EPUBcfi.Generator.generateElementCFIComponent(element); //$hel[0]
//             // if(cfi[0] == "!") {
//             //     cfi = cfi.substring(1);
//             // }
// 
// //console.log(element);
//         
//             var firstTextNode = getFirstTextNode(element);
//             var txtFirst = firstTextNode.textContent;
// //console.log(txtFirst);
// 
//             var lastTextNode = getLastTextNode(element);
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

        if(!par || par === _highlightedCfiPar) {
            return;
        }

        this.reset();

        _highlightedElementPar = undefined;
        _highlightedCfiPar = par;
        
        _activeClass = activeClass;
        _playbackActiveClass = playbackActiveClass;

        var $hel = $(_highlightedCfiPar.cfi.cfiTextParent);

        var hasAuthorStyle = _activeClass && _activeClass !== "";
        var overrideWithUserStyle = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS); // TODO: performance issue?

        ensureUserStyle($hel, hasAuthorStyle, overrideWithUserStyle);

        var clazz = (overrideWithUserStyle || !hasAuthorStyle) ? ((hasAuthorStyle ? (_activeClass + " ") : "") + DEFAULT_MO_ACTIVE_CLASS) : _activeClass;

        if (USE_RANGY)
        {
            var doc = _highlightedCfiPar.cfi.cfiTextParent.ownerDocument;

            _rangyRange = rangy.createRange(doc); //createNativeRange

            var startCFI = "epubcfi(" + _highlightedCfiPar.cfi.partialStartCfi + ")";
            var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

            var endCFI = "epubcfi(" + _highlightedCfiPar.cfi.partialEndCfi + ")";
            var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
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
                span.setAttribute("class", clazz + " mo-cfi-highlight");
            
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
                        elementProperties: {className: "mo-cfi-highlight"},
                        ignoreWhiteSpace: true,
                        applyToEditableOnly: false,
                        normalize: true
                    },
                    ["span"]);
                }

                _rangyCSS.applyToRange(_rangyRange);
            }
        }
        else if (_reader.plugins.highlights) // same API, newer implementation
        {
            try
            {
                //var id = $hel.data("mediaOverlayData").par.getSmil().spineItemId;
                var id = par.getSmil().spineItemId;
                _reader.plugins.highlights.addHighlight(id, par.cfi.partialRangeCfi, HIGHLIGHT_ID,
                "highlight", //"underline"
                undefined // styles
                            );
            }
            catch(error)
            {
                console.error(error);
            }
        }
        else if (_reader.plugins.annotations) // legacy
        {
            try
            {
                //var id = $hel.data("mediaOverlayData").par.getSmil().spineItemId;
                var id = par.getSmil().spineItemId;
                _reader.plugins.annotations.addHighlight(id, par.cfi.partialRangeCfi, HIGHLIGHT_ID,
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
        
        if (_highlightedCfiPar)
        {
            var doc = _highlightedCfiPar.cfi.cfiTextParent.ownerDocument;
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
            else if (_reader.plugins.highlights) // same API, new implementation
            {
                try
                {
                    _reader.plugins.highlights.removeHighlight(HIGHLIGHT_ID);
        
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
            else if (_reader.plugins.annotations) // legacy
            {
                try
                {
                    _reader.plugins.annotations.removeHighlight(HIGHLIGHT_ID);
        
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
            
            _highlightedCfiPar = undefined;
        }
        
        
        

        if(_highlightedElementPar) {

            var seq = this.adjustParToSeqSyncGranularity(_highlightedElementPar);
            var element = seq.element;
            if (this.includeParWhenAdjustingToSeqSyncGranularity || _highlightedElementPar !== seq)
            {
                $(_highlightedElementPar.element).removeClass(DEFAULT_MO_SUB_SYNC_CLASS);
            }
            
            if (_playbackActiveClass && _playbackActiveClass !== "")
            {
                //console.debug("MO RESET playbackActiveClass: " + _playbackActiveClass);
                $(element.ownerDocument.documentElement).removeClass(_playbackActiveClass);
            }

            if (_activeClass && _activeClass !== "")
            {
                //console.debug("MO RESET activeClass: " + _activeClass);
                $(element).removeClass(_activeClass);
            }
            //else
            //{
                //console.debug("MO RESET active NO CLASS: " + _activeClass);
                $(element).removeClass(DEFAULT_MO_ACTIVE_CLASS);
                //$(element).css("background", '');
            //}

            _highlightedElementPar = undefined;
        }

        _activeClass = "";
        _playbackActiveClass = "";
    };

    this.adjustParToSeqSyncGranularity = function(par)
    {
        if (!par) return undefined;
        
        var sync = _reader.viewerSettings().mediaOverlaysSynchronizationGranularity;
        if (sync && sync.length > 0)
        {
            var element = par.element || (par.cfi ? par.cfi.cfiTextParent : undefined);
            if (!element)
            {
                console.error("adjustParToSeqSyncGranularity !element ???");
                return par; // should never happen!
            }

            var seq = par.getFirstSeqAncestorWithEpubType(sync, this.includeParWhenAdjustingToSeqSyncGranularity);
            if (seq && seq.element)
            {
                return seq;
            }
        }
        
        return par;
    };
};
    return MediaOverlayElementHighlighter;
});
