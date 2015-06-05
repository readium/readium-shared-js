//Do not modify this file, it is automatically generated.
require.config({
    modules:
    [
        {
            name: "readium-plugin-example",
            create: true,
            include: ["readium_plugin_example"],
            exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],
            insertRequire: ["readium_plugin_example"]
        },

        {
            name: "readium-plugin-annotations",
            create: true,
            include: ["readium_plugin_annotations"],
            exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],
            insertRequire: ["readium_plugin_annotations"]
        }
    ]
});
