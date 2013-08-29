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

ReadiumSDK.Views.AudioPlayer = function(positionChanged, playEnded) {

    var elm = document.getElementById("audioPlayer");
    var rate = 1.0;
    var source = undefined;
    var onPlayEnded = playEnded;
    var onPositionChanged = positionChanged;
    var timerId = undefined;

    elm.playbackRate = rate;

    elm.addEventListener("ended", function() {

        stopTimer();
        onPlayEnded();
    });


    this.play = function(mediaFile, clipBegin) {

        source = mediaFile;

        if(elm.getAttribute("src") != source) {
            elm.addEventListener("canplay", function() {
                elm.removeEventListener("canplay");

                playFromPosition(clipBegin);
            });

            elm.setAttribute("src", source);
        }
        else {
            playFromPosition(clipBegin);
        }
    };

    this.isPlaying = function() {

        return timerId;
    };

    this.pause = function() {
        stopTimer();
        elm.pause();
    };

    this.resume = function() {

        if(!source) {
            return;
        }

        startTimer();
        elm.play();
    };

    function playFromPosition(position) {

        stopTimer();

        elm.addEventListener("seeked", function(){
            elm.removeEventListener("seeked");

            startTimer();
            elm.play();
        });

        elm.currentTime = position;
    }

    function stopTimer() {
        clearInterval(timerId);
        timerId = undefined;
    }

    function startTimer() {

        if(timerId) {
            return;
        }

        timerId = setInterval(function() {

            onPositionChanged(elm.currentTime);

        }, 11);
    }

};