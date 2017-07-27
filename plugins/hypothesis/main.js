/**
 * This plugin helps to properly load the Hypothes.is client with Readium.
 * Enable this plugin if you want to add the Hypothesis client to your reader
 * so that visitors can annotate EPUBs without having to install
 * the Hypothesis browser extension.
 */

define(['readium_js_plugins'], function (Plugins) {

    var H_EMBED_URL = 'https://hypothes.is/embed.js';

    Plugins.register("hypothesis", function () {
        // The script for Hypothesis needs to be included once
        // Readium has been fully loaded by the RequireJS/AMD shim.
        // We can do this here in this callback when this plugin is invoked.

        // Disable the AMD environment since it's not needed anymore at this point.
        // This is done because some third-party modules in Hypothesis use UMD
        // and will mistakenly try to use Readium's AMD shim, almond.js,
        // instead of the loader for Hypothesis.
        if (window.define && window.define.amd) {
            delete window.define.amd;
        }

        // Inject the script
        var script = document.createElement('script');
        script.setAttribute('src', H_EMBED_URL);
        document.head.appendChild(script);
    });
});
