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
define(['./globals', 'jquery', 'console_shim', 'es6-shim', 'eventEmitter', 'URIjs', 'readium_cfi_js', 'readium_js_plugins'],
function (Globals, $, console_shim, es6Shim, EventEmitter, URI, EPUBcfi, PluginsController) {

    console.log("Globals...");

    // https://tc39.github.io/ecma262/#sec-array.prototype.includes
    if (!Array.prototype.includes) {
        Object.defineProperty(Array.prototype, 'includes', {
            value: function (searchElement, fromIndex) {

                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                // 1. Let O be ? ToObject(this value).
                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If len is 0, return false.
                if (len === 0) {
                    return false;
                }

                // 4. Let n be ? ToInteger(fromIndex).
                //    (If fromIndex is undefined, this step produces the value 0.)
                var n = fromIndex | 0;

                // 5. If n ≥ 0, then
                //  a. Let k be n.
                // 6. Else n < 0,
                //  a. Let k be len + n.
                //  b. If k < 0, let k be 0.
                var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

                function sameValueZero(x, y) {
                    return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
                }

                // 7. Repeat, while k < len
                while (k < len) {
                    // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                    // b. If SameValueZero(searchElement, elementK) is true, return true.
                    if (sameValueZero(o[k], searchElement)) {
                        return true;
                    }
                    // c. Increase k by 1. 
                    k++;
                }

                // 8. Return false
                return false;
            }
        });
    }

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