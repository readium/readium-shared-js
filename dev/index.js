
require(["readium_shared_js/globalsSetup", "readium_shared_js/globals"], function (GlobalsSetup, Globals) {

    require(['readium_shared_js/views/reader_view'], function (ReaderView) {

        ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function(reader) {

            Globals.logEvent("PLUGINS_LOADED", "ON", "dev/index.js");
            
            // legacy (should be undefined / null)
            console.log(reader.plugins.annotations);
            
            // same as above, new implementation
            console.log(reader.plugins.highlights);

            // see plugins/example/
            console.log(reader.plugins.example);
        });

        $(document).ready(function () {


            ReadiumSDK.reader = new ReaderView(
            {
                needsFixedLayoutScalerWorkAround: false,
                el:"#viewport",
                annotationCSSUrl: undefined
            });

            Globals.logEvent("READER_INITIALIZED", "EMIT", "dev/index.js");
            ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
        });
    });
});
