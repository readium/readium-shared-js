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
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

ReadiumSDK.Views.AudioPlayer = function(onStatusChanged, onPositionChanged, onAudioEnded, onAudioPlay, onAudioPause) {

    var _elm = new Audio();

//    var _ready = "loadstart";
//    _elm.setAttribute("preload", "none");

    var _ready = "canplay";
    _elm.setAttribute("preload", "auto");

//
//
//    _elm.addEventListener("progress", function()
//        {
//            console.debug("0) progress");
//        }
//    );
//
//    _elm.addEventListener("loadstart", function()
//        {
//            console.debug("1) loadstart");
//        }
//    );
//
//    _elm.addEventListener("durationchange", function()
//        {
//            console.debug("2) durationchange");
//        }
//    );
//
//    _elm.addEventListener("loadedmetadata", function()
//        {
//            console.debug("3) loadedmetadata");
//        }
//    );
//
//    _elm.addEventListener("loadeddata", function()
//        {
//            console.debug("4) loadeddata");
//        }
//    );
//
//    _elm.addEventListener("progress", function()
//        {
//            console.debug("5) progress");
//        }
//    );
//
//    _elm.addEventListener("canplay", function()
//        {
//            console.debug("6) canplay");
//        }
//    );
//
//    _elm.addEventListener("canplaythrough", function()
//        {
//            console.debug("7) canplaythrough");
//        }
//    );

    var _source = undefined;
    var _timerId = undefined;
    var _srcRef = undefined;

    var self = this;

    $(_elm).on("play", onPlay);
    $(_elm).on("pause", onPause);
    $(_elm).on("ended", onEnded);

    var _rate = 1.0;
    this.setRate = function(rate)
    {
//console.debug("RATE: "+rate);
        _rate = rate;
        if (_rate < 0.5)
        {
            _rate = 0.5;
        }
        if (_rate > 4.0)
        {
            _rate = 4.0;
        }

        _elm.playbackRate = _rate;
//console.debug("RATEx: "+_elm.playbackRate);
    }
    self.setRate(_rate);

    var _volume = 100.0;
    this.setVolume = function(volume)
    {
//console.debug("VOLUME: "+volume);
        _volume = volume;
        if (_volume < 0.0)
        {
            _volume = 0.0;
        }
        if (_volume > 1.0)
        {
            _volume = 1.0;
        }
        _elm.volume = _volume;
//console.debug("VOLUMEx: "+_elm.volume);
    }
    self.setVolume(_volume);

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
            onAudioPause();
        }
    };

    this.playFile = function(srcRef, mediaFile, clipBegin) {

        this.reset();

console.debug("PLAY FILE " + srcRef + "//" + mediaFile);

        _srcRef = srcRef;
        _source = mediaFile;

        if(_elm.getAttribute("src") != _source) {
            $(_elm).on(_ready, {clipBegin: clipBegin}, onCanPlay);
            _elm.setAttribute("src", _source);
        }
        else {
            playFromPosition(clipBegin);
        }
    };

    function onCanPlay(event) {
        $(_elm).off(_ready, onCanPlay);
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

        self.setVolume(_volume);
        self.setRate(_rate);

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
            $(_elm).on("seeked", onSeeked);
            _elm.currentTime = position;
        }
    }

    function onPlay() {
        onStatusChanged({isPlaying: true});
        onAudioPlay();
    }

    function onPause() {
        onStatusChanged({isPlaying: false});
        onAudioPause();
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

    //var _audibleLag = 0.5; //seconds, playback buffer latency

    function startTimer() {

        if(_timerId) {
            return;
        }

        _timerId = setInterval(function() {

            var pos = _elm.currentTime;
//            if (_rate > 9999)
//            {
//                if (pos <= _audibleLag)
//                {
//                    pos = 0;
//                }
//                else
//                {
//                    pos -= _audibleLag;
//                }
//            }
            onPositionChanged(pos);

        }, 20);
    }

};