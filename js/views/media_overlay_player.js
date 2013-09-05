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

    reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function(paginationData) {

        if(!paginationData) {
            reset();
            return;
        }

        _currentPagination = paginationData.paginationInfo;

        if(!_smilIterator) {
            return;
        }

        if(paginationData.initiator == self) {
            highlightCurrentElement();
        }
        else {
            reset();
        }

    });

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

        playCurrentAudio();
    }

    function playCurrentAudio() {

        var audioSource = _package.resolveRelativeUrl(_smilIterator.currentPar.audio.src);
        _audioPlayer.playFile(audioSource, _smilIterator.currentPar.audio.clipBegin);
        highlightCurrentElement();
    }

    function onAudionPositionChanged(position) {

        var audio = _smilIterator.currentPar.audio;

        if(position >= audio.clipBegin && position <= audio.clipEnd) {
            return;
        }

        _smilIterator.goToAudioPosition(position);

        if(_smilIterator.currentPar) {
            reader.insureElementVisibility(_smilIterator.currentPar.element, self);
            highlightCurrentElement();
            return;
        }

        var newSmilIterator = findSmilFor(audio.src, position);
        if(newSmilIterator) {
            _smilIterator = newSmilIterator;
            reader.openContentUrl(_smilIterator.currentPar.text.src, _smilIterator.smil.href, self);
            return;
        }

        //couldn't find smil information for current audion position
        //we will stop audio play
        reset();
    }

    function highlightCurrentElement() {

        if(_smilIterator.currentPar.element) {
            _elementHighlighter.highlightElement(_smilIterator.currentPar.element);
        }

    }

    function findSmilFor(source, position) {

        var smils = _package.media_overlay.getSmilsByHref(source);

        for(var i = 0, count = smils.length; i < count; i++) {

            var iter = new ReadiumSDK.Models.SmilIterator(smils[i]);
            iter.goToAudioPosition(position);

            if(iter.currentPar) {
                return iter;
            }
        }

        return undefined;
    }

    function reset() {

        _audioPlayer.pause();
        _elementHighlighter.reset();
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

        for(var i = 0, count = visibleMediaElements.length; i < count; i++) {
            var visibleElementData = visibleMediaElements[i];

            var moData = $(visibleElementData.element).data("mediaOverlayData");

            if(moData && visibleElementData.percentVisible == 100) {
                playPar(moData.par);
                return;
            }
        }
    };

//    function findElementWithMediaPar(smilId, elements) {
//
//        var smil = _package.media_overlay.getSmilById(smilId);
//        if(!smil) {
//            return undefined;
//        }
//
//        var iterator = new ReadiumSDK.Models.SmilIterator(smil);
//
//        var $elements = $(elements);
//        while(iterator.currentPar) {
//
//            if(iterator.currentPar.textFragmentSelector) {
//                var found = $elements.find(iterator.currentPar.textFragmentSelector);
//
//                if(found.length > 0) {
//                    return { par: iterator.currentPar, element: found[0] };
//                }
//            }
//
//            iterator.next();
//        }
//
//        return undefined;
//    }
};