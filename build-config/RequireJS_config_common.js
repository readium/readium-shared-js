//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.

require.config({
    //xhtml: true, //document.createElementNS()
    
    /* http://requirejs.org/docs/api.html#config-waitSeconds */
    waitSeconds: 0,
    
    removeCombined: true,
    
    //findNestedDependencies: true,
            
    wrap: false,
    
    inlineText: true,
    
    // Path is relative to this config file
    baseUrl: "../js",
    
    // Paths are relative to the above baseUrl
    paths:
    {
        "readium-shared-js": '../build-config/readium-shared-js',
        'readium-external-libs': '../build-config/readium-external-libs',
        
        "readium-plugin-example": '../build-config/readium-plugin-example',
        "readium-plugin-annotations": '../build-config/readium-plugin-annotations',
        
        'plugins-controller': "controllers/plugins_controller",
        
        
        // ------ NPM MODULEs
        
        RequireJS: '../node_modules/requirejs/require',
        
        //text: '../node_modules/requirejs-text/text',
        
        jquery: '../node_modules/jquery/dist/jquery',
        
        backbone: "../node_modules/backbone/backbone",
        
        underscore: '../node_modules/underscore/underscore',

        URIjs: '../node_modules/URIjs/src/URI',
        punycode: '../node_modules/URIjs/src/punycode',
        SecondLevelDomains: '../node_modules/URIjs/src/SecondLevelDomains',
        IPv6: '../node_modules/URIjs/src/IPv6',
        
        jquerySizes: '../node_modules/jquery-sizes/lib/jquery.sizes',

        domReady : '../node_modules/domReady/domReady',

        //eventEmitter: '../node_modules/eventemitter3/index',
        eventEmitter: '../node_modules/eventemitter3/_rjs/index',
        //see pre-build npm task to wrap CommonJS into AMD: define(function(require, exports, module) { .... });

        
        
        // ------ LIBs
        
        'console_shim': '../lib/console_shim',
        
        rangy : '../lib/rangy/rangy',
        "rangy-core" : '../lib/rangy/rangy-core',
        "rangy-textrange" : '../lib/rangy/rangy-textrange',
        "rangy-highlighter" : '../lib/rangy/rangy-highlighter',
        "rangy-cssclassapplier" : '../lib/rangy/rangy-cssclassapplier',
        "rangy-position" : '../lib/rangy/rangy-position',
        
        
        // TODO: move to an NPM package dependency (fetched directly from readium-cfi-js repository)
        epubCfi: '../lib/epub_cfi'
        
    },
    
    wrapShim: false,

    shim:
    {
        epubCfi:
        {
            deps: ['jquery'],
            exports: 'EPUBcfi'
        },

        jquerySizes:
        {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        
        'rangy-core':
        {
            deps: ["domReady"],
            
            init:
            function(domReady)
            {
                var rangi = this.rangy;
                domReady(
                function()
                {
                    rangi.init();
                });
                return this.rangy;
            },
            
            exports: "rangy" // global.rangy
        },
        'rangy-textrange':
        {
            deps: ["rangy-core"],
            exports: "rangy.modules.TextRange"
        },
        'rangy-highlighter':
        {
            deps: ["rangy-core"],
            exports: "rangy.modules.Highlighter"
        },
        'rangy-cssclassapplier':
        {
            deps: ["rangy-core"],
            exports: "rangy.modules.ClassApplier"
        },
        'rangy-position':
        {
            deps: ["rangy-core"],
            exports: "rangy.modules.Position"
        }
       /*
       'rangy/rangy-serializer': {
         deps: ["rangy/rangy-core"],
         exports: "rangy.modules.Serializer"
       },
       'rangy/rangy-selectionsaverestore': {
         deps: ["rangy/rangy-core"],
         exports: "rangy.modules.SaveRestore"
       },
       */
    }
});