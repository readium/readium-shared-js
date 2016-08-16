define(['readium_shared_js/globals', 'readium_js_plugins', 'jquery'], function (Globals, Plugins, $) {
    var config = {
        backgroundColor: "yellow",
        borderColor: "red"
    };

    Plugins.register("example", function (api) {
        var self = this;

        api.plugin.warn('Example warning. Used when this plugin is initialized.');

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            Globals.logEvent("CONTENT_DOCUMENT_LOADED", "ON", "plugins/example/main.js [ " + spineItem.href + " ]");
            
            var div = '<div id="" style="position: absolute; left: 0; top: 0; border: 1px solid '
                + config.borderColor + '; background-color: ' + config.backgroundColor + ';">'
                + 'spineItemIdref: ' + spineItem.idref + '</div>';
            $(div).appendTo($iframe[0].contentDocument.documentElement).on('click', function () {
                
                Globals.logEvent("exampleEvent", "EMIT", "example_plugin/main.js");
                self.emit("exampleEvent", api.reader.bookmarkCurrentPage());
            });
        });

        $("body").css({border: '10px solid ' + config.borderColor});
    });

    return config;
});
