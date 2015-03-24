
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
            
            var bundleConfig = {};
            bundleConfig[config.modules[i].name] = [];
            
            //for (var moduleName in config.modules[i].layer.modulesWithNames) {
            for (var j = 0; j < data.includedModuleNames.length; j++) {
                var moduleName = data.includedModuleNames[j];
                
                if (moduleName === config.modules[i].name)
                    continue;
                
                bundleConfig[config.modules[i].name].push(moduleName);
                console.log(">> " + moduleName);
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