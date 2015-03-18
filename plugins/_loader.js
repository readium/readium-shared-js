// -------------------------------------------    
/* Import + configure your plugins here */
// -------------------------------------------

define(['./annotations/main', './example'], function (annotationsPlugin, examplePlugin) {

examplePlugin.borderColor = "blue";
examplePlugin.backgroundColor = "cyan";

    
// below is an alternative method with require() instead of define(), but must use requirejs.config({ findNestedDependencies:true }) !
    
// require(['./annotations/main'], function (annotationsPlugin) {
// });

// require(['./example'], function (examplePlugin) {
// });
    
});
