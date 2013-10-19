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

    var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

    var _elm = new Audio();

    var _ready = iOS ? "canplaythrough" : "canplay";
    var _seeked = iOS ? "progress" : "seeked";
    _elm.setAttribute("preload", "none");

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
//
//    _elm.addEventListener("play", function()
//        {
//            console.debug("8) play");
//        }
//    );
//
//    _elm.addEventListener("pause", function()
//        {
//            console.debug("9) pause");
//        }
//    );
//
//    _elm.addEventListener("ended", function()
//        {
//            console.debug("0) ended");
//        }
//    );
//
//    _elm.addEventListener("seeked", function()
//        {
//            console.debug("X) seeked");
//        }
//    );
//
//    _elm.addEventListener("timeupdate", function()
//        {
//            console.debug("O) timeupdate");
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

        var diffAudioFile = _elm.getAttribute("src") != _source;

        if (diffAudioFile)
        {
            this.reset();
        }
        else
        {
            this.pause();
        }

//console.debug("PLAY FILE " + srcRef + " --- " + mediaFile);

        _srcRef = srcRef;
        _source = mediaFile;

        if (diffAudioFile)
        {
            $(_elm).on(_ready, {clipBegin: clipBegin}, onCanPlay);

            _elm.setAttribute("src", _source);

            //_elm.setAttribute("preload", "auto");
            _elm.load();



            _elm.addEventListener('play', playToForcePreload, false);

            _elm.volume = 0;

            //_elm.play();
            var vol = _volume;
            _volume = 0;
            self.play();
            _volume = vol;
        }
        else
        {
            playFromPosition(clipBegin);
        }
    };


    var playToForcePreload = function ()
    {
        _elm.pause();
        _elm.removeEventListener('play', playToForcePreload, false);
    };

    function onCanPlay(event)
    {
        $(_elm).off(_ready, onCanPlay);

        playFromPosition(event.data.clipBegin);
    }

    function playFromPosition(position)
    {
        if(Math.abs(position - _elm.currentTime) < 0.3)
        {
//            if(self.isPlaying()) {
//                return;
//            }

            self.play();
        }
        else
        {
            if (position == 0)
            {
                position = 0.01;
            }

            self.pause();

            $(_elm).on(_seeked, {position: position}, onSeeked);

            if (iOS)
            {
                _elm.volume = 0;
                _elm.play();
            }
            else
            {
                try
                {
                    _elm.currentTime = position;
                }
                catch (ex)
                {
                    console.error(ex.message);
                }
            }
        }
    }

    function onSeeked(event)
    {
        $(_elm).off(_seeked, onSeeked);

        self.play();

        if (iOS && event && event.data && event.data.position)
        {
            try
            {
                _elm.currentTime = event.data.position;
            }
            catch (ex)
            {
                console.error(ex.message);
            }
        }
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