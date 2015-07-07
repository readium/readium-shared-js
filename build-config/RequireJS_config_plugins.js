//Do not modify this file, it is automatically generated.
if(process._RJS_isBrowser){var p=[],c=require.config;require.config=function(k){c.apply(require,arguments);var n=k.packages;n&&(p=n),require.config=c,window.setTimeout(function(){require(p.map(function(n){return n.name}),function(){console.log("Plugins loaded.")})},0)}}
require.config({packages:[
{
name: "readium_plugin_annotations",
location: process._RJS_rootDir(1) + "/plugins/annotations",
main: "main"
},
],
'paths': {
'backbone': process._RJS_rootDir(1) + '/node_modules/backbone/backbone'
}
});
