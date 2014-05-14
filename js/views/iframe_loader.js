//  LauncherOSX
//
//  Created by Boris Schneiderman.
// Modified by Daniel Weck
//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.
//  
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
//  OF THE POSSIBILITY OF SUCH DAMAGE.

ReadiumSDK.Views.IFrameLoader = function() {

    var self = this;
    var eventListeners = {};


    this.addIFrameEventListener = function(eventName, callback, context) {

        if(eventListeners[eventName] == undefined) {
            eventListeners[eventName] = [];
        }

        eventListeners[eventName].push({callback: callback, context: context});
    };

    this.updateIframeEvents = function(iframe) {

        _.each(eventListeners, function(value, key){
            for(var i = 0, count = value.length; i< count; i++) {
                $(iframe.contentWindow).off(key);
                $(iframe.contentWindow).on(key, value[i].callback, value[i].context);
            }
        });
    };


    this.loadIframe = function(iframe, src, callback, context) {

        var isWaitingForFrameLoad = true;

        iframe.onload = function() {

            iframe.onload = undefined;

            isWaitingForFrameLoad = false;

            self.updateIframeEvents(iframe);

            try
            {
                iframe.contentWindow.navigator.epubReadingSystem = navigator.epubReadingSystem;
                // console.debug("epubReadingSystem name:"
                //     + iframe.contentWindow.navigator.epubReadingSystem.name
                //     + " version:"
                //     + iframe.contentWindow.navigator.epubReadingSystem.version
                //     + " is loaded to iframe");
            }
            catch(ex)
            {
                console.log("epubReadingSystem INJECTION ERROR! " + ex.message);
            }

            callback.call(context, true);

        };

        //yucks! iframe doesn't trigger onerror event - there is no reliable way to know that iframe finished
        // attempt tot load resource (successfully or not;
        window.setTimeout(function(){

            if(isWaitingForFrameLoad) {

                isWaitingForFrameLoad = false;
                callback.call(context, false);
            }

        }, 8000);

        iframe.src = src;
    };
};
