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
        MEDIA_OVERLAY_COMPLETE_CURRENT_PAGE: "MediaOverlayCompleteCurrentPage",
        /**
         * @event
         */
        PLUGINS_LOADED: "PluginsLoaded",
        /**
         * @event
         */
        USER_DID_TAP: "UserDidTap",
        /**
         * @event
         */
        VIEWPORT_DID_RESIZE: "ViewportDidResize"
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
     * Is the ebook is vertical writing mode?
     *
     * @property isVerticalWritingMode
     * @type bool
     */
    // TODO: Parsing attributes from HTML
    this.isVerticalWritingMode = false;

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
define('readium_shared_js/helpers',["./globals", 'underscore', "jquery", "jquerySizes", "./models/spine_item"], function(Globals, _, $, JQuerySizes, SpineItem) {
    
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
 *
 * @returns object (map between URL query parameter names and corresponding decoded / unescaped values)
 */
Helpers.getURLQueryParams = function() {
    var params = {};

    var query = window.location.search;
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
 * @param urlpath: string corresponding a URL without query parameters (i.e. the part before the '?' question mark in index.html?param=value). If undefined/null, the default window.location is used.
 * @param overrides: object that maps query parameter names with values (to be included in the resulting URL, while any other query params in the current window.location are preserved as-is) 
 * @returns a string corresponding to a URL obtained by concatenating the given URL with the given query parameters (and those already in window.location)
 */
Helpers.buildUrlQueryParameters = function(urlpath, overrides) {
    
    if (!urlpath) {
        urlpath =
        window.location ? (
            window.location.protocol
            + "//"
            + window.location.hostname
            + (window.location.port ? (':' + window.location.port) : '')
            + window.location.pathname
        ) : 'index.html';
    }

    var paramsString = "";
    
    for (var key in overrides) {
        if (!overrides.hasOwnProperty(key)) continue;
        
        if (!overrides[key]) continue;
        
        var val = overrides[key].trim();
        if (!val) continue;
        
        console.debug("URL QUERY PARAM OVERRIDE: " + key + " = " + val);

        paramsString += (key + "=" + encodeURIComponent(val));
        paramsString += "&";
    }
    
    var urlParams = Helpers.getURLQueryParams();
    for (var key in urlParams) {
        if (!urlParams.hasOwnProperty(key)) continue;
        
        if (!urlParams[key]) continue;
        
        if (overrides[key]) continue;

        var val = urlParams[key].trim();
        if (!val) continue;
        
        console.debug("URL QUERY PARAM PRESERVED: " + key + " = " + val);

        paramsString += (key + "=" + encodeURIComponent(val));
        paramsString += "&";
    }
    
    return urlpath + "?" + paramsString;
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
            var originalFontSize = Number(fontSizeAttr);
            $(ele).css("font-size", (originalFontSize * factor) + 'px');

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

    "single_page_frame": '<div><div id="scaler"><iframe allowfullscreen="allowfullscreen" scrolling="no" class="iframe-fixed"></iframe></div></div>',
    //"single_page_frame" : '<div><iframe scrolling="no" class="iframe-fixed" id="scaler"></iframe></div>',

    "scrolled_book_frame": '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="scrolled-content-frame"></div></div>',
    "reflowable_book_frame": '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"></div>',
    "reflowable_book_page_frame": '<div id="reflowable-content-frame" class="reflowable-content-frame"><iframe allowfullscreen="allowfullscreen" scrolling="no" id="epubContentIframe"></iframe></div>'
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

Helpers.addTapEventHandler = function($body, reportClicked) {
    var startPageX = 0;
    var startPageY = 0;
    var longTapped = false;
    var tapTimer = undefined;
    var startReturnValue = true;
    var touchStartEventHandler = function(event) {
        var touch = event.touches[0];

        longTapped = false;
        startPageX = touch.pageX;
        startPageY = touch.pageY;
        tapTimer = setTimeout(function() {
            longTapped = true;
        }, 1500);
        startReturnValue = event.returnValue;
        //console.debug("TOUCH-START: event.returnValue = " + event.returnValue);
        //console.debug("TOUCH-START: # touches = " + event.touches.length);
        //console.debug("TOUCH-START (" + startPageX + ", " + startPageY + ")");
    };
    /*
    var touchMoveEventHandler = function(event) {
        console.debug("TOUCH-MOVE: # touches = " + event.touches.length);
        //console.debug("TOUCH-MOVE (" + event.touches[0].pageX + ", " + event.touches[0].pageY + ")");
    }
    */
    var touchEndEventHandler = function(event) {
        var touch = event.changedTouches[0];
        var tapped = (Math.abs(touch.pageX - startPageX) <= 25) && (Math.abs(touch.pageY - startPageY) <= 25);

        if (event.target && event.target !== document.body) {
            var attributes = event.target.attributes;

            if (attributes) {
                for (var i = 0; i < attributes.length; i++) {
                    if (attributes[i].name && attributes[i].name === "onclick") {
                        tapped = false;
                        break;
                    }
                }
            }
        }
        clearTimeout(tapTimer);
        //console.debug("TOUCH-END: # touches = " + event.changedTouches.length);
        //console.debug("TOUCH-END (" +  + touch.pageX + ", " + touch.pageY + "), tapped? " + tapped + ", longTapped? " + longTapped);
        if (tapped && !longTapped && event.returnValue && startReturnValue) {
            return reportClicked(event);
        }
        return true;
    };

    if ('ontouchstart' in document.documentElement) {
        $body.addEventListener("touchstart", touchStartEventHandler, false);
        //$body.addEventListener("touchmove", touchMoveEventHandler, false);
        $body.addEventListener("touchend", touchEndEventHandler, false);
    } else {
        $body.addEventListener("mousedown", touchStartEventHandler, false);
        //$body.addEventListener("mousemove", touchMoveEventHandler, false);
        $body.addEventListener("mouseup", touchEndEventHandler, false);
    }
};

Helpers.findReadAloud = function(node, attributeName) {
    if (node) {
        var readaloud = $(node).attr(attributeName);

        if (readaloud) {
            return {node: node, attr: readaloud};
        } else {
            if (!node.parentElement || node.parentElement === document.body) {
                return undefined;
            }
            if (node.parentElement) {
                return Helpers.findReadAloud(node.parentElement, attributeName);
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

var CfiNavigationLogic = function(options) {

    var self = this;
    options = options || {};

    var debugMode = ReadiumSDK.DEBUG_MODE;

    this.getRootElement = function() {

        return options.$iframe[0].contentDocument.documentElement;
    };
    
    this.getBodyElement = function () {
        
        // In SVG documents the root element can be considered the body.
        return this.getRootDocument().body || this.getRootElement();
    };

    this.getClassBlacklist = function () {
        return options.classBlacklist || [];
    }

    this.getIdBlacklist = function () {
        return options.idBlacklist || [];
    }

    this.getElementBlacklist = function () {
        return options.elementBlacklist || [];
    }

    this.getRootDocument = function () {
        return options.$iframe[0].contentDocument;
    };

    function createRange() {
        return self.getRootDocument().createRange();
    }

    function getNodeClientRect(node) {
        var range = createRange();
        range.selectNode(node);
        return normalizeRectangle(range.getBoundingClientRect(),0,0);
    }

    function getNodeContentsClientRect(node) {
        var range = createRange();
        range.selectNodeContents(node);
        return normalizeRectangle(range.getBoundingClientRect(),0,0);
    }

    function getElementClientRect($element) {
        return normalizeRectangle($element[0].getBoundingClientRect(),0,0);
    }

    function getNodeRangeClientRect(startNode, startOffset, endNode, endOffset) {
        var range = createRange();
        range.setStart(startNode, startOffset ? startOffset : 0);
        if (endNode.nodeType === Node.ELEMENT_NODE) {
            range.setEnd(endNode, endOffset ? endOffset : endNode.childNodes.length);
        } else if (endNode.nodeType === Node.TEXT_NODE) {
            range.setEnd(endNode, endOffset ? endOffset : 0);
        }
        return normalizeRectangle(range.getBoundingClientRect(),0,0);
    }

    function getNodeClientRectList(node, visibleContentOffsets) {
        visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();
        
        var range = createRange();
        range.selectNode(node);
        return _.map(range.getClientRects(), function (rect) {
            return normalizeRectangle(rect, visibleContentOffsets.left, visibleContentOffsets.top);
        });
    }

    function getFrameDimensions() {
        if (options.frameDimensions) {
            return options.frameDimensions();
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
     * Checks whether or not a (fully adjusted) rectangle is at least partly visible
     *
     * @param {Object} rect
     * @param {Object} [frameDimensions]
     * @param {boolean} [isVwm]           isVerticalWritingMode
     * @returns {boolean}
     */
    function isRectVisible(rect, ignorePartiallyVisible, frameDimensions, isVwm) {

        frameDimensions = frameDimensions || getFrameDimensions();
        isVwm = isVwm || isVerticalWritingMode();

        //Text nodes without printable text dont have client rectangles
        if (!rect) {
            return false;
        }
        //Sometimes we get client rects that are "empty" and aren't supposed to be visible
        if (rect.left == 0 && rect.right == 0 && rect.top == 0 && rect.bottom == 0) {
            return false;
        }

        if (isPaginatedView()) {
            return (rect.left >= 0 && rect.left < frameDimensions.width) || 
                (!ignorePartiallyVisible && rect.left < 0 && rect.right >= 0);
        } else {
            return (rect.top >= 0 && rect.top < frameDimensions.height) || 
                (!ignorePartiallyVisible && rect.top < 0 && rect.bottom >= 0);
        }

    }

    /**
     * @private
     * Retrieves _current_ full width of a column (including its gap)
     *
     * @returns {number} Full width of a column in pixels
     */
    function getColumnFullWidth() {

        if (!options.paginationInfo || isVerticalWritingMode())
        {
            return options.$iframe.width();
        }

        return options.paginationInfo.columnWidth + options.paginationInfo.columnGap;
    }

    /**
     * @private
     *
     * Retrieves _current_ offset of a viewport
     * (related to the beginning of the chapter)
     *
     * @returns {Object}
     */
    function getVisibleContentOffsets() {
        if (options.visibleContentOffsets) {
            return options.visibleContentOffsets();
        }

        if (isVerticalWritingMode()) {
            return {
                top: (options.paginationInfo ? options.paginationInfo.pageOffset : 0),
                left: 0
            };
        }
        
        // CAUSES REGRESSION BUGS !! TODO FIXME
        // https://github.com/readium/readium-shared-js/issues/384#issuecomment-305145129
        // else {
        //     return {
        //         top: 0,
        //         left: (options.paginationInfo ? options.paginationInfo.pageOffset : 0)
        //         //* (isPageProgressionRightToLeft() ? -1 : 1)
        //     };
        // }

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
     * @param {Object} _props
     * @param {boolean} shouldCalculateVisibilityPercentage
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
                //it might still be partially visible in webkit
                if (shouldCalculateVisibilityPercentage && adjustedRect.top < 0) {
                    visibilityPercentage =
                        Math.floor(100 * (adjustedRect.height + adjustedRect.top) / adjustedRect.height);
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
     * Finds a page index (0-based) for a specific element.
     * Calculations are based on rectangles retrieved with getClientRects() method.
     *
     * @param {jQuery} $element
     * @param {number} spatialVerticalOffset
     * @returns {number|null}
     */
    function findPageByRectangles($element, spatialVerticalOffset) {

        var visibleContentOffsets = getVisibleContentOffsets();
        //////////////////////
        // ABOVE CAUSES REGRESSION BUGS !! TODO FIXME
        // https://github.com/readium/readium-shared-js/issues/384#issuecomment-305145129
        if (options.visibleContentOffsets) {
            visibleContentOffsets = options.visibleContentOffsets();
        }
        if (isVerticalWritingMode()) {
            visibleContentOffsets = {
                top: (options.paginationInfo ? options.paginationInfo.pageOffset : 0),
                left: 0
            };
        }
        else { // THIS IS ENABLED ONLY FOR findPageByRectangles(), to fix the pageIndex computation. TODO FIXME!
            visibleContentOffsets = {
                top: 0,
                left: (options.paginationInfo ? options.paginationInfo.pageOffset : 0)
                //* (isPageProgressionRightToLeft() ? -1 : 1)
            };
        }
        //////////////////////

        var clientRectangles = getNormalizedRectangles($element, visibleContentOffsets);
        if (clientRectangles.length === 0) { // elements with display:none, etc.
            return null;
        }

        return calculatePageIndexByRectangles(clientRectangles, spatialVerticalOffset);
    }

    /**
     * @private
     * Calculate a page index (0-based) for given client rectangles.
     *
     * @param {object} clientRectangles
     * @param {number} [spatialVerticalOffset]
     * @param {object} [frameDimensions]
     * @param {object} [columnFullWidth]
     * @returns {number|null}
     */
    function calculatePageIndexByRectangles(clientRectangles, spatialVerticalOffset, frameDimensions, columnFullWidth) {
        var isRtl = isPageProgressionRightToLeft();
        var isVwm = isVerticalWritingMode();
        columnFullWidth = columnFullWidth || getColumnFullWidth();
        frameDimensions = frameDimensions || getFrameDimensions();

        if (spatialVerticalOffset) {
            trimRectanglesByVertOffset(clientRectangles, spatialVerticalOffset,
                frameDimensions, columnFullWidth, isRtl, isVwm);
        }

        var firstRectangle = _.first(clientRectangles);
        if (clientRectangles.length === 1) {
            adjustRectangle(firstRectangle, false, frameDimensions, columnFullWidth, isRtl, isVwm);
        }

        var pageIndex;

        if (isVwm) {
            var topOffset = firstRectangle.top;
            pageIndex = Math.floor(topOffset / frameDimensions.height);
        } else {
            var leftOffset = firstRectangle.left;
            if (isRtl) {
                leftOffset = (columnFullWidth * (options.paginationInfo ? options.paginationInfo.visibleColumnCount : 1)) - leftOffset;
            }
            pageIndex = Math.floor(leftOffset / columnFullWidth);
        }

        if (pageIndex < 0) {
            pageIndex = 0;
        }
        else if (pageIndex >= (options.paginationInfo ? options.paginationInfo.columnCount : 1)) {
            pageIndex = (options.paginationInfo ? (options.paginationInfo.columnCount - 1) : 0);
        }

        return pageIndex;
    }

    /**
     * Finds a page index (0-based) for a specific client rectangle.
     * Calculations are based on viewport dimensions, offsets, and rectangle coordinates
     *
     * @param {ClientRect} clientRectangle
     * @param {Object} [visibleContentOffsets]
     * @param {Object} [frameDimensions]
     * @returns {number|null}
     */
    function findPageBySingleRectangle(clientRectangle, visibleContentOffsets, frameDimensions) {
        visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();
        frameDimensions = frameDimensions || getFrameDimensions();
        
        var normalizedRectangle = normalizeRectangle(
            clientRectangle, visibleContentOffsets.left, visibleContentOffsets.top);

        return calculatePageIndexByRectangles([normalizedRectangle], frameDimensions);
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
     * @returns {Object}
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
            clientRectList = range.getClientRects();
        } else {
            clientRectList = $el[0].getClientRects();
        }

        // all the separate rectangles (for detecting position of the element
        // split between several columns)
        var clientRectangles = [];
        for (var i = 0, l = clientRectList.length; i < l; ++i) {
            if (clientRectList[i].height > 0) {
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
     * @param {TextRectangle} textRect
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
                if (isRectVisible(rect, false, frameDimensions, isVwm)) {
                    break;
                }
                offsetRectangle(rect, columnFullWidth, -frameDimensions.height);
            }
        }
    }

    /**
     * @private
     * Trims the rectangle(s) representing the given element.
     *
     * @param {Array} rects
     * @param {number} verticalOffset
     * @param {number} frameDimensions
     * @param {number} columnFullWidth
     * @param {boolean} isRtl
     * @param {boolean} isVwm               isVerticalWritingMode
     */
    function trimRectanglesByVertOffset(
            rects, verticalOffset, frameDimensions, columnFullWidth, isRtl, isVwm) {

        frameDimensions = frameDimensions || getFrameDimensions();
        columnFullWidth = columnFullWidth || getColumnFullWidth();
        isRtl = isRtl || isPageProgressionRightToLeft();
        isVwm = isVwm || isVerticalWritingMode();

        //TODO: Support vertical writing mode
        if (isVwm) {
            return;
        }

        var totalHeight = _.reduce(rects, function(prev, cur) {
            return prev + cur.height;
        }, 0);

        var heightToHide = totalHeight * verticalOffset / 100;
        if (rects.length > 1) {
            var heightAccum = 0;
            do {
                heightAccum += rects[0].height;
                if (heightAccum > heightToHide) {
                    break;
                }
                rects.shift();
            } while (rects.length > 1);
        }
        else {
            // rebase to the last possible column
            // (so that adding to top will be properly processed later)
            if (isRtl) {
                columnFullWidth *= -1;
            }
            while (rects[0].bottom >= frameDimensions.height) {
                offsetRectangle(rects[0], columnFullWidth, -frameDimensions.height);
            }

            rects[0].top += heightToHide;
            rects[0].height -= heightToHide;
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

            if (debugMode) {
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

    this.getRangeCfiFromPoints = function(startX, startY, endX, endY) {
        var document = self.getRootDocument();
        var start = getCaretRangeFromPoint(startX, startY, document),
            end = getCaretRangeFromPoint(endX, endY, document),
            range = createRange();
        range.setStart(start.startContainer, start.startOffset);
        range.setEnd(end.startContainer, end.startOffset);
        // if we're looking at a text node create a nice range (n, n+1)
        if (start.startContainer === start.endContainer && start.startContainer.nodeType === Node.TEXT_NODE && end.startContainer.length > end.startOffset+1) {
            range.setEnd(end.startContainer, end.startOffset+1);
        }
        return generateCfiFromDomRange(range);
    };

    function getTextNodeRectCornerPairs(rect) {
        //
        //    top left             top right
        //    ╲                   ╱
        //  ── ▒T▒E▒X▒T▒ ▒R▒E▒C▒T▒ ──
        //
        // top left corner & top right corner
        // but for y coord use the mid point between top and bottom

        if (isVerticalWritingMode()) {
            var x = rect.right - (rect.width / 2);
            return [{x: x, y: rect.top}, {x: x, y: rect.bottom}];
        } else {
            var y = rect.top + (rect.height / 2);
            var result = [{x: rect.left, y: y}, {x: rect.right, y: y}]
            return isPageProgressionRightToLeft() ? result.reverse() : result;
        }
    }

    var DEBUG = false;

    function getVisibleTextRangeOffsetsSelectedByFunc(textNode, pickerFunc, visibleContentOffsets, frameDimensions) {
        visibleContentOffsets = visibleContentOffsets || getVisibleContentOffsets();
        
        var textNodeFragments = getNodeClientRectList(textNode, visibleContentOffsets);

        var visibleFragments = _.filter(textNodeFragments, function (rect) {
            return isRectVisible(rect, false, frameDimensions);
        });

        var fragment = pickerFunc(visibleFragments);
        if (!fragment) {
            //no visible fragment, empty text node?
            return null;
        }
        var fragmentCorner = pickerFunc(getTextNodeRectCornerPairs(fragment));
        // Reverse taking into account of visible content offsets
        fragmentCorner.x -= visibleContentOffsets.left;
        fragmentCorner.y -= visibleContentOffsets.top;
        
        var caretRange = getCaretRangeFromPoint(fragmentCorner.x, fragmentCorner.y);

        // Workaround for inconsistencies with the caretRangeFromPoint IE TextRange based shim.
        if (caretRange && caretRange.startContainer !== textNode && caretRange.startContainer === textNode.parentNode) {
            if (DEBUG) console.log('ieTextRangeWorkaround needed');
            var startOrEnd = pickerFunc([0, 1]);

            // #1
            if (caretRange.startOffset === caretRange.endOffset) {
                var checkNode = caretRange.startContainer.childNodes[Math.max(caretRange.startOffset - 1, 0)];
                if (checkNode === textNode) {
                    caretRange = {
                        startContainer: textNode,
                        endContainer: textNode,
                        startOffset: startOrEnd === 0 ? 0 : textNode.nodeValue.length,
                        startOffset: startOrEnd === 0 ? 0 : textNode.nodeValue.length
                    };
                    if (DEBUG) console.log('ieTextRangeWorkaround #1:', caretRange);
                }
            }

            // Failed
            else if (DEBUG) {
                console.log('ieTextRangeWorkaround didn\'t work :(');
            }
        }

        if (DEBUG)
        console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'a0');
        
        // Desperately try to find it from all angles! Darn sub pixeling..
        //TODO: remove the need for this brute-force method, since it's making the result non-deterministic
        if (!caretRange || caretRange.startContainer !== textNode) {
            caretRange = getCaretRangeFromPoint(fragmentCorner.x - 1, fragmentCorner.y);
            
            if (DEBUG)
            console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'a1');
        }
        if (!caretRange || caretRange.startContainer !== textNode) {
            caretRange = getCaretRangeFromPoint(fragmentCorner.x, fragmentCorner.y - 1);
            
            if (DEBUG)
            console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'a2');
        }
        if (!caretRange || caretRange.startContainer !== textNode) {
            caretRange = getCaretRangeFromPoint(fragmentCorner.x - 1, fragmentCorner.y - 1);
            
            if (DEBUG)
            console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'a3');
        }
        if (!caretRange || caretRange.startContainer !== textNode) {
            fragmentCorner.x = Math.floor(fragmentCorner.x);
            fragmentCorner.y = Math.floor(fragmentCorner.y);
            caretRange = getCaretRangeFromPoint(fragmentCorner.x, fragmentCorner.y);
            
            if (DEBUG)
            console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'b0');
        }
        // Desperately try to find it from all angles! Darn sub pixeling..
        if (!caretRange || caretRange.startContainer !== textNode) {
            caretRange = getCaretRangeFromPoint(fragmentCorner.x - 1, fragmentCorner.y);
            
            if (DEBUG)
            console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'b1');
        }
        if (!caretRange || caretRange.startContainer !== textNode) {
            caretRange = getCaretRangeFromPoint(fragmentCorner.x, fragmentCorner.y - 1);
            
            if (DEBUG)
            console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'b2');
        }
        if (!caretRange || caretRange.startContainer !== textNode) {
            caretRange = getCaretRangeFromPoint(fragmentCorner.x - 1, fragmentCorner.y - 1);
            
            if (DEBUG)
            console.log('getVisibleTextRangeOffsetsSelectedByFunc: ', 'b3');
        }

        // Still nothing? fall through..
        if (!caretRange) {
            
            if (DEBUG)
            console.warn('getVisibleTextRangeOffsetsSelectedByFunc: no caret range result');
            
            return null;
        }

        if (caretRange.startContainer === textNode) {
            return pickerFunc(
                [{start: caretRange.startOffset, end: caretRange.startOffset + 1},
                {start: caretRange.startOffset - 1, end: caretRange.startOffset}]
            );
        } else {
            
            if (DEBUG)
            console.warn('getVisibleTextRangeOffsetsSelectedByFunc: incorrect caret range result');
            
            return null;
        }
    }

    function findVisibleLeafNodeCfi(leafNodeList, pickerFunc, targetLeafNode, visibleContentOffsets, frameDimensions, startingParent) {
        var index = 0;
        if (!targetLeafNode) {
            index = leafNodeList.indexOf(pickerFunc(leafNodeList));
            var leafNode = leafNodeList[index];
            if (leafNode) {
                startingParent = leafNode.element;
            }
        } else {
            index = leafNodeList.indexOf(targetLeafNode);
            if (index === -1) {
                //target leaf node not the right type? not in list?
                return null;
            }
            // use the next leaf node in the list
            index += pickerFunc([1, -1]);
        }
        var visibleLeafNode = leafNodeList[index];

        if (!visibleLeafNode) {
            return null;
        }

        var element = visibleLeafNode.element;
        var textNode = visibleLeafNode.textNode;

        if (targetLeafNode && element !== startingParent && !_.contains($(textNode || element).parents(), startingParent)) {
            if (DEBUG) console.warn("findVisibleLeafNodeCfi: stopped recursion early");
            return null;
        }

        //if a valid text node is found, try to generate a CFI with range offsets
        if (textNode && isValidTextNode(textNode)) {
            var visibleRange = getVisibleTextRangeOffsetsSelectedByFunc(textNode, pickerFunc, visibleContentOffsets, frameDimensions);
            if (!visibleRange) {
                //the text node is valid, but not visible..
                //let's try again with the next node in the list
                return findVisibleLeafNodeCfi(leafNodeList, pickerFunc, visibleLeafNode, visibleContentOffsets, frameDimensions, startingParent);
            }
            var range = createRange();
            range.setStart(textNode, visibleRange.start);
            range.setEnd(textNode, visibleRange.end);
            return generateCfiFromDomRange(range);
        } else {
            //if not then generate a CFI for the element
            return self.getCfiForElement(element);
        }
    }

    // get an array of visible text elements and then select one based on the func supplied
    // and generate a CFI for the first visible text subrange.
    function getVisibleTextRangeCfiForTextElementSelectedByFunc(pickerFunc, visibleContentOffsets, frameDimensions) {        
        var visibleLeafNodeList = self.getVisibleLeafNodes(visibleContentOffsets, frameDimensions);
        return findVisibleLeafNodeCfi(visibleLeafNodeList, pickerFunc, null, visibleContentOffsets, frameDimensions);
    }

    function getLastVisibleTextRangeCfi(visibleContentOffsets, frameDimensions) {
        return getVisibleTextRangeCfiForTextElementSelectedByFunc(_.last, visibleContentOffsets, frameDimensions);
    }

    function getFirstVisibleTextRangeCfi(visibleContentOffsets, frameDimensions) {
        return getVisibleTextRangeCfiForTextElementSelectedByFunc(_.first, visibleContentOffsets, frameDimensions);
    }

    this.getFirstVisibleCfi = function (visibleContentOffsets, frameDimensions) {
        return getFirstVisibleTextRangeCfi(visibleContentOffsets, frameDimensions);
    };

    this.getLastVisibleCfi = function (visibleContentOffsets, frameDimensions) {
        return getLastVisibleTextRangeCfi(visibleContentOffsets, frameDimensions);
    };

    function generateCfiFromDomRange(range) {
        return EPUBcfi.generateRangeComponent(
            range.startContainer, range.startOffset,
            range.endContainer, range.endOffset,
            self.getClassBlacklist(), self.getElementBlacklist(), self.getIdBlacklist());
    }

    function getRangeTargetNodes(rangeCfi) {
        return EPUBcfi.getRangeTargetElements(
            getWrappedCfiRelativeToContent(rangeCfi),
            self.getRootDocument(),
            self.getClassBlacklist(), self.getElementBlacklist(), self.getIdBlacklist());
    }

    this.getDomRangeFromRangeCfi = function(rangeCfi, rangeCfi2, inclusive) {
        var range = createRange();

        if (!rangeCfi2) {
            if (self.isRangeCfi(rangeCfi)) {
                var rangeInfo = getRangeTargetNodes(rangeCfi);
                range.setStart(rangeInfo.startElement, rangeInfo.startOffset);
                range.setEnd(rangeInfo.endElement, rangeInfo.endOffset);
            } else {
                var element = self.getElementByCfi(rangeCfi,
                    this.getClassBlacklist(), this.getElementBlacklist(), this.getIdBlacklist())[0];
                range.selectNode(element);
            }
        } else {
            if (self.isRangeCfi(rangeCfi)) {
                var rangeInfo1 = getRangeTargetNodes(rangeCfi);
                range.setStart(rangeInfo1.startElement, rangeInfo1.startOffset);
            } else {
                var startElement = self.getElementByCfi(rangeCfi,
                    this.getClassBlacklist(), this.getElementBlacklist(), this.getIdBlacklist())[0];
                range.setStart(startElement, 0);
            }

            if (self.isRangeCfi(rangeCfi2)) {
                var rangeInfo2 = getRangeTargetNodes(rangeCfi2);
                if (inclusive) {
                    range.setEnd(rangeInfo2.endElement, rangeInfo2.endOffset);
                } else {
                    range.setEnd(rangeInfo2.startElement, rangeInfo2.startOffset);
                }
            } else {
                var endElement = self.getElementByCfi(rangeCfi2,
                    this.getClassBlacklist(), this.getElementBlacklist(), this.getIdBlacklist())[0];
                range.setEnd(endElement, endElement.childNodes.length);
            }
        }
        return range;
    };

    this.getRangeCfiFromDomRange = function(domRange) {
        return generateCfiFromDomRange(domRange);
    };

    function getWrappedCfi(partialCfi) {
        return "epubcfi(" + partialCfi + ")";
    }

    function getWrappedCfiRelativeToContent(partialCfi) {
        return "epubcfi(/99!" + partialCfi + ")";
    }

    this.isRangeCfi = function (partialCfi) {
        return EPUBcfi.Interpreter.isRangeCfi(getWrappedCfi(partialCfi)) || EPUBcfi.Interpreter.isRangeCfi(getWrappedCfiRelativeToContent(partialCfi));
    };

    this.getPageForElementCfi = function (cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var cfiParts = splitCfi(cfi);
        var partialCfi = cfiParts.cfi;

        if (this.isRangeCfi(partialCfi)) {
            //if given a range cfi the exact page index needs to be calculated by getting node info from the range cfi
            var nodeRangeInfoFromCfi = this.getNodeRangeInfoFromCfi(partialCfi);
            //the page index is calculated from the node's client rectangle
            return findPageBySingleRectangle(nodeRangeInfoFromCfi.clientRect);
        }

        var $element = getElementByPartialCfi(cfiParts.cfi, classBlacklist, elementBlacklist, idBlacklist);

        if (!$element) {
            return -1;
        }

        var pageIndex = this.getPageForPointOnElement($element, cfiParts.x, cfiParts.y);

        return pageIndex;

    };

    function getElementByPartialCfi(cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var contentDoc = self.getRootDocument();

        var wrappedCfi = getWrappedCfi(cfi);

        try {
            //noinspection JSUnresolvedVariable
            var $element = EPUBcfi.getTargetElementWithPartialCFI(wrappedCfi, contentDoc, classBlacklist, elementBlacklist, idBlacklist);

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
        if (self.isRangeCfi(cfi)) {
            var wrappedCfi = getWrappedCfiRelativeToContent(cfi);

            try {
                //noinspection JSUnresolvedVariable
                var nodeResult = EPUBcfi.Interpreter.getRangeTargetElements(wrappedCfi, contentDoc,
                    this.getClassBlacklist(),
                    this.getElementBlacklist(),
                    this.getIdBlacklist());

                if (debugMode) {
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

            if (debugMode) {
                console.log(nodeRangeClientRect);
                addOverlayRect(nodeRangeClientRect, 'purple', contentDoc);
            }

            return {startInfo: startRangeInfo, endInfo: endRangeInfo, clientRect: nodeRangeClientRect}
        } else {
            var $element = self.getElementByCfi(cfi,
                this.getClassBlacklist(),
                this.getElementBlacklist(),
                this.getIdBlacklist());

            var visibleContentOffsets = getVisibleContentOffsets();
            return {startInfo: null, endInfo: null, clientRect: getNormalizedBoundingRect($element, visibleContentOffsets)};
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

    this.getElementByCfi = function (cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var cfiParts = splitCfi(cfi);
        return getElementByPartialCfi(cfiParts.cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getPageForElement = function ($element) {

        return this.getPageForPointOnElement($element, 0, 0);
    };

    this.getPageForPointOnElement = function ($element, x, y) {

        var pageIndex = findPageByRectangles($element, y);
        if (pageIndex === null) {
            console.warn('Impossible to locate a hidden element: ', $element);
            return 0;
        }
        return pageIndex;
    };

    this.getVerticalOffsetForElement = function ($element) {
      return this.getVerticalOffsetForPointOnElement($element, 0, 0);
    };

    this.getVerticalOffsetForPointOnElement = function ($element, x, y) {
      var elementRect = Helpers.Rect.fromElement($element);
      return Math.ceil(elementRect.top + y * elementRect.height / 100);
    };

    this.getElementById = function (id) {

        var contentDoc = this.getRootDocument();

        var $element = $(contentDoc.getElementById(id));
        //$("#" + Helpers.escapeJQuerySelector(id), contentDoc);

        if($element.length == 0) {
            return undefined;
        }

        return $element;
    };

    this.getPageForElementId = function (id) {

        var $element = this.getElementById(id);
        if (!$element) {
            return -1;
        }

        return this.getPageForElement($element);
    };

    function splitCfi(cfi) {

        var ret = {
            cfi: "",
            x: 0,
            y: 0
        };

        var ix = cfi.indexOf("@");

        if (ix != -1) {
            var terminus = cfi.substring(ix + 1);

            var colIx = terminus.indexOf(":");
            if (colIx != -1) {
                ret.x = parseInt(terminus.substr(0, colIx));
                ret.y = parseInt(terminus.substr(colIx + 1));
            }
            else {
                console.log("Unexpected terminating step format");
            }

            ret.cfi = cfi.substring(0, ix);
        }
        else {

            ret.cfi = cfi;
        }

        return ret;
    }

    // returns raw DOM element (not $ jQuery-wrapped)
    this.getFirstVisibleMediaOverlayElement = function(visibleContentOffsets) {
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
                    } else return item;
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


    this.isElementVisible = checkVisibilityByRectangles;

    this.getVisibleElementsWithFilter = function (visibleContentOffsets, filterFunction) {
        var $elements = this.getElementsWithFilter($(this.getBodyElement()), filterFunction);
        return this.getVisibleElements($elements, visibleContentOffsets);
    };

    this.getAllElementsWithFilter = function (filterFunction) {
        var $elements = this.getElementsWithFilter($(this.getBodyElement()), filterFunction);
        return $elements;
    };

    this.getAllVisibleElementsWithSelector = function (selector, visibleContentOffset) {
        var elements = $(selector, this.getRootElement());
        var $newElements = [];
        $.each(elements, function () {
            $newElements.push($(this));
        });
        var visibleElements = this.getVisibleElements($newElements, visibleContentOffset);
        return visibleElements;
    };

    this.getVisibleElements = function ($elements, visibleContentOffsets, frameDimensions) {

        var visibleElements = [];

        _.each($elements, function ($node) {
            var node = $node[0];
            var isTextNode = (node.nodeType === Node.TEXT_NODE);
            var element = isTextNode ? node.parentElement : node;
            var visibilityPercentage = checkVisibilityByRectangles(
                $node, true, visibleContentOffsets, frameDimensions);

            if (visibilityPercentage) {
                visibleElements.push({
                    element: element, // DOM Element is pushed
                    textNode: isTextNode ? node : null,
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
        var isBlacklisted = false;
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
            isBlacklisted = true;
            return;
        } else if (classList.length && _.intersection(classBlacklist, classList).length) {
            isBlacklisted = true;
            return;
        }

        if (id && id.length && _.contains(self.getIdBlacklist(), id)) {
            isBlacklisted = true;
            return;
        }

        return isBlacklisted;
    }

    this.getLeafNodeElements = function ($root) {

        if (_cacheEnabled) {
            var fromCache = _cache.leafNodeElements.get($root);
            if (fromCache) {
                return fromCache;
            }
        }

        var nodeIterator = document.createNodeIterator(
            $root[0],
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            function() {
                return NodeFilter.FILTER_ACCEPT;
            },
            false
        );

        var $leafNodeElements = [];

        var node;
        while ((node = nodeIterator.nextNode())) {
            var isLeafNode = node.nodeType === Node.ELEMENT_NODE && !node.childElementCount && !isValidTextNodeContent(node.textContent);
            if (isLeafNode || isValidTextNode(node)){
                var element = (node.nodeType === Node.TEXT_NODE) ? node.parentElement : node;
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

    function isValidTextNode(node) {

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

        if($element.length > 0) {
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


    // dmitry debug
    // dmitry debug
    // dmitry debug
    // dmitry debug
    // dmitry debug
    // dmitry debug

    var parseContentCfi = function(cont) {
        return cont.replace(/\[(.*?)\]/, "").split(/[\/,:]/).map(function(n) { return parseInt(n); }).filter(Boolean);
    };

    var contentCfiComparator = function(cont1, cont2) {
        cont1 = this.parseContentCfi(cont1);
        cont2 = this.parseContentCfi(cont2);

        //compare cont arrays looking for differences
        for (var i=0; i<cont1.length; i++) {
            if (cont1[i] > cont2[i]) {
                return 1;
            }
            else if (cont1[i] < cont2[i]) {
                return -1;
            }
        }

        //no differences found, so confirm that cont2 did not have values we didn't check
        if (cont1.length < cont2.length) {
            return -1;
        }

        //cont arrays are identical
        return 0;
    };


    // end dmitry debug

    //if (debugMode) {

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
            var leftOffset, topOffset;

            if (isVerticalWritingMode()) {
                leftOffset = 0;
                topOffset = -getPaginationLeftOffset();
            } else {
                leftOffset = -getPaginationLeftOffset();
                topOffset = 0;
            }

            addOverlayRect({
                left: rect.left + leftOffset,
                top: rect.top + topOffset,
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

        function getPaginationLeftOffset() {

            var $htmlElement = $("html", self.getRootDocument());
            var offsetLeftPixels = $htmlElement.css(isVerticalWritingMode() ? "top" : (isPageProgressionRightToLeft() ? "right" : "left"));
            var offsetLeft = parseInt(offsetLeftPixels.replace("px", ""));
            if (isNaN(offsetLeft)) {
                //for fixed layouts, $htmlElement.css("left") has no numerical value
                offsetLeft = 0;
            }
            if (isPageProgressionRightToLeft() && !isVerticalWritingMode()) return -offsetLeft; 
            return offsetLeft;
        }

        function clearDebugOverlays() {
            _.each($debugOverlays, function($el){
                $el.remove();
            });
            $debugOverlays.clear();
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
            }
        };

        //
   // }

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

    this.mediaOverlaysAutomaticPageTurn = false;

    /**
     *
     * @property mediaOverlaysMuteAudio
     * @type bool
     */

    this.mediaOverlaysMuteAudio = false;

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

    function booleanMapper(value) {
        if (value === "0" || value.toLowerCase() === "false" || value.toLowerCase() === "no") {
            return false;
        } else if (value === "1" || value.toLowerCase() == "true" || value.toLowerCase === "yes") {
            return true;
        }
        return undefined;
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
        mapProperty("mediaOverlaysPreservePlaybackWhenScroll", settingsData, booleanMapper);
        mapProperty("mediaOverlaysSkipSkippables", settingsData, booleanMapper);
        mapProperty("mediaOverlaysEscapeEscapables", settingsData, booleanMapper);
        mapProperty("mediaOverlaysSkippables", settingsData, buildArray);
        mapProperty("mediaOverlaysEscapables", settingsData, buildArray);
        mapProperty("mediaOverlaysEnableClick", settingsData, booleanMapper);
        mapProperty("mediaOverlaysRate", settingsData);
        mapProperty("mediaOverlaysVolume", settingsData);
        mapProperty("mediaOverlaysSynchronizationGranularity", settingsData);
        mapProperty("mediaOverlaysAutomaticPageTurn", settingsData, booleanMapper);
        mapProperty("mediaOverlaysMuteAudio", settingsData, booleanMapper);
        mapProperty("scroll", settingsData);
        mapProperty("syntheticSpread", settingsData);
        mapProperty("pageTransition", settingsData);
        mapProperty("enableGPUHardwareAccelerationCSS3D", settingsData, booleanMapper);
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
;
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
            }

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
            element.resizeSensor.className = 'resize-sensor';
            var style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
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

            if (element.resizeSensor.offsetParent !== element) {
                element.style.position = 'relative';
            }

            var expand = element.resizeSensor.childNodes[0];
            var expandChild = expand.childNodes[0];
            var shrink = element.resizeSensor.childNodes[1];
            var dirty, rafId, newWidth, newHeight;
            var lastWidth = element.offsetWidth;
            var lastHeight = element.offsetHeight;

            var reset = function() {
                expandChild.style.width = '100000px';
                expandChild.style.height = '100000px';

                expand.scrollLeft = 100000;
                expand.scrollTop = 100000;

                shrink.scrollLeft = 100000;
                shrink.scrollTop = 100000;
            };

            reset();

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
                newWidth = element.offsetWidth;
                newHeight = element.offsetHeight;
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
        }

        forEachElement(element, function(elem){
            attachResizeEvent(elem, callback);
        });

        this.detach = function(ev) {
            ResizeSensor.detach(element, ev);
        };
    };

    ResizeSensor.detach = function(element, ev) {
        forEachElement(element, function(elem){
            if (!elem) return
            if(elem.resizedAttached && typeof ev == "function"){
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
        if (!_$el) {
            console.warn("_$el is undefined!");

            return;
        }

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
        var pairs = [];

        if (content.includes(',')) {
            pairs = content.replace(/\s/g, '').split(',');
        } else {
            pairs = content.trim().split(' ');
        }
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
        return {
            width: _$el.parent()[0].clientWidth,
            height: _$el.parent()[0].clientHeight
        };
    }
    
    this.getNavigator = function () {
        return new CfiNavigationLogic({
            $iframe: _$iframe,
            frameDimensions: getFrameDimensions,
            visibleContentOffsets: getVisibleContentOffsets,
            classBlacklist: ["cfi-marker", "mo-cfi-highlight", "resize-sensor", "resize-sensor-expand", "resize-sensor-shrink", "resize-sensor-inner"],
            elementBlacklist: [],
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

    function createBookmarkFromCfi(cfi){
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
    };

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

        if(views.length > 0) {

            return views[0].getFirstVisibleCfi();
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

define('readium_shared_js/views/iframe_loader',["jquery", "underscore"], function($, _) {
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

define('readium_shared_js/views/internal_links_support',['jquery', '../helpers', 'readium_cfi_js'], function($, Helpers, epubCfi) {
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
        if (!this.currentPar) {
            console.debug("Par iterator is out of range");

            return;
        }
        if (findParNode(this.currentPar.index + 1, this.currentPar.parent, false)) {
            return false;
        }
        return true;
    }

    this.isFirst = function() {
        if (!this.currentPar) {
            console.debug("Par iterator is out of range");

            return;
        }
        if (findParNode(this.currentPar.index - 1, this.currentPar.parent, true)) {
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

    this.attachMediaOverlayData = function ($iframe, spineItem, mediaOverlaySettings, tapEmitter) {
        var contentDocElement = $iframe[0].contentDocument.documentElement;
        var $body = $("body", contentDocElement);

        if (!spineItem.media_overlay_id && mediaOverlay.smil_models.length === 0) {
            if ($body.length > 0) {
                Helpers.addTapEventHandler($body[0], tapEmitter);
            }
            return;
        }
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

                var tapMOEventHandler = function(event) {
                    //console.debug("MO TOUCH-END");

                    var elem = $(this)[0]; // body

                    elem = event.target; // body descendant
                    if (!elem)
                    {
                        mediaOverlayPlayer.touchInit();
                        if (tapEmitter) {
                            tapEmitter();
                        }
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
                            if (tapEmitter) {
                                tapEmitter();
                            }
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
                            if (tapEmitter) {
                                tapEmitter();
                            }
                            return true;
                        }
                        //console.debug("MO CLICKED: isPlaying()" + mediaOverlayPlayer.isPlaying());
                        if (mediaOverlayPlayer.isPlaying())
                        {
                            mediaOverlayPlayer.pause();
                        }
                        else
                        {
                            mediaOverlayPlayer.playUserPar(par);
                        }
                        return true;
                    }
                    else
                    {
                        var readaloud = Helpers.findReadAloud(elem, "ibooks:readaloud");
                        var readaloudPause = Helpers.findReadAloud(elem, "data-ibooks-pause-readaloud");

                        if (!readaloud) {
                            readaloud = Helpers.findReadAloud(elem, "epub:readaloud");
                        }
                        if (readaloud) {
                            //console.debug("MO readaloud attr: " + readaloud);
                            var isPlaying = mediaOverlayPlayer.isPlaying();
                            var audioSrc = $(readaloud.node).attr("data-ibooks-audio-src");
                            var needToReset = $(readaloud.node).attr("data-ibooks-audio-reset-on-play");

                            if (!audioSrc) {
                                audioSrc = $(readaloudPause.node).attr("data-ibooks-audio-src");
                            }
                            if (!needToReset) {
                                needToReset = $(readaloudPause.node).attr("data-ibooks-audio-reset-on-play");
                            }
                            if ((readaloud.attr === "start" && !isPlaying) ||
                                    (readaloud.attr === "stop" && isPlaying) ||
                                    (readaloud.attr === "startstop") ||
                                    (readaloudPause.attr === "true")) {
                                if (audioSrc) {
                                    mediaOverlayPlayer.toggleiBooksAudioPlayer(audioSrc, 0, (needToReset && needToReset === "true"));
                                } else {
                                    mediaOverlayPlayer.toggleMediaOverlay();
                                }
                                return true;
                            }
                        }
                    }
                    mediaOverlayPlayer.touchInit();
                    if (tapEmitter) {
                        tapEmitter();
                    }
                    return true;
                };
                Helpers.addTapEventHandler($body[0], tapMOEventHandler);
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

                if (!same) {
                    textRelativeRef = spineItem.href;
                    iter.currentPar.text.srcFile = spineItem.href;
                    iter.currentPar.text.src = spineItem.href;
                    iter.currentPar.text.srcFragmentId = "";
                    same = true;
                }
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
                            var dummyElement = document.createElement('div');

                            console.warn("Attach dummy media overlay to body...");
                            dummyElement.style.cssText = 'width: 0px; height: 0px;';
                            dummyElement.className = "dummyMediaOverlayElement";
                            $body.append(dummyElement);
                            $element = $(dummyElement);
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
                    } else {
                        var dummyElement = document.createElement('div');

                        console.warn("!! CANNOT FIND ELEMENT: " + iter.currentPar.text.srcFragmentId + " == " +
                                iter.currentPar.text.srcFile + " /// " + spineItem.href);
                        dummyElement.style.cssText = 'width: 0px; height: 0px;';
                        dummyElement.className = "dummyMediaOverlayElement";
                        $(dummyElement).data("mediaOverlayData", { par: iter.currentPar });
                        $body.append(dummyElement);
                    }
                } else {
                    console.warn("[INFO] " + spineItem.href + " != " + textRelativeRef + " # " + iter.currentPar.text.srcFragmentId);
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
        const kPauseDelayThreshold = 1.5;   // 1.5 second
        const kAudioTimerInterval = 20;     // 20 milliseconds
        var _iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;
        var _Android = navigator.userAgent.toLowerCase().indexOf('android') > -1;
        var _isMobile = _iOS || _Android;

        //var _isReadiumJS = typeof window.requirejs !== "undefined";

        var DEBUG = false;

        var _audioElement = new Audio();
        var _fakeAudioTimer = undefined;
        var _fakeAudioPosition = 0;
        
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
                    console.debug("3) loadedmetadata: duration = " + _audioElement.duration);
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
    
            if (_fakeAudioTimer) {
                console.log("_fakeAudioTimer is running. DO NOTHING...");
                return;
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
            stopFakeTimer();
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
                }, kAudioTimerInterval);
        }
    
        function stopTimer()
        {
            if (_intervalTimer)
            {
                clearInterval(_intervalTimer);
            }
            _intervalTimer = undefined;
        }

        function stopFakeTimer() {
            if (_fakeAudioTimer) {
                clearInterval(_fakeAudioTimer);
            }
            _fakeAudioTimer = undefined;
        }
    
        this.isPlaying = function()
        {
            return _intervalTimer !== undefined || _fakeAudioTimer !== undefined;
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

        this.playFakeAudio = function() {
            this.playFakeAudio(_fakeAudioPosition);
        };

        this.playFakeAudio = function(clipBegin) {
            stopFakeTimer();
            _fakeAudioPosition = clipBegin;
            _fakeAudioTimer = setInterval(function() {
                _fakeAudioPosition += (kAudioTimerInterval / 1000);

                onPositionChanged(_fakeAudioPosition, 1);
            }, kAudioTimerInterval);
            onStatusChanged({isPlaying: true});
            onAudioPlay();
        };

        this.playFile = function(smilSrc, epubSrc, seekBegin) //element
        {
            stopFakeTimer();
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
                }, kAudioTimerInterval);
                
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
                if (Math.abs(seekBegin - _audioElement.currentTime) >= kPauseDelayThreshold)
                {
                    this.pause();
                }
    
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

            if(Math.abs(newCurrentTime - _audioElement.currentTime) < kPauseDelayThreshold)
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
        var _seekedEvent1 = "seeked";
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
    const EPUB3_MO_ACTIVE_CLASS = "media-overlay-active";
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

    function getActiveClassFromHead($head, activeClassName) {
        var styles = $head.find('style');

        if (styles) {
            for (var i = 0; i < styles.length; i++) {
                var cssRules = styles[i].sheet.cssRules;

                if (cssRules) {
                    for (var j = 0; j < cssRules.length; j++) {
                        var cssSelector = cssRules[j].selectorText;
                        var cssStyle = cssRules[j].style;

                        if (cssSelector && cssSelector.includes(activeClassName) &&
                                cssStyle.cssText && cssStyle.cssText.length > 0) {
                            if (cssSelector.charAt(0) === '.') {
                                return cssSelector.slice(1);
                            }
                            return cssSelector;
                        }
                    }
                }
            }
        }
        return undefined;
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
        var fallbackUserStyle = "color: #3366ff !important; fill: #3366ff !important; opacity: 1;";
        var appendUserStyle = true;

        $head = $("head", $element[0].ownerDocument.documentElement);
        $userStyle = $("<style type='text/css'> </style>");

        if (hasAuthorStyle) {
            var activeClass = getActiveClassFromHead($head, _activeClass);

            if (activeClass) {
                appendUserStyle = false;
            }
            if (appendUserStyle) {
                $userStyle.append("." + _activeClass + " {" + fallbackUserStyle);
                appendUserStyle = false;
            }
        }
        if (appendUserStyle) {
            $userStyle.append("." + DEFAULT_MO_ACTIVE_CLASS + " {");
        }

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
        if (appendUserStyle) {
            $userStyle.append("}");
        }
        
        
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

        if (!hasAuthorStyle) {
            $head = $("head", $hel[0].ownerDocument.documentElement);
            _activeClass = getActiveClassFromHead($head, EPUB3_MO_ACTIVE_CLASS);
            hasAuthorStyle = _activeClass && _activeClass !== "";
        }
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

        if (!hasAuthorStyle) {
            $head = $("head", $hel[0].ownerDocument.documentElement);
            _activeClass = getActiveClassFromHead($head, EPUB3_MO_ACTIVE_CLASS);
            hasAuthorStyle = _activeClass && _activeClass !== "";
        }
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
        var pageViewTopOffset = selectedPageView.element().position().top;
        var visibleContentOffsets, frameDimensions;
        
        var setupFunctions = [
            function () {
                visibleContentOffsets = {
                    top: pageViewTopOffset,
                    left: 0
                };
            },
            function() {
                var height = selectedPageView.element().height();
                
                if (pageViewTopOffset >= 0) {
                    height = viewHeight() - pageViewTopOffset;
                }

                frameDimensions = {
                    width: selectedPageView.element().width(),
                    height: height
                };
                
                visibleContentOffsets = {
                    top: 0,
                    left: 0
                };
            }
        ];
        
        //invoke setup function
        pickerFunc(setupFunctions)();
        
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

    this.getRangeCfiFromDomRange = function (domRange) {
        return callOnVisiblePageView(function (pageView) {
            return pageView.getRangeCfiFromDomRange(domRange);
        });
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint) {
        return callOnVisiblePageView(function (pageView) {
            return createBookmark(pageView.currentSpineItem(), pageView.getVisibleCfiFromPoint(x, y, precisePoint));
        });
    };

    this.getRangeCfiFromPoints = function (startX, startY, endX, endY) {
        return callOnVisiblePageView(function (pageView) {
            return createBookmark(pageView.currentSpineItem(), pageView.getRangeCfiFromPoints(startX, startY, endX, endY));
        });
    };

    this.getCfiForElement = function(element) {
        return callOnVisiblePageView(function (pageView) {
            return createBookmark(pageView.currentSpineItem(), pageView.getCfiForElement(element));
        });
    };

    this.getElementFromPoint = function (x, y) {
        return callOnVisiblePageView(function (pageView) {
            return pageView.getElementFromPoint(x, y);
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

    var _iBooksAudioPlayer = new AudioPlayer(oniBooksAudioStatusChanged, oniBooksAudioPostionChanged, oniBooksAudioEnded, oniBoosAudioPlay, oniBoosAudioPause);
    var _currentiBooksAudioSource = undefined;

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
        if (_settings.mediaOverlaysMuteAudio) {
            self.reset();
        }
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
            if (_settings.mediaOverlaysMuteAudio) {
                _audioPlayer.playFakeAudio(startTime)
            } else {
                if (dur <= 0) {
                    _audioPlayer.playFakeAudio(startTime)
                } else {
                    _audioPlayer.playFile(_smilIterator.currentPar.audio.src, audioSource, startTime); //_smilIterator.currentPar.element ? _smilIterator.currentPar.element : _smilIterator.currentPar.cfi.cfiTextParent
                }
            }
        }

        clipBeginOffset = 0.0;

        highlightCurrentElement();
    }

    function nextSmil(goNext)
    {
        self.pause();

//console.debug("current Smil: " + _smilIterator.smil.href + " /// " + _smilIterator.smil.id);
        var lastSmil = _smilIterator.smil;
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
                var needToOpenContentUrl = true;
                var paginationInfo = reader.getPaginationInfo();

                if (paginationInfo.openPages.length > 0) {
                    for (var i = 0; i < paginationInfo.openPages.length; i++) {
                        if (!_smilIterator.currentPar.text.manifestItemId ||
                            _smilIterator.currentPar.text.manifestItemId === paginationInfo.openPages[i].idref) {
                            needToOpenContentUrl = false;
                            break;
                        }
                    }
                    if (paginationInfo.openPages.length > 1) {
                        var completeRightPage = paginationInfo.openPages[1].idref === lastSmil.spineItemId;

                        if (!completeRightPage && needToOpenContentUrl) {
                            needToOpenContentUrl = false;
                        }
                    }
                }
                if (needToOpenContentUrl) {
                    //console.debug("nextSmil: openContentUrl: " + _smilIterator.currentPar.text.src + " -- " + _smilIterator.smil.href);
                    reader.openContentUrl(_smilIterator.currentPar.text.src, _smilIterator.smil.href, self);
                } else {
                    if (_smilIterator.currentPar.text.manifestItemId !== nextSmil.spineItemId) {
                        console.warn("Current Par text.manifestItemId mismatched! Recover to " + nextSmil.spineItemId);
                        _smilIterator.currentPar.text.manifestItemId = nextSmil.spineItemId;
                    }
                    playCurrentPar();
                }
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
        position > DIRECTION_MARK) {
            const clipOffset = 3;

            if (audio.clipBegin == audio.clipEnd && position <= audio.clipEnd + 3) {
                console.warn("Invalid duration, Add " + clipOffset + " seconds to the clipEnd...");
            }
            if ((audio.clipBegin == audio.clipEnd && position <= audio.clipEnd + clipOffset) || position <= audio.clipEnd) {
                //console.debug("onAudioPositionChanged: " + position);
                return;
            }
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
        var emitComplete = !doNotNextSmil;

        var spineItemIdRef = (_smilIterator && _smilIterator.smil && _smilIterator.smil.spineItemId) ? _smilIterator.smil.spineItemId : ((_lastPaginationData && _lastPaginationData.spineItem && _lastPaginationData.spineItem.idref) ? _lastPaginationData.spineItem.idref : undefined);
        if (spineItemIdRef && _lastPaginationData && _lastPaginationData.paginationInfo && _lastPaginationData.paginationInfo.openPages && _lastPaginationData.paginationInfo.openPages.length > 1)
        {
            //var iPage = _lastPaginationData.paginationInfo.isRightToLeft ? _lastPaginationData.paginationInfo.openPages.length - 1 : 0;
            var iPage = 0;
            
            var openPage = _lastPaginationData.paginationInfo.openPages[iPage];
            if (spineItemIdRef === openPage.idref)
            {
                if (doNotNextSmil) {
                    doNotNextSmil = false;
                }
                if (_autoNextSmil) {
                    emitComplete = false;
                }
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
                reader.emit(Globals.Events.MEDIA_OVERLAY_COMPLETE_CURRENT_PAGE);
            }
            else
            {
                if (!emitComplete) {
                    nextSmil(goNext);
                } else {
                    reader.emit(Globals.Events.MEDIA_OVERLAY_COMPLETE_CURRENT_PAGE);
                }
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
                                reader.emit(Globals.Events.MEDIA_OVERLAY_COMPLETE_CURRENT_PAGE);
                            }
                            else
                            {
                                if (!emitComplete) {
                                    nextSmil(goNext);
                                } else {
                                    reader.emit(Globals.Events.MEDIA_OVERLAY_COMPLETE_CURRENT_PAGE);
                                }
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
        var todo = _audioPlayer.touchInit();
        if (todo)
        {
            if (_enableHTMLSpeech)
            {
                speakStart("o", 0);
            }
        }
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
        var openPages = reader.getPaginationInfo().openPages;
        var needReload = true;

        for (var i = 0; i < openPages.length; i++) {
            if (openPages[i].idref === _smilIterator.currentPar.text.manifestItemId) {
                needReload = false;
                break;
            }
        }
        //self.pause();
        //self.reset();
        if (_smilIterator.currentPar.element) {
            _smilIterator = undefined;
        }
        if (needReload) {
            reader.openContentUrl(src, base, self);
        }
    }

    // iBooksAudioPlayer
    function oniBooksAudioStatusChanged(status) {
        //console.debug("oniBooksAudioStatusChanged: " + status);
    }

    function oniBooksAudioPostionChanged(position, from, skipping) {
        //console.debug("oniBooksAudioPositionChanged position: " + position + ", from: " + from + ", skipping = " + skipping);
    }

    function oniBooksAudioEnded() {
        //console.debug("oniBooksAudioEnded");
        _currentiBooksAudioSource = undefined;
    }

    function oniBoosAudioPlay() {
        //console.debug("oniBooksAudioPlay");
    }

    function oniBoosAudioPause() {
        //console.debug("oniBooksAudioPause");
    }

    this.iBooksAudioPlayerPlaying = function() {
        return _iBooksAudioPlayer.isPlaying();
    };

    this.pauseiBooksAudioPlayer = function() {
        _iBooksAudioPlayer.pause();
    };

    this.playiBooksAudioPlayer = function(src, startTime) {
        if (self.isPlaying()) {
            self.pause();
        }
        if (src !== _currentiBooksAudioSource) {
            _currentiBooksAudioSource = src;
            _iBooksAudioPlayer.playFile(undefined, src, startTime)
        } else {
            _iBooksAudioPlayer.play();
        }
    };

    this.toggleiBooksAudioPlayer = function(src, startTime, needReset) {
        if (self.isPlaying()) {
            self.pause();
        }
        if (needReset) {
            _currentiBooksAudioSource = undefined;
        }
        if (src && src !== _currentiBooksAudioSource) {
            self.playiBooksAudioPlayer(src, startTime);
            return;
        }
        if (self.iBooksAudioPlayerPlaying()) {
            self.pauseiBooksAudioPlayer();
        } else {
            if (!src || startTime < 0) {
                console.error("toggleiBooksAudioPlayer: Invalid argument! src: " + src + ", startTime = " + startTime);
                return;
            }
            self.playiBooksAudioPlayer(src, startTime);
        }
    };

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
        if (self.iBooksAudioPlayerPlaying()) {
            self.pauseiBooksAudioPlayer();
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
        _iBooksAudioPlayer.reset();
        _currentiBooksAudioSource = undefined;
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
                console.log("Audio player was dead...");
                /*
                this.reset();
                this.toggleMediaOverlay();
                */
                return;
            }
        }

        highlightCurrentElement();
    }

    this.pause = function()
    {
        _wasPlayingScrolling = false;
        if (self.iBooksAudioPlayerPlaying()) {
            self.pauseiBooksAudioPlayer();
        }
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
            if (_settings.mediaOverlaysMuteAudio) {
                _audioPlayer.playFakeAudio();
            } else {
                self.play();
            }
            return;
        }

        this.toggleMediaOverlayRefresh(undefined);
    };

    this.playMediaOverlay = function() {
        if (self.isPlaying()) {
            return;
        }
        // if we have position to continue from (reset wasn't called)
        if(_smilIterator) {
            if (_settings.mediaOverlaysMuteAudio) {
                _audioPlayer.playFakeAudio();
            } else {
                self.play();
            }
            return;
        }
        this.toggleMediaOverlayRefresh(undefined);
    };


    var _wasPlayingScrolling = false;

    this.toggleMediaOverlayRefresh = function(paginationData)
    {
//console.debug("moData SMIL: " + moData.par.getSmil().href + " // " + + moData.par.getSmil().id);
        if (self.iBooksAudioPlayerPlaying()) {
            self.pauseiBooksAudioPlayer();
        }
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
        var doNotResetSmli = false;

        if (!_smilIterator || _smilIterator.smil != parSmil) {
            _smilIterator = new SmilIterator(parSmil);
        } else {
            if (playingPar.text.manifestItemId === _smilIterator.currentPar.text.manifestItemId) {
                doNotResetSmli = true;
            } else {
                _smilIterator.reset();
            }
        }
        if (doNotResetSmli) {
            self.play();

            return;
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
        while (!_smilIterator.isFirst()) {
            _smilIterator.previous();
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

    this.wasPausedBecauseNoAutoNextSmil = function() {
        return _wasPausedBecauseNoAutoNextSmil;
    }
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
        
        var href1 = new URI(self.package.resolveRelativeUrl(href)).normalizePathname().pathname();
        
        var length = self.items.length;

        for(var i = 0; i < length; i++) {
            
            var href2 = new URI(self.package.resolveRelativeUrl(self.items[i].href)).normalizePathname().pathname();
            
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
            if (node.clipEnd < node.clipBegin)
            {
                if (smilModel.mo.DEBUG)
                {
                    console.log(getIndent() + "JS MO clipEnd adjusted to clipBegin + 0.1");
                }
                node.clipEnd = node.clipBegin + 0.1;
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
 * @param {Models.Package} package EPUB package
*/

var MediaOverlay = function(package) {

    /**
     * The parent package object
     *
     * @property package
     * @type Models.Package
     */    
    this.package = package;

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
 * @param {Models.Package} package EPUB package object
 * @return {Models.MediaOverlay}
*/

MediaOverlay.fromDTO = function(moDTO, pack) {

    var mo = new MediaOverlay(pack);

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

    var _cfiClassBlacklist = ["cfi-marker", "mo-cfi-highlight", "resize-sensor", "resize-sensor-expand", "resize-sensor-shrink", "resize-sensor-inner"];
    var _cfiElementBlacklist = [];
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
            frameDimensions: getFrameDimensions,
            paginationInfo: _paginationInfo,
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

    this.openPageInternal = function(pageRequest) {

        if(_isWaitingFrameRender) {
            _deferredPageRequest = pageRequest;
            return;
        }

        // if no spine item specified we are talking about current spine item
        if(pageRequest.spineItem && pageRequest.spineItem != _currentSpineItem) {
            _deferredPageRequest = pageRequest;
            loadSpineItem(pageRequest.spineItem);
            return;
        }

        var pageIndex = undefined;


        if(pageRequest.spineItemPageIndex !== undefined) {
            pageIndex = pageRequest.spineItemPageIndex;
        }
        else if(pageRequest.elementId) {
            pageIndex = _navigationLogic.getPageForElementId(pageRequest.elementId);
            
            if (pageIndex < 0) pageIndex = 0;
        }
        else if(pageRequest.firstVisibleCfi && pageRequest.lastVisibleCfi) {
            var firstPageIndex;
            var lastPageIndex;
            try
            {
                firstPageIndex = _navigationLogic.getPageForElementCfi(pageRequest.firstVisibleCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
                
                if (firstPageIndex < 0) firstPageIndex = 0;
            }
            catch (e)
            {
                firstPageIndex = 0;
                console.error(e);
            }
            try
            {
                lastPageIndex = _navigationLogic.getPageForElementCfi(pageRequest.lastVisibleCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
                
                if (lastPageIndex < 0) lastPageIndex = 0;
            }
            catch (e)
            {
                lastPageIndex = 0;
                console.error(e);
            }
            // Go to the page in the middle of the two elements
            pageIndex = Math.round((firstPageIndex + lastPageIndex) / 2);
        }
        else if(pageRequest.elementCfi) {
            try
            {
                pageIndex = _navigationLogic.getPageForElementCfi(pageRequest.elementCfi,
                    _cfiClassBlacklist,
                    _cfiElementBlacklist,
                    _cfiIdBlacklist);
                
                if (pageIndex < 0) pageIndex = 0;
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

        if(pageIndex >= 0 && pageIndex < _paginationInfo.columnCount) {
            _paginationInfo.currentSpreadIndex = Math.floor(pageIndex / _paginationInfo.visibleColumnCount) ;
            onPaginationChanged(pageRequest.initiator, pageRequest.spineItem, pageRequest.elementId);
        }
        else {
            console.log('Illegal pageIndex value: ', pageIndex, 'column count is ', _paginationInfo.columnCount);
        }
    };

    this.openPage = function(pageRequest) {
        // Go to request page, it will save the new position in onPaginationChanged
        this.openPageInternal(pageRequest);
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
            this.openPageInternal(_lastPageRequest);            
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
            onPaginationChanged(initiator);
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
            onPaginationChanged(initiator);
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
                self.restoreCurrentPosition();
            } else {
                onPaginationChanged(self); // => redraw() => showBook(), so the trick below is not needed                
            }

            //onPaginationChanged(self); // => redraw() => showBook(), so the trick below is not needed 

            // //We do this to force re-rendering of the document in the iframe.
            // //There is a bug in WebView control with right to left columns layout - after resizing the window html document
            // //is shifted in side the containing div. Hiding and showing the html element puts document in place.
            // _$epubHtml.hide();
            // setTimeout(function() {
            //     _$epubHtml.show();
            //     onPaginationChanged(self); // => redraw() => showBook()
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

        var page = _navigationLogic.getPageForElement($element);

        if(page == -1)
        {
            return;
        }

        var openPageRequest = new PageOpenRequest(_currentSpineItem, initiator);
        openPageRequest.setPageIndex(page);

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
/*
  html2canvas 0.5.1 <http://html2canvas.hertzen.com>
  Copyright (c) 2016 Niklas von Hertzen

  Released under  License
*/

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('html2canvas',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.html2canvas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.0 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(_dereq_,module,exports){
var log = _dereq_('./log');

function restoreOwnerScroll(ownerDocument, x, y) {
    if (ownerDocument.defaultView && (x !== ownerDocument.defaultView.pageXOffset || y !== ownerDocument.defaultView.pageYOffset)) {
        ownerDocument.defaultView.scrollTo(x, y);
    }
}

function cloneCanvasContents(canvas, clonedCanvas) {
    try {
        if (clonedCanvas) {
            clonedCanvas.width = canvas.width;
            clonedCanvas.height = canvas.height;
            clonedCanvas.getContext("2d").putImageData(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height), 0, 0);
        }
    } catch(e) {
        log("Unable to copy canvas content from", canvas, e);
    }
}

function cloneNode(node, javascriptEnabled) {
    var clone = node.nodeType === 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);

    var child = node.firstChild;
    while(child) {
        if (javascriptEnabled === true || child.nodeType !== 1 || child.nodeName !== 'SCRIPT') {
            clone.appendChild(cloneNode(child, javascriptEnabled));
        }
        child = child.nextSibling;
    }

    if (node.nodeType === 1) {
        clone._scrollTop = node.scrollTop;
        clone._scrollLeft = node.scrollLeft;
        if (node.nodeName === "CANVAS") {
            cloneCanvasContents(node, clone);
        } else if (node.nodeName === "TEXTAREA" || node.nodeName === "SELECT") {
            clone.value = node.value;
        }
    }

    return clone;
}

function initNode(node) {
    if (node.nodeType === 1) {
        node.scrollTop = node._scrollTop;
        node.scrollLeft = node._scrollLeft;

        var child = node.firstChild;
        while(child) {
            initNode(child);
            child = child.nextSibling;
        }
    }
}

module.exports = function(ownerDocument, containerDocument, width, height, options, x ,y) {
    var documentElement = cloneNode(ownerDocument.documentElement, options.javascriptEnabled);
    var container = containerDocument.createElement("iframe");

    container.className = "html2canvas-container";
    container.style.visibility = "hidden";
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0px";
    container.style.border = "0";
    container.width = width;
    container.height = height;
    container.scrolling = "no"; // ios won't scroll without it
    containerDocument.body.appendChild(container);

    return new Promise(function(resolve) {
        var documentClone = container.contentWindow.document;

        /* Chrome doesn't detect relative background-images assigned in inline <style> sheets when fetched through getComputedStyle
         if window url is about:blank, we can assign the url to current by writing onto the document
         */
        container.contentWindow.onload = container.onload = function() {
            var interval = setInterval(function() {
                if (documentClone.body.childNodes.length > 0) {
                    initNode(documentClone.documentElement);
                    clearInterval(interval);
                    if (options.type === "view") {
                        container.contentWindow.scrollTo(x, y);
                        if ((/(iPad|iPhone|iPod)/g).test(navigator.userAgent) && (container.contentWindow.scrollY !== y || container.contentWindow.scrollX !== x)) {
                            documentClone.documentElement.style.top = (-y) + "px";
                            documentClone.documentElement.style.left = (-x) + "px";
                            documentClone.documentElement.style.position = 'absolute';
                        }
                    }
                    resolve(container);
                }
            }, 50);
        };

        documentClone.open();
        documentClone.write("<!DOCTYPE html><html></html>");
        // Chrome scrolls the parent document for some reason after the write to the cloned window???
        restoreOwnerScroll(ownerDocument, x, y);
        documentClone.replaceChild(documentClone.adoptNode(documentElement), documentClone.documentElement);
        documentClone.close();
    });
};

},{"./log":13}],3:[function(_dereq_,module,exports){
// http://dev.w3.org/csswg/css-color/

function Color(value) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = null;
    var result = this.fromArray(value) ||
        this.namedColor(value) ||
        this.rgb(value) ||
        this.rgba(value) ||
        this.hex6(value) ||
        this.hex3(value);
}

Color.prototype.darken = function(amount) {
    var a = 1 - amount;
    return  new Color([
        Math.round(this.r * a),
        Math.round(this.g * a),
        Math.round(this.b * a),
        this.a
    ]);
};

Color.prototype.isTransparent = function() {
    return this.a === 0;
};

Color.prototype.isBlack = function() {
    return this.r === 0 && this.g === 0 && this.b === 0;
};

Color.prototype.fromArray = function(array) {
    if (Array.isArray(array)) {
        this.r = Math.min(array[0], 255);
        this.g = Math.min(array[1], 255);
        this.b = Math.min(array[2], 255);
        if (array.length > 3) {
            this.a = array[3];
        }
    }

    return (Array.isArray(array));
};

var _hex3 = /^#([a-f0-9]{3})$/i;

Color.prototype.hex3 = function(value) {
    var match = null;
    if ((match = value.match(_hex3)) !== null) {
        this.r = parseInt(match[1][0] + match[1][0], 16);
        this.g = parseInt(match[1][1] + match[1][1], 16);
        this.b = parseInt(match[1][2] + match[1][2], 16);
    }
    return match !== null;
};

var _hex6 = /^#([a-f0-9]{6})$/i;

Color.prototype.hex6 = function(value) {
    var match = null;
    if ((match = value.match(_hex6)) !== null) {
        this.r = parseInt(match[1].substring(0, 2), 16);
        this.g = parseInt(match[1].substring(2, 4), 16);
        this.b = parseInt(match[1].substring(4, 6), 16);
    }
    return match !== null;
};


var _rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

Color.prototype.rgb = function(value) {
    var match = null;
    if ((match = value.match(_rgb)) !== null) {
        this.r = Number(match[1]);
        this.g = Number(match[2]);
        this.b = Number(match[3]);
    }
    return match !== null;
};

var _rgba = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d?\.?\d+)\s*\)$/;

Color.prototype.rgba = function(value) {
    var match = null;
    if ((match = value.match(_rgba)) !== null) {
        this.r = Number(match[1]);
        this.g = Number(match[2]);
        this.b = Number(match[3]);
        this.a = Number(match[4]);
    }
    return match !== null;
};

Color.prototype.toString = function() {
    return this.a !== null && this.a !== 1 ?
    "rgba(" + [this.r, this.g, this.b, this.a].join(",") + ")" :
    "rgb(" + [this.r, this.g, this.b].join(",") + ")";
};

Color.prototype.namedColor = function(value) {
    value = value.toLowerCase();
    var color = colors[value];
    if (color) {
        this.r = color[0];
        this.g = color[1];
        this.b = color[2];
    } else if (value === "transparent") {
        this.r = this.g = this.b = this.a = 0;
        return true;
    }

    return !!color;
};

Color.prototype.isColor = true;

// JSON.stringify([].slice.call($$('.named-color-table tr'), 1).map(function(row) { return [row.childNodes[3].textContent, row.childNodes[5].textContent.trim().split(",").map(Number)] }).reduce(function(data, row) {data[row[0]] = row[1]; return data}, {}))
var colors = {
    "aliceblue": [240, 248, 255],
    "antiquewhite": [250, 235, 215],
    "aqua": [0, 255, 255],
    "aquamarine": [127, 255, 212],
    "azure": [240, 255, 255],
    "beige": [245, 245, 220],
    "bisque": [255, 228, 196],
    "black": [0, 0, 0],
    "blanchedalmond": [255, 235, 205],
    "blue": [0, 0, 255],
    "blueviolet": [138, 43, 226],
    "brown": [165, 42, 42],
    "burlywood": [222, 184, 135],
    "cadetblue": [95, 158, 160],
    "chartreuse": [127, 255, 0],
    "chocolate": [210, 105, 30],
    "coral": [255, 127, 80],
    "cornflowerblue": [100, 149, 237],
    "cornsilk": [255, 248, 220],
    "crimson": [220, 20, 60],
    "cyan": [0, 255, 255],
    "darkblue": [0, 0, 139],
    "darkcyan": [0, 139, 139],
    "darkgoldenrod": [184, 134, 11],
    "darkgray": [169, 169, 169],
    "darkgreen": [0, 100, 0],
    "darkgrey": [169, 169, 169],
    "darkkhaki": [189, 183, 107],
    "darkmagenta": [139, 0, 139],
    "darkolivegreen": [85, 107, 47],
    "darkorange": [255, 140, 0],
    "darkorchid": [153, 50, 204],
    "darkred": [139, 0, 0],
    "darksalmon": [233, 150, 122],
    "darkseagreen": [143, 188, 143],
    "darkslateblue": [72, 61, 139],
    "darkslategray": [47, 79, 79],
    "darkslategrey": [47, 79, 79],
    "darkturquoise": [0, 206, 209],
    "darkviolet": [148, 0, 211],
    "deeppink": [255, 20, 147],
    "deepskyblue": [0, 191, 255],
    "dimgray": [105, 105, 105],
    "dimgrey": [105, 105, 105],
    "dodgerblue": [30, 144, 255],
    "firebrick": [178, 34, 34],
    "floralwhite": [255, 250, 240],
    "forestgreen": [34, 139, 34],
    "fuchsia": [255, 0, 255],
    "gainsboro": [220, 220, 220],
    "ghostwhite": [248, 248, 255],
    "gold": [255, 215, 0],
    "goldenrod": [218, 165, 32],
    "gray": [128, 128, 128],
    "green": [0, 128, 0],
    "greenyellow": [173, 255, 47],
    "grey": [128, 128, 128],
    "honeydew": [240, 255, 240],
    "hotpink": [255, 105, 180],
    "indianred": [205, 92, 92],
    "indigo": [75, 0, 130],
    "ivory": [255, 255, 240],
    "khaki": [240, 230, 140],
    "lavender": [230, 230, 250],
    "lavenderblush": [255, 240, 245],
    "lawngreen": [124, 252, 0],
    "lemonchiffon": [255, 250, 205],
    "lightblue": [173, 216, 230],
    "lightcoral": [240, 128, 128],
    "lightcyan": [224, 255, 255],
    "lightgoldenrodyellow": [250, 250, 210],
    "lightgray": [211, 211, 211],
    "lightgreen": [144, 238, 144],
    "lightgrey": [211, 211, 211],
    "lightpink": [255, 182, 193],
    "lightsalmon": [255, 160, 122],
    "lightseagreen": [32, 178, 170],
    "lightskyblue": [135, 206, 250],
    "lightslategray": [119, 136, 153],
    "lightslategrey": [119, 136, 153],
    "lightsteelblue": [176, 196, 222],
    "lightyellow": [255, 255, 224],
    "lime": [0, 255, 0],
    "limegreen": [50, 205, 50],
    "linen": [250, 240, 230],
    "magenta": [255, 0, 255],
    "maroon": [128, 0, 0],
    "mediumaquamarine": [102, 205, 170],
    "mediumblue": [0, 0, 205],
    "mediumorchid": [186, 85, 211],
    "mediumpurple": [147, 112, 219],
    "mediumseagreen": [60, 179, 113],
    "mediumslateblue": [123, 104, 238],
    "mediumspringgreen": [0, 250, 154],
    "mediumturquoise": [72, 209, 204],
    "mediumvioletred": [199, 21, 133],
    "midnightblue": [25, 25, 112],
    "mintcream": [245, 255, 250],
    "mistyrose": [255, 228, 225],
    "moccasin": [255, 228, 181],
    "navajowhite": [255, 222, 173],
    "navy": [0, 0, 128],
    "oldlace": [253, 245, 230],
    "olive": [128, 128, 0],
    "olivedrab": [107, 142, 35],
    "orange": [255, 165, 0],
    "orangered": [255, 69, 0],
    "orchid": [218, 112, 214],
    "palegoldenrod": [238, 232, 170],
    "palegreen": [152, 251, 152],
    "paleturquoise": [175, 238, 238],
    "palevioletred": [219, 112, 147],
    "papayawhip": [255, 239, 213],
    "peachpuff": [255, 218, 185],
    "peru": [205, 133, 63],
    "pink": [255, 192, 203],
    "plum": [221, 160, 221],
    "powderblue": [176, 224, 230],
    "purple": [128, 0, 128],
    "rebeccapurple": [102, 51, 153],
    "red": [255, 0, 0],
    "rosybrown": [188, 143, 143],
    "royalblue": [65, 105, 225],
    "saddlebrown": [139, 69, 19],
    "salmon": [250, 128, 114],
    "sandybrown": [244, 164, 96],
    "seagreen": [46, 139, 87],
    "seashell": [255, 245, 238],
    "sienna": [160, 82, 45],
    "silver": [192, 192, 192],
    "skyblue": [135, 206, 235],
    "slateblue": [106, 90, 205],
    "slategray": [112, 128, 144],
    "slategrey": [112, 128, 144],
    "snow": [255, 250, 250],
    "springgreen": [0, 255, 127],
    "steelblue": [70, 130, 180],
    "tan": [210, 180, 140],
    "teal": [0, 128, 128],
    "thistle": [216, 191, 216],
    "tomato": [255, 99, 71],
    "turquoise": [64, 224, 208],
    "violet": [238, 130, 238],
    "wheat": [245, 222, 179],
    "white": [255, 255, 255],
    "whitesmoke": [245, 245, 245],
    "yellow": [255, 255, 0],
    "yellowgreen": [154, 205, 50]
};

module.exports = Color;

},{}],4:[function(_dereq_,module,exports){
var Support = _dereq_('./support');
var CanvasRenderer = _dereq_('./renderers/canvas');
var ImageLoader = _dereq_('./imageloader');
var NodeParser = _dereq_('./nodeparser');
var NodeContainer = _dereq_('./nodecontainer');
var log = _dereq_('./log');
var utils = _dereq_('./utils');
var createWindowClone = _dereq_('./clone');
var loadUrlDocument = _dereq_('./proxy').loadUrlDocument;
var getBounds = utils.getBounds;

var html2canvasNodeAttribute = "data-html2canvas-node";
var html2canvasCloneIndex = 0;

function html2canvas(nodeList, options) {
    var index = html2canvasCloneIndex++;
    options = options || {};
    if (options.logging) {
        log.options.logging = true;
        log.options.start = Date.now();
    }

    options.async = typeof(options.async) === "undefined" ? true : options.async;
    options.allowTaint = typeof(options.allowTaint) === "undefined" ? false : options.allowTaint;
    options.removeContainer = typeof(options.removeContainer) === "undefined" ? true : options.removeContainer;
    options.javascriptEnabled = typeof(options.javascriptEnabled) === "undefined" ? false : options.javascriptEnabled;
    options.imageTimeout = typeof(options.imageTimeout) === "undefined" ? 10000 : options.imageTimeout;
    options.renderer = typeof(options.renderer) === "function" ? options.renderer : CanvasRenderer;
    options.strict = !!options.strict;

    if (typeof(nodeList) === "string") {
        if (typeof(options.proxy) !== "string") {
            return Promise.reject("Proxy must be used when rendering url");
        }
        var width = options.width != null ? options.width : window.innerWidth;
        var height = options.height != null ? options.height : window.innerHeight;
        return loadUrlDocument(absoluteUrl(nodeList), options.proxy, document, width, height, options).then(function(container) {
            return renderWindow(container.contentWindow.document.documentElement, container, options, width, height);
        });
    }

    var node = ((nodeList === undefined) ? [document.documentElement] : ((nodeList.length) ? nodeList : [nodeList]))[0];
    var width = options.width != null ? options.width : node.ownerDocument.defaultView.innerWidth;
    var height = options.height != null ? options.height : node.ownerDocument.defaultView.innerHeight;

    node.setAttribute(html2canvasNodeAttribute + index, index);
    //console.debug("BEFORE renderDocument: size: " + width + "x" + height);
    return renderDocument(node.ownerDocument, options, width, height, index).then(function(canvas) {
        if (typeof(options.onrendered) === "function") {
            log("options.onrendered is deprecated, html2canvas returns a Promise containing the canvas");
            options.onrendered(canvas);
        }
        return canvas;
    });
}

html2canvas.CanvasRenderer = CanvasRenderer;
html2canvas.NodeContainer = NodeContainer;
html2canvas.log = log;
html2canvas.utils = utils;

var html2canvasExport = (typeof(document) === "undefined" || typeof(Object.create) !== "function" || typeof(document.createElement("canvas").getContext) !== "function") ? function() {
    return Promise.reject("No canvas support");
} : html2canvas;

module.exports = html2canvasExport;

if (typeof(define) === 'function' && define.amd) {
    define('html2canvas', [], function() {
        return html2canvasExport;
    });
}

function renderDocument(document, options, windowWidth, windowHeight, html2canvasIndex) {
    return createWindowClone(document, document, windowWidth, windowHeight, options, document.defaultView.pageXOffset, document.defaultView.pageYOffset).then(function(container) {
        log("Document cloned");
        var attributeName = html2canvasNodeAttribute + html2canvasIndex;
        var selector = "[" + attributeName + "='" + html2canvasIndex + "']";
        document.querySelector(selector).removeAttribute(attributeName);
        var clonedWindow = container.contentWindow;
        var node = clonedWindow.document.querySelector(selector);
        var oncloneHandler = (typeof(options.onclone) === "function") ? Promise.resolve(options.onclone(clonedWindow.document)) : Promise.resolve(true);
        return oncloneHandler.then(function() {
            return renderWindow(node, container, options, windowWidth, windowHeight);
        });
    });
}

function renderWindow(node, container, options, windowWidth, windowHeight) {
    var clonedWindow = container.contentWindow;
    var support = new Support(clonedWindow.document);
    var imageLoader = new ImageLoader(options, support);
    var bounds = getBounds(node);
    var width = options.type === "view" ? windowWidth : documentWidth(clonedWindow.document);
    var height = options.type === "view" ? windowHeight : documentHeight(clonedWindow.document);
    var renderer = new options.renderer(width, height, imageLoader, options, document);
    var parser = new NodeParser(node, renderer, support, imageLoader, options);
    return parser.ready.then(function() {
        log("Finished rendering");
        var canvas;

        if (options.type === "view") {
            canvas = crop(renderer.canvas, {width: renderer.canvas.width, height: renderer.canvas.height, top: 0, left: 0, x: 0, y: 0});
        } else if (node === clonedWindow.document.body || node === clonedWindow.document.documentElement || options.canvas != null) {
            canvas = renderer.canvas;
        } else {
            canvas = crop(renderer.canvas, {width:  options.width != null ? options.width : bounds.width, height: options.height != null ? options.height : bounds.height, top: bounds.top, left: bounds.left, x: 0, y: 0});
        }

        cleanupContainer(container, options);
        return canvas;
    });
}

function cleanupContainer(container, options) {
    if (options.removeContainer) {
        container.parentNode.removeChild(container);
        log("Cleaned up container");
    }
}

function crop(canvas, bounds) {
    var croppedCanvas = document.createElement("canvas");
    var x1 = Math.min(canvas.width - 1, Math.max(0, bounds.left));
    var x2 = Math.min(canvas.width, Math.max(1, bounds.left + bounds.width));
    var y1 = Math.min(canvas.height - 1, Math.max(0, bounds.top));
    var y2 = Math.min(canvas.height, Math.max(1, bounds.top + bounds.height));
    croppedCanvas.width = bounds.width;
    croppedCanvas.height =  bounds.height;
    var width = x2-x1;
    var height = y2-y1;
    log("Cropping canvas at:", "left:", bounds.left, "top:", bounds.top, "width:", width, "height:", height);
    log("Resulting crop with width", bounds.width, "and height", bounds.height, "with x", x1, "and y", y1);
    croppedCanvas.getContext("2d").drawImage(canvas, x1, y1, width, height, bounds.x, bounds.y, width, height);
    return croppedCanvas;
}

function documentWidth (doc) {
    return Math.max(
        Math.max(doc.body.scrollWidth, doc.documentElement.scrollWidth),
        Math.max(doc.body.offsetWidth, doc.documentElement.offsetWidth),
        Math.max(doc.body.clientWidth, doc.documentElement.clientWidth)
    );
}

function documentHeight (doc) {
    return Math.max(
        Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight),
        Math.max(doc.body.offsetHeight, doc.documentElement.offsetHeight),
        Math.max(doc.body.clientHeight, doc.documentElement.clientHeight)
    );
}

function absoluteUrl(url) {
    var link = document.createElement("a");
    link.href = url;
    link.href = link.href;
    return link;
}

},{"./clone":2,"./imageloader":11,"./log":13,"./nodecontainer":14,"./nodeparser":15,"./proxy":16,"./renderers/canvas":20,"./support":22,"./utils":26}],5:[function(_dereq_,module,exports){
var log = _dereq_('./log');
var smallImage = _dereq_('./utils').smallImage;

function DummyImageContainer(src) {
    this.src = src;
    log("DummyImageContainer for", src);
    if (!this.promise || !this.image) {
        log("Initiating DummyImageContainer");
        DummyImageContainer.prototype.image = new Image();
        var image = this.image;
        DummyImageContainer.prototype.promise = new Promise(function(resolve, reject) {
            image.onload = resolve;
            image.onerror = reject;
            image.src = smallImage();
            if (image.complete === true) {
                resolve(image);
            }
        });
    }
}

module.exports = DummyImageContainer;

},{"./log":13,"./utils":26}],6:[function(_dereq_,module,exports){
var smallImage = _dereq_('./utils').smallImage;

function Font(family, size) {
    var container = document.createElement('div'),
        img = document.createElement('img'),
        span = document.createElement('span'),
        sampleText = 'Hidden Text',
        baseline,
        middle;

    container.style.visibility = "hidden";
    container.style.fontFamily = family;
    container.style.fontSize = size;
    container.style.margin = 0;
    container.style.padding = 0;

    document.body.appendChild(container);

    img.src = smallImage();
    img.width = 1;
    img.height = 1;

    img.style.margin = 0;
    img.style.padding = 0;
    img.style.verticalAlign = "baseline";

    span.style.fontFamily = family;
    span.style.fontSize = size;
    span.style.margin = 0;
    span.style.padding = 0;

    span.appendChild(document.createTextNode(sampleText));
    container.appendChild(span);
    container.appendChild(img);
    baseline = (img.offsetTop - span.offsetTop) + 1;

    container.removeChild(span);
    container.appendChild(document.createTextNode(sampleText));

    container.style.lineHeight = "normal";
    img.style.verticalAlign = "super";

    middle = (img.offsetTop-container.offsetTop) + 1;

    document.body.removeChild(container);

    this.baseline = baseline;
    this.lineWidth = 1;
    this.middle = middle;
}

module.exports = Font;

},{"./utils":26}],7:[function(_dereq_,module,exports){
var Font = _dereq_('./font');

function FontMetrics() {
    this.data = {};
}

FontMetrics.prototype.getMetrics = function(family, size) {
    if (this.data[family + "-" + size] === undefined) {
        this.data[family + "-" + size] = new Font(family, size);
    }
    return this.data[family + "-" + size];
};

module.exports = FontMetrics;

},{"./font":6}],8:[function(_dereq_,module,exports){
var utils = _dereq_('./utils');
var getBounds = utils.getBounds;
var loadUrlDocument = _dereq_('./proxy').loadUrlDocument;

function FrameContainer(container, sameOrigin, options) {
    this.image = null;
    this.src = container;
    var self = this;
    var bounds = getBounds(container);
    this.promise = (!sameOrigin ? this.proxyLoad(options.proxy, bounds, options) : new Promise(function(resolve) {
        if (container.contentWindow.document.URL === "about:blank" || container.contentWindow.document.documentElement == null) {
            container.contentWindow.onload = container.onload = function() {
                resolve(container);
            };
        } else {
            resolve(container);
        }
    })).then(function(container) {
        var html2canvas = _dereq_('./core');
        return html2canvas(container.contentWindow.document.documentElement, {type: 'view', width: container.width, height: container.height, proxy: options.proxy, javascriptEnabled: options.javascriptEnabled, removeContainer: options.removeContainer, allowTaint: options.allowTaint, imageTimeout: options.imageTimeout / 2});
    }).then(function(canvas) {
        return self.image = canvas;
    });
}

FrameContainer.prototype.proxyLoad = function(proxy, bounds, options) {
    var container = this.src;
    return loadUrlDocument(container.src, proxy, container.ownerDocument, bounds.width, bounds.height, options);
};

module.exports = FrameContainer;

},{"./core":4,"./proxy":16,"./utils":26}],9:[function(_dereq_,module,exports){
function GradientContainer(imageData) {
    this.src = imageData.value;
    this.colorStops = [];
    this.type = null;
    this.x0 = 0.5;
    this.y0 = 0.5;
    this.x1 = 0.5;
    this.y1 = 0.5;
    this.promise = Promise.resolve(true);
}

GradientContainer.TYPES = {
    LINEAR: 1,
    RADIAL: 2
};

// TODO: support hsl[a], negative %/length values
// TODO: support <angle> (e.g. -?\d{1,3}(?:\.\d+)deg, etc. : https://developer.mozilla.org/docs/Web/CSS/angle )
GradientContainer.REGEXP_COLORSTOP = /^\s*(rgba?\(\s*\d{1,3},\s*\d{1,3},\s*\d{1,3}(?:,\s*[0-9\.]+)?\s*\)|[a-z]{3,20}|#[a-f0-9]{3,6})(?:\s+(\d{1,3}(?:\.\d+)?)(%|px)?)?(?:\s|$)/i;

module.exports = GradientContainer;

},{}],10:[function(_dereq_,module,exports){
function ImageContainer(src, cors) {
    this.src = src;
    this.image = new Image();
    var self = this;
    this.tainted = null;
    this.promise = new Promise(function(resolve, reject) {
        self.image.onload = resolve;
        self.image.onerror = reject;
        if (cors) {
            self.image.crossOrigin = "anonymous";
        }
        self.image.src = src;
        if (self.image.complete === true) {
            resolve(self.image);
        }
    });
}

module.exports = ImageContainer;

},{}],11:[function(_dereq_,module,exports){
var log = _dereq_('./log');
var ImageContainer = _dereq_('./imagecontainer');
var DummyImageContainer = _dereq_('./dummyimagecontainer');
var ProxyImageContainer = _dereq_('./proxyimagecontainer');
var FrameContainer = _dereq_('./framecontainer');
var SVGContainer = _dereq_('./svgcontainer');
var SVGNodeContainer = _dereq_('./svgnodecontainer');
var LinearGradientContainer = _dereq_('./lineargradientcontainer');
var WebkitGradientContainer = _dereq_('./webkitgradientcontainer');
var bind = _dereq_('./utils').bind;

function ImageLoader(options, support) {
    this.link = null;
    this.options = options;
    this.support = support;
    this.origin = this.getOrigin(window.location.href);
}

ImageLoader.prototype.findImages = function(nodes) {
    var images = [];
    nodes.reduce(function(imageNodes, container) {
        switch(container.node.nodeName) {
        case "IMG":
            return imageNodes.concat([{
                args: [container.node.src],
                method: "url"
            }]);
        case "svg":
        case "IFRAME":
            return imageNodes.concat([{
                args: [container.node],
                method: container.node.nodeName
            }]);
        }
        return imageNodes;
    }, []).forEach(this.addImage(images, this.loadImage), this);
    return images;
};

ImageLoader.prototype.findBackgroundImage = function(images, container) {
    container.parseBackgroundImages().filter(this.hasImageBackground).forEach(this.addImage(images, this.loadImage), this);
    return images;
};

ImageLoader.prototype.addImage = function(images, callback) {
    return function(newImage) {
        newImage.args.forEach(function(image) {
            if (!this.imageExists(images, image)) {
                images.splice(0, 0, callback.call(this, newImage));
                log('Added image #' + (images.length), typeof(image) === "string" ? image.substring(0, 100) : image);
            }
        }, this);
    };
};

ImageLoader.prototype.hasImageBackground = function(imageData) {
    return imageData.method !== "none";
};

ImageLoader.prototype.loadImage = function(imageData) {
    if (imageData.method === "url") {
        var src = imageData.args[0];
        if (this.isSVG(src) && !this.support.svg && !this.options.allowTaint) {
            return new SVGContainer(src);
        } else if (src.match(/data:image\/.*;base64,/i)) {
            return new ImageContainer(src.replace(/url\(['"]{0,}|['"]{0,}\)$/ig, ''), false);
        } else if (this.isSameOrigin(src) || this.options.allowTaint === true || this.isSVG(src)) {
            return new ImageContainer(src, false);
        } else if (this.support.cors && !this.options.allowTaint && this.options.useCORS) {
            return new ImageContainer(src, true);
        } else if (this.options.proxy) {
            return new ProxyImageContainer(src, this.options.proxy);
        } else {
            return new DummyImageContainer(src);
        }
    } else if (imageData.method === "linear-gradient") {
        return new LinearGradientContainer(imageData);
    } else if (imageData.method === "gradient") {
        return new WebkitGradientContainer(imageData);
    } else if (imageData.method === "svg") {
        return new SVGNodeContainer(imageData.args[0], this.support.svg);
    } else if (imageData.method === "IFRAME") {
        return new FrameContainer(imageData.args[0], this.isSameOrigin(imageData.args[0].src), this.options);
    } else {
        return new DummyImageContainer(imageData);
    }
};

ImageLoader.prototype.isSVG = function(src) {
    return src.substring(src.length - 3).toLowerCase() === "svg" || SVGContainer.prototype.isInline(src);
};

ImageLoader.prototype.imageExists = function(images, src) {
    return images.some(function(image) {
        return image.src === src;
    });
};

ImageLoader.prototype.isSameOrigin = function(url) {
    return (this.getOrigin(url) === this.origin);
};

ImageLoader.prototype.getOrigin = function(url) {
    var link = this.link || (this.link = document.createElement("a"));
    link.href = url;
    link.href = link.href; // IE9, LOL! - http://jsfiddle.net/niklasvh/2e48b/
    return link.protocol + link.hostname + link.port;
};

ImageLoader.prototype.getPromise = function(container) {
    return this.timeout(container, this.options.imageTimeout)['catch'](function() {
        var dummy = new DummyImageContainer(container.src);
        return dummy.promise.then(function(image) {
            container.image = image;
        });
    });
};

ImageLoader.prototype.get = function(src) {
    var found = null;
    return this.images.some(function(img) {
        return (found = img).src === src;
    }) ? found : null;
};

ImageLoader.prototype.fetch = function(nodes) {
    this.images = nodes.reduce(bind(this.findBackgroundImage, this), this.findImages(nodes));
    this.images.forEach(function(image, index) {
        image.promise.then(function() {
            log("Succesfully loaded image #"+ (index+1), image);
        }, function(e) {
            log("Failed loading image #"+ (index+1), image, e);
        });
    });
    this.ready = Promise.all(this.images.map(this.getPromise, this));
    log("Finished searching images");
    return this;
};

ImageLoader.prototype.timeout = function(container, timeout) {
    var timer;
    var promise = Promise.race([container.promise, new Promise(function(res, reject) {
        timer = setTimeout(function() {
            log("Timed out loading image", container);
            reject(container);
        }, timeout);
    })]).then(function(container) {
        clearTimeout(timer);
        return container;
    });
    promise['catch'](function() {
        clearTimeout(timer);
    });
    return promise;
};

module.exports = ImageLoader;

},{"./dummyimagecontainer":5,"./framecontainer":8,"./imagecontainer":10,"./lineargradientcontainer":12,"./log":13,"./proxyimagecontainer":17,"./svgcontainer":23,"./svgnodecontainer":24,"./utils":26,"./webkitgradientcontainer":27}],12:[function(_dereq_,module,exports){
var GradientContainer = _dereq_('./gradientcontainer');
var Color = _dereq_('./color');

function LinearGradientContainer(imageData) {
    GradientContainer.apply(this, arguments);
    this.type = GradientContainer.TYPES.LINEAR;

    var hasDirection = LinearGradientContainer.REGEXP_DIRECTION.test( imageData.args[0] ) ||
        !GradientContainer.REGEXP_COLORSTOP.test( imageData.args[0] );

    if (hasDirection) {
        imageData.args[0].split(/\s+/).reverse().forEach(function(position, index) {
            switch(position) {
            case "left":
                this.x0 = 0;
                this.x1 = 1;
                break;
            case "top":
                this.y0 = 0;
                this.y1 = 1;
                break;
            case "right":
                this.x0 = 1;
                this.x1 = 0;
                break;
            case "bottom":
                this.y0 = 1;
                this.y1 = 0;
                break;
            case "to":
                var y0 = this.y0;
                var x0 = this.x0;
                this.y0 = this.y1;
                this.x0 = this.x1;
                this.x1 = x0;
                this.y1 = y0;
                break;
            case "center":
                break; // centered by default
            // Firefox internally converts position keywords to percentages:
            // http://www.w3.org/TR/2010/WD-CSS2-20101207/colors.html#propdef-background-position
            default: // percentage or absolute length
                // TODO: support absolute start point positions (e.g., use bounds to convert px to a ratio)
                var ratio = parseFloat(position, 10) * 1e-2;
                if (isNaN(ratio)) { // invalid or unhandled value
                    break;
                }
                if (index === 0) {
                    this.y0 = ratio;
                    this.y1 = 1 - this.y0;
                } else {
                    this.x0 = ratio;
                    this.x1 = 1 - this.x0;
                }
                break;
            }
        }, this);
    } else {
        this.y0 = 0;
        this.y1 = 1;
    }

    this.colorStops = imageData.args.slice(hasDirection ? 1 : 0).map(function(colorStop) {
        var colorStopMatch = colorStop.match(GradientContainer.REGEXP_COLORSTOP);
        var value = +colorStopMatch[2];
        var unit = value === 0 ? "%" : colorStopMatch[3]; // treat "0" as "0%"
        return {
            color: new Color(colorStopMatch[1]),
            // TODO: support absolute stop positions (e.g., compute gradient line length & convert px to ratio)
            stop: unit === "%" ? value / 100 : null
        };
    });

    if (this.colorStops[0].stop === null) {
        this.colorStops[0].stop = 0;
    }

    if (this.colorStops[this.colorStops.length - 1].stop === null) {
        this.colorStops[this.colorStops.length - 1].stop = 1;
    }

    // calculates and fills-in explicit stop positions when omitted from rule
    this.colorStops.forEach(function(colorStop, index) {
        if (colorStop.stop === null) {
            this.colorStops.slice(index).some(function(find, count) {
                if (find.stop !== null) {
                    colorStop.stop = ((find.stop - this.colorStops[index - 1].stop) / (count + 1)) + this.colorStops[index - 1].stop;
                    return true;
                } else {
                    return false;
                }
            }, this);
        }
    }, this);
}

LinearGradientContainer.prototype = Object.create(GradientContainer.prototype);

// TODO: support <angle> (e.g. -?\d{1,3}(?:\.\d+)deg, etc. : https://developer.mozilla.org/docs/Web/CSS/angle )
LinearGradientContainer.REGEXP_DIRECTION = /^\s*(?:to|left|right|top|bottom|center|\d{1,3}(?:\.\d+)?%?)(?:\s|$)/i;

module.exports = LinearGradientContainer;

},{"./color":3,"./gradientcontainer":9}],13:[function(_dereq_,module,exports){
var logger = function() {
    if (logger.options.logging && window.console && window.console.log) {
        Function.prototype.bind.call(window.console.log, (window.console)).apply(window.console, [(Date.now() - logger.options.start) + "ms", "html2canvas:"].concat([].slice.call(arguments, 0)));
    }
};

logger.options = {logging: false};
module.exports = logger;

},{}],14:[function(_dereq_,module,exports){
var Color = _dereq_('./color');
var utils = _dereq_('./utils');
var getBounds = utils.getBounds;
var parseBackgrounds = utils.parseBackgrounds;
var offsetBounds = utils.offsetBounds;

function NodeContainer(node, parent) {
    this.node = node;
    this.parent = parent;
    this.stack = null;
    this.bounds = null;
    this.borders = null;
    this.clip = [];
    this.backgroundClip = [];
    this.offsetBounds = null;
    this.visible = null;
    this.computedStyles = null;
    this.colors = {};
    this.styles = {};
    this.backgroundImages = null;
    this.transformData = null;
    this.transformMatrix = null;
    this.isPseudoElement = false;
    this.opacity = null;
}

NodeContainer.prototype.cloneTo = function(stack) {
    stack.visible = this.visible;
    stack.borders = this.borders;
    stack.bounds = this.bounds;
    stack.clip = this.clip;
    stack.backgroundClip = this.backgroundClip;
    stack.computedStyles = this.computedStyles;
    stack.styles = this.styles;
    stack.backgroundImages = this.backgroundImages;
    stack.opacity = this.opacity;
};

NodeContainer.prototype.getOpacity = function() {
    return this.opacity === null ? (this.opacity = this.cssFloat('opacity')) : this.opacity;
};

NodeContainer.prototype.assignStack = function(stack) {
    this.stack = stack;
    stack.children.push(this);
};

NodeContainer.prototype.isElementVisible = function() {
    return this.node.nodeType === Node.TEXT_NODE ? this.parent.visible : (
        this.css('display') !== "none" &&
        this.css('visibility') !== "hidden" &&
        !this.node.hasAttribute("data-html2canvas-ignore") &&
        (this.node.nodeName !== "INPUT" || this.node.getAttribute("type") !== "hidden")
    );
};

NodeContainer.prototype.css = function(attribute) {
    if (!this.computedStyles) {
        this.computedStyles = this.isPseudoElement ? this.parent.computedStyle(this.before ? ":before" : ":after") : this.computedStyle(null);
    }

    return this.styles[attribute] || (this.styles[attribute] = this.computedStyles[attribute]);
};

NodeContainer.prototype.prefixedCss = function(attribute) {
    var prefixes = ["webkit", "moz", "ms", "o"];
    var value = this.css(attribute);
    if (value === undefined) {
        prefixes.some(function(prefix) {
            value = this.css(prefix + attribute.substr(0, 1).toUpperCase() + attribute.substr(1));
            return value !== undefined;
        }, this);
    }
    return value === undefined ? null : value;
};

NodeContainer.prototype.computedStyle = function(type) {
    return this.node.ownerDocument.defaultView.getComputedStyle(this.node, type);
};

NodeContainer.prototype.cssInt = function(attribute) {
    var value = parseInt(this.css(attribute), 10);
    return (isNaN(value)) ? 0 : value; // borders in old IE are throwing 'medium' for demo.html
};

NodeContainer.prototype.color = function(attribute) {
    return this.colors[attribute] || (this.colors[attribute] = new Color(this.css(attribute)));
};

NodeContainer.prototype.cssFloat = function(attribute) {
    var value = parseFloat(this.css(attribute));
    return (isNaN(value)) ? 0 : value;
};

NodeContainer.prototype.fontWeight = function() {
    var weight = this.css("fontWeight");
    switch(parseInt(weight, 10)){
    case 401:
        weight = "bold";
        break;
    case 400:
        weight = "normal";
        break;
    }
    return weight;
};

NodeContainer.prototype.parseClip = function() {
    var matches = this.css('clip').match(this.CLIP);
    if (matches) {
        return {
            top: parseInt(matches[1], 10),
            right: parseInt(matches[2], 10),
            bottom: parseInt(matches[3], 10),
            left: parseInt(matches[4], 10)
        };
    }
    return null;
};

NodeContainer.prototype.parseBackgroundImages = function() {
    return this.backgroundImages || (this.backgroundImages = parseBackgrounds(this.css("backgroundImage")));
};

NodeContainer.prototype.cssList = function(property, index) {
    var value = (this.css(property) || '').split(',');
    value = value[index || 0] || value[0] || 'auto';
    value = value.trim().split(' ');
    if (value.length === 1) {
        value = [value[0], isPercentage(value[0]) ? 'auto' : value[0]];
    }
    return value;
};

NodeContainer.prototype.parseBackgroundSize = function(bounds, image, index) {
    var size = this.cssList("backgroundSize", index);
    var width, height;

    if (isPercentage(size[0])) {
        width = bounds.width * parseFloat(size[0]) / 100;
    } else if (/contain|cover/.test(size[0])) {
        var targetRatio = bounds.width / bounds.height, currentRatio = image.width / image.height;
        return (targetRatio < currentRatio ^ size[0] === 'contain') ?  {width: bounds.height * currentRatio, height: bounds.height} : {width: bounds.width, height: bounds.width / currentRatio};
    } else {
        width = parseInt(size[0], 10);
    }

    if (size[0] === 'auto' && size[1] === 'auto') {
        height = image.height;
    } else if (size[1] === 'auto') {
        height = width / image.width * image.height;
    } else if (isPercentage(size[1])) {
        height =  bounds.height * parseFloat(size[1]) / 100;
    } else {
        height = parseInt(size[1], 10);
    }

    if (size[0] === 'auto') {
        width = height / image.height * image.width;
    }

    return {width: width, height: height};
};

NodeContainer.prototype.parseBackgroundPosition = function(bounds, image, index, backgroundSize) {
    var position = this.cssList('backgroundPosition', index);
    var left, top;

    if (isPercentage(position[0])){
        left = (bounds.width - (backgroundSize || image).width) * (parseFloat(position[0]) / 100);
    } else {
        left = parseInt(position[0], 10);
    }

    if (position[1] === 'auto') {
        top = left / image.width * image.height;
    } else if (isPercentage(position[1])){
        top =  (bounds.height - (backgroundSize || image).height) * parseFloat(position[1]) / 100;
    } else {
        top = parseInt(position[1], 10);
    }

    if (position[0] === 'auto') {
        left = top / image.height * image.width;
    }

    return {left: left, top: top};
};

NodeContainer.prototype.parseBackgroundRepeat = function(index) {
    return this.cssList("backgroundRepeat", index)[0];
};

NodeContainer.prototype.parseTextShadows = function() {
    var textShadow = this.css("textShadow");
    var results = [];

    if (textShadow && textShadow !== 'none') {
        var shadows = textShadow.match(this.TEXT_SHADOW_PROPERTY);
        for (var i = 0; shadows && (i < shadows.length); i++) {
            var s = shadows[i].match(this.TEXT_SHADOW_VALUES);
            results.push({
                color: new Color(s[0]),
                offsetX: s[1] ? parseFloat(s[1].replace('px', '')) : 0,
                offsetY: s[2] ? parseFloat(s[2].replace('px', '')) : 0,
                blur: s[3] ? s[3].replace('px', '') : 0
            });
        }
    }
    return results;
};

NodeContainer.prototype.parseTransform = function() {
    if (!this.transformData) {
        if (this.hasTransform()) {
            var offset = this.parseBounds();
            var origin = this.prefixedCss("transformOrigin").split(" ").map(removePx).map(asFloat);
            origin[0] += offset.left;
            origin[1] += offset.top;
            this.transformData = {
                origin: origin,
                matrix: this.parseTransformMatrix()
            };
        } else {
            this.transformData = {
                origin: [0, 0],
                matrix: [1, 0, 0, 1, 0, 0]
            };
        }
    }
    return this.transformData;
};

NodeContainer.prototype.parseTransformMatrix = function() {
    if (!this.transformMatrix) {
        var transform = this.prefixedCss("transform");
        var matrix = transform ? parseMatrix(transform.match(this.MATRIX_PROPERTY)) : null;
        this.transformMatrix = matrix ? matrix : [1, 0, 0, 1, 0, 0];
    }
    return this.transformMatrix;
};

NodeContainer.prototype.parseBounds = function() {
    return this.bounds || (this.bounds = this.hasTransform() ? offsetBounds(this.node) : getBounds(this.node));
};

NodeContainer.prototype.hasTransform = function() {
    return this.parseTransformMatrix().join(",") !== "1,0,0,1,0,0" || (this.parent && this.parent.hasTransform());
};

NodeContainer.prototype.getValue = function() {
    var value = this.node.value || "";
    if (this.node.tagName === "SELECT") {
        value = selectionValue(this.node);
    } else if (this.node.type === "password") {
        value = Array(value.length + 1).join('\u2022'); // jshint ignore:line
    }
    return value.length === 0 ? (this.node.placeholder || "") : value;
};

NodeContainer.prototype.MATRIX_PROPERTY = /(matrix|matrix3d)\((.+)\)/;
NodeContainer.prototype.TEXT_SHADOW_PROPERTY = /((rgba|rgb)\([^\)]+\)(\s-?\d+px){0,})/g;
NodeContainer.prototype.TEXT_SHADOW_VALUES = /(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;
NodeContainer.prototype.CLIP = /^rect\((\d+)px,? (\d+)px,? (\d+)px,? (\d+)px\)$/;

function selectionValue(node) {
    var option = node.options[node.selectedIndex || 0];
    return option ? (option.text || "") : "";
}

function parseMatrix(match) {
    if (match && match[1] === "matrix") {
        return match[2].split(",").map(function(s) {
            return parseFloat(s.trim());
        });
    } else if (match && match[1] === "matrix3d") {
        var matrix3d = match[2].split(",").map(function(s) {
          return parseFloat(s.trim());
        });
        return [matrix3d[0], matrix3d[1], matrix3d[4], matrix3d[5], matrix3d[12], matrix3d[13]];
    }
}

function isPercentage(value) {
    return value.toString().indexOf("%") !== -1;
}

function removePx(str) {
    return str.replace("px", "");
}

function asFloat(str) {
    return parseFloat(str);
}

module.exports = NodeContainer;

},{"./color":3,"./utils":26}],15:[function(_dereq_,module,exports){
var log = _dereq_('./log');
var punycode = _dereq_('punycode');
var NodeContainer = _dereq_('./nodecontainer');
var TextContainer = _dereq_('./textcontainer');
var PseudoElementContainer = _dereq_('./pseudoelementcontainer');
var FontMetrics = _dereq_('./fontmetrics');
var Color = _dereq_('./color');
var StackingContext = _dereq_('./stackingcontext');
var utils = _dereq_('./utils');
var bind = utils.bind;
var getBounds = utils.getBounds;
var parseBackgrounds = utils.parseBackgrounds;
var offsetBounds = utils.offsetBounds;

function NodeParser(element, renderer, support, imageLoader, options) {
    log("Starting NodeParser");
    this.renderer = renderer;
    this.options = options;
    this.range = null;
    this.support = support;
    this.renderQueue = [];
    this.stack = new StackingContext(true, 1, element.ownerDocument, null);
    var parent = new NodeContainer(element, null);
    if (options.background) {
        renderer.rectangle(0, 0, renderer.width, renderer.height, new Color(options.background));
    }
    if (element === element.ownerDocument.documentElement) {
        // http://www.w3.org/TR/css3-background/#special-backgrounds
        var canvasBackground = new NodeContainer(parent.color('backgroundColor').isTransparent() ? element.ownerDocument.body : element.ownerDocument.documentElement, null);
        renderer.rectangle(0, 0, renderer.width, renderer.height, canvasBackground.color('backgroundColor'));
    }
    parent.visibile = parent.isElementVisible();
    this.createPseudoHideStyles(element.ownerDocument);
    this.disableAnimations(element.ownerDocument);
    this.nodes = flatten([parent].concat(this.getChildren(parent)).filter(function(container) {
        return container.visible = container.isElementVisible();
    }).map(this.getPseudoElements, this));
    this.fontMetrics = new FontMetrics();
    log("Fetched nodes, total:", this.nodes.length);
    log("Calculate overflow clips");
    this.calculateOverflowClips();
    log("Start fetching images");
    this.images = imageLoader.fetch(this.nodes.filter(isElement));
    this.ready = this.images.ready.then(bind(function() {
        log("Images loaded, starting parsing");
        log("Creating stacking contexts");
        this.createStackingContexts();
        log("Sorting stacking contexts");
        this.sortStackingContexts(this.stack);
        this.parse(this.stack);
        log("Render queue created with " + this.renderQueue.length + " items");
        return new Promise(bind(function(resolve) {
            if (!options.async) {
                this.renderQueue.forEach(this.paint, this);
                resolve();
            } else if (typeof(options.async) === "function") {
                options.async.call(this, this.renderQueue, resolve);
            } else if (this.renderQueue.length > 0){
                this.renderIndex = 0;
                this.asyncRenderer(this.renderQueue, resolve);
            } else {
                resolve();
            }
        }, this));
    }, this));
}

NodeParser.prototype.calculateOverflowClips = function() {
    this.nodes.forEach(function(container) {
        if (isElement(container)) {
            if (isPseudoElement(container)) {
                container.appendToDOM();
            }
            container.borders = this.parseBorders(container);
            var clip = (container.css('overflow') === "hidden") ? [container.borders.clip] : [];
            var cssClip = container.parseClip();
            if (cssClip && ["absolute", "fixed"].indexOf(container.css('position')) !== -1) {
                clip.push([["rect",
                        container.bounds.left + cssClip.left,
                        container.bounds.top + cssClip.top,
                        cssClip.right - cssClip.left,
                        cssClip.bottom - cssClip.top
                ]]);
            }
            container.clip = hasParentClip(container) ? container.parent.clip.concat(clip) : clip;
            container.backgroundClip = (container.css('overflow') !== "hidden") ? container.clip.concat([container.borders.clip]) : container.clip;
            if (isPseudoElement(container)) {
                container.cleanDOM();
            }
        } else if (isTextNode(container)) {
            container.clip = hasParentClip(container) ? container.parent.clip : [];
        }
        if (!isPseudoElement(container)) {
            container.bounds = null;
        }
    }, this);
};

function hasParentClip(container) {
    return container.parent && container.parent.clip.length;
}

NodeParser.prototype.asyncRenderer = function(queue, resolve, asyncTimer) {
    asyncTimer = asyncTimer || Date.now();
    this.paint(queue[this.renderIndex++]);
    if (queue.length === this.renderIndex) {
        resolve();
    } else if (asyncTimer + 20 > Date.now()) {
        this.asyncRenderer(queue, resolve, asyncTimer);
    } else {
        setTimeout(bind(function() {
            this.asyncRenderer(queue, resolve);
        }, this), 0);
    }
};

NodeParser.prototype.createPseudoHideStyles = function(document) {
    this.createStyles(document, '.' + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + ':before { content: "" !important; display: none !important; }' +
        '.' + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER + ':after { content: "" !important; display: none !important; }');
};

NodeParser.prototype.disableAnimations = function(document) {
    this.createStyles(document, '* { -webkit-animation: none !important; -moz-animation: none !important; -o-animation: none !important; animation: none !important; ' +
        '-webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; transition: none !important;}');
};

NodeParser.prototype.createStyles = function(document, styles) {
    var hidePseudoElements = document.createElement('style');
    hidePseudoElements.innerHTML = styles;
    document.body.appendChild(hidePseudoElements);
};

NodeParser.prototype.getPseudoElements = function(container) {
    var nodes = [[container]];
    if (container.node.nodeType === Node.ELEMENT_NODE) {
        var before = this.getPseudoElement(container, ":before");
        var after = this.getPseudoElement(container, ":after");

        if (before) {
            nodes.push(before);
        }

        if (after) {
            nodes.push(after);
        }
    }
    return flatten(nodes);
};

function toCamelCase(str) {
    return str.replace(/(\-[a-z])/g, function(match){
        return match.toUpperCase().replace('-','');
    });
}

NodeParser.prototype.getPseudoElement = function(container, type) {
    var style = container.computedStyle(type);
    if(!style || !style.content || style.content === "none" || style.content === "-moz-alt-content" || style.display === "none") {
        return null;
    }

    var content = stripQuotes(style.content);
    var isImage = content.substr(0, 3) === 'url';
    var pseudoNode = document.createElement(isImage ? 'img' : 'html2canvaspseudoelement');
    var pseudoContainer = new PseudoElementContainer(pseudoNode, container, type);

    for (var i = style.length-1; i >= 0; i--) {
        var property = toCamelCase(style.item(i));
        pseudoNode.style[property] = style[property];
    }

    pseudoNode.className = PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + " " + PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER;

    if (isImage) {
        pseudoNode.src = parseBackgrounds(content)[0].args[0];
        return [pseudoContainer];
    } else {
        var text = document.createTextNode(content);
        pseudoNode.appendChild(text);
        return [pseudoContainer, new TextContainer(text, pseudoContainer)];
    }
};


NodeParser.prototype.getChildren = function(parentContainer) {
    return flatten([].filter.call(parentContainer.node.childNodes, renderableNode).map(function(node) {
        var container = [node.nodeType === Node.TEXT_NODE ? new TextContainer(node, parentContainer) : new NodeContainer(node, parentContainer)].filter(nonIgnoredElement);
        return node.nodeType === Node.ELEMENT_NODE && container.length && node.tagName !== "TEXTAREA" ? (container[0].isElementVisible() ? container.concat(this.getChildren(container[0])) : []) : container;
    }, this));
};

NodeParser.prototype.newStackingContext = function(container, hasOwnStacking) {
    var stack = new StackingContext(hasOwnStacking, container.getOpacity(), container.node, container.parent);
    container.cloneTo(stack);
    var parentStack = hasOwnStacking ? stack.getParentStack(this) : stack.parent.stack;
    parentStack.contexts.push(stack);
    container.stack = stack;
};

NodeParser.prototype.createStackingContexts = function() {
    this.nodes.forEach(function(container) {
        if (isElement(container) && (this.isRootElement(container) || hasOpacity(container) || isPositionedForStacking(container) || this.isBodyWithTransparentRoot(container) || container.hasTransform())) {
            this.newStackingContext(container, true);
        } else if (isElement(container) && ((isPositioned(container) && zIndex0(container)) || isInlineBlock(container) || isFloating(container))) {
            this.newStackingContext(container, false);
        } else {
            container.assignStack(container.parent.stack);
        }
    }, this);
};

NodeParser.prototype.isBodyWithTransparentRoot = function(container) {
    return container.node.nodeName === "BODY" && container.parent.color('backgroundColor').isTransparent();
};

NodeParser.prototype.isRootElement = function(container) {
    return container.parent === null;
};

NodeParser.prototype.sortStackingContexts = function(stack) {
    stack.contexts.sort(zIndexSort(stack.contexts.slice(0)));
    stack.contexts.forEach(this.sortStackingContexts, this);
};

NodeParser.prototype.parseTextBounds = function(container) {
    return function(text, index, textList) {
        if (container.parent.css("textDecoration").substr(0, 4) !== "none" || text.trim().length !== 0) {
            if (this.support.rangeBounds && !container.parent.hasTransform()) {
                var offset = textList.slice(0, index).join("").length;
                return this.getRangeBounds(container.node, offset, text.length);
            } else if (container.node && typeof(container.node.data) === "string") {
                var replacementNode = container.node.splitText(text.length);
                var bounds = this.getWrapperBounds(container.node, container.parent.hasTransform());
                container.node = replacementNode;
                return bounds;
            }
        } else if(!this.support.rangeBounds || container.parent.hasTransform()){
            container.node = container.node.splitText(text.length);
        }
        return {};
    };
};

NodeParser.prototype.getWrapperBounds = function(node, transform) {
    var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
    var parent = node.parentNode,
        backupText = node.cloneNode(true);

    wrapper.appendChild(node.cloneNode(true));
    parent.replaceChild(wrapper, node);
    var bounds = transform ? offsetBounds(wrapper) : getBounds(wrapper);
    parent.replaceChild(backupText, wrapper);
    return bounds;
};

NodeParser.prototype.getRangeBounds = function(node, offset, length) {
    var range = this.range || (this.range = node.ownerDocument.createRange());
    range.setStart(node, offset);
    range.setEnd(node, offset + length);
    return range.getBoundingClientRect();
};

function ClearTransform() {}

NodeParser.prototype.parse = function(stack) {
    // http://www.w3.org/TR/CSS21/visuren.html#z-index
    var negativeZindex = stack.contexts.filter(negativeZIndex); // 2. the child stacking contexts with negative stack levels (most negative first).
    var descendantElements = stack.children.filter(isElement);
    var descendantNonFloats = descendantElements.filter(not(isFloating));
    var nonInlineNonPositionedDescendants = descendantNonFloats.filter(not(isPositioned)).filter(not(inlineLevel)); // 3 the in-flow, non-inline-level, non-positioned descendants.
    var nonPositionedFloats = descendantElements.filter(not(isPositioned)).filter(isFloating); // 4. the non-positioned floats.
    var inFlow = descendantNonFloats.filter(not(isPositioned)).filter(inlineLevel); // 5. the in-flow, inline-level, non-positioned descendants, including inline tables and inline blocks.
    var stackLevel0 = stack.contexts.concat(descendantNonFloats.filter(isPositioned)).filter(zIndex0); // 6. the child stacking contexts with stack level 0 and the positioned descendants with stack level 0.
    var text = stack.children.filter(isTextNode).filter(hasText);
    var positiveZindex = stack.contexts.filter(positiveZIndex); // 7. the child stacking contexts with positive stack levels (least positive first).
    negativeZindex.concat(nonInlineNonPositionedDescendants).concat(nonPositionedFloats)
        .concat(inFlow).concat(stackLevel0).concat(text).concat(positiveZindex).forEach(function(container) {
            this.renderQueue.push(container);
            if (isStackingContext(container)) {
                this.parse(container);
                this.renderQueue.push(new ClearTransform());
            }
        }, this);
};

NodeParser.prototype.paint = function(container) {
    try {
        if (container instanceof ClearTransform) {
            this.renderer.ctx.restore();
        } else if (isTextNode(container)) {
            if (isPseudoElement(container.parent)) {
                container.parent.appendToDOM();
            }
            this.paintText(container);
            if (isPseudoElement(container.parent)) {
                container.parent.cleanDOM();
            }
        } else {
            this.paintNode(container);
        }
    } catch(e) {
        log(e);
        if (this.options.strict) {
            throw e;
        }
    }
};

NodeParser.prototype.paintNode = function(container) {
    if (isStackingContext(container)) {
        this.renderer.setOpacity(container.opacity);
        this.renderer.ctx.save();
        if (container.hasTransform()) {
            this.renderer.setTransform(container.parseTransform());
        }
    }

    if (container.node.nodeName === "INPUT" && container.node.type === "checkbox") {
        this.paintCheckbox(container);
    } else if (container.node.nodeName === "INPUT" && container.node.type === "radio") {
        this.paintRadio(container);
    } else {
        this.paintElement(container);
    }
};

NodeParser.prototype.paintElement = function(container) {
    var bounds = container.parseBounds();
    this.renderer.clip(container.backgroundClip, function() {
        this.renderer.renderBackground(container, bounds, container.borders.borders.map(getWidth));
    }, this);

    this.renderer.clip(container.clip, function() {
        this.renderer.renderBorders(container.borders.borders);
    }, this);

    this.renderer.clip(container.backgroundClip, function() {
        switch (container.node.nodeName) {
        case "svg":
        case "IFRAME":
            var imgContainer = this.images.get(container.node);
            if (imgContainer) {
                this.renderer.renderImage(container, bounds, container.borders, imgContainer);
            } else {
                log("Error loading <" + container.node.nodeName + ">", container.node);
            }
            break;
        case "IMG":
            var imageContainer = this.images.get(container.node.src);
            if (imageContainer) {
                this.renderer.renderImage(container, bounds, container.borders, imageContainer);
            } else {
                log("Error loading <img>", container.node.src);
            }
            break;
        case "CANVAS":
            this.renderer.renderImage(container, bounds, container.borders, {image: container.node});
            break;
        case "SELECT":
        case "INPUT":
        case "TEXTAREA":
            this.paintFormValue(container);
            break;
        }
    }, this);
};

NodeParser.prototype.paintCheckbox = function(container) {
    var b = container.parseBounds();

    var size = Math.min(b.width, b.height);
    var bounds = {width: size - 1, height: size - 1, top: b.top, left: b.left};
    var r = [3, 3];
    var radius = [r, r, r, r];
    var borders = [1,1,1,1].map(function(w) {
        return {color: new Color('#A5A5A5'), width: w};
    });

    var borderPoints = calculateCurvePoints(bounds, radius, borders);

    this.renderer.clip(container.backgroundClip, function() {
        this.renderer.rectangle(bounds.left + 1, bounds.top + 1, bounds.width - 2, bounds.height - 2, new Color("#DEDEDE"));
        this.renderer.renderBorders(calculateBorders(borders, bounds, borderPoints, radius));
        if (container.node.checked) {
            this.renderer.font(new Color('#424242'), 'normal', 'normal', 'bold', (size - 3) + "px", 'arial');
            this.renderer.text("\u2714", bounds.left + size / 6, bounds.top + size - 1);
        }
    }, this);
};

NodeParser.prototype.paintRadio = function(container) {
    var bounds = container.parseBounds();

    var size = Math.min(bounds.width, bounds.height) - 2;

    this.renderer.clip(container.backgroundClip, function() {
        this.renderer.circleStroke(bounds.left + 1, bounds.top + 1, size, new Color('#DEDEDE'), 1, new Color('#A5A5A5'));
        if (container.node.checked) {
            this.renderer.circle(Math.ceil(bounds.left + size / 4) + 1, Math.ceil(bounds.top + size / 4) + 1, Math.floor(size / 2), new Color('#424242'));
        }
    }, this);
};

NodeParser.prototype.paintFormValue = function(container) {
    var value = container.getValue();
    if (value.length > 0) {
        var document = container.node.ownerDocument;
        var wrapper = document.createElement('html2canvaswrapper');
        var properties = ['lineHeight', 'textAlign', 'fontFamily', 'fontWeight', 'fontSize', 'color',
            'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
            'width', 'height', 'borderLeftStyle', 'borderTopStyle', 'borderLeftWidth', 'borderTopWidth',
            'boxSizing', 'whiteSpace', 'wordWrap'];

        properties.forEach(function(property) {
            try {
                wrapper.style[property] = container.css(property);
            } catch(e) {
                // Older IE has issues with "border"
                log("html2canvas: Parse: Exception caught in renderFormValue: " + e.message);
            }
        });
        var bounds = container.parseBounds();
        wrapper.style.position = "fixed";
        wrapper.style.left = bounds.left + "px";
        wrapper.style.top = bounds.top + "px";
        wrapper.textContent = value;
        document.body.appendChild(wrapper);
        this.paintText(new TextContainer(wrapper.firstChild, container));
        document.body.removeChild(wrapper);
    }
};

NodeParser.prototype.paintText = function(container) {
    container.applyTextTransform();
    var characters = punycode.ucs2.decode(container.node.data);
    var textList = (!this.options.letterRendering || noLetterSpacing(container)) && !hasUnicode(container.node.data) ? getWords(characters) : characters.map(function(character) {
        return punycode.ucs2.encode([character]);
    });

    var weight = container.parent.fontWeight();
    var size = container.parent.css('fontSize');
    var family = container.parent.css('fontFamily');
    var shadows = container.parent.parseTextShadows();

    this.renderer.font(container.parent.color('color'), container.parent.css('fontStyle'), container.parent.css('fontVariant'), weight, size, family);
    if (shadows.length) {
        // TODO: support multiple text shadows
        this.renderer.fontShadow(shadows[0].color, shadows[0].offsetX, shadows[0].offsetY, shadows[0].blur);
    } else {
        this.renderer.clearShadow();
    }

    this.renderer.clip(container.parent.clip, function() {
        textList.map(this.parseTextBounds(container), this).forEach(function(bounds, index) {
            if (bounds) {
                this.renderer.text(textList[index], bounds.left, bounds.bottom);
                this.renderTextDecoration(container.parent, bounds, this.fontMetrics.getMetrics(family, size));
            }
        }, this);
    }, this);
};

NodeParser.prototype.renderTextDecoration = function(container, bounds, metrics) {
    switch(container.css("textDecoration").split(" ")[0]) {
    case "underline":
        // Draws a line at the baseline of the font
        // TODO As some browsers display the line as more than 1px if the font-size is big, need to take that into account both in position and size
        this.renderer.rectangle(bounds.left, Math.round(bounds.top + metrics.baseline + metrics.lineWidth), bounds.width, 1, container.color("color"));
        break;
    case "overline":
        this.renderer.rectangle(bounds.left, Math.round(bounds.top), bounds.width, 1, container.color("color"));
        break;
    case "line-through":
        // TODO try and find exact position for line-through
        this.renderer.rectangle(bounds.left, Math.ceil(bounds.top + metrics.middle + metrics.lineWidth), bounds.width, 1, container.color("color"));
        break;
    }
};

var borderColorTransforms = {
    inset: [
        ["darken", 0.60],
        ["darken", 0.10],
        ["darken", 0.10],
        ["darken", 0.60]
    ]
};

NodeParser.prototype.parseBorders = function(container) {
    var nodeBounds = container.parseBounds();
    var radius = getBorderRadiusData(container);
    var borders = ["Top", "Right", "Bottom", "Left"].map(function(side, index) {
        var style = container.css('border' + side + 'Style');
        var color = container.color('border' + side + 'Color');
        if (style === "inset" && color.isBlack()) {
            color = new Color([255, 255, 255, color.a]); // this is wrong, but
        }
        var colorTransform = borderColorTransforms[style] ? borderColorTransforms[style][index] : null;
        return {
            width: container.cssInt('border' + side + 'Width'),
            color: colorTransform ? color[colorTransform[0]](colorTransform[1]) : color,
            args: null
        };
    });
    var borderPoints = calculateCurvePoints(nodeBounds, radius, borders);

    return {
        clip: this.parseBackgroundClip(container, borderPoints, borders, radius, nodeBounds),
        borders: calculateBorders(borders, nodeBounds, borderPoints, radius)
    };
};

function calculateBorders(borders, nodeBounds, borderPoints, radius) {
    return borders.map(function(border, borderSide) {
        if (border.width > 0) {
            var bx = nodeBounds.left;
            var by = nodeBounds.top;
            var bw = nodeBounds.width;
            var bh = nodeBounds.height - (borders[2].width);

            switch(borderSide) {
            case 0:
                // top border
                bh = borders[0].width;
                border.args = drawSide({
                        c1: [bx, by],
                        c2: [bx + bw, by],
                        c3: [bx + bw - borders[1].width, by + bh],
                        c4: [bx + borders[3].width, by + bh]
                    }, radius[0], radius[1],
                    borderPoints.topLeftOuter, borderPoints.topLeftInner, borderPoints.topRightOuter, borderPoints.topRightInner);
                break;
            case 1:
                // right border
                bx = nodeBounds.left + nodeBounds.width - (borders[1].width);
                bw = borders[1].width;

                border.args = drawSide({
                        c1: [bx + bw, by],
                        c2: [bx + bw, by + bh + borders[2].width],
                        c3: [bx, by + bh],
                        c4: [bx, by + borders[0].width]
                    }, radius[1], radius[2],
                    borderPoints.topRightOuter, borderPoints.topRightInner, borderPoints.bottomRightOuter, borderPoints.bottomRightInner);
                break;
            case 2:
                // bottom border
                by = (by + nodeBounds.height) - (borders[2].width);
                bh = borders[2].width;
                border.args = drawSide({
                        c1: [bx + bw, by + bh],
                        c2: [bx, by + bh],
                        c3: [bx + borders[3].width, by],
                        c4: [bx + bw - borders[3].width, by]
                    }, radius[2], radius[3],
                    borderPoints.bottomRightOuter, borderPoints.bottomRightInner, borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner);
                break;
            case 3:
                // left border
                bw = borders[3].width;
                border.args = drawSide({
                        c1: [bx, by + bh + borders[2].width],
                        c2: [bx, by],
                        c3: [bx + bw, by + borders[0].width],
                        c4: [bx + bw, by + bh]
                    }, radius[3], radius[0],
                    borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner, borderPoints.topLeftOuter, borderPoints.topLeftInner);
                break;
            }
        }
        return border;
    });
}

NodeParser.prototype.parseBackgroundClip = function(container, borderPoints, borders, radius, bounds) {
    var backgroundClip = container.css('backgroundClip'),
        borderArgs = [];

    switch(backgroundClip) {
    case "content-box":
    case "padding-box":
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftInner, borderPoints.topRightInner, bounds.left + borders[3].width, bounds.top + borders[0].width);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightInner, borderPoints.bottomRightInner, bounds.left + bounds.width - borders[1].width, bounds.top + borders[0].width);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightInner, borderPoints.bottomLeftInner, bounds.left + bounds.width - borders[1].width, bounds.top + bounds.height - borders[2].width);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftInner, borderPoints.topLeftInner, bounds.left + borders[3].width, bounds.top + bounds.height - borders[2].width);
        break;

    default:
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftOuter, borderPoints.topRightOuter, bounds.left, bounds.top);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightOuter, borderPoints.bottomRightOuter, bounds.left + bounds.width, bounds.top);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightOuter, borderPoints.bottomLeftOuter, bounds.left + bounds.width, bounds.top + bounds.height);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftOuter, borderPoints.topLeftOuter, bounds.left, bounds.top + bounds.height);
        break;
    }

    return borderArgs;
};

function getCurvePoints(x, y, r1, r2) {
    var kappa = 4 * ((Math.sqrt(2) - 1) / 3);
    var ox = (r1) * kappa, // control point offset horizontal
        oy = (r2) * kappa, // control point offset vertical
        xm = x + r1, // x-middle
        ym = y + r2; // y-middle
    return {
        topLeft: bezierCurve({x: x, y: ym}, {x: x, y: ym - oy}, {x: xm - ox, y: y}, {x: xm, y: y}),
        topRight: bezierCurve({x: x, y: y}, {x: x + ox,y: y}, {x: xm, y: ym - oy}, {x: xm, y: ym}),
        bottomRight: bezierCurve({x: xm, y: y}, {x: xm, y: y + oy}, {x: x + ox, y: ym}, {x: x, y: ym}),
        bottomLeft: bezierCurve({x: xm, y: ym}, {x: xm - ox, y: ym}, {x: x, y: y + oy}, {x: x, y:y})
    };
}

function calculateCurvePoints(bounds, borderRadius, borders) {
    var x = bounds.left,
        y = bounds.top,
        width = bounds.width,
        height = bounds.height,

        tlh = borderRadius[0][0] < width / 2 ? borderRadius[0][0] : width / 2,
        tlv = borderRadius[0][1] < height / 2 ? borderRadius[0][1] : height / 2,
        trh = borderRadius[1][0] < width / 2 ? borderRadius[1][0] : width / 2,
        trv = borderRadius[1][1] < height / 2 ? borderRadius[1][1] : height / 2,
        brh = borderRadius[2][0] < width / 2 ? borderRadius[2][0] : width / 2,
        brv = borderRadius[2][1] < height / 2 ? borderRadius[2][1] : height / 2,
        blh = borderRadius[3][0] < width / 2 ? borderRadius[3][0] : width / 2,
        blv = borderRadius[3][1] < height / 2 ? borderRadius[3][1] : height / 2;

    var topWidth = width - trh,
        rightHeight = height - brv,
        bottomWidth = width - brh,
        leftHeight = height - blv;

    return {
        topLeftOuter: getCurvePoints(x, y, tlh, tlv).topLeft.subdivide(0.5),
        topLeftInner: getCurvePoints(x + borders[3].width, y + borders[0].width, Math.max(0, tlh - borders[3].width), Math.max(0, tlv - borders[0].width)).topLeft.subdivide(0.5),
        topRightOuter: getCurvePoints(x + topWidth, y, trh, trv).topRight.subdivide(0.5),
        topRightInner: getCurvePoints(x + Math.min(topWidth, width + borders[3].width), y + borders[0].width, (topWidth > width + borders[3].width) ? 0 :trh - borders[3].width, trv - borders[0].width).topRight.subdivide(0.5),
        bottomRightOuter: getCurvePoints(x + bottomWidth, y + rightHeight, brh, brv).bottomRight.subdivide(0.5),
        bottomRightInner: getCurvePoints(x + Math.min(bottomWidth, width - borders[3].width), y + Math.min(rightHeight, height + borders[0].width), Math.max(0, brh - borders[1].width),  brv - borders[2].width).bottomRight.subdivide(0.5),
        bottomLeftOuter: getCurvePoints(x, y + leftHeight, blh, blv).bottomLeft.subdivide(0.5),
        bottomLeftInner: getCurvePoints(x + borders[3].width, y + leftHeight, Math.max(0, blh - borders[3].width), blv - borders[2].width).bottomLeft.subdivide(0.5)
    };
}

function bezierCurve(start, startControl, endControl, end) {
    var lerp = function (a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t
        };
    };

    return {
        start: start,
        startControl: startControl,
        endControl: endControl,
        end: end,
        subdivide: function(t) {
            var ab = lerp(start, startControl, t),
                bc = lerp(startControl, endControl, t),
                cd = lerp(endControl, end, t),
                abbc = lerp(ab, bc, t),
                bccd = lerp(bc, cd, t),
                dest = lerp(abbc, bccd, t);
            return [bezierCurve(start, ab, abbc, dest), bezierCurve(dest, bccd, cd, end)];
        },
        curveTo: function(borderArgs) {
            borderArgs.push(["bezierCurve", startControl.x, startControl.y, endControl.x, endControl.y, end.x, end.y]);
        },
        curveToReversed: function(borderArgs) {
            borderArgs.push(["bezierCurve", endControl.x, endControl.y, startControl.x, startControl.y, start.x, start.y]);
        }
    };
}

function drawSide(borderData, radius1, radius2, outer1, inner1, outer2, inner2) {
    var borderArgs = [];

    if (radius1[0] > 0 || radius1[1] > 0) {
        borderArgs.push(["line", outer1[1].start.x, outer1[1].start.y]);
        outer1[1].curveTo(borderArgs);
    } else {
        borderArgs.push([ "line", borderData.c1[0], borderData.c1[1]]);
    }

    if (radius2[0] > 0 || radius2[1] > 0) {
        borderArgs.push(["line", outer2[0].start.x, outer2[0].start.y]);
        outer2[0].curveTo(borderArgs);
        borderArgs.push(["line", inner2[0].end.x, inner2[0].end.y]);
        inner2[0].curveToReversed(borderArgs);
    } else {
        borderArgs.push(["line", borderData.c2[0], borderData.c2[1]]);
        borderArgs.push(["line", borderData.c3[0], borderData.c3[1]]);
    }

    if (radius1[0] > 0 || radius1[1] > 0) {
        borderArgs.push(["line", inner1[1].end.x, inner1[1].end.y]);
        inner1[1].curveToReversed(borderArgs);
    } else {
        borderArgs.push(["line", borderData.c4[0], borderData.c4[1]]);
    }

    return borderArgs;
}

function parseCorner(borderArgs, radius1, radius2, corner1, corner2, x, y) {
    if (radius1[0] > 0 || radius1[1] > 0) {
        borderArgs.push(["line", corner1[0].start.x, corner1[0].start.y]);
        corner1[0].curveTo(borderArgs);
        corner1[1].curveTo(borderArgs);
    } else {
        borderArgs.push(["line", x, y]);
    }

    if (radius2[0] > 0 || radius2[1] > 0) {
        borderArgs.push(["line", corner2[0].start.x, corner2[0].start.y]);
    }
}

function negativeZIndex(container) {
    return container.cssInt("zIndex") < 0;
}

function positiveZIndex(container) {
    return container.cssInt("zIndex") > 0;
}

function zIndex0(container) {
    return container.cssInt("zIndex") === 0;
}

function inlineLevel(container) {
    return ["inline", "inline-block", "inline-table"].indexOf(container.css("display")) !== -1;
}

function isStackingContext(container) {
    return (container instanceof StackingContext);
}

function hasText(container) {
    return container.node.data.trim().length > 0;
}

function noLetterSpacing(container) {
    return (/^(normal|none|0px)$/.test(container.parent.css("letterSpacing")));
}

function getBorderRadiusData(container) {
    return ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map(function(side) {
        var value = container.css('border' + side + 'Radius');
        var arr = value.split(" ");
        if (arr.length <= 1) {
            arr[1] = arr[0];
        }
        return arr.map(asInt);
    });
}

function renderableNode(node) {
    return (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE);
}

function isPositionedForStacking(container) {
    var position = container.css("position");
    var zIndex = (["absolute", "relative", "fixed"].indexOf(position) !== -1) ? container.css("zIndex") : "auto";
    return zIndex !== "auto";
}

function isPositioned(container) {
    return container.css("position") !== "static";
}

function isFloating(container) {
    return container.css("float") !== "none";
}

function isInlineBlock(container) {
    return ["inline-block", "inline-table"].indexOf(container.css("display")) !== -1;
}

function not(callback) {
    var context = this;
    return function() {
        return !callback.apply(context, arguments);
    };
}

function isElement(container) {
    return container.node.nodeType === Node.ELEMENT_NODE;
}

function isPseudoElement(container) {
    return container.isPseudoElement === true;
}

function isTextNode(container) {
    return container.node.nodeType === Node.TEXT_NODE;
}

function zIndexSort(contexts) {
    return function(a, b) {
        return (a.cssInt("zIndex") + (contexts.indexOf(a) / contexts.length)) - (b.cssInt("zIndex") + (contexts.indexOf(b) / contexts.length));
    };
}

function hasOpacity(container) {
    return container.getOpacity() < 1;
}

function asInt(value) {
    return parseInt(value, 10);
}

function getWidth(border) {
    return border.width;
}

function nonIgnoredElement(nodeContainer) {
    return (nodeContainer.node.nodeType !== Node.ELEMENT_NODE || ["SCRIPT", "HEAD", "TITLE", "OBJECT", "BR", "OPTION"].indexOf(nodeContainer.node.nodeName) === -1);
}

function flatten(arrays) {
    return [].concat.apply([], arrays);
}

function stripQuotes(content) {
    var first = content.substr(0, 1);
    return (first === content.substr(content.length - 1) && first.match(/'|"/)) ? content.substr(1, content.length - 2) : content;
}

function getWords(characters) {
    var words = [], i = 0, onWordBoundary = false, word;
    while(characters.length) {
        if (isWordBoundary(characters[i]) === onWordBoundary) {
            word = characters.splice(0, i);
            if (word.length) {
                words.push(punycode.ucs2.encode(word));
            }
            onWordBoundary =! onWordBoundary;
            i = 0;
        } else {
            i++;
        }

        if (i >= characters.length) {
            word = characters.splice(0, i);
            if (word.length) {
                words.push(punycode.ucs2.encode(word));
            }
        }
    }
    return words;
}

function isWordBoundary(characterCode) {
    return [
        32, // <space>
        13, // \r
        10, // \n
        9, // \t
        45 // -
    ].indexOf(characterCode) !== -1;
}

function hasUnicode(string) {
    return (/[^\u0000-\u00ff]/).test(string);
}

module.exports = NodeParser;

},{"./color":3,"./fontmetrics":7,"./log":13,"./nodecontainer":14,"./pseudoelementcontainer":18,"./stackingcontext":21,"./textcontainer":25,"./utils":26,"punycode":1}],16:[function(_dereq_,module,exports){
var XHR = _dereq_('./xhr');
var utils = _dereq_('./utils');
var log = _dereq_('./log');
var createWindowClone = _dereq_('./clone');
var decode64 = utils.decode64;

function Proxy(src, proxyUrl, document) {
    var supportsCORS = ('withCredentials' in new XMLHttpRequest());
    if (!proxyUrl) {
        return Promise.reject("No proxy configured");
    }
    var callback = createCallback(supportsCORS);
    var url = createProxyUrl(proxyUrl, src, callback);

    return supportsCORS ? XHR(url) : (jsonp(document, url, callback).then(function(response) {
        return decode64(response.content);
    }));
}
var proxyCount = 0;

function ProxyURL(src, proxyUrl, document) {
    var supportsCORSImage = ('crossOrigin' in new Image());
    var callback = createCallback(supportsCORSImage);
    var url = createProxyUrl(proxyUrl, src, callback);
    return (supportsCORSImage ? Promise.resolve(url) : jsonp(document, url, callback).then(function(response) {
        return "data:" + response.type + ";base64," + response.content;
    }));
}

function jsonp(document, url, callback) {
    return new Promise(function(resolve, reject) {
        var s = document.createElement("script");
        var cleanup = function() {
            delete window.html2canvas.proxy[callback];
            document.body.removeChild(s);
        };
        window.html2canvas.proxy[callback] = function(response) {
            cleanup();
            resolve(response);
        };
        s.src = url;
        s.onerror = function(e) {
            cleanup();
            reject(e);
        };
        document.body.appendChild(s);
    });
}

function createCallback(useCORS) {
    return !useCORS ? "html2canvas_" + Date.now() + "_" + (++proxyCount) + "_" + Math.round(Math.random() * 100000) : "";
}

function createProxyUrl(proxyUrl, src, callback) {
    return proxyUrl + "?url=" + encodeURIComponent(src) + (callback.length ? "&callback=html2canvas.proxy." + callback : "");
}

function documentFromHTML(src) {
    return function(html) {
        var parser = new DOMParser(), doc;
        try {
            doc = parser.parseFromString(html, "text/html");
        } catch(e) {
            log("DOMParser not supported, falling back to createHTMLDocument");
            doc = document.implementation.createHTMLDocument("");
            try {
                doc.open();
                doc.write(html);
                doc.close();
            } catch(ee) {
                log("createHTMLDocument write not supported, falling back to document.body.innerHTML");
                doc.body.innerHTML = html; // ie9 doesnt support writing to documentElement
            }
        }

        var b = doc.querySelector("base");
        if (!b || !b.href.host) {
            var base = doc.createElement("base");
            base.href = src;
            doc.head.insertBefore(base, doc.head.firstChild);
        }

        return doc;
    };
}

function loadUrlDocument(src, proxy, document, width, height, options) {
    return new Proxy(src, proxy, window.document).then(documentFromHTML(src)).then(function(doc) {
        return createWindowClone(doc, document, width, height, options, 0, 0);
    });
}

exports.Proxy = Proxy;
exports.ProxyURL = ProxyURL;
exports.loadUrlDocument = loadUrlDocument;

},{"./clone":2,"./log":13,"./utils":26,"./xhr":28}],17:[function(_dereq_,module,exports){
var ProxyURL = _dereq_('./proxy').ProxyURL;

function ProxyImageContainer(src, proxy) {
    var link = document.createElement("a");
    link.href = src;
    src = link.href;
    this.src = src;
    this.image = new Image();
    var self = this;
    this.promise = new Promise(function(resolve, reject) {
        self.image.crossOrigin = "Anonymous";
        self.image.onload = resolve;
        self.image.onerror = reject;

        new ProxyURL(src, proxy, document).then(function(url) {
            self.image.src = url;
        })['catch'](reject);
    });
}

module.exports = ProxyImageContainer;

},{"./proxy":16}],18:[function(_dereq_,module,exports){
var NodeContainer = _dereq_('./nodecontainer');

function PseudoElementContainer(node, parent, type) {
    NodeContainer.call(this, node, parent);
    this.isPseudoElement = true;
    this.before = type === ":before";
}

PseudoElementContainer.prototype.cloneTo = function(stack) {
    PseudoElementContainer.prototype.cloneTo.call(this, stack);
    stack.isPseudoElement = true;
    stack.before = this.before;
};

PseudoElementContainer.prototype = Object.create(NodeContainer.prototype);

PseudoElementContainer.prototype.appendToDOM = function() {
    if (this.before) {
        this.parent.node.insertBefore(this.node, this.parent.node.firstChild);
    } else {
        this.parent.node.appendChild(this.node);
    }
    this.parent.node.className += " " + this.getHideClass();
};

PseudoElementContainer.prototype.cleanDOM = function() {
    this.node.parentNode.removeChild(this.node);
    this.parent.node.className = this.parent.node.className.replace(this.getHideClass(), "");
};

PseudoElementContainer.prototype.getHideClass = function() {
    return this["PSEUDO_HIDE_ELEMENT_CLASS_" + (this.before ? "BEFORE" : "AFTER")];
};

PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE = "___html2canvas___pseudoelement_before";
PseudoElementContainer.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER = "___html2canvas___pseudoelement_after";

module.exports = PseudoElementContainer;

},{"./nodecontainer":14}],19:[function(_dereq_,module,exports){
var log = _dereq_('./log');

function Renderer(width, height, images, options, document) {
    this.width = width;
    this.height = height;
    this.images = images;
    this.options = options;
    this.document = document;
}

Renderer.prototype.renderImage = function(container, bounds, borderData, imageContainer) {
    var paddingLeft = container.cssInt('paddingLeft'),
        paddingTop = container.cssInt('paddingTop'),
        paddingRight = container.cssInt('paddingRight'),
        paddingBottom = container.cssInt('paddingBottom'),
        borders = borderData.borders;

    var width = bounds.width - (borders[1].width + borders[3].width + paddingLeft + paddingRight);
    var height = bounds.height - (borders[0].width + borders[2].width + paddingTop + paddingBottom);
    this.drawImage(
        imageContainer,
        0,
        0,
        imageContainer.image.width || width,
        imageContainer.image.height || height,
        bounds.left + paddingLeft + borders[3].width,
        bounds.top + paddingTop + borders[0].width,
        width,
        height
    );
};

Renderer.prototype.renderBackground = function(container, bounds, borderData) {
    if (bounds.height > 0 && bounds.width > 0) {
        this.renderBackgroundColor(container, bounds);
        this.renderBackgroundImage(container, bounds, borderData);
    }
};

Renderer.prototype.renderBackgroundColor = function(container, bounds) {
    var color = container.color("backgroundColor");
    if (!color.isTransparent()) {
        this.rectangle(bounds.left, bounds.top, bounds.width, bounds.height, color);
    }
};

Renderer.prototype.renderBorders = function(borders) {
    borders.forEach(this.renderBorder, this);
};

Renderer.prototype.renderBorder = function(data) {
    if (!data.color.isTransparent() && data.args !== null) {
        this.drawShape(data.args, data.color);
    }
};

Renderer.prototype.renderBackgroundImage = function(container, bounds, borderData) {
    var backgroundImages = container.parseBackgroundImages();
    backgroundImages.reverse().forEach(function(backgroundImage, index, arr) {
        switch(backgroundImage.method) {
        case "url":
            var image = this.images.get(backgroundImage.args[0]);
            if (image) {
                this.renderBackgroundRepeating(container, bounds, image, arr.length - (index+1), borderData);
            } else {
                log("Error loading background-image", backgroundImage.args[0]);
            }
            break;
        case "linear-gradient":
        case "gradient":
            var gradientImage = this.images.get(backgroundImage.value);
            if (gradientImage) {
                this.renderBackgroundGradient(gradientImage, bounds, borderData);
            } else {
                log("Error loading background-image", backgroundImage.args[0]);
            }
            break;
        case "none":
            break;
        default:
            log("Unknown background-image type", backgroundImage.args[0]);
        }
    }, this);
};

Renderer.prototype.renderBackgroundRepeating = function(container, bounds, imageContainer, index, borderData) {
    var size = container.parseBackgroundSize(bounds, imageContainer.image, index);
    var position = container.parseBackgroundPosition(bounds, imageContainer.image, index, size);
    var repeat = container.parseBackgroundRepeat(index);
    switch (repeat) {
    case "repeat-x":
    case "repeat no-repeat":
        this.backgroundRepeatShape(imageContainer, position, size, bounds, bounds.left + borderData[3], bounds.top + position.top + borderData[0], 99999, size.height, borderData);
        break;
    case "repeat-y":
    case "no-repeat repeat":
        this.backgroundRepeatShape(imageContainer, position, size, bounds, bounds.left + position.left + borderData[3], bounds.top + borderData[0], size.width, 99999, borderData);
        break;
    case "no-repeat":
        this.backgroundRepeatShape(imageContainer, position, size, bounds, bounds.left + position.left + borderData[3], bounds.top + position.top + borderData[0], size.width, size.height, borderData);
        break;
    default:
        this.renderBackgroundRepeat(imageContainer, position, size, {top: bounds.top, left: bounds.left}, borderData[3], borderData[0]);
        break;
    }
};

module.exports = Renderer;

},{"./log":13}],20:[function(_dereq_,module,exports){
var Renderer = _dereq_('../renderer');
var LinearGradientContainer = _dereq_('../lineargradientcontainer');
var log = _dereq_('../log');

function CanvasRenderer(width, height) {
    Renderer.apply(this, arguments);
    this.canvas = this.options.canvas || this.document.createElement("canvas");
    if (!this.options.canvas) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    this.ctx = this.canvas.getContext("2d");
    this.taintCtx = this.document.createElement("canvas").getContext("2d");
    this.ctx.textBaseline = "bottom";
    this.variables = {};
    log("Initialized CanvasRenderer with size", width, "x", height);
}

CanvasRenderer.prototype = Object.create(Renderer.prototype);

CanvasRenderer.prototype.setFillStyle = function(fillStyle) {
    this.ctx.fillStyle = typeof(fillStyle) === "object" && !!fillStyle.isColor ? fillStyle.toString() : fillStyle;
    return this.ctx;
};

CanvasRenderer.prototype.rectangle = function(left, top, width, height, color) {
    this.setFillStyle(color).fillRect(left, top, width, height);
};

CanvasRenderer.prototype.circle = function(left, top, size, color) {
    this.setFillStyle(color);
    this.ctx.beginPath();
    this.ctx.arc(left + size / 2, top + size / 2, size / 2, 0, Math.PI*2, true);
    this.ctx.closePath();
    this.ctx.fill();
};

CanvasRenderer.prototype.circleStroke = function(left, top, size, color, stroke, strokeColor) {
    this.circle(left, top, size, color);
    this.ctx.strokeStyle = strokeColor.toString();
    this.ctx.stroke();
};

CanvasRenderer.prototype.drawShape = function(shape, color) {
    this.shape(shape);
    this.setFillStyle(color).fill();
};

CanvasRenderer.prototype.taints = function(imageContainer) {
    if (imageContainer.tainted === null) {
        this.taintCtx.drawImage(imageContainer.image, 0, 0);
        try {
            this.taintCtx.getImageData(0, 0, 1, 1);
            imageContainer.tainted = false;
        } catch(e) {
            this.taintCtx = document.createElement("canvas").getContext("2d");
            imageContainer.tainted = true;
        }
    }

    return imageContainer.tainted;
};

CanvasRenderer.prototype.drawImage = function(imageContainer, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!this.taints(imageContainer) || this.options.allowTaint) {
        this.ctx.drawImage(imageContainer.image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
};

CanvasRenderer.prototype.clip = function(shapes, callback, context) {
    this.ctx.save();
    shapes.filter(hasEntries).forEach(function(shape) {
        this.shape(shape).clip();
    }, this);
    callback.call(context);
    this.ctx.restore();
};

CanvasRenderer.prototype.shape = function(shape) {
    this.ctx.beginPath();
    shape.forEach(function(point, index) {
        if (point[0] === "rect") {
            this.ctx.rect.apply(this.ctx, point.slice(1));
        } else {
            this.ctx[(index === 0) ? "moveTo" : point[0] + "To" ].apply(this.ctx, point.slice(1));
        }
    }, this);
    this.ctx.closePath();
    return this.ctx;
};

CanvasRenderer.prototype.font = function(color, style, variant, weight, size, family) {
    this.setFillStyle(color).font = [style, variant, weight, size, family].join(" ").split(",")[0];
};

CanvasRenderer.prototype.fontShadow = function(color, offsetX, offsetY, blur) {
    this.setVariable("shadowColor", color.toString())
        .setVariable("shadowOffsetY", offsetX)
        .setVariable("shadowOffsetX", offsetY)
        .setVariable("shadowBlur", blur);
};

CanvasRenderer.prototype.clearShadow = function() {
    this.setVariable("shadowColor", "rgba(0,0,0,0)");
};

CanvasRenderer.prototype.setOpacity = function(opacity) {
    this.ctx.globalAlpha = opacity;
};

CanvasRenderer.prototype.setTransform = function(transform) {
    this.ctx.translate(transform.origin[0], transform.origin[1]);
    this.ctx.transform.apply(this.ctx, transform.matrix);
    this.ctx.translate(-transform.origin[0], -transform.origin[1]);
};

CanvasRenderer.prototype.setVariable = function(property, value) {
    if (this.variables[property] !== value) {
        this.variables[property] = this.ctx[property] = value;
    }

    return this;
};

CanvasRenderer.prototype.text = function(text, left, bottom) {
    this.ctx.fillText(text, left, bottom);
};

CanvasRenderer.prototype.backgroundRepeatShape = function(imageContainer, backgroundPosition, size, bounds, left, top, width, height, borderData) {
    var shape = [
        ["line", Math.round(left), Math.round(top)],
        ["line", Math.round(left + width), Math.round(top)],
        ["line", Math.round(left + width), Math.round(height + top)],
        ["line", Math.round(left), Math.round(height + top)]
    ];
    this.clip([shape], function() {
        this.renderBackgroundRepeat(imageContainer, backgroundPosition, size, bounds, borderData[3], borderData[0]);
    }, this);
};

CanvasRenderer.prototype.renderBackgroundRepeat = function(imageContainer, backgroundPosition, size, bounds, borderLeft, borderTop) {
    var offsetX = Math.round(bounds.left + backgroundPosition.left + borderLeft), offsetY = Math.round(bounds.top + backgroundPosition.top + borderTop);
    this.setFillStyle(this.ctx.createPattern(this.resizeImage(imageContainer, size), "repeat"));
    this.ctx.translate(offsetX, offsetY);
    this.ctx.fill();
    this.ctx.translate(-offsetX, -offsetY);
};

CanvasRenderer.prototype.renderBackgroundGradient = function(gradientImage, bounds) {
    if (gradientImage instanceof LinearGradientContainer) {
        var gradient = this.ctx.createLinearGradient(
            bounds.left + bounds.width * gradientImage.x0,
            bounds.top + bounds.height * gradientImage.y0,
            bounds.left +  bounds.width * gradientImage.x1,
            bounds.top +  bounds.height * gradientImage.y1);
        gradientImage.colorStops.forEach(function(colorStop) {
            gradient.addColorStop(colorStop.stop, colorStop.color.toString());
        });
        this.rectangle(bounds.left, bounds.top, bounds.width, bounds.height, gradient);
    }
};

CanvasRenderer.prototype.resizeImage = function(imageContainer, size) {
    var image = imageContainer.image;
    if(image.width === size.width && image.height === size.height) {
        return image;
    }

    var ctx, canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, size.width, size.height );
    return canvas;
};

function hasEntries(array) {
    return array.length > 0;
}

module.exports = CanvasRenderer;

},{"../lineargradientcontainer":12,"../log":13,"../renderer":19}],21:[function(_dereq_,module,exports){
var NodeContainer = _dereq_('./nodecontainer');

function StackingContext(hasOwnStacking, opacity, element, parent) {
    NodeContainer.call(this, element, parent);
    this.ownStacking = hasOwnStacking;
    this.contexts = [];
    this.children = [];
    this.opacity = (this.parent ? this.parent.stack.opacity : 1) * opacity;
}

StackingContext.prototype = Object.create(NodeContainer.prototype);

StackingContext.prototype.getParentStack = function(context) {
    var parentStack = (this.parent) ? this.parent.stack : null;
    return parentStack ? (parentStack.ownStacking ? parentStack : parentStack.getParentStack(context)) : context.stack;
};

module.exports = StackingContext;

},{"./nodecontainer":14}],22:[function(_dereq_,module,exports){
function Support(document) {
    this.rangeBounds = this.testRangeBounds(document);
    this.cors = this.testCORS();
    this.svg = this.testSVG();
}

Support.prototype.testRangeBounds = function(document) {
    var range, testElement, rangeBounds, rangeHeight, support = false;

    if (document.createRange) {
        range = document.createRange();
        if (range.getBoundingClientRect) {
            testElement = document.createElement('boundtest');
            testElement.style.height = "123px";
            testElement.style.display = "block";
            document.body.appendChild(testElement);

            range.selectNode(testElement);
            rangeBounds = range.getBoundingClientRect();
            rangeHeight = rangeBounds.height;

            if (rangeHeight === 123) {
                support = true;
            }
            document.body.removeChild(testElement);
        }
    }

    return support;
};

Support.prototype.testCORS = function() {
    return typeof((new Image()).crossOrigin) !== "undefined";
};

Support.prototype.testSVG = function() {
    var img = new Image();
    var canvas = document.createElement("canvas");
    var ctx =  canvas.getContext("2d");
    img.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'></svg>";

    try {
        ctx.drawImage(img, 0, 0);
        canvas.toDataURL();
    } catch(e) {
        return false;
    }
    return true;
};

module.exports = Support;

},{}],23:[function(_dereq_,module,exports){
var XHR = _dereq_('./xhr');
var decode64 = _dereq_('./utils').decode64;

function SVGContainer(src) {
    this.src = src;
    this.image = null;
    var self = this;

    this.promise = this.hasFabric().then(function() {
        return (self.isInline(src) ? Promise.resolve(self.inlineFormatting(src)) : XHR(src));
    }).then(function(svg) {
        return new Promise(function(resolve) {
            window.html2canvas.svg.fabric.loadSVGFromString(svg, self.createCanvas.call(self, resolve));
        });
    });
}

SVGContainer.prototype.hasFabric = function() {
    return !window.html2canvas.svg || !window.html2canvas.svg.fabric ? Promise.reject(new Error("html2canvas.svg.js is not loaded, cannot render svg")) : Promise.resolve();
};

SVGContainer.prototype.inlineFormatting = function(src) {
    return (/^data:image\/svg\+xml;base64,/.test(src)) ? this.decode64(this.removeContentType(src)) : this.removeContentType(src);
};

SVGContainer.prototype.removeContentType = function(src) {
    return src.replace(/^data:image\/svg\+xml(;base64)?,/,'');
};

SVGContainer.prototype.isInline = function(src) {
    return (/^data:image\/svg\+xml/i.test(src));
};

SVGContainer.prototype.createCanvas = function(resolve) {
    var self = this;
    return function (objects, options) {
        var canvas = new window.html2canvas.svg.fabric.StaticCanvas('c');
        self.image = canvas.lowerCanvasEl;
        canvas
            .setWidth(options.width)
            .setHeight(options.height)
            .add(window.html2canvas.svg.fabric.util.groupSVGElements(objects, options))
            .renderAll();
        resolve(canvas.lowerCanvasEl);
    };
};

SVGContainer.prototype.decode64 = function(str) {
    return (typeof(window.atob) === "function") ? window.atob(str) : decode64(str);
};

module.exports = SVGContainer;

},{"./utils":26,"./xhr":28}],24:[function(_dereq_,module,exports){
var SVGContainer = _dereq_('./svgcontainer');

function SVGNodeContainer(node, _native) {
    this.src = node;
    this.image = null;
    var self = this;

    this.promise = _native ? new Promise(function(resolve, reject) {
        self.image = new Image();
        self.image.onload = resolve;
        self.image.onerror = reject;
        self.image.src = "data:image/svg+xml," + (new XMLSerializer()).serializeToString(node);
        if (self.image.complete === true) {
            resolve(self.image);
        }
    }) : this.hasFabric().then(function() {
        return new Promise(function(resolve) {
            window.html2canvas.svg.fabric.parseSVGDocument(node, self.createCanvas.call(self, resolve));
        });
    });
}

SVGNodeContainer.prototype = Object.create(SVGContainer.prototype);

module.exports = SVGNodeContainer;

},{"./svgcontainer":23}],25:[function(_dereq_,module,exports){
var NodeContainer = _dereq_('./nodecontainer');

function TextContainer(node, parent) {
    NodeContainer.call(this, node, parent);
}

TextContainer.prototype = Object.create(NodeContainer.prototype);

TextContainer.prototype.applyTextTransform = function() {
    this.node.data = this.transform(this.parent.css("textTransform"));
};

TextContainer.prototype.transform = function(transform) {
    var text = this.node.data;
    switch(transform){
        case "lowercase":
            return text.toLowerCase();
        case "capitalize":
            return text.replace(/(^|\s|:|-|\(|\))([a-z])/g, capitalize);
        case "uppercase":
            return text.toUpperCase();
        default:
            return text;
    }
};

function capitalize(m, p1, p2) {
    if (m.length > 0) {
        return p1 + p2.toUpperCase();
    }
}

module.exports = TextContainer;

},{"./nodecontainer":14}],26:[function(_dereq_,module,exports){
exports.smallImage = function smallImage() {
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
};

exports.bind = function(callback, context) {
    return function() {
        return callback.apply(context, arguments);
    };
};

/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

exports.decode64 = function(base64) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var len = base64.length, i, encoded1, encoded2, encoded3, encoded4, byte1, byte2, byte3;

    var output = "";

    for (i = 0; i < len; i+=4) {
        encoded1 = chars.indexOf(base64[i]);
        encoded2 = chars.indexOf(base64[i+1]);
        encoded3 = chars.indexOf(base64[i+2]);
        encoded4 = chars.indexOf(base64[i+3]);

        byte1 = (encoded1 << 2) | (encoded2 >> 4);
        byte2 = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        byte3 = ((encoded3 & 3) << 6) | encoded4;
        if (encoded3 === 64) {
            output += String.fromCharCode(byte1);
        } else if (encoded4 === 64 || encoded4 === -1) {
            output += String.fromCharCode(byte1, byte2);
        } else{
            output += String.fromCharCode(byte1, byte2, byte3);
        }
    }

    return output;
};

exports.getBounds = function(node) {
    if (node.getBoundingClientRect) {
        var clientRect = node.getBoundingClientRect();
        var width = node.offsetWidth == null ? clientRect.width : node.offsetWidth;
        return {
            top: clientRect.top,
            bottom: clientRect.bottom || (clientRect.top + clientRect.height),
            right: clientRect.left + width,
            left: clientRect.left,
            width:  width,
            height: node.offsetHeight == null ? clientRect.height : node.offsetHeight
        };
    }
    return {};
};

exports.offsetBounds = function(node) {
    var parent = node.offsetParent ? exports.offsetBounds(node.offsetParent) : {top: 0, left: 0};

    return {
        top: node.offsetTop + parent.top,
        bottom: node.offsetTop + node.offsetHeight + parent.top,
        right: node.offsetLeft + parent.left + node.offsetWidth,
        left: node.offsetLeft + parent.left,
        width: node.offsetWidth,
        height: node.offsetHeight
    };
};

exports.parseBackgrounds = function(backgroundImage) {
    var whitespace = ' \r\n\t',
        method, definition, prefix, prefix_i, block, results = [],
        mode = 0, numParen = 0, quote, args;
    var appendResult = function() {
        if(method) {
            if (definition.substr(0, 1) === '"') {
                definition = definition.substr(1, definition.length - 2);
            }
            if (definition) {
                args.push(definition);
            }
            if (method.substr(0, 1) === '-' && (prefix_i = method.indexOf('-', 1 ) + 1) > 0) {
                prefix = method.substr(0, prefix_i);
                method = method.substr(prefix_i);
            }
            results.push({
                prefix: prefix,
                method: method.toLowerCase(),
                value: block,
                args: args,
                image: null
            });
        }
        args = [];
        method = prefix = definition = block = '';
    };
    args = [];
    method = prefix = definition = block = '';
    backgroundImage.split("").forEach(function(c) {
        if (mode === 0 && whitespace.indexOf(c) > -1) {
            return;
        }
        switch(c) {
        case '"':
            if(!quote) {
                quote = c;
            } else if(quote === c) {
                quote = null;
            }
            break;
        case '(':
            if(quote) {
                break;
            } else if(mode === 0) {
                mode = 1;
                block += c;
                return;
            } else {
                numParen++;
            }
            break;
        case ')':
            if (quote) {
                break;
            } else if(mode === 1) {
                if(numParen === 0) {
                    mode = 0;
                    block += c;
                    appendResult();
                    return;
                } else {
                    numParen--;
                }
            }
            break;

        case ',':
            if (quote) {
                break;
            } else if(mode === 0) {
                appendResult();
                return;
            } else if (mode === 1) {
                if (numParen === 0 && !method.match(/^url$/i)) {
                    args.push(definition);
                    definition = '';
                    block += c;
                    return;
                }
            }
            break;
        }

        block += c;
        if (mode === 0) {
            method += c;
        } else {
            definition += c;
        }
    });

    appendResult();
    return results;
};

},{}],27:[function(_dereq_,module,exports){
var GradientContainer = _dereq_('./gradientcontainer');

function WebkitGradientContainer(imageData) {
    GradientContainer.apply(this, arguments);
    this.type = imageData.args[0] === "linear" ? GradientContainer.TYPES.LINEAR : GradientContainer.TYPES.RADIAL;
}

WebkitGradientContainer.prototype = Object.create(GradientContainer.prototype);

module.exports = WebkitGradientContainer;

},{"./gradientcontainer":9}],28:[function(_dereq_,module,exports){
function XHR(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);

        xhr.onload = function() {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(new Error(xhr.statusText));
            }
        };

        xhr.onerror = function() {
            reject(new Error("Network Error"));
        };

        xhr.send();
    });
}

module.exports = XHR;

},{}]},{},[4])(4)
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
        "./media_overlay_data_injector", "./media_overlay_player", "../models/package", "../models/page_open_request",
        "./reflowable_view", "./scroll_view", "../models/style_collection", "../models/switches", "../models/trigger",
        "../models/viewer_settings", "../models/bookmark_data", "../models/node_range_info", "html2canvas"],
    function (Globals, $, _, EventEmitter, FixedView, Helpers, IFrameLoader, InternalLinksSupport,
              MediaOverlayDataInjector, MediaOverlayPlayer, Package, PageOpenRequest,
              ReflowableView, ScrollView, StyleCollection, Switches, Trigger,
              ViewerSettings, BookmarkData, NodeRangeInfo, Html2Canvas) {
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
    var _spine = undefined;
    var _viewerSettings = new ViewerSettings({});
    //styles applied to the container divs
    var _userStyles = new StyleCollection();
    //styles applied to the content documents
    var _bookStyles = new StyleCollection();
    var _internalLinksSupport = new InternalLinksSupport(this);
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

        Helpers.addTapEventHandler(_$el[0], function(e) {
            self.emit(Globals.Events.USER_DID_TAP);
            return true;
        });
        _currentView = self.createViewForType(desiredViewType, viewCreationParams);
        
        Globals.logEvent("READER_VIEW_CREATED", "EMIT", "reader_view.js");
        self.emit(Globals.Events.READER_VIEW_CREATED, desiredViewType);

        _currentView.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            
            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "ON", "reader_view.js (current view) [ " + spineItem.href + " ]");

            if (!Helpers.isIframeAlive($iframe[0])) return;

            // performance degrades with large DOM (e.g. word-level text-audio sync)
            _mediaOverlayDataInjector.attachMediaOverlayData($iframe, spineItem, _viewerSettings, function() {
                self.emit(Globals.Events.USER_DID_TAP);
            });

            _internalLinksSupport.processLinkElements($iframe, spineItem);

            var contentDoc = $iframe[0].contentDocument;
            Trigger.register(contentDoc);
            Switches.apply(contentDoc);

            var $imgs = $iframe.contents().find("img");

            if ($imgs[0]) {
                $imgs.css({ "-webkit-user-select": "none", "-webkit-touch-callout": "none", "-webkit-user-drag": "none" });
            }
            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "EMIT", "reader_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_LOADED, $iframe, spineItem);
            //console.log("initViewForItem: CONTENT_DOCUMENT_LOADED: isPlayingMediaOverlay() = " + self.isPlayingMediaOverlay() +
            //        ", _mediaOverlayPlayer.wasPausedBecauseNoAutoNextSmil() = " + _mediaOverlayPlayer.wasPausedBecauseNoAutoNextSmil());
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
    self.openPageLeft = function () {

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
    self.openPageRight = function () {

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
     * @property {(string|boolean)} syntheticSpread - "auto"|true|false
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

    this.goToPage = openPage;


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
     * Returns current selection partial Cfi, useful for workflows that need to check whether the user has selected something.
     *
     * @returns {object | undefined} partial cfi object or undefined if nothing is selected
     */
    this.getCurrentSelectionCfi = function() {
        if (self.plugins.highlights) {
            return self.plugins.highlights.getCurrentSelectionCfi();
        }
        return null;
    };

    /**
     * Creates a higlight based on given parameters
     *
     * @param {string} spineIdRef		Spine idref that defines the partial Cfi
     * @param {string} cfi				Partial CFI (withouth the indirection step) relative to the spine index
     * @param {string} id				Id of the highlight. must be unique
     * @param {string} type 			Name of the class selector rule in annotations stylesheet.
     * 									The style of the class will be applied to the created hightlight
     * @param {object} styles			Object representing CSS properties to be applied to the highlight.
     * 									e.g., to apply background color pass in: {'background-color': 'green'}
     *
     * @returns {object | undefined} partial cfi object of the created highlight
     */
    this.addHighlight = function(spineIdRef, cfi, id, type, styles) {
        if (self.plugins.highlights) {
            return self.plugins.highlights.addHighlight(spineIdRef, cfi, id, type, styles);
        }
        return null;
    };

    /**
     * Creates a higlight based on the current selection
     *
     * @param {string} id id of the highlight. must be unique
     * @param {string} type - name of the class selector rule in annotations.css file.
     * @param {object} styles - object representing CSS properties to be applied to the highlight.
     * e.g., to apply background color pass this {'background-color': 'green'}
     * @param {boolean} clearSelection - set to true to clear the current selection
     * after it is highlighted
     *
     * @returns {object | undefined} partial cfi object of the created highlight
     */
    this.addSelectionHighlight = function(id, type, styles, clearSelection) {
        if (self.plugins.highlights) {
            return self.plugins.highlights.addSelectionHighlight(id, type, styles, clearSelection);
        }
        return null;
    };

    /**
     * Removes a given highlight
     *
     * @param {string} id  The id associated with the highlight.
     *
     * @returns {undefined}
     *
     */
    this.removeHighlight = function(id) {
        if (self.plugins.highlights) {
            return self.plugins.highlights.removeHighlight(id);
        }
        return null;
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
        if (_mediaOverlayPlayer) {
            if (_mediaOverlayPlayer.isPlaying()) {
                _mediaOverlayPlayer.pause();
            }
            if (_mediaOverlayPlayer.iBooksAudioPlayerPlaying()) {
                _mediaOverlayPlayer.pauseiBooksAudioPlayer();
            }
        }
    };

    /**
     * Start/Resume playback of media overlays.
     */
    this.playMediaOverlay = function () {
        if (_mediaOverlayPlayer) {
            if (!_mediaOverlayPlayer.isPlaying()) {
                _mediaOverlayPlayer.playMediaOverlay();
            }
            if (_mediaOverlayPlayer.iBooksAudioPlayerPlaying()) {
                _mediaOverlayPlayer.pauseiBooksAudioPlayer();
            }
        }
    };

    /**
     * Reset media overlay
     */
    this.resetMediaOverlay = function() {
        if( _mediaOverlayPlayer) {
            self.pauseMediaOverlay();
            _mediaOverlayPlayer.reset();
        }
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
        self.emit(Globals.Events.VIEWPORT_DID_RESIZE);
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
            var package = readerView.package();
            var smil = package.media_overlay.smilAt(value.smilIndex);
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