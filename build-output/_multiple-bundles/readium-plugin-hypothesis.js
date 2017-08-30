/**
 * This plugin helps to properly load the Hypothes.is client with Readium.
 * Enable this plugin if you want to add the Hypothesis client to your reader
 * so that visitors can annotate EPUBs without having to install
 * the Hypothesis browser extension.
 */

define('readium_plugin_hypothesis/main',['readium_js_plugins'], function (Plugins) {

    var H_EMBED_URL = 'https://hypothes.is/embed.js';

    Plugins.register("hypothesis", function () {
        var self = this;

        // Request that the UI controls make space for the Hypothesis sidebar
        window.hypothesisConfig = function () {
            return {
                onLayoutChange: function(state) {
                    self.emit('offsetPageButton', state.width);
                    if (!state.expanded) {
                        self.emit('offsetNavBar', state.width);
                    }
                }
            };
        };

        // The script for Hypothesis needs to be included once
        // Readium has been fully loaded by the RequireJS/AMD shim.
        // We can do this here in this callback when this plugin is invoked.

        // Inject the script
        var script = document.createElement('script');
        script.setAttribute('src', H_EMBED_URL);
        script.setAttribute('async', 'true');
        document.head.appendChild(script);
    });
});

define('readium_plugin_hypothesis', ['readium_plugin_hypothesis/main'], function (main) { return main; });


define("readium-plugin-hypothesis", function(){});

require(["readium_plugin_hypothesis"]);

//# sourceMappingURL=readium-plugin-hypothesis.js.map