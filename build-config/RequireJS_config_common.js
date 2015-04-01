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
    
    baseUrl: process._readium.baseUrl__readium_shared_js,
    
    paths:
    {
        "readium-shared-js":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../build-config/readium-shared-js',
            
        'readium-external-libs':
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../build-config/readium-external-libs',
        
        "readium-plugin-example":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../build-config/readium-plugin-example',
            
        "readium-plugin-annotations":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../build-config/readium-plugin-annotations',
        
        'plugins-controller':
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + "controllers/plugins_controller",
        
        
        // ------ NPM MODULEs
        
        RequireJS:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/requirejs/require',
        
        //text: '../node_modules/requirejs-text/text',
        
        jquery:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/jquery/dist/jquery',
        
        backbone:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + "../node_modules/backbone/backbone",
        
        underscore:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/underscore/underscore',

        URIjs:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/URIjs/src/URI',
            
        punycode:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/URIjs/src/punycode',
            
        SecondLevelDomains:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/URIjs/src/SecondLevelDomains',
            
        IPv6:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/URIjs/src/IPv6',
            
        jquerySizes:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/jquery-sizes/lib/jquery.sizes',

        domReady:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/domReady/domReady',

        //eventEmitter: '../node_modules/eventemitter3/index',
        eventEmitter:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../node_modules/eventemitter3/_rjs/index',
        //see pre-build npm task to wrap CommonJS into AMD: define(function(require, exports, module) { .... });

        
        
        // ------ LIBs
        
        'console_shim':
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../lib/console_shim',
        
        rangy:
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../lib/rangy/rangy',
            
        "rangy-core":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../lib/rangy/rangy-core',
            
        "rangy-textrange":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../lib/rangy/rangy-textrange',
            
        "rangy-highlighter":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../lib/rangy/rangy-highlighter',
            
        "rangy-cssclassapplier":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../lib/rangy/rangy-cssclassapplier',
            
        "rangy-position":
            process._readium.path__readium_shared_js + "/build-config/" + process._readium.baseUrl__readium_shared_js + "/"
            + '../lib/rangy/rangy-position'
    },

    // map:
    // {
    //     '*':
    //     {
    //         'epubCfi': 'readium-cfi-js'
    //     }
    // },
    
    wrapShim: false,

    shim:
    {
        // epubCfi:
        // {
        //     deps: ['jquery'],
        //     exports: 'EPUBcfi'
        // },

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