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
    var _audioPlayer = new ReadiumSDK.Views.AudioPlayer(onStatusChanged, onAudioPositionChanged, onAudioEnded);
    var _currentPagination = undefined;
    var _package = reader.package;
    var self = this;
    var _elementHighlighter = new ReadiumSDK.Views.MediaOverlayElementHighlighter();

    this.onPageChanged = function(paginationData) {

        if(!paginationData) {
            this.reset();
            return;
        }

        _currentPagination = paginationData.paginationInfo;

        if(!_smilIterator) {
            return;
        }

        if(paginationData.initiator == self) {

            if(_audioPlayer.isPlaying()) {
                highlightCurrentElement();
            }
            else {
                playCurrentPar();
            }
        }
        else {
            this.reset();
        }
    };

    function onAudioEnded() {

        console.debug("Audio Ended");
        self.reset();
    }

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
            console.debug("Something very wrong. Par suppose to be found");
            return;
        }

        playCurrentPar();
    }

    function playCurrentPar() {

        var audioContentRef = ReadiumSDK.Helpers.ResolveContentRef(_smilIterator.currentPar.audio.src, _smilIterator.smil.href);

        var audioSource = _package.resolveRelativeUrl(audioContentRef);
        _audioPlayer.playFile(_smilIterator.currentPar.audio.src, audioSource, _smilIterator.currentPar.audio.clipBegin);

        highlightCurrentElement();
    }

    function onAudioPositionChanged(position) {

        var audio = _smilIterator.currentPar.audio;

        //var TOLERANCE = 0.05;
        if(
            //position >= (audio.clipBegin - TOLERANCE) &&
            position <= audio.clipEnd) {

//console.debug("PLAYING: " + position + " (" + audio.clipBegin + " -- " + audio.clipEnd + ")");
            return;
        }
//console.debug("PLAY NEXT: " + position + " (" + audio.clipBegin + " -- " + audio.clipEnd + ")");

        _smilIterator.next();

        if(_smilIterator.currentPar) {

            //paranoia test probably audio always should exist
            if(!_smilIterator.currentPar.audio) {
                pause();
                return;
            }

            if(_smilIterator.currentPar.audio.isRightAudioPosition(_audioPlayer.srcRef(), position) ) {
                highlightCurrentElement();
                return;
            }

            playCurrentPar();
            return;
        }

        //new smile we assume new spine too
        //it may take time to render new spine we will stop audio

        //we don't have to stop audio here but then we should stop listen to audioPositionChanged event until we
        //finished rendering spine and got page changed message. And stop audio if next smile not found
        pause();

        var nextSmil = _package.media_overlay.getNextSmil(_smilIterator.smil);
        if(nextSmil) {
            _smilIterator = new ReadiumSDK.Models.SmilIterator(nextSmil);
            if(_smilIterator.currentPar) {
                reader.openContentUrl(_smilIterator.currentPar.text.src, _smilIterator.smil.href, self);
            }
        }
    }

    function highlightCurrentElement() {

        if(!_smilIterator) {
            console.debug("No _smilIterator in highlightElement()");
            return;
        }

        if(!_smilIterator.currentPar) {
            console.debug("No current Par in highlightElement()");
            return;
        }

        if(_smilIterator.currentPar.element) {
            _elementHighlighter.highlightElement(_smilIterator.currentPar.element, _package.media_overlay.activeClass);
            reader.insureElementVisibility(_smilIterator.currentPar.element, self);
        }
    }


    this.reset = function() {
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

    this.toggleMediaOverlay = function() {

        if(_audioPlayer.isPlaying()) {
            pause();
            return;
        }

        //if we have position to continue from (reset wasn't called)
        if(_smilIterator) {
            play();
            return;
        }


        var visibleMediaElements = reader.getVisibleMediaOverlayElements();

        if(visibleMediaElements.length == 0) {
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
            console.debug("Something wrong we only suppose to get elements that have mediaOverlayData available");
            return;
        }

        playPar(moData.par);

    };

};