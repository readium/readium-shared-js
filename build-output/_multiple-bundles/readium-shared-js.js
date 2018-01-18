//  LauncherOSX
//
//  Created by Boris Schneiderman.
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

define('readium_shared_js/globals',['jquery','eventEmitter'], function($, EventEmitter) {
    
    var DEBUG = false;
    
/**
 * Top level ReadiumSDK namespace
 * @namespace
 */
var Globals = {

    /**
     * Current version of the JS SDK
     * @static
     * @return {string} version
     */
    version: function () {
        return "0.8.0";
    },
    /**
     * @namespace
     */
    Views: {
        /**
         * Landscape Orientation
         */
        ORIENTATION_LANDSCAPE: "orientation_landscape",
        /**
         * Portrait Orientation
         */
        ORIENTATION_PORTRAIT: "orientation_portrait"
    },
    /**
     * @namespace
     */
    Events: {
        /**
         * @event
         */
        READER_INITIALIZED: "ReaderInitialized",
        /**
         * This gets triggered on every page turnover. It includes spine information and such.
         * @event
         */
        PAGINATION_CHANGED: "PaginationChanged",
        /**
         * @event
         */
        SETTINGS_APPLIED: "SettingsApplied",
        /**
         * @event
         */
        FXL_VIEW_RESIZED: "FXLViewResized",
        /**
         * @event
         */
        READER_VIEW_CREATED: "ReaderViewCreated",
        /**
         * @event
         */
        READER_VIEW_DESTROYED: "ReaderViewDestroyed",
        /**
         * @event
         */
        CONTENT_DOCUMENT_LOAD_START: "ContentDocumentLoadStart",
        /**
         * @event
         */
        CONTENT_DOCUMENT_LOADED: "ContentDocumentLoaded",
        /**
         * @event
         */
        CONTENT_DOCUMENT_UNLOADED: "ContentDocumentUnloaded",
        /**
         * @event
         */
        MEDIA_OVERLAY_STATUS_CHANGED: "MediaOverlayStatusChanged",
        /**
         * @event
         */
        MEDIA_OVERLAY_TTS_SPEAK: "MediaOverlayTTSSpeak",
        /**
         * @event
         */
        MEDIA_OVERLAY_TTS_STOP: "MediaOverlayTTSStop",
        /**
         * @event
         */
        PLUGINS_LOADED: "PluginsLoaded"
    },
    /**
     * Internal Events
     *
     * @desc Should not be triggered outside of {@link Views.ReaderView}.
     * @namespace
     */
    InternalEvents: {
        /**
         * @event
         */
        CURRENT_VIEW_PAGINATION_CHANGED: "CurrentViewPaginationChanged",
    },
    
    logEvent: function(eventName, eventType, eventSource) {
        if (DEBUG) {
            console.debug("#### ReadiumSDK.Events." + eventName + " - "+eventType+" - " + eventSource);
        }
    }
};
$.extend(Globals, new EventEmitter());

return Globals;

});

//This is default implementation of reading system object that will be available for the publication's javascript to analyze at runtime
//To extend/modify/replace this object reading system should subscribe Globals.Events.READER_INITIALIZED and apply changes in reaction to this event
navigator.epubReadingSystem = {
    name: "",
    version: "0.0.0",
    layoutStyle: "paginated",

    hasFeature: function (feature, version) {

        // for now all features must be version 1.0 so fail fast if the user has asked for something else
        if (version && version !== "1.0") {
            return false;
        }

        if (feature === "dom-manipulation") {
            // Scripts may make structural changes to the document???s DOM (applies to spine-level scripting only).
            return true;
        }
        if (feature === "layout-changes") {
            // Scripts may modify attributes and CSS styles that affect content layout (applies to spine-level scripting only).
            return true;
        }
        if (feature === "touch-events") {
            // The device supports touch events and the Reading System passes touch events to the content.
            return false;
        }
        if (feature === "mouse-events") {
            // The device supports mouse events and the Reading System passes mouse events to the content.
            return true;
        }
        if (feature === "keyboard-events") {
            // The device supports keyboard events and the Reading System passes keyboard events to the content.
            return true;
        }

        if (feature === "spine-scripting") {
            //Spine-level scripting is supported.
            return true;
        }

        return false;
    }
};
(function (exports) {'use strict';
  //shared pointer
  var i;
  //shortcuts
  var defineProperty = Object.defineProperty, is = function(a,b) { return (a === b) || (a !== a && b !== b) };


  //Polyfill global objects
  if (typeof WeakMap == 'undefined') {
    exports.WeakMap = createCollection({
      // WeakMap#delete(key:void*):boolean
      'delete': sharedDelete,
      // WeakMap#clear():
      clear: sharedClear,
      // WeakMap#get(key:void*):void*
      get: sharedGet,
      // WeakMap#has(key:void*):boolean
      has: mapHas,
      // WeakMap#set(key:void*, value:void*):void
      set: sharedSet
    }, true);
  }

  if (typeof Map == 'undefined' || typeof ((new Map).values) !== 'function' || !(new Map).values().next) {
    exports.Map = createCollection({
      // WeakMap#delete(key:void*):boolean
      'delete': sharedDelete,
      //:was Map#get(key:void*[, d3fault:void*]):void*
      // Map#has(key:void*):boolean
      has: mapHas,
      // Map#get(key:void*):boolean
      get: sharedGet,
      // Map#set(key:void*, value:void*):void
      set: sharedSet,
      // Map#keys(void):Iterator
      keys: sharedKeys,
      // Map#values(void):Iterator
      values: sharedValues,
      // Map#entries(void):Iterator
      entries: mapEntries,
      // Map#forEach(callback:Function, context:void*):void ==> callback.call(context, key, value, mapObject) === not in specs`
      forEach: sharedForEach,
      // Map#clear():
      clear: sharedClear
    });
  }

  if (typeof Set == 'undefined' || typeof ((new Set).values) !== 'function' || !(new Set).values().next) {
    exports.Set = createCollection({
      // Set#has(value:void*):boolean
      has: setHas,
      // Set#add(value:void*):boolean
      add: sharedAdd,
      // Set#delete(key:void*):boolean
      'delete': sharedDelete,
      // Set#clear():
      clear: sharedClear,
      // Set#keys(void):Iterator
      keys: sharedValues, // specs actually say "the same function object as the initial value of the values property"
      // Set#values(void):Iterator
      values: sharedValues,
      // Set#entries(void):Iterator
      entries: setEntries,
      // Set#forEach(callback:Function, context:void*):void ==> callback.call(context, value, index) === not in specs
      forEach: sharedForEach
    });
  }

  if (typeof WeakSet == 'undefined') {
    exports.WeakSet = createCollection({
      // WeakSet#delete(key:void*):boolean
      'delete': sharedDelete,
      // WeakSet#add(value:void*):boolean
      add: sharedAdd,
      // WeakSet#clear():
      clear: sharedClear,
      // WeakSet#has(value:void*):boolean
      has: setHas
    }, true);
  }


  /**
   * ES6 collection constructor
   * @return {Function} a collection class
   */
  function createCollection(proto, objectOnly){
    function Collection(a){
      if (!this || this.constructor !== Collection) return new Collection(a);
      this._keys = [];
      this._values = [];
      this._itp = []; // iteration pointers
      this.objectOnly = objectOnly;

      //parse initial iterable argument passed
      if (a) init.call(this, a);
    }

    //define size for non object-only collections
    if (!objectOnly) {
      defineProperty(proto, 'size', {
        get: sharedSize
      });
    }

    //set prototype
    proto.constructor = Collection;
    Collection.prototype = proto;

    return Collection;
  }


  /** parse initial iterable argument passed */
  function init(a){
    var i;
    //init Set argument, like `[1,2,3,{}]`
    if (this.add)
      a.forEach(this.add, this);
    //init Map argument like `[[1,2], [{}, 4]]`
    else
      a.forEach(function(a){this.set(a[0],a[1])}, this);
  }


  /** delete */
  function sharedDelete(key) {
    if (this.has(key)) {
      this._keys.splice(i, 1);
      this._values.splice(i, 1);
      // update iteration pointers
      this._itp.forEach(function(p) { if (i < p[0]) p[0]--; });
    }
    // Aurora here does it while Canary doesn't
    return -1 < i;
  };

  function sharedGet(key) {
    return this.has(key) ? this._values[i] : undefined;
  }

  function has(list, key) {
    if (this.objectOnly && key !== Object(key))
      throw new TypeError("Invalid value used as weak collection key");
    //NaN or 0 passed
    if (key != key || key === 0) for (i = list.length; i-- && !is(list[i], key);){}
    else i = list.indexOf(key);
    return -1 < i;
  }

  function setHas(value) {
    return has.call(this, this._values, value);
  }

  function mapHas(value) {
    return has.call(this, this._keys, value);
  }

  /** @chainable */
  function sharedSet(key, value) {
    this.has(key) ?
      this._values[i] = value
      :
      this._values[this._keys.push(key) - 1] = value
    ;
    return this;
  }

  /** @chainable */
  function sharedAdd(value) {
    if (!this.has(value)) this._values.push(value);
    return this;
  }

  function sharedClear() {
    (this._keys || 0).length =
    this._values.length = 0;
  }

  /** keys, values, and iterate related methods */
  function sharedKeys() {
    return sharedIterator(this._itp, this._keys);
  }

  function sharedValues() {
    return sharedIterator(this._itp, this._values);
  }

  function mapEntries() {
    return sharedIterator(this._itp, this._keys, this._values);
  }

  function setEntries() {
    return sharedIterator(this._itp, this._values, this._values);
  }

  function sharedIterator(itp, array, array2) {
    var p = [0], done = false;
    itp.push(p);
    return {
      next: function() {
        var v, k = p[0];
        if (!done && k < array.length) {
          v = array2 ? [array[k], array2[k]]: array[k];
          p[0]++;
        } else {
          done = true;
          itp.splice(itp.indexOf(p), 1);
        }
        return { done: done, value: v };
      }
    };
  }

  function sharedSize() {
    return this._values.length;
  }

  function sharedForEach(callback, context) {
    var it = this.entries();
    for (;;) {
      var r = it.next();
      if (r.done) break;
      callback.call(context, r.value[1], r.value[0], this);
    }
  }

})(typeof exports != 'undefined' && typeof global != 'undefined' ? global : window );

define("es6-collections", function(){});

//
//  Created by Juan Corona
//  Based on original proposal by Mickaël Menu
//  Portions adapted from Rangy's Module system: Copyright (c) 2014 Tim Down
//
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

define('readium_js_plugins',["jquery", "underscore", "eventEmitter"], function ($, _, EventEmitter) {

    var _registeredPlugins = {};

    /**
     * A  plugins controller used to easily add plugins from the host app, eg.
     * ReadiumSDK.Plugins.register("footnotes", function(api){ ... });
     *
     * @constructor
     */
    var PluginsController = function () {
        var self = this;


        this.initialize = function (reader) {
            var apiFactory = new PluginApiFactory(reader);

            if (!reader.plugins) {
                //attach an object to the reader that will be
                // used for plugin namespaces and their extensions
                reader.plugins = {};
            } else {
                throw new Error("Already initialized on reader!");
            }
            _.each(_registeredPlugins, function (plugin) {
                plugin.init(apiFactory);
            });
        };

        this.getLoadedPlugins = function() {
            return _registeredPlugins;
        };

        // Creates a new instance of the given plugin constructor.
        this.register = function (name, optDependencies, initFunc) {

            if (_registeredPlugins[name]) {
                throw new Error("Duplicate registration for plugin with name: " + name);
            }

            var dependencies;
            if (typeof optDependencies === 'function') {
                initFunc = optDependencies;
            } else {
                dependencies = optDependencies;
            }

            _registeredPlugins[name] = new Plugin(name, dependencies, function(plugin, api) {
                if (!plugin.initialized || !api.host.plugins[plugin.name]) {
                    plugin.initialized = true;
                    try {
                        var pluginContext = {};
                        $.extend(pluginContext, new EventEmitter());

                        initFunc.call(pluginContext, api.instance);
                        plugin.supported = true;

                        api.host.plugins[plugin.name] = pluginContext;
                    } catch (ex) {
                        plugin.fail(ex);
                    }
                }
            });
        };
    };

    function PluginApi(reader, plugin) {
        this.reader = reader;
        this.plugin = plugin;
    }

    function PluginApiFactory(reader) {
        this.create = function (plugin) {
            return {
                host: reader,
                instance: new PluginApi(reader, plugin)
            };
        };
    }

//
//  The following is adapted from Rangy's Module class:
//
//  Copyright (c) 2014 Tim Down
//
//  The MIT License (MIT)
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.

    function Plugin(name, dependencies, initializer) {
        this.name = name;
        this.dependencies = dependencies;
        this.initialized = false;
        this.supported = false;
        this.initializer = initializer;
    }

    Plugin.prototype = {
        init: function (apiFactory) {
            var requiredPluginNames = this.dependencies || [];
            for (var i = 0, len = requiredPluginNames.length, requiredPlugin, PluginName; i < len; ++i) {
                PluginName = requiredPluginNames[i];

                requiredPlugin = _registeredPlugins[PluginName];
                if (!requiredPlugin || !(requiredPlugin instanceof Plugin)) {
                    throw new Error("required Plugin '" + PluginName + "' not found");
                }

                requiredPlugin.init(apiFactory);

                if (!requiredPlugin.supported) {
                    throw new Error("required Plugin '" + PluginName + "' not supported");
                }
            }

            // Now run initializer
            this.initializer(this, apiFactory.create(this));
        },

        fail: function (reason) {
            this.initialized = true;
            this.supported = false;
            throw new Error("Plugin '" + this.name + "' failed to load: " + reason);
        },

        warn: function (msg) {
            console.warn("Plugin " + this.name + ": " + msg);
        },

        deprecationNotice: function (deprecated, replacement) {
            console.warn("DEPRECATED: " + deprecated + " in Plugin " + this.name + "is deprecated. Please use "
            + replacement + " instead");
        },

        createError: function (msg) {
            return new Error("Error in " + this.name + " Plugin: " + msg);
        }
    };

    var instance = new PluginsController();
    return instance;
});

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
define('readium_shared_js/globalsSetup',['./globals', 'jquery', 'console_shim', 'es6-collections', 'eventEmitter', 'URIjs', 'readium_cfi_js', 'readium_js_plugins'], function (Globals, $, console_shim, es6collections, EventEmitter, URI, epubCfi, PluginsController) {

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

define('readium_shared_js', ['readium_shared_js/globalsSetup'], function (main) { return main; });

//  Created by Boris Schneiderman.
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

define('readium_shared_js/models/bookmark_data',[],function() {
/**
 * @class Models.BookmarkData
 */
var BookmarkData = function(idref, contentCFI) {

    var self = this;

    /**
     * spine item idref
     * @property idref
     * @type {string}
     */

    this.idref = idref;

    /**
     * cfi of the first visible element
     * @property contentCFI
     * @type {string}
     */
    
    this.contentCFI = contentCFI;

    /**
     * serialize to string
     * @return JSON string representation
     */
    
    this.toString = function(){
        return JSON.stringify(self);
    }

};

/**
 * Deserialize from string
 * @param str
 * @returns {ReadiumSDK.Models.BookmarkData}
 */
BookmarkData.fromString = function(str) {
    var obj = JSON.parse(str);
    return new BookmarkData(obj.idref,obj.contentCFI);
};
return BookmarkData;
});
//  Created by Boris Schneiderman.
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

define('readium_shared_js/models/current_pages_info',[],function() {

/**
 * Used to report pagination state back to the host application
 *
 * @class Models.CurrentPagesInfo
 *
 * @constructor
 *
 * @param {Models.Spine} spine
 * @param {boolean} isFixedLayout is fixed or reflowable spine item
 * @return CurrentPagesInfo
*/

var CurrentPagesInfo = function(spine, isFixedLayout) {


    /**
     * The reading direction
     *
     * @property isRightToLeft
     * @type bool
     */

    this.isRightToLeft = spine.isRightToLeft();
    
    /**
     * Is the ebook fixed layout or not?
     *
     * @property isFixedLayout
     * @type bool
     */

    this.isFixedLayout = isFixedLayout;
    
    /**
     * Counts the number of spine items
     *
     * @property spineItemCount
     * @type number
     */    

    this.spineItemCount = spine.items.length
    
    /**
     * returns an array of open pages, each array item is a data structure (plain JavaScript object) with the following fields: spineItemPageIndex, spineItemPageCount, idref, spineItemIndex (as per the parameters of the addOpenPage() function below)
     *
     * @property openPages
     * @type array
     */

    this.openPages = [];

    /**
     * Adds an page item to the openPages array
     *
     * @method     addOpenPage
     * @param      {number} spineItemPageIndex
     * @param      {number} spineItemPageCount
     * @param      {string} idref
     * @param      {number} spineItemIndex   
     */

    this.addOpenPage = function(spineItemPageIndex, spineItemPageCount, idref, spineItemIndex) {
        this.openPages.push({spineItemPageIndex: spineItemPageIndex, spineItemPageCount: spineItemPageCount, idref: idref, spineItemIndex: spineItemIndex});

        this.sort();
    };

    /**
     * Checks if navigation to the page on the left is possible (depending on page-progression-direction: previous page in LTR mode, next page in RTL mode)
     *
     * @method     canGoLeft
     * @return bool true if turning to the left page is possible 
     */

    this.canGoLeft = function () {
        return this.isRightToLeft ? this.canGoNext() : this.canGoPrev();
    };

    /**
     * Checks if navigation to the page on the right is possible (depending on page-progression-direction: next page in LTR mode, previous page in RTL mode)
     *
     * @method     canGoRight
     * @return bool true if turning to the right page is possible 
     */

    this.canGoRight = function () {
        return this.isRightToLeft ? this.canGoPrev() : this.canGoNext();
    };

    /**
     * Checks if navigation to the next page is possible (depending on page-progression-direction: right page in LTR mode, left page in RTL mode)
     *
     * @method     canGoNext
     * @return bool true if turning to the next page is possible 
     */

    this.canGoNext = function() {

        if(this.openPages.length == 0)
            return false;

        var lastOpenPage = this.openPages[this.openPages.length - 1];

        // TODO: handling of non-linear spine items ("ancillary" documents), allowing page turn within the reflowable XHTML, but preventing previous/next access to sibling spine items. Also needs "go back" feature to navigate to source hyperlink location that led to the non-linear document.
        // See https://github.com/readium/readium-shared-js/issues/26

        // Removed, needs to be implemented properly as per above.
        // See https://github.com/readium/readium-shared-js/issues/108
        // if(!spine.isValidLinearItem(lastOpenPage.spineItemIndex))
        //     return false;

        return lastOpenPage.spineItemIndex < spine.last().index || lastOpenPage.spineItemPageIndex < lastOpenPage.spineItemPageCount - 1;
    };

    /**
     * Checks if navigation to the previous page is possible (depending on page-progression-direction: left page in LTR mode, right page in RTL mode)
     *
     * @method     canGoPrev
     * @return bool true if turning to the previous page is possible 
     */

    this.canGoPrev = function() {

        if(this.openPages.length == 0)
            return false;

        var firstOpenPage = this.openPages[0];

        // TODO: handling of non-linear spine items ("ancillary" documents), allowing page turn within the reflowable XHTML, but preventing previous/next access to sibling spine items. Also needs "go back" feature to navigate to source hyperlink location that led to the non-linear document.
        // See https://github.com/readium/readium-shared-js/issues/26

        // Removed, needs to be implemented properly as per above.
        // //https://github.com/readium/readium-shared-js/issues/108
        // if(!spine.isValidLinearItem(firstOpenPage.spineItemIndex))
        //     return false;

        return spine.first().index < firstOpenPage.spineItemIndex || 0 < firstOpenPage.spineItemPageIndex;
    };

    /**
     * Sorts the openPages array based on spineItemIndex and spineItemPageIndex
     *
     * @method     sort
     */

    this.sort = function() {

        this.openPages.sort(function(a, b) {

            if(a.spineItemIndex != b.spineItemIndex) {
                return a.spineItemIndex - b.spineItemIndex;
            }

            return a.spineItemPageIndex - b.spineItemPageIndex;

        });

    };

};

return CurrentPagesInfo;
});
  //  Created by Boris Schneiderman.
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

define('readium_shared_js/models/fixed_page_spread',[],function() {
/**
 * Spread the page 
 *
 * @class  Models.Spread
 * @constructor
 * @param spine 
 * @param {Boolean} isSyntheticSpread 
 *
 */
var Spread = function(spine, isSyntheticSpread) {

    var self = this;

    this.spine = spine;
    
    this.leftItem = undefined;
    this.rightItem = undefined;
    this.centerItem = undefined;

    var _isSyntheticSpread = isSyntheticSpread;

    /**
     * Sets whether or not this is a synthetic spread
     *
     * @method     setSyntheticSpread
     * @param      {Bool} isSyntheticSpread
     */

    this.setSyntheticSpread = function(isSyntheticSpread) {
        _isSyntheticSpread = isSyntheticSpread;
    };

    /**
     * Checks out if the spread is synthetic
     *
     * @method     isSyntheticSpread
     * @return     {Bool} true if this is a 2-page synthetic spread
     */

    this.isSyntheticSpread = function() {
        return _isSyntheticSpread;
    };

    /**
     * Opens the first spine item (FXL page)
     *
     * @method     openFirst
     */

    this.openFirst = function() {

        if( this.spine.items.length == 0 ) {
            resetItems();
        }
        else {
            this.openItem(this.spine.first());
        }
    };

    /**
     * Opens the last spine item (FXL page)
     *
     * @method     openLast
     */

    this.openLast = function() {

        if( this.spine.items.length == 0 ) {
            resetItems();
        }
        else {
            this.openItem(this.spine.last());
        }
    };

    /**
     * Opens a spine item (FXL page)
     *
     * @method     openItem
     * @param      {Models.SpineItem} item
     */

    this.openItem = function(item) {

        resetItems();

        var position = getItemPosition(item);
        setItemToPosition(item, position);

        if(position != Spread.POSITION_CENTER && this.spine.isValidLinearItem(item.index)) { // && item.isRenditionSpreadAllowed() not necessary, see getItemPosition() below
            var neighbour = getNeighbourItem(item);
            if(neighbour) {
                var neighbourPos = getItemPosition(neighbour);
                if(neighbourPos != position
                    && neighbourPos != Spread.POSITION_CENTER
                    && !neighbour.isReflowable()
                    && neighbour.isRenditionSpreadAllowed())  {
                    setItemToPosition(neighbour, neighbourPos);
                }
            }
        }
    };

    /**
     * Resets the spine items (FXL pages, left + right + center) to undefined
     *
     * @method     resetItems
     */

    function resetItems() {

        self.leftItem = undefined;
        self.rightItem = undefined;
        self.centerItem = undefined;
    }

    /**
     * Sets the spine item (FXL page) to a position (left, right or center)
     *
     * @method     setItemToPosition
     * @param      {Models.SpineItem} item
     * @param      {Spread.POSITION_CENTER | Spread.POSITION_LEFT | Spread.POSITION_RIGHT} position
     */

    function setItemToPosition(item, position) {

        if(position == Spread.POSITION_LEFT) {
            self.leftItem = item;
        }
        else if (position == Spread.POSITION_RIGHT) {
            self.rightItem = item;
        }
        else {

            if(position != Spread.POSITION_CENTER) {
                console.error("Unrecognized position value");
            }

            self.centerItem = item;
        }
    }

    /**
     * Returns the position of a spine item / FXL page (left, center or right)
     *
     * @method     getItemPosition
     * @param      {Models.SpineItem} item
     * @return     {Spread.POSITION_CENTER | Spread.POSITION_LEFT | Spread.POSITION_RIGHT}
     */

    function getItemPosition(item) {
        
        // includes !item.isRenditionSpreadAllowed() ("rendition:spread-none") ==> force center position
        if(!_isSyntheticSpread) {
            return Spread.POSITION_CENTER;
        }

        if(item.isLeftPage()) {
            return Spread.POSITION_LEFT;
        }

        if (item.isRightPage()) {
            return Spread.POSITION_RIGHT;
        }

        return Spread.POSITION_CENTER;
    }

    /**
     * Opens the next item
     *
     * @method     openNext
     */ 

    this.openNext = function() {

        var items = this.validItems();

        if(items.length == 0) {

            this.openFirst();
        }
        else {

            var nextItem = this.spine.nextItem(items[items.length - 1]);
            if(nextItem) {

                this.openItem(nextItem);
            }
        }
    };

    /**
     * Opens the previous item
     *
     * @method     openPrev
     */ 

    this.openPrev = function() {

        var items = this.validItems();

        if(items.length == 0) {
            this.openLast();
        }
        else {

            var prevItem = this.spine.prevItem(items[0]);
            if(prevItem) {

                this.openItem(prevItem);

            }
        }
    };

    /**
     * Returns an sorrted array of spine items (as per their order in the spine) that are currently in the FXL page layout
     *
     * @method     validItems
     * @return     {array} 
     */ 

    this.validItems = function() {

        var arr = [];

        if(this.leftItem) arr.push(this.leftItem);
        if(this.rightItem) arr.push(this.rightItem);
        if(this.centerItem) arr.push(this.centerItem);

        arr.sort(function(a, b) {
            return a.index - b.index;
        });

        return arr;
    };

    /**
     * Gets the neighbour spine item in the FXL page layout (on left or right of the current item)
     *
     * @method     getNeighbourItem
     * @param      {Models.SpineItem} item
     * @return     {Models.SpineItem} item
     */ 

    function getNeighbourItem(item) {

        if(item.isLeftPage()) {
            return self.spine.isRightToLeft() ? self.spine.prevItem(item) : self.spine.nextItem(item);
        }

        if(item.isRightPage()) {
            return self.spine.isRightToLeft() ? self.spine.nextItem(item) : self.spine.prevItem(item);
        }

        return undefined;
    }

};

Spread.POSITION_LEFT = "left";
Spread.POSITION_RIGHT = "right";
Spread.POSITION_CENTER = "center";

return Spread;
});
//  Created by Boris Schneiderman.
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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

define('readium_shared_js/models/spine_item',[], function() {

/**
 * Wrapper of the SpineItem object received from the host application
 *
 * @class  Models.SpineItem
 * @constructor
 * @param itemData container for spine item properties
 * @param {Number} index index of this spine item in the parent spine 
 * @param {Models.Spine} spine parent spine
 *
 */
var SpineItem = function(itemData, index, spine){

    var self = this;

    /**
     * The idref of the spine item, i.e. the ID-based pointer to the actual 
     * manifest item that the spine item references
     *
     * @property idref
     * @type String
     * @default  None
     */
    this.idref = itemData.idref;

    /**
     * The href of the spine item, i.e. the URI to the resource in the EPUB
     * which the spineitem will render
     *
     * @property href
     * @type String
     * @default  None
     */
    this.href = itemData.href;

    /**
     * The package level CFI of the spine item, i.e. the CFI path to the spine item
     * element in the package document.
     *
     * @property cfi
     * @type String
     * @default  None
     */
    this.cfi = itemData.cfi;

    /**
     * A flag indicating whether the spineItem has the attribute linear, which 
     * is either yes or no.  Default is yes.
     *
     * @property linear
     * @type String
     * @default  yes
     */
    this.linear = itemData.linear ? itemData.linear.toLowerCase() : itemData.linear;

    /**
     * A variable indicating the type of synthetic spread for this specific
     * spine item, where page:spread-* can be left, right or center or auto
     *
     * @property page_spread
     * @type String
     * @default  auto
     */
    this.page_spread = itemData.page_spread;
    
    /**
     * A string specifying the height and width from the rendition:viewport tag.
     * Note: This is deprecated in EPUB 3.1
     *
     * @property rendition_viewport
     * @type     String
     * @default  None
     */
    this.rendition_viewport = itemData.rendition_viewport;
    
    /**
     * A string specifying the type of synthetic spread for ALL spine items, where
     * where rendtion:spread-* can be left, right or center or auto
     *
     * @property rendition_spread
     * @type     String
     * @default  auto
     */
    this.rendition_spread = itemData.rendition_spread;

    /**
     * A string specifying desired orientation for ALL spine items. Possible values are
     * rendition-orientation-*, which can be none, landscape, portrait, both or auto
     *
     * Note: Not yet implemented.
     *
     * @property rendition_orientation
     * @type     String
     * @default  auto
     */
    this.rendition_orientation = itemData.rendition_orientation;

    /**
     * A string indicating the type of document layout, either prepaginated or reflowable
     *
     * @property rendition_layout
     * @type     String
     * @default  reflowable
     */
    this.rendition_layout = itemData.rendition_layout;
    
    /**
     * A string specifying how "overflow" content that exceeds the current viewport should
     * be laid out.  Possible values are paginated, scrolled-continuous, scrolled-doc or auto
     *
     * @property rendition_flow
     * @type     String
     * @default  auto
     */
    this.rendition_flow = itemData.rendition_flow;
    
    /**
     * The ID, if any, of the root SMIL element of the media overlay for the document.
     *
     * @property media_overlay_id
     * @type     String
     * @default  None
     */
    this.media_overlay_id = itemData.media_overlay_id;

    /**
     * The mimetype of this specific spine item.
     *
     * @property media_type
     * @type     String
     * @default  None
     */
    this.media_type = itemData.media_type;

    /**
     * The index of this spine item in the parent spine .
     * 
     * @property index
     * @type     String
     * @default  None
     */
    this.index = index;

    /**
     * The object which is the actual spine of which this spineItem is a child.
     *
     * @property spine
     * @type     Models.Spine
     * @default  None
     */
    this.spine = spine;

    validateSpread();

    /**
     * Sets a new page spread and checks its validity
     *
     * @method     setSpread
     * @param      {String} spread  the new page spread 
     */
    this.setSpread = function(spread) {
        this.page_spread = spread;

        validateSpread();
    };

    /* private method (validateSpread) */
    function validateSpread() {

        if(!self.page_spread) {
            return;
        }

        if( self.page_spread != SpineItem.SPREAD_LEFT &&
            self.page_spread != SpineItem.SPREAD_RIGHT &&
            self.page_spread != SpineItem.SPREAD_CENTER ) {

            console.error(self.page_spread + " is not a recognized spread type");
        }
    };

    /**
     * Checks to see if the manifest has specified a spread property of "none"
     *
     * @method     isRenditionSpreadAllowed
     * @return     {Boolean} TRUE if spread=none has NOT been specified, else FALSE
     */
    this.isRenditionSpreadAllowed = function() {
        
        var rendition_spread = self.getRenditionSpread();
        return !rendition_spread || rendition_spread != SpineItem.RENDITION_SPREAD_NONE;
    };

    /**
     * Checks to see if this spineItem explicitly specifies SPREAD_LEFT
     *
     * @method     isLeftPage
     * @return     {Boolean} 
     */
    this.isLeftPage = function() {
        return self.page_spread == SpineItem.SPREAD_LEFT;
    };

    /**
     * Checks to see if this spineItem explicitly specifies SPREAD_RIGHT
     *
     * @method     isRightPage
     * @return     {Boolean} 
     */
    this.isRightPage = function() {
        return self.page_spread == SpineItem.SPREAD_RIGHT;
    };

    /**
     * Checks to see if this spineItem explicitly specifies SPREAD_CENTER
     *
     * @method     isCenterPage
     * @return     {Boolean} 
     */
    this.isCenterPage = function() {
        return self.page_spread == SpineItem.SPREAD_CENTER;
    };

    /**
     * Checks to see if the parent package of this spineIem is
     * reflowable
     *
     * @method     isReflowable
     * @return     {Boolean} 
     */
    this.isReflowable = function() {
        return !self.isFixedLayout();
    };

    /**
     * Checks to see if the parent package of to this spineIem is
     * fixed layout
     *
     * @method     isFixedLayout
     * @return     {Boolean} 
     */
    this.isFixedLayout = function() {
        
        // cannot use isPropertyValueSetForItemOrPackage() here!

        var isLayoutExplicitlyDefined = self.getRenditionLayout();

        if(isLayoutExplicitlyDefined) {

            if (self.rendition_layout)
            {
                if (self.rendition_layout === SpineItem.RENDITION_LAYOUT_PREPAGINATED) return true;
                if (self.rendition_layout === SpineItem.RENDITION_LAYOUT_REFLOWABLE) return false;
            }

            return self.spine.package.isFixedLayout();
        }

        // if image or svg use fixed layout
        return self.media_type.indexOf("image/") >= 0;
    };

    /**
     * Returns a string indicating the type of layout for viewport overflow, 
     * i.e. scrolldoc, scroll-continuous, paginated or auto.  Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned
     *
     * @method     getRenditionFlow
     * @return     {String} 
     */
   this.getRenditionFlow = function() {

        if(self.rendition_flow) {
            return self.rendition_flow;
        }

        return self.spine.package.rendition_flow;
    };
    
    /**
     * Returns the rendition:viewport, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     * Note that this attribute is deprecated in EPUB 3.1
     *
     * @method     getRenditionViewport
     * @return     {Boolean} 
     */
     this.getRenditionViewport = function() {

        if(self.rendition_viewport) {
            return self.rendition_viewport;
        }

        return self.spine.package.rendition_viewport;
    };

    /**
     * Returns the rendition:spread, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     *
     * @method     getRenditionSpread
     * @return     {Boolean} 
     */
    this.getRenditionSpread = function() {

        if(self.rendition_spread) {
            return self.rendition_spread;
        }

        return self.spine.package.rendition_spread;
    };

    /**
     * Returns the rendition:orientation, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     *
     * @method     getRenditionOrientation
     * @return     {Boolean} 
     */
    this.getRenditionOrientation = function() {

        if(self.rendition_orientation) {
            return self.rendition_orientation;
        }

        return self.spine.package.rendition_orientation;
    };

    /**
     * Returns the rendition:layout, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     *
     * @method     getRenditionLayout
     * @return     {String} 
     */
    this.getRenditionLayout = function() {

        if(self.rendition_layout) {
            return self.rendition_layout;
        }

        return self.spine.package.rendition_layout;
    };

    /**
     * Checks to see if the specified property is set in this spineItem and
     * matches the supplied value.  If the property is NOT set in the spineItem
     * then the the package is checked. If not set in either place then 
     * the function returns FALSE.
     *
     * @method     isPropertyValueSetForItemOrPackage
     * @param      {String} propName  The name of the property to be checked
     * @param      {String} propValue The value of the property to be checked
     * @return     {Boolean} 
     */
    function isPropertyValueSetForItemOrPackage(propName, propValue) {

        if(self[propName]) {
            return self[propName] === propValue;
        }

        if(self.spine.package[propName]) {
            return self.spine.package[propName] === propValue;
        }

        return false;
    }

    /**
     * Checks if this spineItem or its parent package has its overflow content 
     * layout specified as scrolled-continuous.
     *
     * @method     isFlowScrolledContinuous
     * @return     {Boolean} 
     */
    this.isFlowScrolledContinuous = function() {

        return isPropertyValueSetForItemOrPackage("rendition_flow", SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS);
    };

    /**
     * Checks if this spineItem or its parent package has its overflow content 
     * layout specified as scrolled-doc.
     *
     * @method     isFlowScrolledDoc
     * @return     {Boolean} 
     */
    this.isFlowScrolledDoc = function() {

        return isPropertyValueSetForItemOrPackage("rendition_flow", SpineItem.RENDITION_FLOW_SCROLLED_DOC);
    };
};

/** 
 * @property RENDITION_LAYOUT_REFLOWABLE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_LAYOUT_REFLOWABLE = "reflowable";

/** 
 * @property RENDITION_LAYOUT_PREPAGINATED 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_LAYOUT_PREPAGINATED = "pre-paginated";

/** 
 * @property RENDITION_ORIENTATION_LANDSCAPE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_ORIENTATION_LANDSCAPE = "landscape";

/** 
 * @property RENDITION_ORIENTATION_PORTRAIT 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_ORIENTATION_PORTRAIT = "portrait";
/** 
 * @property RENDITION_ORIENTATION_AUTO
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_ORIENTATION_AUTO = "auto";

/** 
 * @property SPREAD_LEFT 
 * @type {String}
 * @static 
 */
SpineItem.SPREAD_LEFT = "page-spread-left";

/** 
 * @property SPREAD_RIGHT 
 * @type {String}
 * @static 
 */
SpineItem.SPREAD_RIGHT = "page-spread-right";

/** 
 * @property SPREAD_CENTER 
 * @type {String}
 * @static 
 */
SpineItem.SPREAD_CENTER = "page-spread-center";

/** 
 * @property RENDITION_SPREAD_NONE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_NONE = "none";

/** 
 * @property RENDITION_SPREAD_LANDSCAPE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_LANDSCAPE = "landscape";

/** 
 * @property RENDITION_SPREAD_PORTRAIT 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_PORTRAIT = "portrait";

/** 
 * @property RENDITION_SPREAD_BOTH 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_BOTH = "both";

/** 
 * @property RENDITION_SPREAD_AUTO 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_AUTO = "auto";

/** 
 * @property RENDITION_FLOW_PAGINATED 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_PAGINATED = "paginated";

/** 
 * @property RENDITION_FLOW_SCROLLED_CONTINUOUS 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS = "scrolled-continuous";

/** 
 * @property RENDITION_FLOW_SCROLLED_DOC 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_SCROLLED_DOC = "scrolled-doc";

/** 
 * @property RENDITION_FLOW_AUTO 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_AUTO = "auto";

/**
 * Returns the inversion of the spineItem's SPREAD property. i.e
 * if the page-spread is right it returns LEFT and vice versa.  If 
 * the spread is center then it returns CENTER
 *
 * @method     alternateSpread
 * @return     {String} 
 */
SpineItem.alternateSpread = function(spread) {

    if(spread === SpineItem.SPREAD_LEFT) {
        return SpineItem.SPREAD_RIGHT;
    }

    if(spread === SpineItem.SPREAD_RIGHT) {
        return SpineItem.SPREAD_LEFT;
    }

    return spread;

};
    return SpineItem;
});



//  LauncherOSX
//
//  Created by Boris Schneiderman.
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
define('readium_shared_js/helpers',["./globals", 'underscore', "jquery", "jquerySizes", "./models/spine_item", 'URIjs'], function(Globals, _, $, JQuerySizes, SpineItem, URI) {
    
(function()
{
/* jshint strict: true */
/* jshint -W034 */
    "use strict";
    
    if(window.performance)
    {
        if (window.performance.now)
        {
            return;
        }
        
        var vendors = ['webkitNow', 'mozNow', 'msNow', 'oNow'];
        
        for (var i = 0; i < vendors.length; i++)
        {
            if (vendors[i] in window.performance)
            {
                window.performance.now = window.performance[vendors[i]];
                return;
            }
        }
    }
    else
    {
        window.performance = {};
        
    }
    
    if(Date.now)
    {
        window.performance.now = function()
        {
            return Date.now();
        };
        return;
    }
    
    window.performance.now = function()
    {
        return +(new Date());
    };
})();

var Helpers = {};

/**
 *
 * @param ebookURL URL string, or Blob (possibly File)
 * @returns string representing the file path / name from which the asset referenced by this URL originates
 */
Helpers.getEbookUrlFilePath = function(ebookURL) {
    if (!window.Blob || !window.File) return ebookURL;

    if (ebookURL instanceof File) {
        return ebookURL.name;
    } else if (ebookURL instanceof Blob) {
        return "readium-ebook.epub";
    } else {
        return ebookURL;
    }
};

/**
 * @param initialQuery: (optional) initial query string
 * @returns object (map between URL query parameter names and corresponding decoded / unescaped values)
 */
Helpers.getURLQueryParams = function(initialQuery) {
    var params = {};

    var query = initialQuery || window.location.search;
    if (query && query.length) {
        query = query.substring(1);
        var keyParams = query.split('&');
        for (var x = 0; x < keyParams.length; x++)
        {
            var keyVal = keyParams[x].split('=');
            if (keyVal.length > 1) {
                params[keyVal[0]] = decodeURIComponent(keyVal[1]);
            }
        }
    }

    return params;
};


/**
 * @param initialUrl: string corresponding a URL. If undefined/null, the default window.location is used.
 * @param queryStringOverrides: object that maps query parameter names with values (to be included in the resulting URL, while any other query params in the current window.location are preserved as-is)
 * @returns string corresponding to a URL obtained by concatenating the given URL with the given query parameters
 */
Helpers.buildUrlQueryParameters = function(initialUrl, queryStringOverrides) {
    var uriInstance = new URI(initialUrl || window.location);
    var startingQueryString = uriInstance.search();
    var urlFragment = uriInstance.hash();
    var urlPath = uriInstance.search('').hash('').toString();

    var newQueryString = "";

    for (var overrideKey in queryStringOverrides) {
        if (!queryStringOverrides.hasOwnProperty(overrideKey)) continue;

        if (!queryStringOverrides[overrideKey]) continue;

        var overrideEntry = queryStringOverrides[overrideKey];
        if (_.isString(overrideEntry)) {
            overrideEntry = overrideEntry.trim();
        }

        if (!overrideEntry) continue;

        if (overrideEntry.verbatim) {
            overrideEntry = overrideEntry.value; // grab value from entry as object
        } else {
            overrideEntry = encodeURIComponent(overrideEntry);
        }

        console.debug("URL QUERY PARAM OVERRIDE: " + overrideKey + " = " + overrideEntry);

        newQueryString += (overrideKey + "=" + overrideEntry);
        newQueryString += "&";
    }


    var parsedQueryString = Helpers.getURLQueryParams(startingQueryString);
    for (var parsedKey in parsedQueryString) {
        if (!parsedQueryString.hasOwnProperty(parsedKey)) continue;

        if (!parsedQueryString[parsedKey]) continue;

        if (queryStringOverrides[parsedKey]) continue;

        var parsedValue = parsedQueryString[parsedKey].trim();
        if (!parsedValue) continue;

        console.debug("URL QUERY PARAM PRESERVED: " + parsedKey + " = " + parsedValue);

        newQueryString += (parsedKey + "=" + encodeURIComponent(parsedValue));
        newQueryString += "&";
    }

    // remove trailing "&"
    newQueryString = newQueryString.slice(0, -1);

    return urlPath + "?" + newQueryString + urlFragment;
};


/**
 *
 * @param left
 * @param top
 * @param width
 * @param height
 * @constructor
 */
Helpers.Rect = function (left, top, width, height) {

    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;

    this.right = function () {
        return this.left + this.width;
    };

    this.bottom = function () {
        return this.top + this.height;
    };

    this.isOverlap = function (rect, tolerance) {

        if (tolerance == undefined) {
            tolerance = 0;
        }

        return !(rect.right() < this.left + tolerance ||
        rect.left > this.right() - tolerance ||
        rect.bottom() < this.top + tolerance ||
        rect.top > this.bottom() - tolerance);
    }
};

/**
 *
 * @param $element
 * @returns {Helpers.Rect}
 */
//This method treats multicolumn view as one long column and finds the rectangle of the element in this "long" column
//we are not using jQuery Offset() and width()/height() function because for multicolumn rendition_layout it produces rectangle as a bounding box of element that
// reflows between columns this is inconstant and difficult to analyze .
Helpers.Rect.fromElement = function ($element) {

    var e;
    if (_.isArray($element) || $element instanceof jQuery)
        e = $element[0];
    else
        e = $element;
    // TODODM this is somewhat hacky. Text (range?) elements don't have a position so we have to ask the parent.
    if (e.nodeType === 3) {
        e = $element.parent()[0];
    }


    var offsetLeft = e.offsetLeft;
    var offsetTop = e.offsetTop;
    var offsetWidth = e.offsetWidth;
    var offsetHeight = e.offsetHeight;

    while (e = e.offsetParent) {
        offsetLeft += e.offsetLeft;
        offsetTop += e.offsetTop;
    }

    return new Helpers.Rect(offsetLeft, offsetTop, offsetWidth, offsetHeight);
};
/**
 *
 * @param $epubHtml: The html that is to have font attributes added.
 * @param fontSize: The font size that is to be added to the element at all locations.
 * @param fontObj: The font Object containing at minimum the URL, and fontFamilyName (In fields url and fontFamily) respectively. Pass in null's on the object's fields to signal no font.
 * @param callback: function invoked when "done", which means that if there are asynchronous operations such as font-face loading via injected stylesheets, then the UpdateHtmlFontAttributes() function returns immediately but the caller should wait for the callback function call if fully-loaded font-face *stylesheets* are required on the caller's side (note that the caller's side may still need to detect *actual font loading*, via the FontLoader API or some sort of ResizeSensor to indicate that the updated font-family has been used to render the document). 
 */

Helpers.UpdateHtmlFontAttributes = function ($epubHtml, fontSize, fontObj, callback) {


    var FONT_FAMILY_ID = "readium_font_family_link";

    var docHead = $("head", $epubHtml);
    var link = $("#" + FONT_FAMILY_ID, docHead);

    const NOTHING = 0, ADD = 1, REMOVE = 2; //Types for css font family.
    var changeFontFamily = NOTHING;

    var fontLoadCallback = function() {
            
        var perf = false;

        // TODO: very slow on Firefox!
        // See https://github.com/readium/readium-shared-js/issues/274
        if (perf) var time1 = window.performance.now();



        if (changeFontFamily != NOTHING) {
            var fontFamilyStyle = $("style#readium-fontFamily", docHead);

            if (fontFamilyStyle && fontFamilyStyle[0]) {
                // REMOVE, or ADD (because we remove before re-adding from scratch)
                docHead[0].removeChild(fontFamilyStyle[0]);
            }
            if (changeFontFamily == ADD) {
                var style = $epubHtml[0].ownerDocument.createElement('style');
                style.setAttribute("id", "readium-fontFamily");
                style.appendChild($epubHtml[0].ownerDocument.createTextNode('html * { font-family: "'+fontObj.fontFamily+'" !important; }')); // this technique works for text-align too (e.g. text-align: justify !important;)

                docHead[0].appendChild(style);

                //fontFamilyStyle = $(style);
            }
        }
        
        // The code below does not work because jQuery $element.css() on html.body somehow "resets" the font: CSS directive by removing it entirely (font-family: works with !important, but unfortunately further deep inside the DOM there may be CSS applied with the font: directive, which somehow seems to take precedence! ... as shown in Chrome's developer tools)
        // ...thus why we use the above routine instead, to insert a new head>style element
        // // var doc = $epubHtml[0].ownerDocument;
        // // var body = doc.body;
        // var $body = $("body", $epubHtml);
        // // $body.css({
        // //     "font-size" : fontSize + "%",
        // //     "font-family" : ""
        // // });
        // $body.css("font-family", "");
        // if (changeFontFamily == ADD) {
            
        //     var existing = $body.attr("style");
        //     $body[0].setAttribute("style",
        //         existing + " ; font-family: '" + fontObj.fontFamily + "' !important ;" + " ; font: regular 100% '" + fontObj.fontFamily + "' !important ;");
        // }


        var factor = fontSize / 100;
        var win = $epubHtml[0].ownerDocument.defaultView;
        if (!win) {
            console.log("NIL $epubHtml[0].ownerDocument.defaultView");
            return;
        }

        // TODO: is this a complete list? Is there a better way to do this?
        //https://github.com/readium/readium-shared-js/issues/336
        // Note that font-family is handled differently, using an injected stylesheet with a catch-all selector that pushes an "!important" CSS value in the document's cascade.
        var $textblocks = $('p, div, span, h1, h2, h3, h4, h5, h6, li, blockquote, td, pre, dt, dd, code, a', $epubHtml); // excludes section, body etc.

        // need to do two passes because it is possible to have nested text blocks.
        // If you change the font size of the parent this will then create an inaccurate
        // font size for any children.
        for (var i = 0; i < $textblocks.length; i++) {

            var ele = $textblocks[i];
            
            var fontSizeAttr = ele.getAttribute('data-original-font-size');
            if (fontSizeAttr) {
                // early exit, original values already set.
                break;
            }

            var style = win.getComputedStyle(ele);
            
            var originalFontSize = parseInt(style.fontSize);
            ele.setAttribute('data-original-font-size', originalFontSize);

            var originalLineHeight = parseInt(style.lineHeight);
            // getComputedStyle will not calculate the line-height if the value is 'normal'. In this case parseInt will return NaN
            if (originalLineHeight) {
                ele.setAttribute('data-original-line-height', originalLineHeight);
            }
            
            // var fontFamilyAttr = ele.getAttribute('data-original-font-family');
            // if (!fontFamilyAttr) {
            //     var originalFontFamily = style.fontFamily;
            //     if (originalFontFamily) {
            //         ele.setAttribute('data-original-font-family', originalFontFamily);
            //     }
            // }
        }

        for (var i = 0; i < $textblocks.length; i++) {
            var ele = $textblocks[i];

            // TODO: group the 3x potential $(ele).css() calls below to avoid multiple jQuery style mutations 

            var fontSizeAttr = ele.getAttribute('data-original-font-size');
            var originalFontSize = fontSizeAttr ? Number(fontSizeAttr) : 0;
            if (originalFontSize) {
                $(ele).css("font-size", (originalFontSize * factor) + 'px');
            }

            var lineHeightAttr = ele.getAttribute('data-original-line-height');
            var originalLineHeight = lineHeightAttr ? Number(lineHeightAttr) : 0;
            if (originalLineHeight) {
                $(ele).css("line-height", (originalLineHeight * factor) + 'px');
            }
            
            // var fontFamilyAttr = ele.getAttribute('data-original-font-family');
            // switch(changeFontFamily){
            //     case NOTHING:
            //         break;
            //     case ADD:
            //         $(ele).css("font-family", fontObj.fontFamily);
            //         break;
            //     case REMOVE:
            //         $(ele).css("font-family", fontFamilyAttr);
            //         break;
            // }
        }

        $epubHtml.css("font-size", fontSize + "%");

        
        
        if (perf) {
            var time2 = window.performance.now();
        
            // Firefox: 80+
            // Chrome: 4-10
            // Edge: 15-34
            // IE: 10-15
            // https://readium.firebase.com/?epub=..%2Fepub_content%2Faccessible_epub_3&goto=%7B%22idref%22%3A%22id-id2635343%22%2C%22elementCfi%22%3A%22%2F4%2F2%5Bbuilding_a_better_epub%5D%2F10%2F44%2F6%2C%2F1%3A334%2C%2F1%3A335%22%7D
            
            var diff = time2-time1;
            console.log(diff);
            
            // setTimeout(function(){
            //     alert(diff);
            // }, 2000);
        }

        callback();
    };
    var fontLoadCallback_ = _.once(fontLoadCallback);

    if(fontObj.fontFamily && fontObj.url){
        var dataFontFamily = link.length ? link.attr("data-fontfamily") : undefined;

        if(!link.length){
            changeFontFamily = ADD;

            setTimeout(function(){
                
                link = $("<link/>", {
                    "id" : FONT_FAMILY_ID,
                    "data-fontfamily" : fontObj.fontFamily,
                    "rel" : "stylesheet",
                    "type" : "text/css"
                });
                docHead.append(link);
                    
                link.attr({
                    "href" : fontObj.url
                });
            }, 0);
        }
        else if(dataFontFamily != fontObj.fontFamily){
            changeFontFamily = ADD;
        
            link.attr({
                "data-fontfamily" : fontObj.fontFamily,
                "href" : fontObj.url
            });
        } else {
            changeFontFamily = NOTHING;
        }
    }
    else{
        changeFontFamily = REMOVE;
        if(link.length) link.remove();
    }

    if (changeFontFamily == ADD) {
        // just in case the link@onload does not trigger, we set a timeout
        setTimeout(function(){
            fontLoadCallback_();
        }, 100);
    }
    else { // REMOVE, NOTHING
        fontLoadCallback_();
    }
};


/**
 *
 * @param contentRef
 * @param sourceFileHref
 * @returns {string}
 * @constructor
 */
Helpers.ResolveContentRef = function (contentRef, sourceFileHref) {

    if (!sourceFileHref) {
        return contentRef;
    }

    var sourceParts = sourceFileHref.split("/");
    sourceParts.pop(); //remove source file name

    var pathComponents = contentRef.split("/");

    while (sourceParts.length > 0 && pathComponents[0] === "..") {

        sourceParts.pop();
        pathComponents.splice(0, 1);
    }

    var combined = sourceParts.concat(pathComponents);

    return combined.join("/");

};

/**
 *
 * @param str
 * @param suffix
 * @returns {boolean}
 * @static
 */
Helpers.EndsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 *
 * @param str
 * @param suffix
 * @returns {boolean}
 * @static
 */
Helpers.BeginsWith = function (str, suffix) {

    return str.indexOf(suffix) === 0;
};

/**
 *
 * @param str
 * @param toRemove
 * @returns {string}
 * @static
 */
Helpers.RemoveFromString = function (str, toRemove) {

    var startIx = str.indexOf(toRemove);

    if (startIx == -1) {
        return str;
    }

    return str.substring(0, startIx) + str.substring(startIx + toRemove.length);
};

/**
 *
 * @param margin
 * @param border
 * @param padding
 * @constructor
 */
Helpers.Margins = function (margin, border, padding) {

    this.margin = margin;
    this.border = border;
    this.padding = padding;

    this.left = this.margin.left + this.border.left + this.padding.left;
    this.right = this.margin.right + this.border.right + this.padding.right;
    this.top = this.margin.top + this.border.top + this.padding.top;
    this.bottom = this.margin.bottom + this.border.bottom + this.padding.bottom;

    this.width = function () {
        return this.left + this.right;
    };

    this.height = function () {
        return this.top + this.bottom;
    }
};

/**
 *
 * @param $iframe
 */
Helpers.triggerLayout = function ($iframe) {

    var doc = $iframe[0].contentDocument;

    if (!doc) {
        return;
    }

    var ss = undefined;
    try {
        ss = doc.styleSheets && doc.styleSheets.length ? doc.styleSheets[0] : undefined;
        if (!ss) {
            var style = doc.createElement('style');
            doc.head.appendChild(style);
            style.appendChild(doc.createTextNode(''));
            ss = style.sheet;
        }

        if (ss) {
            var cssRule = 'body:first-child::before {content:\'READIUM\';color: red;font-weight: bold;}';
            if (ss.cssRules) {
                ss.insertRule(cssRule, ss.cssRules.length);
            } else {
                ss.insertRule(cssRule, 0);
            }
        }
    }
    catch (ex) {
        console.error(ex);
    }

    try {
        var el = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
        el.appendChild(doc.createTextNode("*{}"));
        doc.body.appendChild(el);
        doc.body.removeChild(el);

        if (ss) {
            if (ss.cssRules) {
                ss.deleteRule(ss.cssRules.length - 1);
            } else {
                ss.deleteRule(0);
            }
        }
    }
    catch (ex) {
        console.error(ex);
    }

    if (doc.body) {
        var val = doc.body.offsetTop; // triggers layout
    }

};

/**
 *
 * @param $viewport
 * @param spineItem
 * @param settings
 * @returns {boolean}
 */
//Based on https://docs.google.com/spreadsheet/ccc?key=0AoPMUkQhc4wcdDI0anFvWm96N0xRT184ZE96MXFRdFE&usp=drive_web#gid=0 doc
// Returns falsy and truthy
// true and false mean that the synthetic-spread or single-page is "forced" (to be respected whatever the external conditions)
// 1 and 0 mean that the synthetic-spread or single-page is "not forced" (is allowed to be overriden by external conditions, such as optimum column width / text line number of characters, etc.)
Helpers.deduceSyntheticSpread = function ($viewport, spineItem, settings) {

    if (!$viewport || $viewport.length == 0) {
        return 0; // non-forced
    }

    //http://www.idpf.org/epub/fxl/#property-spread-values

    var rendition_spread = spineItem ? spineItem.getRenditionSpread() : undefined;

    if (rendition_spread === SpineItem.RENDITION_SPREAD_NONE) {
        return false; // forced

        //"Reading Systems must not incorporate this spine item in a synthetic spread."
    }

    if (settings.syntheticSpread == "double") {
        return true; // forced
    }
    else if (settings.syntheticSpread == "single") {
        return false; // forced
    }

    if (!spineItem) {
        return 0; // non-forced
    }

    if (rendition_spread === SpineItem.RENDITION_SPREAD_BOTH) {
        return true; // forced

        //"Reading Systems should incorporate this spine item in a synthetic spread regardless of device orientation."
    }

    var orientation = Helpers.getOrientation($viewport);

    if (rendition_spread === SpineItem.RENDITION_SPREAD_LANDSCAPE) {
        return orientation === Globals.Views.ORIENTATION_LANDSCAPE; // forced

        //"Reading Systems should incorporate this spine item in a synthetic spread only when the device is in landscape orientation."
    }

    if (rendition_spread === SpineItem.RENDITION_SPREAD_PORTRAIT) {
        return orientation === Globals.Views.ORIENTATION_PORTRAIT; // forced

        //"Reading Systems should incorporate this spine item in a synthetic spread only when the device is in portrait orientation."
    }

    if (!rendition_spread || rendition_spread === SpineItem.RENDITION_SPREAD_AUTO) {
        // if no spread set in document and user didn't set in in setting we will do double for landscape
        var landscape = orientation === Globals.Views.ORIENTATION_LANDSCAPE;
        return landscape ? 1 : 0; // non-forced

        //"Reading Systems may use synthetic spreads in specific or all device orientations as part of a display area utilization optimization process."
    }

    console.warn("Helpers.deduceSyntheticSpread: spread properties?!");
    return 0; // non-forced
};

/**
 *
 * @param $element
 * @returns {Helpers.Rect}
 */
Helpers.Margins.fromElement = function ($element) {
    return new this($element.margin(), $element.border(), $element.padding());
};

/**
 * @returns {Helpers.Rect}
 */
Helpers.Margins.empty = function () {

    return new this({left: 0, right: 0, top: 0, bottom: 0}, {left: 0, right: 0, top: 0, bottom: 0}, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    });

};

/**
 *
 * @param name
 * @param params
 * @returns {Helpers.loadTemplate.cache}
 */
Helpers.loadTemplate = function (name, params) {
    return Helpers.loadTemplate.cache[name];
};

/**
 *
 * @type {{fixed_book_frame: string, single_page_frame: string, scrolled_book_frame: string, reflowable_book_frame: string, reflowable_book_page_frame: string}}
 */
Helpers.loadTemplate.cache = {
    "fixed_book_frame": '<div id="fixed-book-frame" class="clearfix book-frame fixed-book-frame"></div>',
    "single_page_frame": '<div><div id="scaler"><iframe enable-annotation="enable-annotation" allowfullscreen="allowfullscreen" scrolling="no" class="iframe-fixed"></iframe></div></div>',
    //"single_page_frame" : '<div><iframe scrolling="no" class="iframe-fixed" id="scaler"></iframe></div>',

    "scrolled_book_frame": '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="scrolled-content-frame"></div></div>',
    "reflowable_book_frame": '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"></div>',
    "reflowable_book_page_frame": '<div id="reflowable-content-frame" class="reflowable-content-frame"><iframe enable-annotation="enable-annotation" allowfullscreen="allowfullscreen" scrolling="no" id="epubContentIframe"></iframe></div>'
    /***
     * The `enable-annotation` attribute on an iframe helps detect the content frames for annotating tools such as Hypothesis
     * See here for more details:
     * https://h.readthedocs.io/projects/client/en/latest/publishers/embedding/
     * https://github.com/hypothesis/client/pull/533
     ***/
};

/**
 *
 * @param styles
 * @param $element
 */
Helpers.setStyles = function (styles, $element) {

    var count = styles.length;

    if (!count) {
        return;
    }

    var stylingGlobal = "";
    var stylings = [];
    var elementIsDocument = ($element && $element.createTextNode) ? true : false;

    for (var i = 0; i < count; i++) {
        var style = styles[i];

        if (elementIsDocument) {
            if (!style.selector || style.selector == "" || style.selector == "html" || style.selector == "body" || style.selector == "*") {
                for (var prop in style.declarations) {
                    if (style.declarations.hasOwnProperty(prop)) {
                        // backgroundColor => background-color
                        var prop_ = prop.replace(/[A-Z]/g, function(a) {return '-' + a.toLowerCase()});

                        stylingGlobal += prop_ + ": " + style.declarations[prop] + " !important; ";
                    }
                }
            } else {
                //$(style.selector, $($element.doumentElement)).css(style.declarations);

                var cssProperties = "";

                for (var prop in style.declarations) {
                    if (style.declarations.hasOwnProperty(prop)) {
                        // backgroundColor => background-color
                        var prop_ = prop.replace(/[A-Z]/g, function(a) {return '-' + a.toLowerCase()});
                        cssProperties += prop_ + ": " + style.declarations[prop] + " !important; ";
                    }
                }

                stylings.push({selector: style.selector, cssProps: cssProperties});
            }
            
        } else { // HTML element
            if (style.selector) {
                $(style.selector, $element).css(style.declarations);
            }
            else {
                $element.css(style.declarations);
            }
        }
    }

    if (elementIsDocument) { // HTML document

        var doc = $element;

        var bookStyleElement = $("style#readium-bookStyles", doc.head);

        if (bookStyleElement && bookStyleElement[0]) {
            // we remove before re-adding from scratch
            doc.head.removeChild(bookStyleElement[0]);
        }
        
        var cssStylesheet = "";

        if (stylingGlobal.length > 0) {
            cssStylesheet += ' body, body::after, body::before, body *, body *::after, body *::before { ' + stylingGlobal + ' } ';
        }

        if (stylings.length > 0) {
            for (var i = 0; i < stylings.length; i++) {
                var styling = stylings[i];

                cssStylesheet += ' ' + styling.selector + ' { ' + styling.cssProps + ' } ';
            }
        }

        if (cssStylesheet.length > 0) {

            var styleElement = doc.createElement('style');
            styleElement.setAttribute("id", "readium-bookStyles");
            styleElement.appendChild(doc.createTextNode(cssStylesheet));

            doc.head.appendChild(styleElement);

            //bookStyleElement = $(styleElement);
        }
    }
};

/**
 *
 * @param iframe
 * @returns {boolean}
 */
Helpers.isIframeAlive = function (iframe) {
    var w = undefined;
    var d = undefined;
    try {
        w = iframe.contentWindow;
        d = iframe.contentDocument;
    }
    catch (ex) {
        console.error(ex);
        return false;
    }

    return w && d;
};

/**
 *
 * @param $viewport
 * @returns {Globals.Views.ORIENTATION_LANDSCAPE|Globals.Views.ORIENTATION_PORTRAIT}
 */
Helpers.getOrientation = function ($viewport) {

    var viewportWidth = $viewport.width();
    var viewportHeight = $viewport.height();

    if (!viewportWidth || !viewportHeight) {
        return undefined;
    }

    return viewportWidth >= viewportHeight ? Globals.Views.ORIENTATION_LANDSCAPE : Globals.Views.ORIENTATION_PORTRAIT;
};

/**
 *
 * @param item
 * @param orientation
 * @returns {boolean}
 */
Helpers.isRenditionSpreadPermittedForItem = function (item, orientation) {

    var rendition_spread = item.getRenditionSpread();

    return !rendition_spread
        || rendition_spread == SpineItem.RENDITION_SPREAD_BOTH
        || rendition_spread == SpineItem.RENDITION_SPREAD_AUTO
        || (rendition_spread == SpineItem.RENDITION_SPREAD_LANDSCAPE
        && orientation == Globals.Views.ORIENTATION_LANDSCAPE)
        || (rendition_spread == SpineItem.RENDITION_SPREAD_PORTRAIT
        && orientation == Globals.Views.ORIENTATION_PORTRAIT );
};

Helpers.CSSTransition = function ($el, trans) {

    // does not work!
    //$el.css('transition', trans);

    var css = {};
    // empty '' prefix FIRST!
    _.each(['', '-webkit-', '-moz-', '-ms-'], function (prefix) {
        css[prefix + 'transition'] = prefix + trans;
    });
    $el.css(css);
}

//scale, left, top, angle, origin
Helpers.CSSTransformString = function (options) {
    var enable3D = options.enable3D ? true : false;

    var translate, scale, rotation,
        origin = options.origin;

    if (options.left || options.top) {
        var left = options.left || 0,
            top = options.top || 0;

        translate = enable3D ? ("translate3D(" + left + "px, " + top + "px, 0)") : ("translate(" + left + "px, " + top + "px)");
    }
    if (options.scale) {
        scale = enable3D ? ("scale3D(" + options.scale + ", " + options.scale + ", 0)") : ("scale(" + options.scale + ")");
    }
    if (options.angle) {
        rotation = enable3D ? ("rotate3D(0,0," + options.angle + "deg)") : ("rotate(" + options.angle + "deg)");
    }

    if (!(translate || scale || rotation)) {
        return {};
    }

    var transformString = (translate && scale) ? (translate + " " + scale) : (translate ? translate : scale); // the order is important!
    if (rotation) {
        transformString = transformString + " " + rotation;
        //transformString = rotation + " " + transformString;
    }

    var css = {};
    css['transform'] = transformString;
    css['transform-origin'] = origin ? origin : (enable3D ? '0 0 0' : '0 0');
    return css;
};

Helpers.extendedThrottle = function (startCb, tickCb, endCb, tickRate, waitThreshold, context) {
    if (!tickRate) tickRate = 250;
    if (!waitThreshold) waitThreshold = tickRate;

    var first = true,
        last,
        deferTimer;

    return function () {
        var ctx = context || this,
            now = (Date.now && Date.now()) || new Date().getTime(),
            args = arguments;

        if (!(last && now < last + tickRate)) {
            last = now;
            if (first) {
                startCb.apply(ctx, args);
                first = false;
            } else {
                tickCb.apply(ctx, args);
            }
        }

        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
            last = now;
            first = true;
            endCb.apply(ctx, args);
        }, waitThreshold);
    };
};


//TODO: consider using CSSOM escape() or polyfill
//https://github.com/mathiasbynens/CSS.escape/blob/master/css.escape.js
//http://mathiasbynens.be/notes/css-escapes
/**
 *
 * @param sel
 * @returns {string}
 */
Helpers.escapeJQuerySelector = function (sel) {
    //http://api.jquery.com/category/selectors/
    //!"#$%&'()*+,./:;<=>?@[\]^`{|}~
    // double backslash escape

    if (!sel) return undefined;

    var selector = sel.replace(/([;&,\.\+\*\~\?':"\!\^#$%@\[\]\(\)<=>\|\/\\{}`])/g, '\\$1');

    // if (selector !== sel)
    // {
    //     console.debug("---- SELECTOR ESCAPED");
    //     console.debug("1: " + sel);
    //     console.debug("2: " + selector);
    // }
    // else
    // {
    //     console.debug("---- SELECTOR OKAY: " + sel);
    // }

    return selector;
};

Helpers.polyfillCaretRangeFromPoint = function(document) {
    //Derived from css-regions-polyfill:
    // https://github.com/FremyCompany/css-regions-polyfill/blob/bfbb6445ec2a2a883005ab8801d8463fa54b5701/src/range-extensions.js
    //Copyright (c) 2013 François REMY
    //Copyright (c) 2013 Adobe Systems Inc.
    //Licensed under the Apache License, Version 2.0
    if (!document.caretRangeFromPoint) {
        if (document.caretPositionFromPoint) {
            document.caretRangeFromPoint = function caretRangeFromPoint(x, y) {
                var r = document.createRange();
                var p = document.caretPositionFromPoint(x, y);
                if (!p) return null;
                if (p.offsetNode) {
                    r.setStart(p.offsetNode, p.offset);
                    r.setEnd(p.offsetNode, p.offset);
                }
                return r;
            }
        } else if ((document.body || document.createElement('body')).createTextRange) {
            //
            // we may want to convert TextRange to Range
            //

            //TextRangeUtils, taken from: https://code.google.com/p/ierange/
            //Copyright (c) 2009 Tim Cameron Ryan
            //Released under the MIT/X License
            var TextRangeUtils = {
                convertToDOMRange: function(textRange, document) {
                    var adoptBoundary = function(domRange, textRangeInner, bStart) {
                        // iterate backwards through parent element to find anchor location
                        var cursorNode = document.createElement('a'),
                            cursor = textRangeInner.duplicate();
                        cursor.collapse(bStart);
                        var parent = cursor.parentElement();
                        do {
                            parent.insertBefore(cursorNode, cursorNode.previousSibling);
                            cursor.moveToElementText(cursorNode);
                        } while (cursor.compareEndPoints(bStart ? 'StartToStart' : 'StartToEnd', textRangeInner) > 0 && cursorNode.previousSibling);
                        // when we exceed or meet the cursor, we've found the node
                        if (cursor.compareEndPoints(bStart ? 'StartToStart' : 'StartToEnd', textRangeInner) == -1 && cursorNode.nextSibling) {
                            // data node
                            cursor.setEndPoint(bStart ? 'EndToStart' : 'EndToEnd', textRangeInner);
                            domRange[bStart ? 'setStart' : 'setEnd'](cursorNode.nextSibling, cursor.text.length);
                        } else {
                            // element
                            domRange[bStart ? 'setStartBefore' : 'setEndBefore'](cursorNode);
                        }
                        cursorNode.parentNode.removeChild(cursorNode);
                    };
                    // return a DOM range
                    var domRange = document.createRange();
                    adoptBoundary(domRange, textRange, true);
                    adoptBoundary(domRange, textRange, false);
                    return domRange;
                }
            };

            document.caretRangeFromPoint = function caretRangeFromPoint(x, y) {
                // the accepted number of vertical backtracking, in CSS pixels
                var IYDepth = 40;
                // try to create a text range at the specified location
                var tr = document.body.createTextRange();
                for (var iy = IYDepth; iy; iy = iy - 4) {
                    try {
                        tr.moveToPoint(x, iy + y - IYDepth);
                        return TextRangeUtils.convertToDOMRange(tr, document);
                    } catch (ex) {
                    }
                }
                // if that fails, return the location just after the element located there
                try {
                    var elem = document.elementFromPoint(x - 1, y - 1);
                    var r = document.createRange();
                    r.setStartAfter(elem);
                    return r;
                } catch (ex) {
                    return null;
                }
            }
        }
    }
};

return Helpers;
});

//  LauncherOSX
//
//  Created by Boris Schneiderman.
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

/**
* CFI navigation helper class
*
* @param options Additional settings for NavigationLogic object
*      - paginationInfo            Layout details, used by clientRect-based geometry
*      - visibleContentOffsets     Function that returns offsets. If supplied it is used instead of the inferred offsets
*      - frameDimensions           Function that returns an object with width and height properties. Needs to be set.
*      - $iframe                   Iframe reference, and needs to be set.
* @constructor
*/
define('readium_shared_js/views/cfi_navigation_logic',["jquery", "underscore", "../helpers", 'readium_cfi_js'], function($, _, Helpers, epubCfi) {

var CfiNavigationLogic = function (options) {
    var self = this;
    options = options || {};

    var _DEBUG = ReadiumSDK.DEBUG_MODE;
    if (_DEBUG) {
        window.top._DEBUG_visibleTextRangeOffsetsRuns = window.top._DEBUG_visibleTextRangeOffsetsRuns || [];
    }

    this.getRootElement = function () {
        if (!options.$iframe) {
            return null;
        }

        return options.$iframe[0].contentDocument.documentElement;
    };

    this.getBodyElement = function () {
        var rootDocument = this.getRootDocument();
        if (rootDocument && rootDocument.body) {
            return rootDocument.body;
        } else {
            // In SVG documents the root element can be considered the body.
            return this.getRootElement();
        }
    };

    this.getClassBlacklist = function () {
        return options.classBlacklist || [];
    };

    this.getIdBlacklist = function () {
        return options.idBlacklist || [];
    };

    this.getElementBlacklist = function () {
        return options.elementBlacklist || [];
    };

    this.getRootDocument = function () {
        if (!options.$iframe) {
            return null;
        }

        return options.$iframe[0].contentDocument;
    };

    function createRange() {
        return self.getRootDocument().createRange();
    }

    function createRangeFromNode(textnode) {
        var documentRange = createRange();
        documentRange.selectNodeContents(textnode);
        return documentRange;
    }

    function getNodeClientRect(node) {
            var range = createRange();
            range.selectNode(node);
            return normalizeRectangle(range.getBoundingClientRect(), 0, 0);
        }

    function getNodeContentsClientRect(node) {
            var range = createRange();
            range.selectNodeContents(node);
            return normalizeRectangle(range.getBoundingClientRect(), 0, 0);
        }

    function getNodeRangeClientRect(startNode, startOffset, endNode, endOffset) {
        var range = createRange();
        range.setStart(startNode, startOffset ? startOffset : 0);
        if (endNode.nodeType === Node.ELEMENT_NODE) {
            range.setEnd(endNode, endOffset ? endOffset : endNode.childNodes.length);
        } else if (endNode.nodeType === Node.TEXT_NODE) {
            range.setEnd(endNode, endOffset ? endOffset : 0);
        }

        // Webkit has a bug where collapsed ranges provide an empty rect with getBoundingClientRect()
        // https://bugs.webkit.org/show_bug.cgi?id=138949
        // Thankfully it implements getClientRects() properly...
        // A collapsed text range may still have geometry!
        if (range.collapsed) {
            return normalizeRectangle(range.getClientRects()[0], 0, 0);
        } else {
            return normalizeRectangle(range.getBoundingClientRect(), 0, 0);
        }
    }

    function getNodeClientRectList(node, visibleContentOffsets) {
        visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();

        var range = createRange();
        range.selectNode(node);
        return getRangeClientRectList(range, visibleContentOffsets);
    }

    function getRangeClientRectList(range, visibleContentOffsets) {
        visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();

        //noinspection JSUnresolvedFunction

        return _.map(range.getClientRects(), function (rect) {

            return normalizeRectangle(rect, visibleContentOffsets.left, visibleContentOffsets.top);
        });
    }

    function getFrameDimensions() {
        if (options.frameDimensionsGetter) {
            return options.frameDimensionsGetter();
        }

        console.error('CfiNavigationLogic: No frame dimensions specified!');
        return null;
    }

    function getCaretRangeFromPoint(x, y, document) {
        document = document || self.getRootDocument();
        Helpers.polyfillCaretRangeFromPoint(document); //only polyfills once, no-op afterwards
        return document.caretRangeFromPoint(x, y);
    }

    function isPaginatedView() {
        return !!options.paginationInfo;
    }

    /**
     * @private
     * Checks whether or not pages are rendered right-to-left
     *
     * @returns {boolean}
     */
    function isPageProgressionRightToLeft() {
        return options.paginationInfo && !!options.paginationInfo.rightToLeft;
    }

    /**
     * @private
     * Checks whether or not pages are rendered with vertical writing mode
     *
     * @returns {boolean}
     */
    function isVerticalWritingMode() {
        return options.paginationInfo && !!options.paginationInfo.isVerticalWritingMode;
    }


    /**
     * @private
     * Checks whether or not a (fully adjusted) rectangle is visible
     *
     * @param {Object} rect
     * @param {boolean} [ignorePartiallyVisible]
     * @param {Object} [frameDimensions]
     * @returns {boolean}
     */
    function isRectVisible(rect, ignorePartiallyVisible, frameDimensions) {

        frameDimensions = frameDimensions || getFrameDimensions();

        //Text nodes without printable text dont have client rectangles
        if (!rect) {
            return false;
        }
        //Sometimes we get client rects that are "empty" and aren't supposed to be visible
        if (rect.left == 0 && rect.right == 0 && rect.top == 0 && rect.bottom == 0) {
            return false;
        }

        if (isPaginatedView() && !isVerticalWritingMode()) {
            return (rect.left >= 0 && rect.left < frameDimensions.width) ||
                (!ignorePartiallyVisible && rect.left < 0 && rect.right > 0);
        } else {
            return (rect.top >= 0 && rect.top < frameDimensions.height) ||
                (!ignorePartiallyVisible && rect.top < 0 && rect.bottom > 0);
        }

    }

        /**
         * @private
         * Retrieves _current_ full width of a column (including its gap)
         *
         * @returns {number} Full width of a column in pixels
         */
        function getColumnFullWidth() {

            if (!options.paginationInfo || isVerticalWritingMode()) {
                return options.$iframe.width();
            }

            return options.paginationInfo.columnWidth + options.paginationInfo.columnGap;
        }

        /**
         * @private
         *
         * Retrieves _current_ offset of a viewport
         * (relational to the beginning of the chapter)
         *
         * @returns {Object}
         */
        function getVisibleContentOffsets() {
            if (options.visibleContentOffsetsGetter) {
                return options.visibleContentOffsetsGetter();
            }

            if (isVerticalWritingMode() && options.paginationOffsetsGetter) {
                return options.paginationOffsetsGetter();
            }

            return {
                top: 0,
                left: 0
            };
        }

        function getPaginationOffsets() {
            if (options.paginationOffsetsGetter) {
                return options.paginationOffsetsGetter();
            }

            return {
                top: 0,
                left: 0
            };
        }

        /**
         * New (rectangle-based) algorithm, useful in multi-column layouts
         *
         * Note: the second param (props) is ignored intentionally
         * (no need to use those in normalization)
         *
         * @param {jQuery} $element
         * @param {boolean} shouldCalculateVisibilityPercentage
         * @param {Object} [visibleContentOffsets]
         * @param {Object} [frameDimensions]
         * @returns {number|null}
         *      0 for non-visible elements,
         *      0 < n <= 100 for visible elements
         *      (will just give 100, if `shouldCalculateVisibilityPercentage` => false)
         *      null for elements with display:none
         */
        function checkVisibilityByRectangles($element, shouldCalculateVisibilityPercentage, visibleContentOffsets, frameDimensions) {
            visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();
            frameDimensions = frameDimensions || getFrameDimensions();

            var clientRectangles = getNormalizedRectangles($element, visibleContentOffsets);
            if (clientRectangles.length === 0) { // elements with display:none, etc.
                return null;
            }

            var visibilityPercentage = 0;

            if (clientRectangles.length === 1) {
                var adjustedRect = clientRectangles[0];

                if (isPaginatedView()) {
                    if (adjustedRect.bottom > frameDimensions.height || adjustedRect.top < 0) {
                        // because of webkit inconsistency, that single rectangle should be adjusted
                        // until it hits the end OR will be based on the FIRST column that is visible
                        adjustRectangle(adjustedRect, true, frameDimensions);
                    }
                }

                if (isRectVisible(adjustedRect, false, frameDimensions)) {
                    if (shouldCalculateVisibilityPercentage && adjustedRect.top < 0) {
                        visibilityPercentage =
                            Math.floor(100 * (adjustedRect.height + adjustedRect.top) / adjustedRect.height);
                    } else if (shouldCalculateVisibilityPercentage && adjustedRect.bottom > frameDimensions.height) {
                        visibilityPercentage =
                            Math.floor(100 * (frameDimensions.height - adjustedRect.top) / adjustedRect.height);
                    } else if (shouldCalculateVisibilityPercentage && adjustedRect.left < 0 && adjustedRect.right > 0) {
                        visibilityPercentage =
                            Math.floor(100 * adjustedRect.right / adjustedRect.width);
                    } else if (shouldCalculateVisibilityPercentage && adjustedRect.left < 0 && adjustedRect.right > 0) {
                        visibilityPercentage =
                            Math.floor(100 * adjustedRect.right / adjustedRect.width);
                    } else {
                        visibilityPercentage = 100;
                    }
                }
            } else {
                // for an element split between several CSS columns,z
                // both Firefox and IE produce as many client rectangles;
                // each of those should be checked
                for (var i = 0, l = clientRectangles.length; i < l; ++i) {
                    if (isRectVisible(clientRectangles[i], false, frameDimensions)) {
                        visibilityPercentage = shouldCalculateVisibilityPercentage
                            ? measureVisibilityPercentageByRectangles(clientRectangles, i)
                            : 100;
                        break;
                    }
                }
            }

            return visibilityPercentage;
        }

        /**
         * Finds a page index (0-based) delta for a specific element.
         * Calculations are based on rectangles retrieved with getClientRects() method.
         *
         * @param {jQuery} $element
         * @returns {number|null}
         */
        function findPageIndexDeltaByRectangles($element) {

            var visibleContentOffsets = getVisibleContentOffsets();

            var clientRectangles = getNormalizedRectangles($element, visibleContentOffsets);
            if (clientRectangles.length === 0) { // elements with display:none, etc.
                return null;
            }

            return calculatePageIndexDeltaByRectangles(clientRectangles);
        }

        /**
         * @private
         * Calculate a page index (0-based) delta for given client rectangles.
         *
         * @param {object[]} clientRectangles
         * @param {object} [frameDimensions]
         * @param {number} [columnFullWidth]
         * @returns {number|null}
         */
        function calculatePageIndexDeltaByRectangles(clientRectangles, frameDimensions, columnFullWidth) {
            var isRtl = isPageProgressionRightToLeft();
            var isVwm = isVerticalWritingMode();
            columnFullWidth = columnFullWidth || getColumnFullWidth();
            frameDimensions = frameDimensions || getFrameDimensions();

            var firstRectangle = _.first(clientRectangles);
            if (clientRectangles.length === 1) {
                adjustRectangle(firstRectangle, false, frameDimensions, columnFullWidth, isRtl, isVwm);
            }

            var pageIndex;

            if (isVwm) {
                var topOffset = firstRectangle.top;
                pageIndex = Math.round(topOffset / frameDimensions.height);
            } else {
                var leftOffset = firstRectangle.left;
                if (isRtl) {
                    leftOffset = (columnFullWidth * (options.paginationInfo ? options.paginationInfo.visibleColumnCount : 1)) - leftOffset;
                }
                pageIndex = Math.round(leftOffset / columnFullWidth);
            }

            return pageIndex;
        }

        /**
         * Finds a page index (0-based) delta for a specific client rectangle.
         * Calculations are based on viewport dimensions, offsets, and rectangle coordinates
         *
         * @param {ClientRect} clientRectangle
         * @param {Object} [visibleContentOffsets]
         * @param {Object} [frameDimensions]
         * @returns {number|null}
         */
        function findPageIndexDeltaBySingleRectangle(clientRectangle, visibleContentOffsets, frameDimensions) {
            visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();
            frameDimensions = frameDimensions || getFrameDimensions();

            var normalizedRectangle = normalizeRectangle(
                clientRectangle, visibleContentOffsets.left, visibleContentOffsets.top);

            return calculatePageIndexDeltaByRectangles([normalizedRectangle], frameDimensions);
        }

        /**
         * @private
         * Calculates the visibility offset percentage based on ClientRect dimensions
         *
         * @param {Array} clientRectangles (should already be normalized)
         * @param {number} firstVisibleRectIndex
         * @returns {number} - visibility percentage (0 < n <= 100)
         */
        function measureVisibilityPercentageByRectangles(clientRectangles, firstVisibleRectIndex) {

            var heightTotal = 0;
            var heightVisible = 0;

            if (clientRectangles.length > 1) {
                _.each(clientRectangles, function (rect, index) {
                    heightTotal += rect.height;
                    if (index >= firstVisibleRectIndex) {
                        // in this case, all the rectangles after the first visible
                        // should be counted as visible
                        heightVisible += rect.height;
                    }
                });
            }
            else {
                // should already be normalized and adjusted
                heightTotal = clientRectangles[0].height;
                heightVisible = clientRectangles[0].height - Math.max(
                    0, -clientRectangles[0].top);
            }
            return heightVisible === heightTotal
                ? 100 // trivial case: element is 100% visible
                : Math.floor(100 * heightVisible / heightTotal);
        }

        /**
         * @private
         * Retrieves the position of $element in multi-column layout
         *
         * @param {jQuery} $el
         * @param {Object} [visibleContentOffsets]
         * @returns {Object[]}
         */
        function getNormalizedRectangles($el, visibleContentOffsets) {

            visibleContentOffsets = visibleContentOffsets || {};
            var leftOffset = visibleContentOffsets.left || 0;
            var topOffset = visibleContentOffsets.top || 0;

            var isTextNode = ($el[0].nodeType === Node.TEXT_NODE);
            var clientRectList;

            if (isTextNode) {
                var range = createRange();
                range.selectNode($el[0]);
                //noinspection JSUnresolvedFunction
                clientRectList = range.getClientRects();
            } else {
                //noinspection JSUnresolvedFunction
                clientRectList = $el[0].getClientRects();
            }

            // all the separate rectangles (for detecting position of the element
            // split between several columns)
            var clientRectangles = [];
            for (var i = 0, l = clientRectList.length; i < l; ++i) {
                if (clientRectList[i].height > 0 || clientRectList.length === 1) {
                    // Firefox sometimes gets it wrong,
                    // adding literally empty (height = 0) client rectangle preceding the real one,
                    // that empty client rectanle shouldn't be retrieved
                    clientRectangles.push(
                        normalizeRectangle(clientRectList[i], leftOffset, topOffset));
                }
            }

            return clientRectangles;
        }

        function getNormalizedBoundingRect($el, visibleContentOffsets) {
            visibleContentOffsets = visibleContentOffsets || {};
            var leftOffset = visibleContentOffsets.left || 0;
            var topOffset = visibleContentOffsets.top || 0;

            var isTextNode = ($el[0].nodeType === Node.TEXT_NODE);
            var boundingClientRect;

            if (isTextNode) {
                var range = createRange();
                range.selectNode($el[0]);
                boundingClientRect = range.getBoundingClientRect();
            } else {
                boundingClientRect = $el[0].getBoundingClientRect();
            }

            // union of all rectangles wrapping the element
            return normalizeRectangle(boundingClientRect, leftOffset, topOffset);
        }

        /**
         * @private
         * Converts TextRectangle object into a plain object,
         * taking content offsets (=scrolls, position shifts etc.) into account
         *
         * @param {Object} textRect
         * @param {number} leftOffset
         * @param {number} topOffset
         * @returns {Object}
         */
        function normalizeRectangle(textRect, leftOffset, topOffset) {

            var plainRectObject = {
                left: textRect.left,
                right: textRect.right,
                top: textRect.top,
                bottom: textRect.bottom,
                width: textRect.right - textRect.left,
                height: textRect.bottom - textRect.top
            };
            leftOffset = leftOffset || 0;
            topOffset = topOffset || 0;
            offsetRectangle(plainRectObject, leftOffset, topOffset);
            return plainRectObject;
        }

        /**
         * @private
         * Offsets plain object (which represents a TextRectangle).
         *
         * @param {Object} rect
         * @param {number} leftOffset
         * @param {number} topOffset
         */
        function offsetRectangle(rect, leftOffset, topOffset) {

            rect.left += leftOffset;
            rect.right += leftOffset;
            rect.top += topOffset;
            rect.bottom += topOffset;
        }

        /**
         * @private
         *
         * When element is spilled over two or more columns,
         * most of the time Webkit-based browsers
         * still assign a single clientRectangle to it, setting its `top` property to negative value
         * (so it looks like it's rendered based on the second column)
         * Alas, sometimes they decide to continue the leftmost column - from _below_ its real height.
         * In this case, `bottom` property is actually greater than element's height and had to be adjusted accordingly.
         *
         * Ugh.
         *
         * @param {Object} rect
         * @param {boolean} [shouldLookForFirstVisibleColumn]
         *      If set, there'll be two-phase adjustment
         *      (to align a rectangle with a viewport)
         * @param {Object} [frameDimensions]
         * @param {number} [columnFullWidth]
         * @param {boolean} [isRtl]
         * @param {boolean} [isVwm]               isVerticalWritingMode
         */
        function adjustRectangle(rect, shouldLookForFirstVisibleColumn, frameDimensions, columnFullWidth, isRtl, isVwm) {

            frameDimensions = frameDimensions || getFrameDimensions();
            columnFullWidth = columnFullWidth || getColumnFullWidth();
            isRtl = isRtl || isPageProgressionRightToLeft();
            isVwm = isVwm || isVerticalWritingMode();

            // Rectangle adjustment is not needed in VWM since it does not deal with columns
            if (isVwm) {
                return;
            }

            if (isRtl) {
                columnFullWidth *= -1; // horizontal shifts are reverted in RTL mode
            }

            // first we go left/right (rebasing onto the very first column available)
            while (rect.top < 0) {
                offsetRectangle(rect, -columnFullWidth, frameDimensions.height);
            }

            // ... then, if necessary (for visibility offset checks),
            // each column is tried again (now in reverse order)
            // the loop will be stopped when the column is aligned with a viewport
            // (i.e., is the first visible one).
            if (shouldLookForFirstVisibleColumn) {
                while (rect.bottom >= frameDimensions.height) {
                    if (isRectVisible(rect, false, frameDimensions)) {
                        break;
                    }
                    offsetRectangle(rect, columnFullWidth, -frameDimensions.height);
                }
            }
        }

        this.getCfiForElement = function (element) {

            var cfi = EPUBcfi.Generator.generateElementCFIComponent(element,
                this.getClassBlacklist(),
                this.getElementBlacklist(),
                this.getIdBlacklist());

            if (cfi[0] == "!") {
                cfi = cfi.substring(1);
            }
            return cfi;
        };

        this.getVisibleCfiFromPoint = function (x, y, precisePoint) {
            var document = self.getRootDocument();
            var firstVisibleCaretRange = getCaretRangeFromPoint(x, y, document);
            var elementFromPoint = document.elementFromPoint(x, y);
            var invalidElementFromPoint = !elementFromPoint || elementFromPoint === document.documentElement;

            if (precisePoint) {
                if (!elementFromPoint || invalidElementFromPoint) {
                    return null;
                }
                var testRect = getNodeContentsClientRect(elementFromPoint);
                if (!isRectVisible(testRect, false)) {
                    return null;
                }
                if ((x < testRect.left || x > testRect.right) || (y < testRect.top || y > testRect.bottom)) {
                    return null;
                }
            }

            if (!firstVisibleCaretRange) {
                if (invalidElementFromPoint) {
                    console.error("Could not generate CFI no visible element on page");
                    return null;
                }
                firstVisibleCaretRange = createRange();
                firstVisibleCaretRange.selectNode(elementFromPoint);
            }

            var range = firstVisibleCaretRange;
            var cfi;
            //if we get a text node we need to get an approximate range for the first visible character offsets.
            var node = range.startContainer;
            var startOffset, endOffset;
            if (node.nodeType === Node.TEXT_NODE) {
                if (precisePoint && node.parentNode !== elementFromPoint) {
                    return null;
                }
                if (node.length === 1 && range.startOffset === 1) {
                    startOffset = 0;
                    endOffset = 1;
                } else if (range.startOffset === node.length) {
                    startOffset = range.startOffset - 1;
                    endOffset = range.startOffset;
                } else {
                    startOffset = range.startOffset;
                    endOffset = range.startOffset + 1;
                }
                var wrappedRange = {
                    startContainer: node,
                    endContainer: node,
                    startOffset: startOffset,
                    endOffset: endOffset,
                    commonAncestorContainer: range.commonAncestorContainer
                };

                if (_DEBUG) {
                    drawDebugOverlayFromDomRange(wrappedRange);
                }

                cfi = generateCfiFromDomRange(wrappedRange);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                node =
                    range.startContainer.childNodes[range.startOffset] ||
                    range.startContainer.childNodes[0] ||
                    range.startContainer;
                if (precisePoint && node !== elementFromPoint) {
                    return null;
                }

                if (node.nodeType !== Node.ELEMENT_NODE) {
                    cfi = generateCfiFromDomRange(range);
                } else {
                    cfi = self.getCfiForElement(node);
                }
            } else {
                if (precisePoint && node !== elementFromPoint) {
                    return null;
                }

                cfi = self.getCfiForElement(elementFromPoint);
            }

            //This should not happen but if it does print some output, just in case
            if (cfi && cfi.indexOf('NaN') !== -1) {
                console.log('Did not generate a valid CFI:' + cfi);
                return undefined;
            }
            return cfi;
        };

        this.getRangeCfiFromPoints = function (startX, startY, endX, endY) {
            var document = self.getRootDocument();
            var start = getCaretRangeFromPoint(startX, startY, document),
                end = getCaretRangeFromPoint(endX, endY, document),
                range = createRange();
            range.setStart(start.startContainer, start.startOffset);
            range.setEnd(end.startContainer, end.startOffset);
            // if we're looking at a text node create a nice range (n, n+1)
            if (start.startContainer === start.endContainer && start.startContainer.nodeType === Node.TEXT_NODE && end.startContainer.length > end.startOffset + 1) {
                range.setEnd(end.startContainer, end.startOffset + 1);
            }
            return generateCfiFromDomRange(range);
        };

        function determineSplit(range, division) {
            var percent = division / 100;
            return Math.round((range.endOffset - range.startOffset ) * percent);
        }

        function splitRange(range, division) {
            if (range.endOffset - range.startOffset === 1) {
                return [range];
            }
            var length = determineSplit(range, division);
            var textNode = range.startContainer;
            var leftNodeRange = range.cloneRange();
            leftNodeRange.setStart(textNode, range.startOffset);
            leftNodeRange.setEnd(textNode, range.startOffset + length);
            var rightNodeRange = range.cloneRange();
            rightNodeRange.setStart(textNode, range.startOffset + length);
            rightNodeRange.setEnd(textNode, range.endOffset);

            return [leftNodeRange, rightNodeRange];

        }

        // create Range from target node and search for visibleOutput Range
        function getVisibleTextRangeOffsets(textNode, pickerFunc, visibleContentOffsets, frameDimensions) {
            visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();

            var nodeRange = createRangeFromNode(textNode);
            var nodeClientRects = getRangeClientRectList(nodeRange, visibleContentOffsets);
            var splitRatio = deterministicSplit(nodeClientRects, pickerFunc([0, 1]));
            return getTextRangeOffset(splitRange(nodeRange, splitRatio), visibleContentOffsets,
                pickerFunc([0, 1]), splitRatio,
                function (rect) {
                    return (isVerticalWritingMode() ? rect.height : rect.width) && isRectVisible(rect, false, frameDimensions);
                });
        }

        function deterministicSplit(rectList, directionBit) {
            var split = 0;
            // Calculate total cumulative Height for both visible portions and invisible portions and find the split
            var visibleRects = _.filter(rectList, function (rect) {
                return (isVerticalWritingMode() ? rect.height : rect.width) && isRectVisible(rect, false, getFrameDimensions());
            });
            var visibleRectHeight = calculateCumulativeHeight(visibleRects);
            var invisibleRectHeight = totalHeight - visibleRectHeight;
            var totalHeight = calculateCumulativeHeight(rectList);

            if (visibleRectHeight === totalHeight) {
                // either all visible or split
                // heuristic: slight bias to increase likelihood of hits
                return directionBit ? 55 : 45;
            } else {
                split = 100 * (visibleRectHeight / totalHeight);
                return invisibleRectHeight > visibleRectHeight ? split + 5 : split - 5;
            }
        }

        function rectTopHash (rectList) {
            // sort the rectangles by top value
            var sortedList = rectList.sort(function (a, b) {
                return a.top < b.top;
            });
            var lineMap = [];
            _.each(sortedList, function (rect) {
                var key = rect.top;
                if (!lineMap[key]) {
                    lineMap[key] = [rect.height];
                } else {
                    var currentLine = lineMap[key];
                    currentLine.push(rect.height);
                    lineMap[key] = currentLine;
                }
            });
        }

        function calculateCumulativeHeight (rectList) {
            var lineMap = rectTopHash(rectList);
            var height = 0;
            _.each(lineMap, function (line) {
                height = height + Math.max.apply(null, line);
            });
            return height;
        }

        function getTextRangeOffset(startingSet, visibleContentOffsets, directionBit, splitRatio, filterFunc) {
            var runCount = 0;
            var currRange = startingSet;
            //begin iterative binary search, each iteration will check Range length and visibility
            while (currRange.length !== 1) {
                runCount++;
                var currTextNodeFragments = getRangeClientRectList(currRange[directionBit], visibleContentOffsets);
                if (hasVisibleFragments(currTextNodeFragments, filterFunc)) {
                    currRange = splitRange(currRange[directionBit], splitRatio);
                }
                // No visible fragment Look in other half
                else {
                    currRange = splitRange(currRange[directionBit ? 0 : 1], splitRatio);
                }
            }
            if (_DEBUG) {
                console.debug('getVisibleTextRangeOffsets:getTextRangeOffset:runCount', runCount);
                window.top._DEBUG_visibleTextRangeOffsetsRuns.push(runCount);
            }
            var resultRange = currRange[0];
            if (resultRange) {
                resultRange.collapse(!directionBit);
            }
            return resultRange;
        }

        function hasVisibleFragments(fragments, filterFunc) {
            var visibleFragments = _.filter(fragments, filterFunc);
            return !!visibleFragments.length;
        }

        function findVisibleLeafNodeCfi(visibleLeafNode, pickerFunc, visibleContentOffsets, frameDimensions) {
            if (!visibleLeafNode) {
                return null;
            }

            var element = visibleLeafNode.element;
            var textNode = visibleLeafNode.textNode;

            //if a valid text node is found, try to generate a CFI with range offsets
            if (textNode && isValidTextNode(textNode)) {
                var visibleRange = getVisibleTextRangeOffsets(textNode, pickerFunc, visibleContentOffsets, frameDimensions);
                if (!visibleRange) {
                    if (_DEBUG) console.warn("findVisibleLeafNodeCfi: failed to find text range offset");
                    return null;
                }
                return generateCfiFromDomRange(visibleRange);
            } else {
                //if not then generate a CFI for the element
                return self.getCfiForElement(element);
            }
        }

        function getLastVisibleTextRangeCfi(visibleContentOffsets, frameDimensions) {
            var visibleLeafNode = self.findLastVisibleElement(visibleContentOffsets, frameDimensions);
            return findVisibleLeafNodeCfi(visibleLeafNode, _.last, visibleContentOffsets, frameDimensions);
        }

        function getFirstVisibleTextRangeCfi(visibleContentOffsets, frameDimensions) {
            var visibleLeafNode = self.findFirstVisibleElement(visibleContentOffsets, frameDimensions);
            return findVisibleLeafNodeCfi(visibleLeafNode, _.first, visibleContentOffsets, frameDimensions);
        }

        this.getFirstVisibleCfi = function (visibleContentOffsets, frameDimensions) {
            return getFirstVisibleTextRangeCfi(visibleContentOffsets, frameDimensions);
        };

        this.getLastVisibleCfi = function (visibleContentOffsets, frameDimensions) {
            return getLastVisibleTextRangeCfi(visibleContentOffsets, frameDimensions);
        };

        function generateCfiFromDomRange(range) {
            if (range.collapsed && range.startContainer.nodeType === Node.TEXT_NODE) {
                return EPUBcfi.generateCharacterOffsetCFIComponent(
                    range.startContainer, range.startOffset,
                    ['cfi-marker'], [], ["MathJax_Message", "MathJax_SVG_Hidden"]);
            } else if (range.collapsed) {
                return self.getCfiForElement(range.startContainer);
            } else {
                return EPUBcfi.generateRangeComponent(
                    range.startContainer, range.startOffset,
                    range.endContainer, range.endOffset,
                    self.getClassBlacklist(), self.getElementBlacklist(), self.getIdBlacklist());
            }
        }

        this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
            var range = createRange();

            if (!rangeCfi2) {
                if (self.isRangeCfi(rangeCfi)) {
                    var rangeInfo = self.getNodeRangeInfoFromCfi(rangeCfi);
                    range.setStart(rangeInfo.startInfo.node, rangeInfo.startInfo.offset);
                    range.setEnd(rangeInfo.endInfo.node, rangeInfo.endInfo.offset);
                } else {
                    var element = self.getElementByCfi(rangeCfi,
                        this.getClassBlacklist(), this.getElementBlacklist(), this.getIdBlacklist())[0];
                    range.selectNode(element);
                }
            } else {
                if (self.isRangeCfi(rangeCfi)) {
                    var rangeInfo1 = self.getNodeRangeInfoFromCfi(rangeCfi);
                    range.setStart(rangeInfo1.startInfo.node, rangeInfo1.startInfo.offset);
                } else {
                    var startElement = self.getElementByCfi(rangeCfi,
                        this.getClassBlacklist(), this.getElementBlacklist(), this.getIdBlacklist())[0];
                    range.setStart(startElement, 0);
                }

                if (self.isRangeCfi(rangeCfi2)) {
                    var rangeInfo2 = self.getNodeRangeInfoFromCfi(rangeCfi2);
                    if (inclusive) {
                        range.setEnd(rangeInfo2.endInfo.node, rangeInfo2.endInfo.offset);
                    } else {
                        range.setEnd(rangeInfo2.startInfo.node, rangeInfo2.startInfo.offset);
                    }
                } else {
                    var endElement = self.getElementByCfi(rangeCfi2,
                        this.getClassBlacklist(), this.getElementBlacklist(), this.getIdBlacklist())[0];
                    range.setEnd(endElement, endElement.childNodes.length);
                }
            }
            return range;
        };

        this.getRangeCfiFromDomRange = function (domRange) {
            return generateCfiFromDomRange(domRange);
        };

        function getWrappedCfi(partialCfi) {
            return "epubcfi(/99!" + partialCfi + ")";
        }

        this.isRangeCfi = function (partialCfi) {
            return _isRangeCfi(partialCfi) || _hasTextTerminus(partialCfi);
        };

        function _isRangeCfi(partialCfi) {
            return EPUBcfi.Interpreter.isRangeCfi(getWrappedCfi(partialCfi));
        }

        function _hasTextTerminus(partialCfi) {
            return EPUBcfi.Interpreter.hasTextTerminus(getWrappedCfi(partialCfi));
        }

        this.getPageIndexDeltaForCfi = function (partialCfi, classBlacklist, elementBlacklist, idBlacklist) {

            if (this.isRangeCfi(partialCfi)) {
                //if given a range cfi the exact page index needs to be calculated by getting node info from the range cfi
                var nodeRangeInfoFromCfi = this.getNodeRangeInfoFromCfi(partialCfi);
                //the page index is calculated from the node's client rectangle
                return findPageIndexDeltaBySingleRectangle(nodeRangeInfoFromCfi.clientRect);
            }

            var $element = getElementByPartialCfi(partialCfi, classBlacklist, elementBlacklist, idBlacklist);

            if (!$element) {
                return -1;
            }

            return this.getPageIndexDeltaForElement($element);
        };

        function getElementByPartialCfi(cfi, classBlacklist, elementBlacklist, idBlacklist) {

            var contentDoc = self.getRootDocument();

            var wrappedCfi = getWrappedCfi(cfi);

            try {
                //noinspection JSUnresolvedVariable
                var $element = EPUBcfi.getTargetElement(wrappedCfi, contentDoc, classBlacklist, elementBlacklist, idBlacklist);

            } catch (ex) {
                //EPUBcfi.Interpreter can throw a SyntaxError
            }

            if (!$element || $element.length == 0) {
                console.log("Can't find element for CFI: " + cfi);
                return undefined;
            }

            return $element;
        }

        this.getElementFromPoint = function (x, y) {

            var document = self.getRootDocument();
            return document.elementFromPoint(x, y);
        };

        this.getNodeRangeInfoFromCfi = function (cfi) {
            var contentDoc = self.getRootDocument();

            var wrappedCfi = getWrappedCfi(cfi);
            if (_isRangeCfi(cfi)) {

                try {
                    //noinspection JSUnresolvedVariable
                    var nodeResult = EPUBcfi.Interpreter.getRangeTargetElements(wrappedCfi, contentDoc,
                        this.getClassBlacklist(),
                        this.getElementBlacklist(),
                        this.getIdBlacklist());

                    if (_DEBUG) {
                        console.log(nodeResult);
                    }
                } catch (ex) {
                    //EPUBcfi.Interpreter can throw a SyntaxError
                }

                if (!nodeResult) {
                    console.log("Can't find nodes for range CFI: " + cfi);
                    return undefined;
                }

                var startRangeInfo = {node: nodeResult.startElement, offset: nodeResult.startOffset};
                var endRangeInfo = {node: nodeResult.endElement, offset: nodeResult.endOffset};
                var nodeRangeClientRect =
                    startRangeInfo && endRangeInfo ?
                        getNodeRangeClientRect(
                            startRangeInfo.node,
                            startRangeInfo.offset,
                            endRangeInfo.node,
                            endRangeInfo.offset)
                        : null;

                if (_DEBUG) {
                    console.log(nodeRangeClientRect);
                    addOverlayRect(nodeRangeClientRect, 'purple', contentDoc);
                }

                return {startInfo: startRangeInfo, endInfo: endRangeInfo, clientRect: nodeRangeClientRect};
            } else if (_hasTextTerminus(cfi)) {

                try {
                    //noinspection JSUnresolvedVariable
                    var textTerminusResult = EPUBcfi.Interpreter.getTextTerminusInfo(wrappedCfi, contentDoc,
                        this.getClassBlacklist(),
                        this.getElementBlacklist(),
                        this.getIdBlacklist());

                    if (_DEBUG) {
                        console.log(textTerminusResult);
                    }
                } catch (ex) {
                    //EPUBcfi.Interpreter can throw a SyntaxError
                }

                if (!textTerminusResult) {
                    console.log("Can't find node for text term CFI: " + cfi);
                    return undefined;
                }

                var textTermRangeInfo = {node: textTerminusResult.textNode, offset: textTerminusResult.textOffset};
                var textTermClientRect =
                    getNodeRangeClientRect(
                        textTermRangeInfo.node,
                        textTermRangeInfo.offset,
                        textTermRangeInfo.node,
                        textTermRangeInfo.offset);
                if (_DEBUG) {
                    console.log(textTermClientRect);
                    addOverlayRect(textTermClientRect, 'purple', contentDoc);
                }

                return {startInfo: textTermRangeInfo, endInfo: textTermRangeInfo, clientRect: textTermClientRect};
            } else {
                var $element = self.getElementByCfi(cfi,
                    this.getClassBlacklist(),
                    this.getElementBlacklist(),
                    this.getIdBlacklist());

                var visibleContentOffsets = getVisibleContentOffsets();
                return {
                    startInfo: null,
                    endInfo: null,
                    clientRect: getNormalizedBoundingRect($element, visibleContentOffsets)
                };
            }
        };

        this.isNodeFromRangeCfiVisible = function (cfi) {
            var nodeRangeInfo = this.getNodeRangeInfoFromCfi(cfi);
            if (nodeRangeInfo) {
                return isRectVisible(nodeRangeInfo.clientRect, false);
            } else {
                return undefined;
            }
        };

        this.getNearestCfiFromElement = function (element) {
            var collapseToStart;
            var chosenNode;
            var isTextNode;

            var siblingTextNodesAndSelf = _.filter(element.parentNode.childNodes, function (n) {
                return n === element || isValidTextNode(n);
            });

            var indexOfSelf = siblingTextNodesAndSelf.indexOf(element);
            var nearestNode = siblingTextNodesAndSelf[indexOfSelf - 1];
            if (!nearestNode) {
                nearestNode = siblingTextNodesAndSelf[indexOfSelf + 1];
                collapseToStart = true;
            }
            if (!nearestNode) {
                nearestNode = _.last(this.getLeafNodeElements($(element.previousElementSibling)));
                if (!nearestNode) {
                    collapseToStart = true;
                    nearestNode = _.first(this.getLeafNodeElements($(element.nextElementSibling)));
                }
            }

            // Prioritize text node use
            if (isValidTextNode(nearestNode)) {
                chosenNode = nearestNode;
                isTextNode = true;
            } else if (isElementNode(nearestNode)) {
                chosenNode = nearestNode;
            } else if (isElementNode(element.previousElementSibling)) {
                chosenNode = element.previousElementSibling;
            } else if (isElementNode(element.nextElementSibling)) {
                chosenNode = element.nextElementSibling;
            } else {
                chosenNode = element.parentNode;
            }

            if (isTextNode) {
                var range = chosenNode.ownerDocument.createRange();
                range.selectNodeContents(chosenNode);
                range.collapse(collapseToStart);
                return this.getRangeCfiFromDomRange(range);
            } else {
                return this.getCfiForElement(chosenNode);
            }
        };

        this.getElementByCfi = function (partialCfi, classBlacklist, elementBlacklist, idBlacklist) {
            return getElementByPartialCfi(partialCfi, classBlacklist, elementBlacklist, idBlacklist);
        };

        this.getPageIndexDeltaForElement = function ($element) {

            // first try to get delta by rectangles
            var pageIndex = findPageIndexDeltaByRectangles($element);

            // for hidden elements (e.g., page breaks) there are no rectangles
            if (pageIndex === null) {

                // get CFI of the nearest (to hidden) element, and then get CFI's element
                var nearestVisibleElement = this.getElementByCfi(this.getNearestCfiFromElement($element[0]));

                // find page index by rectangles again, for the nearest element
                return findPageIndexDeltaByRectangles(nearestVisibleElement);
            }
            return pageIndex;
        };

        this.getElementById = function (id) {

            var contentDoc = this.getRootDocument();

            var $element = $(contentDoc.getElementById(id));
            //$("#" + Helpers.escapeJQuerySelector(id), contentDoc);

            if ($element.length == 0) {
                return undefined;
            }

            return $element;
        };

        this.getPageIndexDeltaForElementId = function (id) {

            var $element = this.getElementById(id);
            if (!$element) {
                return -1;
            }

            return this.getPageIndexDeltaForElement($element);
        };

        // returns raw DOM element (not $ jQuery-wrapped)
        this.getFirstVisibleMediaOverlayElement = function (visibleContentOffsets) {
            var $root = $(this.getBodyElement());
            if (!$root || !$root.length || !$root[0]) return undefined;

            var that = this;

            var firstPartial = undefined;

            function traverseArray(arr) {
                if (!arr || !arr.length) return undefined;

                for (var i = 0, count = arr.length; i < count; i++) {
                    var item = arr[i];
                    if (!item) continue;

                    var $item = $(item);

                    if ($item.data("mediaOverlayData")) {
                        var visible = that.getElementVisibility($item, visibleContentOffsets);
                        if (visible) {
                            if (!firstPartial) firstPartial = item;

                            if (visible == 100) return item;
                        }
                    }
                    else {
                        var elem = traverseArray(item.children);
                        if (elem) return elem;
                    }
                }

                return undefined;
            }

            var el = traverseArray([$root[0]]);
            if (!el) el = firstPartial;
            return el;

            // var $elements = this.getMediaOverlayElements($root);
            // return this.getVisibleElements($elements, visibleContentOffsets);
        };

        this.getElementVisibility = function ($element, visibleContentOffsets) {
            return checkVisibilityByRectangles($element, true, visibleContentOffsets);
        };


        this.isElementVisible = this.getElementVisibility;

        this.getVisibleElementsWithFilter = function (visibleContentOffsets, filterFunction) {
            var $elements = this.getElementsWithFilter($(this.getBodyElement()), filterFunction);
            return this.getVisibleElements($elements, visibleContentOffsets);
        };

        this.getAllElementsWithFilter = function (filterFunction) {
            return this.getElementsWithFilter($(this.getBodyElement()), filterFunction);
        };

        this.getAllVisibleElementsWithSelector = function (selector, visibleContentOffset) {
            var elements = $(selector, this.getRootElement());
            var $newElements = [];
            $.each(elements, function () {
                $newElements.push($(this));
            });
            return this.getVisibleElements($newElements, visibleContentOffset);
        };

        this.getVisibleElements = function ($elements, visibleContentOffsets, frameDimensions) {

            var visibleElements = [];

            _.each($elements, function ($node) {
                var isTextNode = ($node[0].nodeType === Node.TEXT_NODE);
                var $element = isTextNode ? $node.parent() : $node;
                var visibilityPercentage = checkVisibilityByRectangles(
                    $node, true, visibleContentOffsets, frameDimensions);

                if (visibilityPercentage) {
                    visibleElements.push({
                        element: $element[0], // DOM Element is pushed
                        textNode: isTextNode ? $node[0] : null,
                        percentVisible: visibilityPercentage

                    });
                }
            });

            return visibleElements;
        };

        this.getVisibleLeafNodes = function (visibleContentOffsets, frameDimensions) {

            if (_cacheEnabled) {
                var cacheKey = (options.paginationInfo || {}).currentSpreadIndex || 0;
                var fromCache = _cache.visibleLeafNodes.get(cacheKey);
                if (fromCache) {
                    return fromCache;
                }
            }

            var $elements = this.getLeafNodeElements($(this.getBodyElement()));

            var visibleElements = this.getVisibleElements($elements, visibleContentOffsets, frameDimensions);
            if (_cacheEnabled) {
                _cache.visibleLeafNodes.set(cacheKey, visibleElements);
            }

            return visibleElements;
        };

        function getBaseCfiSelectedByFunc(pickerFunc) {
            var $elements = self.getLeafNodeElements($(self.getBodyElement()));
            var $selectedNode = pickerFunc($elements);
            var collapseToStart = pickerFunc([true, false]);
            var range = createRange();
            range.selectNodeContents($selectedNode[0]);
            range.collapse(collapseToStart);
            return generateCfiFromDomRange(range);
        }

        this.getStartCfi = function () {
            return getBaseCfiSelectedByFunc(_.first);
        };


        this.getEndCfi = function () {
            return getBaseCfiSelectedByFunc(_.last);
        };

        this.getElementsWithFilter = function ($root, filterFunction) {

            var $elements = [];

            function traverseCollection(elements) {

                if (elements == undefined) return;

                for (var i = 0, count = elements.length; i < count; i++) {

                    var $element = $(elements[i]);

                    if (filterFunction($element)) {
                        $elements.push($element);
                    }
                    else {
                        traverseCollection($element[0].children);
                    }

                }
            }

            traverseCollection([$root[0]]);

            return $elements;
        };

        function isElementBlacklisted(element) {
            var classAttribute = element.className;
            // check for SVGAnimatedString
            if (classAttribute && typeof classAttribute.animVal !== "undefined") {
                classAttribute = classAttribute.animVal;
            } else if (classAttribute && typeof classAttribute.baseVal !== "undefined") {
                classAttribute = classAttribute.baseVal;
            }
            var classList = classAttribute ? classAttribute.split(' ') : [];
            var id = element.id;

            var classBlacklist = self.getClassBlacklist();
            if (classList.length === 1 && _.contains(classBlacklist, classList[0])) {
                return true;
            } else if (classList.length && _.intersection(classBlacklist, classList).length) {
                return true;
            }

            if (id && id.length && _.contains(self.getIdBlacklist(), id)) {
                return true;
            }

            if (_.contains(self.getElementBlacklist(), element.tagName.toLowerCase())) {
                return true;
            }

            return false;
        }

        this.getLeafNodeElements = function ($root) {

            if (_cacheEnabled) {
                var fromCache = _cache.leafNodeElements.get($root);
                if (fromCache) {
                    return fromCache;
                }
            }

            //noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            var nodeIterator = document.createNodeIterator(
                $root[0],
                NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                function () {
                    //noinspection JSUnresolvedVariable
                    return NodeFilter.FILTER_ACCEPT;
                },
                false
            );

            var $leafNodeElements = [];

            var node;
            while ((node = nodeIterator.nextNode())) {
                var isLeafNode = node.nodeType === Node.ELEMENT_NODE && !node.childElementCount && !isValidTextNodeContent(node.textContent);
                if (isLeafNode || isValidTextNode(node)){
                    var element = (node.nodeType === Node.TEXT_NODE) ? node.parentNode : node;
                    if (!isElementBlacklisted(element)) {
                        $leafNodeElements.push($(node));
                    }
                }
            }

            if (_cacheEnabled) {
                _cache.leafNodeElements.set($root, $leafNodeElements);
            }
            return $leafNodeElements;
        };

        function isElementNode(node) {
            if (!node) {
                return false;
            }
            else {
                return node.nodeType === Node.ELEMENT_NODE;
            }
        }

        function isValidTextNode(node) {
            if (!node) {
                return false;
            }
            if (node.nodeType === Node.TEXT_NODE) {

                return isValidTextNodeContent(node.nodeValue);
            }

            return false;

        }

        function isValidTextNodeContent(text) {
            // Heuristic to find a text node with actual text
            // If we don't do this, we may get a reference to a node that doesn't get rendered
            // (such as for example a node that has tab character and a bunch of spaces)
            // this is would be bad! ask me why.
            return !!text.trim().length;
        }

        this.getElements = function (selector) {
            if (!selector) {
                return $(this.getRootElement()).children();
            }
            return $(selector, this.getRootElement());
        };

        this.getElement = function (selector) {

            var $element = this.getElements(selector);

            if ($element.length > 0) {
                return $element;
            }

            return undefined;
        };

        function Cache() {
            var that = this;

            //true = survives invalidation
            var props = {
                leafNodeElements: true,
                visibleLeafNodes: false
            };

            _.each(props, function (val, key) {
                that[key] = new Map();
            });

            this._invalidate = function () {
                _.each(props, function (val, key) {
                    if (!val) {
                        that[key] = new Map();
                    }
                });
            }
        }

        var _cache = new Cache();

        var _cacheEnabled = false;

        this.invalidateCache = function () {
            _cache._invalidate();
        };

        //if (_DEBUG) {

        var $debugOverlays = [];

        //used for visual debug atm
        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
        }

        //used for visual debug atm
        function addOverlayRect(rects, color, doc) {
            var random = getRandomColor();
            if (!(rects instanceof Array)) {
                rects = [rects];
            }
            for (var i = 0; i != rects.length; i++) {
                var rect = rects[i];
                var overlayDiv = doc.createElement('div');
                overlayDiv.style.position = 'absolute';
                $(overlayDiv).css('z-index', '1000');
                $(overlayDiv).css('pointer-events', 'none');
                $(overlayDiv).css('opacity', '0.4');
                overlayDiv.style.border = '1px solid white';
                if (!color && !random) {
                    overlayDiv.style.background = 'purple';
                } else if (random && !color) {
                    overlayDiv.style.background = random;
                } else {
                    if (color === true) {
                        color = 'red';
                    }
                    overlayDiv.style.border = '1px dashed ' + color;
                    overlayDiv.style.background = 'yellow';
                }

                overlayDiv.style.margin = overlayDiv.style.padding = '0';
                overlayDiv.style.top = (rect.top ) + 'px';
                overlayDiv.style.left = (rect.left ) + 'px';
                // we want rect.width to be the border width, so content width is 2px less.
                overlayDiv.style.width = (rect.width - 2) + 'px';
                overlayDiv.style.height = (rect.height - 2) + 'px';
                doc.documentElement.appendChild(overlayDiv);
                $debugOverlays.push($(overlayDiv));
            }
        }

        function drawDebugOverlayFromRect(rect) {
            var offsets = getPaginationOffsets();

            addOverlayRect({
                left: rect.left + offsets.left,
                top: rect.top + offsets.top,
                width: rect.width,
                height: rect.height
            }, true, self.getRootDocument());
        }

        function drawDebugOverlayFromDomRange(range) {
            var rect = getNodeRangeClientRect(
                range.startContainer,
                range.startOffset,
                range.endContainer,
                range.endOffset);
            drawDebugOverlayFromRect(rect);
            return rect;
        }

        function drawDebugOverlayFromNode(node) {
            drawDebugOverlayFromRect(getNodeClientRect(node));
        }

        function clearDebugOverlays() {
            _.each($debugOverlays, function ($el) {
                $el.remove();
            });
            $debugOverlays = [];
        }

        ReadiumSDK._DEBUG_CfiNavigationLogic = {
            clearDebugOverlays: clearDebugOverlays,
            drawDebugOverlayFromRect: drawDebugOverlayFromRect,
            drawDebugOverlayFromDomRange: drawDebugOverlayFromDomRange,
            drawDebugOverlayFromNode: drawDebugOverlayFromNode,
            debugVisibleCfis: function () {
                console.log(JSON.stringify(ReadiumSDK.reader.getPaginationInfo().openPages));

                var cfi1 = ReadiumSDK.reader.getFirstVisibleCfi();
                var range1 = ReadiumSDK.reader.getDomRangeFromRangeCfi(cfi1);
                console.log(cfi1, range1, drawDebugOverlayFromDomRange(range1));

                var cfi2 = ReadiumSDK.reader.getLastVisibleCfi();
                var range2 = ReadiumSDK.reader.getDomRangeFromRangeCfi(cfi2);
                console.log(cfi2, range2, drawDebugOverlayFromDomRange(range2));
            },
            visibleTextRangeOffsetsRunsAvg: function () {
                var arr = window.top._DEBUG_visibleTextRangeOffsetsRuns;
                return arr.reduce(function (a, b) {
                    return a + b;
                }) / arr.length;
            }
        };

        //
        // }

        this.findFirstVisibleElement = function (visibleContentOffsets, frameDimensions) {

            var bodyElement = this.getBodyElement();

            if (!bodyElement) {
                return null;
            }

            var firstVisibleElement;
            var percentVisible = 0;
            var textNode;

            var treeWalker = document.createTreeWalker(
                bodyElement,
                NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE && isElementBlacklisted(node))
                        return NodeFilter.FILTER_REJECT;

                    if (node.nodeType === Node.TEXT_NODE && !isValidTextNode(node))
                        return NodeFilter.FILTER_REJECT;

                    var visibilityResult = checkVisibilityByRectangles($(node), true, visibleContentOffsets, frameDimensions);
                    return visibilityResult ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                },
                false
                );

            while (treeWalker.nextNode()) {
                var node = treeWalker.currentNode;

                if (node.nodeType === Node.TEXT_NODE) {
                    firstVisibleElement = node.parentNode;
                    textNode = node;
                    percentVisible = 100; // not really used, assume this value unless otherwise
                    break;
                }

                var hasChildElements = false;
                var hasChildTextNodes = false;

                for (var i = node.childNodes.length - 1; i >= 0; i--) {
                    var childNode = node.childNodes[i];
                    if (childNode.nodeType === Node.ELEMENT_NODE) {
                        hasChildElements = true;
                        break;
                    }
                    if (childNode.nodeType === Node.TEXT_NODE)
                        hasChildTextNodes = true;
                }

                // potentially stop tree traversal when first element hit with no child element nodes
                if (!hasChildElements && hasChildTextNodes) {
                    for (var i=node.childNodes.length-1; i>=0; i--) {
                        var childNode = node.childNodes[i];
                        if (childNode.nodeType === Node.TEXT_NODE && isValidTextNode(childNode)) {
                            var visibilityResult = checkVisibilityByRectangles($(childNode), true, visibleContentOffsets, frameDimensions);
                            if (visibilityResult) {
                                firstVisibleElement = node;
                                textNode = childNode;
                                percentVisible = visibilityResult;
                                break;
                            }
                        }
                    }
                } else if (!hasChildElements) {
                    firstVisibleElement = node;
                    percentVisible = 100;
                    textNode = null;
                    break;
                }
            }

            if (!firstVisibleElement) {
                return null;
            }
            return {
                element: firstVisibleElement,
                textNode: textNode,
                percentVisible: percentVisible
            };
        };

        this.findLastVisibleElement = function (visibleContentOffsets, frameDimensions) {

            var bodyElement = this.getBodyElement();

            if (!bodyElement) {
                return null;
            }

            var firstVisibleElement;
            var percentVisible = 0;
            var textNode;

            var treeWalker = document.createTreeWalker(
                bodyElement,
                NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE && isElementBlacklisted(node))
                        return NodeFilter.FILTER_REJECT;

                    if (node.nodeType === Node.TEXT_NODE && !isValidTextNode(node))
                        return NodeFilter.FILTER_REJECT;

                    var visibilityResult = checkVisibilityByRectangles($(node), true, visibleContentOffsets, frameDimensions);
                    return visibilityResult ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                },
                false
                );

            while (treeWalker.lastChild()) { }

            do {
                var node = treeWalker.currentNode;

                if (node.nodeType === Node.TEXT_NODE) {
                    firstVisibleElement = node.parentNode;
                    textNode = node;
                    percentVisible = 100; // not really used, assume this value unless otherwise
                    break;
                }

                var hasChildElements = false;
                var hasChildTextNodes = false;

                for (var i = node.childNodes.length - 1; i >= 0; i--) {
                    var childNode = node.childNodes[i];
                    if (childNode.nodeType === Node.ELEMENT_NODE) {
                        hasChildElements = true;
                        break;
                    }
                    if (childNode.nodeType === Node.TEXT_NODE)
                        hasChildTextNodes = true;
                }

                // potentially stop tree traversal when first element hit with no child element nodes
                if (!hasChildElements && hasChildTextNodes) {
                    for (var i=node.childNodes.length-1; i>=0; i--) {
                        var childNode = node.childNodes[i];
                        if (childNode.nodeType === Node.TEXT_NODE && isValidTextNode(childNode)) {
                            var visibilityResult = checkVisibilityByRectangles($(childNode), true, visibleContentOffsets, frameDimensions);
                            if (visibilityResult) {
                                firstVisibleElement = node;
                                textNode = childNode;
                                percentVisible = visibilityResult;
                                break;
                            }
                        }
                    }
                } else if (!hasChildElements) {
                    firstVisibleElement = node;
                    percentVisible = 100;
                    textNode = null;
                    break;
                }
            } while (treeWalker.previousNode());

            if (!firstVisibleElement) {
                return null;
            }
            return {
                element: firstVisibleElement,
                textNode: textNode,
                percentVisible: percentVisible
            };
        };

    };
return CfiNavigationLogic;
});

//  Created by Boris Schneiderman.
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

define('readium_shared_js/models/viewer_settings',[], function() {
/**
 *
 * @param settingsData
 * @constructor
 */
var ViewerSettings = function(settingsData) {

    var self = this;

    /** Set to "auto"
     *
     * @property syntheticSpread
     * @type 
     */

    this.syntheticSpread = "auto";

    /** 
     *
     * @property fontSelection
     * @type number
     */
    
    this.fontSelection = 0;

    /** 
     *
     * @property fontSize
     * @type number
     */

    this.fontSize = 100;

    /** 
     *
     * @property columnGap
     * @type number
     */

    this.columnGap = 20;
    
    /** 
     *
     * @property columnMaxWidth
     * @type number
     */

    this.columnMaxWidth = 700;

    /** 
     *
     * @property columnMinWidth
     * @type number
     */

    this.columnMinWidth = 400;

    /** 
     *
     * @property mediaOverlaysPreservePlaybackWhenScroll
     * @type bool
     */

    this.mediaOverlaysPreservePlaybackWhenScroll = false;

    /** 
     *
     * @property mediaOverlaysSkipSkippables
     * @type bool
     */

    this.mediaOverlaysSkipSkippables = false;

    /** 
     *
     * @property mediaOverlaysEscapables
     * @type bool
     */

    this.mediaOverlaysEscapeEscapables = true;

    /** 
     *
     * @property mediaOverlaysSkippables
     * @type array
     */

    this.mediaOverlaysSkippables = [];
    
    /** 
     *
     * @property mediaOverlaysEscapables
     * @type array
     */

    this.mediaOverlaysEscapables = [];

    /** 
     *
     * @property mediaOverlaysEnableClick
     * @type bool
     */
    
    this.mediaOverlaysEnableClick = true;

    /** 
     *
     * @property mediaOverlaysRate
     * @type number
     */

    this.mediaOverlaysRate = 1;

    /** 
     *
     * @property mediaOverlaysVolume
     * @type number
     */

    this.mediaOverlaysVolume = 100;

    /** 
     *
     * @property mediaOverlaysSynchronizationGranularity
     * @type string
     */
    
    this.mediaOverlaysSynchronizationGranularity = "";

    /** 
     *
     * @property mediaOverlaysAutomaticPageTurn
     * @type bool
     */    

    this.mediaOverlaysAutomaticPageTurn = true;

    /** 
     *
     * @property enableGPUHardwareAccelerationCSS3D
     * @type bool
     */    


    this.enableGPUHardwareAccelerationCSS3D = false;

    // -1 ==> disable
    // [0...n] ==> index of transition in pre-defined array
    
    /** 
     *
     * @property pageTransition
     * @type number
     */        

    this.pageTransition = -1;
 
    /** 
     *
     * @property scroll
     * @type string
     */        

    this.scroll = "auto";

    /**
     * Builds an array
     *
     * @method     buildArray
     * @param      {string} str
     * @return     {array} retArr
     */

    function buildArray(str)
    {
        var retArr = [];
        var arr = str.split(/[\s,;]+/); //','
        for (var i = 0; i < arr.length; i++)
        {
            var item = arr[i].trim();
            if (item !== "")
            {
                retArr.push(item);
            }
        }
        return retArr;
    }

    /**
     * Maps the properties to the settings
     *
     * @method     mapProperty
     * @param      {string} propName
     * @param      settingsData
     * @param      functionToApply
     */

    function mapProperty(propName, settingsData, functionToApply) {

        if(settingsData[propName] !== undefined) {
            if(functionToApply) {

                self[propName] = functionToApply(settingsData[propName]);
            }
            else {
                self[propName] = settingsData[propName];
            }
        }

    }

    /**
     * Updates the settings' new values
     *
     * @method     update
     * @param      settingsData
     */

    this.update = function(settingsData) {

        mapProperty("columnGap", settingsData);
        mapProperty("columnMaxWidth", settingsData);
        mapProperty("columnMinWidth", settingsData);
        mapProperty("fontSize", settingsData);
        mapProperty("fontSelection", settingsData);
        mapProperty("mediaOverlaysPreservePlaybackWhenScroll", settingsData);
        mapProperty("mediaOverlaysSkipSkippables", settingsData);
        mapProperty("mediaOverlaysEscapeEscapables", settingsData);
        mapProperty("mediaOverlaysSkippables", settingsData, buildArray);
        mapProperty("mediaOverlaysEscapables", settingsData, buildArray);
        mapProperty("mediaOverlaysEnableClick", settingsData);
        mapProperty("mediaOverlaysRate", settingsData);
        mapProperty("mediaOverlaysVolume", settingsData);
        mapProperty("mediaOverlaysSynchronizationGranularity", settingsData);
        mapProperty("mediaOverlaysAutomaticPageTurn", settingsData);
        mapProperty("scroll", settingsData);
        mapProperty("syntheticSpread", settingsData);
        mapProperty("pageTransition", settingsData);
        mapProperty("enableGPUHardwareAccelerationCSS3D", settingsData);
    };

    this.update(settingsData);
};
    return ViewerSettings;
});



/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('ResizeSensor',factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.ResizeSensor = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {

    // Make sure it does not throw in a SSR (Server Side Rendering) situation
    if (typeof window === "undefined") {
        return null;
    }
    // Only used for the dirty checking, so the event callback count is limited to max 1 call per fps per sensor.
    // In combination with the event based resize sensor this saves cpu time, because the sensor is too fast and
    // would generate too many unnecessary events.
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (fn) {
            return window.setTimeout(fn, 20);
        };

    /**
     * Iterate over each of the provided element(s).
     *
     * @param {HTMLElement|HTMLElement[]} elements
     * @param {Function}                  callback
     */
    function forEachElement(elements, callback){
        var elementsType = Object.prototype.toString.call(elements);
        var isCollectionTyped = ('[object Array]' === elementsType
            || ('[object NodeList]' === elementsType)
            || ('[object HTMLCollection]' === elementsType)
            || ('[object Object]' === elementsType)
            || ('undefined' !== typeof jQuery && elements instanceof jQuery) //jquery
            || ('undefined' !== typeof Elements && elements instanceof Elements) //mootools
        );
        var i = 0, j = elements.length;
        if (isCollectionTyped) {
            for (; i < j; i++) {
                callback(elements[i]);
            }
        } else {
            callback(elements);
        }
    }

    /**
    * Get element size
    * @param {HTMLElement} element
    * @returns {Object} {width, height}
    */
    function getElementSize(element) {
        if (!element.getBoundingClientRect) {
            return {
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        }

        var rect = element.getBoundingClientRect();
        return {
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        }
    }

    /**
     * Class for dimension change detection.
     *
     * @param {Element|Element[]|Elements|jQuery} element
     * @param {Function} callback
     *
     * @constructor
     */
    var ResizeSensor = function(element, callback) {
        /**
         *
         * @constructor
         */
        function EventQueue() {
            var q = [];
            this.add = function(ev) {
                q.push(ev);
            };

            var i, j;
            this.call = function() {
                for (i = 0, j = q.length; i < j; i++) {
                    q[i].call();
                }
            };

            this.remove = function(ev) {
                var newQueue = [];
                for(i = 0, j = q.length; i < j; i++) {
                    if(q[i] !== ev) newQueue.push(q[i]);
                }
                q = newQueue;
            };

            this.length = function() {
                return q.length;
            }
        }

        /**
         *
         * @param {HTMLElement} element
         * @param {Function}    resized
         */
        function attachResizeEvent(element, resized) {
            if (!element) return;
            if (element.resizedAttached) {
                element.resizedAttached.add(resized);
                return;
            }

            element.resizedAttached = new EventQueue();
            element.resizedAttached.add(resized);

            element.resizeSensor = document.createElement('div');
            element.resizeSensor.dir = 'ltr';
            element.resizeSensor.className = 'resize-sensor';
            var style = 'position: absolute; left: -10px; top: -10px; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
            var styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';

            element.resizeSensor.style.cssText = style;
            element.resizeSensor.innerHTML =
                '<div class="resize-sensor-expand" style="' + style + '">' +
                    '<div style="' + styleChild + '" class="resize-sensor-inner"></div>' +
                '</div>' +
                '<div class="resize-sensor-shrink" style="' + style + '">' +
                    '<div style="' + styleChild + ' width: 200%; height: 200%" class="resize-sensor-inner"></div>' +
                '</div>';
            element.appendChild(element.resizeSensor);

            var position = window.getComputedStyle(element).getPropertyValue('position');
            if ('absolute' !== position && 'relative' !== position && 'fixed' !== position) {
                element.style.position = 'relative';
            }

            var expand = element.resizeSensor.childNodes[0];
            var expandChild = expand.childNodes[0];
            var shrink = element.resizeSensor.childNodes[1];
            var dirty, rafId, newWidth, newHeight;
            var size = getElementSize(element);
            var lastWidth = size.width;
            var lastHeight = size.height;

            var reset = function() {
                //set display to block, necessary otherwise hidden elements won't ever work
                var invisible = element.offsetWidth === 0 && element.offsetHeight === 0;

                if (invisible) {
                    var saveDisplay = element.style.display;
                    element.style.display = 'block';
                }

                expandChild.style.width = '100000px';
                expandChild.style.height = '100000px';

                expand.scrollLeft = 100000;
                expand.scrollTop = 100000;

                shrink.scrollLeft = 100000;
                shrink.scrollTop = 100000;

                if (invisible) {
                    element.style.display = saveDisplay;
                }
            };
            element.resizeSensor.resetSensor = reset;

            var onResized = function() {
                rafId = 0;

                if (!dirty) return;

                lastWidth = newWidth;
                lastHeight = newHeight;

                if (element.resizedAttached) {
                    element.resizedAttached.call();
                }
            };

            var onScroll = function() {
                var size = getElementSize(element);
                var newWidth = size.width;
                var newHeight = size.height;
                dirty = newWidth != lastWidth || newHeight != lastHeight;

                if (dirty && !rafId) {
                    rafId = requestAnimationFrame(onResized);
                }

                reset();
            };

            var addEvent = function(el, name, cb) {
                if (el.attachEvent) {
                    el.attachEvent('on' + name, cb);
                } else {
                    el.addEventListener(name, cb);
                }
            };

            addEvent(expand, 'scroll', onScroll);
            addEvent(shrink, 'scroll', onScroll);
            
			// Fix for custom Elements
			requestAnimationFrame(reset);
        }

        forEachElement(element, function(elem){
            attachResizeEvent(elem, callback);
        });

        this.detach = function(ev) {
            ResizeSensor.detach(element, ev);
        };

        this.reset = function() {
            element.resizeSensor.resetSensor();
        };
    };

    ResizeSensor.reset = function(element, ev) {
        forEachElement(element, function(elem){
            elem.resizeSensor.resetSensor();
        });
    };

    ResizeSensor.detach = function(element, ev) {
        forEachElement(element, function(elem){
            if (!elem) return;
            if(elem.resizedAttached && typeof ev === "function"){
                elem.resizedAttached.remove(ev);
                if(elem.resizedAttached.length()) return;
            }
            if (elem.resizeSensor) {
                if (elem.contains(elem.resizeSensor)) {
                    elem.removeChild(elem.resizeSensor);
                }
                delete elem.resizeSensor;
                delete elem.resizedAttached;
            }
        });
    };

    return ResizeSensor;

}));

//  Created by Boris Schneiderman.
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


define('readium_shared_js/views/one_page_view',["../globals", "jquery", "underscore", "eventEmitter", "./cfi_navigation_logic", "../helpers", "../models/viewer_settings", "../models/bookmark_data", "ResizeSensor"],
    function (Globals, $, _, EventEmitter, CfiNavigationLogic, Helpers, ViewerSettings, BookmarkData, ResizeSensor) {

/**
 * Renders one page of fixed layout spread
 *
 * @param options
 * @param classes
 * @param enableBookStyleOverrides
 * @constructor
 */
var OnePageView = function (options, classes, enableBookStyleOverrides, reader) {

    $.extend(this, new EventEmitter());

    var self = this;

    var _$epubHtml;
    var _$epubBody;
    var _$el;
    var _$iframe;
    var _currentSpineItem;
    var _spine = options.spine;
    var _iframeLoader = options.iframeLoader;
    var _navigationLogic = undefined;
    var _bookStyles = options.bookStyles;

    var _$viewport = options.$viewport;

    var _isIframeLoaded = false;

    var _$scaler;

    var _lastBodySize = {
        width: undefined,
        height: undefined
    };

    var PageTransitionHandler = function (opts) {
        var PageTransition = function (begin, end) {
            this.begin = begin;
            this.end = end;
        };

        var _pageTransition_OPACITY = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("transform", "none");

                Helpers.CSSTransition($el, "opacity 150ms ease-out");

                $el.css("opacity", "1");
            }
        );

        var _pageTransition_TRANSLATE = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");

                var elWidth = Math.ceil(meta_width * scale);

                var initialLeft = elWidth * 0.8 * (pageSwitchDir === 2 ? 1 : -1);
                var move = Helpers.CSSTransformString({
                    left: Math.round(initialLeft),
                    origin: "50% 50% 0",
                    enable3D: _enable3D
                });
                $el.css(move);
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "1");

                Helpers.CSSTransition($el, "transform 150ms ease-out");

                $el.css("transform", "none");
            }
        );

        var _pageTransition_ROTATE = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");

                var elWidth = Math.ceil(meta_width * scale);

                var initialLeft = elWidth * 1.7 * (pageSwitchDir === 2 ? 1 : -1);
                var trans = Helpers.CSSTransformString({
                    left: Math.round(initialLeft),
                    angle: (pageSwitchDir === 2 ? -1 : 1) * 30,
                    origin: "50% 50% 0",
                    enable3D: _enable3D
                }); //(pageSwitchDir === 2 ? '0% 0%' : '100% 0%')
                $el.css(trans);
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "1");

                Helpers.CSSTransition($el, "transform 300ms ease-in-out");

                $el.css("transform", "none");
            }
        );

        var _pageTransition_SWING = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");

                // SUPER HACKY!! (just for demo)
                var isLeft = false;
                var isCenter = false;
                var isRight = false;
                for (var i = 0; i < classes.length; i++) {
                    var c = classes[i].toLowerCase();
                    if (c.indexOf("left") >= 0) {
                        isLeft = true;
                        break;
                    }
                    if (c.indexOf("right") >= 0) {
                        isRight = true;
                        break;
                    }
                    if (c.indexOf("center") >= 0) {
                        isCenter = true;
                        break;
                    }
                }

                var elWidth = Math.ceil(meta_width * scale);

                var initialLeft = elWidth * 0.5 * ((isLeft || isCenter && pageSwitchDir === 1) ? 1 : -1);
                var trans = Helpers.CSSTransformString({
                    scale: 0.2,
                    left: Math.round(initialLeft),
                    angle: ((isLeft || isCenter && pageSwitchDir === 1) ? 1 : -1) * 30,
                    origin: '50% 50% 0',
                    enable3D: _enable3D
                });
                $el.css(trans);
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "1");

                Helpers.CSSTransition($el, "transform 400ms ease-out");

                $el.css("transform", "none");
            }
        );

        var _pageTransitions = [];
        _pageTransitions.push(_pageTransition_OPACITY); // 0
        _pageTransitions.push(_pageTransition_TRANSLATE); // 1
        _pageTransitions.push(_pageTransition_ROTATE); // 2
        _pageTransitions.push(_pageTransition_SWING); // 3

        var _disablePageTransitions = opts.disablePageTransitions || false;
                
        // TODO: page transitions are broken, sp we disable them to avoid nasty visual artefacts
        _disablePageTransitions = true;

        var _pageTransition = -1;

        var _enable3D = new ViewerSettings({}).enableGPUHardwareAccelerationCSS3D;

        var _viewerSettings = undefined;
        this.updateOptions = function (o) {
            _viewerSettings = o;

            var settings = _viewerSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
                //defaults
                settings = new ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D) {
                _enable3D = true;
            }

            if (o.pageTransition !== null && typeof o.pageTransition !== "undefined") {
                _pageTransition = o.pageTransition;
            }
        };
        this.updateOptions(opts);

        var _pageSwitchDir = 0;
        var _pageSwitchActuallyChanged = false;
        var _pageSwitchActuallyChanged_IFRAME_LOAD = false;

        // dir: 0 => new or same page, 1 => previous, 2 => next
        this.updatePageSwitchDir = function (dir, hasChanged) {
            if (_pageSwitchActuallyChanged_IFRAME_LOAD) {
                return;
            }

            _pageSwitchDir = dir;
            _pageSwitchActuallyChanged = hasChanged;
        };

        this.onIFrameLoad = function () {
            _pageSwitchActuallyChanged_IFRAME_LOAD = true; // second pass, but initial display for transition
        };

        this.transformContentImmediate_BEGIN = function ($el, scale, left, top) {
            var pageSwitchActuallyChanged = _pageSwitchActuallyChanged || _pageSwitchActuallyChanged_IFRAME_LOAD;
            _pageSwitchActuallyChanged_IFRAME_LOAD = false;

            if (_disablePageTransitions || _pageTransition === -1) return;

            Helpers.CSSTransition($el, "all 0 ease 0");

            if (!pageSwitchActuallyChanged) return;

            var pageTransition = (_pageTransition >= 0 && _pageTransition < _pageTransitions.length) ? _pageTransitions[_pageTransition] : undefined;

            if (_pageSwitchDir === 0 || !pageTransition) {
                $el.css("opacity", "0");
            }
            else {
                pageTransition.begin(scale, left, top, $el, self.meta_width(), self.meta_height(), _pageSwitchDir);
            }
        };

        this.transformContentImmediate_END = function ($el, scale, left, top) {
            if (_disablePageTransitions || _pageTransition === -1) {
                $el.css("transform", "none");
                return;
            }

            setTimeout(function () {
                var pageTransition = (_pageTransition >= 0 && _pageTransition < _pageTransitions.length) ? _pageTransitions[_pageTransition] : undefined;

                if (_pageSwitchDir === 0 || !pageTransition) {
                    $el.css("transform", "none");

                    Helpers.CSSTransition($el, "opacity 250ms linear");

                    $el.css("opacity", "1");
                }
                else {
                    pageTransition.end(scale, left, top, $el, self.meta_width(), self.meta_height(), _pageSwitchDir);
                }

            }, 10);
        };
    };
    var _pageTransitionHandler = new PageTransitionHandler(options);


    // fixed layout does not apply user styles to publisher content, but reflowable scroll view does
    var _enableBookStyleOverrides = enableBookStyleOverrides || false;

    var _meta_size = {
        width: 0,
        height: 0
    };

    this.element = function () {
        return _$el;
    };

    this.meta_height = function () {
        return _meta_size.height;
    };

    this.meta_width = function () {
        return _meta_size.width;
    };

    this.isDisplaying = function () {

        return _isIframeLoaded; //_$iframe && _$iframe[0] && _$epubHtml
    };

    this.render = function () {

        var template = Helpers.loadTemplate("single_page_frame", {});

        _$el = $(template);

        _$scaler = $("#scaler", _$el);

        Helpers.CSSTransition(_$el, "all 0 ease 0");

        _$el.css("transform", "none");

        var settings = reader.viewerSettings();
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
            //defaults
            settings = new ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {

            // This fixes rendering issues with WebView (native apps), which crops content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
            _$el.css("transform", "translateZ(0)");
        }

        _$el.css("height", "100%");
        _$el.css("width", "100%");

        for (var i = 0, count = classes.length; i < count; i++) {
            _$el.addClass(classes[i]);
        }

        _$iframe = $("iframe", _$el);

        return this;
    };


    this.decorateIframe = function () {
        if (!_$iframe || !_$iframe.length) return;

        _$iframe.css("border-bottom", "1px dashed silver");
        _$iframe.css("border-top", "1px dashed silver");
    };

    this.remove = function () {
        this.clear();
        
        _currentSpineItem = undefined;
        
        if (_$el && _$el[0]) {
            _$el.remove();
        }
        
        _$el = undefined;
        _$scaler = undefined;
        _$iframe = undefined;
    };

    this.clear = function () {
        _isIframeLoaded = false;
        
        if (_$iframe && _$iframe[0]) {
            _$iframe[0].src = "";
        }
    };

    this.currentSpineItem = function () {

        return _currentSpineItem;
    };

    function onIFrameLoad(success) {

        if (success) {
            _isIframeLoaded = true;
            var epubContentDocument = _$iframe[0].contentDocument;
            _$epubHtml = $("html", epubContentDocument);
            if (!_$epubHtml || _$epubHtml.length == 0) {
                _$epubHtml = $("svg", epubContentDocument);
                _$epubBody = undefined;
            } else {
                _$epubBody = $("body", _$epubHtml);

                if (!_enableBookStyleOverrides) { // fixed layout
                    _$epubBody.css("margin", "0"); // ensures 8px margin default user agent stylesheet is reset to zero
                }
            }

            //_$epubHtml.css("overflow", "hidden");

            if (_enableBookStyleOverrides) { // not fixed layout (reflowable in scroll view)
                self.applyBookStyles();
            }

            updateMetaSize();

            initResizeSensor();

            _pageTransitionHandler.onIFrameLoad();
        }
    }

    function initResizeSensor() {

        if (_$epubBody // undefined with SVG spine items
            && _enableBookStyleOverrides // not fixed layout (reflowable in scroll view)
            ) {

            var bodyElement = _$epubBody[0];
            if (bodyElement.resizeSensor) {
                return;
            }

            // We need to make sure the content has indeed be resized, especially
            // the first time it is triggered
            _lastBodySize.width = $(bodyElement).width();
            _lastBodySize.height = $(bodyElement).height();

            bodyElement.resizeSensor = new ResizeSensor(bodyElement, function() {

                var newBodySize = {
                    width: $(bodyElement).width(),
                    height: $(bodyElement).height()
                };

                console.debug("OnePageView content resized ...", newBodySize.width, newBodySize.height, _currentSpineItem.idref);
                
                if (newBodySize.width != _lastBodySize.width || newBodySize.height != _lastBodySize.height) {
                    _lastBodySize.width = newBodySize.width;
                    _lastBodySize.height = newBodySize.height;

                    console.debug("... updating pagination.");

                    var src = _spine.package.resolveRelativeUrl(_currentSpineItem.href);

                    Globals.logEvent("OnePageView.Events.CONTENT_SIZE_CHANGED", "EMIT", "one_page_view.js [ " + _currentSpineItem.href + " -- " + src + " ]");
                    
                    self.emit(OnePageView.Events.CONTENT_SIZE_CHANGED, _$iframe, _currentSpineItem);
                    
                    //updatePagination();
                } else {
                    console.debug("... ignored (identical dimensions).");
                }
            });
        }
    }
    
    var _viewSettings = undefined;
    this.setViewSettings = function (settings, docWillChange) {

        _viewSettings = settings;

        if (_enableBookStyleOverrides  // not fixed layout (reflowable in scroll view)
            && !docWillChange) {
            self.applyBookStyles();
        }

        updateMetaSize();

        _pageTransitionHandler.updateOptions(settings);
    };

    function updateHtmlFontInfo() {

        if (!_enableBookStyleOverrides) return;  // fixed layout (not reflowable in scroll view)

        if (_$epubHtml && _viewSettings) {
            var i = _viewSettings.fontSelection;
            var useDefault = !reader.fonts || !reader.fonts.length || i <= 0 || (i-1) >= reader.fonts.length;
            var font = (useDefault ?
                        {} :
                        reader.fonts[i - 1]);
            Helpers.UpdateHtmlFontAttributes(_$epubHtml, _viewSettings.fontSize, font, function() {});
        }
    }

    this.applyBookStyles = function () {

        if (!_enableBookStyleOverrides) return;  // fixed layout (not reflowable in scroll view)

        if (_$epubHtml) {
            Helpers.setStyles(_bookStyles.getStyles(), _$epubHtml);
            updateHtmlFontInfo();
        }
    };

    //this is called by scroll_view for fixed spine item
    this.scaleToWidth = function (width) {

        if (_enableBookStyleOverrides) return;  // not fixed layout (reflowable in scroll view)

        if (_meta_size.width <= 0) return; // resize event too early!

        var scale = width / _meta_size.width;
        self.transformContentImmediate(scale, 0, 0);
    };

    //this is called by scroll_view for reflowable spine item
    this.resizeIFrameToContent = function () {
        var contHeight = getContentDocHeight();
        //console.log("resizeIFrameToContent: " + contHeight);

        self.setHeight(contHeight);

        self.showIFrame();
    };

    this.setHeight = function (height) {

        _$scaler.css("height", height + "px");
        _$el.css("height", height + "px");

//        _$iframe.css("height", height + "px");
    };

    var _useCSSTransformToHideIframe = true;

    this.showIFrame = function () {

        _$iframe.css("visibility", "visible");

        if (_useCSSTransformToHideIframe) {
            _$iframe.css("transform", "none");

            var enable3D = false;
            var settings = _viewSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
                //defaults
                settings = new ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D) {
                enable3D = true;
                _$iframe.css("transform", "translateZ(0)");
            }
        }
        else {
            _$iframe.css({left: "0px", top: "0px"});
        }
    };

    this.hideIFrame = function () {

        _$iframe.css("visibility", "hidden");

        // With some books, despite the iframe and its containing div wrapper being hidden,
        // the iframe's contentWindow / contentDocument is still visible!
        // Thus why we translate the iframe out of view instead.

        if (_useCSSTransformToHideIframe) {
            var enable3D = false;
            var settings = _viewSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
                //defaults
                settings = new ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D) {
                enable3D = true;
            }

            var css = Helpers.CSSTransformString({left: "10000", top: "10000", enable3D: enable3D});
            _$iframe.css(css);
        }
        else {
            _$iframe.css({left: "10000px", top: "10000px"});
        }
    };

    function getContentDocHeight() {

        if (!_$iframe || !_$iframe.length) {
            return 0;
        }

        if (Helpers.isIframeAlive(_$iframe[0])) {
            var win = _$iframe[0].contentWindow;
            var doc = _$iframe[0].contentDocument;

            var height = Math.round(parseFloat(win.getComputedStyle(doc.documentElement).height)); //body can be shorter!
            return height;
        }
        else if (_$epubHtml) {
            console.error("getContentDocHeight ??");

            var jqueryHeight = _$epubHtml.height();
            return jqueryHeight;
        }

        return 0;
    }

    // dir: 0 => new or same page, 1 => previous, 2 => next
    this.updatePageSwitchDir = function (dir, hasChanged) {
        _pageTransitionHandler.updatePageSwitchDir(dir, hasChanged);
    };


    this.transformContentImmediate = function (scale, left, top) {

        if (_enableBookStyleOverrides) return;  // not fixed layout (reflowable in scroll view)

        var elWidth = Math.ceil(_meta_size.width * scale);
        var elHeight = Math.floor(_meta_size.height * scale);

        _pageTransitionHandler.transformContentImmediate_BEGIN(_$el, scale, left, top);

        _$el.css("left", left + "px");
        _$el.css("top", top + "px");
        _$el.css("width", elWidth + "px");
        _$el.css("height", elHeight + "px");

        if (!_$epubHtml) {
//                  debugger;
            return;
        }

        var enable3D = false;
        var settings = _viewSettings;
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
            //defaults
            settings = new ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {
            enable3D = true;
        }
        
        if (_$epubBody // not SVG spine item (otherwise fails in Safari OSX)
            && reader.needsFixedLayoutScalerWorkAround()) {

            var css1 = Helpers.CSSTransformString({scale: scale, enable3D: enable3D});
            
            // See https://github.com/readium/readium-shared-js/issues/285 
            css1["min-width"] = _meta_size.width;
            css1["min-height"] = _meta_size.height;
            
            _$epubHtml.css(css1);

            // Ensures content dimensions matches viewport meta (authors / production tools should do this in their CSS...but unfortunately some don't).
            if (_$epubBody && _$epubBody.length) {
                _$epubBody.css({width:_meta_size.width, height:_meta_size.height});
            }

            var css2 = Helpers.CSSTransformString({scale : 1, enable3D: enable3D});
            css2["width"] = _meta_size.width * scale;
            css2["height"] = _meta_size.height * scale;

            _$scaler.css(css2);
        }
        else {
            var css = Helpers.CSSTransformString({scale: scale, enable3D: enable3D});
            css["width"] = _meta_size.width;
            css["height"] = _meta_size.height;
            _$scaler.css(css);
        }

        // Chrome workaround: otherwise text is sometimes invisible (probably a rendering glitch due to the 3D transform graphics backend?)
        //_$epubHtml.css("visibility", "hidden"); // "flashing" in two-page spread mode is annoying :(
        _$epubHtml.css("opacity", "0.999");

        self.showIFrame();

        setTimeout(function () {
            //_$epubHtml.css("visibility", "visible");
            _$epubHtml.css("opacity", "1");
        }, 0);
        
        // TODO: the CSS transitions do not work anymore, tested on Firefox and Chrome.
        // The line of code below still needs to be invoked, but the logic in _pageTransitionHandler probably need adjusting to work around the animation timing issue.
        // PS: opacity=1 above seems to interfere with the fade-in transition, probably a browser issue with mixing inner-iframe effects with effects applied to the iframe parent/ancestors.
        _pageTransitionHandler.transformContentImmediate_END(_$el, scale, left, top);
    };

    this.getCalculatedPageHeight = function () {
        return _$el.height();
    };

    this.transformContent = _.bind(_.debounce(this.transformContentImmediate, 50), self);

    function updateMetaSize() {

        _meta_size.width = 0;
        _meta_size.height = 0;

        if (_enableBookStyleOverrides) return; // not fixed layout (reflowable in scroll view)

        var size = undefined;

        var isFallbackDimension = false;
        var widthPercent = undefined;
        var heightPercent = undefined;

        var contentDocument = _$iframe[0].contentDocument;

        // first try to read viewport size
        var content = $('meta[name=viewport]', contentDocument).attr("content");

        // if not found try viewbox (used for SVG)
        if (!content) {
            content = $('meta[name=viewbox]', contentDocument).attr("content");
        }

        if (content) {
            size = parseMetaSize(content);
        }

        if (!size) {

            //var $svg = $(contentDocument).find('svg');
            // if($svg.length > 0) {
            if (contentDocument && contentDocument.documentElement && contentDocument.documentElement.nodeName && contentDocument.documentElement.nodeName.toLowerCase() == "svg") {

                var width = undefined;
                var height = undefined;

                var wAttr = contentDocument.documentElement.getAttribute("width");
                var isWidthPercent = wAttr && wAttr.length >= 1 && wAttr[wAttr.length - 1] == '%';
                if (wAttr) {
                    try {
                        width = parseInt(wAttr, 10);
                    }
                    catch (err) {}
                }
                if (width && isWidthPercent) {
                    widthPercent = width;
                    width = undefined;
                }

                var hAttr = contentDocument.documentElement.getAttribute("height");
                var isHeightPercent = hAttr && hAttr.length >= 1 && hAttr[hAttr.length - 1] == '%';
                if (hAttr) {
                    try {
                        height = parseInt(hAttr, 10);
                    }
                    catch (err) {}
                }
                if (height && isHeightPercent) {
                    heightPercent = height;
                    height = undefined;
                }

                if (width && height) {
                    size = {
                        width: width,
                        height: height
                    }
                }
                else {
                    /// DISABLED (not a satisfactory fallback)
                    // content = $svg.attr('viewBox');
                    // if(content) {
                    //     size = parseViewBoxSize(content);
                    // }
                    //
                    // if (size) {
                    //     console.warn("Viewport SVG: using viewbox!");
                    // }
                }
            }
        }

        if (!size && _currentSpineItem) {
            content = _currentSpineItem.getRenditionViewport();

            if (content) {
                size = parseMetaSize(content);
                if (size) {
                    console.log("Viewport: using rendition:viewport dimensions");
                }
            }
        }

        if (!size) {
            // Image fallback (auto-generated HTML template when WebView / iFrame is fed with image media type)
            var $img = $(contentDocument).find('img');
            if ($img.length > 0) {
                size = {
                    width: $img.width(),
                    height: $img.height()
                };

                var isImage = _currentSpineItem && _currentSpineItem.media_type && _currentSpineItem.media_type.length && _currentSpineItem.media_type.indexOf("image/") == 0;
                if (!isImage) {
                    console.warn("Viewport: using img dimensions!");
                }
            }
            else {
                $img = $(contentDocument).find('image');
                if ($img.length > 0) {
                    var width = undefined;
                    var height = undefined;

                    var wAttr = $img[0].getAttribute("width");
                    if (wAttr) {
                        try {
                            width = parseInt(wAttr, 10);
                        }
                        catch (err) {}
                    }
                    var hAttr = $img[0].getAttribute("height");
                    if (hAttr) {
                        try {
                            height = parseInt(hAttr, 10);
                        }
                        catch (err) {}
                    }


                    if (width && height) {
                        size = {
                            width: width,
                            height: height
                        };

                        isFallbackDimension = true;

                        console.warn("Viewport: using image dimensions!");
                    }
                }
            }
        }

        if (!size) {
            // Not a great fallback, as it has the aspect ratio of the full window, but it is better than no display at all.
            width = _$viewport.width();
            height = _$viewport.height();

            // hacky method to determine the actual available horizontal space (half the two-page spread is a reasonable approximation, this means that whatever the size of the other iframe / one_page_view, the aspect ratio of this one exactly corresponds to half the viewport rendering surface)
            var isTwoPageSyntheticSpread = $("iframe.iframe-fixed", _$viewport).length > 1;
            if (isTwoPageSyntheticSpread) width *= 0.5;

            // the original SVG width/height might have been specified as a percentage of the containing viewport
            if (widthPercent) {
                width *= (widthPercent / 100);
            }
            if (heightPercent) {
                height *= (heightPercent / 100);
            }

            size = {
                width: width,
                height: height
            };

            isFallbackDimension = true;

            console.warn("Viewport: using browser / e-reader viewport dimensions!");
        }

        if (size) {
            _meta_size.width = size.width;
            _meta_size.height = size.height;

            // Not strictly necessary, let's preserve the percentage values
            // if (isFallbackDimension && contentDocument && contentDocument.documentElement && contentDocument.documentElement.nodeName && contentDocument.documentElement.nodeName.toLowerCase() == "svg") {
            //     contentDocument.documentElement.setAttribute("width", size.width + "px");
            //     contentDocument.documentElement.setAttribute("height", size.height + "px");
            // }
        }
    }

    function onUnload (spineItem) {
        if (spineItem) {
            
            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "one_page_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, _$iframe, spineItem);
        }
    }

    this.onUnload = function () {
        onUnload(_currentSpineItem);
    };

    //expected callback signature: function(success, $iframe, spineItem, isNewlyLoaded, context)
    this.loadSpineItem = function (spineItem, callback, context) {

        if (_currentSpineItem != spineItem) {

            var prevSpineItem = _currentSpineItem;
            _currentSpineItem = spineItem;
            var src = _spine.package.resolveRelativeUrl(spineItem.href);

            // both fixed layout and reflowable documents need hiding due to flashing during layout/rendering
            //hide iframe until content is scaled
            self.hideIFrame();

            onUnload(prevSpineItem);


            Globals.logEvent("OnePageView.Events.SPINE_ITEM_OPEN_START", "EMIT", "one_page_view.js [ " + spineItem.href + " -- " + src + " ]");
            self.emit(OnePageView.Events.SPINE_ITEM_OPEN_START, _$iframe, _currentSpineItem);
            
            _iframeLoader.loadIframe(_$iframe[0], src, function (success) {

                if (success && callback) {
                    var func = function () {
                        callback(success, _$iframe, _currentSpineItem, true, context);
                    };

                    if (Helpers.isIframeAlive(_$iframe[0])) {
                        onIFrameLoad(success); // applies styles

                        func();
                    }
                    else {
                        console.error("onIFrameLoad !! doc && win + TIMEOUT");
                        console.debug(spineItem.href);

                        onIFrameLoad(success);

                        setTimeout(func, 500);
                    }
                }
                else {
                    onIFrameLoad(success);
                }

            }, self, {spineItem: _currentSpineItem});
        }
        else {
            if (callback) {
                callback(true, _$iframe, _currentSpineItem, false, context);
            }
        }
    };
    //
    // function parseViewBoxSize(viewBoxString) {
    //
    //     var parts = viewBoxString.split(' ');
    //
    //     if(parts.length < 4) {
    //         console.warn(viewBoxString + " value is not valid viewBox size")
    //         return undefined;
    //     }
    //
    //     var width = parseInt(parts[2]);
    //     var height = parseInt(parts[3]);
    //
    //     if(!isNaN(width) && !isNaN(height)) {
    //         return { width: width, height: height} ;
    //     }
    //
    //     return undefined;
    // }

    function parseMetaSize(content) {

        var pairs = content.replace(/\s/g, '').split(",");

        var dict = {};

        for (var i = 0; i < pairs.length; i++) {
            var nameVal = pairs[i].split("=");
            if (nameVal.length == 2) {

                dict[nameVal[0]] = nameVal[1];
            }
        }

        var width = Number.NaN;
        var height = Number.NaN;

        if (dict["width"]) {
            width = parseInt(dict["width"]);
        }

        if (dict["height"]) {
            height = parseInt(dict["height"]);
        }

        if (!isNaN(width) && !isNaN(height)) {
            return {width: width, height: height};
        }

        return undefined;
    }

    function getVisibleContentOffsets() {
        return {
            top: -_$el.parent().scrollTop(),
            left: 0
        };
    }
    
    function getFrameDimensions() {
        if (reader.needsFixedLayoutScalerWorkAround()) {
            var parentEl = _$el.parent()[0];
            return {
                width: parentEl.clientWidth,
                height: parentEl.clientHeight
            };
        }
        return {
            width: _meta_size.width,
            height: _meta_size.height
        };
    }
    
    this.getNavigator = function () {
        return new CfiNavigationLogic({
            $iframe: _$iframe,
            frameDimensionsGetter: getFrameDimensions,
            visibleContentOffsetsGetter: getVisibleContentOffsets,
            classBlacklist: ["cfi-marker", "mo-cfi-highlight", "resize-sensor", "resize-sensor-expand", "resize-sensor-shrink", "resize-sensor-inner", "js-hypothesis-config", "js-hypothesis-embed"],
            elementBlacklist: ["hypothesis-adder"],
            idBlacklist: ["MathJax_Message", "MathJax_SVG_Hidden"]
        });
    };

    this.getElementByCfi = function (spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if (spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();
        return navigation.getElementByCfi(cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getElementById = function (spineItemIdref, id) {

        if (spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();
        return navigation.getElementById(id);
    };

    this.getElement = function (spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();
        return navigation.getElement(selector);
    };

    this.getFirstVisibleMediaOverlayElement = function() {
        var navigation = self.getNavigator();
        return navigation.getFirstVisibleMediaOverlayElement();
    };

    this.offset = function () {
        if (_$iframe) {
            return _$iframe.offset();
        }
        return undefined;
    };

    this.getVisibleElementsWithFilter = function (filterFunction) {
        var navigation = self.getNavigator();
        var elements = navigation.getVisibleElementsWithFilter(null, filterFunction);
        return elements;
    };

    this.getVisibleElements = function (selector) {

        var navigation = self.getNavigator();
        var elements = navigation.getAllVisibleElementsWithSelector(selector);
        return elements;
    };

    this.getAllElementsWithFilter = function (filterFunction, outsideBody) {
        var navigation = self.getNavigator();
        var elements = navigation.getAllElementsWithFilter(filterFunction, outsideBody);
        return elements;
    };

    this.getElements = function(spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();

        return navigation.getElements(selector);
    };

    this.getNodeRangeInfoFromCfi = function (spineIdRef, partialCfi) {
        if (spineIdRef != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }
        var navigation = self.getNavigator();

        return navigation.getNodeRangeInfoFromCfi(partialCfi);
    };

    function createBookmarkFromCfi(cfi) {
        if (!_currentSpineItem) {
            return null;
        }

        return new BookmarkData(_currentSpineItem.idref, cfi);
    }

    this.getLoadedContentFrames = function () {
        return [{spineItem: _currentSpineItem, $iframe: _$iframe}];
    };

    this.getFirstVisibleCfi = function (visibleContentOffsets, frameDimensions) {
        return createBookmarkFromCfi(self.getNavigator().getFirstVisibleCfi(visibleContentOffsets, frameDimensions));
    };

    this.getLastVisibleCfi = function (visibleContentOffsets, frameDimensions) {
        return createBookmarkFromCfi(self.getNavigator().getLastVisibleCfi(visibleContentOffsets, frameDimensions));
    };

    this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        return self.getNavigator().getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive);
    };

    this.getRangeCfiFromDomRange = function (domRange) {
        return createBookmarkFromCfi(self.getNavigator().getRangeCfiFromDomRange(domRange));
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint) {
        return createBookmarkFromCfi(self.getNavigator().getVisibleCfiFromPoint(x, y, precisePoint));
    };

    this.getRangeCfiFromPoints = function(startX, startY, endX, endY) {
        return createBookmarkFromCfi(self.getNavigator().getRangeCfiFromPoints(startX, startY, endX, endY));
    };

    this.getCfiForElement = function(element) {
        return createBookmarkFromCfi(self.getNavigator().getCfiForElement(element));
    };

    this.getElementFromPoint = function (x, y) {
        return self.getNavigator().getElementFromPoint(x, y);
    };

    this.getStartCfi = function () {
        return createBookmarkFromCfi(self.getNavigator().getStartCfi());
    };

    this.getEndCfi = function () {
        return createBookmarkFromCfi(self.getNavigator().getEndCfi());
    };

    this.getNearestCfiFromElement = function(element) {
        return createBookmarkFromCfi(self.getNavigator().getNearestCfiFromElement(element));
    };
};

OnePageView.Events = {
    SPINE_ITEM_OPEN_START: "SpineItemOpenStart",
    CONTENT_SIZE_CHANGED: "ContentSizeChanged"
};
return OnePageView;
});

//  Created by Boris Schneiderman.
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

define('readium_shared_js/models/page_open_request',[],function() {
/**
 * Representation of opening page request
 * Provides the spine item to be opened and one of the following properties:
 *  spineItemPageIndex {Number},
 *  elementId {String},
 *  elementCfi {String},
 *  firstPage {bool},
 *  lastPage {bool}
 *
 * @class Models.PageOpenRequest
 * @constructor
 * @param {Models.SpineItem} spineItem
 * @param {object} [initiator]
 *

 */
var PageOpenRequest = function(spineItem, initiator) {

    this.spineItem = spineItem;
    this.spineItemPageIndex = undefined;
    this.elementId = undefined;
    this.elementCfi = undefined;
    this.firstVisibleCfi = undefined;
    this.lastVisibleCfi = undefined;
    this.firstPage = false;
    this.lastPage = false;
    this.initiator = initiator;

    /**
     * Resets the reading system
     *
     * @method     reset
     */

    this.reset = function() {
        this.spineItemPageIndex = undefined;
        this.elementId = undefined;
        this.elementCfi = undefined;
        this.firstPage = false;
        this.lastPage = false;
    };

    /**
     * Sets the first page of the book
     *
     * @method     setFirstPage
     */

    this.setFirstPage = function() {
        this.reset();
        this.firstPage = true;
    };

    /**
     * Sets the last page of the book
     *
     * @method     setLastPage
     */

    this.setLastPage = function() {
        this.reset();
        this.lastPage = true;
    };

    /**
     * Sets the index of the book
     *
     * @method     setPageIndex
     * @param      pageIndex
     */

    this.setPageIndex = function(pageIndex) {
        this.reset();
        this.spineItemPageIndex = pageIndex;
    };

    /**
     * Sets the ID of the current element
     *
     * @method     setElementId
     * @param      {number} elementId 
     */

    this.setElementId = function(elementId) {
        this.reset();
        this.elementId = elementId;
    };
    
    /**
     * Sets the CFI of the current element
     *
     * @method     setElementCfi
     * @param      elementCfi
     */

    this.setElementCfi = function(elementCfi) {
        this.reset();
        this.elementCfi = elementCfi;
    };

    // Used by ReflowView to better keep track of the current page
    // using just a bookmark to firstVisibleElement makes the current
    // page gradually shift to the beginning of the chapter. By bookmarking
    // both the first and last visible elements, we can keep track of the 
    // "middle" of the visible area.
    this.setFirstAndLastVisibleCfi = function(firstVisibleCfi, lastVisibleCfi) {
        this.reset();
        this.firstVisibleCfi = firstVisibleCfi;
        this.lastVisibleCfi = lastVisibleCfi;
    }

};

return PageOpenRequest;
});
//  Created by Boris Schneiderman.
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

define ('readium_shared_js/views/fixed_view',["../globals", "jquery", "underscore", "eventEmitter", "../models/bookmark_data", "../models/current_pages_info",
    "../models/fixed_page_spread", "./one_page_view", "../models/page_open_request", "../helpers"],
    function(Globals, $, _, EventEmitter, BookmarkData, CurrentPagesInfo,
             Spread, OnePageView, PageOpenRequest, Helpers) {
/**
 * View for rendering fixed layout page spread
 * @param options
 * @param reader
 * @constructor
 */
var FixedView = function(options, reader){

    $.extend(this, new EventEmitter());

    var self = this;

    var _$el;
    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _bookStyles = options.bookStyles;
    var _zoom = options.zoom || {style: 'default'};
    var _currentScale;
    var _iframeLoader = options.iframeLoader;
    var _viewSettings = undefined;

    var _leftPageView = createOnePageView("fixed-page-frame-left");
    var _rightPageView = createOnePageView("fixed-page-frame-right");
    var _centerPageView = createOnePageView("fixed-page-frame-center");

    var _pageViews = [];
    _pageViews.push(_leftPageView);
    _pageViews.push(_rightPageView);
    _pageViews.push(_centerPageView);

    var _spread = new Spread(_spine, false);
    var _bookMargins;
    var _contentMetaSize;
    var _isRedrowing = false;
    var _redrawRequest = false;

    function createOnePageView(elementClass) {

        var pageView = new OnePageView(options,
        [elementClass],
        false, //enableBookStyleOverrides
        reader
        );


        pageView.on(OnePageView.Events.SPINE_ITEM_OPEN_START, function($iframe, spineItem) {
            
            Globals.logEvent("OnePageView.Events.SPINE_ITEM_OPEN_START", "ON", "fixed_view.js [ " + spineItem.href + " ]");

            Globals.logEvent("CONTENT_DOCUMENT_LOAD_START", "EMIT", "fixed_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOAD_START, $iframe, spineItem);
        });

        pageView.on(Globals.Events.CONTENT_DOCUMENT_UNLOADED, function($iframe, spineItem) {

            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "ON", "fixed_view.js [ " + spineItem.href + " ]");

            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "fixed_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, $iframe, spineItem);
        });

        return pageView;
    }

    this.isReflowable = function() {
        return false;
    };

    this.setZoom = function(zoom){
        _zoom = zoom;

        resizeBook(false); 
    }

    this.render = function(){

        var template = Helpers.loadTemplate("fixed_book_frame", {});

        _$el = $(template);

        Helpers.CSSTransition(_$el, "all 0 ease 0");
        
        _$el.css("overflow", "hidden");
        
        // Removed, see one_page_view@render()
        // var settings = reader.viewerSettings();
        // if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
        // {
        //     //defaults
        //     settings = new Globals.Models.ViewerSettings({});
        // }
        // if (settings.enableGPUHardwareAccelerationCSS3D) {
        //
        //     // This fixes rendering issues with WebView (native apps), which crops content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
        //     _$el.css("transform", "translateZ(0)");
        // }
        
        _$viewport.append(_$el);

        self.applyStyles();

        return this;
    };

    this.remove = function() {

        _$el.remove();
    };


    this.setViewSettings = function(settings, docWillChange) {
        
        _viewSettings = settings;
        
        _spread.setSyntheticSpread(Helpers.deduceSyntheticSpread(_$viewport, getFirstVisibleItem(), _viewSettings) == true); // force boolean value (from truthy/falsey return value)

        var views = getDisplayingViews();
        for(var i = 0, count = views.length; i < count; i++) {
            views[i].setViewSettings(settings, docWillChange);
        }
    };

    function getFirstVisibleItem() {

        var visibleItems = _spread.validItems();
        return visibleItems[0];
    }

    function redraw(initiator, paginationRequest) {

        if(_isRedrowing) {
            _redrawRequest = {initiator: initiator, paginationRequest: paginationRequest};
            return;
        }

        _isRedrowing = true;

        var context = {isElementAdded : false};

        var pageLoadDeferrals = createPageLoadDeferrals([
            {pageView: _leftPageView, spineItem: _spread.leftItem, context: context},
            {pageView: _rightPageView, spineItem: _spread.rightItem, context: context},
            {pageView: _centerPageView, spineItem: _spread.centerItem, context: context}]);

        $.when.apply($, pageLoadDeferrals).done(function(){
            _isRedrowing = false;

            if(_redrawRequest) {
                var p1 = _redrawRequest.initiator;
                var p2 = _redrawRequest.paginationRequest;
                _redrawRequest = undefined;
                redraw(p1, p2);
            }
            else {
                
                if(context.isElementAdded) {
                    //self.applyStyles();
                    
                    Helpers.setStyles(_userStyles.getStyles(), _$el.parent());
                    updateBookMargins();
                    // updateContentMetaSize() and resizeBook() are invoked in onPagesLoaded below
                }

                if (paginationRequest)
                {
                    onPagesLoaded(initiator, paginationRequest.spineItem, paginationRequest.elementId)
                }
                else
                {
                    onPagesLoaded(initiator);
                }
            }

        });

    }

    // dir: 0 => new or same page, 1 => previous, 2 => next
    var updatePageSwitchDir = function(dir, hasChanged)
    {
        // irrespective of display state
        if (_leftPageView) _leftPageView.updatePageSwitchDir(dir, hasChanged);
        if (_rightPageView) _rightPageView.updatePageSwitchDir(dir, hasChanged);
        if (_centerPageView) _centerPageView.updatePageSwitchDir(dir, hasChanged);

        // var views = getDisplayingViews();
        // for(var i = 0, count = views.length; i < count; i++) {
        //     views[i].updatePageSwitchDir(dir, hasChanged);
        // }
    };
    

    this.applyStyles = function() {

        Helpers.setStyles(_userStyles.getStyles(), _$el.parent());
        updateBookMargins();
        
        updateContentMetaSize();
        resizeBook();
    };

    this.applyBookStyles = function() {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            views[i].applyBookStyles();
        }
    };

    function createPageLoadDeferrals(viewItemPairs) {

        var pageLoadDeferrals = [];

        for(var i = 0; i < viewItemPairs.length; i++) {

            var dfd = updatePageViewForItem(viewItemPairs[i].pageView, viewItemPairs[i].spineItem, viewItemPairs[i].context);
            pageLoadDeferrals.push(dfd);
        }

        return pageLoadDeferrals;

    }

    function onPagesLoaded(initiator, paginationRequest_spineItem, paginationRequest_elementId) {
        
        updateContentMetaSize();
        resizeBook();
        
        window.setTimeout(function () {
            
            Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "EMIT", "fixed_view.js");
            self.emit(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, {
                paginationInfo: self.getPaginationInfo(),
                initiator: initiator,
                spineItem: paginationRequest_spineItem,
                elementId: paginationRequest_elementId
            });
        }, 60);
        //this delay of 60ms is to ensure that it triggers
        // after any other 10-50ms timers that defer the pagination process in OnePageView
    }

    this.onViewportResize = function() {

        //because change of the viewport orientation can alter pagination behaviour we have to check if
        //visible content stays same

        var firstVisibleItem = getFirstVisibleItem();
        if(!firstVisibleItem) {
            return;
        }

        var isSyntheticSpread = Helpers.deduceSyntheticSpread(_$viewport, firstVisibleItem, _viewSettings) == true; // force boolean value (from truthy/falsey return value)

        if(isSpreadChanged(firstVisibleItem, isSyntheticSpread)) {
            _spread.setSyntheticSpread(isSyntheticSpread);
            var paginationRequest = new PageOpenRequest(firstVisibleItem, self);
            self.openPage(paginationRequest);
        }
        else {
            resizeBook(true);
        }
    };

    function isSpreadChanged(firstVisibleItem, isSyntheticSpread) {

        var tmpSpread = new Spread(_spine, isSyntheticSpread);
        tmpSpread.openItem(firstVisibleItem);

        return _spread.leftItem != tmpSpread.leftItem || _spread.rightItem != tmpSpread.rightItem || _spread.centerItem != tmpSpread.centerItem;
    }

    this.getViewScale = function(){
        return _currentScale;
    };

    function isContentRendered() {

        if(!_contentMetaSize || !_bookMargins) {
            return false;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        return viewportWidth && viewportHeight;
    }

    function resizeBook(viewportIsResizing) {

        updatePageSwitchDir(0, false);
        
        if(!isContentRendered()) {
            return;
        }

        var viewportWidth = _$viewport.width();
        var viewportHeight = _$viewport.height();

        var leftPageMargins = _leftPageView.isDisplaying() ? Helpers.Margins.fromElement(_leftPageView.element()) : Helpers.Margins.empty();
        var rightPageMargins = _rightPageView.isDisplaying() ? Helpers.Margins.fromElement(_rightPageView.element()) : Helpers.Margins.empty();
        var centerPageMargins = _centerPageView.isDisplaying() ? Helpers.Margins.fromElement(_centerPageView.element()) : Helpers.Margins.empty();

        var pageMargins = getMaxPageMargins(leftPageMargins, rightPageMargins, centerPageMargins);

        var potentialTargetElementSize = {   width: viewportWidth - _bookMargins.width(),
                                             height: viewportHeight - _bookMargins.height()};

        var potentialContentSize = {    width: potentialTargetElementSize.width - pageMargins.width(),
                                        height: potentialTargetElementSize.height - pageMargins.height() };

        if(potentialTargetElementSize.width <= 0 || potentialTargetElementSize.height <= 0) {
            return;
        }

        var horScale = potentialContentSize.width / _contentMetaSize.width;
        var verScale = potentialContentSize.height / _contentMetaSize.height;
        
        _$viewport.css("overflow", "auto");
            
        var scale;
        if (_zoom.style == 'fit-width'){
            scale = horScale;
        }
        else if (_zoom.style == 'fit-height'){
            scale = verScale;
        }
        else if (_zoom.style == 'user'){
            scale = _zoom.scale;
        }
        else{
            scale = Math.min(horScale, verScale);

            // no need for pan during "viewport fit" zoom
            _$viewport.css("overflow", "hidden");
        }

        _currentScale = scale;

        var contentSize = { width: _contentMetaSize.width * scale,
                            height: _contentMetaSize.height * scale };

        var targetElementSize = {   width: contentSize.width + pageMargins.width(),
                                    height: contentSize.height + pageMargins.height() };

        var bookSize = {    width: targetElementSize.width + _bookMargins.width(),
                            height: targetElementSize.height + _bookMargins.height() };


        var bookLeft = Math.floor((viewportWidth - bookSize.width) / 2);
        var bookTop = Math.floor((viewportHeight - bookSize.height) / 2);

        if(bookLeft < 0) bookLeft = 0;
        if(bookTop < 0) bookTop = 0;
        
        _$el.css("left", bookLeft + "px");
        _$el.css("top", bookTop + "px");
        _$el.css("width", targetElementSize.width + "px");
        _$el.css("height", targetElementSize.height + "px");

        var left = _bookMargins.padding.left;
        var top = _bookMargins.padding.top;

        var transFunc = viewportIsResizing ? "transformContentImmediate" : "transformContent";

        if(_leftPageView.isDisplaying()) {

             _leftPageView[transFunc](scale, left, top);
        }

        if(_rightPageView.isDisplaying()) {

            left += _contentMetaSize.separatorPosition * scale;

            if(_leftPageView.isDisplaying()) {
                left += leftPageMargins.left;
            }

            _rightPageView[transFunc](scale, left, top);
        }

        if(_centerPageView.isDisplaying()) {

            _centerPageView[transFunc](scale, left, top);
        }
        
        Globals.logEvent("FXL_VIEW_RESIZED", "EMIT", "fixed_view.js");
        self.emit(Globals.Events.FXL_VIEW_RESIZED);
    }

    function getMaxPageMargins(leftPageMargins, rightPageMargins, centerPageMargins) {

         var sumMargin = {
            left: Math.max(leftPageMargins.margin.left, rightPageMargins.margin.left, centerPageMargins.margin.left),
            right: Math.max(leftPageMargins.margin.right, rightPageMargins.margin.right, centerPageMargins.margin.right),
            top: Math.max(leftPageMargins.margin.top, rightPageMargins.margin.top, centerPageMargins.margin.top),
            bottom: Math.max(leftPageMargins.margin.bottom, rightPageMargins.margin.bottom, centerPageMargins.margin.bottom)
        };

        var sumBorder = {
            left: Math.max(leftPageMargins.border.left, rightPageMargins.border.left, centerPageMargins.border.left),
            right: Math.max(leftPageMargins.border.right, rightPageMargins.border.right, centerPageMargins.border.right),
            top: Math.max(leftPageMargins.border.top, rightPageMargins.border.top, centerPageMargins.border.top),
            bottom: Math.max(leftPageMargins.border.bottom, rightPageMargins.border.bottom, centerPageMargins.border.bottom)
        };

        var sumPAdding = {
            left: Math.max(leftPageMargins.padding.left, rightPageMargins.padding.left, centerPageMargins.padding.left),
            right: Math.max(leftPageMargins.padding.right, rightPageMargins.padding.right, centerPageMargins.padding.right),
            top: Math.max(leftPageMargins.padding.top, rightPageMargins.padding.top, centerPageMargins.padding.top),
            bottom: Math.max(leftPageMargins.padding.bottom, rightPageMargins.padding.bottom, centerPageMargins.padding.bottom)
        };

        return new Helpers.Margins(sumMargin, sumBorder, sumPAdding);

    }

    function updateContentMetaSize() {

        _contentMetaSize = {};

        if(_centerPageView.isDisplaying()) {
            _contentMetaSize.width = _centerPageView.meta_width();
            _contentMetaSize.height = _centerPageView.meta_height();
            _contentMetaSize.separatorPosition = 0;
        }
        else if(_leftPageView.isDisplaying() && _rightPageView.isDisplaying()) {
            if(_leftPageView.meta_height() == _rightPageView.meta_height()) {
                _contentMetaSize.width = _leftPageView.meta_width() + _rightPageView.meta_width();
                _contentMetaSize.height = _leftPageView.meta_height();
                _contentMetaSize.separatorPosition = _leftPageView.meta_width();
            }
            else {
                //normalize by height
                _contentMetaSize.width = _leftPageView.meta_width() + _rightPageView.meta_width() * (_leftPageView.meta_height() / _rightPageView.meta_height());
                _contentMetaSize.height = _leftPageView.meta_height();
                _contentMetaSize.separatorPosition = _leftPageView.meta_width();
            }
        }
        else if(_leftPageView.isDisplaying()) {
            _contentMetaSize.width = _leftPageView.meta_width() * 2;
            _contentMetaSize.height = _leftPageView.meta_height();
            _contentMetaSize.separatorPosition = _leftPageView.meta_width();
        }
        else if(_rightPageView.isDisplaying()) {
            _contentMetaSize.width = _rightPageView.meta_width() * 2;
            _contentMetaSize.height = _rightPageView.meta_height();
            _contentMetaSize.separatorPosition = _rightPageView.meta_width();
        }
        else {
            _contentMetaSize = undefined;
        }

    }

    function updateBookMargins() {
        _bookMargins = Helpers.Margins.fromElement(_$el);
    }

    // dir: 0 => new or same page, 1 => previous, 2 => next
    this.openPage =  function(paginationRequest, dir) {

        if(!paginationRequest.spineItem) {
            return;
        }

        var leftItem = _spread.leftItem;
        var rightItem = _spread.rightItem;
        var centerItem = _spread.centerItem;

        var isSyntheticSpread = Helpers.deduceSyntheticSpread(_$viewport, paginationRequest.spineItem, _viewSettings) == true; // force boolean value (from truthy/falsey return value)
        _spread.setSyntheticSpread(isSyntheticSpread);
        _spread.openItem(paginationRequest.spineItem);
        
        var hasChanged = leftItem !== _spread.leftItem || rightItem !== _spread.rightItem || centerItem !== _spread.centerItem;
        
        if (dir === null || typeof dir === "undefined") dir = 0;
        
        updatePageSwitchDir(dir === 0 ? 0 : (_spread.spine.isRightToLeft() ? (dir === 1 ? 2 : 1) : dir), hasChanged);
        
        redraw(paginationRequest.initiator, paginationRequest);
    };


    this.openPagePrev = function(initiator) {

        _spread.openPrev();
        
        updatePageSwitchDir(_spread.spine.isRightToLeft() ? 2 : 1, true);
        
        redraw(initiator, undefined);
    };

    this.openPageNext = function(initiator) {

        _spread.openNext();
        
        updatePageSwitchDir(_spread.spine.isRightToLeft() ? 1 : 2, true);
        
        redraw(initiator, undefined);
    };

    function updatePageViewForItem(pageView, item, context) {

        var dfd = $.Deferred();

        if(!item) {
            if(pageView.isDisplaying()) {
                pageView.remove();
            }

            dfd.resolve();
        }
        else {

            //if(pageView.isDisplaying()) { // always DO (no iframe reuse, as this creates problems with BlobURIs, and navigator history ... just like the reflowable view, we re-create an iframe from the template whenever needed for a new spine item URI)
            pageView.remove();
            
            //if(!pageView.isDisplaying()) { // always TRUE
            _$el.append(pageView.render().element());
            context.isElementAdded = true;
        

            pageView.loadSpineItem(item, function(success, $iframe, spineItem, isNewContentDocumentLoaded, context){

                if(success && isNewContentDocumentLoaded) {

                    //if we a re loading fixed view meta size should be defined
                    if(!pageView.meta_height() || !pageView.meta_width()) {
                        console.error("Invalid document " + spineItem.href + ": viewport is not specified!");
                    }

                    Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "fixed_view.js [ " + spineItem.href + " ]");
                    self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
                }

                dfd.resolve();

            }, context);
        }

        return dfd.promise();
    }

    this.getPaginationInfo = function() {

        var paginationInfo = new CurrentPagesInfo(_spine, true);

        var spreadItems = [_spread.leftItem, _spread.rightItem, _spread.centerItem];

        for(var i = 0; i < spreadItems.length; i++) {

            var spreadItem = spreadItems[i];

            if(spreadItem) {
                paginationInfo.addOpenPage(0, 1, spreadItem.idref, spreadItem.index);
            }
        }

        return paginationInfo;
    };

    this.bookmarkCurrentPage = function() {

        var views = getDisplayingViews();
        var loadedSpineItems = this.getLoadedSpineItems();

        if (views.length > 0) {
            return views[0].getFirstVisibleCfi();
        } else if (loadedSpineItems.length > 0) {
            return new BookmarkData(this.getLoadedSpineItems()[0].idref, null);
        }

        return undefined;
    };

    function getDisplayingViews() {

        var viewsToCheck = [];

        if( _spine.isLeftToRight() ) {
            viewsToCheck = [_leftPageView, _centerPageView, _rightPageView];
        }
        else {
            viewsToCheck = [_rightPageView, _centerPageView, _leftPageView];
        }

        var views = [];

        for(var i = 0, count = viewsToCheck.length; i < count; i++) {
            if(viewsToCheck[i].isDisplaying()) {
                views.push(viewsToCheck[i]);
            }
        }

        return views;
    }

    this.getLoadedSpineItems = function() {

        return _spread.validItems();
    };

    function callOnPageView(spineItemIdref, fn) {
        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.currentSpineItem().idref == spineItemIdref) {
                return fn(view);
            }
        }

        console.error("spine item is not loaded");
        return undefined;
    }

    this.getElement = function (spineItemIdref, selector) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElement(spineItemIdref, selector);
        });
    };

    this.getElementById = function (spineItemIdref, id) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElementById(spineItemIdref, id);
        });
    };


    this.getElementByCfi = function(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElementByCfi(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist);
        });
    };
    
    this.getFirstVisibleMediaOverlayElement = function() {

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            var el = views[i].getFirstVisibleMediaOverlayElement();
            if (el) return el;
        }

        return undefined;
    };

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        //TODO: during zoom+pan, playing element might not actually be visible

    };
    
    this.getElements = function(spineItemIdref, selector) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getElements(spineItemIdref, selector);
        });
    };
    
    this.isElementVisible = function($element){

        //for now we assume that for fixed layouts, elements are always visible
        return true;
    };
    
    this.getVisibleElementsWithFilter = function(filterFunction, includeSpineItems) {

        var elements = [];

        var views = getDisplayingViews();

        for(var i = 0, count = views.length; i < count; i++) {
            //for now we assume that for fixed layouts, elements are always visible
            elements.push(views[i].getAllElementsWithFilter(filterFunction, includeSpineItems));
        }

        return elements;
    };

    this.getVisibleElements = function (selector, includeSpineItems) {

        var elements = [];

        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {
            //for now we assume that for fixed layouts, elements are always visible
            if (includeSpineItems) {
                elements.push({elements: views[i].getElements(views[i].currentSpineItem().idref, selector), spineItem: views[i].currentSpineItem()});
            } else {
                elements.push(views[i].getElements(views[i].currentSpineItem().idref, selector));
            }
        }

        return elements;
    };

    this.isElementVisible = function($element){

        //for now we assume that for fixed layouts, elements are always visible
        return true;
    };
    
    this.isVisibleSpineItemElementCfi = function (spineItemIdref, partialCfi) {

        return callOnPageView(spineItemIdref, function (view) {
            //for now we assume that for fixed layouts, everything is always visible
            return true;
        });
    };

    this.getNodeRangeInfoFromCfi = function (spineItemIdref, partialCfi) {

        return callOnPageView(spineItemIdref, function (view) {
            return view.getNodeRangeInfoFromCfi(spineItemIdref, partialCfi);
        });
    };


    this.getFirstVisibleCfi = function () {
        var views = getDisplayingViews();
        if (views.length > 0) {
            return views[0].getFirstVisibleCfi();
        }
        return undefined;
    };

    this.getLastVisibleCfi = function () {
        var views = getDisplayingViews();
        if (views.length > 0) {
            return views[views.length - 1].getLastVisibleCfi();
        }
        return undefined;
    };

    this.getDomRangesFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        var views = getDisplayingViews();
        if (rangeCfi2 && rangeCfi.idref !== rangeCfi2.idref) {
            var ranges = [];
            for (var i = 0, count = views.length; i < count; i++) {
                var view = views[i];
                if (view.currentSpineItem().idref === rangeCfi.idref) {
                    var last = view.getLastVisibleCfi();
                    ranges.push(view.getDomRangeFromRangeCfi(rangeCfi.contentCFI, last.contentCFI, inclusive));
                } else if (view.currentSpineItem().idref === rangeCfi2.idref) {
                    var first = view.getFirstVisibleCfi();
                    ranges.push(view.getDomRangeFromRangeCfi(first.contentCFI, rangeCfi2.contentCFI, inclusive));
                }
            }
            return ranges;
        }

        return [this.getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive)];
    },

    this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        var views = getDisplayingViews();
        if (rangeCfi2 && rangeCfi.idref !== rangeCfi2.idref) {
            console.error("getDomRangeFromRangeCfi: both CFIs must be scoped under the same spineitem idref");
            return undefined;
        }
        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.currentSpineItem().idref === rangeCfi.idref) {
                return view.getDomRangeFromRangeCfi(rangeCfi.contentCFI, rangeCfi2 ? rangeCfi2.contentCFI : null, inclusive);
            }
        }

        return undefined;
    };

    this.getRangeCfiFromDomRange = function (domRange) {

        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.getLoadedContentFrames()[0].$iframe[0].contentDocument === domRange.startContainer.ownerDocument) {
                return view.getRangeCfiFromDomRange(domRange);
            }
        }

        return undefined;
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint, spineItemIdref) {
        if (!spineItemIdref) {
            throw new Error("getVisibleCfiFromPoint: Spine item idref must be specified for this fixed layout view.");
        }
        return callOnPageView(spineItemIdref, function (view) {
            return view.getVisibleCfiFromPoint(x,y, precisePoint);
        });
    };

    this.getRangeCfiFromPoints = function (startX, startY, endX, endY, spineItemIdref) {
        if (!spineItemIdref) {
            throw new Error("getRangeCfiFromPoints: Spine item idref must be specified for this fixed layout view.");
        }
        return callOnPageView(spineItemIdref, function (view) {
            return view.getRangeCfiFromPoints(startX, startY, endX, endY);
        });
    };

    this.getCfiForElement = function (element) {

        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.getLoadedContentFrames()[0].$iframe[0].contentDocument === element.ownerDocument) {
                return view.getCfiForElement(element);
            }
        }

        return undefined;
    };

    this.getElementFromPoint = function (x, y, spineItemIdref) {
        if (!spineItemIdref) {
            throw new Error("getElementFromPoint: Spine item idref must be specified for this fixed layout view.");
        }
        return callOnPageView(spineItemIdref, function (view) {
            return view.getElementFromPoint(x,y);
        });
    };

    this.getStartCfi = function () {
        return getDisplayingViews()[0].getStartCfi();
    };

    this.getEndCfi = function () {
        return getDisplayingViews()[0].getEndCfi();
    };

    this.getNearestCfiFromElement = function(element) {
        var views = getDisplayingViews();

        for (var i = 0, count = views.length; i < count; i++) {

            var view = views[i];
            if (view.getLoadedContentFrames()[0].$iframe[0].contentDocument === element.ownerDocument) {
                return view.getNearestCfiFromElement(element);
            }
        }

    };

};
    return FixedView;
});

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

define('readium_shared_js/views/iframe_loader',["jquery", "underscore", 'URIjs'], function($, _, URI) {
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

define('readium_shared_js/views/internal_links_support',['jquery', '../helpers', 'readium_cfi_js', 'URIjs'], function($, Helpers, epubCfi, URI) {
/**
 *
 * @param reader
 * @constructor
 */
var InternalLinksSupport = function(reader) {

    var self = this;

    function splitCfi(fullCfi) {

        var startIx = fullCfi.indexOf("(");
        var bungIx = fullCfi.indexOf("!");
        var endIx = fullCfi.indexOf(")");

        if(bungIx == -1) {
            return undefined;
        }

        if(endIx == -1) {
            endIx = fullCfi.length;
        }

        return {

            spineItemCfi: fullCfi.substring(startIx + 1, bungIx),
            elementCfi: fullCfi.substring(bungIx + 1, endIx)
        }
    }

    function getAbsoluteUriRelativeToSpineItem(hrefUri, spineItem) {

        var fullPath = reader.package().resolveRelativeUrl(spineItem.href);

        var absUrl = hrefUri.absoluteTo(fullPath);

        return absUrl;
    }

    function processDeepLink(hrefUri, spineItem) {

        var absoluteOpfUri = getAbsoluteUriRelativeToSpineItem(hrefUri, spineItem);

        if(!absoluteOpfUri) {
            console.error("Unable to resolve " + hrefUri.href())
            return;
        }

        var fullCfi = hrefUri.fragment();

        var absPath = absoluteOpfUri.toString();

        absPath = Helpers.RemoveFromString(absPath, "#" +  fullCfi);

        readOpfFile(absPath, function(opfText) {

            if(!opfText) {
                return;
            }

            var parser = new window.DOMParser;
            var packageDom = parser.parseFromString(opfText, 'text/xml');
            var cfi = splitCfi(fullCfi);

            if(!cfi) {
                console.warn("Unable to split cfi:" + fullCfi);
                return;
            }

            var contentDocRef = EPUBcfi.Interpreter.getContentDocHref("epubcfi(" + cfi.spineItemCfi + ")", packageDom);

            if(contentDocRef) {

                var newSpineItem = reader.spine().getItemByHref(contentDocRef);
                if(newSpineItem) {

                    reader.openSpineItemElementCfi(newSpineItem.idref, cfi.elementCfi, self);
                }
                else {
                    console.warn("Unable to find spineItem with href=" + contentDocRef);
                }

            }
            else {
                console.warn("Unable to find document ref from " +  fullCfi +" cfi");
            }

        });

    }

    function readOpfFile(path, callback) {

        //TODO: this should use readium-js resource fetcher (file / URI access abstraction layer), as right now this fails with packed EPUBs  
        $.ajax({
            // encoding: "UTF-8",
            // mimeType: "text/plain; charset=UTF-8",
            // beforeSend: function( xhr ) {
            //     xhr.overrideMimeType("text/plain; charset=UTF-8");
            // },
            isLocal: path.indexOf("http") === 0 ? false : true,
            url: path,
            dataType: 'text',
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

    //checks if href includes path to opf file and full cfi
    function isDeepLikHref(uri) {

        var fileName = uri.filename();
        return fileName && Helpers.EndsWith(fileName, ".opf");
    }

    function processLinkWithHash(hrefUri, spineItem) {

        var fileName = hrefUri.filename();

        var idref;

        //reference to another file
        if(fileName) {
            var normalizedUri = new URI(hrefUri, spineItem.href);
            
            var pathname = decodeURIComponent(normalizedUri.pathname());
            
            var newSpineItem = reader.spine().getItemByHref(pathname);

            if(!newSpineItem) {
                console.error("spine item with href=" + pathname + " not found");
                return;
            }

            idref = newSpineItem.idref;
        }
        else { //hush in the same file
            idref = spineItem.idref;
        }

        var hashFrag = hrefUri.fragment();

        reader.openSpineItemElementId(idref, hashFrag, self);

    }

    this.processLinkElements = function($iframe, spineItem) {

        var epubContentDocument = $iframe[0].contentDocument;

        $('a', epubContentDocument).click(function (clickEvent) {
            // Check for both href and xlink:href attribute and get value
            var href;
            if (clickEvent.currentTarget.attributes["xlink:href"]) {
                
                href = clickEvent.currentTarget.attributes["xlink:href"].value;
            }
            else {
                href = clickEvent.currentTarget.attributes["href"].value;
            }

            var overrideClickEvent = false;
            var hrefUri = new URI(href);
            var hrefIsRelative = hrefUri.is('relative');

            if (hrefIsRelative) {

                if(isDeepLikHref(hrefUri)) {
                    processDeepLink(hrefUri, spineItem);
                    overrideClickEvent = true;
                }
                else {
                    processLinkWithHash(hrefUri, spineItem);
                    overrideClickEvent = true;
                }

            } else {
                // It's an absolute URL to a remote site - open it in a separate window outside the reader
                window.open(href, '_blank');
                overrideClickEvent = true;
            }

            if (overrideClickEvent) {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
            }
        });

    }

};

return InternalLinksSupport;
});

//  LauncherOSX
//
//  Created by Boris Schneiderman.
//  Modified by Daniel Weck
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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
define ('readium_shared_js/models/smil_iterator',["jquery", "../helpers"], function($, Helpers) {
/**
 * Wrapper of a smil iterator object. 
 * A smil iterator is used by the media overlay player, to move along text areas which have an audio overlay. 
 * Such areas are specified in the smil model via parallel smil nodes (text + audio).  
 *
 * @class  Models.SmilIterator
 * @constructor
 * @param {Models.SmilModel} smil The current smil model
 */
var SmilIterator = function(smil) {

   /**
     * The smil model
     *
     * @property smil
     * @type Models.SmilModel
     */
    this.smil = smil;

    /**
     * The current parallel smil node
     *
     * @property currentPar
     * @type object
     */
     
    this.currentPar = undefined;

    /**
     * Resets the iterator. 
     * In practice, looks for the first parallel smil node in the smil model
     *
     * @method     reset
     */

    this.reset = function() {
        this.currentPar = findParNode(0, this.smil, false);
    };

    /*
    this.firstDeep = function(container) {
        var par = container.nodeType === "par" ? container : findParNode(0, container, false);

        return par;
    };
    */
//
//    this.ensureNextValidTextElement = function()
//    {
//        if (!this.currentPar)
//        {
//            console.debug("Par iterator is out of range");
//            return;
//        }
//
//        while (this.currentPar && !this.currentPar.element)
//        {
//            this.next();
//        }
//    };
    
    /**
     * Looks for a text smil node identified by the id parameter 
     * Returns true if the id param identifies a text smil node.
     *
     * @method     findTextId
     * @param      {Number} id A smil node identifier
     * @return     {Boolean} 
     */
    this.findTextId = function(id)
    {
        if (!this.currentPar)
        {
            console.debug("Par iterator is out of range");
            return;
        }

        if (!id)
        {
            return false;
        }

        while (this.currentPar)
        {
            if (this.currentPar.element)
            {
                if (id === this.currentPar.text.srcFragmentId) //this.currentPar.element.id
                {
                    return true;
                }

                // OUTER match
                var parent = this.currentPar.element.parentNode;
                while(parent)
                {
                    if (parent.id && parent.id == id)
                    {
                        return true;
                    }

                    parent = parent.parentNode;
                }
                //console.log(parent);

                // INNER match
                //var inside = this.currentPar.element.ownerDocument.getElementById(id);
                var inside = $("#" + Helpers.escapeJQuerySelector(id), this.currentPar.element);
                if (inside && inside.length && inside[0])
                {
                    return true;
                }
            }
            // moves to the next parallel smil node
            this.next();
        }

        return false;
    }

    /**
     * Looks for the next parallel smil node
     *
     * @method     next 
     */

    this.next = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        this.currentPar = findParNode(this.currentPar.index + 1, this.currentPar.parent, false);
    };

    /**
     * Looks for the previous parallel smil node
     *
     * @method     previous
     */

    this.previous = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        this.currentPar = findParNode(this.currentPar.index - 1, this.currentPar.parent, true);
    };

    /**
     * Checks if the current parallel smil node is the last one in the smil model
     *
     * @method     isLast
     * @return     {Bool}
     */

    this.isLast = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        if (findParNode(this.currentPar.index + 1, this.currentPar.parent, false))
        {
            return false;
        }

        return true;
    }

    /**
     * Moves to the parallel smil node given as a parameter. 
     *
     * @method     goToPar
     * @param      {Containter} par A parallel smil node
     * @return     {Boolean} 
     */

    this.goToPar =  function(par) {

        while(this.currentPar) {
            if(this.currentPar == par) {
                break;
            }

            this.next();
        }
    };

    /**
     * Looks for a parallel smil node in the smil model.
     *
     * @method     findParNode
     * @param      {Number} startIndex Start index inside the container
     * @param      {Models.SMilModel} container The smil model
     * @param      {Boolean} previous True if  search among previous nodes
     * @return     {Smil.ParNode} 
     */

    function findParNode(startIndex, container, previous) {

        for(var i = startIndex, count = container.children.length;
            i >= 0 && i < count;
            i += (previous ? -1 : 1)) {

            var node = container.children[i];
            if(node.nodeType == "par") {
                return node;
            }

            // assert(node.nodeType == "seq")
            node = findParNode(previous ? node.children.length - 1 : 0, node, previous);

            if(node) {
                return node;
            }
        }

        if(container.parent) {
            return findParNode(container.index + (previous ? -1 : 1), container.parent, previous);
        }

        return undefined;
    }

    this.reset();
};

return SmilIterator;
});

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

define ('readium_shared_js/views/media_overlay_data_injector',["jquery", "underscore", "../helpers", "../models/smil_iterator", "rangy", 'readium_cfi_js'], function($, _, Helpers, SmilIterator, rangy, epubCfi) {
/**
 *
 * @param mediaOverlay
 * @param mediaOverlayPlayer
 * @constructor
 */
var MediaOverlayDataInjector = function (mediaOverlay, mediaOverlayPlayer) {

    this.attachMediaOverlayData = function ($iframe, spineItem, mediaOverlaySettings) {

        var contentDocElement = $iframe[0].contentDocument.documentElement;

        if (!spineItem.media_overlay_id && mediaOverlay.smil_models.length === 0) {
            return;
        }

        var $body = $("body", contentDocElement);
        if ($body.length == 0) {
            console.error("! BODY ???");
        }
        else {
            var click = $body.data("mediaOverlayClick");
            if (click) {
                console.error("[WARN] already mediaOverlayClick");
            }
            else {
                $body.data("mediaOverlayClick", {ping: "pong"});

                var touchClickMOEventHandler = function (event)
                {
                    //console.debug("MO TOUCH-DOWN: "+event.type);
                    
                    var elem = $(this)[0]; // body
                    elem = event.target; // body descendant

                    if (!elem)
                    {
                        mediaOverlayPlayer.touchInit();
                        return true;
                    }

//console.debug("MO CLICK: " + elem.id);

                    var data = undefined;
                    var el = elem;

                    var inLink = false;
                    if (el.nodeName.toLowerCase() === "a")
                    {
                        inLink = true;
                    }

                    while (!(data = $(el).data("mediaOverlayData")))
                    {
                        if (el.nodeName.toLowerCase() === "a")
                        {
                            inLink = true;
                        }
                        el = el.parentNode;
                        if (!el)
                        {
                            break;
                        }
                    }
                    
                    if (data && (data.par || data.pars))
                    {
                        if (el !== elem)
                        {
//console.log("MO CLICK REDIRECT: " + el.id);
                        }

                        if (!mediaOverlaySettings.mediaOverlaysEnableClick)
                        {
console.log("MO CLICK DISABLED");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        if (inLink)
                        {
console.log("MO CLICKED LINK");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        var par = data.par ? data.par : data.pars[0];

                        if (data.pars && (typeof rangy !== "undefined"))
                        {
                            var wasPaused = false;
                            
                            // To remove highlight which may have altered DOM (and break CFI expressions)
                            if (mediaOverlayPlayer.isPlayingCfi())
                            {
                                wasPaused = true;
                                mediaOverlayPlayer.pause();
                            }
                         
                            // /////////////////////
                            // 
                            // var p = {x: event.pageX, y: event.pageY};
                            // if (webkitConvertPointFromPageToNode)
                            // {
                            //     p = webkitConvertPointFromPageToNode(elem.ownerDocument.body, new WebKitPoint(event.pageX, event.pageY));
                            // }
                            // 
                            // var div = elem.ownerDocument.getElementById("CLICKED");
                            // if (div)
                            // {
                            //     div.parentNode.removeChild(div);
                            // }
                            // 
                            // div = elem.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", 'div');
                            // div.setAttribute("style", "background-color: red; position: absolute; z-index: 999; width: 50px; height: 50px; left: " + p.x + "px; top: " + p.y + "px;");
                            // div.id = "CLICKED";
                            // div.setAttribute("id", div.id);
                            // var divTxt = elem.ownerDocument.createTextNode(" ");
                            // div.appendChild(divTxt);
                            // elem.ownerDocument.body.appendChild(div);
                            //                          
                            // /////////////////////


                            //rangy.init();
                            try
                            {
// THIS WORKS (same as Rangy's method below)
//                                 var r;
//                                 if (elem.ownerDocument.caretRangeFromPoint)
//                                 {
//                                     r = elem.ownerDocument.caretRangeFromPoint(event.pageX, event.pageY);
//                                 }
//                                 else if (event.rangeParent)
//                                 {
//                                     r = elem.ownerDocument.createRange();
//                                     range.setStart(event.rangeParent, event.rangeOffset);
//                                 }
//                                 
// console.log("------ 1");
// console.log(elem.ownerDocument);
// console.log(event.pageX);
// console.log(event.pageY);
// console.log(r.startContainer);
// console.log(r.startOffset);
// console.log("------");

                                var pos = rangy.positionFromPoint(event.pageX, event.pageY, elem.ownerDocument);
// console.log("------ 2");
// console.log(pos.node.textContent);
// console.log(pos.offset);
// console.log("------");

                                par = undefined;
                                
                                for (var iPar = 0; iPar < data.pars.length; iPar++)
                                {
                                    var p = data.pars[iPar];

                                    var startCFI = "epubcfi(" + p.cfi.partialStartCfi + ")";
                                    var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, elem.ownerDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

                                    var endCFI = "epubcfi(" + p.cfi.partialEndCfi + ")";
                                    var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, elem.ownerDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoEnd);

                                    var range = rangy.createRange(elem.ownerDocument); //createNativeRange
                                    range.setStartAndEnd(
                                        infoStart.textNode, infoStart.textOffset,
                                        infoEnd.textNode, infoEnd.textOffset
                                    );
        
                                    if (range.isPointInRange(pos.node, pos.offset))
                                    {
// console.log(p.cfi.partialStartCfi);
// console.log(p.cfi.partialEndCfi);
                                        // DOUBLE CHECK WITH getClientRects ??
                                        
                                        par = p;
                                        break;
                                    }
                                }
                            }
                            catch (e)
                            {
                                console.error(e);
                            }
                            
                            if (!par)
                            {
                                if (wasPaused)
                                {
                                    mediaOverlayPlayer.toggleMediaOverlay();
                                }
                                return true;
                            }
                        }


                        if (el && el != elem && el.nodeName.toLowerCase() === "body" && par && !par.getSmil().id)
                        {
//console.debug("MO CLICKED BLANK BODY");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        mediaOverlayPlayer.playUserPar(par);
                        return true;
                    }
                    else
                    {
                        var readaloud = $(elem).attr("ibooks:readaloud");
                        if (!readaloud)
                        {
                            readaloud = $(elem).attr("epub:readaloud");
                        }
                        if (readaloud)
                        {
console.debug("MO readaloud attr: " + readaloud);

                            var isPlaying = mediaOverlayPlayer.isPlaying();
                            if (readaloud === "start" && !isPlaying ||
                                readaloud === "stop" && isPlaying ||
                                readaloud === "startstop")
                            {
                                mediaOverlayPlayer.toggleMediaOverlay();
                                return true;
                            }
                        }
                    }

                    mediaOverlayPlayer.touchInit();
                    return true;
                };

                var touchClickMOEventHandler_ = _.debounce(touchClickMOEventHandler, 200);
                
                if ('ontouchstart' in document.documentElement)
                {
                  $body[0].addEventListener("touchstart", touchClickMOEventHandler_, false);
                }
                $body[0].addEventListener("mousedown", touchClickMOEventHandler_, false);

                //var clickEvent = 'ontouchstart' in document.documentElement ? 'touchstart' : 'click';
                //$body.bind(clickEvent, touchClickMOEventHandler);
            }
        }

        var smil = mediaOverlay.getSmilBySpineItem(spineItem);
        if (!smil)
        {
            console.error("NO SMIL?? " + spineItem.idref + " /// " + spineItem.media_overlay_id);
            return;
        }

        var traverseSmilSeqs = function(root)
        {
            if (!root) return;
            
            if (root.nodeType && root.nodeType === "seq")
            {
               // if (root.element)
               // {
               //     console.error("WARN: seq.element already set: " + root.textref);
               // }
                   
               if (root.textref)
               {
                   var parts = root.textref.split('#');
                   var file = parts[0];
                   var fragmentId = (parts.length === 2) ? parts[1] : "";
                   // 
                   // console.debug(root.textref);
                   // console.debug(fragmentId);
                   // console.log("---- SHOULD BE EQUAL:");
                   // console.debug(file);
                   // console.debug(par.text.srcFile);
                   // 
                   // if (file !== par.text.srcFile)
                   // {
                   //     console.error("adjustParToSeqSyncGranularity textref.file !== par.text.srcFile ???");
                   //     return par;
                   // }
                   // 
                   // if (!fragmentId)
                   // {
                   //     console.error("adjustParToSeqSyncGranularity !fragmentId ???");
                   //     return par;
                   // }

                   if (file && fragmentId)
                   {
                       var textRelativeRef = Helpers.ResolveContentRef(file, smil.href);
                       var same = textRelativeRef === spineItem.href;
                       if (same)
                       {                       
                           root.element = $iframe[0].contentDocument.getElementById(fragmentId);
                   
                           if (!root.element)
                           {
                               console.error("seq.textref !element? " + root.textref);
                           }

                           // var selector = "#" + Helpers.escapeJQuerySelector(fragmentId);
                           // var $element = $(selector, element.ownerDocument.documentElement);
                           // if ($element)
                           // {
                           //     seq.element = $element[0];
                           // }
                       }
                   }
               }
            }
            
            if (root.children && root.children.length)
            {
                for (var i = 0; i < root.children.length; i++)
                {
                    var child = root.children[i];
                    traverseSmilSeqs(child);
                }
            }
        };
        traverseSmilSeqs(smil);

//console.debug("[[MO ATTACH]] " + spineItem.idref + " /// " + spineItem.media_overlay_id + " === " + smil.id);

        var iter = new SmilIterator(smil);
        
        var fakeOpfRoot = "/99!";
        var epubCfiPrefix = "epubcfi";
        
        while (iter.currentPar) {
            iter.currentPar.element = undefined;
            iter.currentPar.cfi = undefined;

            if (true) { //iter.currentPar.text.srcFragmentId (includes empty frag ID)

                var textRelativeRef = Helpers.ResolveContentRef(iter.currentPar.text.srcFile, iter.smil.href);

                var same = textRelativeRef === spineItem.href;
                if (same) {
                    var selectBody = !iter.currentPar.text.srcFragmentId || iter.currentPar.text.srcFragmentId.length == 0;
                    var selectId = iter.currentPar.text.srcFragmentId.indexOf(epubCfiPrefix) == 0 ? undefined : iter.currentPar.text.srcFragmentId;

                    var $element = undefined;
                    var isCfiTextRange = false;
                    if (!selectBody && !selectId)
                    {
                        if (iter.currentPar.text.srcFragmentId.indexOf(epubCfiPrefix) === 0)
                        {
                            var partial = iter.currentPar.text.srcFragmentId.substr(epubCfiPrefix.length + 1, iter.currentPar.text.srcFragmentId.length - epubCfiPrefix.length - 2);
                            
                            if (partial.indexOf(fakeOpfRoot) === 0)
                            {
                                partial = partial.substr(fakeOpfRoot.length, partial.length - fakeOpfRoot.length);
                            }
//console.log(partial);
                            var parts = partial.split(",");
                            if (parts && parts.length === 3)
                            {
                                try
                                {
                                    var partialStartCfi = parts[0] + parts[1];
                                    var startCFI = "epubcfi(" + partialStartCfi + ")";
                                    var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, $iframe[0].contentDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

                                    var partialEndCfi = parts[0] + parts[2];
                                    var endCFI = "epubcfi(" + partialEndCfi + ")";
                                    var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, $iframe[0].contentDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoEnd);

                                    var cfiTextParent = infoStart.textNode.parentNode;

                                    iter.currentPar.cfi = {
                                        smilTextSrcCfi: iter.currentPar.text.srcFragmentId,
                                        partialRangeCfi: partial,
                                        partialStartCfi: partialStartCfi,
                                        partialEndCfi: partialEndCfi,
                                        
                                        cfiTextParent: cfiTextParent
                                        
                                        // textNode becomes invalid after highlighting! (dynamic span insertion/removal changes DOM)
                                        // cfiRangeStart: infoStart,
                                        // cfiRangeEnd: infoEnd
                                    };
                                    
                                    // TODO: not just start textNode, but all of them between start and end...
                                    // ...that being said, CFI text ranges likely to be used only within a single common parent,
                                    // so this is an acceptable implementation shortcut for this CFI experimentation (word-level text/audio synchronisation).
                                    isCfiTextRange = true;
                                    $element = $(cfiTextParent);
                                    var modata = $element.data("mediaOverlayData");
                                    if (!modata)
                                    {
                                        modata = {pars: [iter.currentPar]};
                                        $element.data("mediaOverlayData", modata);
                                    }
                                    else
                                    {
                                        if (modata.par)
                                        {
                                            console.error("[WARN] non-CFI MO DATA already exists!");
                                            modata.par = undefined;
                                        }

                                        var found = false;
                                        if (modata.pars)
                                        {
                                            for (var iPars = 0; iPars < modata.pars.length; iPars++)
                                            {
                                                var par = modata.pars[iPars];

                                                if (par === iter.currentPar)
                                                {
                                                    found = true;
                                                    console.error("[WARN] mediaOverlayData CFI PAR already registered!");
                                                }
                                            }
                                        }
                                        else
                                        {
                                            modata.pars = [];
                                        }

                                        if (!found)
                                        {
                                            modata.pars.push(iter.currentPar);
                                        }
                                    }

                                }
                                catch (error)
                                {
                                    console.error(error);
                                }
                            }
                            else
                            {
                                try
                                {
                                    var cfi = "epubcfi(" + partial + ")";
                                    $element = EPUBcfi.getTargetElementWithPartialCFI(cfi, $iframe[0].contentDocument,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
                                }
                                catch (error)
                                {
                                    console.error(error);
                                }
                            }
                        }
                        else 
                        {
                            console.error("SMIL text@src CFI fragment identifier scheme not supported: " + iter.currentPar.text.srcFragmentId);
                        }
                    }
                    else
                    {
                        if (selectBody)
                        {
                            $element = $body; //$("body", contentDocElement);
                        }
                        else
                        {
                            $element = $($iframe[0].contentDocument.getElementById(selectId));
                            //$element = $("#" + Helpers.escapeJQuerySelector(iter.currentPar.text.srcFragmentId), contentDocElement);
                        }
                    }

                    if ($element && $element.length > 0) {

                        if (!isCfiTextRange)
                        {
                            if (iter.currentPar.element && iter.currentPar.element !== $element[0]) {
                                console.error("DIFFERENT ELEMENTS??! " + iter.currentPar.text.srcFragmentId + " /// " + iter.currentPar.element.id);
                            }

                            var name = $element[0].nodeName ? $element[0].nodeName.toLowerCase() : undefined;
                            if (name === "audio" || name === "video") {
                                $element.attr("preload", "auto");
                            }

                            iter.currentPar.element = $element[0];

                            var modata = $element.data("mediaOverlayData");
                            if (modata) {
                                console.error("[WARN] MO DATA already exists.");

                                if (modata.par && modata.par !== iter.currentPar) {
                                    console.error("DIFFERENT PARS??!");
                                }
                            }

                            $element.data("mediaOverlayData", {par: iter.currentPar});

                            /*
                             $element.click(function() {
                             var elem = $(this)[0];
                             console.debug("MO CLICK (ELEM): " + elem.id);

                             var par = $(this).data("mediaOverlayData").par;
                             mediaOverlayPlayer.playUserPar(par);
                             });
                             */
                        }
                    }
                    else {
                        console.error("!! CANNOT FIND ELEMENT: " + iter.currentPar.text.srcFragmentId + " == " + iter.currentPar.text.srcFile + " /// " + spineItem.href);
                    }
                }
                else {
//console.debug("[INFO] " + spineItem.href + " != " + textRelativeRef + " # " + iter.currentPar.text.srcFragmentId);
                }
            }

            iter.next();
        }
    }
};

return MediaOverlayDataInjector;
});

//  LauncherOSX
//
//  Created by Boris Schneiderman.
// Modified by Daniel Weck, Andrey Kavarma
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


define('readium_shared_js/views/audio_player',['jquery'],function($) {

    /**
     *
     * @param onStatusChanged
     * @param onPositionChanged
     * @param onAudioEnded
     * @param onAudioPlay
     * @param onAudioPause
     * @constructor
     */
    var AudioPlayer = function(onStatusChanged, onPositionChanged, onAudioEnded, onAudioPlay, onAudioPause)
    {
        var _iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;
        var _Android = navigator.userAgent.toLowerCase().indexOf('android') > -1;
        var _isMobile = _iOS || _Android;

        //var _isReadiumJS = typeof window.requirejs !== "undefined";

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

            _audioElement.addEventListener("seeking", function()
                {
                    console.debug("Z) seeking");
                }
            );
        }

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
    
    
        var _volume = 1.0;
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
                console.error("this.play()");
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
                console.error("this.pause()");
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
            onAudioPause();
            onStatusChanged({isPlaying: false});
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
//console.debug("interval timer skipped (still seeking...)");
                        }
                                         
                        _intervalTimerSkips++;
                        if (_intervalTimerSkips > 1000)
                        {
                            _intervalTimerSkips = 0;
                            stopTimer();
                        }
                        return;
                    }
                    
                    var currentTime = undefined;
                    try
                    {
                        currentTime = _audioElement.currentTime;
                    }
                    catch (ex)
                    {
                        console.error(ex.message);
                    }
    
    //                if (DEBUG)
    //                {
    //                    console.debug("currentTime: " + currentTime);
    //                }
    
                    if (currentTime)
                    {
                        onPositionChanged(currentTime, 1);
                    }
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
            return _intervalTimer !== undefined;
        };
    
        this.reset = function()
        {
            if (DEBUG)
            {
                console.error("this.reset()");
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
    

        _audioElement.addEventListener("loadstart", function()
            {
                _touchInited = true;
            }
        );
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
        };
    
        var _playId = 0;
    
        var _seekQueuing = 0;
        
        this.playFile = function(smilSrc, epubSrc, seekBegin) //element
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
        function onReadyToSeek_(event)
        {
            if (DEBUG)
            {
                console.debug("onReadyToSeek #" + event.data.playId);
            }
            playSeekCurrentTime(event.data.seekBegin, event.data.playId, true);
        }
        function onReadyToSeek(event)
        {
            $(_audioElement).off(_readyEvent, onReadyToSeek);
            
            if (!_Android)
            {
                onReadyToSeek_(event);
            }
            else
            {
                if (DEBUG)
                {
                    console.debug("onReadyToSeek ANDROID ... waiting a bit ... #" + event.data.playId);
                }
                
                //self.play();
                playToForcePreload();
                
                setTimeout(function() {
                    onReadyToSeek_(event);
                }, 1000);
            }
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
        var _seekedEvent1 = _iOS ? "canplaythrough" : "seeked"; //"progress"
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
    
                    // if (DEBUG)
                    // {
                    //     console.debug("onSeeked() fail => first retry, EV: " + _seekedEvent2);
                    // }
    
                    event.data.isNewSrc = false;
                    //$(_audioElement).on(_seekedEvent2, event.data, onSeeked);
                }
                
                //else
                {
                    event.data.seekRetries--;
    
                    if (DEBUG)
                    {
                        console.debug("onSeeked() FAIL => retry again (timeout)");
                    }
    
                    setTimeout(function()
                    {
                        onSeeked(event);
                    }, _Android ? 1000 : 200);
                }
    
                setTimeout(function()
                {
                    _audioElement.pause();
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
                    console.debug("onSeeked() STATE:");
                    console.debug(notRetry);
                    console.debug(event.data.seekRetries);
                    console.debug(diff);
                }
    
                if (diff >= 1)
                {
                    if (DEBUG)
                    {
                        console.debug("onSeeked() ABORT, TRY AGAIN FROM SCRATCH!");
                    }
                    
                    var smilSrc = _currentSmilSrc;
                    var epubSrc = _currentEpubSrc;
                    var seekBegin = event.data.newCurrentTime;
                    
                    self.reset();
                    
                    setTimeout(function()
                    {
                        self.playFile(smilSrc, epubSrc, seekBegin);
                    }, 10);
                    
                    return;
                }

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

    return AudioPlayer;
});

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

define('readium_shared_js/views/media_overlay_element_highlighter',['jquery', 'rangy', 'readium_cfi_js'], function($, rangy, epubCfi) {
/**
 *
 * @param reader
 * @constructor
 */
var MediaOverlayElementHighlighter = function(reader) {

    this.includeParWhenAdjustingToSeqSyncGranularity = true;

    var DEFAULT_MO_ACTIVE_CLASS = "mo-active-default";
    var DEFAULT_MO_SUB_SYNC_CLASS = "mo-sub-sync";
    
    //var BACK_COLOR = "#99CCCC";

    var _highlightedElementPar = undefined;
    this.isElementHighlighted = function(par)
    {
        return _highlightedElementPar && par === _highlightedElementPar;
    };
    
    var _highlightedCfiPar = undefined;
    this.isCfiHighlighted = function(par)
    {
        return _highlightedCfiPar && par === _highlightedCfiPar;
    };

    var _activeClass = "";
    var _playbackActiveClass = "";

    var _reader = reader;
    
    var USE_RANGY = true && (typeof rangy !== "undefined");
    var _rangyCSS = undefined;
    var _rangyRange = undefined;
    
    var HIGHLIGHT_ID = "MO_SPEAK";
    
    var self = this;

    var $userStyle = undefined;
    
    this.reDo = function()
    {
        //this.reset();
        
        if ($userStyle)
        {
            $userStyle.remove();
        }
        $userStyle = undefined;

        var he = _highlightedElementPar;
        var hc = _highlightedCfiPar;
        var c1 = _activeClass;
        var c2 = _playbackActiveClass;
        
        if (_highlightedElementPar)
        {
            this.reset();

            this.highlightElement(he, c1, c2);
        }
        else if (_highlightedCfiPar)
        {
            this.reset();

            this.highlightCfi(hc, c1, c2);
        }
    };

    function ensureUserStyle($element, hasAuthorStyle, overrideWithUserStyle)
    {
        if ($userStyle)
        {
            try
            {
                if ($userStyle[0].ownerDocument === $element[0].ownerDocument)
                {
                    return;
                }
            }
            catch (e)
            {
                
            }
        }


        $head = $("head", $element[0].ownerDocument.documentElement);

        $userStyle = $("<style type='text/css'> </style>");

        $userStyle.append("." + DEFAULT_MO_ACTIVE_CLASS + " {");
        
        var fallbackUserStyle = "background-color: yellow !important; color: black !important; border-radius: 0.4em;";
        
        var style = overrideWithUserStyle; //_reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS);
        if (style)
        {
            var atLeastOne = false;
            for(var prop in style.declarations)
            {
                if(!style.declarations.hasOwnProperty(prop))
                {
                    continue;
                }

                atLeastOne = true;
                $userStyle.append(prop + ": " + style.declarations[prop] + "; ");
            }
            
            if (!atLeastOne && !hasAuthorStyle)
            {
                $userStyle.append(fallbackUserStyle);
            }
        }
        else if (!hasAuthorStyle)
        {
            $userStyle.append(fallbackUserStyle);
        }
        
        $userStyle.append("}");
        
        
        // ---- CFI
        //$userStyle.append(" .highlight {background-color: blue; border: 2x solid green;}"); //.hover-highlight
        
        
        $userStyle.appendTo($head);

//console.debug($userStyle[0].textContent);
    };
    
    this.highlightElement = function(par, activeClass, playbackActiveClass) {

        if(!par || par === _highlightedElementPar) {
            return;
        }

        this.reset();

        _highlightedElementPar = par;
        _highlightedCfiPar = undefined;
        
        _activeClass = activeClass;
        _playbackActiveClass = playbackActiveClass;

        var seq = this.adjustParToSeqSyncGranularity(_highlightedElementPar);
        var element = seq.element;
        
        if (_playbackActiveClass && _playbackActiveClass !== "")
        {
            //console.debug("MO playbackActiveClass: " + _playbackActiveClass);
            $(element.ownerDocument.documentElement).addClass(_playbackActiveClass);
            //console.debug("MO playbackActiveClass 2: " + element.ownerDocument.documentElement.classList);
        }

        var $hel = $(element);

        var hasAuthorStyle = _activeClass && _activeClass !== "";
        var overrideWithUserStyle = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS);

        ensureUserStyle($hel, hasAuthorStyle, overrideWithUserStyle);
                
        if (overrideWithUserStyle || !hasAuthorStyle)
        {
            //console.debug("MO active NO CLASS: " + _activeClass);

            if (hasAuthorStyle)
            {
                $hel.addClass(_activeClass);
            }
            
            $hel.addClass(DEFAULT_MO_ACTIVE_CLASS);

            //$(element).css("background", BACK_COLOR);
        }
        else
        {
            //console.debug("MO activeClass: " + _activeClass);
            $hel.addClass(_activeClass);
        }
        
        if (this.includeParWhenAdjustingToSeqSyncGranularity || _highlightedElementPar !== seq)
        {
            $(_highlightedElementPar.element).addClass(DEFAULT_MO_SUB_SYNC_CLASS);
        }
        
// ---- CFI
//         try
//         {
//             // //noinspection JSUnresolvedVariable
//             // var cfi = EPUBcfi.Generator.generateElementCFIComponent(element); //$hel[0]
//             // if(cfi[0] == "!") {
//             //     cfi = cfi.substring(1);
//             // }
// 
// //console.log(element);
//         
//             var firstTextNode = getFirstTextNode(element);
//             var txtFirst = firstTextNode.textContent;
// //console.log(txtFirst);
// 
//             var lastTextNode = getLastTextNode(element);
//             var txtLast = lastTextNode.textContent;
// //console.log(txtLast);
//         
//             var cfi = EPUBcfi.Generator.generateCharOffsetRangeComponent(
//                     firstTextNode, 
//                     0, 
//                     lastTextNode, 
//                     txtLast.length,
//                     ["cfi-marker"],
//                     [],
//                     ["MathJax_Message"]
//                     );
//             
//             var id = $hel.data("mediaOverlayData").par.getSmil().spineItemId;
//             _reader.addHighlight(id, cfi, HIGHLIGHT_ID,
//             "highlight", //"underline"
//             undefined // styles
//                         );
//         }
//         catch(error)
//         {
//             console.error(error);
//         
//             removeHighlight();
//         }
    };
    
    this.highlightCfi = function(par, activeClass, playbackActiveClass) {

        if(!par || par === _highlightedCfiPar) {
            return;
        }

        this.reset();

        _highlightedElementPar = undefined;
        _highlightedCfiPar = par;
        
        _activeClass = activeClass;
        _playbackActiveClass = playbackActiveClass;

        var $hel = $(_highlightedCfiPar.cfi.cfiTextParent);

        var hasAuthorStyle = _activeClass && _activeClass !== "";
        var overrideWithUserStyle = _reader.userStyles().findStyle("." + DEFAULT_MO_ACTIVE_CLASS); // TODO: performance issue?

        ensureUserStyle($hel, hasAuthorStyle, overrideWithUserStyle);

        var clazz = (overrideWithUserStyle || !hasAuthorStyle) ? ((hasAuthorStyle ? (_activeClass + " ") : "") + DEFAULT_MO_ACTIVE_CLASS) : _activeClass;

        if (USE_RANGY)
        {
            var doc = _highlightedCfiPar.cfi.cfiTextParent.ownerDocument;

            _rangyRange = rangy.createRange(doc); //createNativeRange

            var startCFI = "epubcfi(" + _highlightedCfiPar.cfi.partialStartCfi + ")";
            var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

            var endCFI = "epubcfi(" + _highlightedCfiPar.cfi.partialEndCfi + ")";
            var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoEnd);
            
            _rangyRange.setStartAndEnd(
                infoStart.textNode, infoStart.textOffset,
                infoEnd.textNode, infoEnd.textOffset
            );
            
            if (false && // we use CssClassApplier instead, because surroundContents() has no trivial undoSurroundContents() function (inc. text nodes normalisation, etc.)
                _rangyRange.canSurroundContents())
            {
                _rangyRange.MO_createCssClassApplier = false;
                
                var span = doc.createElementNS("http://www.w3.org/1999/xhtml", 'span');
                span.id = HIGHLIGHT_ID;
                span.setAttribute("id", span.id);
                span.setAttribute("class", clazz + " mo-cfi-highlight");
            
                _rangyRange.surroundContents(span);
            }
            else
            {
                _rangyRange.MO_createCssClassApplier = true;
                
                if (!_rangyCSS || _rangyCSS.cssClass !== clazz)
                {
                    _rangyCSS = rangy.createCssClassApplier(clazz,
                    {
                        elementTagName: "span",
                        elementProperties: {className: "mo-cfi-highlight"},
                        ignoreWhiteSpace: true,
                        applyToEditableOnly: false,
                        normalize: true
                    },
                    ["span"]);
                }

                _rangyCSS.applyToRange(_rangyRange);
            }
        }
        else if (_reader.plugins.highlights) // same API, newer implementation
        {
            try
            {
                //var id = $hel.data("mediaOverlayData").par.getSmil().spineItemId;
                var id = par.getSmil().spineItemId;
                _reader.plugins.highlights.addHighlight(id, par.cfi.partialRangeCfi, HIGHLIGHT_ID,
                "highlight", //"underline"
                undefined // styles
                            );
            }
            catch(error)
            {
                console.error(error);
            }
        }
        else if (_reader.plugins.annotations) // legacy
        {
            try
            {
                //var id = $hel.data("mediaOverlayData").par.getSmil().spineItemId;
                var id = par.getSmil().spineItemId;
                _reader.plugins.annotations.addHighlight(id, par.cfi.partialRangeCfi, HIGHLIGHT_ID,
                "highlight", //"underline"
                undefined // styles
                            );
            }
            catch(error)
            {
                console.error(error);
            }
        }
    };
    
// ---- CFI
//     
//     function getFirstTextNode(node)
//     {
//         if (node.nodeType === Node.TEXT_NODE)
//         {
//             if (node.textContent.trim().length > 0)
//                 return node;
//         }
//         
//         for (var i = 0; i < node.childNodes.length; i++)
//         {
//             var child = node.childNodes[i];
//             var first = getFirstTextNode(child);
//             if (first)
//             {
//                 return first;
//             }
//         }
//         
//         return undefined;
//     }
//     
//     function getLastTextNode(node)
//     {
//         if (node.nodeType === Node.TEXT_NODE)
//         {
//             if (node.textContent.trim().length > 0)
//                 return node;
//         }
//         
//         for (var i = node.childNodes.length-1; i >= 0; i--)
//         {
//             var child = node.childNodes[i];
//             var last = getLastTextNode(child);
//             if (last)
//             {
//                 return last;
//             }
//         }
//         
//         return undefined;
//     }
//     

    this.reset = function() {
        
        if (_highlightedCfiPar)
        {
            var doc = _highlightedCfiPar.cfi.cfiTextParent.ownerDocument;
            if (USE_RANGY)
            {
                if (_rangyCSS && _rangyRange.MO_createCssClassApplier)
                {
                    _rangyCSS.undoToRange(_rangyRange);
                }
                else
                {
                    var toRemove = undefined;
                    while ((toRemove = doc.getElementById(HIGHLIGHT_ID)) !== null)
                    {
                        var txt = toRemove.textContent; // TODO: innerHTML? or better: hasChildNodes loop + detach and re-attach
                        var txtNode = doc.createTextNode(txt);
                        
                        toRemove.parentNode.replaceChild(txtNode, toRemove);
                        txtNode.parentNode.normalize();
                    }
                }
        
                //_rangyCSS = undefined;
                _rangyRange = undefined;
            }
            else if (_reader.plugins.highlights) // same API, new implementation
            {
                try
                {
                    _reader.plugins.highlights.removeHighlight(HIGHLIGHT_ID);
        
                    var toRemove = undefined;
                    while ((toRemove = doc.getElementById("start-" + HIGHLIGHT_ID)) !== null)
                    {
            console.log("toRemove START");
            console.log(toRemove);
                        toRemove.parentNode.removeChild(toRemove);
                    }
                    while ((toRemove = doc.getElementById("end-" + HIGHLIGHT_ID)) !== null)
                    {
            console.log("toRemove END");
            console.log(toRemove);
                        toRemove.parentNode.removeChild(toRemove);
                    }
                }
                catch(error)
                {
                    console.error(error);
                }
            }
            else if (_reader.plugins.annotations) // legacy
            {
                try
                {
                    _reader.plugins.annotations.removeHighlight(HIGHLIGHT_ID);
        
                    var toRemove = undefined;
                    while ((toRemove = doc.getElementById("start-" + HIGHLIGHT_ID)) !== null)
                    {
            console.log("toRemove START");
            console.log(toRemove);
                        toRemove.parentNode.removeChild(toRemove);
                    }
                    while ((toRemove = doc.getElementById("end-" + HIGHLIGHT_ID)) !== null)
                    {
            console.log("toRemove END");
            console.log(toRemove);
                        toRemove.parentNode.removeChild(toRemove);
                    }
                }
                catch(error)
                {
                    console.error(error);
                }
            }
            
            _highlightedCfiPar = undefined;
        }
        
        
        

        if(_highlightedElementPar) {

            var seq = this.adjustParToSeqSyncGranularity(_highlightedElementPar);
            var element = seq.element;
            if (this.includeParWhenAdjustingToSeqSyncGranularity || _highlightedElementPar !== seq)
            {
                $(_highlightedElementPar.element).removeClass(DEFAULT_MO_SUB_SYNC_CLASS);
            }
            
            if (_playbackActiveClass && _playbackActiveClass !== "")
            {
                //console.debug("MO RESET playbackActiveClass: " + _playbackActiveClass);
                $(element.ownerDocument.documentElement).removeClass(_playbackActiveClass);
            }

            if (_activeClass && _activeClass !== "")
            {
                //console.debug("MO RESET activeClass: " + _activeClass);
                $(element).removeClass(_activeClass);
            }
            //else
            //{
                //console.debug("MO RESET active NO CLASS: " + _activeClass);
                $(element).removeClass(DEFAULT_MO_ACTIVE_CLASS);
                //$(element).css("background", '');
            //}

            _highlightedElementPar = undefined;
        }

        _activeClass = "";
        _playbackActiveClass = "";
    };

    this.adjustParToSeqSyncGranularity = function(par)
    {
        if (!par) return undefined;
        
        var sync = _reader.viewerSettings().mediaOverlaysSynchronizationGranularity;
        if (sync && sync.length > 0)
        {
            var element = par.element || (par.cfi ? par.cfi.cfiTextParent : undefined);
            if (!element)
            {
                console.error("adjustParToSeqSyncGranularity !element ???");
                return par; // should never happen!
            }

            var seq = par.getFirstSeqAncestorWithEpubType(sync, this.includeParWhenAdjustingToSeqSyncGranularity);
            if (seq && seq.element)
            {
                return seq;
            }
        }
        
        return par;
    };
};
    return MediaOverlayElementHighlighter;
});

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
define('readium_shared_js/views/scroll_view',["../globals", "jquery", "underscore", "eventEmitter", "../models/bookmark_data", "../models/current_pages_info", "../helpers",
        "./one_page_view", "../models/page_open_request", "../models/viewer_settings"],
    function (Globals, $, _, EventEmitter, BookmarkData, CurrentPagesInfo, Helpers,
              OnePageView, PageOpenRequest, ViewerSettings) {
/**
 * Renders content inside a scrollable view port
 * @param options
 * @param isContinuousScroll
 * @param reader
 * @constructor
 */
var ScrollView = function (options, isContinuousScroll, reader) {

    var _DEBUG = false;

    //https://github.com/jquery/jquery/commit/2d715940b9b6fdeed005cd006c8bf63951cf7fb2
    //https://github.com/jquery/jquery/commit/49833f7795d665ff1d543c4f71f29fca95b567e9
    //https://github.com/jquery/jquery/compare/2.1.4...2.2.0
    var _jQueryPositionNeedsFix = false; // v2.2.0 only
    try {
        var vs = $.fn.jquery.split(".");
        if (parseInt(vs[0]) == 2 && parseInt(vs[1]) == 2 && parseInt(vs[2]) == 0) {
            _jQueryPositionNeedsFix = true;
        }
    } catch(err) {
        console.error(err);
    }
    
    $.extend(this, new EventEmitter());

    var SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE = 5;
    var ITEM_LOAD_SCROLL_BUFFER = 2000;
    var ON_SCROLL_TIME_DALAY = 300;

    var self = this;

    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _deferredPageRequest;
    var _currentPageRequest;
    var _$contentFrame;
    var _$el;

    var _stopTransientViewUpdate = false;

    //this flags used to prevent onScroll event triggering pagination changed when internal layout modifications happens
    //if we trigger pagination change without reference to the original request that started the change - we brake the
    //Media Overlay bechaviyour
    //We can't reuse same flag for all of this action because this actions mey happen in parallel
    var _isPerformingLayoutModifications = false; //performing asynch  actions that may trigger onScroll;
    var _isSettingScrollPosition = false; //this happens when we set scroll position based on open element request
    var _isLoadingNewSpineItemOnPageRequest = false; //

    this.isContinuousScroll = function () {
        return isContinuousScroll;
    };

    this.render = function () {

        var template = Helpers.loadTemplate("scrolled_book_frame", {});

        _$el = $(template);
        _$viewport.append(_$el);

        _$contentFrame = $("#scrolled-content-frame", _$el);
        _$contentFrame.css("overflow", "");
        _$contentFrame.css("overflow-y", "auto");
        _$contentFrame.css("overflow-x", "hidden");
        _$contentFrame.css("-webkit-overflow-scrolling", "touch");
        _$contentFrame.css("width", "100%");
        _$contentFrame.css("height", "100%");
        _$contentFrame.css("position", "relative");

        var settings = reader.viewerSettings();
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
        {
            //defaults
            settings = new ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {
            // This is a necessary counterpart for the same CSS GPU hardware acceleration trick in one_page_view.js
            // This affects the stacking order and re-enables the scrollbar in Safari (works fine in Chrome otherwise)
            _$contentFrame.css("transform", "translateZ(0)");
        }

        // _$contentFrame.css("box-sizing", "border-box");
        // _$contentFrame.css("border", "20px solid red");

        self.applyStyles();

        var lazyScroll = _.debounce(onScroll, ON_SCROLL_TIME_DALAY);

        _$contentFrame.on('scroll', function (e) {
            lazyScroll(e);
            onScrollDirect();
        });

        return self;
    };

    function updateLoadedViewsTop(callback, assertScrollPosition) {

        if (_stopTransientViewUpdate) {
            callback();
            return;
        }

        var viewPage = firstLoadedView();
        if (!viewPage) {
            callback();
            return;
        }

        var viewPortRange = getVisibleRange(0);
        var firstViewRange = getPageViewRange(viewPage);

        if ((viewPortRange.top - firstViewRange.bottom) > ITEM_LOAD_SCROLL_BUFFER) {
            var scrollPos = scrollTop();
            removePageView(viewPage);
            scrollTo(scrollPos - (firstViewRange.bottom - firstViewRange.top), undefined);
            assertScrollPosition("updateLoadedViewsTop 1");
            updateLoadedViewsTop(callback, assertScrollPosition); //recursion
        }
        else if ((viewPortRange.top - firstViewRange.top) < ITEM_LOAD_SCROLL_BUFFER) {
            addToTopOf(viewPage, function (isElementAdded) {
                if (isElementAdded) {
                    assertScrollPosition("updateLoadedViewsTop 2");
                    updateLoadedViewsTop(callback, assertScrollPosition); //recursion
                }
                else {
                    callback();
                }
            });
        }
        else {
            callback();
        }

    }

    function updateLoadedViewsBottom(callback, assertScrollPosition) {

        if (_stopTransientViewUpdate) {
            callback();
            return;
        }

        var viewPage = lastLoadedView();
        if (!viewPage) {
            callback();
            return;
        }

        var viewPortRange = getVisibleRange(0);
        var lastViewRange = getPageViewRange(viewPage);

        if ((lastViewRange.top - viewPortRange.bottom) > ITEM_LOAD_SCROLL_BUFFER) {
            removePageView(viewPage);
            assertScrollPosition("updateLoadedViewsBottom 1");
            updateLoadedViewsBottom(callback, assertScrollPosition); //recursion
        }
        else if ((lastViewRange.bottom - viewPortRange.bottom) < ITEM_LOAD_SCROLL_BUFFER) {
            addToBottomOf(viewPage, function (newPageLoaded) {
                assertScrollPosition("updateLoadedViewsBottom 2");
                if (newPageLoaded) {
                    updateLoadedViewsBottom(callback, assertScrollPosition); //recursion
                }
                else {
                    callback();
                }
            });
        }
        else {
            callback();
        }

    }

    function updateTransientViews(pageView) {

        if (!isContinuousScroll) {
            return;
        }

        var scrollPosBefore = undefined;
        if (_DEBUG)
        {
            if (pageView)
            {
                var offset = pageView.offset();
                if (offset) scrollPosBefore = offset.top;
            }
        }

        // This function double-checks whether the browser has shifted the scroll position because of unforeseen rendering issues.
        // (this should never happen because we handle scroll adjustments during iframe height resizes explicitely in this code)
        var assertScrollPosition = function(msg)
        {
            if (_DEBUG)
            {
                if (!scrollPosBefore) return;
                var scrollPosAfter = undefined;

                var offset = pageView.offset();
                if (offset) scrollPosAfter = offset.top;

                if (!scrollPosAfter) return;

                var diff = scrollPosAfter - scrollPosBefore;
                if (Math.abs(diff) > 1)
                {
                    console.debug("@@@@@@@@@@@@@@@ SCROLL ADJUST (" + msg + ") " + diff + " -- " + pageView.currentSpineItem().href);
                    //_$contentFrame[0].scrollTop = _$contentFrame[0].scrollTop + diff;
                }
            }
        };

        _isPerformingLayoutModifications = true;
        updateLoadedViewsBottom(function () {
            updateLoadedViewsTop(function () {
                setTimeout(function () {
                    _isPerformingLayoutModifications = false;
                }, ON_SCROLL_TIME_DALAY + 100);
            }, assertScrollPosition);
        }, assertScrollPosition);
    }

    var _mediaOverlaysWasPlayingLastTimeScrollStarted = false;

    function onScrollDirect(e)
    {
        var settings = reader.viewerSettings();
        if (!settings.mediaOverlaysPreservePlaybackWhenScroll)
        {
            if (!_mediaOverlaysWasPlayingLastTimeScrollStarted && reader.isMediaOverlayAvailable())
            {
                _mediaOverlaysWasPlayingLastTimeScrollStarted = reader.isPlayingMediaOverlay();
                if (_mediaOverlaysWasPlayingLastTimeScrollStarted)
                {
                    reader.pauseMediaOverlay();
                }
            }
        }
    }

    function onScroll(e)
    {
        if (   !_isPerformingLayoutModifications
            && !_isSettingScrollPosition
            && !_isLoadingNewSpineItemOnPageRequest) {

            self.resetCurrentPosition();

            updateTransientViews();
            onPaginationChanged(self);

            _.defer(function() {
                if (!_currentPageRequest) {
                    self.saveCurrentPosition();
                }
            })

            var settings = reader.viewerSettings();
            if (!settings.mediaOverlaysPreservePlaybackWhenScroll)
            {
                if (_mediaOverlaysWasPlayingLastTimeScrollStarted)
                {
                    setTimeout(function()
                    {
                        reader.playMediaOverlay();
                        _mediaOverlaysWasPlayingLastTimeScrollStarted = false;
                    }, 100);
                }
            }
        }
    }

    function scrollTo(offset, pageRequest) {

        _$contentFrame[0].scrollTop = offset;

        if (pageRequest) {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    }

    function updatePageViewSizeAndAdjustScroll(pageView)
    {
        var scrollPos = scrollTop();
        var rangeBeforeResize = getPageViewRange(pageView);

        updatePageViewSize(pageView);

        var rangeAfterResize = getPageViewRange(pageView);

        var heightAfter = rangeAfterResize.bottom - rangeAfterResize.top;
        var heightBefore = rangeBeforeResize.bottom - rangeBeforeResize.top;

        var delta = heightAfter - heightBefore;

        if (Math.abs(delta) > 0)
        {
            if (_DEBUG)
            {
                console.debug("IMMEDIATE SCROLL ADJUST: " + pageView.currentSpineItem().href + " == " + delta);
            }
            scrollTo(scrollPos + delta);
        }
    }

    function addToTopOf(topView, callback) {

        var prevSpineItem = _spine.prevItem(topView.currentSpineItem(), true);
        if (!prevSpineItem) {
            callback(false);
            return;
        }

        var tmpView = createPageViewForSpineItem(prevSpineItem, true);

        // add to the end first to avoid scrolling during load
        var lastView = lastLoadedView();
        tmpView.element().insertAfter(lastView.element());

        tmpView.loadSpineItem(prevSpineItem, function (success, $iframe, spineItem, isNewlyLoaded, context) {
            if (success) {

                updatePageViewSize(tmpView);
                var range = getPageViewRange(tmpView);

                removePageView(tmpView);


                var scrollPos = scrollTop();

                var newView = createPageViewForSpineItem(prevSpineItem);
                var originalHeight = range.bottom - range.top;


                newView.setHeight(originalHeight);
                // iframe is loaded hidden here
                //this.showIFrame();
                //===> not necessary here (temporary iframe)

                newView.element().insertBefore(topView.element());

                scrollPos = scrollPos + originalHeight;

                scrollTo(scrollPos, undefined);

                newView.loadSpineItem(prevSpineItem, function (success, $iframe, spineItem, isNewlyLoaded, context) {
                    if (success) {

                        updatePageViewSizeAndAdjustScroll(newView);
                        onPageViewLoaded(newView, success, $iframe, spineItem, isNewlyLoaded, context);
                        callback(success);
                        // No need for complicated reachStableContentHeight any more
                        // Remove this
                        //reachStableContentHeight(0, newView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? newView.meta_width() : 0, "addToTopOf", continueCallback); // //onIFrameLoad called before this callback, so okay.
                    }
                    else {
                        console.error("Unable to open 2 " + prevSpineItem.href);
                        removePageView(newView);
                        callback(false);
                    }

                });
            }
            else {
                console.error("Unable to open 1 " + prevSpineItem.href);
                removePageView(tmpView);
                callback(false);
            }

        });
    }

    function updatePageViewSize(pageView) {

        if (pageView.currentSpineItem().isFixedLayout()) {
            pageView.scaleToWidth(_$contentFrame.width());
        }
        else {
            pageView.resizeIFrameToContent();
        }
    }

    function addToBottomOf(bottomView, callback) {

        var nexSpineItem = _spine.nextItem(bottomView.currentSpineItem(), true);
        if (!nexSpineItem) {
            callback(false);
            return;
        }

        var scrollPos = scrollTop();

        var newView = createPageViewForSpineItem(nexSpineItem);
        newView.element().insertAfter(bottomView.element());

        newView.loadSpineItem(nexSpineItem, function (success, $iframe, spineItem, isNewlyLoaded, context) {
            if (success) {

                updatePageViewSize(newView);
                onPageViewLoaded(newView, success, $iframe, spineItem, isNewlyLoaded, context);
                callback(success);
                // No need for complicated reachStableContentHeight any more
                //reachStableContentHeight(2, newView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? newView.meta_width() : 0, "addToBottomOf", continueCallback); // //onIFrameLoad called before this callback, so okay.
            }
            else {
                console.error("Unable to load " + nexSpineItem.href);
                callback(false);
            }

        });
    }

    function removeLoadedItems() {

        var loadedPageViews = [];

        forEachItemView(function (pageView) {
            loadedPageViews.push(pageView);
        }, false);

        for (var i = 0, count = loadedPageViews.length; i < count; i++) {
            removePageView(loadedPageViews[i]);
        }
    }

    function removePageView(pageView) {

        pageView.onUnload();
        pageView.element().remove();

    }


    function setFrameSizesToRectangle(rectangle) {

        _$contentFrame.css("left", rectangle.left);
        _$contentFrame.css("top", rectangle.top);
        _$contentFrame.css("right", rectangle.right);
        _$contentFrame.css("bottom", rectangle.bottom);

    }

    this.remove = function () {
        _$el.remove();
    };

    this.onViewportResize = function () {

        if (!_$contentFrame) {
            return;
        }
    };

    this.resetCurrentPosition = function() {
        _currentPageRequest = undefined;
    };

    this.saveCurrentPosition = function() {
        // If there's a deferred page request, there's no point in saving the current position
        // as it's going to change soon
        if (_deferredPageRequest) {
            return;
        }

        var _firstVisibleCfi = self.getFirstVisibleCfi();
        var spineItem = _spine.getItemById(_firstVisibleCfi.idref);
        if (spineItem) {
            _currentPageRequest = new PageOpenRequest(spineItem, self);
            _currentPageRequest.setElementCfi(_firstVisibleCfi.contentCFI);
        }
    };

    this.restoreCurrentPosition = function() {
        if (_currentPageRequest) {
            this.openPageInternal(_currentPageRequest);            
        }
    };

    var _viewSettings = undefined;
    this.setViewSettings = function (settings, docWillChange) {

        _viewSettings = settings;

        forEachItemView(function (pageView) {

            pageView.setViewSettings(settings, docWillChange);

        }, false);
    };

    function createPageViewForSpineItem(aSpineItem, isTemporaryView) {
        
        options.disablePageTransitions = true; // force

        var enableBookStyleOverrides = true;
        if (aSpineItem.isFixedLayout()) {
            enableBookStyleOverrides = false;
        }

        var pageView = new OnePageView(
            options,
            ["content-doc-frame"],
            enableBookStyleOverrides,
            reader);

        pageView.on(OnePageView.Events.SPINE_ITEM_OPEN_START, function($iframe, spineItem) {
            
            Globals.logEvent("OnePageView.Events.SPINE_ITEM_OPEN_START", "ON", "scroll_view.js [ " + spineItem.href + " ]");

            Globals.logEvent("CONTENT_DOCUMENT_LOAD_START", "EMIT", "scroll_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOAD_START, $iframe, spineItem);
        });

        pageView.on(Globals.Events.CONTENT_DOCUMENT_UNLOADED, function($iframe, spineItem) {
            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "ON", "scroll_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, $iframe, spineItem);
        });

        function updatePageViewSizeAndPagination_() {
            // Resize the PageView to fit its content and update the pagination
            // and the adjacent views
            updatePageViewSize(pageView);
            onPaginationChanged(self);
            updateTransientViews();
            if (_currentPageRequest && !_deferredPageRequest) {
                self.restoreCurrentPosition();                
            }
        }
        var updatePageViewSizeAndPagination = _.debounce(updatePageViewSizeAndPagination_, 100);

        // Observe the CONTENT_SIZE_CHANGED from the page view so the ScrollView
        // is notified when the size of the content of the view changes, because
        // the font or the viewport size has changed
        pageView.on(OnePageView.Events.CONTENT_SIZE_CHANGED, function($iframe, spineItem) {
            
            Globals.logEvent("OnePageView.Events.CONTENT_SIZE_CHANGED", "ON", "scroll_view.js [ " + spineItem.href + " ]");
            updatePageViewSizeAndPagination();
        });

        pageView.render();

        var docWillChange = true;
        if (_viewSettings) pageView.setViewSettings(_viewSettings, docWillChange);

        if (!isTemporaryView) {
            pageView.element().data("pageView", pageView);
        }


        if (isContinuousScroll)
        {
            pageView.decorateIframe();
        }

        return pageView;
    }

    function findPageViewForSpineItem(spineItem, reverse) {

        var retView = undefined;

        forEachItemView(function (pageView) {
            if (pageView.currentSpineItem() == spineItem) {
                retView = pageView;
                //brake the iteration
                return false;
            }
            else {
                return true;
            }

        }, reverse);

        return retView;
    }

    function forEachItemView(func, reverse) {

        var pageNodes = _$contentFrame.children();

        var count = pageNodes.length;
        var iter = reverse ? function(ix) { return ix - 1}
                           : function(ix) { return ix + 1};

        var compare = reverse ? function(ix) { return ix >= 0}
                              : function(ix) { return ix < count };

        var start = reverse ? count - 1 : 0;

        for (var i = start; compare(i); i = iter(i)) {

            var $element = pageNodes.eq(i);
            var curView = $element.data("pageView");

            if (curView) {

                if (func(curView) === false) {
                    return;
                }
            }
        }
    }

    function firstLoadedView() {

        var firstView = undefined;

        forEachItemView(function (pageView) {

            firstView = pageView;
            return false;

        }, false);

        return firstView;
    }

    function lastLoadedView() {

        var lastView = undefined;

        forEachItemView(function (pageView) {
            lastView = pageView;
            return false;

        }, true);

        return lastView;
    }

    function onPageViewLoaded(pageView, success, $iframe, spineItem, isNewlyLoaded, context) {

        if (success && isNewlyLoaded) {
            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "scroll_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
        }

    }

    function loadSpineItem(spineItem, callback) {

        removeLoadedItems();

        var scrollPos = scrollTop();

        var loadedView = createPageViewForSpineItem(spineItem);

        _$contentFrame.append(loadedView.element());

        loadedView.loadSpineItem(spineItem, function (success, $iframe, spineItem, isNewlyLoaded, context) {

            if (success) {

                updatePageViewSize(loadedView);
                onPageViewLoaded(loadedView, success, $iframe, spineItem, isNewlyLoaded, context);
                //callback(loadedView);
                // No need for complicated reachStableContentHeight any more
                //reachStableContentHeight(1, loadedView, $iframe[0], spineItem.href, spineItem.isFixedLayout(), spineItem.isFixedLayout() ? loadedView.meta_width() : 0, "openPage", continueCallback); // //onIFrameLoad called before this callback, so okay.
            }
            else {
                console.error("Unable to load " + spineItem.href);

                removePageView(loadedView);
                loadedView = undefined;
            }

            callback(loadedView);

        });

    }

    this.applyStyles = function () {

        Helpers.setStyles(_userStyles.getStyles(), _$el.parent());

        //because left, top, bottom, right setting ignores padding of parent container
        //we have to take it to account manually
        var elementMargins = Helpers.Margins.fromElement(_$el);

        setFrameSizesToRectangle(elementMargins.padding);

    };

    this.applyBookStyles = function () {

        forEachItemView(function (pageView) {
            pageView.applyBookStyles();
        }, false);
    };


    this.openPageInternal = function (pageRequest) {

        _stopTransientViewUpdate = true;

        //local helper function
        var doneLoadingSpineItem = function (pageView, pageRequest) {

            _deferredPageRequest = undefined;
            openPageViewElement(pageView, pageRequest);
            _stopTransientViewUpdate = false;
            updateTransientViews(pageView);
        };

        if (pageRequest.spineItem) {

            var pageView = findPageViewForSpineItem(pageRequest.spineItem);
            if (pageView) {
                doneLoadingSpineItem(pageView, pageRequest);
            }
            else {
                _deferredPageRequest = pageRequest;
                _isLoadingNewSpineItemOnPageRequest = true;

                loadSpineItem(pageRequest.spineItem, function (pageView) {

                    setTimeout(function () {
                        _isLoadingNewSpineItemOnPageRequest = false;
                    }, ON_SCROLL_TIME_DALAY + 100);

                    if (pageView && _deferredPageRequest) {
                        if (pageView.currentSpineItem() === _deferredPageRequest.spineItem) {
                            doneLoadingSpineItem(pageView, _deferredPageRequest);
                        }
                        else { //while we where waiting for load new request come
                            self.openPage(_deferredPageRequest); //recursion
                        }
                    }
                    else {
                        onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
                    }

                });
            }
        }
        else {
            doneLoadingSpineItem(undefined, pageRequest);
        }
    };

    this.openPage = function(pageRequest) {
        this.resetCurrentPosition();
        _currentPageRequest = pageRequest;
        this.openPageInternal(pageRequest);
    }

    function openPageViewElement(pageView, pageRequest) {

        var topOffset = 0;
        var pageCount;
        var $element;
        var sfiNav;
        var pageRange;

        if (pageRequest.scrollTop !== undefined) {

            topOffset = pageRequest.scrollTop;
        }
        else if (pageRequest.spineItemPageIndex !== undefined) {

            var pageIndex;
            pageCount = calculatePageCount();
            if (pageRequest.spineItemPageIndex < 0) {
                pageIndex = 0;
            }
            else if (pageRequest.spineItemPageIndex >= pageCount) {
                pageIndex = pageCount - 1;
            }
            else {
                pageIndex = pageRequest.spineItemPageIndex;
            }

            topOffset = pageIndex * viewHeight();
        }
        else if (pageView && pageRequest.elementId) {

            pageRange = getPageViewRange(pageView);
            sfiNav = pageView.getNavigator();
            $element = sfiNav.getElementById(pageRequest.elementId);

            if (!$element || !$element.length) {
                console.warn("Element id=" + pageRequest.elementId + " not found!");
                return;
            }

            if (isElementVisibleOnScreen(pageView, $element, 60)) {
                //TODO refactoring required
                // this is artificial call because MO player waits for this event to continue playing.
                onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
                return;
            }

            var elementRange = getElementRange(pageView, $element);
            topOffset = elementRange.top + pageRange.top;

        }
        else if (pageView && pageRequest.elementCfi) {

            pageRange = getPageViewRange(pageView);
            sfiNav = pageView.getNavigator();

            var domRange = sfiNav.getDomRangeFromRangeCfi(pageRequest.elementCfi);            
            if (!domRange) {
                console.warn("Range for cfi=" + pageRequest.elementCfi + " not found!");
                return;
            }
            
            var domRangeAsRange = getDomRangeAsRange(pageView, domRange);
            if (isRangeIsVisibleOnScreen(domRangeAsRange, 60)) {
                //TODO refactoring required
                // this is artificial call because MO player waits for this event to continue playing.
                onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
                return;
            }

            topOffset = domRangeAsRange.top;

        }
        else if (pageRequest.firstPage) {

            topOffset = 0;
        }
        else if (pageRequest.lastPage) {
            pageCount = calculatePageCount();

            if (pageCount === 0) {
                return;
            }

            topOffset = scrollHeight() - viewHeight() - 5;
        }
        else if (pageView) {

            pageRange = getPageViewRange(pageView);
            topOffset = pageRange.top;
        }
        else {
            topOffset = 0;
        }

        if (scrollTop() != topOffset) {

            _isSettingScrollPosition = true;
            scrollTo(topOffset, pageRequest);

            setTimeout(function () {
                _isSettingScrollPosition = false;
            }, ON_SCROLL_TIME_DALAY + 100); //we have to wait more than scroll delay to make sure that we don't react on onScroll

        }
        else {
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
    }

    function calculatePageCount() {

        return Math.ceil(scrollHeight() / viewHeight());
    }

    function onPaginationChanged(initiator, paginationRequest_spineItem, paginationRequest_elementId) {
        
        Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "EMIT", "scroll_view.js");
        self.emit(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, {
            paginationInfo: self.getPaginationInfo(),
            initiator: initiator,
            spineItem: paginationRequest_spineItem,
            elementId: paginationRequest_elementId
        });
    }

    function scrollTop() {
        return _$contentFrame[0].scrollTop;
    }

    function scrollBottom() {
        return scrollHeight() - (scrollTop() + viewHeight());
    }

    function viewHeight() {
        return _$contentFrame.height();
    }

    function scrollHeight() {
        return _$contentFrame[0].scrollHeight;
    }

    this.openPageNext = function (initiator) {

        var pageRequest;

        if (scrollBottom() > 0) {

            pageRequest = new PageOpenRequest(undefined, initiator);
            pageRequest.scrollTop = scrollTop() + Math.min(scrollBottom(), viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);
            openPageViewElement(undefined, pageRequest);
        }

    };

    this.openPagePrev = function (initiator) {

        var pageRequest;

        if (scrollTop() > 0) {

            pageRequest = new PageOpenRequest(undefined, initiator);
            pageRequest.scrollTop = scrollTop() - (viewHeight() - SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);
            if (pageRequest.scrollTop < 0) {
                pageRequest.scrollTop = 0;
            }

            openPageViewElement(undefined, pageRequest);
        }
    };

    function getVisiblePageViews() {

        var views = [];

        var range = getVisibleRange(-SCROLL_MARGIN_TO_SHOW_LAST_VISBLE_LINE);

        forEachItemView(function (pageView) {

            if (isPageViewVisibleInRange(pageView, range)) {

                views.push(pageView);
            }
            else if (views.length > 0) {

                return false;
            }

            return true;

        }, false);

        return views;

    }


    function getFirstVisiblePageView() {

        var visibleViews = getVisiblePageViews();

        return visibleViews[0];
    }

    function isPageViewVisibleInRange(pageView, range) {
        var pageViewRange = getPageViewRange(pageView);
        return rangeLength(intersectRanges(pageViewRange, range)) > 0;
    }

    function getPageViewRange(pageView) {
        var range = {top: 0, bottom: 0};

        var el = pageView.element();
        var pos = el.position();
        
        if (_jQueryPositionNeedsFix) {
            var offsetParent = el.offsetParent();
            pos.top -= offsetParent.scrollTop();
            pos.left -= offsetParent.scrollLeft();
        }

        range.top = pos.top + scrollTop();
        range.bottom = range.top + pageView.getCalculatedPageHeight();

        return range;
    }

    this.getPaginationInfo = function () {
        var spineItem;
        var pageCount;
        var pageView;
        var pageViewRange;
        var heightAboveViewport;
        var heightBelowViewport;
        var pageCountAbove;
        var pageCountBelow;

        var viewPortRange = getVisibleRange();
        var viewPortHeight = viewPortRange.bottom - viewPortRange.top;

        var paginationInfo = new CurrentPagesInfo(_spine, false);

        var visibleViews = getVisiblePageViews();

        for (var i = 0, count = visibleViews.length; i < count; i++) {

            pageView = visibleViews[i];
            spineItem = pageView.currentSpineItem();
            pageViewRange = getPageViewRange(pageView);

            heightAboveViewport = Math.max(viewPortRange.top - pageViewRange.top, 0);
            heightBelowViewport = Math.max(pageViewRange.bottom - viewPortRange.bottom, 0);

            pageCountAbove = Math.ceil(heightAboveViewport / viewPortHeight);
            pageCountBelow = Math.ceil(heightBelowViewport / viewPortHeight);
            pageCount = pageCountAbove + pageCountBelow + 1;

            paginationInfo.addOpenPage(pageCountAbove, pageCount, spineItem.idref, spineItem.index);
        }

        return paginationInfo;
    };

    this.bookmarkCurrentPage = function () {
        
        return self.getFirstVisibleCfi();
    };


    this.getLoadedSpineItems = function () {
        var spineItems = [];

        forEachItemView(function (pageView) {
            spineItems.push(pageView.currentSpineItem());
        }, false);

        return spineItems;
    };

    this.getElement = function (spineItemIdref, selector) {
        var element = undefined;

        forEachItemView(function (pageView) {
            if(pageView.currentSpineItem().idref == spineItemIdref) {

                element = pageView.getNavigator().getElement(selector);

                return false;
            }

            return true;

        }, false);

        return element;
    };

    this.getElementById = function(spineItemIdref, id) {
        var found = undefined;

        forEachItemView(function (pageView) {
            if (pageView.currentSpineItem().idref == spineItemIdref) {

                found = pageView.getNavigator().getElementById(id);
                return false;
            }

            return true;

        }, false);

        if (!found) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return found;
    };

    this.getElementByCfi = function (spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {
        var found = undefined;

        forEachItemView(function (pageView) {
            if (pageView.currentSpineItem().idref == spineItemIdref) {

                found = pageView.getNavigator().getElementByCfi(cfi, classBlacklist, elementBlacklist, idBlacklist);
                return false;
            }

            return true;

        }, false);

        if (!found) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return found;

    };

    function callOnVisiblePageView(iterator) {
        var viewPortRange = getVisibleRange();

        var result = undefined;
        var normalizedRange = {top: 0, bottom: 0};
        var pageViewRange;

        var steppedToVisiblePage = false;

        forEachItemView(function (pageView) {
            pageViewRange = getPageViewRange(pageView);

            normalizedRange.top = Math.max(pageViewRange.top, viewPortRange.top) - pageViewRange.top;
            normalizedRange.bottom = Math.min(pageViewRange.bottom, viewPortRange.bottom) - pageViewRange.top;

            if (rangeLength(normalizedRange) > 0) {
                steppedToVisiblePage = true;

                result = iterator(pageView, normalizedRange);
                if (result) {
                    return false;
                }
            }
            else if (steppedToVisiblePage) {
                return false;
            }

            return true; //continue iteration

        }, false);

        return result;
    }

    this.getFirstVisibleMediaOverlayElement = function () {
        return callOnVisiblePageView(function (pageView, pageRange) {
            return pageView.getNavigator().getFirstVisibleMediaOverlayElement(pageRange);
        });
    };

    // /**
    //  * @deprecated
    //  */
    // this.getVisibleMediaOverlayElements = function() {
    //     var viewPortRange = getVisibleRange();
    //
    //     var pageMoElements;
    //     var moElements = [];
    //     var normalizedRange = {top: 0, bottom: 0};
    //     var pageViewRange;
    //
    //     forEachItemView(function(pageView){
    //         pageViewRange = getPageViewRange(pageView);
    //
    //         normalizedRange.top = Math.max(pageViewRange.top, viewPortRange.top) - pageViewRange.top;
    //         normalizedRange.bottom = Math.min(pageViewRange.bottom, viewPortRange.bottom) - pageViewRange.top;
    //
    //         if(rangeLength(normalizedRange) > 0) {
    //             pageMoElements = pageView.getNavigator().getVisibleMediaOverlayElements(normalizedRange);
    //             moElements.push.apply(moElements, pageMoElements);
    //         }
    //     }, false);
    //
    //     return moElements;
    // };

    function getVisibleRange(expand) {
        if (expand !== 0 && !expand) {
            expand = 0;
        }

        var range = {

            top: scrollTop() - expand,
            bottom: scrollTop() + viewHeight() + expand
        };

        if (range.top < 0) {
            range.top = 0;
        }

        if (range.bottom > scrollHeight()) {
            range.bottom = scrollHeight();
        }

        return range;

    }

    function intersectRanges(r1, r2) {
        return {

            top: Math.max(r1.top, r2.top),
            bottom: Math.min(r1.bottom, r2.bottom)
        };
    }

    function rangeLength(range) {
        if (range.bottom < range.top) {
            return 0;
        }

        return range.bottom - range.top;
    }

    function isElementVisibleOnScreen(pageView, $element, percentVisible) {

        var elementRange = getElementRange(pageView, $element);

        return isRangeIsVisibleOnScreen(elementRange, percentVisible);
    }

    function isRangeIsVisibleOnScreen(range, percentVisible) {

        var visibleRange = getVisibleRange();

        var smallestVisibleLength = Math.min(rangeLength(visibleRange), rangeLength(range));
        if (smallestVisibleLength === 0) {
            smallestVisibleLength = 5; // if element is 0 height we will set it to arbitrary 5 pixels - not to divide by 0
        }

        var intersectionRange = intersectRanges(visibleRange, range);

        var visiblePercent = (rangeLength(intersectionRange) / smallestVisibleLength) * 100;

        return visiblePercent >= percentVisible;
    }

    function getElementRange(pageView, $element) {

        var pageRange = getPageViewRange(pageView);

        var elementRange = {top: 0, bottom: 0};
        elementRange.top = $element.offset().top + pageRange.top;
        elementRange.bottom = elementRange.top + $element.height();

        return elementRange;
    }
    
    function getDomRangeAsRange(pageView, domRange) {

        var pageRange = getPageViewRange(pageView);

        var elementRange = {top: 0, bottom: 0};
        var boundingClientRect = domRange.getBoundingClientRect();
        elementRange.top = boundingClientRect.top + pageRange.top;
        elementRange.bottom = elementRange.top + boundingClientRect.height;

        return elementRange;
    }

    this.insureElementVisibility = function (spineItemId, element, initiator) {
        var pageView = undefined;

        forEachItemView(function (pv) {
            if (pv.currentSpineItem().idref === spineItemId) {

                pageView = pv;
                return false;
            }

            return true;
        }, false);

        if (!pageView) {
            console.warn("Page for element " + element + " not found");
            return;
        }

        var $element = $(element);

        var elementRange = getElementRange(pageView, $element);

        if (!isRangeIsVisibleOnScreen(elementRange, 60)) {

            var spineItem = _spine.getItemById(spineItemId);
            var openPageRequest = new PageOpenRequest(spineItem, initiator);
            openPageRequest.scrollTop = elementRange.top;

            self.openPage(openPageRequest);
        }

    };

    this.getVisibleElements = function(selector, includeSpineItem) {
        var elements = [];
        forEachItemView(function (pageView) {
            if (includeSpineItem) {
                elements.push({elements: pageView.getVisibleElements(selector), spineItem: pageView.currentSpineItem()});
            } else {
                elements = _.flatten([elements, pageView.getVisibleElements(selector)], true);
            }
        });
        return elements;
    };

    this.getVisibleElementsWithFilter = function(filterFunction) {

        console.warn('getVisibleElementsWithFilter: Not implemented yet for scroll_view');
    };

    this.isElementVisible = function($element){

        console.warn('isElementVisible: Not implemented yet for scroll_view');
    };

    this.getElements = function(spineItemIdref, selector) {
        var pageView = findPageViewForSpineItem(spineItemIdref);
        if (pageView) {
            return pageView.getElements(spineItemIdref, selector);
        }
    };

    this.isNodeFromRangeCfiVisible = function (spineIdref, partialCfi) {
        var pageView = findPageViewForSpineItem(spineIdRef);
        if (pageView) {
            return pageView.isNodeFromRangeCfiVisible(spineIdRef, partialCfi);
        }
    };

    this.isVisibleSpineItemElementCfi = function (spineIdRef, partialCfi) {
        var pageView = findPageViewForSpineItem(spineIdRef);
        if (pageView) {
            return pageView.isVisibleSpineItemElementCfi(spineIdRef, partialCfi);
        }
    };

    this.getNodeRangeInfoFromCfi = function(spineIdRef, partialCfi){
        var pageView = findPageViewForSpineItem(spineIdRef);
        if (pageView) {
            return pageView.isVisibleSpineItemElementCfi(spineIdRef, partialCfi);
        }
    };
    
    function getFirstOrLastVisibleCfi(pickerFunc) {
        var pageViews = getVisiblePageViews();
        var selectedPageView = pickerFunc(pageViews);
        var pageViewTopOffset =selectedPageView.element().position().top;
        var visibleContentOffsets, frameDimensions;

        visibleContentOffsets = {
            top:  Math.min(0, pageViewTopOffset),
            left: 0
        };

        var height = Math.min(selectedPageView.element().height(), viewHeight());

        if (pageViewTopOffset >= 0) {
            height = height - pageViewTopOffset;
        }
        
        frameDimensions = {
            width: selectedPageView.element().width(),
            height: height
        };
        
        var cfiFunctions = [
            selectedPageView.getFirstVisibleCfi,
            selectedPageView.getLastVisibleCfi
        ];
        
        return pickerFunc(cfiFunctions)(visibleContentOffsets, frameDimensions);
    }
    
    this.getFirstVisibleCfi = function () {
        
        return getFirstOrLastVisibleCfi(_.first);
    };

    this.getLastVisibleCfi = function () {
        
        return getFirstOrLastVisibleCfi(_.last);
    };

    this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        if (rangeCfi2 && rangeCfi.idref !== rangeCfi2.idref) {
            console.error("getDomRangeFromRangeCfi: both CFIs must be scoped under the same spineitem idref");
            return undefined;
        }

        rangeCfi = rangeCfi || {};
        rangeCfi2 = rangeCfi2 || {};

        return callOnVisiblePageView(function (pageView) {
            if (pageView.currentSpineItem().idref === rangeCfi.idref) {
                return pageView.getDomRangeFromRangeCfi(rangeCfi.contentCFI, rangeCfi2.contentCFI, inclusive);
            }
        });
    };

    function createBookmarkFromCfi(currentSpineItem, cfi){
        return new BookmarkData(currentSpineItem.idref, cfi);
    }

    this.getRangeCfiFromDomRange = function (domRange) {
        return callOnVisiblePageView(function (pageView) {
            return pageView.getRangeCfiFromDomRange(domRange);
        });
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint) {
        return callOnVisiblePageView(function (pageView) {
            return createBookmarkFromCfi(pageView.currentSpineItem(), pageView.getVisibleCfiFromPoint(x, y, precisePoint));
        });
    };

    this.getRangeCfiFromPoints = function (startX, startY, endX, endY) {
        return callOnVisiblePageView(function (pageView) {
            return createBookmarkFromCfi(pageView.currentSpineItem(), pageView.getRangeCfiFromPoints(startX, startY, endX, endY));
        });
    };

    this.getCfiForElement = function(element) {
        return callOnVisiblePageView(function (pageView) {
            return createBookmarkFromCfi(pageView.currentSpineItem(), pageView.getCfiForElement(element).contentCFI);
        })
    };

    this.getElementFromPoint = function (x, y) {
        return callOnVisiblePageView(function (pageView) {
            return pageView.getElementFromPoint(x, y);
        });
    };

    this.getStartCfi = function () {
        return callOnVisiblePageView(function (pageView) {
            return pageView.getStartCfi();
        });
    };

    this.getEndCfi = function () {
        return callOnVisiblePageView(function (pageView) {
            return pageView.getEndCfi();
        });
    };

    this.getNearestCfiFromElement = function (element) {
        return callOnVisiblePageView(function (pageView) {
            return pageView.getNearestCfiFromElement(element);
        });
    };
};

return ScrollView;
});

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

define('readium_shared_js/views/media_overlay_player',["../globals", "jquery", "../helpers", "./audio_player", "./media_overlay_element_highlighter", "../models/smil_iterator", "rangy", 'readium_cfi_js', './scroll_view'],
    function(Globals, $, Helpers, AudioPlayer, MediaOverlayElementHighlighter, SmilIterator, rangy, epubCfi, ScrollView) {
/**
 *
 * @param reader
 * @param onStatusChanged
 * @constructor
 */
var MediaOverlayPlayer = function(reader, onStatusChanged) {


    var _smilIterator = undefined;

    var _audioPlayer = new AudioPlayer(onStatusChanged, onAudioPositionChanged, onAudioEnded, onPlay, onPause);

    var _ttsIsPlaying = false;
    var _currentTTS = undefined;
    var _enableHTMLSpeech = true && typeof window.speechSynthesis !== "undefined" && speechSynthesis != null; // set to false to force "native" platform TTS engine, rather than HTML Speech API
    
    var _SpeechSynthesisUtterance = undefined;
    //var _skipTTSEndEvent = false;
    var TOKENIZE_TTS = false;

    var _embeddedIsPlaying = false;
    var _currentEmbedded = undefined;


    this.isPlaying = function()
    {
        return _audioPlayer.isPlaying() || _ttsIsPlaying || _embeddedIsPlaying || _blankPagePlayer;
    }

    //var _currentPagination = undefined;
    var _package = reader.package();
    var _settings = reader.viewerSettings();
    var self = this;
    var _elementHighlighter = new MediaOverlayElementHighlighter(reader);

    reader.on(Globals.Events.READER_VIEW_DESTROYED, function(){
        Globals.logEvent("READER_VIEW_DESTROYED", "ON", "media_overlay_player.js");
        
        self.reset();
    });


    this.applyStyles = function()
    {
        _elementHighlighter.reDo();
    };

//
// should use this.onSettingsApplied() instead!
//    this.setRate = function(rate) {
//        _audioPlayer.setRate(rate);
//    };
//    this.setVolume = function(volume) {
//        _audioPlayer.setVolume(volume);
//    };


    this.onSettingsApplied = function() {
//console.debug(_settings);
        _audioPlayer.setRate(_settings.mediaOverlaysRate);
        _audioPlayer.setVolume(_settings.mediaOverlaysVolume / 100.0);
    };
    self.onSettingsApplied();
    
    reader.on(Globals.Events.SETTINGS_APPLIED, function() {
        
        Globals.logEvent("SETTINGS_APPLIED", "ON", "media_overlay_player.js");
        this.onSettingsApplied();
    }, this);

    /*
    var lastElement = undefined;
    var lastElementColor = "";
    */

    var _wasPlayingAtDocLoadStart = false;
    this.onDocLoadStart = function() {
        // 1) Globals.Events.CONTENT_DOCUMENT_LOAD_START
        // (maybe 2-page fixed-layout or reflowable spread == 2 documents == 2x events)
        // MOPLayer.onDocLoad()
        
        // 2) Globals.Events.CONTENT_DOCUMENT_LOADED
        // (maybe 2-page fixed-layout or reflowable spread == 2 documents == 2x events)
        //_mediaOverlayDataInjector.attachMediaOverlayData($iframe, spineItem, _viewerSettings);
        
        // 3) Globals.Events.PAGINATION_CHANGED (layout finished, notified before rest of app, just once)
        // MOPLayer.onPageChanged()

        var wasPlaying = self.isPlaying();
        if (wasPlaying)
        {
            _wasPlayingAtDocLoadStart = true;
            self.pause();
        }
    };
    
    var _lastPaginationData = undefined;
    
    this.onPageChanged = function(paginationData) {
        
        _lastPaginationData = paginationData;
        
        var wasPausedBecauseNoAutoNextSmil = _wasPausedBecauseNoAutoNextSmil;
        _wasPausedBecauseNoAutoNextSmil = false;
        
        var wasPlayingAtDocLoadStart = _wasPlayingAtDocLoadStart;
        _wasPlayingAtDocLoadStart = false;

        if(!paginationData) {
            self.reset();
            return;
        }

//        if (paginationData.paginationInfo)
//        {
//            _currentPagination = paginationData.paginationInfo;
//        }

        /*
        if (lastElement)
        {
            $(lastElement).css("background-color", lastElementColor);
            lastElement = undefined;
        }
        */

        var element = undefined;
        var isCfiTextRange = false;
        
        var fakeOpfRoot = "/99!";
        var epubCfiPrefix = "epubcfi";
        
        if (paginationData.elementId || paginationData.initiator == self)
        {
            var spineItems = reader.getLoadedSpineItems();

            var rtl = reader.spine().isRightToLeft();

            for(var i = (rtl ? (spineItems.length - 1) : 0); rtl && i >=0 || !rtl && i < spineItems.length; i += (rtl ? -1: 1))
            {
                var spineItem = spineItems[i];
                if (paginationData.spineItem && paginationData.spineItem != spineItem)
                {
                    continue;
                }
                
                if (paginationData.elementId && paginationData.elementId.indexOf(epubCfiPrefix) === 0)
                {
                    _elementHighlighter.reset(); // ensure clean DOM (no CFI span markers)
                    
                    var partial = paginationData.elementId.substr(epubCfiPrefix.length + 1, paginationData.elementId.length - epubCfiPrefix.length - 2);
                    
                    if (partial.indexOf(fakeOpfRoot) === 0)
                    {
                        partial = partial.substr(fakeOpfRoot.length, partial.length - fakeOpfRoot.length);
                    }
//console.log(partial);
                    var parts = partial.split(",");
                    if (parts && parts.length === 3)
                    {
                        try
                        {
                            var cfi = parts[0] + parts[1];
                            var $element = reader.getElementByCfi(spineItem.idref, cfi,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);

                            element = ($element && $element.length > 0) ? $element[0] : undefined;
                            if (element)
                            {
                                if (element.nodeType === Node.TEXT_NODE)
                                {
                                    element = element.parentNode;
                                }
                                break;
                            }
                        }
                        catch (error)
                        {
                            console.error(error);
                        }
                    }
                    else
                    {
                        try
                        {
                            //var cfi = "epubcfi(" + partial + ")";
                            //var $element = EPUBcfi.getTargetElementWithPartialCFI(cfi, DOC);
                            var $element = reader.getElementByCfi(spineItem.idref, partial,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
                                
                            element = ($element && $element.length > 0) ? $element[0] : undefined;
                            if (element)
                            {
                                if (element.nodeType === Node.TEXT_NODE)
                                {
                                    element = element.parentNode;
                                }
                                break;
                            }
                        }
                        catch (error)
                        {
                            console.error(error);
                        }
                    }
                }

                if (!element)
                {
                    if (paginationData.initiator == self && !paginationData.elementId)
                    {
                        var $element = reader.getElement(spineItem.idref, "body");
                        element = ($element && $element.length > 0) ? $element[0] : undefined;
                    }
                    else
                    {
                        var $element = reader.getElementById(spineItem.idref, paginationData.elementId);
                        element = ($element && $element.length > 0) ? $element[0] : undefined;
                        //("#" + Globals.Helpers.escapeJQuerySelector(paginationData.elementId))
                    }
                    
                    if (element)
                    {
                        /*
                        console.error("GREEN: " + paginationData.elementId);
                        lastElement = element;
                        lastElementColor = $(element).css("background-color");
                        $(element).css("background-color", "green");
                         */
                        break;
                    }
                }
            }

            if (!element)
            {
                console.error("paginationData.elementId BUT !element: " + paginationData.elementId);
            }
        }

        var wasPlaying = self.isPlaying() || wasPlayingAtDocLoadStart;

        if(!_smilIterator || !_smilIterator.currentPar) {
            if(paginationData.initiator !== self) {
                clipBeginOffset = 0.0;
                self.reset();

                if (paginationData.elementId && element)
                {
                    if (wasPlaying || wasPausedBecauseNoAutoNextSmil)
                    {
                        paginationData.elementIdResolved = element;
                        self.toggleMediaOverlayRefresh(paginationData);
                    }
                }
                else if (wasPlaying || wasPausedBecauseNoAutoNextSmil)
                {
                    self.toggleMediaOverlay();
                }
                return;
            }

            //paginationData.initiator === self
//
//            if (!paginationData.elementId)
//            {
//                console.error("!paginationData.elementId");
//                clipBeginOffset = 0.0;
//                return;
//            }

            if(!element)
            {
                console.error("!element: " + paginationData.elementId);
                clipBeginOffset = 0.0;
                return;
            }

            var moData = $(element).data("mediaOverlayData");
            if(!moData) {
                console.error("!moData: " + paginationData.elementId);
                clipBeginOffset = 0.0;
                return;
            }

            var parToPlay = moData.par ? moData.par : moData.pars[0];

            if (moData.pars)
            {
                for (var iPar = 0; iPar < moData.pars.length; iPar++)
                {
                    var p = moData.pars[iPar];
                    
                    if (paginationData.elementId === p.cfi.smilTextSrcCfi)
                    {
                        parToPlay = p;
                        break;
                    }
                }
            }
            
            playPar(parToPlay);
            return;
        }

        var noReverseData = !_smilIterator.currentPar.element && !_smilIterator.currentPar.cfi;
        if(noReverseData) {
            console.error("!! _smilIterator.currentPar.element ??");
        }

//console.debug("+++> paginationData.elementId: " + paginationData.elementId + " /// " + _smilIterator.currentPar.text.srcFile + " # " + _smilIterator.currentPar.text.srcFragmentId); //PageOpenRequest.elementId


        if(paginationData.initiator == self)
        {
            var notSameTargetID = paginationData.elementId && paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId;

            if(notSameTargetID) {
                console.error("!! paginationData.elementId !== _smilIterator.currentPar.text.srcFragmentId");
            }

            if(notSameTargetID || noReverseData) {
                clipBeginOffset = 0.0;
                return;
            }

            if(wasPlaying)
            {
                highlightCurrentElement();
            }
            else
            {
                playCurrentPar();
            }
        }
        else
        {
            if(!wasPlaying && !wasPausedBecauseNoAutoNextSmil)
            {
                self.reset();
                return;
            }

            if(!paginationData.elementId)
            {
                //self.reset();
            }

            if(paginationData.elementId && !element)
            {
                //self.reset();
                return;
            }

            if(paginationData.elementId)
            {
                paginationData.elementIdResolved = element;
            }
            
            self.toggleMediaOverlayRefresh(paginationData);
        }
    };

    function playPar(par) {

        var parSmil = par.getSmil();
        if(!_smilIterator || _smilIterator.smil != parSmil)
        {
            _smilIterator = new SmilIterator(parSmil);
        }
        else {
            _smilIterator.reset();
        }

        _smilIterator.goToPar(par);

        if(!_smilIterator.currentPar) {
            console.error("playPar !_smilIterator.currentPar");
            return;
        }

        playCurrentPar();
    }

    var clipBeginOffset = 0.0;

    var _blankPagePlayer = undefined;

    function initBlankPagePlayer()
    {
        self.resetBlankPage();

        _blankPagePlayer = setTimeout(function() {

            if (!_blankPagePlayer)
            {
                return;
            }

            self.resetBlankPage();

            if (!_smilIterator || !_smilIterator.currentPar)
            {
                self.reset();
                return;
            }

            audioCurrentTime = 0.0;
//console.log("BLANK END.");
            //nextSmil(true);
            onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 2);

        }, 2000);

        onStatusChanged({isPlaying: true});
    }

    function playCurrentPar() {
        _wasPlayingScrolling = false;
        
        if (!_smilIterator || !_smilIterator.currentPar)
        {
            console.error("playCurrentPar !_smilIterator || !_smilIterator.currentPar ???");
            return;
        }

        if (!_smilIterator.smil.id)
        {
            _audioPlayer.reset();

            self.resetTTS();
            self.resetEmbedded();

            setTimeout(function()
            {
                initBlankPagePlayer();
            }, 100);

            return;
        }
        else if (!_smilIterator.currentPar.audio.src)
        {
            clipBeginOffset = 0.0;

//            if (_currentTTS)
//            {
//                _skipTTSEnded = true;
//            }

            _audioPlayer.reset();

            var element = _smilIterator.currentPar.element;
            if (element)
            {
                audioCurrentTime = 0.0;

                var name = element.nodeName ? element.nodeName.toLowerCase() : undefined;

                if (name === "audio" || name === "video")
                {
                    self.resetTTS();
                    self.resetBlankPage();

                    if (_currentEmbedded)
                    {
                        self.resetEmbedded();
                    }

                    _currentEmbedded = element;

                    _currentEmbedded.pause();

                    // DONE at reader_view.attachMO()
                    //$(_currentEmbedded).attr("preload", "auto");

                    _currentEmbedded.currentTime = 0;

                    _currentEmbedded.play();

                    $(_currentEmbedded).on("ended", self.onEmbeddedEnd);

                    _embeddedIsPlaying = true;
                    
                    // gives the audio player some dispatcher time to raise the onPause event
                    setTimeout(function(){
                        onStatusChanged({isPlaying: true});
                    }, 80);

//                    $(element).on("seeked", function()
//                    {
//                        $(element).off("seeked", onSeeked);
//                    });
                }
                else
                {
                    self.resetEmbedded();
                    self.resetBlankPage();

                    _currentTTS = element.textContent; //.innerText (CSS display sensitive + script + style tags)
                    if (!_currentTTS || _currentTTS == "")
                    {
                        _currentTTS = undefined;
                    }
                    else
                    {
                        speakStart(_currentTTS);
                    }
                }
            }
            
            var cfi = _smilIterator.currentPar.cfi;
            if (cfi)
            {
                audioCurrentTime = 0.0;
                self.resetEmbedded();
                self.resetBlankPage();

                _elementHighlighter.reset(); // ensure clean DOM (no CFI span markers)
                
                var doc = cfi.cfiTextParent.ownerDocument;

                var startCFI = "epubcfi(" + cfi.partialStartCfi + ")";
                var infoStart = EPUBcfi.getTextTerminusInfoWithPartialCFI(startCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoStart);

                var endCFI = "epubcfi(" + cfi.partialEndCfi + ")";
                var infoEnd = EPUBcfi.getTextTerminusInfoWithPartialCFI(endCFI, doc,
                ["cfi-marker", "mo-cfi-highlight"],
                [],
                ["MathJax_Message"]);
//console.log(infoEnd);

                if (rangy)
                {
                    //infoStart.textNode.parentNode.ownerDocument
                    var range = rangy.createRange(doc); //createNativeRange
                    range.setStartAndEnd(
                        infoStart.textNode, infoStart.textOffset,
                        infoEnd.textNode, infoEnd.textOffset
                    );
                    _currentTTS = range.toString(); //.text()
                }
                else
                {
                    _currentTTS = undefined;
                }

                if (!_currentTTS || _currentTTS == "")
                {
                    _currentTTS = undefined;
                }
                else
                {
                    speakStart(_currentTTS);
                }
            }
        }
        else
        {
            self.resetTTS();
            self.resetEmbedded();
            self.resetBlankPage();

            var dur = _smilIterator.currentPar.audio.clipEnd - _smilIterator.currentPar.audio.clipBegin;
            if (dur <= 0 || clipBeginOffset > dur)
            {
                console.error("### MO XXX PAR OFFSET: " + clipBeginOffset + " / " + dur);
                clipBeginOffset = 0.0;
            }
            else
            {
//console.debug("### MO PAR OFFSET: " + clipBeginOffset);
            }

            var audioContentRef = Helpers.ResolveContentRef(_smilIterator.currentPar.audio.src, _smilIterator.smil.href);

            var audioSource = _package.resolveRelativeUrlMO(audioContentRef);

            var startTime = _smilIterator.currentPar.audio.clipBegin + clipBeginOffset;

//console.debug("PLAY START TIME: " + startTime + "("+_smilIterator.currentPar.audio.clipBegin+" + "+clipBeginOffset+")");

            _audioPlayer.playFile(_smilIterator.currentPar.audio.src, audioSource, startTime); //_smilIterator.currentPar.element ? _smilIterator.currentPar.element : _smilIterator.currentPar.cfi.cfiTextParent
        }

        clipBeginOffset = 0.0;

        highlightCurrentElement();
    }

    function nextSmil(goNext)
    {
        self.pause();

//console.debug("current Smil: " + _smilIterator.smil.href + " /// " + _smilIterator.smil.id);

        var nextSmil = goNext ? _package.media_overlay.getNextSmil(_smilIterator.smil) : _package.media_overlay.getPreviousSmil(_smilIterator.smil);
        if(nextSmil) {

//console.debug("nextSmil: " + nextSmil.href + " /// " + nextSmil.id);

            _smilIterator = new SmilIterator(nextSmil);
            if(_smilIterator.currentPar) {
                if (!goNext)
                {
                    while (!_smilIterator.isLast())
                    {
                        _smilIterator.next();
                    }
                }

//console.debug("openContentUrl (nextSmil): " + _smilIterator.currentPar.text.src + " -- " + _smilIterator.smil.href);

                reader.openContentUrl(_smilIterator.currentPar.text.src, _smilIterator.smil.href, self);
            }
        }
        else
        {
            console.log("No more SMIL");
            self.reset();
        }
    }


    var _skipAudioEnded = false;
//    var _skipTTSEnded = false;

    var audioCurrentTime = 0.0;

    var DIRECTION_MARK = -999;

//    var _letPlay = false;

//from
//1 = audio player
//2 = blank page
//3 = video/audio embbeded
//4 = TTS
//5 = audio end
//6 = user previous/next/escape
    function onAudioPositionChanged(position, from, skipping) { //noLetPlay

        audioCurrentTime = position;

//        if (_letPlay)
//        {
//            return;
//        }

        _skipAudioEnded = false;
//        _skipTTSEnded = false;

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            return;
        }

        var parFrom = _smilIterator.currentPar;
        
        var audio = _smilIterator.currentPar.audio;

        //var TOLERANCE = 0.05;
        if(
            //position >= (audio.clipBegin - TOLERANCE) &&
        position > DIRECTION_MARK &&
            position <= audio.clipEnd) {

//console.debug("onAudioPositionChanged: " + position);
            return;
        }

        _skipAudioEnded = true;

//console.debug("PLAY NEXT: " + "(" + audio.clipBegin + " -- " + audio.clipEnd + ") [" + from + "] " +  position);
//console.debug(_smilIterator.currentPar.text.srcFragmentId);

        var isPlaying = _audioPlayer.isPlaying();
        if (isPlaying && from === 6)
        {
            console.debug("from userNav _audioPlayer.isPlaying() ???");
        }

        var goNext = position > audio.clipEnd;

        var doNotNextSmil = !_autoNextSmil && from !== 6 && goNext;

        var spineItemIdRef = (_smilIterator && _smilIterator.smil && _smilIterator.smil.spineItemId) ? _smilIterator.smil.spineItemId : ((_lastPaginationData && _lastPaginationData.spineItem && _lastPaginationData.spineItem.idref) ? _lastPaginationData.spineItem.idref : undefined);
        if (doNotNextSmil && spineItemIdRef && _lastPaginationData && _lastPaginationData.paginationInfo && _lastPaginationData.paginationInfo.openPages && _lastPaginationData.paginationInfo.openPages.length > 1)
        {
            //var iPage = _lastPaginationData.paginationInfo.isRightToLeft ? _lastPaginationData.paginationInfo.openPages.length - 1 : 0;
            var iPage = 0;
            
            var openPage = _lastPaginationData.paginationInfo.openPages[iPage];
            if (spineItemIdRef === openPage.idref)
            {
                doNotNextSmil = false;
            }
        }
        
        if (goNext)
        {
            _smilIterator.next();
        }
        else //position <= DIRECTION_MARK
        {
            _smilIterator.previous();
        }

        if(!_smilIterator.currentPar)
        {
            //
            //        if (!noLetPlay)
            //        {
            //            _letPlay = true;
            //            setTimeout(function()
            //            {
            //                _letPlay = false;
            //                nextSmil(goNext);
            //            }, 200);
            //        }
            //        else
            //        {
            //            nextSmil(goNext);
            //        }

//console.debug("NEXT SMIL ON AUDIO POS");
        
            if (doNotNextSmil)
            {
                _wasPausedBecauseNoAutoNextSmil = true;
                self.reset();
                //self.pause();
            }
            else
            {
                nextSmil(goNext);
            }
            return;
        }

//console.debug("ITER: " + _smilIterator.currentPar.text.srcFragmentId);

        if(!_smilIterator.currentPar.audio) {
            self.pause();
            return;
        }
        
        if(_settings.mediaOverlaysSkipSkippables)
        {
            var skip = false;
            var parent = _smilIterator.currentPar;
            while (parent)
            {
                if (parent.isSkippable && parent.isSkippable(_settings.mediaOverlaysSkippables))
                {
                    skip = true;
                    break;
                }
                parent = parent.parent;
            }

            if (skip)
            {
                console.log("MO SKIP: " + parent.epubtype);

                self.pause();

                var pos = goNext ? _smilIterator.currentPar.audio.clipEnd + 0.1 : DIRECTION_MARK - 1;

                onAudioPositionChanged(pos, from, true); //noLetPlay
                return;
            }
        }

        // _settings.mediaOverlaysSynchronizationGranularity
        if (!isPlaying && (_smilIterator.currentPar.element || _smilIterator.currentPar.cfi && _smilIterator.currentPar.cfi.cfiTextParent))
        {
            var scopeTo = _elementHighlighter.adjustParToSeqSyncGranularity(_smilIterator.currentPar);
            if (scopeTo && scopeTo !== _smilIterator.currentPar)
            {
                var scopeFrom = _elementHighlighter.adjustParToSeqSyncGranularity(parFrom);
                if (scopeFrom && (scopeFrom === scopeTo || !goNext))
                {
                    if (scopeFrom === scopeTo)
                    {
                        do
                        {
                            if (goNext) _smilIterator.next();
                            else  _smilIterator.previous();
                        } while (_smilIterator.currentPar && _smilIterator.currentPar.hasAncestor(scopeFrom));

                        if (!_smilIterator.currentPar)
                        {
    //console.debug("adjustParToSeqSyncGranularity nextSmil(goNext)");

                            if (doNotNextSmil)
                            {
                                _wasPausedBecauseNoAutoNextSmil = true;
                                self.reset();
                                //self.pause();
                            }
                            else
                            {
                                nextSmil(goNext);
                            }
                            
                            return;
                        }
                    }
                    
//console.debug("ADJUSTED: " + _smilIterator.currentPar.text.srcFragmentId);
                    if (!goNext)
                    {
                        var landed = _elementHighlighter.adjustParToSeqSyncGranularity(_smilIterator.currentPar);
                        if (landed && landed !== _smilIterator.currentPar)
                        {
                            var backup = _smilIterator.currentPar;
                    
                            var innerPar = undefined;
                            do
                            {
                                innerPar = _smilIterator.currentPar;
                                _smilIterator.previous();
                            }
                            while (_smilIterator.currentPar && _smilIterator.currentPar.hasAncestor(landed));
                        
                            if (_smilIterator.currentPar)
                            {
                                _smilIterator.next();
                                
                                if (!_smilIterator.currentPar.hasAncestor(landed))
                                {
                                    console.error("adjustParToSeqSyncGranularity !_smilIterator.currentPar.hasAncestor(landed) ???");
                                }
                                //assert 
                            }
                            else
                            {
//console.debug("adjustParToSeqSyncGranularity reached begin");

                                _smilIterator.reset();
                                
                                if (_smilIterator.currentPar !== innerPar)
                                {
                                    console.error("adjustParToSeqSyncGranularity _smilIterator.currentPar !=== innerPar???");
                                }
                            }

                            if (!_smilIterator.currentPar)
                            {
                                console.error("adjustParToSeqSyncGranularity !_smilIterator.currentPar ?????");
                                _smilIterator.goToPar(backup);
                            }
                            
//console.debug("ADJUSTED PREV: " + _smilIterator.currentPar.text.srcFragmentId);
                        }
                    }
                }
            }
        }
        
        if(_audioPlayer.isPlaying()
            && _smilIterator.currentPar.audio.src
            && _smilIterator.currentPar.audio.src == _audioPlayer.currentSmilSrc()
                && position >= _smilIterator.currentPar.audio.clipBegin
                && position <= _smilIterator.currentPar.audio.clipEnd)
        {
//console.debug("ONLY highlightCurrentElement");
            highlightCurrentElement();
            return;
        }

        //position <= DIRECTION_MARK goes here (goto previous):

//            if (!noLetPlay && position > DIRECTION_MARK
//                && _audioPlayer.isPlaying() && _audioPlayer.srcRef() != _smilIterator.currentPar.audio.src)
//            {
//                _letPlay = true;
//                setTimeout(function()
//                {
//                    _letPlay = false;
//                    playCurrentPar();
//                }, 100);
//
//                playCurrentPar();
//
//                return;
//            }

        playCurrentPar();
    }

    this.touchInit = function()
    {
        return _audioPlayer.touchInit();
    };

    var tokeniseTTS = function(element)
    {
        var BLOCK_DELIMITERS = ['p', 'div', 'pagenum', 'td', 'table', 'li', 'ul', 'ol'];
        var BOUNDARY_PUNCTUATION = [',', ';', '.', '-', '??', '??', '?', '!'];
        var IGNORABLE_PUNCTUATION = ['"', '\'', '??', '??', '??', '??'];

        var flush = function(t, r)
        {
            if (t.word.length <= 0)
            {
                return;
            }

            var pos = t.text.length;
            r.spanMap[pos] = t.counter;
            t.text += t.word;
            t.markup += t.html.substring(0, t.wordStart) +
                '<span class="tts_off" id="tts_' + t.counter + '">' +
                t.html.substring(t.wordStart, t.wordEnd) +
                '</span>' + t.html.substring(t.wordEnd, t.html.length);
            t.word = "";
            t.html = "";
            t.wordStart = -1;
            t.wordEnd = -1;
            t.counter++;
        };

        var r =
        {
            element : element,
            innerHTML_tts : "",
            spanMap : {},
            text : "",
            lastCharIndex : undefined
        };
        r.element.innerHTML_original = element.innerHTML;

        var t =
        {
            inTag : false,
            counter : 0,
            wordStart : -1,
            wordEnd : -1,
            text : '',
            markup : '',
            word : '',
            html : ''
        };

        var limit = r.element.innerHTML_original.length;
        var i = 0;
        while (i <= limit)
        {
            if (t.inTag)
            {
                t.html += r.element.innerHTML_original[i];
                if (r.element.innerHTML_original[i] == ">") {
                    t.inTag = false;
                    // if it's a block element delimiter, flush
                    var blockCheck = t.html.match(/<\/(.*?)>$/);
                    if (blockCheck && BLOCK_DELIMITERS.indexOf(blockCheck[1]) > -1)
                    {
                        flush(t, r);
                        t.text += ' ';
                    }
                }
            }
            else
            {
                if (i == limit || r.element.innerHTML_original[i].match(/\s/))
                {
                    flush(t, r);

                    // append the captured whitespace
                    if (i < limit)
                    {
                        t.text += r.element.innerHTML_original[i];
                        t.markup += r.element.innerHTML_original[i];
                    }
                }
                else if (BOUNDARY_PUNCTUATION.indexOf(r.element.innerHTML_original[i]) > -1)
                {
                    flush(t, r);

                    t.wordStart = t.html.length;
                    t.wordEnd = t.html.length + 1;
                    t.word += r.element.innerHTML_original[i];
                    t.html += r.element.innerHTML_original[i];

                    flush(t, r);
                }
                else if (r.element.innerHTML_original[i] == "<")
                {
                    t.inTag = true;
                    t.html += r.element.innerHTML_original[i];
                }
                else
                {
                    if (t.word.length == 0)
                    {
                        t.wordStart = t.html.length;
                    }
                    t.wordEnd = t.html.length + 1;
                    t.word += r.element.innerHTML_original[i];
                    t.html += r.element.innerHTML_original[i];
                }
            }
            i++;
        }
//
//console.debug(t.text);
//        console.debug("----");
//console.debug(t.markup);

        r.text = t.text;
        r.innerHTML_tts = t.markup;
        r.element.innerHTML = r.innerHTML_tts;

        return r;
    };

    var $ttsStyle = undefined;
    function ensureTTSStyle($element)
    {
        if ($ttsStyle && $ttsStyle[0].ownerDocument === $element[0].ownerDocument)
        {
            return;
        }

        var style = ".tts_on{background-color:red;color:white;} .tts_off{}";

        $head = $("head", $element[0].ownerDocument.documentElement);

        $ttsStyle = $("<style type='text/css'> </style>").appendTo($head);

        $ttsStyle.append(style);
    }

    var speakStart = function(txt, volume)
    {
        var tokenData = undefined;
        var curPar = (_smilIterator && _smilIterator.currentPar) ? _smilIterator.currentPar : undefined;
        var element = curPar ? curPar.element : undefined;
        var cfi = curPar ? curPar.cfi : undefined;

        if (!volume || volume > 0)
        {
            // gives the audio player some dispatcher time to raise the onPause event
            setTimeout(function(){
                onStatusChanged({isPlaying: true});
            }, 80);
            
            _ttsIsPlaying = true;

            if (TOKENIZE_TTS && element)
            {
                var $el = $(element);
                ensureTTSStyle($el);


                if (element.innerHTML_original)
                {
                    element.innerHTML = element.innerHTML_original;
                    element.innerHTML_original = undefined;
                }
                tokenData = tokeniseTTS(element);
            }
        }

        if (!_enableHTMLSpeech)
        {
            Globals.logEvent("MEDIA_OVERLAY_TTS_SPEAK", "EMIT", "media_overlay_player.js");
            reader.emit(Globals.Events.MEDIA_OVERLAY_TTS_SPEAK, {tts: txt}); // resume if txt == undefined
            return;
        }

        if (!txt && window.speechSynthesis.paused)
        {
//console.debug("TTS resume");
            window.speechSynthesis.resume();

            return;
        }

        var text = txt || _currentTTS;

        if (text)
        {
            if (_SpeechSynthesisUtterance)
            {
//console.debug("_SpeechSynthesisUtterance nullify");

                if (TOKENIZE_TTS)
                {
                    if (_SpeechSynthesisUtterance.onend)
                    {
                        _SpeechSynthesisUtterance.onend({forceSkipEnd: true, target: _SpeechSynthesisUtterance});
                    }
                    
                    _SpeechSynthesisUtterance.tokenData = undefined;
                    
                    _SpeechSynthesisUtterance.onboundary = undefined;
    //                 _SpeechSynthesisUtterance.onboundary = function(event)
    //                 {
    // console.debug("OLD TTS boundary");
    //                 
    //                         event.target.tokenData = undefined;
    //  
    //                 };
                }

                _SpeechSynthesisUtterance.onend = undefined;
//                 _SpeechSynthesisUtterance.onend = function(event)
//                 {
// console.debug("OLD TTS ended");
//                     if (TOKENIZE_TTS)
//                     {
//                         event.target.tokenData = undefined;
//                     }
//                 };
                
                _SpeechSynthesisUtterance.onerror = undefined;
//                 _SpeechSynthesisUtterance.onerror = function(event)
//                 {
// console.debug("OLD TTS error");
// //console.debug(event);
//                     if (TOKENIZE_TTS)
//                     {
//                         event.target.tokenData = undefined;
//                     }
//                 };

                _SpeechSynthesisUtterance = undefined;
            }
//
//            if (window.speechSynthesis.pending ||
//                window.speechSynthesis.speaking)
//            {
//                _skipTTSEndEvent = true;
//            }
            
console.debug("paused: "+window.speechSynthesis.paused);
console.debug("speaking: "+window.speechSynthesis.speaking);
console.debug("pending: "+window.speechSynthesis.pending);

//             if (!window.speechSynthesis.paused)
//             {
// console.debug("TTS pause before speak");
//                 window.speechSynthesis.pause();
//             }
            
            function cancelTTS(first)
            {
                if (first || window.speechSynthesis.pending)
                {
    console.debug("TTS cancel before speak");
                    window.speechSynthesis.cancel();

                    setTimeout(function()
                    {
                        cancelTTS(false);
                    }, 5);
                }
                else
                {
                    updateTTS();
                }
            }
            cancelTTS(true);
            
            function updateTTS()
            {
            // setTimeout(function()
            // {

                _SpeechSynthesisUtterance = new SpeechSynthesisUtterance();

                if (TOKENIZE_TTS && tokenData)
                {
                    _SpeechSynthesisUtterance.tokenData = tokenData;
                
                    _SpeechSynthesisUtterance.onboundary = function(event)
                    //_SpeechSynthesisUtterance.addEventListener("boundary", function(event)
                    {
                        if (!_SpeechSynthesisUtterance)
                        {
                            return;
                        }

        console.debug("TTS boundary: " + event.name + " / " + event.charIndex);
        //console.debug(event);

                        var tokenised = event.target.tokenData;
                        if (!tokenised || !tokenised.spanMap.hasOwnProperty(event.charIndex))
                        {
                            return;
                        }

                        if (false && tokenised.lastCharIndex)
                        {
        //console.debug("TTS lastCharIndex: " + tokenised.lastCharIndex);
                            var id = 'tts_' + tokenised.spanMap[tokenised.lastCharIndex];
        //console.debug("TTS lastCharIndex ID: " + id);
                            var spanPrevious = tokenised.element.querySelector("#"+id);
                            if (spanPrevious)
                            {
        //console.debug("TTS OFF");
                                spanPrevious.className = 'tts_off';
                                //spanPrevious.style.backgroundColor = "white";
                            }
                        }
                        else
                        {
                            [].forEach.call(
                                tokenised.element.querySelectorAll(".tts_on"),
                                function(el)
                                {
        console.debug("TTS OFF " + el.id);
                                    el.className = 'tts_off';
                                }
                            );
                        }

                        var id = 'tts_' + tokenised.spanMap[event.charIndex];
        console.debug("TTS charIndex ID: " + id);
                        var spanNew = tokenised.element.querySelector("#"+id);
                        if (spanNew)
                        {
        console.debug("TTS ON");
                            spanNew.className = 'tts_on';
                            //spanNew.style.backgroundColor = "transparent";
                        }

                        tokenised.lastCharIndex = event.charIndex;
                    };
                }

                _SpeechSynthesisUtterance.onend = function(event)
                //_SpeechSynthesisUtterance.addEventListener("end", function(event)
                {
                    if (!_SpeechSynthesisUtterance)
                    {
                        //_skipTTSEndEvent = false;
                        return;
                    }
    //
    //                if (_skipTTSEndEvent)
    //                {
    //                    _skipTTSEndEvent = false;
    //                    return;
    //                }

console.debug("TTS ended");
    //console.debug(event);

                    if (TOKENIZE_TTS)
                    {
                        var tokenised = event.target.tokenData;

                        var doEnd = !event.forceSkipEnd && (_SpeechSynthesisUtterance === event.target) && (!tokenised || tokenised.element.innerHTML_original);

                        if (tokenised)
                        {
                            if (tokenised.element.innerHTML_original)
                            {
                                tokenised.element.innerHTML = tokenised.element.innerHTML_original;
                            }
                            else
                            {
                                [].forEach.call(
                                    tokenised.element.querySelectorAll(".tts_on"),
                                    function(el)
                                    {
        console.debug("TTS OFF (end)" + el.id);
                                        el.className = 'tts_off';
                                    }
                                );
                            }

                            tokenised.element.innerHTML_original = undefined;
                        }


                        if (doEnd)
                        {
                            self.onTTSEnd();
                        }
                        else
                        {
    console.debug("TTS end SKIPPED");
                        }
                    }
                    else
                    {
                        self.onTTSEnd();
                    }
                };

                _SpeechSynthesisUtterance.onerror = function(event)
                //_SpeechSynthesisUtterance.addEventListener("error", function(event)
                {
                    if (!_SpeechSynthesisUtterance)
                    {
                        return;
                    }

console.error("TTS error");
//console.debug(event);
console.debug(_SpeechSynthesisUtterance.text);
console.debug(window.speechSynthesis.paused);
console.debug(window.speechSynthesis.pending);
console.debug(window.speechSynthesis.speaking);

                    if (TOKENIZE_TTS)
                    {
                        var tokenised = event.target.tokenData;
                        if (tokenised)
                        {
                            if (tokenised.element.innerHTML_original)
                            {
                                tokenised.element.innerHTML = tokenised.element.innerHTML_original;
                            }
                            else
                            {
                                [].forEach.call(
                                    tokenised.element.ownerDocument.querySelectorAll(".tts_on"),
                                    function(el)
                                    {
        console.debug("TTS OFF (error)" + el.id);
                                        el.className = 'tts_off';
                                    }
                                );
                            }
                            tokenised.element.innerHTML_original = undefined;
                        }
                    }
                };

                var vol = volume || _audioPlayer.getVolume();
                _SpeechSynthesisUtterance.volume = vol;

                _SpeechSynthesisUtterance.rate = _audioPlayer.getRate();
                _SpeechSynthesisUtterance.pitch = 1;

                //_SpeechSynthesisUtterance.lang = "en-US";

                _SpeechSynthesisUtterance.text = text;

    //console.debug("TTS speak: " + text);
                window.speechSynthesis.speak(_SpeechSynthesisUtterance);

                if (window.speechSynthesis.paused)
                {
console.debug("TTS resume");
                    window.speechSynthesis.resume();
                }

           //}, 5);
           }
        }
    };

    var speakStop = function()
    {
        var wasPlaying = _ttsIsPlaying;

        if (wasPlaying) {
            onStatusChanged({isPlaying: false});
        }
        
        _ttsIsPlaying = false;

        if (!_enableHTMLSpeech)
        {
            if (wasPlaying) {
                Globals.logEvent("MEDIA_OVERLAY_TTS_STOP", "EMIT", "media_overlay_player.js");
                reader.emit(Globals.Events.MEDIA_OVERLAY_TTS_STOP, undefined);
            }
            return;
        }

//console.debug("TTS pause");
        window.speechSynthesis.pause();
    };

    var _timerTick = undefined;

    function onPlay() {
        onPause();

        var func = function() {

            if (!_smilIterator || !_smilIterator.currentPar)
            {
                return;
            }

            var smil = _smilIterator.smil; //currentPar.getSmil();
            if (!smil.mo)
            {
                return;
            }

//            if (!_smilIterator.currentPar.audio.src)
//            {
//                return;
//            }

            var playPosition = audioCurrentTime - _smilIterator.currentPar.audio.clipBegin;
            if (playPosition <= 0)
            {
                return;
            }

            var smilIndex = smil.mo.smil_models.indexOf(smil);

            var smilIterator = new SmilIterator(smil);
            var parIndex = -1;
            while (smilIterator.currentPar)
            {
                parIndex++;
                if (smilIterator.currentPar == _smilIterator.currentPar)
                {
                    break;
                }
                smilIterator.next();
            }

            onStatusChanged({playPosition: playPosition, smilIndex: smilIndex, parIndex: parIndex});
        };

        setTimeout(func, 500);

        _timerTick = setInterval(func, 1500);
    }

    function onPause() {

        audioCurrentTime = 0.0;
        if (_timerTick !== undefined)
        {
            clearInterval(_timerTick);
        }
        _timerTick = undefined;
    }


    this.onEmbeddedEnd = function()
    {
        audioCurrentTime = 0.0;

        _embeddedIsPlaying = false;
        //_currentEmbedded = undefined;

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 3);
    };

    this.onTTSEnd = function()
    {
        audioCurrentTime = 0.0;

        _ttsIsPlaying = false;
        //_currentTTS = undefined;

//        if(_skipTTSEnded)
//        {
//            _skipTTSEnded = false;
//            return;
//        }

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 4);
    };

    function onAudioEnded() {

        onPause();
//
//        if (_letPlay)
//        {
//            return;
//        }

        if(_skipAudioEnded)
        {
            _skipAudioEnded = false;
            return;
        }

        if (!_smilIterator || !_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        onAudioPositionChanged(_smilIterator.currentPar.audio.clipEnd + 0.1, 5);
    }

    function highlightCurrentElement() {

        if(!_smilIterator) {
            return;
        }

        if(!_smilIterator.currentPar) {
            return;
        }

        if (_smilIterator.currentPar.text.srcFragmentId && _smilIterator.currentPar.text.srcFragmentId.length > 0)
        {
            if (_smilIterator.currentPar.element) {
    //console.error(_smilIterator.currentPar.element.id + ": " + _smilIterator.currentPar.audio.clipBegin + " / " + _smilIterator.currentPar.audio.clipEnd);

                if (!_elementHighlighter.isElementHighlighted(_smilIterator.currentPar))
                {
                    _elementHighlighter.highlightElement(_smilIterator.currentPar, _package.media_overlay.activeClass, _package.media_overlay.playbackActiveClass);

                    if (!_wasPlayingScrolling)
                    {
                        reader.insureElementVisibility(_smilIterator.currentPar.getSmil().spineItemId, _smilIterator.currentPar.element, self);
                    }
                }
            
                return;
            
            } else if (_smilIterator.currentPar.cfi) {

                if (!_elementHighlighter.isCfiHighlighted(_smilIterator.currentPar))
                {
                    _elementHighlighter.highlightCfi(_smilIterator.currentPar, _package.media_overlay.activeClass, _package.media_overlay.playbackActiveClass);

                    if (!_wasPlayingScrolling)
                    {
                        reader.insureElementVisibility(_smilIterator.currentPar.getSmil().spineItemId, _smilIterator.currentPar.cfi.cfiTextParent, self);
                    }
                }
                
                return;
            }
        }
        
        // body (not FRAG ID)
        if (_smilIterator.currentPar.element) {
            return;
        }
        
        //else: single SMIL per multiple XHTML? ==> open new spine item
        
        /*
        var textRelativeRef = Globals.Helpers.ResolveContentRef(_smilIterator.currentPar.text.srcFile, _smilIterator.smil.href);
console.debug("textRelativeRef: " + textRelativeRef);
        if (textRelativeRef)
        {
            var textAbsoluteRef = _package.resolveRelativeUrl(textRelativeRef);
console.debug("textAbsoluteRef: " + textAbsoluteRef);
        }
        */

        var src = _smilIterator.currentPar.text.src;
        var base = _smilIterator.smil.href;

        //self.pause();
        //self.reset();
        _smilIterator = undefined;

        reader.openContentUrl(src, base, self);
    }

    this.escape = function() {
        
        if(!_smilIterator || !_smilIterator.currentPar) {

            this.toggleMediaOverlay();
            return;
        }

        if(!self.isPlaying())
        {
            //playCurrentPar();
            self.play();
            return;
        }

        if(_settings.mediaOverlaysEscapeEscapables)
        {
            var parent = _smilIterator.currentPar;
            while (parent)
            {
                if (parent.isEscapable && parent.isEscapable(_settings.mediaOverlaysEscapables))
                {
                    do
                    {
                        _smilIterator.next();
                    } while (_smilIterator.currentPar && _smilIterator.currentPar.hasAncestor(parent));

                    if (!_smilIterator.currentPar)
                    {
                        nextSmil(true);
                        return;
                    }

                    //_smilIterator.goToPar(_smilIterator.currentPar);
                    playCurrentPar();
                    return;
                }

                parent = parent.parent;
            }
        }

        this.nextMediaOverlay(true);
    };


    this.playUserPar = function(par) {
        if(self.isPlaying())
        {
            self.pause();
        }

        if (par.element || par.cfi && par.cfi.cfiTextParent)
        {
            var seq = _elementHighlighter.adjustParToSeqSyncGranularity(par);
            if (seq && seq !== par)
            {
                var findFirstPar = function(smilNode)
                {
                    if (smilNode.nodeType && smilNode.nodeType === "par") return smilNode;
                    
                    if (!smilNode.children || smilNode.children.length <= 0) return undefined;
                    
                    for (var i = 0; i < smilNode.children.length; i++)
                    {
                        var child = smilNode.children[i];
                        var inPar = findFirstPar(child);
                        if (inPar) return inPar;
                    }
                };
                var firstPar = findFirstPar(seq);
                if (firstPar) par = firstPar;
            }
        }

        playPar(par);
    };

    this.resetTTS = function() {
        _currentTTS = undefined;
//        _skipTTSEnded = false;
        speakStop();
    };

    this.resetBlankPage = function() {
        var wasPlaying = false;
        
        if (_blankPagePlayer)
        {
            wasPlaying = true;
            
            var timer = _blankPagePlayer;
            _blankPagePlayer = undefined;
            clearTimeout(timer);
        }
        _blankPagePlayer = undefined;

        if (wasPlaying) {
            onStatusChanged({isPlaying: false});
        }
    };

    this.resetEmbedded = function() {
        var wasPlaying = _embeddedIsPlaying;
        
        if (_currentEmbedded)
        {
            $(_currentEmbedded).off("ended", self.onEmbeddedEnd);
            _currentEmbedded.pause();
        }
        _currentEmbedded = undefined;
        
        if (wasPlaying) {
            onStatusChanged({isPlaying: false});
        }
        _embeddedIsPlaying = false;
    };

    this.reset = function() {
        clipBeginOffset = 0.0;
        _audioPlayer.reset();
        self.resetTTS();
        self.resetEmbedded();
        self.resetBlankPage();
        _elementHighlighter.reset();
        _smilIterator = undefined;
        _skipAudioEnded = false;
    };

    this.play = function ()
    {
        if (_smilIterator && _smilIterator.smil && !_smilIterator.smil.id)
        {
            initBlankPagePlayer();
            return;
        }
        else if (_currentEmbedded)
        {
            _embeddedIsPlaying = true;
            _currentEmbedded.play();
            onStatusChanged({isPlaying: true});
        }
        else if (_currentTTS)
        {
            speakStart(undefined);
        }
        else
        {
            if (!_audioPlayer.play())
            {
                console.log("Audio player was dead, reactivating...");

                this.reset();
                this.toggleMediaOverlay();
                return;
            }
        }

        highlightCurrentElement();
    }

    this.pause = function()
    {
        _wasPlayingScrolling = false;
        
        if (_blankPagePlayer)
        {
            this.resetBlankPage();
        }
        else if (_embeddedIsPlaying)
        {
            _embeddedIsPlaying = false;
            if (_currentEmbedded)
            {
                _currentEmbedded.pause();
            }
            onStatusChanged({isPlaying: false});
        }
        else if (_ttsIsPlaying)
        {
            speakStop();
        }
        else
        {
            _audioPlayer.pause();
        }

        _elementHighlighter.reset();
    }

    this.isMediaOverlayAvailable = function() {

//        console.debug("isMediaOverlayAvailable()");
//
//        var now1 = window.performance && window.performance.now ? window.performance.now() : Date.now();
//
//        if (console.time)
//        {
//            console.time("MO");
//        }

        var visibleMediaElement = reader.getFirstVisibleMediaOverlayElement();

//        if (console.timeEnd)
//        {
//            console.timeEnd("MO");
//        }
//
//        var now2 = window.performance && window.performance.now ? window.performance.now() : Date.now();
//
//        console.debug(now2 - now1);

        return typeof visibleMediaElement !== "undefined";
    };

    this.nextOrPreviousMediaOverlay = function(previous) {
        if(self.isPlaying())
        {
            self.pause();
        }
        else
        {
            if (_smilIterator && _smilIterator.currentPar)
            {
                //playCurrentPar();
                self.play();
                return;
            }
        }

        if(!_smilIterator)
        {
            this.toggleMediaOverlay();
            return;
        }

        var position = previous ? DIRECTION_MARK - 1 : _smilIterator.currentPar.audio.clipEnd + 0.1;

        onAudioPositionChanged(position, 6);
        // setTimeout(function(){
        //     
        // }, 1);

        //self.play();
        //playCurrentPar();
    };

    this.nextMediaOverlay = function() {
        this.nextOrPreviousMediaOverlay(false);
    };

    this.previousMediaOverlay = function() {
        this.nextOrPreviousMediaOverlay(true);
    };

    /*
    this.setMediaOverlaySkippables = function(items) {

    };

    this.setMediaOverlayEscapables = function(items) {

    };
    */

    this.mediaOverlaysOpenContentUrl = function(contentRefUrl, sourceFileHref, offset)
    {
        clipBeginOffset = offset;

        //self.pause();
        //self.reset();
        _smilIterator = undefined;

        reader.openContentUrl(contentRefUrl, sourceFileHref, self);

        /*
        if (_currentPagination && _currentPagination.isFixedLayout && _currentPagination.openPages && _currentPagination.openPages.length > 0)
        {
            var combinedPath = Globals.Helpers.ResolveContentRef(contentRefUrl, sourceFileHref);

            var hashIndex = combinedPath.indexOf("#");
            var hrefPart;
            var elementId;
            if(hashIndex >= 0) {
                hrefPart = combinedPath.substr(0, hashIndex);
                elementId = combinedPath.substr(hashIndex + 1);
            }
            else {
                hrefPart = combinedPath;
                elementId = undefined;
            }

            var spineItem = reader.spine.getItemByHref(hrefPart);
            var spineItemIndex = _currentPagination.openPages[0].spineItemIndex;

            //var idref = _currentPagination.openPages[0].idref;
            //spineItem.idref === idref
            //var currentSpineItem = reader.spine.getItemById(idref);
            //currentSpineItem == spineItem
            if (spineItem.index === spineItemIndex)
            {
                self.onPageChanged({
                    paginationInfo: _currentPagination,
                    elementId: elementId,
                    initiator: self
                });
            }
        }
        */
    };

    this.toggleMediaOverlay = function() {
        if(self.isPlaying()) {
            self.pause();
            return;
        }

        //if we have position to continue from (reset wasn't called)
        if(_smilIterator) {
            self.play();
            return;
        }

        this.toggleMediaOverlayRefresh(undefined);
    };

    var _wasPlayingScrolling = false;

    this.toggleMediaOverlayRefresh = function(paginationData)
    {
//console.debug("moData SMIL: " + moData.par.getSmil().href + " // " + + moData.par.getSmil().id);

        var spineItems = reader.getLoadedSpineItems();

        //paginationData.isRightToLeft
        var rtl = reader.spine().isRightToLeft();

        //paginationData.spineItemCount
        //paginationData.openPages
        //{spineItemPageIndex: , spineItemPageCount: , idref: , spineItemIndex: }

        var playingPar = undefined;
        var wasPlaying = self.isPlaying();
        if(wasPlaying && _smilIterator)
        {
            var isScrollView = paginationData.initiator && paginationData.initiator instanceof ScrollView;
            if (isScrollView && _settings.mediaOverlaysPreservePlaybackWhenScroll)
            {
                _wasPlayingScrolling = true;
                return;
            }
            
            playingPar = _smilIterator.currentPar;
            self.pause();
        }
        
        _wasPlayingScrolling = false;

        //paginationData && paginationData.elementId
        //paginationData.initiator != self

        //_package.isFixedLayout()

        var element = (paginationData && paginationData.elementIdResolved) ? paginationData.elementIdResolved : undefined;

        var id = (paginationData && paginationData.elementId) ? paginationData.elementId : undefined;

        if (!element)
        {
            if (id)
            {
                console.error("[WARN] id did not resolve to element?");
            }
            
            for(var i = (rtl ? (spineItems.length - 1) : 0); (rtl && i >=0) || (!rtl && i < spineItems.length); i += (rtl ? -1: 1))
            {
                var spineItem = spineItems[i];
                if (!spineItem)
                {
                    console.error("spineItems[i] is undefined??");
                    continue;
                }
            
                if (paginationData && paginationData.spineItem && paginationData.spineItem != spineItem)
                {
                    continue;
                }

                if (id)
                {
                    var $element = reader.getElementById(spineItem.idref, id);
                    //var $element = reader.getElement(spineItem.idref, "#" + ReadiumSDK.Helpers.escapeJQuerySelector(id));
                    element = ($element && $element.length > 0) ? $element[0] : undefined;
                }
                else if (spineItem.isFixedLayout())
                {
                    if (paginationData && paginationData.paginationInfo && paginationData.paginationInfo.openPages)
                    {
                        // openPages are sorted by spineItem index, so the smallest index on display is the one we need to play (page on the left in LTR, or page on the right in RTL progression)
                        var index = 0; // !paginationData.paginationInfo.isRightToLeft ? 0 : paginationData.paginationInfo.openPages.length - 1;
                    
                        if (paginationData.paginationInfo.openPages[index] && paginationData.paginationInfo.openPages[index].idref && paginationData.paginationInfo.openPages[index].idref === spineItem.idref)
                        {
                            var $element = reader.getElement(spineItem.idref, "body");
                            element = ($element && $element.length > 0) ? $element[0] : undefined;
                        }
                    }
                }

                if (element)
                {
                    break;
                }
            }
        }

        if (!element)
        {
            element = reader.getFirstVisibleMediaOverlayElement();
        }

        if (!element)
        {
            self.reset();
            return;
        }

        var moData = $(element).data("mediaOverlayData");

        if (!moData)
        {
            var foundMe = false;
            var depthFirstTraversal = function(elements)
            {
                if (!elements)
                {
                    return false;
                }

                for (var i = 0; i < elements.length; i++)
                {
                    if (element === elements[i]) foundMe = true;
                    
                    if (foundMe)
                    {
                        var d = $(elements[i]).data("mediaOverlayData");
                        if (d)
                        {
                            moData = d;
                            return true;
                        }
                    }

                    var found = depthFirstTraversal(elements[i].children);
                    if (found)
                    {
                        return true;
                    }
                }

                return false;
            }

            var root = element;
            while (root && root.nodeName.toLowerCase() !== "body")
            {
                root = root.parentNode;
            }

            if (!root)
            {
                self.reset();
                return;
            }

            depthFirstTraversal([root]);
        }

        if (!moData)
        {
            self.reset();
            return;
        }

        var zPar = moData.par ? moData.par : moData.pars[0];
        var parSmil = zPar.getSmil();
        if(!_smilIterator || _smilIterator.smil != parSmil)
        {
            _smilIterator = new SmilIterator(parSmil);
        }
        else
        {
            _smilIterator.reset();
        }
        
        _smilIterator.goToPar(zPar);
        
        if (!_smilIterator.currentPar && id)
        {
            _smilIterator.reset();
            _smilIterator.findTextId(id);
        }
        
        if (!_smilIterator.currentPar)
        {
            self.reset();
            return;
        }

        if (wasPlaying && playingPar && playingPar === _smilIterator.currentPar)
        {
            self.play();
        }
        else
        {
            playCurrentPar();
            //playPar(zPar);
        }
    };

    this.isPlayingCfi = function()
    {
        return _smilIterator && _smilIterator.currentPar && _smilIterator.currentPar.cfi;
    };
    
    var _wasPausedBecauseNoAutoNextSmil = false;
    var _autoNextSmil = true;
    this.setAutomaticNextSmil = function(autoNext)
    {
        _autoNextSmil = autoNext;
    };
};
    return MediaOverlayPlayer;
});

//  Created by Boris Schneiderman.
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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

define('readium_shared_js/models/spine',["./spine_item", "../helpers", "URIjs"], function(SpineItem, Helpers, URI) {
/**
 *  Wrapper of the Spine object received from the host application
 *
 * @class  Models.Spine
 * @constructor
 * @param {Models.Package} epubPackage Parent package properties 
 * @param {Object} spineDTO Spine data object, container for spine properties
 */
var Spine = function(epubPackage, spineDTO) {

    var self = this;

    /**
     * The collection of spine items
     *
     * @property items
     * @type Array
     */
    this.items = [];

    /**
     * The page progression direction ltr|rtl|default
     *
     * @property direction
     * @type String
     * @default "ltr"
     */
    this.direction = "ltr";

    /**
     * The container for parent package properties
     *
     * @property package  
     * @type Models.Package
     *
     */
    this.package = epubPackage;

    var _handleLinear = false;

    /**
     * Sets a flag indicating that the app handles linear spine items
     *
     * @method     handleLinear
     * @param      {Boolean} handleLinear  boolean flag
     */
    this.handleLinear = function(handleLinear) {
        _handleLinear = handleLinear;
    };

    function isValidLinearItem(item) {
        return !_handleLinear || item.linear !== "no";
    }

    /**
     * Checks if a spine item is linear. 
     *
     * @method     isValidLinearItem
     * @param      {Number} index  index of a spine item
     * @return     {Boolean} TRUE if the app does not handle linear items or if the item is linear.
    */
    this.isValidLinearItem = function(index) {
        
        if(!isValidIndex(index)) {
            return undefined;
        }

        return isValidLinearItem(this.item(index));
    };

    /**
     * Checks if the page progression direction is right to left.
     *
     * @method     isRightToLeft
     * @return     {Boolean} 
     */
    this.isRightToLeft = function() {

        return self.direction == "rtl";
    };

    /**
     * Checks if the page progression direction is left to right.
     *
     * @method     isLeftToRight
     * @return     {Boolean} TRUE if the direction is not rtl.
     */
    this.isLeftToRight = function() {

        return !self.isRightToLeft();
    };

    /**
     * Checks if an spine item index is valid. 
     *
     * @method     isValidIndex
     * @param      {Number} index  the index of the expected spine item
     * @return     {Boolean} TRUE is the index is valid.
    */
    function isValidIndex(index) {

        return index >= 0 && index < self.items.length;
    }

    function lookForPrevValidItem(ix) {

        if(!isValidIndex(ix)) {
            return undefined;
        }

        var item = self.items[ix];

        if(isValidLinearItem(item)) {
            return item;
        }

        return lookForPrevValidItem(item.index - 1);
    }

    /**
     * Looks for the previous spine item. 
     *
     * @method     prevItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Models.SpineItem} the previous spine item or undefined.
    */
    this.prevItem = function(item) {

        return lookForPrevValidItem(item.index - 1);
    };

    function lookForNextValidItem(ix) {

        if(!isValidIndex(ix)) {
            return undefined;
        }

        var item = self.items[ix];

        if(isValidLinearItem(item)) {
            return item;
        }

        return lookForNextValidItem(item.index + 1);
    }

    /**
     * Looks for the next spine item. 
     *
     * @method     nextItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Models.SpineItem} the next spine item or undefined.
    */
    this.nextItem = function(item) {

        return lookForNextValidItem(item.index + 1);
    };

    /**
     * Gets the relative URL of a spine item. 
     *
     * @method     getItemUrl
     * @param      {Models.SpineItem} item  the spine item
     * @return     {String} the relative URL of the spine item.
    */
    this.getItemUrl = function(item) {

        return self.package.resolveRelativeUrl(item.href);

    };

    /**
     * Returns the first spine item. 
     *
     * @method     first
     * @return     {Models.SpineItem} the first spine item.
    */
    this.first = function() {

        return lookForNextValidItem(0);
    };

    /**
     * Returns the last spine item. 
     *
     * @method     last
     * @return     {Models.SpineItem} the last spine item.
    */
    this.last = function() {

        return lookForPrevValidItem(this.items.length - 1);
    };

    /**
     * Checks if a spine item is the first in the spine. 
     *
     * @method     isFirstItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Boolean} TRUE if the spine item is the first in the list.
    */
    this.isFirstItem = function(item) {

        return self.first() === item;
    };

    /**
     * Checks if a spine item is the last in the spine. 
     *
     * @method     isLastItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Boolean} true if the spine item is the last in the list.
    */
    this.isLastItem = function(item) {

        return self.last() === item;
    };

    /**
     * Returns a spine item by its index. 
     *
     * @method     item
     * @param      {Number} index  the index of the expected spine item
     * @return     {Models.SpineItem} the expected spine item or undefined.
    */
   this.item = function(index) {
        
        if (isValidIndex(index))
            return self.items[index];
            
        return undefined;
    };

    /**
     * Returns a spine item by its id.
     *
     * @method     getItemById
     * @param      {Number} idref  the id of the expected spine item
     * @return     {Models.SpineItem} the expected spine item or undefined.
     */
    this.getItemById = function(idref) {

        var length = self.items.length;

        for(var i = 0; i < length; i++) {
            if(self.items[i].idref == idref) {

                return self.items[i];
            }
        }

        return undefined;
    };

    /**
     * Returns a spine item by its href.
     *
     * @method     getItemByHref
     * @param      {String} href  the URL of the expected spine item
     * @return     {Models.SpineItem} the expected spine item or undefined.
     */
    this.getItemByHref = function(href) {
        
        var href1_ = self.package.resolveRelativeUrl(href);
        href1_ = href1_.replace("filesystem:chrome-extension://", "filesystem-chrome-extension://");
        var href1 = new URI(href1_).normalizePathname().pathname();
        
        var length = self.items.length;

        for(var i = 0; i < length; i++) {
            
            var href2_ = self.package.resolveRelativeUrl(self.items[i].href);
            href2_ = href2_.replace("filesystem:chrome-extension://", "filesystem-chrome-extension://");
            var href2 = new URI(href2_).normalizePathname().pathname();
            
            if(href1 == href2) {
                return self.items[i];
            }
        }

        return undefined;
    };

    /**
     * Updates every spine item spread, if not already defined.
     *
     * @method     updateSpineItemsSpread
     */
    function updateSpineItemsSpread() {

        var len = self.items.length;

        var isFirstPageInSpread = false;
        var baseSide = self.isLeftToRight() ? SpineItem.SPREAD_LEFT : SpineItem.SPREAD_RIGHT;

        for(var i = 0; i < len; i++) {

            var spineItem = self.items[i];
            if( !spineItem.page_spread) {

                var spread = spineItem.isRenditionSpreadAllowed() ? (isFirstPageInSpread ? baseSide : SpineItem.alternateSpread(baseSide)) : SpineItem.SPREAD_CENTER;
                spineItem.setSpread(spread);
            }

            isFirstPageInSpread = !spineItem.isRenditionSpreadAllowed() || spineItem.page_spread != baseSide;
        }
    }

    // initialization of the local 'direction' and 'items' array from the spineDTO structure
    if(spineDTO) {

        if(spineDTO.direction) {
            this.direction = spineDTO.direction;
        }

        var length = spineDTO.items.length;
        for(var i = 0; i < length; i++) {
            var item = new SpineItem(spineDTO.items[i], i, this);
            this.items.push(item);
        }

        updateSpineItemsSpread();
    }

};
    return Spine;
});

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
define ('readium_shared_js/models/smil_model',["../helpers"], function(Helpers) {

var Smil = {};

/**
 * Wrapper of a SmilNode object
 *
 * @class      Smil.SmilNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent node of the new smil node
 */

Smil.SmilNode = function(parent) {

    this.parent = parent;
    
    this.id = "";
    
    /**
     * Finds the smil model object, i.e. the root node of the smil tree
     *
     * @method     getSmil
     * @return     {Smil.SmilModel} node The smil model object
     */    
    this.getSmil = function() {

        var node = this;
        while(node.parent) {
            node = node.parent;
        }

        return node;
    };
    /**
     * Checks if the node given as a parameter is an ancestor of the current node 
     *
     * @method     hasAncestor
     * @param      {Smil.SmilNode} node The checked node
     * @return     {Bool} true if the parameter node is an ancestor
     */
    this.hasAncestor = function(node)
    {
        var parent = this.parent;
        while(parent)
        {
            if (parent == node)
            {
                return true;
            }

            parent = parent.parent;
        }

        return false;
    };
};

////////////////////////////
//TimeContainerNode

/**
 * Wrapper of a time container (smil) node 
 *
 * @class      Smil.TimeContainerNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.TimeContainerNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */
    
    this.parent = parent;
    
    /**
     * The children nodes
     *
     * @property children
     * @type undefined
     */

    this.children = undefined;
    
    /**
     * The index
     *
     * @property index
     * @type undefined
     */

    this.index = undefined;
    
    /**
     * The epub type
     *
     * @property epubtype
     * @type String
     */

    this.epubtype = "";


    /**
     * Checks if the smil node is escapable.
     *
     * @method     isEscapable
     * @param      {Array} userEscapables
     * @return     {Bool} true if the smil node is escapable 
     */

    this.isEscapable = function(userEscapables)
    {
        if (this.epubtype === "")
        {
            return false;
        }

        var smilModel = this.getSmil();
        if (!smilModel.mo)
        {
            return false;
        }

        var arr = smilModel.mo.escapables;
        if (userEscapables.length > 0)
        {
            arr = userEscapables;
        }

        for (var i = 0; i < arr.length; i++)
        {
            if (this.epubtype.indexOf(arr[i]) >= 0)
            {
                return true;
            }
        }

        return false;
    };

    /**
     * Checks is the smil node is skippable
     *
     * @method     isSkippables
     * @param      {Array} userSkippables
     * @return     {Bool} true s the smil node is skippable
     */

    this.isSkippable = function(userSkippables)
    {
        if (this.epubtype === "")
        {
            return false;
        }
        
        var smilModel = this.getSmil();
        if (!smilModel.mo)
        {
            return false;
        }

        var arr = smilModel.mo.skippables;
        if (userSkippables.length > 0)
        {
            arr = userSkippables;
        }

        for (var i = 0; i < arr.length; i++)
        {
            if (this.epubtype.indexOf(arr[i]) >= 0)
            {
                return true;
            }
        }

        return false;
    };
};

Smil.TimeContainerNode.prototype = new Smil.SmilNode();


////////////////////////////
//MediaNode

/**
 * Looks for the media parent folder
 *
 * @class      Smil.MediaNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.MediaNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;
    
    /**
     * The source locator
     *
     * @property src
     * @type String
     */

    this.src = "";
};

Smil.MediaNode.prototype = new Smil.SmilNode();

////////////////////////////
//SeqNode

/**
 * Node Sequence
 *
 * @class      Smil.SeqNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.SeqNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;

    /**
     * The children nodes
     *
     * @property children
     * @type Array
     */

    this.children = [];

    /**
     * The node type (seq)
     *
     * @property nodeType
     * @type String
     */

    this.nodeType = "seq";

    /**
     * The text reference
     *
     * @property textref
     * @type String
     */

    this.textref = "";
    
    /**
     * Calculates the total duration of audio clips 
     *
     * @method     durationMilliseconds
     * @return     {Number} 
     */

    this.durationMilliseconds = function()
    {
        // returns the smil object
        var smilData = this.getSmil();

        var total = 0;
        
        for (var i = 0; i < this.children.length; i++)
        {
            var container = this.children[i];
            if (container.nodeType === "par")
            {
                if (!container.audio)
                {
                    continue;
                }
                if (container.text && (!container.text.manifestItemId || container.text.manifestItemId != smilData.spineItemId))
                {
                    continue;
                }
                
                var clipDur = container.audio.clipDurationMilliseconds();
                total += clipDur;
            }
            else if (container.nodeType === "seq")
            {
                total += container.durationMilliseconds();
            }
        }

        return total;
    };
    
   /**
     * Looks for a given parallel node in the current sequence node and its children.
     *  Returns true if found. 
     *
     * @method     clipOffset
     * @param      {Number} offset
     * @param      {Smil.ParNode} par The reference parallel smil node
     * @return     {Boolean} 
     */ 

    this.clipOffset = function(offset, par)
    {
        var smilData = this.getSmil();
        
        for (var i = 0; i < this.children.length; i++)
        {
            var container = this.children[i];
            if (container.nodeType === "par")
            {
                if (container == par)
                {
                    return true;
                }

                if (!container.audio)
                {
                    continue;
                }

                if (container.text && (!container.text.manifestItemId || container.text.manifestItemId != smilData.spineItemId))
                {
                    continue;
                }

                var clipDur = container.audio.clipDurationMilliseconds();
                offset.offset += clipDur;
            }
            else if (container.nodeType === "seq")
            {
                var found = container.clipOffset(offset, par);
                if (found)
                {
                    return true;
                }
            }
        }

        return false;
    };


   /**
     * Checks if a parallel smil node exists at a given timecode in the smil sequence node. 
     * Returns the node or undefined.
     *
     * @method     parallelAt
     * @param      {Number} timeMilliseconds
     * @return     {Smil.ParNode}
     */ 

    this.parallelAt = function(timeMilliseconds)
    {
        var smilData = this.getSmil();
        
        var offset = 0;

        for (var i = 0; i < this.children.length; i++)
        {
            var timeAdjusted = timeMilliseconds - offset;

            var container = this.children[i];
            
            // looks for a winning parallel smil node in a child parallel smil node
            if (container.nodeType === "par")
            {
                // the parallel node must contain an audio clip and a text node with a proper id
                if (!container.audio)
                {
                    continue;
                }

                if (container.text && (!container.text.manifestItemId || container.text.manifestItemId != smilData.spineItemId))
                {
                    continue;
                }
                // and the timecode given as a parameter must correspond to the audio clip time range  
                var clipDur = container.audio.clipDurationMilliseconds();

                if (clipDur > 0 && timeAdjusted <= clipDur)
                {
                    return container;
                }

                offset += clipDur;
            }
            // looks for a winning parallel smil node in a child sequence smil node
            else if (container.nodeType === "seq")
            {
                var para = container.parallelAt(timeAdjusted);
                if (para)
                {
                    return para;
                }

                offset += container.durationMilliseconds();
            }
        }

        return undefined;
    };

    /**
     * Looks for the nth parallel smil node in the current sequence node
     *
     * @method     nthParallel
     * @param      {Number} index
     * @param      {Number} count
     * @return     {Smil.ParNode} 
     */    

    this.nthParallel = function(index, count)
    {
        for (var i = 0; i < this.children.length; i++)
        {
            var container = this.children[i];
            
            if (container.nodeType === "par")
            {
                count.count++;

                if (count.count == index)
                {
                    return container;
                }
            }
            else if (container.nodeType === "seq")
            {
                var para = container.nthParallel(index, count);
                if (para)
                {
                    return para;
                }
            }
        }

        return undefined;
    };
    
};

Smil.SeqNode.prototype = new Smil.TimeContainerNode();

//////////////////////////
//ParNode

/**
 * Returns the parent of the SMIL file by checking out the nodes
 *
 * @class      Smil.ParNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node

 */

Smil.ParNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;
    
    /**
     * The children files
     *
     * @property children
     * @type Array
     */

    this.children = [];
    
    /**
     * The Node Type
     *
     * @property nodeType which is equal to "par" here
     * @type String
     */

    this.nodeType = "par";

    /**
     * Some text
     *
     * @property text 
     * @type String
     */
    this.text = undefined;
    
    /**
     * Some audio
     *
     * @property audio 
     * @type unknown
     */
    
    this.audio = undefined;

    /**
     * An element of the epub archive
     *
     * @property element 
     * @type unknown
     */
    
    this.element = undefined;    

    /**
     * Gets the first ancestor sequence with a given epub type, or undefined.
     *
     * @method     getFirstSeqAncestorWithEpubType
     * @param      {String} epubtype
     * @param      {Boolean} includeSelf
     * @return     {Smil.SmilNode} 
     */       

    this.getFirstSeqAncestorWithEpubType = function(epubtype, includeSelf) {
        if (!epubtype) return undefined;
        
        var parent = includeSelf ? this : this.parent;
        while (parent)
        {
            if (parent.epubtype && parent.epubtype.indexOf(epubtype) >= 0)
            {
                return parent; // assert(parent.nodeType === "seq")
            }
            
            parent = parent.parent;
        }
        
        return undefined;
    };
};

Smil.ParNode.prototype = new Smil.TimeContainerNode();

//////////////////////////
//TextNode

/**
 * Node Sequence
 *
 * @class      Smil.TextNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node

 */

Smil.TextNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;

    /**
     * The node type, set to "text"
     *
     * @property nodeType
     * @type String 
     */

    this.nodeType = "text";

    /**
     * The source file
     *
     * @property srcFile
     * @type String
     */
    
    this.srcFile = "";
    
    /**
     * A fragment of the source file ID
     *
     * @property srcFragmentId
     * @type String
     */

    this.srcFragmentId = "";
    
    /**
     * The ID of the manifest for the current item
     *
     * @property manifestItemId
     * @type Number
     */
    
    this.manifestItemId = undefined;
    
    /**
     * Updates the ID of the manifest for the current media
     *
     * @method     updateMediaManifestItemId 
     */  

    this.updateMediaManifestItemId = function() {

        var smilData = this.getSmil();
        
        if (!smilData.href || !smilData.href.length)
        {
            return; // Blank MO page placeholder, no real SMIL
        }
        
        // var srcParts = item.src.split('#');
//         item.srcFile = srcParts[0];
//         item.srcFragmentId = (srcParts.length === 2) ? srcParts[1] : "";
        
        var src = this.srcFile ? this.srcFile : this.src;
// console.log("src: " + src);
// console.log("smilData.href: " + smilData.href);
        var ref = Helpers.ResolveContentRef(src, smilData.href);
//console.log("ref: " + ref);
        var full = smilData.mo.package.resolveRelativeUrlMO(ref);
// console.log("full: " + full);
// console.log("---");
        for (var j = 0; j < smilData.mo.package.spine.items.length; j++)
        {
            var item = smilData.mo.package.spine.items[j];
//console.log("item.href: " + item.href);
            var url = smilData.mo.package.resolveRelativeUrl(item.href);
//console.log("url: " + url);
            if (url === full)
            {
//console.error("FOUND: " + item.idref);
                this.manifestItemId = item.idref;
                return;
            }
        }
        
        console.error("Cannot set the Media ManifestItemId? " + this.src + " && " + smilData.href);
        
//        throw "BREAK";
    };
    
};

Smil.TextNode.prototype = new Smil.MediaNode();

///////////////////////////
//AudioNode

/**
 * Looks for the media parent folder
 *
 * @class      Smil.AudioNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.AudioNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;

    /**
     * The node type, set to "audio"
     *
     * @property nodeType 
     * @type String
     */

    this.nodeType = "audio";

    /**
     * The clip begin timecode
     *
     * @property clipBegin 
     * @type Number
     */

    this.clipBegin = 0;

    /**
     * The max duration of the audio clip which is almost infinite
     *
     * @property MAX 
     * @type Number
     */

    this.MAX = 1234567890.1; //Number.MAX_VALUE - 0.1; //Infinity;
    
    /**
     * The clip end timecode
     *
     * @property clipEnd
     * @type Number
     */

    this.clipEnd = this.MAX;
    
    /**
     * Returns the duration of the audio clip
     *
     * @method     clipDurationMilliseconds
     * @return     {Number} 
     */  

    this.clipDurationMilliseconds = function()
    {
        var _clipBeginMilliseconds = this.clipBegin * 1000;
        var _clipEndMilliseconds = this.clipEnd * 1000;
        
        if (this.clipEnd >= this.MAX || _clipEndMilliseconds <= _clipBeginMilliseconds)
        {
            return 0;
        }

        return _clipEndMilliseconds - _clipBeginMilliseconds;
    };  
};

Smil.AudioNode.prototype = new Smil.MediaNode();

//////////////////////////////
//SmilModel

/**
 * Wrapper of the SmilModel object
 *
 * @class      Models.SmilModel
 * @constructor
 */

var SmilModel = function() {

    /**
     * The parent object
     *
     * @property parent
     * @type any
     */

    this.parent = undefined;
    
    /**
     * The smil model children, i.e. a collection of seq or par smil nodes
     *
     * @property children
     * @type Array
     */
    
    this.children = []; 
    
    /**
     * The manifest item ID
     *
     * @property id
     * @type Number
     */

    this.id = undefined; 

    /**
     * The href of the .smil source file
     *
     * @property href
     * @type String
     */

    this.href = undefined; 
    
    /**
     * The duration of the audio clips
     *
     * @property duration
     * @type Number
     */

    this.duration = undefined;

    /**
     * The media overlay object
     *
     * @property mo
     * @type Models.MediaOverlay
     */

    this.mo = undefined;

    /**
     * Checks if a parallel smil node exists at a given timecode in the smil model. 
     * Returns the node or undefined.
     *
     * @method     parallelAt
     * @param      {Number} timeMillisecond 
     * @return     {Smil.ParNode}
     */
    
    this.parallelAt = function(timeMilliseconds)
    {
        return this.children[0].parallelAt(timeMilliseconds);
    };

    /**
     * Looks for the nth parallel smil node in the current smil model
     *
     * @method     nthParallel
     * @param      {Number} index
     * @return     {Smil.ParNode} 
     */

    this.nthParallel = function(index)
    {
        var count = {count: -1};
        return this.children[0].nthParallel(index, count);
    };

    /**
     * Looks for a given parallel node in the current smil model.
     *  Returns its offset if found. 
     *
     * @method     clipOffset
     * @param      {Smil.ParNode} par The reference parallel smil node
     * @return     {Number} offset of the audio clip
     */

    this.clipOffset = function(par)
    {
        var offset = {offset: 0};
        if (this.children[0].clipOffset(offset, par))
        {
            return offset.offset;
        }

        return 0;
    };

    /**
     * Calculates the total audio duration of the smil model
     *
     * @method     durationMilliseconds_Calculated    
     * @return     {Number}
     */

    this.durationMilliseconds_Calculated = function()
    {
        return this.children[0].durationMilliseconds();
    };
    

    var _epubtypeSyncs = [];
    // 
    // this.clearSyncs = function()
    // {
    //     _epubtypeSyncs = [];
    // };

    // local function, helper
    this.hasSync = function(epubtype)
    {
        for (var i = 0; i < _epubtypeSyncs.length; i++)
        {
            if (_epubtypeSyncs[i] === epubtype)
            {
                return true;
            }
        }
        
        return false;
    };

    /**
     * Stores epub types given as parameters in the _epubtypeSyncs array
     * Note: any use of the _epubtypeSyncs array?
     *
     * @method     addSync
     * @param      {String} epubtypes    
     */

    this.addSync = function(epubtypes)
    {
        if (!epubtypes) return;

        var parts = epubtypes.split(' ');
        for (var i = 0; i < parts.length; i++)
        {
            var epubtype = parts[i].trim();

            if (epubtype.length > 0 && !this.hasSync(epubtype))
            {
                _epubtypeSyncs.push(epubtype);
            }
        }
    };
    
};

/**
 * Static SmilModel.fromSmilDTO method, returns a clean SmilModel object
 *
 * @method      Model.fromSmilDTO
 * @param      {string} smilDTO
 * @param      {string} parent
 * @return {Models.SmilModel}
*/

SmilModel.fromSmilDTO = function(smilDTO, mo) {

    if (mo.DEBUG)
    {
        console.debug("Media Overlay DTO import...");
    }

    // Debug level indenting function
    var indent = 0;
    var getIndent = function()
    {
        var str = "";
        for (var i = 0; i < indent; i++)
        {
            str += "   ";
        }
        return str;
    }

    var smilModel = new SmilModel();
    smilModel.id = smilDTO.id;
    smilModel.spineItemId = smilDTO.spineItemId;
    smilModel.href = smilDTO.href;
    
    smilModel.smilVersion = smilDTO.smilVersion;
    
    smilModel.duration = smilDTO.duration;
    if (smilModel.duration && smilModel.duration.length && smilModel.duration.length > 0)
    {
        console.error("SMIL duration is string, parsing float... (" + smilModel.duration + ")");
        smilModel.duration = parseFloat(smilModel.duration);
    }
    
    smilModel.mo = mo; //Models.MediaOverlay

    if (smilModel.mo.DEBUG)
    {
        console.log("JS MO smilVersion=" + smilModel.smilVersion);
        console.log("JS MO id=" + smilModel.id);
        console.log("JS MO spineItemId=" + smilModel.spineItemId);
        console.log("JS MO href=" + smilModel.href);
        console.log("JS MO duration=" + smilModel.duration);
    }

    // Safe copy, helper function
    var safeCopyProperty = function(property, from, to, isRequired) {

        if((property in from))
        { // && from[property] !== ""

            if( !(property in to) ) {
                console.debug("property " + property + " not declared in smil node " + to.nodeType);
            }

            to[property] = from[property];

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO: [" + property + "=" + to[property] + "]");
            }
        }
        else if(isRequired) {
            console.log("Required property " + property + " not found in smil node " + from.nodeType);
        }
    };

    // smil node creation, helper function
    var createNodeFromDTO = function(nodeDTO, parent) {

        var node;

        if(nodeDTO.nodeType == "seq") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO seq");
            }

            node = new Smil.SeqNode(parent);

            safeCopyProperty("textref", nodeDTO, node, ((parent && parent.parent) ? true : false));
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            if (node.epubtype)
            {
                node.getSmil().addSync(node.epubtype);
            }
            
            indent++;
            copyChildren(nodeDTO, node);
            indent--;
        }
        else if (nodeDTO.nodeType == "par") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO par");
            }

            node = new Smil.ParNode(parent);

            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            if (node.epubtype)
            {
                node.getSmil().addSync(node.epubtype);
            }

            indent++;
            copyChildren(nodeDTO, node);
            indent--;
            
            for(var i = 0, count = node.children.length; i < count; i++) {
                var child = node.children[i];

                if(child.nodeType == "text") {
                    node.text = child;
                }
                else if(child.nodeType == "audio") {
                    node.audio = child;
                }
                else {
                    console.error("Unexpected smil node type: " + child.nodeType);
                }
            }

            ////////////////
            var forceTTS = false; // for testing only!
            ////////////////

            if (forceTTS || !node.audio)
            {
                // synthetic speech (playback using TTS engine), or embedded media, or blank page
                var fakeAudio = new Smil.AudioNode(node);

                fakeAudio.clipBegin = 0;
                fakeAudio.clipEnd = fakeAudio.MAX;
                fakeAudio.src = undefined;

                node.audio = fakeAudio;
            }
        }
        else if (nodeDTO.nodeType == "text") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO text");
            }

            node = new Smil.TextNode(parent);

            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("srcFile", nodeDTO, node, true);
            safeCopyProperty("srcFragmentId", nodeDTO, node, false);
            safeCopyProperty("id", nodeDTO, node);
            
            node.updateMediaManifestItemId();
        }
        else if (nodeDTO.nodeType == "audio") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO audio");
            }

            node = new Smil.AudioNode(parent);

            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);

            safeCopyProperty("clipBegin", nodeDTO, node);
            if (node.clipBegin && node.clipBegin.length && node.clipBegin.length > 0)
            {
                console.error("SMIL clipBegin is string, parsing float... (" + node.clipBegin + ")");
                node.clipBegin = parseFloat(node.clipBegin);
            }
            if (node.clipBegin < 0)
            {
                if (smilModel.mo.DEBUG)
                {
                    console.log(getIndent() + "JS MO clipBegin adjusted to ZERO");
                }
                node.clipBegin = 0;
            }

            safeCopyProperty("clipEnd", nodeDTO, node);
            if (node.clipEnd && node.clipEnd.length && node.clipEnd.length > 0)
            {
                console.error("SMIL clipEnd is string, parsing float... (" + node.clipEnd + ")");
                node.clipEnd = parseFloat(node.clipEnd);
            }
            if (node.clipEnd <= node.clipBegin)
            {
                if (smilModel.mo.DEBUG)
                {
                    console.log(getIndent() + "JS MO clipEnd adjusted to MAX");
                }
                node.clipEnd = node.MAX;
            }
            
            //node.updateMediaManifestItemId(); ONLY XHTML SPINE ITEMS 
        }
        else {
            console.error("Unexpected smil node type: " + nodeDTO.nodeType);
            return undefined;
        }

        return node;

    };

    // recursive copy of a tree, helper function
    var copyChildren = function(from, to) {

        var count = from.children.length;

        for(var i = 0; i < count; i++) {
            var node = createNodeFromDTO(from.children[i], to);
            node.index = i;
            to.children.push(node);
        }

    };

    copyChildren(smilDTO, smilModel);

    return smilModel;

};

return SmilModel;
});

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

define('readium_shared_js/models/media_overlay',["./smil_model"], function(SmilModel) {

/**
 * Wrapper of the MediaOverlay object
 *
 * @class Models.MediaOverlay
 * @constructor
 * @param {Models.Package} packageModel  EPUB package
*/

var MediaOverlay = function(packageModel) {

    /**
     * The parent package object
     *
     * @property package
     * @type Models.Package
     */    
    this.package = packageModel;

    /**
     * Checks if a parallel smil node exists at a given timecode. 
     * Returns the first corresponding node found in a smil model found, or undefined.
     *
     * @method     parallelAt
     * @param      {number} timeMilliseconds
     * @return     {Smil.ParNode}  
     */

    this.parallelAt = function(timeMilliseconds)
    {
        var offset = 0;
        
        for (var i = 0; i < this.smil_models.length; i++)
        {
            var smilData = this.smil_models[i];
            
            var timeAdjusted = timeMilliseconds - offset;

            var para = smilData.parallelAt(timeAdjusted);
            if (para)
            {
                return para;
            }

            offset += smilData.durationMilliseconds_Calculated();
        }

        return undefined;
    };
    
    /**
     * Calculates a timecode corresponding to a percent of the total audio duration (the function parameters smilData, par, and milliseconds are objects with a single field using the same name)
     *
     * @method     percentToPosition
     * @param      {Number} percent
     * @param      {Models.SmilModel} smilData (object with a single field using the same name, used as OUT param)
     * @param      {Smil.ParNode} par (object with a single field using the same name, used as OUT param)
     * @param      {Number} milliseconds (object with a single field using the same name, used as OUT param)
     */

    this.percentToPosition = function(percent, smilData, par, milliseconds)
    {
        if (percent < 0.0 || percent > 100.0)
        {
            percent = 0.0;
        }
            
        var total = this.durationMilliseconds_Calculated();

        var timeMs = total * (percent / 100.0);

        par.par = this.parallelAt(timeMs);
        if (!par.par)
        {
            return;
        }
        
        var smilDataPar = par.par.getSmil();
        if (!smilDataPar)
        {
            return;
        }
        
        var smilDataOffset = 0;
        
        for (var i = 0; i < this.smil_models.length; i++)
        {
            smilData.smilData = this.smil_models[i];
            if (smilData.smilData == smilDataPar)
            {
                break;
            }
            smilDataOffset += smilData.smilData.durationMilliseconds_Calculated();
        }

        milliseconds.milliseconds = timeMs - (smilDataOffset + smilData.smilData.clipOffset(par.par));
    };

    /**
     * Calculates the accumulated audio duration of each smil overlay
     *
     * @method     durationMilliseconds_Calculated
     * @return     {Number} total duration 
     */

    this.durationMilliseconds_Calculated = function()
    {
        var total = 0;
        
        for (var i = 0; i < this.smil_models.length; i++)
        {
            var smilData = this.smil_models[i];

            total += smilData.durationMilliseconds_Calculated();
        }
        
        return total;
    };
    
    /**
     * Returns the smil overlay at the given index
     *
     * @method     smilAt
     * @param      {Number} smilIndex
     * @return     {Models.SmilModel}
     */

    this.smilAt = function(smilIndex)
    {
        if (smilIndex < 0 || smilIndex >= this.smil_models.length)
        {
            return undefined;
        }
        
        return this.smil_models[smilIndex];
    }
    
    /**
     * Calculates a percent of the total audio duration corresponding to a timecode
     * 
     * @method     positionToPercent
     * @param      {Number} smilIndex Index of a smil model
     * @param      {Number} parIndex
     * @param      {Number} milliseconds
     * @return     {Number} percent 
     */

    this.positionToPercent = function(smilIndex, parIndex, milliseconds)
    {
           
        if (smilIndex >= this.smil_models.length)
        {
            return -1.0;
        }

        var smilDataOffset = 0;
        for (var i = 0; i < smilIndex; i++)
        {
            var sd = this.smil_models[i];
            smilDataOffset += sd.durationMilliseconds_Calculated();
        }
        
        var smilData = this.smil_models[smilIndex];

        var par = smilData.nthParallel(parIndex);
        if (!par)
        {
            return -1.0;
        }

        var offset = smilDataOffset + smilData.clipOffset(par) + milliseconds;
        
        var total = this.durationMilliseconds_Calculated();

        var percent = (offset / total) * 100;
        
        return percent;
      };

    /**
     * Array of smil models {Models.SmilModel}
     *
     * @property smil_models
     * @type Array
     */

    this.smil_models = [];

    /**
     * List of the skippable smil items
     *
     * @property skippables
     * @type Array
     */

    this.skippables = [];
    
    /**
     * List of the escapable smil items
     *
     * @property escapables
     * @type Array
     */

    this.escapables = [];

    /**
     * Duration of the smil audio
     *
     * @property duration
     * @type Number
     */

    this.duration = undefined;

    /**
     * Narrator
     *
     * @property narrator
     * @type String
     */

    this.narrator = undefined;

    /**
     * Author-defined name of the CSS "active class" (applied to the document as a whole)
     *
     * @property activeClass
     * @type String
     */

    this.activeClass = undefined;

    /**
     * Author-defined name of the CSS "playback active class" (applied to a single audio fragment)
     *
     * @property playbackActiveClass
     * @type String
     */

    this.playbackActiveClass = undefined;

    // Debug messages, must be false in production!
    this.DEBUG = false;

    /**
     * Returns the smil model corresponding to a spine item, or undefined if not found.
     *
     * @method     getSmilBySpineItem
     * @param      {Models.SpineItem} spineItem
     * @return     {Models.SmilModel} 
     */

    this.getSmilBySpineItem = function (spineItem) {
        if (!spineItem) return undefined;

        for(var i = 0, count = this.smil_models.length; i < count; i++)
        {
            var smil = this.smil_models[i];
            if(smil.spineItemId === spineItem.idref) {
                if (spineItem.media_overlay_id !== smil.id)
                {
                    console.error("SMIL INCORRECT ID?? " + spineItem.media_overlay_id + " /// " + smil.id);
                }
                return smil;
            }
        }

        return undefined;
    };

    /*
    this.getSmilById = function (id) {

        for(var i = 0, count = this.smil_models.length; i < count; i++) {

            var smil = this.smil_models[i];
            if(smil.id === id) {
                return smil;
            }
        }

        return undefined;
    };
    */

    /**
     * Returns the next smil model
     *
     * @method     getNextSmil
     * @param      {Models.SmilModel} smil The current smil model
     * @return     {Models.SmilModel} 
     */

    this.getNextSmil = function(smil) {

        var index = this.smil_models.indexOf(smil);
        if(index == -1 || index == this.smil_models.length - 1) {
            return undefined;
        }

        return this.smil_models[index + 1];
    }

    /**
     * Returns the previous smil model
     *
     * @method     getPreviousSmil
     * @param      {Models.SmilModel} smil The current smil model
     * @return     {Models.SmilModel} 
     */

    this.getPreviousSmil = function(smil) {

        var index = this.smil_models.indexOf(smil);
        if(index == -1 || index == 0) {
            return undefined;
        }

        return this.smil_models[index - 1];
    }
};

/**
 * Static MediaOverlay.fromDTO method, returns a clean MediaOverlay object
 *
 * @method MediaOverlay.fromDTO
 * @param {Object} moDTO Media overlay data object (raw JSON, as returned by a parser)
 * @param {Models.Package} packageModel EPUB package object
 * @return {Models.MediaOverlay}
*/

MediaOverlay.fromDTO = function(moDTO, packageModel) {

    var mo = new MediaOverlay(packageModel);

    if(!moDTO) {
        return mo;
    }

    mo.duration = moDTO.duration;
    if (mo.duration && mo.duration.length && mo.duration.length > 0)
    {
        console.error("SMIL total duration is string, parsing float... (" + mo.duration + ")");
        mo.duration = parseFloat(mo.duration);
    }
    if (mo.DEBUG)
        console.debug("Media Overlay Duration (TOTAL): " + mo.duration);

    mo.narrator = moDTO.narrator;
    if (mo.DEBUG)
        console.debug("Media Overlay Narrator: " + mo.narrator);

    mo.activeClass = moDTO.activeClass;
    if (mo.DEBUG)
        console.debug("Media Overlay Active-Class: " + mo.activeClass);

    mo.playbackActiveClass = moDTO.playbackActiveClass;
    if (mo.DEBUG)
        console.debug("Media Overlay Playback-Active-Class: " + mo.playbackActiveClass);

    var count = moDTO.smil_models.length;
    if (mo.DEBUG)
        console.debug("Media Overlay SMIL count: " + count);

    for(var i = 0; i < count; i++) {
        var smilModel = SmilModel.fromSmilDTO(moDTO.smil_models[i], mo);
        mo.smil_models.push(smilModel);

        if (mo.DEBUG)
            console.debug("Media Overlay Duration (SPINE ITEM): " + smilModel.duration);
    }

    count = moDTO.skippables.length;
    if (mo.DEBUG)
        console.debug("Media Overlay SKIPPABLES count: " + count);

    for(var i = 0; i < count; i++) {
        mo.skippables.push(moDTO.skippables[i]);
    }

    count = moDTO.escapables.length;
    if (mo.DEBUG)
        console.debug("Media Overlay ESCAPABLES count: " + count);

    for(var i = 0; i < count; i++) {
        mo.escapables.push(moDTO.escapables[i]);

    }

    return mo;
};

return MediaOverlay;
});



//  Created by Boris Schneiderman.
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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


define('readium_shared_js/models/package_data',[],function() {
/**
 * This object is not instantiated directly but provided by the host application to the DOMAccess layer in the
 * Views.ReaderView.OpenBookData function
 *
 * Provided for reference only
 *
 * @class Models.PackageData
 */
var PackageData = {

    /**
     * The Url of the package file
     *
     * @property rootUrl 
     * @type {String}
     *
     */
    rootUrl: "",
    /**
     * The Url of the package file, to prefix Media Overlays SMIL audio references
     *
     * @property rootUrlMO 
     * @type {String}
     *
     */
    rootUrlMO: "",
    /**
     * The rendering layout; expected values are "reflowable"|"pre-paginated"
     *
     * @property rendering_layout 
     * @type {String}
     */
    rendering_layout: "",

    /**
     * The spine properties
     *
     * @property spine 
     * @type {Object}
     */
    spine: {

        direction: "ltr",
        items: [
            {
                href:"",
                idref:"",
                page_spread:"", //"page-spread-left"|"page-spread-right"|"page-spread-center"
                rendering_layout:"" //"reflowable"|"pre-paginated"
            }
        ]
    }
};

return PackageData;
});
//  Created by Boris Schneiderman.
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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
define('readium_shared_js/models/package',['../helpers','./spine_item','./spine','./media_overlay', './package_data', 'URIjs'], function (Helpers, SpineItem, Spine, MediaOverlay, PackageData, URI) {

/**
 *  Wrapper of the Package object, created in openBook()
 *
 * @class  Models.Package
 * @constructor
 * @param {Models.PackageData} packageData container for package properties 
 */
var Package = function(packageData){

    var self = this;
    
    /**
     * The associated spine object
     *
     * @property spine
     * @type     Models.Spine
     */
    this.spine = undefined;

    /**
     * The root URL of the package file
     *
     * @property rootUrl
     * @type     String
     */
    this.rootUrl = undefined;

    /**
     * The root URL of the package file, to prefix Media Overlays SMIL audio references
     *
     * @property rootUrlMO 
     * @type     String
     *
     */
    this.rootUrlMO = undefined;
 
    /**
     * The Media Overlays object
     *
     * @property media_overlay 
     * @type     Models.MediaOverlay
     *
     */   
    this.media_overlay = undefined;
    
    /**
     * The rendition viewport (as per the EPUB3 specification)
     *
     * @property rendition_viewport 
     * @type     String
     *
     */   
    this.rendition_viewport = undefined;
    
    /**
     * The rendition flow (as per the EPUB3 specification)
     *
     * @property rendition_flow 
     * @type     String
     *
     */   
    this.rendition_flow = undefined;
    
    /**
     * The rendition layout (as per the EPUB3 specification)
     *
     * @property rendition_layout 
     * @type     String
     *
     */   
    this.rendition_layout = undefined;

    /**
     * The rendition spread (as per the EPUB3 specification)
     *
     * @property rendition_spread 
     * @type     String
     *
     */   
    this.rendition_spread = undefined;

    /**
     * The rendition orientation (as per the EPUB3 specification)
     *
     * @property rendition_orientation 
     * @type     String
     *
     */   
    this.rendition_orientation = undefined;

    /**
     * Returns a resolved relative Url, Media Overlay variant.
     *
     * @method     resolveRelativeUrlMO
     * @param      {String} relativeUrl  the relative URL to resolve
     * @return     {String} the resolved relative URL.
     */
    this.resolveRelativeUrlMO = function(relativeUrl) {
        
        var relativeUrlUri = undefined;
        try {
            relativeUrlUri = new URI(relativeUrl);
        } catch(err) {
            console.error(err);
            console.log(relativeUrl);
        }
        if (relativeUrlUri && relativeUrlUri.is("absolute")) return relativeUrl; //relativeUrlUri.scheme() == "http://", "https://", "data:", etc.


        if(self.rootUrlMO && self.rootUrlMO.length > 0) {

            var url = self.rootUrlMO;
            
            try {
                //url = new URI(relativeUrl).absoluteTo(url).search('').hash('').toString();
                url = new URI(url).search('').hash('').toString();
            } catch(err) {
                console.error(err);
                console.log(url);
            }
            
            if(Helpers.EndsWith(url, "/")){
                return url + relativeUrl;
            }
            else {
                return url + "/" + relativeUrl;
            }
        }

        return self.resolveRelativeUrl(relativeUrl);
    };

    /**
     * Returns a resolved relative Url.
     *
     * @method     resolveRelativeUrl
     * @param      {String} relativeUrl  the relative URL to resolve
     * @return     {String} the resolved relative URL.
     */
    this.resolveRelativeUrl = function(relativeUrl) {

        var relativeUrlUri = undefined;
        try {
            relativeUrlUri = new URI(relativeUrl);
        } catch(err) {
            console.error(err);
            console.log(relativeUrl);
        }
        if (relativeUrlUri && relativeUrlUri.is("absolute")) return relativeUrl; //relativeUrlUri.scheme() == "http://", "https://", "data:", etc.

        
        if(self.rootUrl) {

            var url = self.rootUrl;
            
            try {
                //url = new URI(relativeUrl).absoluteTo(url).search('').hash('').toString();
                url = new URI(url).search('').hash('').toString();
            } catch(err) {
                console.error(err);
                console.log(url);
            }
            
            if(Helpers.EndsWith(url, "/")){
                return url + relativeUrl;
            }
            else {
                return url + "/" + relativeUrl;
            }
        }

        return relativeUrl;
    };

    /**
     * Checks if the package is Fixed Layout.
     *
     * @method     isFixedLayout
     * @return     {Boolean} TRUE if the package is Fixed Layout.
     */
    this.isFixedLayout = function() {
        return self.rendition_layout === SpineItem.RENDITION_LAYOUT_PREPAGINATED;
    };

    /**
     * Checks if the package is Reflowable.
     *
     * @method     isReflowable
     * @return     {Boolean} TRUE if the package is Reflowable (i.e. not Fixed Layout).
     */
    this.isReflowable = function() {
        return !self.isFixedLayout();
    };
    
    if(packageData) {
        
        this.rootUrl = packageData.rootUrl;
        this.rootUrlMO = packageData.rootUrlMO;

        this.rendition_viewport = packageData.rendition_viewport;

        this.rendition_layout = packageData.rendition_layout;

        this.rendition_flow = packageData.rendition_flow;
        this.rendition_orientation = packageData.rendition_orientation;
        this.rendition_spread = packageData.rendition_spread;
        
        this.spine = new Spine(this, packageData.spine);

        this.media_overlay = MediaOverlay.fromDTO(packageData.media_overlay, this);
    }
};

return Package;
});


//  Created by Juan Corona
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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
define('readium_shared_js/models/metadata',[], function () {

    /**
     *  Wrapper of the Metadata object, created in openBook()
     *
     * @class  Models.Metadata
     */
    var Metadata = function(packageMetadata) {
        this.identifier = undefined;
        this.title = undefined;
        this.author = undefined;
        this.description = undefined;
        this.publisher = undefined;
        this.language = undefined;
        this.rights = undefined;
        this.modifiedDate = undefined;
        this.publishedDate = undefined;
        this.epubVersion = undefined;

        if (packageMetadata) {
            this.identifier = packageMetadata.id;
            this.title = packageMetadata.title;
            this.author = packageMetadata.author;
            this.description = packageMetadata.description;
            this.language = packageMetadata.language;
            this.publisher = packageMetadata.publisher;
            this.rights = packageMetadata.rights;
            this.modifiedDate = packageMetadata.modified_date;
            this.publishedDate = packageMetadata.pubdate;
            this.epubVersion = packageMetadata.epub_version;
        }
    };

    return Metadata;
});



//  LauncherOSX
//
//  Created by Boris Schneiderman.
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

define('readium_shared_js/views/reflowable_view',["../globals", "jquery", "underscore", "eventEmitter", "../models/bookmark_data", "./cfi_navigation_logic",
    "../models/current_pages_info", "../helpers", "../models/page_open_request",
    "../models/viewer_settings", "ResizeSensor"],
    function(Globals, $, _, EventEmitter, BookmarkData, CfiNavigationLogic,
             CurrentPagesInfo, Helpers, PageOpenRequest,
             ViewerSettings, ResizeSensor) {
/**
 * Renders reflowable content using CSS columns
 * @param options
 * @constructor
 */
var ReflowableView = function(options, reader){
    $.extend(this, new EventEmitter());

    var self = this;

    var _$viewport = options.$viewport;
    var _spine = options.spine;
    var _userStyles = options.userStyles;
    var _bookStyles = options.bookStyles;
    var _iframeLoader = options.iframeLoader;

    var _currentSpineItem;
    var _isWaitingFrameRender = false;
    var _deferredPageRequest;
    var _fontSize = 100;
    var _fontSelection = 0;
    var _$contentFrame;
    var _navigationLogic;
    var _$el;
    var _$iframe;
    var _$epubHtml;
    var _lastPageRequest = undefined;

    var _cfiClassBlacklist = ["cfi-marker", "mo-cfi-highlight", "resize-sensor", "resize-sensor-expand", "resize-sensor-shrink", "resize-sensor-inner", "js-hypothesis-config", "js-hypothesis-embed"];
    var _cfiElementBlacklist = ["hypothesis-adder"];
    var _cfiIdBlacklist = ["MathJax_Message", "MathJax_SVG_Hidden"];

    var _$htmlBody;

    var _htmlBodyIsVerticalWritingMode;
    var _htmlBodyIsLTRDirection;
    var _htmlBodyIsLTRWritingMode;


    var _currentOpacity = -1;

    var _lastViewPortSize = {
        width: undefined,
        height: undefined
    };

    var _lastBodySize = {
        width: undefined,
        height: undefined
    };

    var _paginationInfo = {

        visibleColumnCount : 2,
        columnGap : 20,
        columnMaxWidth: 550,
        columnMinWidth: 400,
        spreadCount : 0,
        currentSpreadIndex : 0,
        currentPageIndex: 0,
        columnWidth : undefined,
        pageOffset : 0,
        columnCount: 0
    };

    this.render = function(){

        var template = Helpers.loadTemplate("reflowable_book_frame", {});

        _$el = $(template);
        _$viewport.append(_$el);

        var settings = reader.viewerSettings();
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
        {
            //defaults
            settings = new ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {
            // This fixes rendering issues with WebView (native apps), which clips content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
            _$el.css("transform", "translateZ(0)");
        }

        // See ReaderView.handleViewportResize
        // var lazyResize = _.debounce(self.onViewportResize, 100);
        // $(window).on("resize.ReadiumSDK.reflowableView", _.bind(lazyResize, self));
        renderIframe();

        return self;
    };

    function setFrameSizesToRectangle(rectangle) {
        _$contentFrame.css("left", rectangle.left + "px");
        _$contentFrame.css("top", rectangle.top + "px");
        _$contentFrame.css("right", rectangle.right + "px");
        _$contentFrame.css("bottom", rectangle.bottom + "px");

    }

    this.remove = function() {

        //$(window).off("resize.ReadiumSDK.reflowableView");
        _$el.remove();

    };

    this.isReflowable = function() {
        return true;
    };

    this.onViewportResize = function() {

        if(updateViewportSize()) {
            updatePagination();
        }
    };

    var _viewSettings = undefined;
    this.setViewSettings = function(settings, docWillChange) {

        _viewSettings = settings;

        _paginationInfo.columnGap = settings.columnGap;
        _paginationInfo.columnMaxWidth = settings.columnMaxWidth;
        _paginationInfo.columnMinWidth = settings.columnMinWidth;
        
        _fontSize = settings.fontSize;
        _fontSelection = settings.fontSelection;

        updateViewportSize();

        if (!docWillChange) {
            updateColumnGap();

            updateHtmlFontInfo();
        }
    };
    
    function getFrameDimensions() {
        return {
            width: _$iframe[0].clientWidth,
            height: _$iframe[0].clientHeight
        };
    }

    function getPageOffset() {
        if (_paginationInfo.rightToLeft && !_paginationInfo.isVerticalWritingMode) {
            return -_paginationInfo.pageOffset;
        }
        return _paginationInfo.pageOffset;
    }

    function getPaginationOffsets() {
        var offset = getPageOffset();
        if (_paginationInfo.isVerticalWritingMode) {
            return {
                top: offset,
                left: 0
            };
        }
        return {
            top: 0,
            left: offset
        };
    }

    function renderIframe() {
        if (_$contentFrame) {
            //destroy old contentFrame
            _$contentFrame.remove();
        }

        var template = Helpers.loadTemplate("reflowable_book_page_frame", {});
        var $bookFrame = $(template);
        $bookFrame = _$el.append($bookFrame);

        _$contentFrame = $("#reflowable-content-frame", $bookFrame);

        _$iframe = $("#epubContentIframe", $bookFrame);

        _$iframe.css("left", "");
        _$iframe.css("right", "");
        _$iframe.css("position", "relative");
        //_$iframe.css(_spine.isLeftToRight() ? "left" : "right", "0px");
        _$iframe.css("overflow", "hidden");

        _navigationLogic = new CfiNavigationLogic({
            $iframe: _$iframe,
            frameDimensionsGetter: getFrameDimensions,
            paginationInfo: _paginationInfo,
            paginationOffsetsGetter: getPaginationOffsets,
            classBlacklist: _cfiClassBlacklist,
            elementBlacklist: _cfiElementBlacklist,
            idBlacklist: _cfiIdBlacklist
        });
    }

    function loadSpineItem(spineItem) {

        if(_currentSpineItem != spineItem) {

            //create & append iframe to container frame
            renderIframe();
            if (_currentSpineItem) {
                Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "reflowable_view.js [ " + _currentSpineItem.href + " ]");
                self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, _$iframe, _currentSpineItem);
            }

            self.resetCurrentPosition();

            _paginationInfo.pageOffset = 0;
            _paginationInfo.currentSpreadIndex = 0;
            _paginationInfo.currentPageIndex = 0;
            _currentSpineItem = spineItem;
            
            // TODO: this is a dirty hack!!
            _currentSpineItem.paginationInfo = _paginationInfo; 
            
            _isWaitingFrameRender = true;

            var src = _spine.package.resolveRelativeUrl(spineItem.href);
            
            Globals.logEvent("CONTENT_DOCUMENT_LOAD_START", "EMIT", "reflowable_view.js [ " + spineItem.href + " -- " + src + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOAD_START, _$iframe, spineItem);

            _$iframe.css("opacity", "0.01");

            _iframeLoader.loadIframe(_$iframe[0], src, onIFrameLoad, self, {spineItem : spineItem});
        }
    }

    function updateHtmlFontInfo() {
    
        if(_$epubHtml) {
            var i = _fontSelection;
            var useDefault = !reader.fonts || !reader.fonts.length || i <= 0 || (i-1) >= reader.fonts.length;
            var font = (useDefault ?
                        {} :
                        reader.fonts[i - 1]);
            Helpers.UpdateHtmlFontAttributes(_$epubHtml, _fontSize, font, function() {self.applyStyles();});
        }
    }

    function updateColumnGap() {

        if(_$epubHtml) {

            _$epubHtml.css("column-gap", _paginationInfo.columnGap + "px");
        }
    }

    function onIFrameLoad(success) {

        _isWaitingFrameRender = false;

        //while we where loading frame new request came
        if(_deferredPageRequest && _deferredPageRequest.spineItem != _currentSpineItem) {
            loadSpineItem(_deferredPageRequest.spineItem);
            return;
        }

        if(!success) {
            _$iframe.css("opacity", "1");
            _deferredPageRequest = undefined;
            return;
        }

        Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "reflowable_view.js [ " + _currentSpineItem.href + " ]");
        self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, _$iframe, _currentSpineItem);

        var epubContentDocument = _$iframe[0].contentDocument;
        _$epubHtml = $("html", epubContentDocument);
        _$htmlBody = $("body", _$epubHtml);

        // TODO: how to address this correctly across all the affected platforms?!
        // Video surface sometimes (depends on the video codec) disappears from CSS column (i.e. reflow page) during playback
        // (audio continues to play normally, but video canvas is invisible).
        // https://github.com/readium/readium-js-viewer/issues/265#issuecomment-73018762
        // ...Meanwhile, reverting https://github.com/readium/readium-js-viewer/issues/239
        // by commenting the code below (which unfortunately only works with some GPU / codec configurations,
        // but actually fails on several other machines!!)
        /*
        if(window.chrome
            && window.navigator.vendor === "Google Inc.") // TODO: Opera (WebKit) sometimes suffers from this rendering bug too (depends on the video codec), but unfortunately GPU-accelerated rendering makes the video controls unresponsive!!
        {
            $("video", _$htmlBody).css("transform", "translateZ(0)");
        }
        */

        _htmlBodyIsVerticalWritingMode = false;
        _htmlBodyIsLTRDirection = true;
        _htmlBodyIsLTRWritingMode = undefined;

        var win = _$iframe[0].contentDocument.defaultView || _$iframe[0].contentWindow;

        //Helpers.isIframeAlive
        var htmlBodyComputedStyle = win.getComputedStyle(_$htmlBody[0], null);
        if (htmlBodyComputedStyle)
        {
            _htmlBodyIsLTRDirection = htmlBodyComputedStyle.direction === "ltr";

            var writingMode = undefined;
            if (htmlBodyComputedStyle.getPropertyValue)
            {
                writingMode = htmlBodyComputedStyle.getPropertyValue("-webkit-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-moz-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-ms-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-o-writing-mode") || htmlBodyComputedStyle.getPropertyValue("-epub-writing-mode") || htmlBodyComputedStyle.getPropertyValue("writing-mode");
            }
            else
            {
                writingMode = htmlBodyComputedStyle.webkitWritingMode || htmlBodyComputedStyle.mozWritingMode || htmlBodyComputedStyle.msWritingMode || htmlBodyComputedStyle.oWritingMode || htmlBodyComputedStyle.epubWritingMode || htmlBodyComputedStyle.writingMode;
            }

            if (writingMode)
            {
                _htmlBodyIsLTRWritingMode = writingMode.indexOf("-lr") >= 0; // || writingMode.indexOf("horizontal-") >= 0; we need explicit!

                if (writingMode.indexOf("vertical") >= 0 || writingMode.indexOf("tb-") >= 0 || writingMode.indexOf("bt-") >= 0)
                {
                    _htmlBodyIsVerticalWritingMode = true;
                }
            }
        }

        if (_htmlBodyIsLTRDirection)
        {
            if (_$htmlBody[0].getAttribute("dir") === "rtl" || _$epubHtml[0].getAttribute("dir") === "rtl")
            {
                _htmlBodyIsLTRDirection = false;
            }
        }

        // Some EPUBs may not have explicit RTL content direction (via CSS "direction" property or @dir attribute) despite having a RTL page progression direction. Readium consequently tweaks the HTML in order to restore the correct block flow in the browser renderer, resulting in the appropriate CSS columnisation (which is used to emulate pagination).
        if (!_spine.isLeftToRight() && _htmlBodyIsLTRDirection && !_htmlBodyIsVerticalWritingMode)
        {
            _$htmlBody[0].setAttribute("dir", "rtl");
            _htmlBodyIsLTRDirection = false;
            _htmlBodyIsLTRWritingMode = false;
        }

        _paginationInfo.isVerticalWritingMode = _htmlBodyIsVerticalWritingMode; 

        hideBook();
        _$iframe.css("opacity", "1");

        updateViewportSize();
        _$epubHtml.css("height", _lastViewPortSize.height + "px");

        _$epubHtml.css("position", "relative");
        _$epubHtml.css("margin", "0");
        _$epubHtml.css("padding", "0");

        _$epubHtml.css("column-axis", (_htmlBodyIsVerticalWritingMode ? "vertical" : "horizontal"));

        //
        // /////////
        // //Columns Debugging
        //
        //     _$epubHtml.css("column-rule-color", "red");
        //     _$epubHtml.css("column-rule-style", "dashed");
        //     _$epubHtml.css("column-rule-width", "1px");
        // _$epubHtml.css("background-color", '#b0c4de');
        //
        // ////

        self.applyBookStyles();
        resizeImages();

        updateColumnGap();

        updateHtmlFontInfo();
    }

    this.applyStyles = function() {

        Helpers.setStyles(_userStyles.getStyles(), _$el.parent());

        //because left, top, bottom, right setting ignores padding of parent container
        //we have to take it to account manually
        var elementMargins = Helpers.Margins.fromElement(_$el);
        setFrameSizesToRectangle(elementMargins.padding);


        updateViewportSize();
        updatePagination();
    };

    this.applyBookStyles = function() {

        if(_$epubHtml) { // implies _$iframe
            Helpers.setStyles(_bookStyles.getStyles(), _$iframe[0].contentDocument); //_$epubHtml
        }
    };

    function openDeferredElement() {

        if(!_deferredPageRequest) {
            return;
        }

        var deferredData = _deferredPageRequest;
        _deferredPageRequest = undefined;
        self.openPage(deferredData);

    }

    function _openPageInternal(pageRequest) {

        if(_isWaitingFrameRender) {
            _deferredPageRequest = pageRequest;
            return false;
        }

        // if no spine item specified we are talking about current spine item
        if(pageRequest.spineItem && pageRequest.spineItem != _currentSpineItem) {
            _deferredPageRequest = pageRequest;
            loadSpineItem(pageRequest.spineItem);
            return true;
        }

        var pageIndex = undefined;


        if(pageRequest.spineItemPageIndex !== undefined) {
            pageIndex = pageRequest.spineItemPageIndex;
        }
        else if(pageRequest.elementId) {
            pageIndex = _paginationInfo.currentPageIndex + _navigationLogic.getPageIndexDeltaForElementId(pageRequest.elementId);
        }
        else if(pageRequest.firstVisibleCfi && pageRequest.lastVisibleCfi) {
            var firstPageIndex;
            var lastPageIndex;
            try
            {
                firstPageIndex = _navigationLogic.getPageIndexDeltaForCfi(pageRequest.firstVisibleCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
            }
            catch (e)
            {
                firstPageIndex = 0;
                console.error(e);
            }
            try
            {
                lastPageIndex = _navigationLogic.getPageIndexDeltaForCfi(pageRequest.lastVisibleCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
            }
            catch (e)
            {
                lastPageIndex = 0;
                console.error(e);
            }
            // Go to the page in the middle of the two elements
            pageIndex = _paginationInfo.currentPageIndex + Math.round((firstPageIndex + lastPageIndex) / 2);
        }
        else if(pageRequest.elementCfi) {
            try
            {
                pageIndex = _paginationInfo.currentPageIndex + _navigationLogic.getPageIndexDeltaForCfi(pageRequest.elementCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
            }
            catch (e)
            {
                pageIndex = 0;
                console.error(e);
            }
        }
        else if(pageRequest.firstPage) {
            pageIndex = 0;
        }
        else if(pageRequest.lastPage) {
            pageIndex = _paginationInfo.columnCount - 1;
        }
        else {
            console.debug("No criteria in pageRequest");
            pageIndex = 0;
        }

        if (pageIndex < 0 || pageIndex > _paginationInfo.columnCount) {
            console.log('Illegal pageIndex value: ', pageIndex, 'column count is ', _paginationInfo.columnCount);
            pageIndex = pageIndex < 0 ? 0 : _paginationInfo.columnCount;
        }

        _paginationInfo.currentPageIndex = pageIndex;
        _paginationInfo.currentSpreadIndex = Math.floor(pageIndex / _paginationInfo.visibleColumnCount) ;
        onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        return true;
    }

    this.openPage = function(pageRequest) {
        // Go to request page, it will save the new position in onPaginationChanged
        _openPageInternal(pageRequest);
        // Save it for when pagination is updated
        _lastPageRequest = pageRequest;
    };

    this.resetCurrentPosition = function() {
        _lastPageRequest = undefined;
    };

    this.saveCurrentPosition = function() {
        // If there's a deferred page request, there's no point in saving the current position
        // as it's going to change soon
        if (_deferredPageRequest) {
            return;
        }

        var _firstVisibleCfi = self.getFirstVisibleCfi();
        var _lastVisibleCfi = self.getLastVisibleCfi();
        _lastPageRequest = new PageOpenRequest(_currentSpineItem, self);
        _lastPageRequest.setFirstAndLastVisibleCfi(_firstVisibleCfi.contentCFI, _lastVisibleCfi.contentCFI);
    };

    this.restoreCurrentPosition = function() {
        if (_lastPageRequest) {
            _openPageInternal(_lastPageRequest);
        }
    };

    function redraw() {

        var offsetVal =  -_paginationInfo.pageOffset + "px";

        if (_htmlBodyIsVerticalWritingMode)
        {
            _$epubHtml.css("top", offsetVal);
        }
        else
        {
            var ltr = _htmlBodyIsLTRDirection || _htmlBodyIsLTRWritingMode;

            _$epubHtml.css("left", ltr ? offsetVal : "");
            _$epubHtml.css("right", !ltr ? offsetVal : "");
        }

        showBook(); // as it's no longer hidden by shifting the position
    }

    function updateViewportSize() {

        var newWidth = _$contentFrame.width();
        
        // Ensure that the new viewport width is always even numbered
        // this is to prevent a rendering inconsistency between browsers when odd-numbered bounds are used for CSS columns
        // See https://github.com/readium/readium-shared-js/issues/37
        newWidth -= newWidth % 2;

        var newHeight = _$contentFrame.height();

        if(_lastViewPortSize.width !== newWidth || _lastViewPortSize.height !== newHeight){

            _lastViewPortSize.width = newWidth;
            _lastViewPortSize.height = newHeight;
            return true;
        }

        return false;
    }

    function onPaginationChanged_(initiator, paginationRequest_spineItem, paginationRequest_elementId) {
        _paginationInfo.currentPageIndex = _paginationInfo.currentSpreadIndex * _paginationInfo.visibleColumnCount;
        _paginationInfo.pageOffset = (_paginationInfo.columnWidth + _paginationInfo.columnGap) * _paginationInfo.visibleColumnCount * _paginationInfo.currentSpreadIndex;
        
        redraw();

        _.defer(function () {

            if (_lastPageRequest == undefined) {
                self.saveCurrentPosition();
            }
            
            Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "EMIT", "reflowable_view.js");
            self.emit(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, {
                paginationInfo: self.getPaginationInfo(),
                initiator: initiator,
                spineItem: paginationRequest_spineItem,
                elementId: paginationRequest_elementId
            });
        });
    }
    var onPaginationChanged = _.debounce(onPaginationChanged_, 100);

    this.openPagePrev = function (initiator) {

        if(!_currentSpineItem) {
            return;
        }

        if(_paginationInfo.currentSpreadIndex > 0) {
            // Page will change, the current position is not valid any more
            // Reset it so it's saved next time onPaginationChanged is called
            this.resetCurrentPosition();
            _paginationInfo.currentSpreadIndex--;
            onPaginationChanged(initiator, _currentSpineItem);
        }
        else {

            var prevSpineItem = _spine.prevItem(_currentSpineItem, true);
            if(prevSpineItem) {

                var pageRequest = new PageOpenRequest(prevSpineItem, initiator);
                pageRequest.setLastPage();
                self.openPage(pageRequest);
            }
        }
    };

    this.openPageNext = function (initiator) {

        if(!_currentSpineItem) {
            return;
        }

        if(_paginationInfo.currentSpreadIndex < _paginationInfo.spreadCount - 1) {
            // Page will change, the current position is not valid any more
            // Reset it so it's saved next time onPaginationChanged is called
            this.resetCurrentPosition();
            _paginationInfo.currentSpreadIndex++;
            onPaginationChanged(initiator, _currentSpineItem);
        }
        else {

            var nextSpineItem = _spine.nextItem(_currentSpineItem, true);
            if(nextSpineItem) {

                var pageRequest = new PageOpenRequest(nextSpineItem, initiator);
                pageRequest.setFirstPage();
                self.openPage(pageRequest);
            }
        }
    };


    function updatePagination_() {

        // At 100% font-size = 16px (on HTML, not body or descendant markup!)
        var MAXW = _paginationInfo.columnMaxWidth;
        var MINW = _paginationInfo.columnMinWidth;

        var isDoublePageSyntheticSpread = Helpers.deduceSyntheticSpread(_$viewport, _currentSpineItem, _viewSettings);

        var forced = (isDoublePageSyntheticSpread === false) || (isDoublePageSyntheticSpread === true);
        // excludes 0 and 1 falsy/truthy values which denote non-forced result

// console.debug("isDoublePageSyntheticSpread: " + isDoublePageSyntheticSpread);
// console.debug("forced: " + forced);
//
        if (isDoublePageSyntheticSpread === 0)
        {
            isDoublePageSyntheticSpread = 1; // try double page, will shrink if doesn't fit
// console.debug("TRYING SPREAD INSTEAD OF SINGLE...");
        }

        _paginationInfo.visibleColumnCount = isDoublePageSyntheticSpread ? 2 : 1;

        if (_htmlBodyIsVerticalWritingMode)
        {
            MAXW *= 2;
            isDoublePageSyntheticSpread = false;
            forced = true;
            _paginationInfo.visibleColumnCount = 1;
// console.debug("Vertical Writing Mode => single CSS column, but behaves as if two-page spread");
        }

        if(!_$epubHtml) {
            return;
        }

        hideBook(); // shiftBookOfScreen();

        // "borderLeft" is the blank vertical strip (e.g. 40px wide) where the left-arrow button resides, i.e. previous page command
        var borderLeft = parseInt(_$viewport.css("border-left-width"));
        
        // The "columnGap" separates two consecutive columns in a 2-page synthetic spread (e.g. 60px wide).
        // This middle gap (blank vertical strip) actually corresponds to the left page's right-most margin, combined with the right page's left-most margin.
        // So, "adjustedGapLeft" is half of the center strip... 
        var adjustedGapLeft = _paginationInfo.columnGap/2;
        // ...but we include the "borderLeft" strip to avoid wasting valuable rendering real-estate:  
        adjustedGapLeft = Math.max(0, adjustedGapLeft-borderLeft);
        // Typically, "adjustedGapLeft" is zero because the space available for the 'previous page' button is wider than half of the column gap!

        // "borderRight" is the blank vertical strip (e.g. 40px wide) where the right-arrow button resides, i.e. next page command
        var borderRight = parseInt(_$viewport.css("border-right-width"));
        
        // The "columnGap" separates two consecutive columns in a 2-page synthetic spread (e.g. 60px wide).
        // This middle gap (blank vertical strip) actually corresponds to the left page's right-most margin, combined with the right page's left-most margin.
        // So, "adjustedGapRight" is half of the center strip... 
        var adjustedGapRight = _paginationInfo.columnGap/2;
        // ...but we include the "borderRight" strip to avoid wasting valuable rendering real-estate:
        adjustedGapRight = Math.max(0, adjustedGapRight-borderRight);
        // Typically, "adjustedGapRight" is zero because the space available for the 'next page' button is wider than half of the column gap! (in other words, the right-most and left-most page margins are fully included in the strips reserved for the arrow buttons)

        // Note that "availableWidth" does not contain "borderLeft" and "borderRight" (.width() excludes the padding and border and margin in the CSS box model of div#epub-reader-frame)  
        var availableWidth = _$viewport.width();
        
        // ...So, we substract the page margins and button spacing to obtain the width available for actual text:
        var textWidth = availableWidth - adjustedGapLeft - adjustedGapRight;
        
        // ...and if we have 2 pages / columns, then we split the text width in half: 
        if (isDoublePageSyntheticSpread)
        {
            textWidth = (textWidth - _paginationInfo.columnGap) * 0.5;
        }

        var filler = 0;

        // Now, if the resulting width actually available for document content is greater than the maximum allowed value, we create even more left+right blank space to "compress" the horizontal run of text.  
        if (textWidth > MAXW)
        {
            var eachPageColumnReduction = textWidth - MAXW;
            
            // if we have a 2-page synthetic spread, then we "trim" left and right sides by adding "eachPageColumnReduction" blank space.
            // if we have a single page / column, then this loss of text real estate is shared between right and left sides  
            filler = Math.floor(eachPageColumnReduction * (isDoublePageSyntheticSpread ? 1 : 0.5));
        }

        // Let's check whether a narrow two-page synthetic spread (impeded reabability) can be reduced down to a single page / column:
        else if (!forced && textWidth < MINW && isDoublePageSyntheticSpread)
        {
            isDoublePageSyntheticSpread = false;
            _paginationInfo.visibleColumnCount = 1;

            textWidth = availableWidth - adjustedGapLeft - adjustedGapRight;
            if (textWidth > MAXW)
            {
                filler = Math.floor((textWidth - MAXW) * 0.5);
            }
        }
        
        _$el.css({"left": (filler+adjustedGapLeft + "px"), "right": (filler+adjustedGapRight + "px")});
        
        updateViewportSize(); //_$contentFrame ==> _lastViewPortSize

        var resultingColumnWidth = _$el.width();
        if (isDoublePageSyntheticSpread) {
            resultingColumnWidth = (resultingColumnWidth - _paginationInfo.columnGap) / 2;
        }
        resultingColumnWidth = Math.floor(resultingColumnWidth);
        if ((resultingColumnWidth-1) > MAXW) {
            console.debug("resultingColumnWidth > MAXW ! " + resultingColumnWidth + " > " + MAXW);
        }
        

        _$iframe.css("width", _lastViewPortSize.width + "px");
        _$iframe.css("height", _lastViewPortSize.height + "px");

        _$epubHtml.css("height", _lastViewPortSize.height + "px");

        // below min- max- are required in vertical writing mode (height is not enough, in some cases...weird!)
        _$epubHtml.css("min-height", _lastViewPortSize.height + "px");
        _$epubHtml.css("max-height", _lastViewPortSize.height + "px");

        //normalise spacing to avoid interference with column-isation
        _$epubHtml.css('margin', 0);
        _$epubHtml.css('padding', 0);
        _$epubHtml.css('border', 0);

        // In order for the ResizeSensor to work, the content body needs to be "positioned".
        // This may be an issue since it changes the assumptions some content authors might make when positioning their content.
        _$htmlBody.css('position', 'relative');

        _$htmlBody.css('margin', 0);
        _$htmlBody.css('padding', 0);

        _paginationInfo.rightToLeft = _spine.isRightToLeft();

        _paginationInfo.columnWidth = Math.round(((_htmlBodyIsVerticalWritingMode ? _lastViewPortSize.height : _lastViewPortSize.width) - _paginationInfo.columnGap * (_paginationInfo.visibleColumnCount - 1)) / _paginationInfo.visibleColumnCount);

        var useColumnCountNotWidth = _paginationInfo.visibleColumnCount > 1; // column-count == 1 does not work in Chrome, and is not needed anyway (HTML width is full viewport width, no Firefox video flickering)
        if (useColumnCountNotWidth) {
            _$epubHtml.css("width", _lastViewPortSize.width + "px");
            _$epubHtml.css("column-width", "auto");
            _$epubHtml.css("column-count", _paginationInfo.visibleColumnCount);
        } else {
            _$epubHtml.css("width", (_htmlBodyIsVerticalWritingMode ? _lastViewPortSize.width : _paginationInfo.columnWidth) + "px");
            _$epubHtml.css("column-count", "auto");
            _$epubHtml.css("column-width", _paginationInfo.columnWidth + "px");
        }

        _$epubHtml.css("column-fill", "auto");

        _$epubHtml.css({left: "0", right: "0", top: "0"});

        Helpers.triggerLayout(_$iframe);

        var dim = (_htmlBodyIsVerticalWritingMode ? _$epubHtml[0].scrollHeight : _$epubHtml[0].scrollWidth);
        if (dim == 0) {
            console.error("Document dimensions zero?!");
        }

        _paginationInfo.columnCount = (dim + _paginationInfo.columnGap) / (_paginationInfo.columnWidth + _paginationInfo.columnGap);
        _paginationInfo.columnCount = Math.round(_paginationInfo.columnCount);
        if (_paginationInfo.columnCount == 0) {
            console.error("Column count zero?!");
        }

        var totalGaps = (_paginationInfo.columnCount-1) * _paginationInfo.columnGap;
        var colWidthCheck = (dim - totalGaps) / _paginationInfo.columnCount;
        colWidthCheck = Math.round(colWidthCheck);

        if (colWidthCheck > _paginationInfo.columnWidth)
        {
            console.debug("ADJUST COLUMN");
            console.log(_paginationInfo.columnWidth);
            console.log(colWidthCheck);

            _paginationInfo.columnWidth = colWidthCheck;
        }

        _paginationInfo.spreadCount =  Math.ceil(_paginationInfo.columnCount / _paginationInfo.visibleColumnCount);

        if(_paginationInfo.currentSpreadIndex >= _paginationInfo.spreadCount) {
            _paginationInfo.currentSpreadIndex = _paginationInfo.spreadCount - 1;
        }

        if(_deferredPageRequest) {

            //if there is a request for specific page we get here
            openDeferredElement();
        }
        else {

            // we get here on resizing the viewport
            if (_lastPageRequest) {
                // Make sure we stay on the same page after the content or the viewport 
                // has been resized
                _paginationInfo.currentPageIndex = 0; // current page index is not stable, reset it
                self.restoreCurrentPosition();
            } else {
                onPaginationChanged(self, _currentSpineItem); // => redraw() => showBook(), so the trick below is not needed                
            }

            //onPaginationChanged(self, _currentSpineItem); // => redraw() => showBook(), so the trick below is not needed 

            // //We do this to force re-rendering of the document in the iframe.
            // //There is a bug in WebView control with right to left columns layout - after resizing the window html document
            // //is shifted in side the containing div. Hiding and showing the html element puts document in place.
            // _$epubHtml.hide();
            // setTimeout(function() {
            //     _$epubHtml.show();
            //     onPaginationChanged(self, _currentSpineItem); // => redraw() => showBook()
            // }, 50);

        }

        // Only initializes the resize sensor once the content has been paginated once,
        // to avoid the pagination process to trigger a resize event during its first
        // execution, provoking a flicker
        initResizeSensor();
    }
    var updatePagination = _.debounce(updatePagination_, 100);

    function initResizeSensor() {
        var bodyElement = _$htmlBody[0];
        if (bodyElement.resizeSensor) {
            return;
        }

        // We need to make sure the content has indeed be resized, especially
        // the first time it is triggered
        _lastBodySize.width = $(bodyElement).width();
        _lastBodySize.height = $(bodyElement).height();

        bodyElement.resizeSensor = new ResizeSensor(bodyElement, function() {
            
            var newBodySize = {
                width: $(bodyElement).width(),
                height: $(bodyElement).height()
            };

            console.debug("ReflowableView content resized ...", newBodySize.width, newBodySize.height, _currentSpineItem.idref);
            
            if (newBodySize.width != _lastBodySize.width || newBodySize.height != _lastBodySize.height) {
                _lastBodySize.width = newBodySize.width;
                _lastBodySize.height = newBodySize.height;
                
                console.debug("... updating pagination.");

                updatePagination();
            } else {
                console.debug("... ignored (identical dimensions).");
            }
        });
    }
    
//    function shiftBookOfScreen() {
//
//        if(_spine.isLeftToRight()) {
//            _$epubHtml.css("left", (_lastViewPortSize.width + 1000) + "px");
//        }
//        else {
//            _$epubHtml.css("right", (_lastViewPortSize.width + 1000) + "px");
//        }
//    }

    function hideBook()
    {
        if (_currentOpacity != -1) return; // already hidden

        // css('opacity') produces invalid result in Firefox, when iframes are involved and when is called
        // directly after set, i.e. after showBook(), see: https://github.com/jquery/jquery/issues/2622
        //_currentOpacity = $epubHtml.css('opacity');
        _currentOpacity = _$epubHtml[0].style.opacity;
        _$epubHtml.css('opacity', "0");
    }

    function showBook()
    {
        if (_currentOpacity != -1)
        {
            _$epubHtml.css('opacity', _currentOpacity);
        }
        _currentOpacity = -1;
    }

    this.getPaginationInfo = function() {

        var paginationInfo = new CurrentPagesInfo(_spine, false);

        if(!_currentSpineItem) {
            return paginationInfo;
        }

        var pageIndexes = getOpenPageIndexes();

        for(var i = 0, count = pageIndexes.length; i < count; i++) {

            paginationInfo.addOpenPage(pageIndexes[i], _paginationInfo.columnCount, _currentSpineItem.idref, _currentSpineItem.index);
        }

        return paginationInfo;

    };

    function getOpenPageIndexes() {

        var indexes = [];

        var currentPage = _paginationInfo.currentSpreadIndex * _paginationInfo.visibleColumnCount;

        for(var i = 0; i < _paginationInfo.visibleColumnCount && (currentPage + i) < _paginationInfo.columnCount; i++) {

            indexes.push(currentPage + i);
        }

        return indexes;

    }

    //we need this styles for css columnizer not to chop big images
    function resizeImages() {

        if(!_$epubHtml) {
            return;
        }

        var $elem;
        var height;
        var width;

        $('img, svg', _$epubHtml).each(function(){

            $elem = $(this);

            // if we set max-width/max-height to 100% columnizing engine chops images embedded in the text
            // (but not if we set it to 99-98%) go figure.
            // TODO: CSS min-w/h is content-box, not border-box (does not take into account padding + border)? => images may still overrun?
            $elem.css('max-width', '98%');
            $elem.css('max-height', '98%');

            if(!$elem.css('height')) {
                $elem.css('height', 'auto');
            }

            if(!$elem.css('width')) {
                $elem.css('width', 'auto');
            }

        });
    }

    this.bookmarkCurrentPage = function() {

        if(!_currentSpineItem) {

            return undefined;
        }

        return self.getFirstVisibleCfi();
    };

    this.getLoadedSpineItems = function() {
        return [_currentSpineItem];
    };

    this.getElementByCfi = function(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElementByCfi(cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getElementById = function(spineItemIdref, id) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElementById(id);
    };

    this.getElement = function(spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElement(selector);
    };

    this.getFirstVisibleMediaOverlayElement = function() {

        return _navigationLogic.getFirstVisibleMediaOverlayElement();
    };

    this.insureElementVisibility = function(spineItemId, element, initiator) {

        var $element = $(element);
        if(_navigationLogic.isElementVisible($element))
        {
            return;
        }

        var elementCfi = _navigationLogic.getCfiForElement(element);

        if (!elementCfi)
        {
            return;
        }

        var openPageRequest = new PageOpenRequest(_currentSpineItem, initiator);
        openPageRequest.setElementCfi(elementCfi);

        var id = element.id;
        if (!id)
        {
            id = element.getAttribute("id");
        }

        if (id)
        {
            openPageRequest.setElementId(id);
        }

        self.openPage(openPageRequest);
    };

    this.getVisibleElementsWithFilter = function(filterFunction, includeSpineItem) {

        var elements = _navigationLogic.getVisibleElementsWithFilter(null, filterFunction);

        if (includeSpineItem) {
            return [{elements: elements, spineItem:_currentSpineItem}];
        } else {
            return elements;
        }

    };

    this.getVisibleElements = function(selector, includeSpineItem) {

        var elements = _navigationLogic.getAllVisibleElementsWithSelector(selector);

        if (includeSpineItem) {
            return [{elements: elements, spineItem:_currentSpineItem}];
        } else {
            return elements;
        }

    };

    this.isElementVisible = function ($element) {

        return _navigationLogic.isElementVisible($element);

    };

    this.getElements = function(spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getElements(selector);
    };

    this.isNodeFromRangeCfiVisible = function (spineIdref, partialCfi) {
        if (_currentSpineItem.idref === spineIdref) {
            return _navigationLogic.isNodeFromRangeCfiVisible(partialCfi);
        }
        return undefined;
    };

    this.isVisibleSpineItemElementCfi = function (spineIdRef, partialCfi) {
        if (_navigationLogic.isRangeCfi(partialCfi)) {
            return this.isNodeFromRangeCfiVisible(spineIdRef, partialCfi);
        }
        var $elementFromCfi = this.getElementByCfi(spineIdRef, partialCfi);
        return ($elementFromCfi && this.isElementVisible($elementFromCfi));
    };

    this.getNodeRangeInfoFromCfi = function (spineIdRef, partialCfi) {
        if (spineIdRef != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }

        return _navigationLogic.getNodeRangeInfoFromCfi(partialCfi);
    };

    function createBookmarkFromCfi(cfi){
        return new BookmarkData(_currentSpineItem.idref, cfi);
    }

    this.getFirstVisibleCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getFirstVisibleCfi());
    };

    this.getLastVisibleCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getLastVisibleCfi());
    };

    this.getStartCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getStartCfi());
    };

    this.getEndCfi = function () {
        return createBookmarkFromCfi(_navigationLogic.getEndCfi());
    };

    this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        if (rangeCfi2 && rangeCfi.idref !== rangeCfi2.idref) {
            console.error("getDomRangeFromRangeCfi: both CFIs must be scoped under the same spineitem idref");
            return undefined;
        }
        return _navigationLogic.getDomRangeFromRangeCfi(rangeCfi.contentCFI, rangeCfi2? rangeCfi2.contentCFI: null, inclusive);
    };

    this.getRangeCfiFromDomRange = function (domRange) {
        return createBookmarkFromCfi(_navigationLogic.getRangeCfiFromDomRange(domRange));
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint) {
        return createBookmarkFromCfi(_navigationLogic.getVisibleCfiFromPoint(x, y, precisePoint));
    };

    this.getRangeCfiFromPoints = function(startX, startY, endX, endY) {
        return createBookmarkFromCfi(_navigationLogic.getRangeCfiFromPoints(startX, startY, endX, endY));
    };

    this.getCfiForElement = function(element) {
        return createBookmarkFromCfi(_navigationLogic.getCfiForElement(element));
    };

    this.getElementFromPoint = function(x, y) {
        return _navigationLogic.getElementFromPoint(x,y);
    };

    this.getNearestCfiFromElement = function(element) {
        return createBookmarkFromCfi(_navigationLogic.getNearestCfiFromElement(element));
    };
};
    return ReflowableView;
});

//  Created by Boris Schneiderman.
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

define('readium_shared_js/models/style',[], function() {
/**
 * @class Models.Style
 * @constructor
 * @param selector
 * @param declarations
 */
var Style = function(selector, declarations) {

    /**
     * Initializing the selector
     *
     * @property selector
     * @type 
     */

    this.selector = selector;

    /**
     * Initializing the declarations
     *
     * @property selector
     * @type 
     */

    this.declarations = declarations;

    /**
     * Set the declarations array
     *
     * @method setDeclarations
     * @param {Object} declarations
     */

    this.setDeclarations = function(declarations) {

        for(var prop in declarations) {
            if(declarations.hasOwnProperty(prop)) {
                this.declarations[prop] = declarations[prop];
            }
        }

    }
};
    return Style;
});

    //  Created by Boris Schneiderman.
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

define('readium_shared_js/models/style_collection',["./style"], function(Style) {

/**
 *
 * @class Models.StyleCollection
 * @return StyleCollection
 * @constructor
 */

var StyleCollection = function() {

    var _styles = [];

    /**
     * Clears the collection.
     *
     * @method     clear
     */

    this.clear = function() {
        _styles.length = 0;

    };

    /**
     * Finds the style of a selected item
     *
     * @method     findStyle
     * @param      selector
     * @return     {Models.Style}
     */

    this.findStyle = function(selector) {

        var count = _styles.length;
        for(var i = 0; i < count; i++) {
            if(_styles[i].selector === selector) {
                return _styles[i];
            }
        }

        return undefined;
    };

    /**
     * Adds a style to the collection
     *
     * @method     addStyle
     * @param      selector
     * @param      declarations
     * @return     {Models.Style}
     */

    this.addStyle = function(selector, declarations) {

        var style = this.findStyle(selector);

        if(style) {
            style.setDeclarations(declarations);
        }
        else {
            style = new Style(selector, declarations);
            _styles.push(style);
        }

        return style;
    };

    /**
     * Removes a style from the collection
     *
     * @method     addStyle
     * @param      selector
     */

    this.removeStyle = function(selector) {
        
        var count = _styles.length;

        for(var i = 0; i < count; i++) {

            if(_styles[i].selector === selector) {
                _styles.splice(i, 1);
                return;
            }
        }
    };

    /**
     * Gets all styles
     *
     * @method     getStyles
     * @return     {Array}
     */

    this.getStyles = function() {
        return _styles;
    };

    /**
     * Resets the styles
     *
     * @method     resetStyleValues
     */

    this.resetStyleValues = function() {

        var count = _styles.length;

        for(var i = 0; i < count; i++) {

            var style = _styles[i];
            var declarations = style.declarations;

            for(var prop in declarations) {
                if(declarations.hasOwnProperty(prop)) {
                    declarations[prop] = '';
                }
            }
        }
    }

};
    return StyleCollection;
});

//  LauncherOSX
//
//  Created by Boris Schneiderman.
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
define('readium_shared_js/models/switches',["jquery", "underscore"], function($, _) {
/** 
 * Switches in the epub publication.
 * 
 * @class Models.Switches
 * @constructor
 */
var Switches = function() {

};

// Description: Parse the epub "switch" tags and hide
// cases that are not supported

/**
 *
 * Static Switches.apply method.
 * 
 * @method Switches.apply
 * @param dom
 */

Switches.apply = function(dom) {

    function isSupported(caseNode) {

        var ns = caseNode.attributes["required-namespace"];
        if(!ns) {
            // the namespace was not specified, that should
            // never happen, we don't support it then
            console.log("Encountered a case statement with no required-namespace");
            return false;
        }
        // all the xmlns that readium is known to support
        // TODO this is going to require maintenance
        var supportedNamespaces = ["http://www.w3.org/1998/Math/MathML"];
        return _.include(supportedNamespaces, ns.value);
    }

    var getQuery = ((window.navigator.userAgent.indexOf("Trident") > 0) || (window.navigator.userAgent.indexOf("Edge") > 0))
        ? function (elementName) { return 'epub\\:' + elementName; }
        : function (elementName) { return elementName; };

    _.each(dom.querySelectorAll(getQuery('switch')), function(switchNode) {

        // keep track of whether or now we found one
        var found = false;

        _.each(switchNode.querySelectorAll(getQuery('case')), function(caseNode) {

            if( !found && isSupported(caseNode) ) {
                found = true; // we found the node, don't remove it
            }
            else {
                $(caseNode).remove(); // remove the node from the dom
            }

        });

        if (found) {

            // if we found a supported case, remove the default
            _.each(switchNode.querySelectorAll(getQuery('default')), function(defaultNode) {
                $(defaultNode).remove();
            });

        }

    });
};
    return Switches;
});

//  LauncherOSX
//
//  Created by Boris Schneiderman.
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

define('readium_shared_js/models/trigger',["jquery", "../helpers"], function($, Helpers) {
/**
 * Trigger in an epub publication.
 *
 * @class Models.Trigger
 * @constructor
 * @param domNode
 */

var Trigger = function(domNode) {

    var $el = $(domNode);
    
    /**
     * epub trigger action
     *
     * @property action
     * @type String
     */

    this.action     = $el.attr("action");
    
    /**
     * epub trigger ref
     *
     * @property ref
     * @type String
     */

    this.ref         = $el.attr("ref");
    
    /**
     * epub trigger event
     *
     * @property event
     * @type String
     */

    this.event         = $el.attr("ev:event");
    
    /**
     * epub trigger observer
     *
     * @property observer
     * @type String
     */

    this.observer     = $el.attr("ev:observer");
    this.ref         = $el.attr("ref");
};

/**
 * Static register method
 *
 * @method register
 * @param dom
 */
Trigger.register = function(dom) {
    $('trigger', dom).each(function() {
        var trigger = new Trigger(this);
        trigger.subscribe(dom);
    });
};

/**
 * Prototype subscribe method
 *
 * @method subscribe
 * @param dom
 */

Trigger.prototype.subscribe = function(dom) {
    
    var selector = "#" + this.observer;
    var that = this;
    $(selector, dom).on(this.event, function() {
        return that.execute(dom);
    });
};

/**
 * Prototype execute method
 *
 * @method execute
 * @param dom
 */

Trigger.prototype.execute = function(dom) {

    var $target = $( "#" + Helpers.escapeJQuerySelector(this.ref), dom);
    switch(this.action)
    {
        case "show":
            $target.css("visibility", "visible");
            break;
        case "hide":
            $target.css("visibility", "hidden");
            break;
        case "play":
            $target[0].currentTime = 0;
            $target[0].play();
            break;
        case "pause":
            $target[0].pause();
            break;
        case "resume":
            $target[0].play();
            break;
        case "mute":
            $target[0].muted = true;
            break;
        case "unmute":
            $target[0].muted = false;
            break;
        default:
            console.log("do not no how to handle trigger " + this.action);
            return null;
    }
    return false;   // do not propagate click event; it was already handled

};

    return Trigger;
});

//  Created by Juan Corona
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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

define('readium_shared_js/models/node_range_info',[],function () {

    /**
     * @class Models.NodeRangePositionInfo
     * @constructor
     * @param {Node} node The actual DOM node
     * @param {Number} offest The position offsetf for the node
     */
    var NodeRangePositionInfo = function (node, offset) {

        /**
         * The actual DOM node
         * @property node
         * @type Node
         */
        this.node = node;

        /**
         * The position offsetf for the node
         * @property offset
         * @type Number
         */
        this.offset = offset;

    };

    /**
     * @class Models.NodeRangeInfo
     * @constructor
     * @param {ClientRect} clientRect
     * @param {Models.NodeRangePositionInfo} startInfo
     * @param {Models.NodeRangePositionInfo} endInfo
     */
    var NodeRangeInfo = function (clientRect, startInfo, endInfo) {

        var self = this;
        /**
         * Client rectangle information for the range content bounds
         * @property clientRect
         * @type ClientRect
         */
        this.clientRect = clientRect;

        /**
         * Node and position information providing where and which node the range starts with
         * @property startInfo
         * @type Models.NodeRangePositionInfo
         */
        this.startInfo = startInfo;

        /**
         * Node and position information providing where and which node the range ends with
         * @property endInfo
         * @type Models.NodeRangePositionInfo
         */
        this.endInfo = endInfo;


        this.setStartInfo = function (info) {
            self.startInfo = new NodeRangePositionInfo(info);
            return self;
        };

        this.setEndInfo = function (info) {
            self.endInfo = new NodeRangePositionInfo(info);
            return self;
        };
    };

    return NodeRangeInfo;
});
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

define('readium_shared_js/views/external_agent_support',["../globals", "underscore"], function(Globals, _) {
    /**
     * This module helps external agents that interact with content documents from
     * the level of the iframe browsing context:
     *
     *   - By providing a means of identifying the content through metadata
     *     that's brought down from the package document level.
     *
     *   - By providing a direct link (bringing down the shareable URL) that could be used
     *     to load the content in the proper context with the reader app instead of the actual
     *     content document asset path.
     *
     *   - By responding to an event when the external agent wants to bring a
     *     specific range of content into view.
     *
     * @param {Views.ReaderView} reader     The Reader instance
     * @constructor
     */
    var ExternalAgentSupport = function(reader) {

        var contentDocumentStates = {};
        var contentDocuments = {};

        Globals.on(Globals.Events.PLUGINS_LOADED, function() {
            // Disable the AMD environment since it's not needed anymore at this point.
            // This is done because external agents with their own module systems (Browserify)
            // might load third-party scripts that are in the format of
            // UMD (Universal Module Definition),
            // and will mistakenly try to use Readium's AMD shim, almond.js, or require.js
            if (window.define && window.define.amd) {
                delete window.define.amd;
            }
        });

        function appendMetaTag(_document, property, content) {
            var tag = _document.createElement('meta');
            tag.setAttribute('name', property);
            tag.setAttribute('content', content);
            _document.head.appendChild(tag);
        }

        function injectDublinCoreResourceIdentifiers(contentDocument, spineItem) {
            var renditionIdentifier = reader.metadata().identifier; // the package unique identifier
            var spineItemIdentifier = spineItem.idref; // use the spine item id as an identifier too
            if (renditionIdentifier && spineItemIdentifier) {
                appendMetaTag(contentDocument, 'dc.relation.ispartof', renditionIdentifier);
                appendMetaTag(contentDocument, 'dc.identifier', spineItemIdentifier);
            }
        }

        function determineCanonicalLinkHref(contentWindow) {
            // Only grab the href if there's no potential cross-domain violation
            // and the reader application URL has a CFI value in a 'goto' query param.
            var isSameDomain = Object.keys(contentWindow).indexOf('document') !== -1;
            if (isSameDomain && contentWindow.location.search.match(/goto=.*cfi/i)) {
                return contentWindow.location.href.split("#")[0];
            }
        }

        function getContentDocumentCanonicalLink(contentDocument) {
            var contentDocWindow = contentDocument.defaultView;
            if (contentDocWindow && (contentDocWindow.parent|| contentDocWindow.top)) {
                var parentWindowCanonicalHref = determineCanonicalLinkHref(contentDocWindow.parent);
                var topWindowCanonicalHref = determineCanonicalLinkHref(contentDocWindow.top);
                return topWindowCanonicalHref || parentWindowCanonicalHref;
            }
        }

        function injectAppUrlAsCanonicalLink(contentDocument, spineItem) {
            if (contentDocument.defaultView && contentDocument.defaultView.parent) {
                var canonicalLinkHref = getContentDocumentCanonicalLink(contentDocument);
                if (canonicalLinkHref) {
                    var link = contentDocument.createElement('link');
                    link.setAttribute('rel', 'canonical');
                    link.setAttribute('href', canonicalLinkHref);
                    contentDocument.head.appendChild(link);
                    contentDocumentStates[spineItem.idref].canonicalLinkElement = link;
                }
            }
        }

        var bringIntoViewDebounced = _.debounce(function (range) {
            var target = reader.getRangeCfiFromDomRange(range);
            var contentDocumentState = contentDocumentStates[target.idref];

            if (contentDocumentState && contentDocumentState.isUpdated) {
                reader.openSpineItemElementCfi(target.idref, target.contentCFI);
            } else {
                contentDocumentState.pendingNavRequest = {
                    idref: target.idref,
                    contentCFI: target.contentCFI
                };
            }
        }, 100);

        function bindBringIntoViewEvent(contentDocument) {
            // 'scrolltorange' is a non-standard event that is emitted on the content frame
            // by some external tools like Hypothes.is
            contentDocument.addEventListener('scrolltorange', function (event) {
                event.preventDefault();

                var range = event.detail;
                bringIntoViewDebounced(range);
            });
        }

        function bindSelectionPopupWorkaround(contentDocument) {
            // A hack to make the Hypothes.is 'adder' context menu popup work when the content doc body is positioned.
            // When the content doc has columns and a body with position set to 'relative'
            // the adder won't be positioned properly.
            //
            // The workaround is to clear the position property when a selection is active.
            // Then restore the position property to 'relative' when the selection clears.
            contentDocument.addEventListener('selectionchange', function () {
                var selection = contentDocument.getSelection();
                if (selection && selection.isCollapsed) {
                    contentDocument.body.style.position = 'relative';
                } else {
                    contentDocument.body.style.position = '';
                }
            });
        }

        /***
         *
         * @param {Document} contentDocument    Document instance with DOM tree
         * @param {Models.SpineItem} spineItem  The associated spine item object
         */
        this.bindToContentDocument = function(contentDocument, spineItem) {
            contentDocuments[spineItem.idref] = contentDocument;
            contentDocumentStates[spineItem.idref] = {};
            injectDublinCoreResourceIdentifiers(contentDocument, spineItem);
            injectAppUrlAsCanonicalLink(contentDocument, spineItem);
            bindBringIntoViewEvent(contentDocument);

            if (spineItem.isReflowable()) {
                bindSelectionPopupWorkaround(contentDocument);
            }
        };

        /***
         *
         * @param {Models.SpineItem} spineItem  The associated spine item object
         */
        this.updateContentDocument = function (spineItem) {
            var contentDocument = contentDocuments[spineItem.idref];
            var state = contentDocumentStates[spineItem.idref];

            if (contentDocument && state) {

                if (state.canonicalLinkElement) {
                    var canonicalLinkHref = getContentDocumentCanonicalLink(contentDocument);
                    if (canonicalLinkHref) {
                        state.canonicalLinkElement.setAttribute('href', canonicalLinkHref);
                    }
                }

                state.isUpdated = true;

                var pendingNavRequest = state.pendingNavRequest;
                if (pendingNavRequest) {
                    reader.openSpineItemElementCfi(pendingNavRequest.idref, pendingNavRequest.contentCFI);
                    state.pendingNavRequest = null;
                }
            }
        };
    };

    return ExternalAgentSupport;
});

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

define('readium_shared_js/views/reader_view',["../globals", "jquery", "underscore", "eventEmitter", "./fixed_view", "../helpers", "./iframe_loader", "./internal_links_support",
        "./media_overlay_data_injector", "./media_overlay_player", "../models/package", "../models/metadata", "../models/page_open_request",
        "./reflowable_view", "./scroll_view", "../models/style_collection", "../models/switches", "../models/trigger",
        "../models/viewer_settings", "../models/bookmark_data", "../models/node_range_info", "./external_agent_support"],
    function (Globals, $, _, EventEmitter, FixedView, Helpers, IFrameLoader, InternalLinksSupport,
              MediaOverlayDataInjector, MediaOverlayPlayer, Package, Metadata, PageOpenRequest,
              ReflowableView, ScrollView, StyleCollection, Switches, Trigger,
              ViewerSettings, BookmarkData, NodeRangeInfo, ExternalAgentSupport) {
/**
 * Options passed on the reader from the readium loader/initializer
 *
 * @typedef {object} Globals.Views.ReaderView.ReaderOptions
 * @property {jQueryElement|string} el   The element the reader view should create itself in. Can be a jquery wrapped element or a query selector.
 * @property {Globals.Views.IFrameLoader} iframeLoader   An instance of an iframe loader or one expanding it.
 * @property {boolean} needsFixedLayoutScalerWorkAround
 */

/**
 * Top level View object. Interface for view manipulation public APIs
 * @param {Views.ReaderView.ReaderOptions} options
 * @constructor
 */
var ReaderView = function (options) {
    $.extend(this, new EventEmitter());

    var self = this;
    var _currentView = undefined;
    var _package = undefined;
    var _metadata = undefined;
    var _spine = undefined;
    var _viewerSettings = new ViewerSettings({});
    //styles applied to the container divs
    var _userStyles = new StyleCollection();
    //styles applied to the content documents
    var _bookStyles = new StyleCollection();
    var _internalLinksSupport = new InternalLinksSupport(this);
    var _externalAgentSupport = new ExternalAgentSupport(this);
    var _mediaOverlayPlayer;
    var _mediaOverlayDataInjector;
    var _iframeLoader;
    var _$el;

    //We will call onViewportResize after user stopped resizing window
    var lazyResize = Helpers.extendedThrottle(
        handleViewportResizeStart,
        handleViewportResizeTick,
        handleViewportResizeEnd, 250, 1000, self);

    $(window).on("resize.ReadiumSDK.readerView", lazyResize);

    this.fonts = options.fonts;


    if (options.el instanceof $) {
        _$el = options.el;
        console.log("** EL is a jQuery selector:" + options.el.attr('id'));
    } else {
        _$el = $(options.el);
        console.log("** EL is a string:" + _$el.attr('id'));
    }

    if (options.iframeLoader) {
        _iframeLoader = options.iframeLoader;
    }
    else {
        _iframeLoader = new IFrameLoader({mathJaxUrl: options.mathJaxUrl});
    }


    _needsFixedLayoutScalerWorkAround = options.needsFixedLayoutScalerWorkAround;
    /**
     * @returns {boolean}
     */
    this.needsFixedLayoutScalerWorkAround = function () {
        return _needsFixedLayoutScalerWorkAround;
    };

    /**
     * Create a view based on the given view type.
     * @param {Views.ReaderView.ViewType} viewType
     * @param {Views.ReaderView.ViewCreationOptions} options
     * @returns {*}
     */
    this.createViewForType = function (viewType, options) {
        var createdView;

        // NOTE: _$el == options.$viewport
        _$el.css("overflow", "hidden");

        switch (viewType) {
            case ReaderView.VIEW_TYPE_FIXED:

                _$el.css("overflow", "auto"); // for content pan, see self.setZoom()

                createdView = new FixedView(options, self);
                break;
            case ReaderView.VIEW_TYPE_SCROLLED_DOC:
                createdView = new ScrollView(options, false, self);
                break;
            case ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS:
                createdView = new ScrollView(options, true, self);
                break;
            default:
                createdView = new ReflowableView(options, self);
                break;
        }

        return createdView;
    };

    /**
     * Returns the current view type of the reader view
     * @returns {ReaderView.ViewType}
     */
    this.getCurrentViewType = function () {

        if (!_currentView) {
            return undefined;
        }

        if (_currentView instanceof ReflowableView) {
            return ReaderView.VIEW_TYPE_COLUMNIZED;
        }

        if (_currentView instanceof FixedView) {
            return ReaderView.VIEW_TYPE_FIXED;
        }

        if (_currentView instanceof ScrollView) {
            if (_currentView.isContinuousScroll()) {
                return ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
            }

            return ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        console.error("Unrecognized view type");
        return undefined;
    };

    this.getCurrentView = function () {
        return _currentView;
    };

    //based on https://docs.google.com/spreadsheet/ccc?key=0AoPMUkQhc4wcdDI0anFvWm96N0xRT184ZE96MXFRdFE&usp=drive_web#gid=0 document
    function deduceDesiredViewType(spineItem) {

        //check settings
        if (_viewerSettings.scroll == "scroll-doc") {
            return ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        if (_viewerSettings.scroll == "scroll-continuous") {
            return ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        //is fixed layout ignore flow
        if (spineItem.isFixedLayout()) {
            return ReaderView.VIEW_TYPE_FIXED;
        }

        //flow
        if (spineItem.isFlowScrolledDoc()) {
            return ReaderView.VIEW_TYPE_SCROLLED_DOC;
        }

        if (spineItem.isFlowScrolledContinuous()) {
            return ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS;
        }

        return ReaderView.VIEW_TYPE_COLUMNIZED;
    }

    // returns true is view changed
    function initViewForItem(spineItem, callback) {

        var desiredViewType = deduceDesiredViewType(spineItem);

        if (_currentView) {

            if (self.getCurrentViewType() == desiredViewType) {
                callback(false);
                return;
            }

            resetCurrentView();
        }

        /**
         * View creation options
         * @typedef {object} Globals.Views.ReaderView.ViewCreationOptions
         * @property {jQueryElement} $viewport  The view port element the reader view has created.
         * @property {Globals.Models.Spine} spine The spine item collection object
         * @property {Globals.Collections.StyleCollection} userStyles User styles
         * @property {Globals.Collections.StyleCollection} bookStyles Book styles
         * @property {Globals.Views.IFrameLoader} iframeLoader   An instance of an iframe loader or one expanding it.
         */
        var viewCreationParams = {
            $viewport: _$el,
            spine: _spine,
            userStyles: _userStyles,
            bookStyles: _bookStyles,
            iframeLoader: _iframeLoader
        };


        _currentView = self.createViewForType(desiredViewType, viewCreationParams);
        
        Globals.logEvent("READER_VIEW_CREATED", "EMIT", "reader_view.js");
        self.emit(Globals.Events.READER_VIEW_CREATED, desiredViewType);

        _currentView.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            var contentDoc = $iframe[0].contentDocument;

            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "ON", "reader_view.js (current view) [ " + spineItem.href + " ]");

            if (!Helpers.isIframeAlive($iframe[0])) return;

            // performance degrades with large DOM (e.g. word-level text-audio sync)
            _mediaOverlayDataInjector.attachMediaOverlayData($iframe, spineItem, _viewerSettings);

            _internalLinksSupport.processLinkElements($iframe, spineItem);

            _externalAgentSupport.bindToContentDocument(contentDoc, spineItem);

            Trigger.register(contentDoc);
            Switches.apply(contentDoc);

            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "reader_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
        });

        _currentView.on(Globals.Events.CONTENT_DOCUMENT_LOAD_START, function ($iframe, spineItem) {

            Globals.logEvent("CONTENT_DOCUMENT_LOAD_START", "EMIT", "reader_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOAD_START, $iframe, spineItem);
        });

        _currentView.on(Globals.Events.CONTENT_DOCUMENT_UNLOADED, function ($iframe, spineItem) {
            
            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "reader_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, $iframe, spineItem);
        });

        _currentView.on(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED, function (pageChangeData) {
            
            Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "ON", "reader_view.js");

            //we call on onPageChanged explicitly instead of subscribing to the Globals.Events.PAGINATION_CHANGED by
            //mediaOverlayPlayer because we hve to guarantee that mediaOverlayPlayer will be updated before the host
            //application will be notified by the same Globals.Events.PAGINATION_CHANGED event
            _mediaOverlayPlayer.onPageChanged(pageChangeData);

            _.defer(function () {
                Globals.logEvent("PAGINATION_CHANGED", "EMIT", "reader_view.js");
                self.emit(Globals.Events.PAGINATION_CHANGED, pageChangeData);
                
                if (!pageChangeData.spineItem) return;
                _.defer(function () {
                    _externalAgentSupport.updateContentDocument(pageChangeData.spineItem);
                });
            });
        });

        _currentView.on(Globals.Events.FXL_VIEW_RESIZED, function () {
            Globals.logEvent("FXL_VIEW_RESIZED", "EMIT", "reader_view.js");
            self.emit(Globals.Events.FXL_VIEW_RESIZED);
        })

        _currentView.render();

        var docWillChange = true;
        _currentView.setViewSettings(_viewerSettings, docWillChange);

        // we do this to wait until elements are rendered otherwise book is not able to determine view size.
        setTimeout(function () {

            callback(true);

        }, 50);

    }

    /**
     * Returns a list of the currently active spine items
     *
     * @returns {Models.SpineItem[]}
     */
    this.getLoadedSpineItems = function () {

        if (_currentView) {
            return _currentView.getLoadedSpineItems();
        }

        return [];
    };

    function resetCurrentView() {

        if (!_currentView) {
            return;
        }

        Globals.logEvent("READER_VIEW_DESTROYED", "EMIT", "reader_view.js");
        self.emit(Globals.Events.READER_VIEW_DESTROYED);


        Globals.logEvent("InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED", "OFF", "reader_view.js");
        _currentView.off(Globals.InternalEvents.CURRENT_VIEW_PAGINATION_CHANGED);
        
        _currentView.remove();
        _currentView = undefined;
    }

    /**
     * Returns the currently instanced viewer settings
     *
     * @returns {Models.ViewerSettings}
     */
    this.viewerSettings = function () {
        return _viewerSettings;
    };

    /**
     * Returns a data object based on the package document
     *
     * @returns {Models.Package}
     */
    this.package = function () {
        return _package;
    };

    /**
     * Returns a data object based on the package document metadata
     *
     * @returns {Models.Metadata}
     */
    this.metadata = function () {
        return _metadata;
    };

    /**
     * Returns a representation of the spine as a data object, also acts as list of spine items
     *
     * @returns {Models.Spine}
     */
    this.spine = function () {
        return _spine;
    };

    /**
     * Returns the user CSS styles collection
     *
     * @returns {Collections.StyleCollection}
     */
    this.userStyles = function () {
        return _userStyles;
    };

    /**
     * Open Book Data
     *
     * @typedef {object} Globals.Views.ReaderView.OpenBookData
     * @property {Globals.Models.Package} package - packageData (required)
     * @property {Globals.Models.PageOpenRequest} openPageRequest - openPageRequestData, (optional) data related to open page request
     * @property {Globals.Views.ReaderView.SettingsData} [settings]
     * @property {Globals.Collections.StyleCollection} styles: [cssStyles]
     * @todo Define missing types
     */

    /**
     * Triggers the process of opening the book and requesting resources specified in the packageData
     *
     * @param {Views.ReaderView.OpenBookData} openBookData Open book data object
     */
    this.openBook = function (openBookData) {

        var packageData = openBookData.package ? openBookData.package : openBookData;

        _package = new Package(packageData);
        _metadata = new Metadata(packageData.metadata);

        _spine = _package.spine;
        _spine.handleLinear(true);

        if (_mediaOverlayPlayer) {
            _mediaOverlayPlayer.reset();
        }

        _mediaOverlayPlayer = new MediaOverlayPlayer(self, $.proxy(onMediaPlayerStatusChanged, self));
        _mediaOverlayPlayer.setAutomaticNextSmil(_viewerSettings.mediaOverlaysAutomaticPageTurn ? true : false); // just to ensure the internal var is set to the default settings (user settings are applied below at self.updateSettings(openBookData.settings);)

        _mediaOverlayDataInjector = new MediaOverlayDataInjector(_package.media_overlay, _mediaOverlayPlayer);


        resetCurrentView();

        if (openBookData.settings) {
            self.updateSettings(openBookData.settings);
        }

        if (openBookData.styles) {
            self.setStyles(openBookData.styles);
        }

        var pageRequestData = undefined;

        if (openBookData.openPageRequest && typeof(openBookData.openPageRequest) === 'function') {
            openBookData.openPageRequest = openBookData.openPageRequest();
        }

        if (openBookData.openPageRequest) {

            if (openBookData.openPageRequest.idref || (openBookData.openPageRequest.contentRefUrl && openBookData.openPageRequest.sourceFileHref)) {
                pageRequestData = openBookData.openPageRequest;
            }
            else {
                console.log("Invalid page request data: idref required!");
            }
        }

        var fallback = false;
        if (pageRequestData) {

            pageRequestData = openBookData.openPageRequest;

            try {
                if (pageRequestData.idref) {

                    if (pageRequestData.spineItemPageIndex) {
                        fallback = !self.openSpineItemPage(pageRequestData.idref, pageRequestData.spineItemPageIndex, self);
                    }
                    else if (pageRequestData.elementCfi) {
                        fallback = !self.openSpineItemElementCfi(pageRequestData.idref, pageRequestData.elementCfi, self);
                    }
                    else {
                        fallback = !self.openSpineItemPage(pageRequestData.idref, 0, self);
                    }
                }
                else {
                    fallback = !self.openContentUrl(pageRequestData.contentRefUrl, pageRequestData.sourceFileHref, self);
                }
            } catch (err) {
                console.error("openPageRequest fail: fallback to first page!")
                console.log(err);
                fallback = true;
            }
        }
        else {
            fallback = true;
        }

        if (fallback) {// if we where not asked to open specific page we will open the first one

            var spineItem = _spine.first();
            if (spineItem) {
                var pageOpenRequest = new PageOpenRequest(spineItem, self);
                pageOpenRequest.setFirstPage();
                openPage(pageOpenRequest, 0);
            }

        }

    };

    function onMediaPlayerStatusChanged(status) {

        Globals.logEvent("MEDIA_OVERLAY_STATUS_CHANGED", "EMIT", "reader_view.js (via MediaOverlayPlayer + AudioPlayer)");
        self.emit(Globals.Events.MEDIA_OVERLAY_STATUS_CHANGED, status);
    }

    /**
     * Flips the page from left to right.
     * Takes to account the page progression direction to decide to flip to prev or next page.
     */
    this.openPageLeft = function () {

        if (_package.spine.isLeftToRight()) {
            self.openPagePrev();
        }
        else {
            self.openPageNext();
        }
    };

    /**
     * Flips the page from right to left.
     * Takes to account the page progression direction to decide to flip to prev or next page.
     */
    this.openPageRight = function () {

        if (_package.spine.isLeftToRight()) {
            self.openPageNext();
        }
        else {
            self.openPagePrev();
        }

    };

    /**
     * Returns if the current child view is an instance of a fixed page view
     *
     * @returns {boolean}
     */
    this.isCurrentViewFixedLayout = function () {
        return _currentView instanceof FixedView;
    };

    /**
     * Zoom options
     *
     * @typedef {object} Globals.Views.ReaderView.ZoomOptions
     * @property {string} style - "user"|"fit-screen"|"fit-width"
     * @property {number} scale - 0.0 to 1.0
     */

    /**
     * Set the zoom options.
     *
     * @param {Views.ReaderView.ZoomOptions} zoom Zoom options
     */
    this.setZoom = function (zoom) {
        // zoom only handled by fixed layout views
        if (self.isCurrentViewFixedLayout()) {
            _currentView.setZoom(zoom);
        }
    };

    /**
     * Returns the current view scale as a percentage
     *
     * @returns {number}
     */
    this.getViewScale = function () {
        if (self.isCurrentViewFixedLayout()) {
            return 100 * _currentView.getViewScale();
        }
        else {
            return 100;
        }
    };

    /**
     * Settings Data
     *
     * @typedef {object} Globals.Views.ReaderView.SettingsData
     * @property {number} fontSize - Font size as percentage
     * @property {number} fontSelection - Font selection as the number in the list of possible fonts, where 0 is special meaning default.
     * @property {(string|boolean)} syntheticSpread - "auto"|"single"|"double"
     * @property {(string|boolean)} scroll - "auto"|true|false
     * @property {boolean} doNotUpdateView - Indicates whether the view should be updated after the settings are applied
     * @property {boolean} mediaOverlaysEnableClick - Indicates whether media overlays are interactive on mouse clicks
     */

    /**
     * Updates reader view based on the settings specified in settingsData object
     *
     * @param {Globals.Views.ReaderView.SettingsData} settingsData Settings data
     * @fires Globals.Events.SETTINGS_APPLIED
     */
    this.updateSettings = function (settingsData) {

//console.debug("UpdateSettings: " + JSON.stringify(settingsData));

        _viewerSettings.update(settingsData);

        if (_mediaOverlayPlayer) {
            _mediaOverlayPlayer.setAutomaticNextSmil(_viewerSettings.mediaOverlaysAutomaticPageTurn ? true : false);
        }

        if (_currentView && !settingsData.doNotUpdateView) {

            var bookMark = _currentView.bookmarkCurrentPage();

            if (bookMark && bookMark.idref) {

                var wasPlaying = false;
                if (_currentView.isReflowable && _currentView.isReflowable()) {
                    wasPlaying = self.isPlayingMediaOverlay();
                    if (wasPlaying) {
                        self.pauseMediaOverlay();
                    }
                }

                var spineItem = _spine.getItemById(bookMark.idref);

                initViewForItem(spineItem, function (isViewChanged) {

                    if (!isViewChanged) {
                        var docWillChange = false;
                        _currentView.setViewSettings(_viewerSettings, docWillChange);
                    }

                    self.once(ReadiumSDK.Events.PAGINATION_CHANGED, function (pageChangeData)
                    {
                        var cfi = new BookmarkData(bookMark.idref, bookMark.contentCFI);
                        self.debugBookmarkData(cfi);
                    });

                    self.openSpineItemElementCfi(bookMark.idref, bookMark.contentCFI, self);

                    if (wasPlaying) {
                        self.playMediaOverlay();
                        // setTimeout(function()
                        // {
                        // }, 60);
                    }

                    Globals.logEvent("SETTINGS_APPLIED 1 (view update)", "EMIT", "reader_view.js");
                    self.emit(Globals.Events.SETTINGS_APPLIED);
                });
                
                return;
            }
        }

        Globals.logEvent("SETTINGS_APPLIED 2 (no view update)", "EMIT", "reader_view.js");
        self.emit(Globals.Events.SETTINGS_APPLIED);
    };

    /**
     * Opens the next page.
     */
    this.openPageNext = function () {

        if (self.getCurrentViewType() === ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS) {
            _currentView.openPageNext(self);
            return;
        }

        var paginationInfo = _currentView.getPaginationInfo();

        if (paginationInfo.openPages.length == 0) {
            return;
        }

        var lastOpenPage = paginationInfo.openPages[paginationInfo.openPages.length - 1];

        if (lastOpenPage.spineItemPageIndex < lastOpenPage.spineItemPageCount - 1) {
            _currentView.openPageNext(self);
            return;
        }

        var currentSpineItem = _spine.getItemById(lastOpenPage.idref);

        var nextSpineItem = _spine.nextItem(currentSpineItem);

        if (!nextSpineItem) {
            return;
        }

        var openPageRequest = new PageOpenRequest(nextSpineItem, self);
        openPageRequest.setFirstPage();

        openPage(openPageRequest, 2);
    };

    /**
     * Opens the previous page.
     */
    this.openPagePrev = function () {

        if (self.getCurrentViewType() === ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS) {
            _currentView.openPagePrev(self);
            return;
        }

        var paginationInfo = _currentView.getPaginationInfo();

        if (paginationInfo.openPages.length == 0) {
            return;
        }

        var firstOpenPage = paginationInfo.openPages[0];

        if (firstOpenPage.spineItemPageIndex > 0) {
            _currentView.openPagePrev(self);
            return;
        }

        var currentSpineItem = _spine.getItemById(firstOpenPage.idref);

        var prevSpineItem = _spine.prevItem(currentSpineItem);

        if (!prevSpineItem) {
            return;
        }

        var openPageRequest = new PageOpenRequest(prevSpineItem, self);
        openPageRequest.setLastPage();

        openPage(openPageRequest, 1);
    };

    function getSpineItem(idref) {

        if (!idref) {

            console.log("idref parameter value missing!");
            return undefined;
        }

        var spineItem = _spine.getItemById(idref);
        if (!spineItem) {
            console.log("Spine item with id " + idref + " not found!");
            return undefined;
        }

        return spineItem;

    }

    /**
     * Opens the page of the spine item with element with provided cfi
     *
     * @param {string} idref Id of the spine item
     * @param {string} elementCfi CFI of the element to be shown
     * @param {object} initiator optional
     */
    this.openSpineItemElementCfi = function (idref, elementCfi, initiator) {

        var spineItem = getSpineItem(idref);

        if (!spineItem) {
            return false;
        }

        var pageData = new PageOpenRequest(spineItem, initiator);
        if (elementCfi) {
            pageData.setElementCfi(elementCfi);
        }

        openPage(pageData, 0);

        return true;
    };

    /**
     * Opens specified page index of the current spine item
     *
     * @param {number} pageIndex Zero based index of the page in the current spine item
     * @param {object} initiator optional
     */
    this.openPageIndex = function (pageIndex, initiator) {

        if (!_currentView) {
            return false;
        }

        var pageRequest;

        if (_package.isFixedLayout()) {
            var spineItem = _spine.items[pageIndex];
            if (!spineItem) {
                return false;
            }

            pageRequest = new PageOpenRequest(spineItem, initiator);
            pageRequest.setPageIndex(0);
        }
        else {

            var spineItems = this.getLoadedSpineItems();
            if (spineItems.length > 0) {
                pageRequest = new PageOpenRequest(spineItems[0], initiator);
                pageRequest.setPageIndex(pageIndex);
            }
        }

        openPage(pageRequest, 0);

        return true;
    };

    // dir: 0 => new or same page, 1 => previous, 2 => next
    function openPage(pageRequest, dir) {

        initViewForItem(pageRequest.spineItem, function (isViewChanged) {

            if (!isViewChanged) {
                var docWillChange = true;
                _currentView.setViewSettings(_viewerSettings, docWillChange);
            }

            _currentView.openPage(pageRequest, dir);
        });
    }


    /**
     * Opens page index of the spine item with idref provided
     *
     * @param {string} idref Id of the spine item
     * @param {number} pageIndex Zero based index of the page in the spine item
     * @param {object} initiator optional
     */
    this.openSpineItemPage = function (idref, pageIndex, initiator) {

        var spineItem = getSpineItem(idref);

        if (!spineItem) {
            return false;
        }

        var pageData = new PageOpenRequest(spineItem, initiator);
        if (pageIndex) {
            pageData.setPageIndex(pageIndex);
        }

        openPage(pageData, 0);

        return true;
    };

    /**
     * Set CSS Styles to the reader container
     *
     * @param {Collections.StyleCollection} styles   Style collection containing selector property and declarations object
     * @param {boolean} doNotUpdateView                         Whether to update the view after the styles are applied.
     */
    this.setStyles = function (styles, doNotUpdateView) {

        var count = styles.length;

        for (var i = 0; i < count; i++) {
            if (styles[i].declarations) {
                _userStyles.addStyle(styles[i].selector, styles[i].declarations);
            }
            else {
                _userStyles.removeStyle(styles[i].selector);
            }
        }

        applyStyles(doNotUpdateView);

    };

    /**
     * Set CSS Styles to the content documents
     *
     * @param {Collections.StyleCollection} styles    Style collection containing selector property and declarations object
     */
    this.setBookStyles = function (styles) {

        var count = styles.length;

        for (var i = 0; i < count; i++) {
            if (styles[i].declarations) {
                _bookStyles.addStyle(styles[i].selector, styles[i].declarations);
            }
            else {
                _bookStyles.removeStyle(styles[i].selector);
            }
        }

        if (_currentView) {
            _currentView.applyBookStyles();
        }

    };

    /**
     * Gets an element from active content documents based on a query selector.
     *
     * @param {Models.SpineItem} spineItem       The spine item object associated with an active content document
     * @param {string} selector                      The query selector
     * @returns {HTMLElement|undefined}
     */
    this.getElement = function (spineItemIdref, selector) {

        if (_currentView) {
            return _currentView.getElement(spineItemIdref, selector);
        }

        return undefined;
    };

    /**
     * Gets an element from active content documents based on an element id.
     *
     * @param {string} spineItemIdref      The spine item idref associated with an active content document
     * @param {string} id                                  The element id
     * @returns {HTMLElement|undefined}
     */
    this.getElementById = function (spineItemIdref, id) {

        if (_currentView) {
            return _currentView.getElementById(spineItemIdref, id);
        }

        return undefined;
    };

    /**
     * Gets an element from active content documents based on a content CFI.
     *
     * @param {string} spineItemIdref     The spine item idref associated with an active content document
     * @param {string} cfi                                The partial content CFI
     * @param {string[]} [classBlacklist]
     * @param {string[]} [elementBlacklist]
     * @param {string[]} [idBlacklist]
     * @returns {HTMLElement|undefined}
     */
    this.getElementByCfi = function (spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if (_currentView) {
            return _currentView.getElementByCfi(spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist);
        }

        return undefined;

    };

    function applyStyles(doNotUpdateView) {

        Helpers.setStyles(_userStyles.getStyles(), _$el);

        if (_mediaOverlayPlayer)
            _mediaOverlayPlayer.applyStyles();

        if (doNotUpdateView) return;

        if (_currentView) {
            _currentView.applyStyles();
        }
    }

    /**
     * Opens a content url from a media player context
     *
     * @param {string} contentRefUrl
     * @param {string} sourceFileHref
     * @param offset
     */
    this.mediaOverlaysOpenContentUrl = function (contentRefUrl, sourceFileHref, offset) {
        _mediaOverlayPlayer.mediaOverlaysOpenContentUrl(contentRefUrl, sourceFileHref, offset);
    };


    /**
     * Opens the content document specified by the url
     *
     * @param {string} contentRefUrl Url of the content document
     * @param {string | undefined} sourceFileHref Url to the file that contentRefUrl is relative to. If contentRefUrl is
     * relative ot the source file that contains it instead of the package file (ex. TOC file) We have to know the
     * sourceFileHref to resolve contentUrl relative to the package file.
     * @param {object} initiator optional
     */
    this.openContentUrl = function (contentRefUrl, sourceFileHref, initiator) {

        var combinedPath = Helpers.ResolveContentRef(contentRefUrl, sourceFileHref);

        var hashIndex = combinedPath.indexOf("#");
        var hrefPart;
        var elementId;
        if (hashIndex >= 0) {
            hrefPart = combinedPath.substr(0, hashIndex);
            elementId = combinedPath.substr(hashIndex + 1);
        }
        else {
            hrefPart = combinedPath;
            elementId = undefined;
        }

        var spineItem = _spine.getItemByHref(hrefPart);
        if (!spineItem) {
            console.warn('spineItem ' + hrefPart + ' not found');
            // sometimes that happens because spine item's URI gets encoded,
            // yet it's compared with raw strings by `getItemByHref()` -
            // so we try to search with decoded link as well
            var decodedHrefPart = decodeURIComponent(hrefPart);
            spineItem = _spine.getItemByHref(decodedHrefPart);
            if (!spineItem) {
                console.warn('decoded spineItem ' + decodedHrefPart + ' missing as well');
                return false;
            }
        }

        return self.openSpineItemElementId(spineItem.idref, elementId, initiator);
    };

    /**
     * Opens the page of the spine item with element with provided cfi
     *
     * @param {string} idref Id of the spine item
     * @param {string} elementId id of the element to be shown
     * @param {object} initiator optional
     */
    this.openSpineItemElementId = function (idref, elementId, initiator) {

        var spineItem = _spine.getItemById(idref);
        if (!spineItem) {
            return false;
        }

        var pageData = new PageOpenRequest(spineItem, initiator);

        if (elementId) {
            pageData.setElementId(elementId);
        }


        openPage(pageData, 0);

        return true;
    };

    //var cfi = new BookmarkData(bookmark.idref, bookmark.contentCFI);
    this.debugBookmarkData = function(cfi) {

        if (!ReadiumSDK) return;

        var DEBUG = true; // change this to visualize the CFI range
        if (!DEBUG) return;
            
        var paginationInfo = this.getPaginationInfo();
        console.log(JSON.stringify(paginationInfo));
        
        if (paginationInfo.isFixedLayout) return;
    
        try {
            ReadiumSDK._DEBUG_CfiNavigationLogic.clearDebugOverlays();
            
        } catch (error) {
            //ignore
        }
        
        try {
            console.log(cfi);
            
            var range = this.getDomRangeFromRangeCfi(cfi);
            console.log(range);
            
            var res = ReadiumSDK._DEBUG_CfiNavigationLogic.drawDebugOverlayFromDomRange(range);
            console.log(res);
        
            var cfiFirst = ReadiumSDK.reader.getFirstVisibleCfi();
            console.log(cfiFirst);
            
            var cfiLast  = ReadiumSDK.reader.getLastVisibleCfi();
            console.log(cfiLast);
            
        } catch (error) {
            //ignore
        }
        
        setTimeout(function() {
            try {
                ReadiumSDK._DEBUG_CfiNavigationLogic.clearDebugOverlays();
            } catch (error) {
                //ignore
            }
        }, 2000);
    };

    /**
     * Returns the bookmark associated with currently opened page.
     *
     * @returns {string} Serialized ReadiumSDK.Models.BookmarkData object as JSON string.
     *          {null} If a bookmark could not be created successfully.
     */
    this.bookmarkCurrentPage = function() {
        var bookmark = _currentView.bookmarkCurrentPage();
        return bookmark ? bookmark.toString() : null;
    };

    /**
     * Resets all the custom styles set by setStyle callers at runtime
     */
    this.clearStyles = function () {

        _userStyles.resetStyleValues();
        applyStyles();
        _userStyles.clear();
    };

    /**
     * Resets all the custom styles set by setBookStyle callers at runtime
     */
    this.clearBookStyles = function () {

        if (_currentView) {

            _bookStyles.resetStyleValues();
            _currentView.applyBookStyles();
        }

        _bookStyles.clear();
    };

    /**
     * Returns true if media overlay available for one of the open pages.
     *
     * @returns {boolean}
     */
    this.isMediaOverlayAvailable = function () {

        if (!_mediaOverlayPlayer) return false;

        return _mediaOverlayPlayer.isMediaOverlayAvailable();
    };

    /*
     this.setMediaOverlaySkippables = function(items) {

     _mediaOverlayPlayer.setMediaOverlaySkippables(items);
     };

     this.setMediaOverlayEscapables = function(items) {

     _mediaOverlayPlayer.setMediaOverlayEscapables(items);
     };
     */

    /**
     * Starts/Stop playing media overlay on current page
     */
    this.toggleMediaOverlay = function () {

        _mediaOverlayPlayer.toggleMediaOverlay();
    };


    /**
     * Plays next fragment media overlay
     */
    this.nextMediaOverlay = function () {

        _mediaOverlayPlayer.nextMediaOverlay();

    };

    /**
     * Plays previous fragment media overlay
     */
    this.previousMediaOverlay = function () {

        _mediaOverlayPlayer.previousMediaOverlay();

    };

    /**
     * Plays next available fragment media overlay that is outside of the current escapable scope
     */
    this.escapeMediaOverlay = function () {

        _mediaOverlayPlayer.escape();
    };

    /**
     * End media overlay TTS
     * @todo Clarify what this does with Daniel.
     */
    this.ttsEndedMediaOverlay = function () {

        _mediaOverlayPlayer.onTTSEnd();
    };

    /**
     * Pause currently playing media overlays.
     */
    this.pauseMediaOverlay = function () {

        _mediaOverlayPlayer.pause();
    };

    /**
     * Start/Resume playback of media overlays.
     */
    this.playMediaOverlay = function () {

        _mediaOverlayPlayer.play();
    };

    /**
     * Determine if media overlays are currently playing.
     * @returns {boolean}
     */
    this.isPlayingMediaOverlay = function () {

        return _mediaOverlayPlayer.isPlaying();
    };

//
// should use Globals.Events.SETTINGS_APPLIED instead!
//    this.setRateMediaOverlay = function(rate) {
//
//        _mediaOverlayPlayer.setRate(rate);
//    };
//    this.setVolumeMediaOverlay = function(volume){
//
//        _mediaOverlayPlayer.setVolume(volume);
//    };

    /**
     * Get the first visible media overlay element from the currently active content document(s)
     * @returns {HTMLElement|undefined}
     */
    this.getFirstVisibleMediaOverlayElement = function () {

        if (_currentView) {
            return _currentView.getFirstVisibleMediaOverlayElement();
        }

        return undefined;
    };

    /**
     * Used to jump to an element to make sure it is visible when a content document is paginated
     * @param {string}      spineItemId   The spine item idref associated with an active content document
     * @param {HTMLElement} element       The element to make visible
     * @param [initiator]
     */
    this.insureElementVisibility = function (spineItemId, element, initiator) {

        if (_currentView) {
            _currentView.insureElementVisibility(spineItemId, element, initiator);
        }
    };

    var _resizeBookmark = null;
    var _resizeMOWasPlaying = false;

    function handleViewportResizeStart() {

        _resizeBookmark = null;
        _resizeMOWasPlaying = false;

        if (_currentView) {

            if (_currentView.isReflowable && _currentView.isReflowable()) {
                _resizeMOWasPlaying = self.isPlayingMediaOverlay();
                if (_resizeMOWasPlaying) {
                    self.pauseMediaOverlay();
                }
            }

            _resizeBookmark = _currentView.bookmarkCurrentPage(); // not self! (JSON string)
        }
    }

    function handleViewportResizeTick() {
        if (_currentView) {
            self.handleViewportResize(_resizeBookmark);
        }
    }

    function handleViewportResizeEnd() {
        //same as doing one final tick for now
        handleViewportResizeTick();

        if (_resizeMOWasPlaying) self.playMediaOverlay();
    }

    this.handleViewportResize = function (bookmarkToRestore) {
        if (!_currentView) return;

        _currentView.onViewportResize();
    };

    /**
     * Lets user to subscribe to iframe's window events
     *
     * @param {string} eventName              Event name.
     * @param {function} callback             Callback function.
     * @param {object} context                User specified data passed to the callback function.
     * @returns {undefined}
     */
    this.addIFrameEventListener = function (eventName, callback, context) {
        _iframeLoader.addIFrameEventListener(eventName, callback, context);
    };

    var BackgroundAudioTrackManager = function (readerView) {
        var _spineItemIframeMap = {};
        var _wasPlaying = false;

        var _callback_playPause = undefined;
        this.setCallback_PlayPause = function (callback) {
            _callback_playPause = callback;
        };

        var _callback_isAvailable = undefined;
        this.setCallback_IsAvailable = function (callback) {
            _callback_isAvailable = callback;
        };

        this.playPause = function (doPlay) {
            _playPause(doPlay);
        };

        var _playPause = function (doPlay) {
            if (_callback_playPause) {
                _callback_playPause(doPlay);
            }

            try {
                var $iframe = undefined;

                for (var prop in _spineItemIframeMap) {
                    if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                    var data = _spineItemIframeMap[prop];
                    if (!data || !data.active) continue;

                    if ($iframe) console.error("More than one active iframe?? (pagination)");

                    $iframe = data["$iframe"];
                    if (!$iframe) continue;

                    var $audios = $("audio", $iframe[0].contentDocument);

                    $.each($audios, function () {

                        var attr = this.getAttribute("epub:type") || this.getAttribute("type");

                        if (!attr) return true; // continue

                        if (attr.indexOf("ibooks:soundtrack") < 0 && attr.indexOf("media:soundtrack") < 0 && attr.indexOf("media:background") < 0) return true; // continue

                        if (doPlay && this.play) {
                            this.play();
                        }
                        else if (this.pause) {
                            this.pause();
                        }

                        return true; // continue (more than one track?)
                    });
                }
            }
            catch (err) {
                console.error(err);
            }
        };

        this.setPlayState = function (wasPlaying) {
            _wasPlaying = wasPlaying;
        };

        readerView.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "ON", "reader_view.js (via BackgroundAudioTrackManager) [ " + spineItem.href + " ]");;
            
            try {
                if (spineItem && spineItem.idref && $iframe && $iframe[0]) {
                    // console.log("CONTENT_DOCUMENT_LOADED");
                    // console.debug(spineItem.href);
                    // console.debug(spineItem.idref);

                    _spineItemIframeMap[spineItem.idref] = {"$iframe": $iframe, href: spineItem.href};
                }
            }
            catch (err) {
                console.error(err);
            }
        });

        readerView.on(Globals.Events.PAGINATION_CHANGED, function (pageChangeData) {
            Globals.logEvent("PAGINATION_CHANGED", "ON", "reader_view.js (via BackgroundAudioTrackManager)");
            
            // console.log("PAGINATION_CHANGED");
            // console.debug(pageChangeData);
            //
            // if (pageChangeData.spineItem)
            // {
            //     console.debug(pageChangeData.spineItem.href);
            //     console.debug(pageChangeData.spineItem.idref);
            // }
            // else
            // {
            //     //console.error(pageChangeData);
            // }
            //
            // if (pageChangeData.paginationInfo && pageChangeData.paginationInfo.openPages && pageChangeData.paginationInfo.openPages.length)
            // {
            //     for (var i = 0; i < pageChangeData.paginationInfo.openPages.length; i++)
            //     {
            //         console.log(pageChangeData.paginationInfo.openPages[i].idref);
            //     }
            // }

            var atLeastOne = false;

            try {
                for (var prop in _spineItemIframeMap) {
                    if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                    var isActive = pageChangeData.spineItem && pageChangeData.spineItem.idref === prop;

                    var isDisplayed = false;

                    if (pageChangeData.paginationInfo && pageChangeData.paginationInfo.openPages.length) {
                        var allSame = true;

                        for (var i = 0; i < pageChangeData.paginationInfo.openPages.length; i++) {
                            if (pageChangeData.paginationInfo.openPages[i].idref === prop) {
                                isDisplayed = true;
                            }
                            else {
                                allSame = false;
                            }
                        }

                        if (!isActive && allSame) isActive = true;
                    }

                    if (isActive || isDisplayed) {
                        var data = _spineItemIframeMap[prop];
                        if (!data) continue;

                        _spineItemIframeMap[prop]["active"] = isActive;

                        var $iframe = data["$iframe"];
                        var href = data.href;

                        var $audios = $("audio", $iframe[0].contentDocument);
                        $.each($audios, function () {

                            var attr = this.getAttribute("epub:type") || this.getAttribute("type");

                            if (!attr) return true; // continue

                            if (attr.indexOf("ibooks:soundtrack") < 0 && attr.indexOf("media:soundtrack") < 0 && attr.indexOf("media:background") < 0) return true; // continue

                            this.setAttribute("loop", "loop");
                            this.removeAttribute("autoplay");

                            // DEBUG!
                            //this.setAttribute("controls", "controls");

                            if (isActive) {
                                // DEBUG!
                                //$(this).css({border:"2px solid green"});
                            }
                            else {
                                if (this.pause) this.pause();

                                // DEBUG!
                                //$(this).css({border:"2px solid red"});
                            }

                            atLeastOne = true;

                            return true; // continue (more than one track?)
                        });

                        continue;
                    }
                    else {
                        if (_spineItemIframeMap[prop]) _spineItemIframeMap[prop]["$iframe"] = undefined;
                        _spineItemIframeMap[prop] = undefined;
                    }
                }
            }
            catch (err) {
                console.error(err);
            }

            if (_callback_isAvailable) {
                _callback_isAvailable(atLeastOne);
            }

            if (atLeastOne) {
                if (_wasPlaying) {
                    _playPause(true);
                }
                else {
                    _playPause(false); // ensure correct paused state
                }
            }
            else {
                _playPause(false); // ensure correct paused state
            }
        });

        readerView.on(Globals.Events.MEDIA_OVERLAY_STATUS_CHANGED, function (value) {
            Globals.logEvent("MEDIA_OVERLAY_STATUS_CHANGED", "ON", "reader_view.js (via BackgroundAudioTrackManager)");
            
            if (!value.smilIndex) return;
            var packageModel = readerView.package();
            var smil = packageModel.media_overlay.smilAt(value.smilIndex);
            if (!smil || !smil.spineItemId) return;

            var needUpdate = false;
            for (var prop in _spineItemIframeMap) {
                if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                var data = _spineItemIframeMap[prop];
                if (!data) continue;

                if (data.active) {
                    if (prop !== smil.spineItemId) {
                        _playPause(false); // ensure correct paused state
                        data.active = false;
                        needUpdate = true;
                    }
                }
            }

            if (needUpdate) {
                for (var prop in _spineItemIframeMap) {
                    if (!_spineItemIframeMap.hasOwnProperty(prop)) continue;

                    var data = _spineItemIframeMap[prop];
                    if (!data) continue;

                    if (!data.active) {
                        if (prop === smil.spineItemId) {
                            data.active = true;
                        }
                    }
                }

                if (_wasPlaying) {
                    _playPause(true);
                }
            }
        });
    };
    this.backgroundAudioTrackManager = new BackgroundAudioTrackManager(self);

    function getCfisForVisibleRegion() {
        return {firstVisibleCfi: self.getFirstVisibleCfi(), lastVisibleCfi: self.getLastVisibleCfi()};
    }


    this.isVisibleSpineItemElementCfi = function(spineIdRef, partialCfi){
        var spineItem = getSpineItem(spineIdRef);

        if (!spineItem) {
            return false;
        }

        if (_currentView) {

            if(!partialCfi || (partialCfi && partialCfi === '')){
                var spines = _currentView.getLoadedSpineItems();
                for(var i = 0, count = spines.length; i < count; i++) {
                    if(spines[i].idref == spineIdRef){
                        return true;
                    }
                }
            }
            return _currentView.isVisibleSpineItemElementCfi(spineIdRef, partialCfi);

        }
        return false;
    };

    /**
     * Gets all elements from active content documents based on a query selector.
     *
     * @param {string} spineItemIdref    The spine item idref associated with the content document
     * @param {string} selector          The query selector
     * @returns {HTMLElement[]}
     */
    this.getElements = function(spineItemIdref, selector) {

        if(_currentView) {
            return _currentView.getElements(spineItemIdref, selector);
        }

        return undefined;
    };

    /**
     * Determine if an element is visible on the active content documents
     *
     * @param {HTMLElement} element The element.
     * @returns {boolean}
     */
    this.isElementVisible = function (element) {
        return _currentView.isElementVisible($(element));

    };

    /**
     * Resolve a range CFI into an object containing info about it.
     * @param {string} spineIdRef    The spine item idref associated with the content document
     * @param {string} partialCfi    The partial CFI that is the range CFI to resolve
     * @returns {Models.NodeRangeInfo}
     */
    this.getNodeRangeInfoFromCfi = function (spineIdRef, partialCfi) {
        if (_currentView && spineIdRef && partialCfi) {
            var nodeRangeInfo = _currentView.getNodeRangeInfoFromCfi(spineIdRef, partialCfi);
            if (nodeRangeInfo) {
                return new NodeRangeInfo(nodeRangeInfo.clientRect)
                    .setStartInfo(nodeRangeInfo.startInfo)
                    .setEndInfo(nodeRangeInfo.endInfo);
            }
        }
        return undefined;
    };

    /**
     * Get the pagination info from the current view
     *
     * @returns {ReadiumSDK.Models.CurrentPagesInfo}
     */
    this.getPaginationInfo = function(){
        return _currentView.getPaginationInfo();
    };
    /**
     * Get CFI of the first element visible in the viewport
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getFirstVisibleCfi = function() {
        if (_currentView) {
            return _currentView.getFirstVisibleCfi();
        }
        return undefined;
    };

    /**
     * Get CFI of the last element visible in the viewport
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getLastVisibleCfi = function() {
        if (_currentView) {
            return _currentView.getLastVisibleCfi();
        }
        return undefined;
    };

    /**
     * Get CFI of the first element from the base of the document
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getStartCfi = function() {
        if (_currentView) {
            return _currentView.getStartCfi();
        }
        return undefined;
    };

    /**
     * Get CFI of the last element from the base of the document
     * @returns {ReadiumSDK.Models.BookmarkData}
     */
    this.getEndCfi = function() {
        if (_currentView) {
            return _currentView.getEndCfi();
        }
        return undefined;
    };

    /**
     *
     * @param {string} rangeCfi
     * @param {string} [rangeCfi2]
     * @param {boolean} [inclusive]
     * @returns {array}
     */
    this.getDomRangesFromRangeCfi = function(rangeCfi, rangeCfi2, inclusive) {
        if (_currentView) {
            if (_currentView.getDomRangesFromRangeCfi) {
                return _currentView.getDomRangesFromRangeCfi(rangeCfi, rangeCfi2, inclusive);
            } else {
                return [_currentView.getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive)];
            }
        }
        return undefined;
    };

    /**
     *
     * @param {ReadiumSDK.Models.BookmarkData} startCfi starting CFI
     * @param {ReadiumSDK.Models.BookmarkData} [endCfi] ending CFI
     * optional - may be omited if startCfi is a range CFI
     * @param {boolean} [inclusive] optional indicating if the range should be inclusive
     * @returns {array}
     */
    this.getDomRangesFromRangeCfi = function(rangeCfi, rangeCfi2, inclusive) {
        if (_currentView) {
            if (_currentView.getDomRangesFromRangeCfi) {
                return _currentView.getDomRangesFromRangeCfi(rangeCfi, rangeCfi2, inclusive);
            } else {
                return [_currentView.getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive)];
            }
        }
        return undefined;
    };

    /**
     *
     * @param {ReadiumSDK.Models.BookmarkData} startCfi starting CFI
     * @param {ReadiumSDK.Models.BookmarkData} [endCfi] ending CFI
     * optional - may be omited if startCfi is a range CFI
     * @param {boolean} [inclusive] optional indicating if the range should be inclusive
     * @returns {DOM Range} https://developer.mozilla.org/en-US/docs/Web/API/Range
     */
    this.getDomRangeFromRangeCfi = function(startCfi, endCfi, inclusive) {
        if (_currentView) {
            return _currentView.getDomRangeFromRangeCfi(startCfi, endCfi, inclusive);
        }
        return undefined;
    };

    /**
     * Generate range CFI from DOM range
     * @param {DOM Range} https://developer.mozilla.org/en-US/docs/Web/API/Range
     * @returns {string} - represents Range CFI for the DOM range
     */
    this.getRangeCfiFromDomRange = function(domRange) {
        if (_currentView) {
            return _currentView.getRangeCfiFromDomRange(domRange);
        }
        return undefined;
    };

    /**
     * @param x
     * @param y
     * @param [precisePoint]
     * @param [spineItemIdref] Required for fixed layout views
     * @returns {string}
     */
    this.getVisibleCfiFromPoint = function (x, y, precisePoint, spineItemIdref) {
        if (_currentView) {
            return _currentView.getVisibleCfiFromPoint(x, y, precisePoint, spineItemIdref);
        }
        return undefined;
    };

    /**
     *
     * @param startX
     * @param startY
     * @param endX
     * @param endY
     * @param [spineItemIdref] Required for fixed layout views
     * @returns {*}
     */
    this.getRangeCfiFromPoints = function(startX, startY, endX, endY, spineItemIdref) {
        if (_currentView) {
            return _currentView.getRangeCfiFromPoints(startX, startY, endX, endY, spineItemIdref);
        }
        return undefined;
    };

    /**
     *
     * @param {HTMLElement} element
     * @returns {*}
     */
    this.getCfiForElement = function(element) {
        if (_currentView) {
            return _currentView.getCfiForElement(element);
        }
        return undefined;
    };
       
    /**
     * Useful for getting a CFI that's as close as possible to an invisible (not rendered, zero client rects) element
     * @param {HTMLElement} element
     * @returns {*}
     */
    this.getNearestCfiFromElement = function(element) {
        if (_currentView) {
            return _currentView.getNearestCfiFromElement(element);
        }
        return undefined;
    };
    
};

/**
 * View Type
 * @typedef {object} Globals.Views.ReaderView.ViewType
 * @property {number} VIEW_TYPE_COLUMNIZED          Reflowable document view
 * @property {number} VIEW_TYPE_FIXED               Fixed layout document view
 * @property {number} VIEW_TYPE_SCROLLED_DOC        Scrollable document view
 * @property {number} VIEW_TYPE_SCROLLED_CONTINUOUS Continuous scrollable document view
 */
ReaderView.VIEW_TYPE_COLUMNIZED = 1;
ReaderView.VIEW_TYPE_FIXED = 2;
ReaderView.VIEW_TYPE_SCROLLED_DOC = 3;
ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS = 4;
return ReaderView;
});


define("readium-shared-js", function(){});

require(["readium_shared_js/globalsSetup"]);

//# sourceMappingURL=readium-shared-js.js.map