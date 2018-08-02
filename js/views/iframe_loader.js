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

define(["jquery", "underscore", 'URIjs'], function($, _, URI) {
/**
 *
 * @constructor
 */
var IFrameLoader = function() {

    var self = this;
    var eventListeners = {};


    this.addIFrameEventListener = function (eventName, callback, context) {

        if (eventListeners[eventName] == undefined) {
            eventListeners[eventName] = [];
        }

        eventListeners[eventName].push({callback: callback, context: context});
    };

    this.updateIframeEvents = function (iframe) {

        _.each(eventListeners, function (value, key) {
            $(iframe.contentWindow).off(key);
            for (var i = 0, count = value.length; i < count; i++) {
                $(iframe.contentWindow).on(key, value[i].callback, value[i].context);
            }
        });
    };

    this.loadIframe = function (iframe, src, callback, context, attachedData) {

        if (!iframe.baseURI) {
            if (typeof location !== 'undefined') {
                iframe.baseURI = location.href + "";
            }
            console.error("!iframe.baseURI => " + iframe.baseURI);
        }
    
        console.log("EPUB doc iframe src:");
        console.log(src);
        console.log("EPUB doc iframe base URI:");
        console.log(iframe.baseURI);
        
        iframe.setAttribute("data-baseUri", iframe.baseURI);
        iframe.setAttribute("data-src", src);

        var loadedDocumentUri = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();

        self._loadIframeWithUri(iframe, attachedData, loadedDocumentUri, function () {
            
            callback.call(context, true, attachedData);
        });
    };

    this._loadIframeWithUri = function (iframe, attachedData, contentUri, callback) {

        iframe.onload = function () {

            var doc = iframe.contentDocument || iframe.contentWindow.document;
            $('svg', doc).on("load", function(){
                console.log('SVG loaded');
            });
            
            self.updateIframeEvents(iframe);

            var mathJax = iframe.contentWindow.MathJax;
            if (mathJax) {
                
                console.log("MathJax VERSION: " + mathJax.cdnVersion + " // " + mathJax.fileversion + " // " + mathJax.version);
    
                var useFontCache = true; // default in MathJax
                
                // Firefox fails to render SVG otherwise
                if (mathJax.Hub.Browser.isFirefox) {
                    useFontCache = false;
                }
                
                // Chrome 49+ fails to render SVG otherwise
                // https://github.com/readium/readium-js/issues/138
                if (mathJax.Hub.Browser.isChrome) {
                    useFontCache = false;
                }
                
                // Edge fails to render SVG otherwise
                // https://github.com/readium/readium-js-viewer/issues/394#issuecomment-185382196
                if (window.navigator.userAgent.indexOf("Edge") > 0) {
                    useFontCache = false;
                }
                
                mathJax.Hub.Config({showMathMenu:false, messageStyle: "none", showProcessingMessages: true, SVG:{useFontCache:useFontCache}});
                
                // If MathJax is being used, delay the callback until it has completed rendering
                var mathJaxCallback = _.once(callback);
                try {
                    mathJax.Hub.Queue(mathJaxCallback);
                } catch (err) {
                    console.error("MathJax fail!");
                    callback();
                }
                // Or at an 8 second timeout, which ever comes first
                //window.setTimeout(mathJaxCallback, 8000);
            } else {
                callback();
            }
        };

        iframe.setAttribute("src", contentUri);
    };

};

return IFrameLoader;
});
