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

ReadiumSDK.Views.IFrameLoader = function(options) {

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

        injectScripts(src, function (htmlText) {

            iframe.contentWindow.document.open();
            //inject reading system object before writing to the iframe DOM
            iframe.contentWindow.navigator.epubReadingSystem = navigator.epubReadingSystem;

            iframe.contentWindow.document.write(htmlText);

            iframe.onload = function () {

                isWaitingForFrameLoad = false;

                self.updateIframeEvents(iframe);

                callback.call(context, true);
            };

            iframe.contentWindow.document.close();
        });

        //yucks! iframe doesn't trigger onerror event - there is no reliable way to know that iframe finished
        // attempt tot load resource (successfully or not;
        window.setTimeout(function(){

            if(isWaitingForFrameLoad) {

                isWaitingForFrameLoad = false;
                callback.call(context, false);
            }

        }, 8000);

    };

    function getFileText(path, callback) {

        $.ajax({
            url: path,
            dataType: 'html',
            async: true,
            success: function (result) {

                callback(result);
            },
            error: function (xhr, status, errorThrown) {
                console.error('Error when AJAX fetching ' + path);
                console.error(status);
                console.error(errorThrown);
                callback();
            }
        });
    }

    function injectScripts(src, callback) {

        getFileText(src, function (contentFileData) {

            if (!contentFileData) {
                callback();
                return;
            }

            var sourceParts = src.split("/");
            sourceParts.pop(); //remove source file name

            /* TODO:
             IE requires the base href to be a full absolute URI, with protocol and hostname.
             There needs to be a way to determine if the given source URI (`src` parameter) is already an absolute URI.
             */
            if (!window.location.origin) {
                window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            }
            var base = "<base href=\"" + window.location.origin + "/" + sourceParts.join("/") + "/" + "\">";

            var securityScript = "<script>(" + disableParent.toString() + ")()<\/script>";
            var mathJaxScript = "";
            if (options && options.mathJaxUrl && contentFileData.indexOf("<math") !== 0) {
                mathJaxScript = "<script type=\"text/javascript\" src=\"" + options.mathJaxUrl + "\"><\/script>";
            }

            var mangledContent = contentFileData.replace(/(<head.*?>)/, "$1" + base + securityScript + mathJaxScript);
            callback(mangledContent);
        });
    }

    function disableParent() {

        window.parent = undefined;
    }

};
