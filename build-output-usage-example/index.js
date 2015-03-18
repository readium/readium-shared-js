
require(['views/reader_view'], function (ReaderView) {

    $(document).ready(function () {
        

        ReadiumSDK.reader = new ReaderView(
        {
            needsFixedLayoutScalerWorkAround: false,
            el:"#viewport",
            annotationCSSUrl: undefined
        });

        ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function() {
        
            console.log(ReadiumSDK.reader.plugins.annotations);
        });
        
        //Globals.emit(Globals.Events.READER_INITIALIZED, ReadiumSDK.reader);
        ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
    });
});