define(['readium_shared_js/globals', 'readium_js_plugins', 'jquery', 'underscore'], function (Globals, Plugins, $, _) {

    /*** NOTE ***
    * This might work best (or only work at all) if the
    * `useSimpleLoader` config option is set to true
    * See ModuleConfig.js
    */

    Plugins.register("preloader", function (api) {
        var self = this;
        var hints = [];

        function insertHint(rel, href) {
            var hint = document.createElement("link");
            hint.rel = rel;
            // hint.as = "html";
            hint.href = href;

            document.head.appendChild(hint);
            return hint;
        }

        api.reader.on(Globals.Events.CONTENT_DOCUMENT_LOAD_START, _.debounce(function () {
            var loadedSpineItems = api.reader.getLoadedSpineItems();
            var spine = api.reader.spine();

            var headSpineItem = _.first(loadedSpineItems);
            var tailSpineItem = _.last(loadedSpineItems);

            var nextSpineItem = spine.nextItem(tailSpineItem);
            var prevSpineItem = spine.prevItem(headSpineItem);

            // Clean up previously inserted links
            _.each(hints, function (hint) {
                $(hint).remove();
            });
            hints = [];

            if (nextSpineItem) {
                hints.push(insertHint("prefetch", spine.package.resolveRelativeUrl(nextSpineItem.href)));
                hints.push(insertHint("prerender", spine.package.resolveRelativeUrl(nextSpineItem.href)));
            }
            if (prevSpineItem) {
                hints.push(insertHint("prefetch", spine.package.resolveRelativeUrl(prevSpineItem.href)));
                // It's seems too expensive (and not necessary?) to ask the
                // browser to also prerender the previous spine item
                // hints.push(insertHint("prerender", spine.package.resolveRelativeUrl(prevSpineItem.href)));
            }
        }, 100));
    });
});
