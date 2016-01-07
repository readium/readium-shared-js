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

//'text!empty:'
define(['./globals', 'jquery', 'console_shim', 'es6-collections', 'eventEmitter', 'URIjs', 'readium_cfi_js', 'readium_js_plugins'], function (Globals, $, console_shim, es6collections, EventEmitter, URI, epubCfi, PluginsController) {

    console.log("Globals...");

    if (window["ReadiumSDK"]) {
        console.log("ReadiumSDK extend.");
        $.extend(Globals, window.ReadiumSDK);
    } else {
        console.log("ReadiumSDK set.");
    }

    window.ReadiumSDK = Globals;

    // TODO: refactor client code to use emit instead of trigger?
    EventEmitter.prototype.trigger = EventEmitter.prototype.emit;

    // TODO pass as dependency injection define() function parameter, not window global!
    window.EventEmitter = EventEmitter;

    // TODO pass as dependency injection define() function parameter, not window global!
    window.URI = URI;

    // window.URL accessor to window.webkitURL (Safari 6 support)
    if ('URL' in window === false) {
        if ('webkitURL' in window === false) {
            throw Error('Browser does not support window.URL');
        }

        window.URL = window.webkitURL;
    }
    // Plugins bootstrapping begins
    Globals.Plugins = PluginsController;
    Globals.on(Globals.Events.READER_INITIALIZED, function(reader) {
        
        Globals.logEvent("READER_INITIALIZED", "ON", "globalsSetup.js");
        
        try {
            PluginsController.initialize(reader);
        } catch (ex) {
            console.error("Plugins failed to initialize:", ex);
        }

        _.defer(function() {
            Globals.logEvent("PLUGINS_LOADED", "EMIT", "globalsSetup.js");
            Globals.emit(Globals.Events.PLUGINS_LOADED, reader);
        });
    });

    if (window._RJS_isBrowser) {
        // If under a browser env and using RequireJS, dynamically require all plugins
        var pluginsList = window._RJS_pluginsList;
        console.log("Plugins included: ", pluginsList.map(function(v) {
            // To stay consistent with bundled output
            return v.replace('readium_plugin_', '');
        }));

        require(pluginsList);
    } else {
        // Else list which plugins were included when using almond and bundle(s)
        setTimeout(function() {
            // Assume that in the next callback all the plugins have been registered
            var pluginsList = Object.keys(PluginsController.getLoadedPlugins());
            console.log("Plugins included: ", pluginsList);
        }, 0);
    }
    // Plugins bootstrapping ends
});
