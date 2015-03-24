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
    stubModules: ['text'],
    
    optimize: "none",
    generateSourceMaps: true,
    preserveLicenseComments: true,
    
    /*
    optimize: "uglify2",
    generateSourceMaps: true,
    preserveLicenseComments: false,

    // uglify2: {
    //   mangle: true,
    //   except: [
    //         'zzzzz'
    //   ],
    //   output: {
    //     beautify: true,
    //   },
    //   beautify: {
    //     semicolons: false
    //   }
    // },
    */

    name: process._readium.targetName + "_all",
    
    include: ["readium-shared-js", "readium-plugin-example", "readium-plugin-annotations"],
    
    // Path is relative to this config file
    out: process._readium.buildOutputPath + "build-output/_single-bundle/" + process._readium.targetName + "_all.js",
    
    insertRequire: ["globalsSetup", "readium-plugin-annotations"],
    
    // Paths are relative to the baseUrl (defined in the common config file)
    packages: [
        {
            name: "plugin-annotations",
            location: "../plugins/annotations",
            main: "main"
        },
        {
            name: "plugin-example",
            location: "../plugins",
            main: "example"
        },
        {
            name: process._readium.targetName + "_all",
            location: '../node_modules/almond',
            main: 'almond'
        }
    ]
});