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

ReadiumSDK.Views.MediaOverlayPlayer = function(epubPackage) {

    //difference between stooped and paused is in what happens when we want to play again
    //if it is paused we resume playing from the current audio location, if stopped it is for application to decide from where to start paling
    //when user flips pages during MO play we will stop player.
    this.PLAYING = "playing";
    this.STOPPED = "stopped";
    this.PAUSED = "paused";

    var _smilIterator = undefined;
    var _audioPlayer = new ReadiumSDK.Views.AudioPlayer(onAudionPositionChanged, onAudioEnded);
    var _status = this.STOPPED; //mast be one of stooped, paused, playing
    var _highlightedElement = undefined;
    var _currentPagination = undefined;
    var self = this;

    function play(smilId) {

        var par = getParForSmil(smilId);

        if(!par) {
            return;
        }

        playPar(par);

    }

    function playPar(par) {

        if(par.audio) {
            _status = self.PLAYING;
            var audioSource = epubPackage.resolveRelativeUrl(par.audio.src);
            _audioPlayer.play(audioSource, par.audio.clipBegin);
        }
    }

    function getParForSmil(smilId) {

        if(!_smilIterator || _smilIterator.smil.id != smilId) {
            var smil = epubPackage.media_overlay.getSmilById(smilId);

            if(!smil) {
                return undefined;
            }

            _smilIterator = new ReadiumSDK.Models.SmilIterator(smil);
        }
        else if(!_smilIterator.currentPar) {
            _smilIterator.reset();
        }

        return _smilIterator.currentPar;
    }

    function onAudionPositionChanged(position) {

        var audio = _smilIterator.currentPar.audio;
        if(position >= audio.clipBegin && position <= audio.clipEnd && !_highlightedElement) {
//            highlightElement(_smilIterator.currentPar.text.src);
        }
    }


    function onAudioEnded() {

    }

    function stop() {

        if(_status == self.STOPPED) {
            return;
        }

        _status= self.STOPPED;
        _audioPlayer.pause();
        //clear text here
    }

    function pause() {

        if(_status == self.PAUSED || _status == self.STOPPED) {
            return;
        }

        _status = self.PAUSED;
        _audioPlayer.pause();
    }

    function resume() {
        if(_status != self.PAUSED) {
            return;
        }

        _status = self.PLAYING;
        _audioPlayer.resume();
    }

    this.status = function() {
        return _status;
    };

//    this.isPlaying = function() {
//        return _status == self.PLAYING;
//    };

    this.onPaginationChanged =  function(paginationData) {

        if(!paginationData) {
            _currentPagination = undefined;
            stop();
        }
        else {
            _currentPagination = paginationData.paginationInfo;
            if(paginationData.initiator != self) {
                stop();
            }
        }
    };

    function findSpreadMediaOverlayItemId() {

        if(!_currentPagination || !epubPackage) {
            return undefined;
        }

        for(var i = 0, count = _currentPagination.openPages.length; i < count; i++) {

            var openPage = _currentPagination.openPages[i];
            var spineItem = epubPackage.spine.getItemById(openPage.idref);
            if( spineItem && spineItem.media_overlay_id ) {
                return spineItem.media_overlay_id;
            }
        }

        return undefined;
    }

    this.isMediaOverlayAvailable = function() {
        return findSpreadMediaOverlayItemId() != undefined;
    };

    this.toggleMediaOverlay = function() {

        if(_status == self.PLAYING) {
            pause();
            return;
        }

        if(_status == self.PAUSED) {
            resume();
            return;
        }

        var moItemId = findSpreadMediaOverlayItemId();
        if(moItemId) {
            play(moItemId);
        }

    }
};