## Creating a plugin

#### Minimal template
```js
define(['readium_plugins'], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {
        // Your plugin implementation here
    });
});
```

#### Relay a message to the plugin host
```js
define(['readium_plugins'], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {
        api.plugin.warn('Something weird happened.');
        api.plugin.error('Something bad happened!'); // This is fatal and will cause an exception
    });
});
```

#### Add handlers to Reader events
```js
define(['readium_plugins'], function (Plugins) {

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
define(['readium_plugins'], function(Plugins) {

    Plugins.register("pluginIdentifierHere", function(api) {
        this.sayHello = function() {
            alert('Hello world!');
        };

        // Any member you add to `this` will be accessible with
        // `reader.plugins.pluginIdentifierHere`
    });
});
```

#### Emit your own events
```js
define(['readium_plugins'], function(Plugins) {

    Plugins.register("pluginIdentifierHere", function(api) {
        this.sayHello = function() {
            this.emit('hello', 'Hello world!');
        };

        // Your plugin instance is mixed in with an Event Emitter
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

Depending on how you are using Readium, you may need to invoke an NPM script to rebuild the aggregated Readium.js library file to include your plugin during "compile time"


## Advanced uses

#### Configuration values
You can include default and overridable configuration options in your plugins using this technique:
```js
define(['readium_plugins'], function(Plugins) {
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

In `_loader.js`:
```js
require(['readium_plugins/changeBackground'], function (config) {
    config.backgroundColor = "red";
});
```

By default if the plugin is not configured in `_loader.js` (`require(['readium_plugins/changeBackground']);`) the background color used will be `yellow`
if the value is set in `_loader.js` like shown above it will be `red`.

#### Including your own libraries

Since we can take advantage of RequireJS it is easy to include and use your own set of third party libraries:
...Todo: finish this section...
It is best that you include all your libraries in a folder along with your main plugin source file.
