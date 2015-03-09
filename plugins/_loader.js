/* Do not edit this 'define' block */
define(['epub-renderer/controllers/plugins_controller'], function (PluginsController) {
    return PluginsController;
});

/* Import/configure your plugins here on. */

require(['readium-plugins/annotations/main']);

require(['readium-plugins/example']);