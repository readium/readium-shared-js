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

ReadiumSDK.Views.AudioPlayer = function(onStatusChanged, onPositionChanged, onAudioEnded, onAudioPlay, onAudioPause)
{
    var DEBUG = false;

    var self = this;

    var _audioElement = new Audio();
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

    if (DEBUG)
    {
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
                console.debug("0) ended");
            }
        );

        _audioElement.addEventListener("seeked", function()
            {
                console.debug("X) seeked");
            }
        );

        _audioElement.addEventListener("timeupdate", function()
            {
                console.debug("O) timeupdate");
            }
        );
    }


    var _iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

    var _touchInited = false;
    this.touchInit = function()
    {
        if (!_iOS)
        {
            return;
        }

        if (_touchInited)
        {
            return;
        }

        _touchInited = true;

        _audioElement.setAttribute("src", "FAKE.MP3");
        _audioElement.load();

//        setTimeout(function()
//        {
//            self.reset();
//        }, 100);
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
        
        _audioElement.addEventListener('play', onPlayToForcePreload, false);

        $(_audioElement).on(_readyEvent, {seekBegin: seekBegin, playId: playId}, onReadyToSeek);
        
        setTimeout(function()
        {
               _audioElement.setAttribute("src", _currentEpubSrc);
               // _audioElement.src = _currentEpubSrc;
               // $(_audioElement).attr("src", _currentEpubSrc);
               _audioElement.load();

               //_audioElement.volume = 0;
               //_audioElement.play();
               var vol = _volume;
               _volume = 0;
               self.play();
               _volume = vol;
        }, 1);
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

    var _readyEvent = "canplay"; //_iOS ? "canplaythrough" : "canplay";
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

        if((notRetry || event.data.seekRetries >= 0) &&
            Math.abs(event.data.newCurrentTime - _audioElement.currentTime) >= 1)
        {
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
                }, 15);
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