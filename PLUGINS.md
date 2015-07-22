## Creating a plugin

#### Minimal template
```js
define(["readium_js_plugins"], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {
        // Your plugin implementation here
    });
});
```

#### Relay a message to the plugin host
```js
define(["readium_js_plugins"], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {
        api.plugin.warn("Something weird happened.");
        api.plugin.error("Something bad happened!"); // This is fatal and will cause an exception
    });
});
```

#### Add handlers to Reader events
```js
define(["readium_js_plugins"], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            var contentDoc = $iframe[0].contentDocument;
            contentDoc.body.style.backgroundColor = "red";
        });
    });
});
```

#### Expose your own API to the Reader
```js
define(["readium_js_plugins"], function(Plugins) {

    Plugins.register("pluginIdentifierHere", function(api) {
        this.sayHello = function() {
            alert("Hello world!");
        };

        // Any member you add to `this` will be accessible with
        // `reader.plugins.pluginIdentifierHere`
    });
});
```

#### Emit your own events
```js
define(["readium_js_plugins"], function(Plugins) {

    Plugins.register("pluginIdentifierHere", function(api) {
        this.sayHello = function() {
            this.emit("hello", "Hello world!");
        };

        // Your plugin instance is mixed in with an Event Emitter.
        // Bind event handlers using `reader.plugins.pluginIdentifierHere.on(...)`
    });
});
```

## Including your plugin in Readium

1. Under `readium-shared-js/plugins`, make a folder named with your plugin's identifier and have your plugin's entry point in a `main.js` file inside that folder. For example: `readium-shared-js/plugins/pluginIdentifierHere/main.js`
2. Open up `plugins.cson` that's in `readium-shared-js/plugins` in an editor and add your plugin's identifier to the `plugins:` list.
3. If you are using git then you might notice that `plugins.cson` is tracked. If you would like to include your plugin without having to commit or edit this file you can create a new file in the `plugins` directory named `plugins-override.cson`. You can base it on this template:

```coffee
plugins:
  include: [
   # Plugins to include in addition to the ones listed in `plugins.cson`
  ]
  exclude: [
   # Plugins to exclude from the ones listen in `plugins.cson`
  ]

```

Your plugin should now be included next time you invoke the Readium build process or go through the development workflow.


## Advanced uses

#### Configuration values
You can include default and overridable configuration options in your plugins using this technique:
```js
define(["readium_js_plugins"], function(Plugins) {
    var config = {
        backgroundColor: "yellow"
    };

    Plugins.register("changeBackground", function(api) {
        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function($iframe, spineItem) {
            var contentDoc = $iframe[0].contentDocument;
            contentDoc.body.style.backgroundColor = config.backgroundColor;
        });
    });

    return config;
});
```

Your plugin's main module can be identified in RequireJS under this name:
`readium_plugin_pluginIdentifierHere`

So to bootstrap your plugin's configuration you can require it at certain points in your reading system's initialization:
Typically before the Readium.reader object is initialized.
```js
require(["readium_plugin_changeBackground"], function (config) {
    config.backgroundColor = "red";
});
```

In this example if the plugin was not configured in the require call (`require(["readium_plugin_changeBackground"]);`) the background color used will be `yellow` but if the value was set when the plugin was required it will be `red`.

#### Including libraries / other dependencies

Plugins have access to RequireJS and can load modules in AMD format.
Simply include other `.js` scripts in your plugin's folder and add references to them in your `require` or `define` calls.

For example,
given this file tree:
```
plugins/
├── myPlugin
│   ├── my_library.js
│   └── main.js
└── plugins.cson
```

Your `main.js` script could look like this:
```js
define(["readium_js_plugins", "./my_library"], function (Plugins, MyLibrary) {

    Plugins.register("myPlugin", function (api) {
        MyLibrary.doSomething();
    });
});
```

You can also include additional RequireJS declarations by creating a `rjs-config.js` file in the root of your plugins folder:
```js
require.config({
  paths: {
    "myLibrary": "lib/my_library"
  }
});
```
Any path you define will be relative to your plugin's folder.


#### Depending on other plugins

To make sure that plugins you depend on load before your own, you can pass in an array of the identifiers as an optional parameter of `Plugins.register`

```js
define(["readium_js_plugins"], function (Plugins) {

    Plugins.register("pluginIdentifierHere", ["pluginDependencyHere", "anotherPluginYouRelyOn"], function (api) {
        // Your plugin implementation here
    });
});
```
