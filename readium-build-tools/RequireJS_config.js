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

(
function(thiz){

    console.log("========>");
    console.log("========> RJS bootstrap ...");
    console.log("========>");

    //console.log(thiz);
    console.log(process.cwd());
    //console.log(process.env);

    var fs = nodeRequire("fs");
    var path = nodeRequire("path");


    var args = process.argv.slice(3);
    console.log(args);

    // relative to process.cwd(), folder that contains this config file
    var configDir = args[0];
    var i = configDir.lastIndexOf("/");
    configDir = configDir.substr(0, i).replace(/\.\//g, '');
    console.log(configDir);
    process._RJS_Path_RelCwd__ConfigDir = configDir;

    process._RJS_Path_RelCwd__ConfigDir_nSlashes
        = process._RJS_Path_RelCwd__ConfigDir.split('/').length - 1;


    var configCustomTarget = undefined;
    var configOverrideTarget = undefined;
    process._RJS_isSingleBundle = false;
    process._RJS_isNpmBundle = false;

    process._RJS_isUgly = true;

    // For example, command line parameter after "npm run SCRIPT_NAME":
    //--readium-js-viewer:RJS_UGLY=no
    // or:
    //--readium-js:RJS_UGLY=NO
    // or:
    //--readium-shared-js:RJS_UGLY=false
    // or:
    //--readium-cfi-js:RJS_UGLY=FALSE
    //
    // ... or ENV shell variable, e.g. PowerShell:
    //Set-Item Env:RJS_UGLY no
    // e.g. MS-DOS:
    //SET RJS_UGLY=no 
    // e.g. OSX terminal:
    //RJS_UGLY=no npm run build
    //(temporary, command / process-specific ENV variable)
    // or:
    // export RJS_UGLY="false"; npm run build
    //(permanent env var)
    console.log('process.env.npm_package_config_RJS_UGLY:');
    console.log(process.env.npm_package_config_RJS_UGLY);
    console.log('process.env[RJS_UGLY]:');
    console.log(process.env['RJS_UGLY']);
    if (process.env.npm_package_config_RJS_UGLY)
            process.env['RJS_UGLY'] = process.env.npm_package_config_RJS_UGLY;

    if (typeof process.env['RJS_UGLY'] !== "undefined") {
        var ugly = process.env['RJS_UGLY'];
        ugly = ugly.toLowerCase();
        if (ugly === "false" || ugly === "no") {
            process._RJS_isUgly = false;
        } else {
            process._RJS_isUgly = true;
        }
    }

    for (var k = 1; k < args.length; k++) {
        var parameter = args[k];

        var token = "--rjs_bundle=";
        if (parameter.indexOf(token) == 0) {

             // single or multiple bundle target
            var configBundleType = parameter;
            configBundleType = configBundleType.substr(token.length);
            console.log(configBundleType);
            process._RJS_isSingleBundle = (configBundleType === "single" || configBundleType === "npm" ? true : false);
            process._RJS_isNpmBundle = (configBundleType === "npm" ? true : false);

            process._RJS__configTarget = (process._RJS_isNpmBundle ? "npm-bundle" : (process._RJS_isSingleBundle ? "single-bundle" : "multiple-bundles"));
        }

        token = "--rjs_configCustomTarget=";
        if (parameter.indexOf(token) == 0) {

            configCustomTarget = parameter;
            configCustomTarget = configCustomTarget.substr(token.length);
            console.log(configCustomTarget);
        }

        token = "--rjs_configOverrideTarget=";
        if (parameter.indexOf(token) == 0) {

            configOverrideTarget = parameter;
            configOverrideTarget = configOverrideTarget.substr(token.length);
            console.log(configOverrideTarget);
        }

        token = "--rjs_isUgly=";
        if (parameter.indexOf(token) == 0) {

            process._RJS_isUgly = parameter;
            process._RJS_isUgly = process._RJS_isUgly.substr(token.length);
            process._RJS_isUgly = process._RJS_isUgly.toLowerCase();
            if (process._RJS_isUgly === "false" || process._RJS_isUgly === "no") {
                process._RJS_isUgly = false;
            } else {
                process._RJS_isUgly = true;
            }
            console.log("Uglify: " + process._RJS_isUgly);
        }

        // token = "--rjs_mainConfigFile=";
        // if (parameter.indexOf(token) == 0) {

            // // relative to this config file, array of mainConfigFile(s)
            // mainConfigFile = parameter;
            // mainConfigFile = mainConfigFile.substr(token.length);
            // mainConfigFile = mainConfigFile.split(',');
            // console.log(mainConfigFile);
            // process._RJS_mainConfigFile = mainConfigFile;
        // }

        // token = "--rjs_sources=";
        // if (parameter.indexOf(token) == 0) {

            // // relative to process.cwd(), array of source folders
            // sources = parameter;
            // sources = sources.substr(token.length);
            // sources = sources.split(',');
            // console.log(sources);
        // }
    }


    // if (!process._RJS_isSingleBundle)
    // {
    //     // relative to process.cwd()
    //     var copiedSourcesDir = "/build-output/_SOURCES";
    //
    //     var fs = nodeRequire("fs");
    //
    //     var req = requirejs({
    //         context: 'build'
    //     });
    //     var nodeFile = req('node/file');
    //
    //     var regExpFilter= /\w/;
    //     var onlyCopyNew = false;
    //
    //     var destDir = process.cwd() + copiedSourcesDir;
    //     console.log("===> Destination source folder: " + destDir);
    // }

    // relative to this config file, points into the above sources folder,
    // which is located at the topmost level (where the build process is invoked from)
    process._RJS_baseUrl = function(level) {
        var n = process._RJS_Path_RelCwd__ConfigDir_nSlashes - level;

        var back = "..";
        for (var i = 0; i < n; i++) {
            back = back + "/..";
        }
        // console.log(level);
        // console.log(n);
        // console.log(back);

        return process._RJS_isSingleBundle ? back : (back + "/build-output/XXX"); //copiedSourcesDir
    };

    function rootDir(level) {
      var n = process._RJS_Path_RelCwd__ConfigDir_nSlashes - level;

      var folderPath = process._RJS_Path_RelCwd__ConfigDir.split('/');

      var forward = "";
      for (var i = 0; i < n; i++) {
          forward = forward + '/' + folderPath[i];
      }
      // console.log(level);
      // console.log(n);
      // console.log(forward);

      return forward;
    }

    // relative to the above baseUrl,
    // which is located at the topmost level (where the build process is invoked from)
    process._RJS_rootDir = function(level) {
        return (process._RJS_isSingleBundle ? "./" : "../..") + rootDir(level);
    };

    var mainConfigFile = [];


    var N = process._RJS_Path_RelCwd__ConfigDir_nSlashes + 1;
    for (var i = 0; i < N; i++) {
        var pathPrefix = "";

        for (var j = 0; j < i; j++) {
            pathPrefix = pathPrefix + "../";
        }
        pathPrefix = pathPrefix + "../build-config/";

        if (i == N-1 && !process._RJS_isSingleBundle)
        {
            mainConfigFile.push(pathPrefix + "RequireJS_config_multiple-bundles_external-libs.js");
        }

        if (!configOverrideTarget)
        {
            var configPluginsPath = path.join(process.cwd(), rootDir(i), "build-config", "RequireJS_config_plugins.js");
            var hasPluginsConfig = false;
            try {
                fs.accessSync(configPluginsPath);
                hasPluginsConfig = true;
            } catch (e) {
                // ignored
            }

            if (hasPluginsConfig) {

                var pluginsConfig = pathPrefix + "RequireJS_config_plugins.js";
                mainConfigFile.push(pluginsConfig);
                console.log("Plugins config:");
                console.log(configPluginsPath);
                console.log(pluginsConfig);

                var pluginsBundleConfig = pathPrefix + "RequireJS_config_plugins_"+ (process._RJS_isSingleBundle ? "single-bundle" : "multiple-bundles") + ".js";
                mainConfigFile.push(pluginsBundleConfig);
                console.log("Plugins bundle config:");
                console.log(pluginsBundleConfig);
            }
        }

        mainConfigFile.push(pathPrefix + "RequireJS_config_common.js");

        if (!configOverrideTarget)
        {
            mainConfigFile.push(pathPrefix + "RequireJS_config_" + process._RJS__configTarget + ((i == N-1) && configCustomTarget ? configCustomTarget : "") + ".js");
        }
        else if (i == N-1)
        {
            mainConfigFile.push(pathPrefix + "RequireJS_config_" + process._RJS__configTarget + configOverrideTarget + ".js");
        }

        // if (!process._RJS_isSingleBundle)
        // {
        //     var sourcesJsonPath = process.cwd() + "/" + process._RJS_Path_RelCwd__ConfigDir + "/" + pathPrefix + "RequireJS_sources.json";
        //     console.log(sourcesJsonPath);
        //
        //     var sourcesJson = fs.readFileSync(
        //         sourcesJsonPath,
        //         {encoding: 'utf-8'});
        //     var sources = JSON.parse(sourcesJson).sourceDirsToCopy;
        //     for (var k = 0; k < sources.length; k++) {
        //         var srcDir = sources[k];
        //         srcDir = process.cwd() + "/" + process._RJS_Path_RelCwd__ConfigDir + "/" + pathPrefix + srcDir;
        //         console.log("... Copying directory contents: " + srcDir);
        //
        //         nodeFile.copyDir(srcDir, destDir, regExpFilter, onlyCopyNew);
        //     }
        // }
    }

    console.log(mainConfigFile);
    process._RJS_mainConfigFile = mainConfigFile;


    //process.exit(1);
    //throw new Error("HALT");

    return true;
}(this)
?
{
    mainConfigFile: process._RJS_mainConfigFile,


    generateSourceMaps: true,
    sourceMapIncludeSources: true,
    
    preserveLicenseComments: process._RJS_isUgly ? false : true,

    optimize: process._RJS_isUgly ? "uglify2" : "none",
    
    uglify2: process._RJS_isUgly ? {
      mangle: true,
      compress: true,
      'screw-ie8': true,
      
      sourceMapIncludeSources: true
      
    } : undefined,
/*
      output: {
        beautify: true,
      },
      beautify: {
        semicolons: false
      }
*/


    inlineText: true,

    //xhtml: true, //document.createElementNS()

    /* http://requirejs.org/docs/api.html#config-waitSeconds */
    waitSeconds: 0,

    removeCombined: true,

    //findNestedDependencies: true,

    wrap: false,

    wrapShim: false,

    normalizeDirDefines: 'all',

    onBuildRead: function (moduleName, path, contents) {
        //console.log("onBuildRead: " + moduleName + " -- " + path);

        return contents;
    },

    onBuildWrite: function (moduleName, path, contents) {
        //console.log("onBuildWrite: " + moduleName + " -- " + path);

        return contents;
    },

    // MUST be in root config file because of access to context-dependent 'config'
    onModuleBundleComplete: function(data) {

        var filePath = process.cwd()
            + "/"
            + process._RJS_Path_RelCwd__ConfigDir
            + "/RequireJS_function_"
            + process._RJS__configTarget
            + "_complete.js";

        var fs = nodeRequire("fs");
        fs.readFile(
            filePath,
            {encoding: 'utf-8'},
            function(err, fileContents) {
                if (!err) {
                    var func = eval("("+fileContents+")");
                    return func(data);
                } else {
                    console.log(err);
                }
            }
        );
    }
}
:
function(){console.log("NOOP");return {};}()
)
