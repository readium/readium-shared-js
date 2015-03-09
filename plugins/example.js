define(['readium-plugins', 'jquery'], function (Plugins, $) {
    var config = {
        borderColor: "red"
    };

    Plugins.register("example", function (api) {

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            var div = '<div id="" style="position: absolute; left: 0; top: 0; border: 1px solid '
                + config.borderColor
                + ';">spineItemIdref: ' + spineItem.idref
                + '</div>';
            $(div).appendTo($iframe[0].contentDocument.documentElement).on('click', function () {
                this.emit("exampleEvent");
            });
        });

        api.extendReader(this);
    });

    return config;
});