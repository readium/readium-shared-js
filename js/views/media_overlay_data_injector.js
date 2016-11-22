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

define (["jquery", "underscore", "../helpers", "../models/smil_iterator", "rangy", 'readium_cfi_js'], function($, _, Helpers, SmilIterator, rangy, epubCfi) {
/**
 *
 * @param mediaOverlay
 * @param mediaOverlayPlayer
 * @constructor
 */
var MediaOverlayDataInjector = function (mediaOverlay, mediaOverlayPlayer) {

    this.attachMediaOverlayData = function ($iframe, spineItem, mediaOverlaySettings) {

        var contentDocElement = $iframe[0].contentDocument.documentElement;

        if (!spineItem.media_overlay_id && mediaOverlay.smil_models.length === 0) {
            return;
        }

        var $body = $("body", contentDocElement);
        if ($body.length == 0) {
            console.error("! BODY ???");
        }
        else {
            var click = $body.data("mediaOverlayClick");
            if (click) {
                console.error("[WARN] already mediaOverlayClick");
            }
            else {
                $body.data("mediaOverlayClick", {ping: "pong"});

                var touchClickMOEventHandler = function (event)
                {
                    //console.debug("MO TOUCH-DOWN: "+event.type);
                    
                    var elem = $(this)[0]; // body
                    elem = event.target; // body descendant

                    if (!elem)
                    {
                        mediaOverlayPlayer.touchInit();
                        return true;
                    }

//console.debug("MO CLICK: " + elem.id);

                    var data = undefined;
                    var el = elem;

                    var inLink = false;
                    if (el.nodeName.toLowerCase() === "a")
                    {
                        inLink = true;
                    }

                    while (!(data = $(el).data("mediaOverlayData")))
                    {
                        if (el.nodeName.toLowerCase() === "a")
                        {
                            inLink = true;
                        }
                        el = el.parentNode;
                        if (!el)
                        {
                            break;
                        }
                    }
                    
                    if (data && (data.par || data.pars))
                    {
                        if (el !== elem)
                        {
//console.log("MO CLICK REDIRECT: " + el.id);
                        }

                        if (!mediaOverlaySettings.mediaOverlaysEnableClick)
                        {
console.log("MO CLICK DISABLED");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        if (inLink)
                        {
console.log("MO CLICKED LINK");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        var par = data.par ? data.par : data.pars[0];

                        if (data.pars && (typeof rangy !== "undefined"))
                        {
                            var wasPaused = false;
                            
                            // To remove highlight which may have altered DOM (and break CFI expressions)
                            if (mediaOverlayPlayer.isPlayingCfi())
                            {
                                wasPaused = true;
                                mediaOverlayPlayer.pause();
                            }
                         
                            // /////////////////////
                            // 
                            // var p = {x: event.pageX, y: event.pageY};
                            // if (webkitConvertPointFromPageToNode)
                            // {
                            //     p = webkitConvertPointFromPageToNode(elem.ownerDocument.body, new WebKitPoint(event.pageX, event.pageY));
                            // }
                            // 
                            // var div = elem.ownerDocument.getElementById("CLICKED");
                            // if (div)
                            // {
                            //     div.parentNode.removeChild(div);
                            // }
                            // 
                            // div = elem.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", 'div');
                            // div.setAttribute("style", "background-color: red; position: absolute; z-index: 999; width: 50px; height: 50px; left: " + p.x + "px; top: " + p.y + "px;");
                            // div.id = "CLICKED";
                            // div.setAttribute("id", div.id);
                            // var divTxt = elem.ownerDocument.createTextNode(" ");
                            // div.appendChild(divTxt);
                            // elem.ownerDocument.body.appendChild(div);
                            //                          
                            // /////////////////////


                            //rangy.init();
                            try
                            {
// THIS WORKS (same as Rangy's method below)
//                                 var r;
//                                 if (elem.ownerDocument.caretRangeFromPoint)
//                                 {
//                                     r = elem.ownerDocument.caretRangeFromPoint(event.pageX, event.pageY);
//                                 }
//                                 else if (event.rangeParent)
//                                 {
//                                     r = elem.ownerDocument.createRange();
//                                     range.setStart(event.rangeParent, event.rangeOffset);
//                                 }
//                                 
// console.log("------ 1");
// console.log(elem.ownerDocument);
// console.log(event.pageX);
// console.log(event.pageY);
// console.log(r.startContainer);
// console.log(r.startOffset);
// console.log("------");

                                var pos = rangy.positionFromPoint(event.pageX, event.pageY, elem.ownerDocument);
// console.log("------ 2");
// console.log(pos.node.textContent);
// console.log(pos.offset);
// console.log("------");

                                par = undefined;
                                
                                for (var iPar = 0; iPar < data.pars.length; iPar++)
                                {
                                    var p = data.pars[iPar];

                                    var startCFI = "epubcfi(" + p.cfi.partialStartCfi + ")";
                                    var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, elem.ownerDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

                                    var endCFI = "epubcfi(" + p.cfi.partialEndCfi + ")";
                                    var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, elem.ownerDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoEnd);

                                    var range = rangy.createRange(elem.ownerDocument); //createNativeRange
                                    range.setStartAndEnd(
                                        infoStart.textNode, infoStart.textOffset,
                                        infoEnd.textNode, infoEnd.textOffset
                                    );
        
                                    if (range.isPointInRange(pos.node, pos.offset))
                                    {
// console.log(p.cfi.partialStartCfi);
// console.log(p.cfi.partialEndCfi);
                                        // DOUBLE CHECK WITH getClientRects ??
                                        
                                        par = p;
                                        break;
                                    }
                                }
                            }
                            catch (e)
                            {
                                console.error(e);
                            }
                            
                            if (!par)
                            {
                                if (wasPaused)
                                {
                                    mediaOverlayPlayer.toggleMediaOverlay();
                                }
                                return true;
                            }
                        }


                        if (el && el != elem && el.nodeName.toLowerCase() === "body" && par && !par.getSmil().id)
                        {
//console.debug("MO CLICKED BLANK BODY");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        mediaOverlayPlayer.playUserPar(par);
                        return true;
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

                            var isPlaying = mediaOverlayPlayer.isPlaying();
                            if (readaloud === "start" && !isPlaying ||
                                readaloud === "stop" && isPlaying ||
                                readaloud === "startstop")
                            {
                                mediaOverlayPlayer.toggleMediaOverlay();
                                return true;
                            }
                        }
                    }

                    mediaOverlayPlayer.touchInit();
                    return true;
                };

                var touchClickMOEventHandler_ = _.debounce(touchClickMOEventHandler, 200);
                
                if ('ontouchstart' in document.documentElement)
                {
                  $body[0].addEventListener("touchstart", touchClickMOEventHandler_, false);
                }
                $body[0].addEventListener("mousedown", touchClickMOEventHandler_, false);

                //var clickEvent = 'ontouchstart' in document.documentElement ? 'touchstart' : 'click';
                //$body.bind(clickEvent, touchClickMOEventHandler);
            }
        }

        var smil = mediaOverlay.getSmilBySpineItem(spineItem);
        if (!smil)
        {
            console.error("NO SMIL?? " + spineItem.idref + " /// " + spineItem.media_overlay_id);
            return;
        }

        var traverseSmilSeqs = function(root)
        {
            if (!root) return;
            
            if (root.nodeType && root.nodeType === "seq")
            {
               // if (root.element)
               // {
               //     console.error("WARN: seq.element already set: " + root.textref);
               // }
                   
               if (root.textref)
               {
                   var parts = root.textref.split('#');
                   var file = parts[0];
                   var fragmentId = (parts.length === 2) ? parts[1] : "";
                   // 
                   // console.debug(root.textref);
                   // console.debug(fragmentId);
                   // console.log("---- SHOULD BE EQUAL:");
                   // console.debug(file);
                   // console.debug(par.text.srcFile);
                   // 
                   // if (file !== par.text.srcFile)
                   // {
                   //     console.error("adjustParToSeqSyncGranularity textref.file !== par.text.srcFile ???");
                   //     return par;
                   // }
                   // 
                   // if (!fragmentId)
                   // {
                   //     console.error("adjustParToSeqSyncGranularity !fragmentId ???");
                   //     return par;
                   // }

                   if (file && fragmentId)
                   {
                       var textRelativeRef = Helpers.ResolveContentRef(file, smil.href);
                       var same = textRelativeRef === spineItem.href;
                       if (same)
                       {                       
                           root.element = $iframe[0].contentDocument.getElementById(fragmentId);
                   
                           if (!root.element)
                           {
                               console.error("seq.textref !element? " + root.textref);
                           }

                           // var selector = "#" + Helpers.escapeJQuerySelector(fragmentId);
                           // var $element = $(selector, element.ownerDocument.documentElement);
                           // if ($element)
                           // {
                           //     seq.element = $element[0];
                           // }
                       }
                   }
               }
            }
            
            if (root.children && root.children.length)
            {
                for (var i = 0; i < root.children.length; i++)
                {
                    var child = root.children[i];
                    traverseSmilSeqs(child);
                }
            }
        };
        traverseSmilSeqs(smil);

//console.debug("[[MO ATTACH]] " + spineItem.idref + " /// " + spineItem.media_overlay_id + " === " + smil.id);

        var iter = new SmilIterator(smil);
        
        var fakeOpfRoot = "/99!";
        var epubCfiPrefix = "epubcfi";
        
        while (iter.currentPar) {
            iter.currentPar.element = undefined;
            iter.currentPar.cfi = undefined;

            if (true) { //iter.currentPar.text.srcFragmentId (includes empty frag ID)

                var textRelativeRef = Helpers.ResolveContentRef(iter.currentPar.text.srcFile, iter.smil.href);

                var same = textRelativeRef === spineItem.href;
                if (same) {
                    var selectBody = !iter.currentPar.text.srcFragmentId || iter.currentPar.text.srcFragmentId.length == 0;
                    var selectId = iter.currentPar.text.srcFragmentId.indexOf(epubCfiPrefix) == 0 ? undefined : iter.currentPar.text.srcFragmentId;

                    var $element = undefined;
                    var isCfiTextRange = false;
                    if (!selectBody && !selectId)
                    {
                        if (iter.currentPar.text.srcFragmentId.indexOf(epubCfiPrefix) === 0)
                        {
                            var partial = iter.currentPar.text.srcFragmentId.substr(epubCfiPrefix.length + 1, iter.currentPar.text.srcFragmentId.length - epubCfiPrefix.length - 2);
                            
                            if (partial.indexOf(fakeOpfRoot) === 0)
                            {
                                partial = partial.substr(fakeOpfRoot.length, partial.length - fakeOpfRoot.length);
                            }
//console.log(partial);
                            var parts = partial.split(",");
                            if (parts && parts.length === 3)
                            {
                                try
                                {
                                    var partialStartCfi = parts[0] + parts[1];
                                    var startCFI = "epubcfi(" + partialStartCfi + ")";
                                    var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, $iframe[0].contentDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

                                    var partialEndCfi = parts[0] + parts[2];
                                    var endCFI = "epubcfi(" + partialEndCfi + ")";
                                    var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, $iframe[0].contentDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoEnd);

                                    var cfiTextParent = infoStart.textNode.parentNode;

                                    iter.currentPar.cfi = {
                                        smilTextSrcCfi: iter.currentPar.text.srcFragmentId,
                                        partialRangeCfi: partial,
                                        partialStartCfi: partialStartCfi,
                                        partialEndCfi: partialEndCfi,
                                        
                                        cfiTextParent: cfiTextParent
                                        
                                        // textNode becomes invalid after highlighting! (dynamic span insertion/removal changes DOM)
                                        // cfiRangeStart: infoStart,
                                        // cfiRangeEnd: infoEnd
                                    };
                                    
                                    // TODO: not just start textNode, but all of them between start and end...
                                    // ...that being said, CFI text ranges likely to be used only within a single common parent,
                                    // so this is an acceptable implementation shortcut for this CFI experimentation (word-level text/audio synchronisation).
                                    isCfiTextRange = true;
                                    $element = $(cfiTextParent);
                                    var modata = $element.data("mediaOverlayData");
                                    if (!modata)
                                    {
                                        modata = {pars: [iter.currentPar]};
                                        $element.data("mediaOverlayData", modata);
                                    }
                                    else
                                    {
                                        if (modata.par)
                                        {
                                            console.error("[WARN] non-CFI MO DATA already exists!");
                                            modata.par = undefined;
                                        }

                                        var found = false;
                                        if (modata.pars)
                                        {
                                            for (var iPars = 0; iPars < modata.pars.length; iPars++)
                                            {
                                                var par = modata.pars[iPars];

                                                if (par === iter.currentPar)
                                                {
                                                    found = true;
                                                    console.error("[WARN] mediaOverlayData CFI PAR already registered!");
                                                }
                                            }
                                        }
                                        else
                                        {
                                            modata.pars = [];
                                        }

                                        if (!found)
                                        {
                                            modata.pars.push(iter.currentPar);
                                        }
                                    }

                                }
                                catch (error)
                                {
                                    console.error(error);
                                }
                            }
                            else
                            {
                                try
                                {
                                    var cfi = "epubcfi(" + partial + ")";
                                    $element = EPUBcfi.getTargetElementWithPartialCFI(cfi, $iframe[0].contentDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
                                }
                                catch (error)
                                {
                                    console.error(error);
                                }
                            }
                        }
                        else 
                        {
                            console.error("SMIL text@src CFI fragment identifier scheme not supported: " + iter.currentPar.text.srcFragmentId);
                        }
                    }
                    else
                    {
                        if (selectBody)
                        {
                            $element = $body; //$("body", contentDocElement);
                        }
                        else
                        {
                            $element = $($iframe[0].contentDocument.getElementById(selectId));
                            //$element = $("#" + Helpers.escapeJQuerySelector(iter.currentPar.text.srcFragmentId), contentDocElement);
                        }
                    }

                    if ($element && $element.length > 0) {

                        if (!isCfiTextRange)
                        {
                            if (iter.currentPar.element && iter.currentPar.element !== $element[0]) {
                                console.error("DIFFERENT ELEMENTS??! " + iter.currentPar.text.srcFragmentId + " /// " + iter.currentPar.element.id);
                            }

                            var name = $element[0].nodeName ? $element[0].nodeName.toLowerCase() : undefined;
                            if (name === "audio" || name === "video") {
                                $element.attr("preload", "auto");
                            }

                            iter.currentPar.element = $element[0];

                            var modata = $element.data("mediaOverlayData");
                            if (modata) {
                                console.error("[WARN] MO DATA already exists.");

                                if (modata.par && modata.par !== iter.currentPar) {
                                    console.error("DIFFERENT PARS??!");
                                }
                            }

                            $element.data("mediaOverlayData", {par: iter.currentPar});

                            /*
                             $element.click(function() {
                             var elem = $(this)[0];
                             console.debug("MO CLICK (ELEM): " + elem.id);

                             var par = $(this).data("mediaOverlayData").par;
                             mediaOverlayPlayer.playUserPar(par);
                             });
                             */
                        }
                    }
                    else {
                        console.error("!! CANNOT FIND ELEMENT: " + iter.currentPar.text.srcFragmentId + " == " + iter.currentPar.text.srcFile + " /// " + spineItem.href);
                    }
                }
                else {
//console.debug("[INFO] " + spineItem.href + " != " + textRelativeRef + " # " + iter.currentPar.text.srcFragmentId);
                }
            }

            iter.next();
        }
    }
};

return MediaOverlayDataInjector;
});
