Note: This feature is not yet in `master`, it is available as a work in progress branch `feature/pluginsX`
## Creating a plugin

#### Minimal template
```
define(['readium_plugins'], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {
        //plugin implementation here
    });
});
```

#### Talking back to the plugin loader
```
define(['readium_plugins'], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {
        api.plugin.warn('Something weird happened.')
        api.plugin.error('Something bad happened! This will be fatal.')
    });
});
```

#### Hook on to Reader events
```
define(['readium_plugins'], function (Plugins) {

    Plugins.register("pluginIdentifierHere", function (api) {

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            var contentDoc = $iframe[0].contentDocument;
            contentDoc.body.style.backgroundColor = "red";
        });
    });
});
```

#### Provide your own API
```
define(['readium_plugins'], function(Plugins) {

    Plugins.register("pluginIdentifierHere", function(api) {
        this.sayHello = function() {
            alert('Hello world!');
        };

        api.extendReader(this);
    });
});
```
Your plugin interface can be accessed using `reader.plugins.pluginIdentifierHere`

#### Emit your own events
```
define(['readium_plugins'], function(Plugins) {

    Plugins.register("pluginIdentifierHere", function(api) {
        this.sayHello = function() {
            this.emit('hello', 'Hello world!');
        };

        // This is required to set up your event emitter on the reader,
        // even if you do not provide an API.
        api.extendReader(this);
    });
});
```

## Including your plugin in Readium

1. Add your plugin.js file inside the `readium-shared-js/plugins` folder
2. Open up `_loader.js` and include your plugin's require call: `require(['readium_plugins/myPlugin']);`
3. Depending on how you are using Readium, you may need to invoke the grunt task to rebuild the aggregated Readium.js library file to include your plugin during "compile time"


## Advanced uses

#### Configuration values
You can include default and overridable configuration options in your plugins using this method:
```
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
```
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
