
require(['views/reader_view', 'plugin-example'], function (ReaderView, examplePluginConfig) {

    examplePluginConfig.borderColor = "blue";
    examplePluginConfig.backgroundColor = "cyan";

    ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function() {
    
        // readium built-in
        console.log(ReadiumSDK.reader.plugins.annotations);
        
        // external
        console.log(ReadiumSDK.reader.plugins.example);
    });
    
    $(document).ready(function () {
        

        ReadiumSDK.reader = new ReaderView(
        {
            needsFixedLayoutScalerWorkAround: false,
            el:"#viewport",
            annotationCSSUrl: undefined
        });

        //Globals.emit(Globals.Events.READER_INITIALIZED, ReadiumSDK.reader);
        ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
    });
});