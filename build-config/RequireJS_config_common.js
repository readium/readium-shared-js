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

    baseUrl: process._RJS_baseUrl(0),

    packages: [
        {
            name: "readium_shared_js",
            location:
                process._RJS_rootDir(0) + '/js',

            main: "globalsSetup"
        }
    ],

    paths:
    {
        // ------ NPM MODULEs

        'readium_cfi_js':
            process._RJS_rootDir(0) + '/node_modules/readium-cfi-js/dist/readium-cfi.umd',

        "readium_js_plugins":
            process._RJS_rootDir(0) + '/js/plugins_controller',

        jquery:
            process._RJS_rootDir(0) + '/node_modules/jquery/dist/jquery',

        underscore:
            process._RJS_rootDir(0) + '/node_modules/underscore/underscore',

        URIjs:
            process._RJS_rootDir(0) + '/node_modules/urijs/src/URI',

        punycode:
            process._RJS_rootDir(0) + '/node_modules/urijs/src/punycode',

        SecondLevelDomains:
            process._RJS_rootDir(0) + '/node_modules/urijs/src/SecondLevelDomains',

        IPv6:
            process._RJS_rootDir(0) + '/node_modules/urijs/src/IPv6',

        jquerySizes:
            process._RJS_rootDir(0) + '/node_modules/jquery-sizes/lib/jquery.sizes',

        ResizeSensor:
            process._RJS_rootDir(0) + '/node_modules/css-element-queries/src/ResizeSensor',

        domReady:
            process._RJS_rootDir(0) + '/node_modules/domReady/domReady',

        eventEmitter:
            process._RJS_rootDir(0) + '/node_modules/eventemitter3/umd/eventemitter3.min',
        
        "es6-shim":
            process._RJS_rootDir(0) + '/node_modules/es6-shim/es6-shim',

        'cssom':
            process._RJS_rootDir(0) + '/node_modules/cssom/build/CSSOM',

        // ------ LIBs

        'console_shim':
            process._RJS_rootDir(0) + '/lib/console_shim'
    },

    shim:
    {
        cssom: {
            exports: 'CSSOM'
        }
    }
});
