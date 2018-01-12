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

function(data) {
    console.log("========> onModuleBundleComplete");
    console.log(data.name);

    var fs = nodeRequire("fs");

    for (var i = 0; i < config.modules.length; i++) {

        if (config.modules[i].name !== data.name)
            continue;

        //__dirname is RequireJS node_modules bin folder
        var rootPath = process.cwd() + "/build-output/_multiple-bundles/";
        rootPath = rootPath.replace(/\\/g, '/');
        console.log(rootPath);

        var path = config.modules[i].layer.buildPathMap[config.modules[i].name];
        if (!path)
        {
            path = config.modules[i]._buildPath;
        }
        console.log(path);

        // var shortpath = path.replace(rootPath, './');
        // console.log(shortpath);

        // var pathConfig = {};
        // pathConfig[config.modules[i].name] = shortpath;

        data.includedModuleNames = [];

        for (var j = 0; j < data.included.length; j++) {

            var fullPath = rootPath + data.included[j];

            for (var modulePath in config.modules[i].layer.buildFileToModule) {
                if (fullPath === modulePath) {
                    data.includedModuleNames.push(config.modules[i].layer.buildFileToModule[modulePath]);
                    break;
                }
            }
        }

        if (config.modules[i].include)
        {
            for (var j = 0; j < config.modules[i].include.length; j++)
            {
                var included = config.modules[i].include[j];

                var found = false;
                for (var k = 0; k < data.includedModuleNames.length; k++)
                {
                    var alreadyIncluded = data.includedModuleNames[k];
                    if (alreadyIncluded == included)
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    data.includedModuleNames.push(included);
                }
            }
        }

        var bundleConfig = {};
        bundleConfig[config.modules[i].name] = [];

        //for (var moduleName in config.modules[i].layer.modulesWithNames) {
        for (var j = 0; j < data.includedModuleNames.length; j++)
        {
            var moduleName = data.includedModuleNames[j];

            if (moduleName === config.modules[i].name)
                continue;

            bundleConfig[config.modules[i].name].push(moduleName);
        }

        bundleConfig[config.modules[i].name].sort(
            function(a, b)
            {
                return a == b ? 0 : a < b ? -1 : 1;
            }
        );
        for (var j = 0; j < bundleConfig[config.modules[i].name].length; j++)
        {
            var moduleName = bundleConfig[config.modules[i].name][j];
            console.log("## " + moduleName);
        }

        fs.writeFile(
            path + ".bundles.js",
            "require.config({" +
                //"paths: " + JSON.stringify(pathConfig) + ", " +
                "bundles: " + JSON.stringify(bundleConfig) + "});",
            function(error) {
                if (error) throw error;
            }
        );
    }
}
