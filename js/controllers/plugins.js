//
//  Created by Mickaël Menu.
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

//
// A lightweight plugins controller used to easily add plugins from the host
// app, eg.
//
//   ReadiumSDK.plugins.load(FootnotePlugin, true);
//
// The controller will create a new instance of the plugin, forwarding any given
// arguments. Then, on several useful common Readium notifications, the
// controller will call predefined callbacks if implemented in the plug-in.
//
// Supported callbacks are:
//      onReaderInitialized()
//      onDocumentLoadStart($iframe, spineItem)
//      onDocumentLoadedBeforeInjection($iframe, $document, spineItem);
//      onDocumentLoaded($iframe, $document, spineItem);
//

function PluginsController() {
    this.plugins = [];

    var self = this;

    ReadiumSDK.on(ReadiumSDK.Events.READER_INITIALIZED, function(reader) {
        var reader = ReadiumSDK.reader;

        self.notifyPlugins("onReaderInitialized", reader);

        reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOAD_START, function($iframe, spineItem) {
            var $document = $($iframe[0].contentDocument);
            self.notifyPlugins("onDocumentLoadStart", $iframe, spineItem)
        });

        reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED_BEFORE_INJECTION, function($iframe, spineItem) {
            var $document = $($iframe[0].contentDocument);
            self.notifyPlugins("onDocumentLoadedBeforeInjection", $iframe, $document, spineItem)
        });

        reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function($iframe, spineItem) {
            var $document = $($iframe[0].contentDocument);
            self.notifyPlugins("onDocumentLoaded", $iframe, $document, spineItem);
        });
    });
};

// Creates a new instance of the given plugin constructor.
PluginsController.prototype.load = function(pluginType) {
    var args = $.makeArray(arguments);
    args.shift();
    function F() {
        return pluginType.apply(this, args);
    }
    F.prototype = constructor.prototype;

    var plugin = new F(args);
    this.plugins.push(plugin);
};

// Calls the method <name> on any plugin that implements it, forwarding any
// given argument.
PluginsController.prototype.notifyPlugins = function(name) {
    var args = $.makeArray(arguments);
    args.shift();

    var self = this;
    $(this.plugins).each(function(index, plugin) {
        var callback = plugin[name];
        if (callback)
            callback.apply(plugin, args);
    });
};

ReadiumSDK.plugins = new PluginsController();
