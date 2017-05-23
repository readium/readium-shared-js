define(['readium_shared_js/globals', 'readium_js_plugins', 'jquery'], function (Globals, Plugins, $) {
    var config;
    Plugins.register("iframe-states-dispatch", function (api) {
        var self = this;
        var MooreaderApp = window.MooreaderApp;
        api.plugin.warn('Example warning. Used when this plugin is initialized.');

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            // console.log('spineItem',spineItem);
            window.$iframe = $iframe;
            // window.dispatchEvent(MooreaderApp.iframeLoaded);
        });

        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOAD_START, function ($iframe, spineItem) {
            // console.log('$iframe',$iframe)
            window.$iframe = $iframe;
            // window.dispatchEvent(MooreaderApp.iframeStartLoad);
        });

        // api.reader.on(ReadiumSDK.Events.READER_VIEW_CREATED, function ($iframe, spineItem) {
        //     var MooreaderApp = window.MooreaderApp;
        //     // window.$iframe = $iframe;
        //     alert('aaaaa');
        //     window.dispatchEvent(MooreaderApp.readerInitailized);
        // });

        api.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function ($iframe, spineItem) {
            var MooreaderApp = window.MooreaderApp;
            // window.$iframe = $iframe;
            // window.dispatchEvent(MooreaderApp.paginationChanged);
        });
    });
    return config;
});
