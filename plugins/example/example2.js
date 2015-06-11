define(['readium_shared_js/plugins_controller', 'jquery'], function (Plugins, $) {

    Plugins.register("pluginIdentifierHere", function (api) {
        var self = this;

        api.plugin.warn('Example warning. Used when this plugin is initialized.');

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            var contentDoc = $iframe[0].contentDocument;
            contentDoc.body.style.backgroundColor = "red";
            self.emit("exampleEvent", spineItem.idref + " was modified!");
        });

        api.extendReader(self);
    });
});
