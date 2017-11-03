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

define(["../globals", "jquery", "../helpers", "./audio_player", "./media_overlay_element_highlighter", "../models/smil_iterator", "rangy", 'readium_cfi_js', './scroll_view'],
    function(Globals, $, Helpers, AudioPlayer, MediaOverlayElementHighlighter, SmilIterator, rangy, epubCfi, ScrollView) {
/**
 *
 * @param reader
 * @param onStatusChanged
 * @constructor
 */
var MediaOverlayPlayer = function(reader, onStatusChanged) {


    var _smilIterator = undefined;

    var _audioPlayer = new AudioPlayer(onStatusChanged, onAudioPositionChanged, onAudioEnded, onPlay, onPause);

    var _ttsIsPlaying = false;
    var _currentTTS = undefined;
    var _enableHTMLSpeech = true && typeof window.speechSynthesis !== "undefined" && speechSynthesis != null; // set to false to force "native" platform TTS engine, rather than HTML Speech API
    
    var _SpeechSynthesisUtterance = undefined;
    //var _skipTTSEndEvent = false;
    var TOKENIZE_TTS = false;

    var _embeddedIsPlaying = false;
    var _currentEmbedded = undefined;


    this.isPlaying = function()
    {
        return _audioPlayer.isPlaying() || _ttsIsPlaying || _embeddedIsPlaying || _blankPagePlayer;
    }

    //var _currentPagination = undefined;
    var _package = reader.package();
    var _settings = reader.viewerSettings();
    var self = this;
    var _elementHighlighter = new MediaOverlayElementHighlighter(reader);

    reader.on(Globals.Events.READER_VIEW_DESTROYED, function(){
        Globals.logEvent("READER_VIEW_DESTROYED", "ON", "media_overlay_player.js");
        
        self.reset();
    });


    this.applyStyles = function()
    {
        _elementHighlighter.reDo();
    };

//
// should use this.onSettingsApplied() instead!
//    this.setRate = function(rate) {
//        _audioPlayer.setRate(rate);
//    };
//    this.setVolume = function(volume) {
//        _audioPlayer.setVolume(volume);
//    };


    this.onSettingsApplied = function() {
//console.debug(_settings);
        _audioPlayer.setRate(_settings.mediaOverlaysRate);
        _audioPlayer.setVolume(_settings.mediaOverlaysVolume / 100.0);
    };
    self.onSettingsApplied();
    
    reader.on(Globals.Events.SETTINGS_APPLIED, function() {
        
        Globals.logEvent("SETTINGS_APPLIED", "ON", "media_overlay_player.js");
        this.onSettingsApplied();
    }, this);

    /*
    var lastElement = undefined;
    var lastElementColor = "";
    */

    var _wasPlayingAtDocLoadStart = false;
    this.onDocLoadStart = function() {
        // 1) Globals.Events.CONTENT_DOCUMENT_LOAD_START
        // (maybe 2-page fixed-layout or reflowable spread == 2 documents == 2x events)
        // MOPLayer.onDocLoad()
        
        // 2) Globals.Events.CONTENT_DOCUMENT_LOADED
        // (maybe 2-page fixed-layout or reflowable spread == 2 documents == 2x events)
        //_mediaOverlayDataInjector.attachMediaOverlayData($iframe, spineItem, _viewerSettings);
        
        // 3) Globals.Events.PAGINATION_CHANGED (layout finished, notified before rest of app, just once)
        // MOPLayer.onPageChanged()

        var wasPlaying = self.isPlaying();
        if (wasPlaying)
        {
            _wasPlayingAtDocLoadStart = true;
            self.pause();
        }
    };
    
    var _lastPaginationData = undefined;
    
    this.onPageChanged = function(paginationData) {
        
        _lastPaginationData = paginationData;
        
        var wasPausedBecauseNoAutoNextSmil = _wasPausedBecauseNoAutoNextSmil;
        _wasPausedBecauseNoAutoNextSmil = false;
        
        var wasPlayingAtDocLoadStart = _wasPlayingAtDocLoadStart;
        _wasPlayingAtDocLoadStart = false;

        if(!paginationData) {
            self.reset();
            return;
        }

//        if (paginationData.paginationInfo)
//        {
//            _currentPagination = paginationData.paginationInfo;
//        }

        /*
        if (lastElement)
        {
            $(lastElement).css("background-color", lastElementColor);
            lastElement = undefined;
        }
        */

        var element = undefined;
        var isCfiTextRange = false;
        
        var fakeOpfRoot = "/99!";
        var epubCfiPrefix = "epubcfi";
        
        if (paginationData.elementId || paginationData.initiator == self)
        {
            var spineItems = reader.getLoadedSpineItems();

            var rtl = reader.spine().isRightToLeft();

            for(var i = (rtl ? (spineItems.length - 1) : 0); rtl && i >=0 || !rtl && i < spineItems.length; i += (rtl ? -1: 1))
            {
                var spineItem = spineItems[i];
                if (paginationData.spineItem && paginationData.spineItem != spineItem)
                {
                    continue;
                }
                
                if (paginationData.elementId && paginationData.elementId.indexOf(epubCfiPrefix) === 0)
                {
                    _elementHighlighter.reset(); // ensure clean DOM (no CFI span markers)
                    
                    var partial = paginationData.elementId.substr(epubCfiPrefix.length + 1, paginationData.elementId.length - epubCfiPrefix.length - 2);
                    
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
                            var cfi = parts[0] + parts[1];
                            var $element = reader.getElementByCfi(spineItem.idref, cfi,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);

                            element = ($element && $element.length > 0) ? $element[0] : undefined;
                            if (element)
                            {
                                if (element.nodeType === Node.TEXT_NODE)
                                {
                                    element = element.parentNode;
                                }
                                break;
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
                            //var cfi = "epubcfi(" + partial + ")";
                            //var $element = EPUBcfi.getTargetElementWithPartialCFI(cfi, DOC);
                            var $element = reader.getElementByCfi(spineItem.idref, partial,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
                                
                            element = ($element && $element.length > 0) ? $element[0] : undefined;
                            if (element)
                            {
                                if (element.nodeType === Node.TEXT_NODE)
                                {
                                    element = element.parentNode;
                                }
                                break;
                            }
                        }
                        catch (error)
                        {
                            console.error(error);
                        }
                    }
                }

                if (!element)
                {
                    if (paginationData.initiator == self && !paginationData.elementId)
                    {
                        var $element = reader.getElement(spineItem.idref, "body");
                        element = ($element && $element.length > 0) ? $element[0] : undefined;
                    }
                    else
                    {
                        var $element = reader.getElementById(spineItem.idref, paginationData.elementId);
                        element = ($element && $element.length > 0) ? $element[0] : undefined;
                        //("#" + Globals.Helpers.escapeJQuerySelector(paginationData.elementId))
                    }
                    
                    if (element)
                    {
                        /*
                        console.error("GREEN: " + paginationData.elementId);
                        lastElement = element;
                        lastElementColor = $(element).css("background-color");
                        $(element).css("background-color", "green");
                         */
                        break;
                    }
                }
            }

            if (!element)
            {
                console.error("paginationData.elementId BUT !element: " + paginationData.elementId);
            }
        }

        var wasPlaying = self.isPlaying() || wasPlayingAtDocLoadStart;

        if(!_smilIterator || !_smilIterator.currentPar) {
            if(paginationData.initiator !== self) {
                clipBeginOffset = 0.0;
                self.reset();

                if (paginationData.elementId && element)
                {
                    if (wasPlaying || wasPausedBecauseNoAutoNextSmil)
                    {
                        paginationData.elementIdResolved = element;
                        self.toggleMediaOverlayRefresh(paginationData);
                    }
                }
                else if (wasPlaying || wasPausedBecauseNoAutoNextSmil)
                {
                    self.toggleMediaOverlay();
                }
                return;
            }

            //paginationData.initiator === self
//
//            if (!paginationData.elementId)
//            {
//                console.error("!paginationData.elementId");
//                clipBeginOffset = 0.0;
//                return;
//            }

            if(!element)
            {
                console.error("!element: " + paginationData.elementId);
                clipBeginOffset = 0.0;
                return;
            }

            var moData = $(element).data("mediaOverlayData");
            if(!moData) {
                console.error("!moData: " + paginationData.elementId);
                clipBeginOffset = 0.0;
                return;
            }

            var parToPlay = moData.par ? moData.par : moData.pars[0];

            if (moData.pars)
            {
                for (var iPar = 0; iPar < moData.pars.length; iPar++)
                {
                    var p = moData.pars[iPar];
                    
                    if (paginationData.elementId === p.cfi.smilTextSrcCfi)
                    {
                        parToPlay = p;
                        break;
                    }
                }
            }
            
            playPar(parToPlay);
            return;
        }

        var noReverseData = !_smilIterator.currentPar.element && !_smilIterator.currentPar.cfi;
        if(noReverseData) {
            console.error("!! _smilIterator.currentPar.element ??");
        }

//console.debug("+++> paginationData.elementId: " + paginationData.elementId + " /// " + _smilIterator.currentPar.text.srcFile + " # " + _smilIterator.currentPar.text.srcFragmentId); //PageOpenRequest.elementId


        if(paginationData.initiator == self)
        {
            var notSameTargetID = paginationData.elementId && paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId;

            if(notSameTargetID) {
                console.error("!! paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId");
            }

            if(notSameTargetID || noReverseData) {
                clipBeginOffset = 0.0;
                return;
            }

            if(wasPlaying)
            {
                highlightCurrentElement();
            }
            else
            {
                playCurrentPar();
            }
        }
        else
        {
            if(!wasPlaying && !wasPausedBecauseNoAutoNextSmil)
            {
                self.reset();
                return;
            }

            if(!paginationData.elementId)
            {
                //self.reset();
            }

            if(paginationData.elementId && !element)
            {
                //self.reset();
                return;
            }

            if(paginationData.elementId)
            {
                paginationData.elementIdResolved = element;
            }
            
            self.toggleMediaOverlayRefresh(paginationData);
        }
    };

    function playPar(par) {

        var parSmil = par.getSmil();
        if(!_smilIterator || _smilIterator.smil != parSmil)
        {
            _smilIterator = new SmilIterator(parSmil);
        }
        else {
            _smilIterator.reset();
        }

        _smilIterator.goToPar(par);

        if(!_smilIterator.currentPar) {
            console.error("playPar !_smilIterator.currentPar");
            return;
        }

        playCurrentPar();
    }

    var clipBeginOffset = 0.0;

    var _blankPagePlayer = undefined;

    function initBlankPagePlayer()
    {
        self.resetBlankPage();

        _blankPagePlayer = setTimeout(function() {

            if (!_blankPagePlayer)
            {
                return;
            }

            self.resetBlankPage();

            if (!_smilIterator || !_smilIterator.currentPar)
            {
                self.reset();
                return;
            }

            audioCurrentTime = 0.0;
//console.log("BLANK END.");
            //nextSmil(true);
            onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 2);

        }, 2000);

        onStatusChanged({isPlaying: true});
    }

    function playCurrentPar() {
        _wasPlayingScrolling = false;
        
        if (!_smilIterator || !_smilIterator.currentPar)
        {
            console.error("playCurrentPar !_smilIterator || !_smilIterator.currentPar ???");
            return;
        }

        if (!_smilIterator.smil.id)
        {
            _audioPlayer.reset();

            self.resetTTS();
            self.resetEmbedded();

            setTimeout(function()
            {
                initBlankPagePlayer();
            }, 100);

            return;
        }
        else if (!_smilIterator.currentPar.audio.src)
        {
            clipBeginOffset = 0.0;

//            if (_currentTTS)
//            {
//                _skipTTSEnded = true;
//            }

            _audioPlayer.reset();

            var element = _smilIterator.currentPar.element;
            if (element)
            {
                audioCurrentTime = 0.0;

                var name = element.nodeName ? element.nodeName.toLowerCase() : undefined;

                if (name === "audio" || name === "video")
                {
                    self.resetTTS();
                    self.resetBlankPage();

                    if (_currentEmbedded)
                    {
                        self.resetEmbedded();
                    }

                    _currentEmbedded = element;

                    _currentEmbedded.pause();

                    // DONE at reader_view.attachMO()
                    //$(_currentEmbedded).attr("preload", "auto");

                    _currentEmbedded.currentTime = 0;

                    _currentEmbedded.play();

                    $(_currentEmbedded).on("ended", self.onEmbeddedEnd);

                    _embeddedIsPlaying = true;
                    
                    // gives the audio player some dispatcher time to raise the onPause event
                    setTimeout(function(){
                        onStatusChanged({isPlaying: true});
                    }, 80);

//                    $(element).on("seeked", function()
//                    {
//                        $(element).off("seeked", onSeeked);
//                    });
                }
                else
                {
                    self.resetEmbedded();
                    self.resetBlankPage();

                    _currentTTS = element.textContent; //.innerText (CSS display sensitive + script + style tags)
                    if (!_currentTTS || _currentTTS == "")
                    {
                        _currentTTS = undefined;
                    }
                    else
                    {
                        speakStart(_currentTTS);
                    }
                }
            }
            
            var cfi = _smilIterator.currentPar.cfi;
            if (cfi)
            {
                audioCurrentTime = 0.0;
                self.resetEmbedded();
                self.resetBlankPage();

                _elementHighlighter.reset(); // ensure clean DOM (no CFI span markers)
                
                var doc = cfi.cfiTextParent.ownerDocument;

                var startCFI = "epubcfi(" + cfi.partialStartCfi + ")";
                var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

                var endCFI = "epubcfi(" + cfi.partialEndCfi + ")";
                var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoEnd);

                if (rangy)
                {
                    //infoStart.textNode.parentNode.ownerDocument
                    var range = rangy.createRange(doc); //createNativeRange
                    range.setStartAndEnd(
                        infoStart.textNode, infoStart.textOffset,
                        infoEnd.textNode, infoEnd.textOffset
                    );
                    _currentTTS = range.toString(); //.text()
                }
                else
                {
                    _currentTTS = undefined;
                }

                if (!_currentTTS || _currentTTS == "")
                {
                    _currentTTS = undefined;
                }
                else
                {
                    speakStart(_currentTTS);
                }
            }
        }
        else
        {
            self.resetTTS();
            self.resetEmbedded();
            self.resetBlankPage();

            var dur = _smilIterator.currentPar.audio.clipEnd - _smilIterator.currentPar.audio.clipBegin;
            if (dur <= 0 || clipBeginOffset > dur)
            {
                console.error("### MO XXX PAR OFFSET: " + clipBeginOffset + " / " + dur);
                clipBeginOffset = 0.0;
            }
            else
            {
//console.debug("### MO PAR OFFSET: " + clipBeginOffset);
            }

            var audioContentRef = Helpers.ResolveContentRef(_smilIterator.currentPar.audio.src, _smilIterator.smil.href);

            var audioSource = _package.resolveRelativeUrlMO(audioContentRef);

            var startTime = _smilIterator.currentPar.audio.clipBegin + clipBeginOffset;

//console.debug("PLAY START TIME: " + startTime + "("+_smilIterator.currentPar.audio.clipBegin+" + "+clipBeginOffset+")");

            _audioPlayer.playFile(_smilIterator.currentPar.audio.src, audioSource, startTime); //_smilIterator.currentPar.element ? _smilIterator.currentPar.element : _smilIterator.currentPar.cfi.cfiTextParent
        }

        clipBeginOffset = 0.0;

        highlightCurrentElement();
    }

    function nextSmil(goNext)
    {
        self.pause();

//console.debug("current Smil: " + _smilIterator.smil.href + " /// " + _smilIterator.smil.id);

        var nextSmil = goNext ? _package.media_overlay.getNextSmil(_smilIterator.smil) : _package.media_overlay.getPreviousSmil(_smilIterator.smil);
        if(nextSmil) {

//console.debug("nextSmil: " + nextSmil.href + " /// " + nextSmil.id);

            _smilIterator = new SmilIterator(nextSmil);
            if(_smilIterator.currentPar) {
                if (!goNext)
                {
                    while (!_smilIterator.isLast())
                    {
                        _smilIterator.next();
                    }
                }

//console.debug("openContentUrl (nextSmil): " + _smilIterator.currentPar.text.src + " -- " + _smilIterator.smil.href);

                reader.openContentUrl(_smilIterator.currentPar.text.src, _smilIterator.smil.href, self);
            }
        }
        else
        {
            console.log("No more SMIL");
            self.reset();
        }
    }


    var _skipAudioEnded = false;
//    var _skipTTSEnded = false;

    var audioCurrentTime = 0.0;

    var DIRECTION_MARK = -999;

//    var _letPlay = false;

//from
//1 = audio player
//2 = blank page
//3 = video/audio embbeded
//4 = TTS
//5 = audio end
//6 = user previous/next/escape
    function onAudioPositionChanged(position, from, skipping) { //noLetPlay

        audioCurrentTime = position;

//        if (_letPlay)
//        {
//            return;
//        }

        _skipAudioEnded = false;
//        _skipTTSEnded = false;

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            return;
        }

        var parFrom = _smilIterator.currentPar;
        
        var audio = _smilIterator.currentPar.audio;

        //var TOLERANCE = 0.05;
        if(
            //position >= (audio.clipBegin - TOLERANCE) &&
        position > DIRECTION_MARK &&
            position <= audio.clipEnd) {

//console.debug("onAudioPositionChanged: " + position);
            return;
        }

        _skipAudioEnded = true;

//console.debug("PLAY NEXT: " + "(" + audio.clipBegin + " -- " + audio.clipEnd + ") [" + from + "] " +  position);
//console.debug(_smilIterator.currentPar.text.srcFragmentId);

        var isPlaying = _audioPlayer.isPlaying();
        if (isPlaying && from === 6)
        {
            console.debug("from userNav _audioPlayer.isPlaying() ???");
        }

        var goNext = position > audio.clipEnd;

        var doNotNextSmil = !_autoNextSmil && from !== 6 && goNext;

        var spineItemIdRef = (_smilIterator && _smilIterator.smil && _smilIterator.smil.spineItemId) ? _smilIterator.smil.spineItemId : ((_lastPaginationData && _lastPaginationData.spineItem && _lastPaginationData.spineItem.idref) ? _lastPaginationData.spineItem.idref : undefined);
        if (doNotNextSmil && spineItemIdRef && _lastPaginationData && _lastPaginationData.paginationInfo && _lastPaginationData.paginationInfo.openPages && _lastPaginationData.paginationInfo.openPages.length > 1)
        {
            //var iPage = _lastPaginationData.paginationInfo.isRightToLeft ? _lastPaginationData.paginationInfo.openPages.length - 1 : 0;
            var iPage = 0;
            
            var openPage = _lastPaginationData.paginationInfo.openPages[iPage];
            if (spineItemIdRef === openPage.idref)
            {
                doNotNextSmil = false;
            }
        }
        
        if (goNext)
        {
            _smilIterator.next();
        }
        else //position <= DIRECTION_MARK
        {
            _smilIterator.previous();
        }

        if(!_smilIterator.currentPar)
        {
            //
            //        if (!noLetPlay)
            //        {
            //            _letPlay = true;
            //            setTimeout(function()
            //            {
            //                _letPlay = false;
            //                nextSmil(goNext);
            //            }, 200);
            //        }
            //        else
            //        {
            //            nextSmil(goNext);
            //        }

//console.debug("NEXT SMIL ON AUDIO POS");
        
            if (doNotNextSmil)
            {
                _wasPausedBecauseNoAutoNextSmil = true;
                self.reset();
                //self.pause();
            }
            else
            {
                nextSmil(goNext);
            }
            return;
        }

//console.debug("ITER: " + _smilIterator.currentPar.text.srcFragmentId);

        if(!_smilIterator.currentPar.audio) {
            self.pause();
            return;
        }
        
        if(_settings.mediaOverlaysSkipSkippables)
        {
            var skip = false;
            var parent = _smilIterator.currentPar;
            while (parent)
            {
                if (parent.isSkippable && parent.isSkippable(_settings.mediaOverlaysSkippables))
                {
                    skip = true;
                    break;
                }
                parent = parent.parent;
            }

            if (skip)
            {
                console.log("MO SKIP: " + parent.epubtype);

                self.pause();

                var pos = goNext ? _smilIterator.currentPar.audio.clipEnd + 0.1 : DIRECTION_MARK - 1;

                onAudioPositionChanged(pos, from, true); //noLetPlay
                return;
            }
        }

        // _settings.mediaOverlaysSynchronizationGranularity
        if (!isPlaying && (_smilIterator.currentPar.element || _smilIterator.currentPar.cfi && _smilIterator.currentPar.cfi.cfiTextParent))
        {
            var scopeTo = _elementHighlighter.adjustParToSeqSyncGranularity(_smilIterator.currentPar);
            if (scopeTo && scopeTo !== _smilIterator.currentPar)
            {
                var scopeFrom = _elementHighlighter.adjustParToSeqSyncGranularity(parFrom);
                if (scopeFrom && (scopeFrom === scopeTo || !goNext))
                {
                    if (scopeFrom === scopeTo)
                    {
                        do
                        {
                            if (goNext) _smilIterator.next();
                            else  _smilIterator.previous();
                        } while (_smilIterator.currentPar && _smilIterator.currentPar.hasAncestor(scopeFrom));

                        if (!_smilIterator.currentPar)
                        {
    //console.debug("adjustParToSeqSyncGranularity nextSmil(goNext)");

                            if (doNotNextSmil)
                            {
                                _wasPausedBecauseNoAutoNextSmil = true;
                                self.reset();
                                //self.pause();
                            }
                            else
                            {
                                nextSmil(goNext);
                            }
                            
                            return;
                        }
                    }
                    
//console.debug("ADJUSTED: " + _smilIterator.currentPar.text.srcFragmentId);
                    if (!goNext)
                    {
                        var landed = _elementHighlighter.adjustParToSeqSyncGranularity(_smilIterator.currentPar);
                        if (landed && landed !== _smilIterator.currentPar)
                        {
                            var backup = _smilIterator.currentPar;
                    
                            var innerPar = undefined;
                            do
                            {
                                innerPar = _smilIterator.currentPar;
                                _smilIterator.previous();
                            }
                            while (_smilIterator.currentPar && _smilIterator.currentPar.hasAncestor(landed));
                        
                            if (_smilIterator.currentPar)
                            {
                                _smilIterator.next();
                                
                                if (!_smilIterator.currentPar.hasAncestor(landed))
                                {
                                    console.error("adjustParToSeqSyncGranularity !_smilIterator.currentPar.hasAncestor(landed) ???");
                                }
                                //assert 
                            }
                            else
                            {
//console.debug("adjustParToSeqSyncGranularity reached begin");

                                _smilIterator.reset();
                                
                                if (_smilIterator.currentPar !== innerPar)
                                {
                                    console.error("adjustParToSeqSyncGranularity _smilIterator.currentPar !=== innerPar???");
                                }
                            }

                            if (!_smilIterator.currentPar)
                            {
                                console.error("adjustParToSeqSyncGranularity !_smilIterator.currentPar ?????");
                                _smilIterator.goToPar(backup);
                            }
                            
//console.debug("ADJUSTED PREV: " + _smilIterator.currentPar.text.srcFragmentId);
                        }
                    }
                }
            }
        }
        
        if(_audioPlayer.isPlaying()
            && _smilIterator.currentPar.audio.src
            && _smilIterator.currentPar.audio.src == _audioPlayer.currentSmilSrc()
                && position >= _smilIterator.currentPar.audio.clipBegin
                && position <= _smilIterator.currentPar.audio.clipEnd)
        {
//console.debug("ONLY highlightCurrentElement");
            highlightCurrentElement();
            return;
        }

        //position <= DIRECTION_MARK goes here (goto previous):

//            if (!noLetPlay && position > DIRECTION_MARK
//                && _audioPlayer.isPlaying() && _audioPlayer.srcRef() != _smilIterator.currentPar.audio.src)
//            {
//                _letPlay = true;
//                setTimeout(function()
//                {
//                    _letPlay = false;
//                    playCurrentPar();
//                }, 100);
//
//                playCurrentPar();
//
//                return;
//            }

        playCurrentPar();
    }

    this.touchInit = function()
    {
        return _audioPlayer.touchInit();
    };

    var tokeniseTTS = function(element)
    {
        var BLOCK_DELIMITERS = ['p', 'div', 'pagenum', 'td', 'table', 'li', 'ul', 'ol'];
        var BOUNDARY_PUNCTUATION = [',', ';', '.', '-', '??', '??', '?', '!'];
        var IGNORABLE_PUNCTUATION = ['"', '\'', '??', '??', '??', '??'];

        var flush = function(t, r)
        {
            if (t.word.length <= 0)
            {
                return;
            }

            var pos = t.text.length;
            r.spanMap[pos] = t.counter;
            t.text += t.word;
            t.markup += t.html.substring(0, t.wordStart) +
                '<span class="tts_off" id="tts_' + t.counter + '">' +
                t.html.substring(t.wordStart, t.wordEnd) +
                '</span>' + t.html.substring(t.wordEnd, t.html.length);
            t.word = "";
            t.html = "";
            t.wordStart = -1;
            t.wordEnd = -1;
            t.counter++;
        };

        var r =
        {
            element : element,
            innerHTML_tts : "",
            spanMap : {},
            text : "",
            lastCharIndex : undefined
        };
        r.element.innerHTML_original = element.innerHTML;

        var t =
        {
            inTag : false,
            counter : 0,
            wordStart : -1,
            wordEnd : -1,
            text : '',
            markup : '',
            word : '',
            html : ''
        };

        var limit = r.element.innerHTML_original.length;
        var i = 0;
        while (i <= limit)
        {
            if (t.inTag)
            {
                t.html += r.element.innerHTML_original[i];
                if (r.element.innerHTML_original[i] == ">") {
                    t.inTag = false;
                    // if it's a block element delimiter, flush
                    var blockCheck = t.html.match(/<\/(.*?)>$/);
                    if (blockCheck && BLOCK_DELIMITERS.indexOf(blockCheck[1]) > -1)
                    {
                        flush(t, r);
                        t.text += ' ';
                    }
                }
            }
            else
            {
                if (i == limit || r.element.innerHTML_original[i].match(/\s/))
                {
                    flush(t, r);

                    // append the captured whitespace
                    if (i < limit)
                    {
                        t.text += r.element.innerHTML_original[i];
                        t.markup += r.element.innerHTML_original[i];
                    }
                }
                else if (BOUNDARY_PUNCTUATION.indexOf(r.element.innerHTML_original[i]) > -1)
                {
                    flush(t, r);

                    t.wordStart = t.html.length;
                    t.wordEnd = t.html.length + 1;
                    t.word += r.element.innerHTML_original[i];
                    t.html += r.element.innerHTML_original[i];

                    flush(t, r);
                }
                else if (r.element.innerHTML_original[i] == "<")
                {
                    t.inTag = true;
                    t.html += r.element.innerHTML_original[i];
                }
                else
                {
                    if (t.word.length == 0)
                    {
                        t.wordStart = t.html.length;
                    }
                    t.wordEnd = t.html.length + 1;
                    t.word += r.element.innerHTML_original[i];
                    t.html += r.element.innerHTML_original[i];
                }
            }
            i++;
        }
//
//console.debug(t.text);
//        console.debug("----");
//console.debug(t.markup);

        r.text = t.text;
        r.innerHTML_tts = t.markup;
        r.element.innerHTML = r.innerHTML_tts;

        return r;
    };

    var $ttsStyle = undefined;
    function ensureTTSStyle($element)
    {
        if ($ttsStyle && $ttsStyle[0].ownerDocument === $element[0].ownerDocument)
        {
            return;
        }

        var style = ".tts_on{background-color:red;color:white;} .tts_off{}";

        $head = $("head", $element[0].ownerDocument.documentElement);

        $ttsStyle = $("<style type='text/css'> </style>").appendTo($head);

        $ttsStyle.append(style);
    }

    var speakStart = function(txt, volume)
    {
        var tokenData = undefined;
        var curPar = (_smilIterator && _smilIterator.currentPar) ? _smilIterator.currentPar : undefined;
        var element = curPar ? curPar.element : undefined;
        var cfi = curPar ? curPar.cfi : undefined;

        if (!volume || volume > 0)
        {
            // gives the audio player some dispatcher time to raise the onPause event
            setTimeout(function(){
                onStatusChanged({isPlaying: true});
            }, 80);
            
            _ttsIsPlaying = true;

            if (TOKENIZE_TTS && element)
            {
                var $el = $(element);
                ensureTTSStyle($el);


                if (element.innerHTML_original)
                {
                    element.innerHTML = element.innerHTML_original;
                    element.innerHTML_original = undefined;
                }
                tokenData = tokeniseTTS(element);
            }
        }

        if (!_enableHTMLSpeech)
        {
            Globals.logEvent("MEDIA_OVERLAY_TTS_SPEAK", "EMIT", "media_overlay_player.js");
            reader.emit(Globals.Events.MEDIA_OVERLAY_TTS_SPEAK, {tts: txt}); // resume if txt == undefined
            return;
        }

        if (!txt && window.speechSynthesis.paused)
        {
//console.debug("TTS resume");
            window.speechSynthesis.resume();

            return;
        }

        var text = txt || _currentTTS;

        if (text)
        {
            if (_SpeechSynthesisUtterance)
            {
//console.debug("_SpeechSynthesisUtterance nullify");

                if (TOKENIZE_TTS)
                {
                    if (_SpeechSynthesisUtterance.onend)
                    {
                        _SpeechSynthesisUtterance.onend({forceSkipEnd: true, target: _SpeechSynthesisUtterance});
                    }
                    
                    _SpeechSynthesisUtterance.tokenData = undefined;
                    
                    _SpeechSynthesisUtterance.onboundary = undefined;
    //                 _SpeechSynthesisUtterance.onboundary = function(event)
    //                 {
    // console.debug("OLD TTS boundary");
    //                 
    //                         event.target.tokenData = undefined;
    //  
    //                 };
                }

                _SpeechSynthesisUtterance.onend = undefined;
//                 _SpeechSynthesisUtterance.onend = function(event)
//                 {
// console.debug("OLD TTS ended");
//                     if (TOKENIZE_TTS)
//                     {
//                         event.target.tokenData = undefined;
//                     }
//                 };
                
                _SpeechSynthesisUtterance.onerror = undefined;
//                 _SpeechSynthesisUtterance.onerror = function(event)
//                 {
// console.debug("OLD TTS error");
// //console.debug(event);
//                     if (TOKENIZE_TTS)
//                     {
//                         event.target.tokenData = undefined;
//                     }
//                 };

                _SpeechSynthesisUtterance = undefined;
            }
//
//            if (window.speechSynthesis.pending ||
//                window.speechSynthesis.speaking)
//            {
//                _skipTTSEndEvent = true;
//            }
            
console.debug("paused: "+window.speechSynthesis.paused);
console.debug("speaking: "+window.speechSynthesis.speaking);
console.debug("pending: "+window.speechSynthesis.pending);

//             if (!window.speechSynthesis.paused)
//             {
// console.debug("TTS pause before speak");
//                 window.speechSynthesis.pause();
//             }
            
            function cancelTTS(first)
            {
                if (first || window.speechSynthesis.pending)
                {
    console.debug("TTS cancel before speak");
                    window.speechSynthesis.cancel();

                    setTimeout(function()
                    {
                        cancelTTS(false);
                    }, 5);
                }
                else
                {
                    updateTTS();
                }
            }
            cancelTTS(true);
            
            function updateTTS()
            {
            // setTimeout(function()
            // {

                _SpeechSynthesisUtterance = new SpeechSynthesisUtterance();

                if (TOKENIZE_TTS && tokenData)
                {
                    _SpeechSynthesisUtterance.tokenData = tokenData;
                
                    _SpeechSynthesisUtterance.onboundary = function(event)
                    //_SpeechSynthesisUtterance.addEventListener("boundary", function(event)
                    {
                        if (!_SpeechSynthesisUtterance)
                        {
                            return;
                        }

        console.debug("TTS boundary: " + event.name + " / " + event.charIndex);
        //console.debug(event);

                        var tokenised = event.target.tokenData;
                        if (!tokenised || !tokenised.spanMap.hasOwnProperty(event.charIndex))
                        {
                            return;
                        }

                        if (false && tokenised.lastCharIndex)
                        {
        //console.debug("TTS lastCharIndex: " + tokenised.lastCharIndex);
                            var id = 'tts_' + tokenised.spanMap[tokenised.lastCharIndex];
        //console.debug("TTS lastCharIndex ID: " + id);
                            var spanPrevious = tokenised.element.querySelector("#"+id);
                            if (spanPrevious)
                            {
        //console.debug("TTS OFF");
                                spanPrevious.className = 'tts_off';
                                //spanPrevious.style.backgroundColor = "white";
                            }
                        }
                        else
                        {
                            [].forEach.call(
                                tokenised.element.querySelectorAll(".tts_on"),
                                function(el)
                                {
        console.debug("TTS OFF " + el.id);
                                    el.className = 'tts_off';
                                }
                            );
                        }

                        var id = 'tts_' + tokenised.spanMap[event.charIndex];
        console.debug("TTS charIndex ID: " + id);
                        var spanNew = tokenised.element.querySelector("#"+id);
                        if (spanNew)
                        {
        console.debug("TTS ON");
                            spanNew.className = 'tts_on';
                            //spanNew.style.backgroundColor = "transparent";
                        }

                        tokenised.lastCharIndex = event.charIndex;
                    };
                }

                _SpeechSynthesisUtterance.onend = function(event)
                //_SpeechSynthesisUtterance.addEventListener("end", function(event)
                {
                    if (!_SpeechSynthesisUtterance)
                    {
                        //_skipTTSEndEvent = false;
                        return;
                    }
    //
    //                if (_skipTTSEndEvent)
    //                {
    //                    _skipTTSEndEvent = false;
    //                    return;
    //                }

console.debug("TTS ended");
    //console.debug(event);

                    if (TOKENIZE_TTS)
                    {
                        var tokenised = event.target.tokenData;

                        var doEnd = !event.forceSkipEnd && (_SpeechSynthesisUtterance === event.target) && (!tokenised || tokenised.element.innerHTML_original);

                        if (tokenised)
                        {
                            if (tokenised.element.innerHTML_original)
                            {
                                tokenised.element.innerHTML = tokenised.element.innerHTML_original;
                            }
                            else
                            {
                                [].forEach.call(
                                    tokenised.element.querySelectorAll(".tts_on"),
                                    function(el)
                                    {
        console.debug("TTS OFF (end)" + el.id);
                                        el.className = 'tts_off';
                                    }
                                );
                            }

                            tokenised.element.innerHTML_original = undefined;
                        }


                        if (doEnd)
                        {
                            self.onTTSEnd();
                        }
                        else
                        {
    console.debug("TTS end SKIPPED");
                        }
                    }
                    else
                    {
                        self.onTTSEnd();
                    }
                };

                _SpeechSynthesisUtterance.onerror = function(event)
                //_SpeechSynthesisUtterance.addEventListener("error", function(event)
                {
                    if (!_SpeechSynthesisUtterance)
                    {
                        return;
                    }

console.error("TTS error");
//console.debug(event);
console.debug(_SpeechSynthesisUtterance.text);
console.debug(window.speechSynthesis.paused);
console.debug(window.speechSynthesis.pending);
console.debug(window.speechSynthesis.speaking);

                    if (TOKENIZE_TTS)
                    {
                        var tokenised = event.target.tokenData;
                        if (tokenised)
                        {
                            if (tokenised.element.innerHTML_original)
                            {
                                tokenised.element.innerHTML = tokenised.element.innerHTML_original;
                            }
                            else
                            {
                                [].forEach.call(
                                    tokenised.element.ownerDocument.querySelectorAll(".tts_on"),
                                    function(el)
                                    {
        console.debug("TTS OFF (error)" + el.id);
                                        el.className = 'tts_off';
                                    }
                                );
                            }
                            tokenised.element.innerHTML_original = undefined;
                        }
                    }
                };

                var vol = volume || _audioPlayer.getVolume();
                _SpeechSynthesisUtterance.volume = vol;

                _SpeechSynthesisUtterance.rate = _audioPlayer.getRate();
                _SpeechSynthesisUtterance.pitch = 1;

                //_SpeechSynthesisUtterance.lang = "en-US";

                _SpeechSynthesisUtterance.text = text;

    //console.debug("TTS speak: " + text);
                window.speechSynthesis.speak(_SpeechSynthesisUtterance);

                if (window.speechSynthesis.paused)
                {
console.debug("TTS resume");
                    window.speechSynthesis.resume();
                }

           //}, 5);
           }
        }
    };

    var speakStop = function()
    {
        var wasPlaying = _ttsIsPlaying;

        if (wasPlaying) {
            onStatusChanged({isPlaying: false});
        }
        
        _ttsIsPlaying = false;

        if (!_enableHTMLSpeech)
        {
            if (wasPlaying) {
                Globals.logEvent("MEDIA_OVERLAY_TTS_STOP", "EMIT", "media_overlay_player.js");
                reader.emit(Globals.Events.MEDIA_OVERLAY_TTS_STOP, undefined);
            }
            return;
        }

//console.debug("TTS pause");
        window.speechSynthesis.pause();
    };

    var _timerTick = undefined;

    function onPlay() {
        onPause();

        var func = function() {

            if (!_smilIterator || !_smilIterator.currentPar)
            {
                return;
            }

            var smil = _smilIterator.smil; //currentPar.getSmil();
            if (!smil.mo)
            {
                return;
            }

//            if (!_smilIterator.currentPar.audio.src)
//            {
//                return;
//            }

            var playPosition = audioCurrentTime - _smilIterator.currentPar.audio.clipBegin;
            if (playPosition <= 0)
            {
                return;
            }

            var smilIndex = smil.mo.smil_models.indexOf(smil);

            var smilIterator = new SmilIterator(smil);
            var parIndex = -1;
            while (smilIterator.currentPar)
            {
                parIndex++;
                if (smilIterator.currentPar == _smilIterator.currentPar)
                {
                    break;
                }
                smilIterator.next();
            }

            onStatusChanged({playPosition: playPosition, smilIndex: smilIndex, parIndex: parIndex});
        };

        setTimeout(func, 500);

        _timerTick = setInterval(func, 1500);
    }

    function onPause() {

        audioCurrentTime = 0.0;
        if (_timerTick !== undefined)
        {
            clearInterval(_timerTick);
        }
        _timerTick = undefined;
    }


    this.onEmbeddedEnd = function()
    {
        audioCurrentTime = 0.0;

        _embeddedIsPlaying = false;
        //_currentEmbedded = undefined;

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 3);
    };

    this.onTTSEnd = function()
    {
        audioCurrentTime = 0.0;

        _ttsIsPlaying = false;
        //_currentTTS = undefined;

//        if(_skipTTSEnded)
//        {
//            _skipTTSEnded = false;
//            return;
//        }

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 4);
    };

    function onAudioEnded() {

        onPause();
//
//        if (_letPlay)
//        {
//            return;
//        }

        if(_skipAudioEnded)
        {
            _skipAudioEnded = false;
            return;
        }

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 5);
    }

    function highlightCurrentElement() {

        if(!_smilIterator) {
            return;
        }

        if(!_smilIterator.currentPar) {
            return;
        }

        if (_smilIterator.currentPar.text.srcFragmentId && _smilIterator.currentPar.text.srcFragmentId.length > 0)
        {
            if (_smilIterator.currentPar.element) {
    //console.error(_smilIterator.currentPar.element.id + ": " + _smilIterator.currentPar.audio.clipBegin + " / " + _smilIterator.currentPar.audio.clipEnd);

                if (!_elementHighlighter.isElementHighlighted(_smilIterator.currentPar))
                {
                    _elementHighlighter.highlightElement(_smilIterator.currentPar, _package.media_overlay.activeClass, _package.media_overlay.playbackActiveClass);

                    if (!_wasPlayingScrolling)
                    {
                        reader.insureElementVisibility(_smilIterator.currentPar.getSmil().spineItemId, _smilIterator.currentPar.element, self);
                    }
                }
            
                return;
            
            } else if (_smilIterator.currentPar.cfi) {

                if (!_elementHighlighter.isCfiHighlighted(_smilIterator.currentPar))
                {
                    _elementHighlighter.highlightCfi(_smilIterator.currentPar, _package.media_overlay.activeClass, _package.media_overlay.playbackActiveClass);

                    if (!_wasPlayingScrolling)
                    {
                        reader.insureElementVisibility(_smilIterator.currentPar.getSmil().spineItemId, _smilIterator.currentPar.cfi.cfiTextParent, self);
                    }
                }
                
                return;
            }
        }
        
        // body (not FRAG ID)
        if (_smilIterator.currentPar.element) {
            return;
        }
        
        //else: single SMIL per multiple XHTML? ==> open new spine item
        
        /*
        var textRelativeRef = Globals.Helpers.ResolveContentRef(_smilIterator.currentPar.text.srcFile, _smilIterator.smil.href);
console.debug("textRelativeRef: " + textRelativeRef);
        if (textRelativeRef)
        {
            var textAbsoluteRef = _package.resolveRelativeUrl(textRelativeRef);
console.debug("textAbsoluteRef: " + textAbsoluteRef);
        }
        */

        var src = _smilIterator.currentPar.text.src;
        var base = _smilIterator.smil.href;

        //self.pause();
        //self.reset();
        _smilIterator = undefined;

        reader.openContentUrl(src, base, self);
    }

    this.escape = function() {
        
        if(!_smilIterator || !_smilIterator.currentPar) {

            this.toggleMediaOverlay();
            return;
        }

        if(!self.isPlaying())
        {
            //playCurrentPar();
            self.play();
            return;
        }

        if(_settings.mediaOverlaysEscapeEscapables)
        {
            var parent = _smilIterator.currentPar;
            while (parent)
            {
                if (parent.isEscapable && parent.isEscapable(_settings.mediaOverlaysEscapables))
                {
                    do
                    {
                        _smilIterator.next();
                    } while (_smilIterator.currentPar && _smilIterator.currentPar.hasAncestor(parent));

                    if (!_smilIterator.currentPar)
                    {
                        nextSmil(true);
                        return;
                    }

                    //_smilIterator.goToPar(_smilIterator.currentPar);
                    playCurrentPar();
                    return;
                }

                parent = parent.parent;
            }
        }

        this.nextMediaOverlay(true);
    };


    this.playUserPar = function(par) {
        if(self.isPlaying())
        {
            self.pause();
        }

        if (par.element || par.cfi && par.cfi.cfiTextParent)
        {
            var seq = _elementHighlighter.adjustParToSeqSyncGranularity(par);
            if (seq && seq !== par)
            {
                var findFirstPar = function(smilNode)
                {
                    if (smilNode.nodeType && smilNode.nodeType === "par") return smilNode;
                    
                    if (!smilNode.children || smilNode.children.length <= 0) return undefined;
                    
                    for (var i = 0; i < smilNode.children.length; i++)
                    {
                        var child = smilNode.children[i];
                        var inPar = findFirstPar(child);
                        if (inPar) return inPar;
                    }
                };
                var firstPar = findFirstPar(seq);
                if (firstPar) par = firstPar;
            }
        }

        playPar(par);
    };

    this.resetTTS = function() {
        _currentTTS = undefined;
//        _skipTTSEnded = false;
        speakStop();
    };

    this.resetBlankPage = function() {
        var wasPlaying = false;
        
        if (_blankPagePlayer)
        {
            wasPlaying = true;
            
            var timer = _blankPagePlayer;
            _blankPagePlayer = undefined;
            clearTimeout(timer);
        }
        _blankPagePlayer = undefined;

        if (wasPlaying) {
            onStatusChanged({isPlaying: false});
        }
    };

    this.resetEmbedded = function() {
        var wasPlaying = _embeddedIsPlaying;
        
        if (_currentEmbedded)
        {
            $(_currentEmbedded).off("ended", self.onEmbeddedEnd);
            _currentEmbedded.pause();
        }
        _currentEmbedded = undefined;
        
        if (wasPlaying) {
            onStatusChanged({isPlaying: false});
        }
        _embeddedIsPlaying = false;
    };

    this.reset = function() {
        clipBeginOffset = 0.0;
        _audioPlayer.reset();
        self.resetTTS();
        self.resetEmbedded();
        self.resetBlankPage();
        _elementHighlighter.reset();
        _smilIterator = undefined;
        _skipAudioEnded = false;
    };

    this.play = function ()
    {
        if (_smilIterator && _smilIterator.smil && !_smilIterator.smil.id)
        {
            initBlankPagePlayer();
            return;
        }
        else if (_currentEmbedded)
        {
            _embeddedIsPlaying = true;
            _currentEmbedded.play();
            onStatusChanged({isPlaying: true});
        }
        else if (_currentTTS)
        {
            speakStart(undefined);
        }
        else
        {
            if (!_audioPlayer.play())
            {
                console.log("Audio player was dead, reactivating...");

                this.reset();
                this.toggleMediaOverlay();
                return;
            }
        }

        highlightCurrentElement();
    }

    this.pause = function()
    {
        _wasPlayingScrolling = false;
        
        if (_blankPagePlayer)
        {
            this.resetBlankPage();
        }
        else if (_embeddedIsPlaying)
        {
            _embeddedIsPlaying = false;
            if (_currentEmbedded)
            {
                _currentEmbedded.pause();
            }
            onStatusChanged({isPlaying: false});
        }
        else if (_ttsIsPlaying)
        {
            speakStop();
        }
        else
        {
            _audioPlayer.pause();
        }

        _elementHighlighter.reset();
    }

    this.isMediaOverlayAvailable = function() {

//        console.debug("isMediaOverlayAvailable()");
//
//        var now1 = window.performance && window.performance.now ? window.performance.now() : Date.now();
//
//        if (console.time)
//        {
//            console.time("MO");
//        }

        var visibleMediaElement = reader.getFirstVisibleMediaOverlayElement();

//        if (console.timeEnd)
//        {
//            console.timeEnd("MO");
//        }
//
//        var now2 = window.performance && window.performance.now ? window.performance.now() : Date.now();
//
//        console.debug(now2 - now1);

        return typeof visibleMediaElement !== "undefined";
    };

    this.nextOrPreviousMediaOverlay = function(previous) {
        if(self.isPlaying())
        {
            self.pause();
        }
        else
        {
            if (_smilIterator && _smilIterator.currentPar)
            {
                //playCurrentPar();
                self.play();
                return;
            }
        }

        if(!_smilIterator)
        {
            this.toggleMediaOverlay();
            return;
        }

        var position = previous ? DIRECTION_MARK - 1 : _smilIterator.currentPar.audio.clipEnd + 0.1;

        onAudioPositionChanged(position, 6);
        // setTimeout(function(){
        //     
        // }, 1);

        //self.play();
        //playCurrentPar();
    };

    this.nextMediaOverlay = function() {
        this.nextOrPreviousMediaOverlay(false);
    };

    this.previousMediaOverlay = function() {
        this.nextOrPreviousMediaOverlay(true);
    };

    /*
    this.setMediaOverlaySkippables = function(items) {

    };

    this.setMediaOverlayEscapables = function(items) {

    };
    */

    this.mediaOverlaysOpenContentUrl = function(contentRefUrl, sourceFileHref, offset)
    {
        clipBeginOffset = offset;

        //self.pause();
        //self.reset();
        _smilIterator = undefined;

        reader.openContentUrl(contentRefUrl, sourceFileHref, self);

        /*
        if (_currentPagination && _currentPagination.isFixedLayout && _currentPagination.openPages && _currentPagination.openPages.length > 0)
        {
            var combinedPath = Globals.Helpers.ResolveContentRef(contentRefUrl, sourceFileHref);

            var hashIndex = combinedPath.indexOf("#");
            var hrefPart;
            var elementId;
            if(hashIndex >= 0) {
                hrefPart = combinedPath.substr(0, hashIndex);
                elementId = combinedPath.substr(hashIndex + 1);
            }
            else {
                hrefPart = combinedPath;
                elementId = undefined;
            }

            var spineItem = reader.spine.getItemByHref(hrefPart);
            var spineItemIndex = _currentPagination.openPages[0].spineItemIndex;

            //var idref = _currentPagination.openPages[0].idref;
            //spineItem.idref === idref
            //var currentSpineItem = reader.spine.getItemById(idref);
            //currentSpineItem == spineItem
            if (spineItem.index === spineItemIndex)
            {
                self.onPageChanged({
                    paginationInfo: _currentPagination,
                    elementId: elementId,
                    initiator: self
                });
            }
        }
        */
    };

    this.toggleMediaOverlay = function() {
        if(self.isPlaying()) {
            self.pause();
            return;
        }

        //if we have position to continue from (reset wasn't called)
        if(_smilIterator) {
            self.play();
            return;
        }

        this.toggleMediaOverlayRefresh(undefined);
    };

    var _wasPlayingScrolling = false;

    this.toggleMediaOverlayRefresh = function(paginationData)
    {
//console.debug("moData SMIL: " + moData.par.getSmil().href + " // " + + moData.par.getSmil().id);

        var spineItems = reader.getLoadedSpineItems();

        //paginationData.isRightToLeft
        var rtl = reader.spine().isRightToLeft();

        //paginationData.spineItemCount
        //paginationData.openPages
        //{spineItemPageIndex: , spineItemPageCount: , idref: , spineItemIndex: }

        var playingPar = undefined;
        var wasPlaying = self.isPlaying();
        if(wasPlaying && _smilIterator)
        {
            var isScrollView = paginationData.initiator && paginationData.initiator instanceof ScrollView;
            if (isScrollView && _settings.mediaOverlaysPreservePlaybackWhenScroll)
            {
                _wasPlayingScrolling = true;
                return;
            }
            
            playingPar = _smilIterator.currentPar;
            self.pause();
        }
        
        _wasPlayingScrolling = false;

        //paginationData && paginationData.elementId
        //paginationData.initiator != self

        //_package.isFixedLayout()

        var element = (paginationData && paginationData.elementIdResolved) ? paginationData.elementIdResolved : undefined;

        var id = (paginationData && paginationData.elementId) ? paginationData.elementId : undefined;

        if (!element)
        {
            if (id)
            {
                console.error("[WARN] id did not resolve to element?");
            }
            
            for(var i = (rtl ? (spineItems.length - 1) : 0); (rtl && i >=0) || (!rtl && i < spineItems.length); i += (rtl ? -1: 1))
            {
                var spineItem = spineItems[i];
                if (!spineItem)
                {
                    console.error("spineItems[i] is undefined??");
                    continue;
                }
            
                if (paginationData && paginationData.spineItem && paginationData.spineItem != spineItem)
                {
                    continue;
                }

                if (id)
                {
                    var $element = reader.getElementById(spineItem.idref, id);
                    //var $element = reader.getElement(spineItem.idref, "#" + ReadiumSDK.Helpers.escapeJQuerySelector(id));
                    element = ($element && $element.length > 0) ? $element[0] : undefined;
                }
                else if (spineItem.isFixedLayout())
                {
                    if (paginationData && paginationData.paginationInfo && paginationData.paginationInfo.openPages)
                    {
                        // openPages are sorted by spineItem index, so the smallest index on display is the one we need to play (page on the left in LTR, or page on the right in RTL progression)
                        var index = 0; // !paginationData.paginationInfo.isRightToLeft ? 0 : paginationData.paginationInfo.openPages.length - 1;
                    
                        if (paginationData.paginationInfo.openPages[index] && paginationData.paginationInfo.openPages[index].idref && paginationData.paginationInfo.openPages[index].idref === spineItem.idref)
                        {
                            var $element = reader.getElement(spineItem.idref, "body");
                            element = ($element && $element.length > 0) ? $element[0] : undefined;
                        }
                    }
                }

                if (element)
                {
                    break;
                }
            }
        }

        if (!element)
        {
            element = reader.getFirstVisibleMediaOverlayElement();
        }

        if (!element)
        {
            self.reset();
            return;
        }

        var moData = $(element).data("mediaOverlayData");

        if (!moData)
        {
            var foundMe = false;
            var depthFirstTraversal = function(elements)
            {
                if (!elements)
                {
                    return false;
                }

                for (var i = 0; i < elements.length; i++)
                {
                    if (element === elements[i]) foundMe = true;
                    
                    if (foundMe)
                    {
                        var d = $(elements[i]).data("mediaOverlayData");
                        if (d)
                        {
                            moData = d;
                            return true;
                        }
                    }

                    var found = depthFirstTraversal(elements[i].children);
                    if (found)
                    {
                        return true;
                    }
                }

                return false;
            }

            var root = element;
            while (root && root.nodeName.toLowerCase() !== "body")
            {
                root = root.parentNode;
            }

            if (!root)
            {
                self.reset();
                return;
            }

            depthFirstTraversal([root]);
        }

        if (!moData)
        {
            self.reset();
            return;
        }

        var zPar = moData.par ? moData.par : moData.pars[0];
        var parSmil = zPar.getSmil();
        if(!_smilIterator || _smilIterator.smil != parSmil)
        {
            _smilIterator = new SmilIterator(parSmil);
        }
        else
        {
            _smilIterator.reset();
        }
        
        _smilIterator.goToPar(zPar);
        
        if (!_smilIterator.currentPar && id)
        {
            _smilIterator.reset();
            _smilIterator.findTextId(id);
        }
        
        if (!_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        if (wasPlaying && playingPar && playingPar === _smilIterator.currentPar)
        {
            self.play();
        }
        else
        {
            playCurrentPar();
            //playPar(zPar);
        }
    };

    this.isPlayingCfi = function()
    {
        return _smilIterator && _smilIterator.currentPar && _smilIterator.currentPar.cfi;
    };
    
    var _wasPausedBecauseNoAutoNextSmil = false;
    var _autoNextSmil = true;
    this.setAutomaticNextSmil = function(autoNext)
    {
        _autoNextSmil = autoNext;
    };
};
    return MediaOverlayPlayer;
});
