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

    /* http://requirejs.org/docs/api.html#config-waitSeconds */
    waitSeconds: 1,

    baseUrl: '..',

    packages: [
        {
            name: "readium_shared_js",
            location: readium_shared_js_PATH_PREFIX + "js",

            main: "globalsSetup"
        },

        {
            name: "plugin_annotations",
            location:
                readium_shared_js_PATH_PREFIX + 'plugins/annotations',

            main: "main"
        },

        {
            name: "plugin_example",
            location:
                readium_shared_js_PATH_PREFIX + 'plugins',

            main: "example"
        }
    ],

//    map:
//    {
//        '*': {
//            "readium_shared_js":
//                '../js'
//        }
//    },

    paths:
    {
        "readium-shared-js":
            readium_shared_js_PATH_PREFIX + 'build-config/readium-shared-js',

        "readium-plugin-example":
            readium_shared_js_PATH_PREFIX + 'build-config/readium-plugin-example',

        "readium-plugin-annotations":
            readium_shared_js_PATH_PREFIX + 'build-config/readium-plugin-annotations',

        // ------ NPM MODULEs

        backbone:
            readium_shared_js_PATH_PREFIX + 'node_modules/backbone/backbone',

        underscore:
            readium_shared_js_PATH_PREFIX + 'node_modules/underscore/underscore',

        URIjs:
            readium_shared_js_PATH_PREFIX + 'node_modules/URIjs/src/URI',

        punycode:
            readium_shared_js_PATH_PREFIX + 'node_modules/URIjs/src/punycode',

        SecondLevelDomains:
            readium_shared_js_PATH_PREFIX + 'node_modules/URIjs/src/SecondLevelDomains',

        IPv6:
            readium_shared_js_PATH_PREFIX + 'node_modules/URIjs/src/IPv6',

        jquerySizes:
            readium_shared_js_PATH_PREFIX + 'node_modules/jquery-sizes/lib/jquery.sizes',

        domReady:
            readium_shared_js_PATH_PREFIX + 'node_modules/domReady/domReady',

        //eventEmitter: '../node_modules/eventemitter3/index',
        eventEmitter:
            readium_shared_js_PATH_PREFIX + 'node_modules/eventemitter3/_rjs/index',
        //see pre-build npm task to wrap CommonJS into AMD: define(function(require, exports, module) { .... });



        // ------ LIBs

        'console_shim':
            readium_shared_js_PATH_PREFIX + 'lib/console_shim',

        rangy:
            readium_shared_js_PATH_PREFIX + 'lib/rangy/rangy',

        "rangy-core":
            readium_shared_js_PATH_PREFIX + 'lib/rangy/rangy-core',

        "rangy-textrange":
            readium_shared_js_PATH_PREFIX + 'lib/rangy/rangy-textrange',

        "rangy-highlighter":
            readium_shared_js_PATH_PREFIX + 'lib/rangy/rangy-highlighter',

        "rangy-cssclassapplier":
            readium_shared_js_PATH_PREFIX + 'lib/rangy/rangy-cssclassapplier',

        "rangy-position":
            readium_shared_js_PATH_PREFIX + 'lib/rangy/rangy-position'
    },

    shim:
    {
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
