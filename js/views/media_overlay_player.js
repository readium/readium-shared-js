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
    var _audioPlayer = new ReadiumSDK.Views.AudioPlayer(onStatusChanged, onAudionPositionChanged, onAudioEnded);
    var _currentPagination = undefined;
    var _package = reader.package;
    var self = this;
    var _elementHighlighter = new ReadiumSDK.Views.MediaOverlayElementHighlighter();

    this.onPageChanged = function(paginationData) {

        if(!paginationData) {
            reset();
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
            reset();
        }
    };

    function onAudioEnded() {

        console.debug("Audio Ended");
        reset();
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

        var audioSource = _package.resolveRelativeUrl(_smilIterator.currentPar.audio.src);
        _audioPlayer.playFile(_smilIterator.currentPar.audio.src, audioSource, _smilIterator.currentPar.audio.clipBegin);
        highlightCurrentElement();
    }

    function onAudionPositionChanged(position) {

        var audio = _smilIterator.currentPar.audio;

        //audio reports position not exactly one that we asked for but close
        //sometimes it is a bit before the beginning of the clip
        if(position >= (audio.clipBegin - 0.05) && position <= audio.clipEnd) {
            return;
        }

        _smilIterator.next();

        if(_smilIterator.currentPar) {

            //paranoia test probably audio always should exist
            if(!_smilIterator.currentPar.audio) {
                stop();
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
        stop();

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
            _elementHighlighter.highlightElement(_smilIterator.currentPar.element);
            reader.insureElementVisibility(_smilIterator.currentPar.element, self);
        }
    }


    function stop() {
        _audioPlayer.pause();
        _elementHighlighter.reset();
    }

    function reset() {
        stop();
        _smilIterator = undefined;
    }

    function findSpreadMediaOverlayItemId() {

        if(!_currentPagination || !_package) {
            return undefined;
        }

        for(var i = 0, count = _currentPagination.openPages.length; i < count; i++) {

            var openPage = _currentPagination.openPages[i];
            var spineItem = _package.spine.getItemById(openPage.idref);
            if( spineItem && spineItem.media_overlay_id ) {
                return spineItem.media_overlay_id;
            }
        }

        return undefined;
    }

    function play() {
        _audioPlayer.play();
        highlightCurrentElement();
    }

    function pause() {
        _audioPlayer.pause();
        _elementHighlighter.reset();
    }

    this.isMediaOverlayAvailable = function() {
        return findSpreadMediaOverlayItemId() != undefined;
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