//Do not modify this file, it is automatically generated.
/*#TEMPLATE#
name: {"readium-plugin-{{NAME}}"},
create: true,
include: ["readium_plugin_{{NAME}}"],
exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],
insertRequire: ["readium_plugin_{{NAME}}"]
#TEMPLATE#*/
require.config({modules:[{
name: "readium-plugin-annotations",
create: true,
include: ["readium_plugin_annotations"],
exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],
insertRequire: ["readium_plugin_annotations"]
},{
name: "readium-plugin-example",
create: true,
include: ["readium_plugin_example"],
exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],
insertRequire: ["readium_plugin_example"]
}]});
