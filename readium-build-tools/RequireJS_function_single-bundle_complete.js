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
        var rootPath = process.cwd() + "/build-output/_single-bundle/";
        rootPath = rootPath.replace(/\\/g, '/');
        console.log(rootPath);

        var path = config.modules[i].out; //config.modules[i].layer.buildPathMap[config.modules[i].name];
        console.log(path);

        // var shortpath = path.replace(rootPath, './');
        // console.log(shortpath);

        // var pathConfig = {};
        // pathConfig[config.modules[i].name] = shortpath;

        var bundleConfig = {};
        bundleConfig[config.modules[i].name] = [];

        for (var moduleName in config.modules[i].layer.modulesWithNames) {
            bundleConfig[config.modules[i].name].push(moduleName);
        }
        for (var moduleName in config.modules[i].layer.needsDefine) {

            var found = false;
            for (var k = 0; k < bundleConfig[config.modules[i].name].length; k++)
            {
                var alreadyIncluded = bundleConfig[config.modules[i].name][k];
                if (alreadyIncluded == moduleName)
                {
                    found = true;
                    break;
                }
            }
            if (!found)
            {
                bundleConfig[config.modules[i].name].push(moduleName);
            }
        }

        if (config.modules[i].include)
        {
            for (var j = 0; j < config.modules[i].include.length; j++)
            {
                var included = config.modules[i].include[j];

                var found = false;
                for (var k = 0; k < bundleConfig[config.modules[i].name].length; k++)
                {
                    var alreadyIncluded = bundleConfig[config.modules[i].name][k];
                    if (alreadyIncluded == included)
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    bundleConfig[config.modules[i].name].push(included);
                }
            }
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
