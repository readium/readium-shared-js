/* Do not edit this 'define' block */
define(['epub-renderer/controllers/plugins_controller'],
    function (PluginsController) {
        return new PluginsController();
    });

/* Import/configure your plugins here. */
require(['readium-plugins/annotations']);