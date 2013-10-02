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
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

ReadiumSDK.Views.AudioPlayer = function(onStatusChanged, onPositionChanged, onAudioEnded) {

    var _elm = new Audio();

    var _source = undefined;
    var _timerId = undefined;
    var _srcRef = undefined;

    _elm.playbackRate = 1.0;

    var self = this;

    $(_elm).on("play", onPlay);
    $(_elm).on("pause", onPause);
    $(_elm).on("ended", onEnded);

    this.source = function() {
        return _source;
    };

    this.srcRef = function() {
      return _srcRef;
    };

    this.reset = function() {

        //we do this because pause event is not triggered after we reset source attribute
        var wasPlaying = this.isPlaying();

        this.pause();
        _elm.setAttribute("src", "");

        if(wasPlaying) {
            onStatusChanged({isPlaying: false});
        }
    };

    this.playFile = function(srcRef, mediaFile, clipBegin) {
        this.reset();

        _srcRef = srcRef;
        _source = mediaFile;

        if(_elm.getAttribute("src") != _source) {
            $(_elm).on("canplay", {clipBegin: clipBegin}, onCanPlay);
            _elm.setAttribute("src", _source);
        }
        else {
            playFromPosition(clipBegin);
        }
    };

    function onCanPlay(event) {
        $(_elm).off("canplay", onCanPlay);
        playFromPosition(event.data.clipBegin);
    }

    this.pause = function() {
        stopTimer();
        _elm.pause();
    };

    this.play = function() {

        if(!_source) {
            return;
        }

        startTimer();
        _elm.play();
    };

    this.isPlaying = function() {
        return _timerId != undefined;
    };

    function playFromPosition(position) {

        if(Math.abs(position - _elm.currentTime) < 0.3) {

            if(self.isPlaying()) {
                return;
            }

            self.play();
        }
        else {
            self.pause();
            _elm.currentTime = position;
            $(_elm).on("seeked", onSeeked);
        }
    }

    function onPlay() {
        onStatusChanged({isPlaying: true});
    }

    function onPause() {
        onStatusChanged({isPlaying: false});
    }

    function onEnded() {
        stopTimer();
        onAudioEnded();
        onStatusChanged({isPlaying: false});
    }

    function onSeeked() {

        $(_elm).off("seeked", onSeeked);
        self.play();
    }

    function stopTimer() {
        clearInterval(_timerId);
        _timerId = undefined;
    }

    function startTimer() {

        if(_timerId) {
            return;
        }

        _timerId = setInterval(function() {

            onPositionChanged(_elm.currentTime);

        }, 11);
    }

};