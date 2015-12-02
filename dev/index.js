
require(["readium_shared_js/globalsSetup", "readium_shared_js/globals"], function (GlobalsSetup, Globals) {

    require(['readium_shared_js/views/reader_view'], function (ReaderView) {

        ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function(reader) {

            Globals.logEvent("ReadiumSDK.Events.PLUGINS_LOADED - ON - dev/index.js");
            
            // readium built-in (should have been require()'d outside this scope)
            console.log(reader.plugins.annotations);

            // external (require()'d via Dependency Injection, see examplePluginConfig function parameter passed above)
            console.log(reader.plugins.example);
        });

        $(document).ready(function () {


            ReadiumSDK.reader = new ReaderView(
            {
                needsFixedLayoutScalerWorkAround: false,
                el:"#viewport",
                annotationCSSUrl: undefined
            });

            Globals.logEvent("ReadiumSDK.Events.READER_INITIALIZED - EMIT - dev/index.js");
            ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
        });
    });
});
