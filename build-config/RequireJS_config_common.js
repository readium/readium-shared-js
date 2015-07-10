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

    baseUrl: process._RJS_baseUrl(1),

    packages: [
        {
            name: "readium_shared_js",
            location:
                process._RJS_rootDir(1) + '/js',

            main: "globalsSetup"
        },
        {
            name: "readium_plugins",
            location:
                process._RJS_rootDir(1) + '/js/',

            main: "plugins_controller"
        }
    ],

    paths:
    {
        // ------ NPM MODULEs

        underscore:
            process._RJS_rootDir(1) + '/node_modules/underscore/underscore',

        URIjs:
            process._RJS_rootDir(1) + '/node_modules/URIjs/src/URI',

        punycode:
            process._RJS_rootDir(1) + '/node_modules/URIjs/src/punycode',

        SecondLevelDomains:
            process._RJS_rootDir(1) + '/node_modules/URIjs/src/SecondLevelDomains',

        IPv6:
            process._RJS_rootDir(1) + '/node_modules/URIjs/src/IPv6',

        jquerySizes:
            process._RJS_rootDir(1) + '/node_modules/jquery-sizes/lib/jquery.sizes',

        domReady:
            process._RJS_rootDir(1) + '/node_modules/domReady/domReady',

        eventEmitter:
            process._RJS_rootDir(1) + '/node_modules/eventemitter3/_rjs/index',
        //see prepare:patch npm build task (converts CommonJS to AMD => define(function(require, exports, module) { .... });)



        // ------ LIBs

        'console_shim':
            process._RJS_rootDir(1) + '/lib/console_shim',

        rangy:
            process._RJS_rootDir(1) + '/lib/rangy/rangy',

        "rangy-core":
            process._RJS_rootDir(1) + '/lib/rangy/rangy-core',

        "rangy-textrange":
            process._RJS_rootDir(1) + '/lib/rangy/rangy-textrange',

        "rangy-highlighter":
            process._RJS_rootDir(1) + '/lib/rangy/rangy-highlighter',

        "rangy-cssclassapplier":
            process._RJS_rootDir(1) + '/lib/rangy/rangy-cssclassapplier',

        "rangy-position":
            process._RJS_rootDir(1) + '/lib/rangy/rangy-position'
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
