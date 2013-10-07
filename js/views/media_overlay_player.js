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

ReadiumSDK.Views.MediaOverlayPlayer = function(reader, onStatusChanged) {


    var _smilIterator = undefined;
    var _audioPlayer = new ReadiumSDK.Views.AudioPlayer(onStatusChanged, onAudioPositionChanged, onAudioEnded, onPlay, onPause);
    var _currentPagination = undefined;
    var _package = reader.package;
    var _settings = reader.viewerSettings;
    var self = this;
    var _elementHighlighter = new ReadiumSDK.Views.MediaOverlayElementHighlighter();

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

        if (paginationData.paginationInfo)
        {
            _currentPagination = paginationData.paginationInfo;
        }

        /*
        if (lastElement)
        {
            $(lastElement).css("background-color", lastElementColor);
            lastElement = undefined;
        }
        */

        var element = undefined;
        if (paginationData.elementId)
        {
            var spineItems = reader.currentView.getLoadedSpineItems();
            for(var i = 0, count = spineItems.length; i < count; i++)
            {
                element = reader.currentView.getElement(spineItems[i], "#" + paginationData.elementId);
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

        var wasPlaying = _audioPlayer.isPlaying();

        if(!_smilIterator || !_smilIterator.currentPar) {
            if(paginationData.initiator !== self) {
                clipBeginOffset = 0;
                self.reset();

                if (wasPlaying)
                {
                    self.toggleMediaOverlay();
                }
                return;
            }

            if (!paginationData.elementId)
            {
                console.error("!paginationData.elementId");
                clipBeginOffset = 0;
                return;
            }

            if(!element)
            {
                console.error("!element: " + paginationData.elementId);
                clipBeginOffset = 0;
                return;
            }

            var moData = $(element).data("mediaOverlayData");
            if(!moData) {
                console.error("!moData: " + paginationData.elementId);
                clipBeginOffset = 0;
                return;
            }

            playPar(moData.par);
            return;
        }

        if(!_smilIterator.currentPar.element) {
            console.error("!! _smilIterator.currentPar.element ??");
        }

//console.debug("+++> paginationData.elementId: " + paginationData.elementId + " /// " + _smilIterator.currentPar.text.srcFragmentId); //PageOpenRequest.elementId


        if(paginationData.initiator == self) {
            var notSameTargetID = paginationData.elementId && paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId;

            if(notSameTargetID) {
                console.error("!! paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId");
            }

            if(notSameTargetID || !_smilIterator.currentPar.element) {
                clipBeginOffset = 0;
                return;
            }

            if(wasPlaying) {
                highlightCurrentElement();
            }
            else {
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
                self.reset();
            }

            self.toggleMediaOverlay(paginationData.elementId);
        }
    };

    function playPar(par) {

        var parSmil = par.getSmil();
        if(!_smilIterator || _smilIterator.smil != parSmil) {
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

    var clipBeginOffset = 0;

    function playCurrentPar() {

        var dur = _smilIterator.currentPar.audio.clipEnd - _smilIterator.currentPar.audio.clipBegin;
        if (dur <= 0 || clipBeginOffset > dur)
        {
console.error("### MO XXX PAR OFFSET: " + clipBeginOffset + " / " + dur);
            clipBeginOffset = 0;
        }
        else
        {
//console.debug("### MO PAR OFFSET: " + clipBeginOffset);
        }

        var audioContentRef = ReadiumSDK.Helpers.ResolveContentRef(_smilIterator.currentPar.audio.src, _smilIterator.smil.href);

        var audioSource = _package.resolveRelativeUrl(audioContentRef);

        _audioPlayer.playFile(_smilIterator.currentPar.audio.src, audioSource, _smilIterator.currentPar.audio.clipBegin + clipBeginOffset);

        clipBeginOffset = 0;

        highlightCurrentElement();
    }

    function nextSmil(goNext)
    {
        //new smile we assume new spine too
        //it may take time to render new spine we will stop audio

        //we don't have to stop audio here but then we should stop listen to audioPositionChanged event until we
        //finished rendering spine and got page changed message. And stop audio if next smile not found
        pause();

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

//console.debug("openContentUrl (nextSmil): " + _smilIterator.currentPar.text.src);

                reader.openContentUrl(_smilIterator.currentPar.text.src, _smilIterator.smil.href, self);
            }
        }
        else
        {
            self.reset();
        }
    }


    var _skipAudioEnded = false;

    var audioCurrentTime = 0.0;

    var DIRECTION_MARK = -999;

    function onAudioPositionChanged(position) {

        audioCurrentTime = position;

        _skipAudioEnded = false;

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

            //paranoia test probably audio always should exist
            if(!_smilIterator.currentPar.audio) {
                pause();
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

                    onAudioPositionChanged(pos);
                    return;
                }
            }

            if(_smilIterator.currentPar.audio.src == _audioPlayer.srcRef()
                    && position >= _smilIterator.currentPar.audio.clipBegin
                    && position <= _smilIterator.currentPar.audio.clipEnd)
            {
                highlightCurrentElement();
                return;
            }

            //position < DIRECTION_MARK goes here (goto previous):

            playCurrentPar();
            return;
        }

        nextSmil(goNext);

        /*
        // To avoid onAudioEnded() race condition + infinite loop
        setTimeout(function(){
console.debug("nextSmil(goNext)");
            nextSmil(goNext);
        }, 200);
        */
    }

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

        }, 2000);
    }

    function onPause() {

        audioCurrentTime = 0;
        if (_timerTick != undefined)
        {
            clearInterval(_timerTick);
        }
        _timerTick = undefined;
    }

    function onAudioEnded() {
        onPause();

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
            _elementHighlighter.highlightElement(_smilIterator.currentPar.element, _package.media_overlay.activeClass, _package.media_overlay.playbackActiveClass);
            reader.insureElementVisibility(_smilIterator.currentPar.element, self);
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

        //pause();
        //self.reset();
        _smilIterator = undefined;

        reader.openContentUrl(src, base, self);
    }

    this.escape = function() {

        if(!_smilIterator || !_smilIterator.currentPar) {
            return;
        }

        if(!_audioPlayer.isPlaying())
        {
            //playCurrentPar();
            play();
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
        playPar(par);
    };


    this.reset = function() {
        clipBeginOffset = 0;
        _audioPlayer.reset();
        _elementHighlighter.reset();
        _smilIterator = undefined;
    };


    function play() {
        _audioPlayer.play();
        highlightCurrentElement();
    }

    function pause() {
        _audioPlayer.pause();
        _elementHighlighter.reset();
    }

    this.isMediaOverlayAvailable = function() {

        var visibleMediaElements = reader.getVisibleMediaOverlayElements();
        return visibleMediaElements.length > 0;
    };

    this.isPlaying = function() {
        return _audioPlayer.isPlaying();
    };
    
    this.nextOrPreviousMediaOverlay = function(previous) {
        if(_audioPlayer.isPlaying())
        {
            pause();
        }
        else
        {
            if (_smilIterator && _smilIterator.currentPar)
            {
                //playCurrentPar();
                play();
                return;
            }
        }

        if(!_smilIterator)
        {
            this.toggleMediaOverlay();
            return;
        }

        var position = previous ? DIRECTION_MARK - 1 : _smilIterator.currentPar.audio.clipEnd + 0.1;

        onAudioPositionChanged(position);

        //play();
        playCurrentPar();
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

        //pause();
        //self.reset();
        _smilIterator = undefined;

        reader.openContentUrl(contentRefUrl, sourceFileHref, self);

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
                console.debug("EMULATING onPageChanged()");
                self.onPageChanged({
                    paginationInfo: _currentPagination,
                    elementId: elementId,
                    initiator: self
                });
            }
        }
    };

    this.toggleMediaOverlay = function(textId) {

        if (!textId)
        {
            if(_audioPlayer.isPlaying()) {
                pause();
                return;
            }

            //if we have position to continue from (reset wasn't called)
            if(_smilIterator) {
                play();
                return;
            }
        }

        var visibleMediaElements = reader.getVisibleMediaOverlayElements();

        if(visibleMediaElements.length == 0) {
            console.error("toggleMediaOverlay visibleMediaElements.length == 0");
            self.reset();
            return;
        }

        var elementDataToStart;

        //we start form firs element where upper age of the element is visible
        //or if only one element we will start from it
        if(visibleMediaElements.length == 1 || visibleMediaElements[0].percentVisible == 100) {
            elementDataToStart = visibleMediaElements[0];
        }
        else { //if first element is partially visible than second element's upper age should be visible
            elementDataToStart = visibleMediaElements[1];
        }

        var moData = $(elementDataToStart.element).data("mediaOverlayData");

        if(!moData) {
            console.error("toggleMediaOverlay !moData");
            return;
        }

        var playingPar = undefined;
        var wasPlaying = _audioPlayer.isPlaying();
        if(wasPlaying && _smilIterator)
        {
            playingPar = _smilIterator.currentPar;
            pause();
        }

        if (textId && textId !== elementDataToStart.element.id)
        {
            var parSmil = moData.par.getSmil();
            if(!_smilIterator || _smilIterator.smil != parSmil)
            {
                _smilIterator = new ReadiumSDK.Models.SmilIterator(parSmil);
            }
            else
            {
                _smilIterator.reset();
            }

            _smilIterator.findTextId(textId);

            if (_smilIterator.currentPar)
            {
                if (wasPlaying && playingPar && playingPar === _smilIterator.currentPar)
                {
                    play();
                }
                else
                {
                    playCurrentPar();
                }
                return;
            }
        }

        if (wasPlaying && playingPar && playingPar === moData.par)
        {
            play();
        }
        else
        {
            playPar(moData.par);
        }
    };
};