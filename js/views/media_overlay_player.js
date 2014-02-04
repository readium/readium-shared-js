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

ReadiumSDK.Views.MediaOverlayPlayer = function(reader, onStatusChanged) {


    var _smilIterator = undefined;

    var _audioPlayer = new ReadiumSDK.Views.AudioPlayer(onStatusChanged, onAudioPositionChanged, onAudioEnded, onPlay, onPause);

    var _ttsIsPlaying = false;
    var _currentTTS = undefined;
    var _enableHTMLSpeech = false && window.speechSynthesis !== undefined; // set to false to force "native" platform TTS engine, rather than HTML Speech API
    var _SpeechSynthesisUtterance = undefined;
    //var _skipTTSEndEvent = false;

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
    var _elementHighlighter = new ReadiumSDK.Views.MediaOverlayElementHighlighter(reader);

    this.applyStyles = function()
    {
        _elementHighlighter.clearUserStyle();
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
    //ReadiumSDK.
    reader.on(ReadiumSDK.Events.SETTINGS_APPLIED, this.onSettingsApplied, this);

    /*
    var lastElement = undefined;
    var lastElementColor = "";
    */

    this.onPageChanged = function(paginationData) {

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

                element = reader.getElement(spineItem, paginationData.initiator == self && !paginationData.elementId ? "body" : "#" + paginationData.elementId);
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

            if (!element)
            {
                console.error("paginationData.elementId BUT !element");
            }
        }

        var wasPlaying = self.isPlaying();

        if(!_smilIterator || !_smilIterator.currentPar) {
            if(paginationData.initiator !== self) {
                clipBeginOffset = 0.0;
                self.reset();

                if (paginationData.elementId && element)
                {
                    if (wasPlaying)
                    {
                        self.toggleMediaOverlayRefresh(paginationData);
                    }
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

            playPar(moData.par);
            return;
        }

        if(!_smilIterator.currentPar.element) {
            console.error("!! _smilIterator.currentPar.element ??");
        }

//console.debug("+++> paginationData.elementId: " + paginationData.elementId + " /// " + _smilIterator.currentPar.text.srcFile + " # " + _smilIterator.currentPar.text.srcFragmentId); //PageOpenRequest.elementId


        if(paginationData.initiator == self)
        {
            var notSameTargetID = paginationData.elementId && paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId;

            if(notSameTargetID) {
                console.error("!! paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId");
            }

            if(notSameTargetID || !_smilIterator.currentPar.element) {
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
            if(!wasPlaying)
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

            self.toggleMediaOverlayRefresh(paginationData);
        }
    };

    function playPar(par) {

        var parSmil = par.getSmil();
        if(!_smilIterator || _smilIterator.smil != parSmil)
        {
            _smilIterator = new ReadiumSDK.Models.SmilIterator(parSmil);
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
            onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1);

        }, 2000);

        onStatusChanged({isPlaying: true});
    }

    function playCurrentPar() {

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

                    onStatusChanged({isPlaying: true});

                    _embeddedIsPlaying = true;

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

            var audioContentRef = ReadiumSDK.Helpers.ResolveContentRef(_smilIterator.currentPar.audio.src, _smilIterator.smil.href);

            var audioSource = _package.resolveRelativeUrlMO(audioContentRef);

            var startTime = _smilIterator.currentPar.audio.clipBegin + clipBeginOffset;

//console.debug("PLAY START TIME: " + startTime + "("+_smilIterator.currentPar.audio.clipBegin+" + "+clipBeginOffset+")");

            _audioPlayer.playFile(_smilIterator.currentPar.audio.src, audioSource, startTime, _smilIterator.currentPar.element);
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

            _smilIterator = new ReadiumSDK.Models.SmilIterator(nextSmil);
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

    function onAudioPositionChanged(position) { //noLetPlay

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

//console.debug("PLAY NEXT: " + position + " (" + audio.clipBegin + " -- " + audio.clipEnd + ")");

        var goNext = position > audio.clipEnd;
        if (goNext)
        {
            _smilIterator.next();
        }
        else //position <= DIRECTION_MARK
        {
            _smilIterator.previous();
        }

        if(_smilIterator.currentPar) {

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
                    console.debug("MO SKIP: " + parent.epubtype);

                    var pos = goNext ? _smilIterator.currentPar.audio.clipEnd + 0.1 : DIRECTION_MARK - 1;

                    onAudioPositionChanged(pos); //noLetPlay
                    return;
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
            return;
        }
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

//console.log("NEXT SMIL ON AUDIO POS");
        nextSmil(goNext);
    }

    this.touchInit = function()
    {
        var todo = _audioPlayer.touchInit();
        if (todo)
        {
            if (_enableHTMLSpeech)
            {
                speakStart("o", 0);
            }
        }
    };

    var tokeniseTTS = function(element)
    {
        var BLOCK_DELIMITERS = ['p', 'div', 'pagenum', 'td', 'table', 'li', 'ul', 'ol'];
        var BOUNDARY_PUNCTUATION = [',', ';', '.', '-', 'Ð', 'Ñ', '?', '!'];
        var IGNORABLE_PUNCTUATION = ['"', '\'', 'Ò', 'Ó', 'Ô', 'Õ'];

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
        var element = (_smilIterator && _smilIterator.currentPar) ? _smilIterator.currentPar.element : undefined;

        if (!volume || volume > 0)
        {
            onStatusChanged({isPlaying: true});
            _ttsIsPlaying = true;

            if (element)
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
            reader.trigger(ReadiumSDK.Events.MEDIA_OVERLAY_TTS_SPEAK, {tts: txt}); // resume if txt == undefined
            return;
        }

        if (!txt && window.speechSynthesis.paused)
        {
console.debug("TTS resume");
            window.speechSynthesis.resume();

            return;
        }

        var text = txt || _currentTTS;

        if (text)
        {
            if (_SpeechSynthesisUtterance)
            {
console.debug("_SpeechSynthesisUtterance nullify");

                if (_SpeechSynthesisUtterance.onend)
                {
                    _SpeechSynthesisUtterance.onend({forceSkipEnd: true, target: _SpeechSynthesisUtterance});
                }

                _SpeechSynthesisUtterance.onend = function(event)
                {
console.debug("OLD TTS ended");
                    event.target.tokenData = undefined;
                };

                _SpeechSynthesisUtterance.onboundary = function(event)
                {
console.debug("OLD TTS boundary");
                    event.target.tokenData = undefined;
                };

                _SpeechSynthesisUtterance.onerror = function(event)
                {
console.debug("OLD TTS error");
console.debug(event);
                    event.target.tokenData = undefined;
                };

                _SpeechSynthesisUtterance.tokenData = undefined;

                _SpeechSynthesisUtterance = undefined;
            }
//
//            if (window.speechSynthesis.pending ||
//                window.speechSynthesis.speaking)
//            {
//                _skipTTSEndEvent = true;
//            }

            if (!window.speechSynthesis.paused)
            {
console.debug("TTS pause before speak");
                window.speechSynthesis.pause();
            }

            if (true || window.speechSynthesis.pending) // nope :(
            {
console.debug("TTS cancel before speak");
                window.speechSynthesis.cancel();
            }

            setTimeout(function()
            {

            _SpeechSynthesisUtterance = new SpeechSynthesisUtterance();
            if (tokenData)
            {
                _SpeechSynthesisUtterance.tokenData = tokenData;
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
            };

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

            _SpeechSynthesisUtterance.onerror = function(event)
            //_SpeechSynthesisUtterance.addEventListener("error", function(event)
            {
                if (!_SpeechSynthesisUtterance)
                {
                    return;
                }

console.debug("TTS error");
console.debug(event);

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
            };

            var vol = volume || _audioPlayer.getVolume();
            _SpeechSynthesisUtterance.volume = vol;

            _SpeechSynthesisUtterance.rate = _audioPlayer.getRate();
            _SpeechSynthesisUtterance.pitch = 1;

            //_SpeechSynthesisUtterance.lang = "en-US";

            _SpeechSynthesisUtterance.text = text;

console.debug("TTS speak: " + text);
            window.speechSynthesis.speak(_SpeechSynthesisUtterance);

            if (window.speechSynthesis.paused)
            {
console.debug("TTS resume");
                window.speechSynthesis.resume();
            }

            }, 5);
        }
    };

    var speakStop = function()
    {
        onStatusChanged({isPlaying: false});
        _ttsIsPlaying = false;

        if (!_enableHTMLSpeech)
        {
            reader.trigger(ReadiumSDK.Events.MEDIA_OVERLAY_TTS_STOP, undefined);
            return;
        }

console.debug("TTS pause");
        window.speechSynthesis.pause();
    };

    var _timerTick = undefined;

    function onPlay() {
        onPause();

        _timerTick = setInterval(function() {

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

            var smilIterator = new ReadiumSDK.Models.SmilIterator(smil);
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

        }, 1500);
    }

    function onPause() {

        audioCurrentTime = 0.0;
        if (_timerTick != undefined)
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

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1);
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

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1);
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

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1);
    }

    function highlightCurrentElement() {

        if(!_smilIterator) {
            return;
        }

        if(!_smilIterator.currentPar) {
            return;
        }

        if(_smilIterator.currentPar.element) {
//console.error(_smilIterator.currentPar.element.id + ": " + _smilIterator.currentPar.audio.clipBegin + " / " + _smilIterator.currentPar.audio.clipEnd);

            if (_smilIterator.currentPar.text.srcFragmentId.length > 0)
            {
                _elementHighlighter.highlightElement(_smilIterator.currentPar.element, _package.media_overlay.activeClass, _package.media_overlay.playbackActiveClass);

                reader.insureElementVisibility(_smilIterator.smil.spineItemId, _smilIterator.currentPar.element, self);
            }
            return;
        }

        /*
        var textRelativeRef = ReadiumSDK.Helpers.ResolveContentRef(_smilIterator.currentPar.text.srcFile, _smilIterator.smil.href);
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

        this.nextMediaOverlay();
    };


    this.playUserPar = function(par) {
        if(self.isPlaying())
        {
            self.pause();
        }

        playPar(par);
    };

    this.resetTTS = function() {
        _currentTTS = undefined;
//        _skipTTSEnded = false;
        speakStop();
    };

    this.resetBlankPage = function() {
        if (_blankPagePlayer)
        {
            var timer = _blankPagePlayer;
            _blankPagePlayer = undefined;
            clearTimeout(timer);
        }
        _blankPagePlayer = undefined;

        onStatusChanged({isPlaying: false});
    };

    this.resetEmbedded = function() {
        if (_currentEmbedded)
        {
            $(_currentEmbedded).off("ended", self.onEmbeddedEnd);
            _currentEmbedded.pause();
        }
        _currentEmbedded = undefined;
        onStatusChanged({isPlaying: false});
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

        var visibleMediaElements = reader.getVisibleMediaOverlayElements();

//        if (console.timeEnd)
//        {
//            console.timeEnd("MO");
//        }
//
//        var now2 = window.performance && window.performance.now ? window.performance.now() : Date.now();
//
//        console.debug(now2 - now1);

        return visibleMediaElements.length > 0;
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

        onAudioPositionChanged(position); //true

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
            var combinedPath = ReadiumSDK.Helpers.ResolveContentRef(contentRefUrl, sourceFileHref);

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

    this.toggleMediaOverlayRefresh = function(paginationData)
    {

//console.debug("moData SMIL: " + moData.par.getSmil().href + " // " + + moData.par.getSmil().id);


        var spineItems = reader.getLoadedSpineItems();

        //paginationData.pageProgressionDirection === "rtl"
        var rtl = reader.spine().isRightToLeft();

        //paginationData.spineItemCount

        //paginationData.openPages
        //{spineItemPageIndex: , spineItemPageCount: , idref: , spineItemIndex: }

        var playingPar = undefined;
        var wasPlaying = self.isPlaying();
        if(wasPlaying && _smilIterator)
        {
            self.pause();
            playingPar = _smilIterator.currentPar;
        }

        //paginationData && paginationData.elementId
        //paginationData.initiator != self

        //_package.isFixedLayout()

        var element = undefined;

        var id = paginationData && paginationData.elementId ? paginationData.elementId : undefined;

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
                element = reader.getElement(spineItem, "#" + id);
            }
            else if (spineItem.isFixedLayout())
            {
                element = reader.getElement(spineItem, "body");
            }

            if (element)
            {
                break;
            }
        }

        if (!element)
        {
            var visibleMediaOverlayElements = reader.getVisibleMediaOverlayElements();

            if (visibleMediaOverlayElements.length == 0)
            {
                console.error("reader.getVisibleMediaOverlayElements().length == 0");
            }
            else
            {
                if(visibleMediaOverlayElements.length == 1 || visibleMediaOverlayElements[0].percentVisible == 100)
                {
                    element = visibleMediaOverlayElements[0].element;
                }
                else
                {
                    element = visibleMediaOverlayElements[1].element;
                }
            }
        }

        if (!element)
        {
            self.reset();
            return;
        }

        var moData = $(element).data("mediaOverlayData");

        if (!moData)
        {
            var depthFirstTraversal = function(elements)
            {
                if (!elements)
                {
                    return false;
                }

                for (var i = 0; i < elements.length; i++)
                {
                    var d = $(elements[i]).data("mediaOverlayData");
                    if (d)
                    {
                        moData = d;
                        return true;
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

        var parSmil = moData.par.getSmil();
        if(!_smilIterator || _smilIterator.smil != parSmil)
        {
            _smilIterator = new ReadiumSDK.Models.SmilIterator(parSmil);
        }
        else
        {
            _smilIterator.reset();
        }

        if (id)
        {
            _smilIterator.findTextId(id);
        }
        else
        {
            _smilIterator.goToPar(moData.par);
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
            //playPar(moData.par);
        }
    };
};