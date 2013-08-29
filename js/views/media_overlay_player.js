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

    var smilIterator = undefined;
    var audioPlayer = new ReadiumSDK.Views.AudioPlayer(onAudionPositionChanged, onAudioEnded);

    this.play =  function(smilId) {

        var par = getParForSmil(smilId);

        if(!par) {
            return;
        }

        playPar(par);

    };

    function playPar(par) {

        if(par.audio) {
            var audioSource = epubPackage.resolveRelativeUrl(par.audio.src);
            audioPlayer.play(audioSource, par.audio.clipBegin);
        }
    }

    function getParForSmil(smilId) {

        if(!smilIterator || smilIterator.smil.id != smilId) {
            var smil = epubPackage.media_overlay.getSmilById(smilId);

            if(!smil) {
                return undefined;
            }

            smilIterator = new ReadiumSDK.Models.SmilIterator(smil);
        }
        else if(!smilIterator.currentPar) {
            smilIterator.reset();
        }

        return smilIterator.currentPar;
    }

    function onAudionPositionChanged(position) {

    }

    function onAudioEnded() {

    }

    this.isPlaying = function() {

        return audioPlayer.isPlaying();
    };

    this.pause = function() {

        audioPlayer.pause();
    };

    this.resume = function() {

        audioPlayer.resume();
    }

};