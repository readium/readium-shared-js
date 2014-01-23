//  LauncherOSX
//
//  Created by Boris Schneiderman.
// Modified by Daniel Weck, Andrey Kavarma
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


(function(){
    

    var _iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;
    var _Android = navigator.userAgent.toLowerCase().indexOf('android') > -1;
    var _isMobile = _iOS || _Android;

    var _isReadiumJS = typeof window.requirejs !== "undefined"; // TODO!!

    var DEBUG = false;

    var _audioElement = new Audio();
    
    if (DEBUG)
    {
        _audioElement.addEventListener("load", function()
            {
                console.debug("0) load");
            }
        );

        _audioElement.addEventListener("loadstart", function()
            {
                console.debug("1) loadstart");
            }
        );

        _audioElement.addEventListener("durationchange", function()
            {
                console.debug("2) durationchange");
            }
        );

        _audioElement.addEventListener("loadedmetadata", function()
            {
                console.debug("3) loadedmetadata");
            }
        );

        _audioElement.addEventListener("loadeddata", function()
            {
                console.debug("4) loadeddata");
            }
        );

        _audioElement.addEventListener("progress", function()
            {
                console.debug("5) progress");
            }
        );

        _audioElement.addEventListener("canplay", function()
            {
                console.debug("6) canplay");
            }
        );

        _audioElement.addEventListener("canplaythrough", function()
            {
                console.debug("7) canplaythrough");
            }
        );

        _audioElement.addEventListener("play", function()
            {
                console.debug("8) play");
            }
        );

        _audioElement.addEventListener("pause", function()
            {
                console.debug("9) pause");
            }
        );

        _audioElement.addEventListener("ended", function()
            {
                console.debug("10) ended");
            }
        );

        _audioElement.addEventListener("seeked", function()
            {
                console.debug("X) seeked");
            }
        );

        _audioElement.addEventListener("timeupdate", function()
            {
                console.debug("Y) timeupdate");
            }
        );
    }

    
    var MobileAudioPlayer = function(onStatusChanged, onPositionChanged, onAudioEnded, onAudioPlay, onAudioPause)
    {
    
        var self = this;
     
        //_audioElement.setAttribute("preload", "auto");
    
        var _currentEpubSrc = undefined;
    
        var _currentSmilSrc = undefined;
        this.currentSmilSrc = function() {
            return _currentSmilSrc;
        };
    
    
        
        
        
        var _rate = 1.0;
        this.setRate = function(rate)
        {
            _rate = rate;
            if (_rate < 0.5)
            {
                _rate = 0.5;
            }
            if (_rate > 4.0)
            {
                _rate = 4.0;
            }
    
            _audioElement.playbackRate = _rate;
        }
        self.setRate(_rate);
        this.getRate = function()
        {
            return _rate;
        }
    
    
        var _volume = 100.0;
        this.setVolume = function(volume)
        {
            _volume = volume;
            if (_volume < 0.0)
            {
                _volume = 0.0;
            }
            if (_volume > 1.0)
            {
                _volume = 1.0;
            }
            _audioElement.volume = _volume;
        }
        self.setVolume(_volume);
        this.getVolume = function()
        {
            return _volume;
        }
    
        this.play = function()
        {
            if (DEBUG)
            {
                console.debug("this.play()");
            }
    
            if(!_currentEpubSrc)
            {
                return false;
            }
    
            startTimer();
    
            self.setVolume(_volume);
            self.setRate(_rate);
    
            _audioElement.play();
    
            return true;
        };
    
        this.pause = function()
        {
            if (DEBUG)
            {
                console.debug("this.pause()");
            }
    
            stopTimer();
    
            _audioElement.pause();
        };
    
        _audioElement.addEventListener('play', onPlay, false);
        _audioElement.addEventListener('pause', onPause, false);
        _audioElement.addEventListener('ended', onEnded, false);
    
        function onPlay()
        {
            onStatusChanged({isPlaying: true});
            onAudioPlay();
        }
    
        function onPause()
        {
            onStatusChanged({isPlaying: false});
            onAudioPause();
        }
    
        function onEnded()
        {
            if (_audioElement.moSeeking)
            {
                if (DEBUG)
                {
                    console.debug("onEnded() skipped (still seeking...)");
                }
    
                return;
            }
    
            stopTimer();
    
            onAudioEnded();
            onStatusChanged({isPlaying: false});
        }
        
        var _intervalTimerSkips = 0;
        
        var _intervalTimer = undefined;
        function startTimer()
        {
            if(_intervalTimer)
            {
                return;
            }
    
            _intervalTimer = setInterval(
                function()
                {
                    if (_audioElement.moSeeking)
                    {
                        if (DEBUG)
                        {
                            console.debug("interval timer skipped (still seeking...)");
                        }
                                         
                        _intervalTimerSkips++;
                        if (_intervalTimerSkips > 1000)
                        {
                            _intervalTimerSkips = 0;
                            stopTimer();
                        }
                        return;
                    }
    
                    var currentTime = _audioElement.currentTime;
    
    //                if (DEBUG)
    //                {
    //                    console.debug("currentTime: " + currentTime);
    //                }
    
                    onPositionChanged(currentTime);
                }, 20);
        }
    
        function stopTimer()
        {
            if (_intervalTimer)
            {
                clearInterval(_intervalTimer);
            }
            _intervalTimer = undefined;
        }
    
        this.isPlaying = function()
        {
            return _intervalTimer != undefined;
        };
    
        this.reset = function()
        {
            if (DEBUG)
            {
                console.debug("this.reset()");
            }
    
            this.pause();
    
            _audioElement.moSeeking = undefined;
    
            _currentSmilSrc = undefined;
            _currentEpubSrc = undefined;
    
            setTimeout(function()
            {
                _audioElement.setAttribute("src", "");
            }, 1);
        };
    
    
        var _touchInited = false;
        this.touchInit = function()
        {
            if (!_iOS)
            {
                return false;
            }
    
            if (_touchInited)
            {
                return false;
            }
    
            _touchInited = true;
    
            _audioElement.setAttribute("src", "touch/init/html5/audio.mp3");
            _audioElement.load();
    
            return true;
        }
    
        var _playId = 0;
    
        var _seekQueuing = 0;
        
        this.playFile = function(smilSrc, epubSrc, seekBegin, element)
        {
            _playId++;
            if (_playId > 99999)
            {
                _playId = 0;
            }
    
            var playId = _playId;
    
            if (_audioElement.moSeeking)
            {
                _seekQueuing++;
                if (_seekQueuing > MAX_SEEK_RETRIES)
                {
                    _seekQueuing = 0;
                    return;
                }
                
                if (DEBUG)
                {
                    console.debug("this.playFile(" + epubSrc + ")" + " @" + seekBegin + " (POSTPONE, SEEKING...)");
                }
    
                setTimeout(function()
                {
                    self.playFile(smilSrc, epubSrc, seekBegin);
                }, 20);
                
                return;
            }
    
            _audioElement.moSeeking = {};
    
            if (DEBUG)
            {
                console.debug("this.playFile(" + epubSrc + ")" + " @" + seekBegin + " #" + playId);
            }
    
            var audioNeedsNewSrc = !_currentEpubSrc || _currentEpubSrc !== epubSrc;
    
            if (!audioNeedsNewSrc)
            {
                if (DEBUG)
                {
                    console.debug("this.playFile() SAME SRC");
                }
    
                this.pause();
    
                _currentSmilSrc = smilSrc;
                _currentEpubSrc = epubSrc;
    
                playSeekCurrentTime(seekBegin, playId, false);
    
                return;
            }
    
            if (DEBUG)
            {
                console.debug("this.playFile() NEW SRC");
                console.debug("_currentEpubSrc: " + _currentEpubSrc);
                console.debug("epubSrc: " + epubSrc);
            }
    
            this.reset();
            _audioElement.moSeeking = {};
    
            _currentSmilSrc = smilSrc;
            _currentEpubSrc = epubSrc;
    
            //element.parentNode.insertBefore(_audioElement, element); //element.parentNode.childNodes[0]);
            
            if (!_Android)
            {
                _audioElement.addEventListener('play', onPlayToForcePreload, false);
            }
    
            $(_audioElement).on(_readyEvent, {seekBegin: seekBegin, playId: playId}, onReadyToSeek);
            
            setTimeout(function()
            {
                   _audioElement.setAttribute("src", _currentEpubSrc);
                   // _audioElement.src = _currentEpubSrc;
                   // $(_audioElement).attr("src", _currentEpubSrc);
    
                   // if (_Android)
                   // {
                   //     _audioElement.addEventListener('loadstart', onReadyToPlayToForcePreload, false);
                   // }
                   
                   _audioElement.load();
    
                   if (!_Android)
                   {
                       playToForcePreload();
                   }
            }, 1);
        };
    
        // var onReadyToPlayToForcePreload = function ()
        // {
        //     _audioElement.removeEventListener('loadstart', onReadyToPlayToForcePreload, false);
        //     
        //     if (DEBUG)
        //     {
        //         console.debug("onReadyToPlayToForcePreload");
        //     }
        //     
        //     playToForcePreload();
        // };
        
        var playToForcePreload = function()
        {
            if (DEBUG)
            {
                console.debug("playToForcePreload");
            }
            
            //_audioElement.volume = 0;
            //_audioElement.play();
            var vol = _volume;
            _volume = 0;
            self.play();
            _volume = vol;
        };
    
        var onPlayToForcePreload = function ()
        {
            _audioElement.removeEventListener('play', onPlayToForcePreload, false);
            
            if (DEBUG)
            {
                console.debug("onPlayToForcePreload");
            }
            _audioElement.pause(); // note: interval timer continues (immediately follows self.play())
        };
    
        var _readyEvent = _Android ? "canplaythrough" : "canplay";
        function onReadyToSeek(event)
        {
            $(_audioElement).off(_readyEvent, onReadyToSeek);
            
            if (DEBUG)
            {
                console.debug("onReadyToSeek #" + event.data.playId);
            }
            playSeekCurrentTime(event.data.seekBegin, event.data.playId, true);
        }
    
        function playSeekCurrentTime(newCurrentTime, playId, isNewSrc)
        {
            if (DEBUG)
            {
                console.debug("playSeekCurrentTime() #" + playId);
            }
    
            if (newCurrentTime == 0)
            {
                newCurrentTime = 0.01;
            }
    
            if(Math.abs(newCurrentTime - _audioElement.currentTime) < 0.3)
            {
                if (DEBUG)
                {
                    console.debug("playSeekCurrentTime() CONTINUE");
                }
    
                _audioElement.moSeeking = undefined;
                self.play();
                return;
            }
    
            var ev = isNewSrc ? _seekedEvent1 : _seekedEvent2;
    
            if (DEBUG)
            {
                console.debug("playSeekCurrentTime() NEED SEEK, EV: " + ev);
            }
    
            self.pause();
    
            $(_audioElement).on(ev, {newCurrentTime: newCurrentTime, playId: playId, isNewSrc: isNewSrc}, onSeeked);
    
            try
            {
                _audioElement.currentTime = newCurrentTime;
            }
            catch (ex)
            {
                console.error(ex.message);
    
                setTimeout(function()
                {
                    try
                    {
                        _audioElement.currentTime = newCurrentTime;
                    }
                    catch (ex)
                    {
                        console.error(ex.message);
                    }
                }, 5);
            }
        }
    
        var MAX_SEEK_RETRIES = 10;
        var _seekedEvent1 = _iOS ? "progress" : "seeked";
        var _seekedEvent2 = _iOS ? "timeupdate" : "seeked";
        function onSeeked(event)
        {
            var ev = event.data.isNewSrc ? _seekedEvent1 : _seekedEvent2;
    
            var notRetry = event.data.seekRetries == undefined;
    
            if (notRetry || event.data.seekRetries == MAX_SEEK_RETRIES) // first retry
            {
                $(_audioElement).off(ev, onSeeked);
            }
    
            if (DEBUG)
            {
                console.debug("onSeeked() #" + event.data.playId + " FIRST? " + notRetry + " EV: " + ev);
            }
    
            var curTime = _audioElement.currentTime;
            var diff = Math.abs(event.data.newCurrentTime - curTime);
    
            if((notRetry || event.data.seekRetries >= 0) &&
                diff >= 1)
            {
                if (DEBUG)
                {
                    console.debug("onSeeked() time diff: " + event.data.newCurrentTime + " vs. " + curTime + " ("+diff+")");
                }
                
                if (notRetry)
                {
                    event.data.seekRetries = MAX_SEEK_RETRIES;
    
                    if (DEBUG)
                    {
                        console.debug("onSeeked() fail => first retry, EV: " + _seekedEvent2);
                    }
    
                    event.data.isNewSrc = false;
                    $(_audioElement).on(_seekedEvent2, event.data, onSeeked);
                }
                else
                {
                    event.data.seekRetries--;
    
                    if (DEBUG)
                    {
                        console.debug("onSeeked() FAIL => retry again (timeout)");
                    }
    
                    setTimeout(function()
                    {
                        onSeeked(event);
                    }, 50);
                }
    
                setTimeout(function()
                {
                    try
                    {
                        _audioElement.currentTime = event.data.newCurrentTime;
                    }
                    catch (ex)
                    {
                        console.error(ex.message);
    
                        setTimeout(function()
                        {
                            try
                            {
                                _audioElement.currentTime = event.data.newCurrentTime;
                            }
                            catch (ex)
                            {
                                console.error(ex.message);
                            }
                        }, 4);
                    }
                }, 5);
            }
            else
            {
                if (DEBUG)
                {
                    console.debug("onSeeked() OKAY => play!");
                }
    
                event.data.seekRetries = undefined;
    
                self.play();
    
                _audioElement.moSeeking = undefined;
            }
        }
    };
    
    
    
    var DesktopAudioPlayer = function(onStatusChanged, onPositionChanged, onAudioEnded, onAudioPlay, onAudioPause) {
    
        var self = this;
    
        _audioElement.data = {
            hasInitialized : false,
            smilSrc : undefined,
            src : undefined,
        };
    
        this.currentSmilSrc = function() {
            return _audioElement.data.smilSrc;
        };
    
        this.setRate = function(rate) {
            if (rate < 0.5) {
                rate = 0.5;
            }
            if (rate > 4.0) {
                rate = 4.0;
            }
            _audioElement.playbackRate = rate;
        }
    
        this.setVolume = function(volume) {
            if (volume < 0.0) {
                volume = 0.0;
            }
            if (volume > 1.0) {
                volume = 1.0;
            }
            _audioElement.volume = volume;
        }
    
        this.play = function() {
            if (DEBUG) {
                console.debug("this.play()");
            }
    
            if (!_audioElement.data.src) {
                return false;
            }
    
            this.playFile(_audioElement.data.smilSrc, _audioElement.data.src, _audioElement.data.seekBegin, _audioElement.data.element)
            return true;
        };
    
        this.pause = function() {
            if (DEBUG) {
                console.debug("this.pause()");
            }
            _audioElement.pause();
        };
    
        this.reset = function() {
            if (DEBUG) {
                console.debug("this.reset()");
            }
    
            var tmpOnPause = function() {
                _audioElement.removeEventListener('pause', tmpOnPause);
                _audioElement.setAttribute("src", "");
                _audioElement.data.smilSrc = undefined;
                _audioElement.data.src = undefined;
            }
    
            _audioElement.addEventListener('pause', tmpOnPause);
            this.pause();
        };
    
        _audioElement.addEventListener('play', onPlay, false);
        _audioElement.addEventListener('pause', onPause, false);
        _audioElement.addEventListener('ended', onEnded, false);
        _audioElement.addEventListener('timeupdate', onTimeupdate, false);
    
        function onPlay() {
            onStatusChanged({
                isPlaying : true
            });
            onAudioPlay();
        }
    
        function onPause() {
            onStatusChanged({
                isPlaying : false
            });
            onAudioPause();
        }
    
        function onEnded() {
            onAudioEnded();
            onStatusChanged({
                isPlaying : false
            });
        }
    
        function onTimeupdate() {
            onPositionChanged(_audioElement.currentTime);
        }
    
        this.isPlaying = function() {
            return !_audioElement.paused;
        };
    
        this.playFile = function(smilSrc, epubSrc, seekBegin, element) {
    
            var oldSrc = _audioElement.data.src;
    
            _audioElement.data.element = element;
            _audioElement.data.seekBegin = seekBegin;
            _audioElement.data.src = epubSrc;
            _audioElement.data.smilSrc = smilSrc;
    
            _audioElement.addEventListener("canplay", tmpCan);
    
            function tmpSeeked() {
                _audioElement.removeEventListener("seeked", tmpSeeked);
                _audioElement.play();
            }
    
            function tmpCan() {
                if (_audioElement.data.hasInitialized) {
                    _audioElement.removeEventListener("canplay", tmpCan);
                    _audioElement.addEventListener("seeked", tmpSeeked);
                    _audioElement.currentTime = _audioElement.data.seekBegin;
                } else {
                    _audioElement.load();
                    _audioElement.data.hasInitialized = true;
                }
            }
    
            if (epubSrc !== oldSrc || !_audioElement.data.hasInitialized) {
                _audioElement.setAttribute("src", _audioElement.data.src);
                _audioElement.load();
            } else {
                _audioElement.addEventListener("seeked", tmpSeeked);
                _audioElement.currentTime = _audioElement.data.seekBegin;
            }
        };
    
    
        this.touchInit = function() {
            //dummy
        }
    }


    var useHTML5AudioPlayerForNativeSDKLauncherApps = _isMobile || !_isReadiumJS;
    if (true || DEBUG)
    {
        console.log("useHTML5AudioPlayerForNativeSDKLauncherApps: " + (useHTML5AudioPlayerForNativeSDKLauncherApps ? "YES" : "NO"));
    }

    ReadiumSDK.Views.AudioPlayer = (useHTML5AudioPlayerForNativeSDKLauncherApps) ? MobileAudioPlayer : DesktopAudioPlayer;
    
})()
