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

function (data) {
    console.log("========> onModuleBundleComplete [amdclean]");
    var fs = module.require('fs');
    var path = module.require('path');
    var outputPath = path.dirname(data.path);
    var outputFileName = path.basename(data.path);
    var rootPath = path.resolve(outputPath, '../../');

    var packageJson = module.require(path.join(rootPath, 'package.json'));
    delete packageJson.files;
    delete packageJson.dependencies;
    delete packageJson.devDependencies;
    delete packageJson.scripts;

    packageJson.main = outputFileName;

    var configDir = process.cwd()
        + "/"
        + process._RJS_Path_RelCwd__ConfigDir;

    var amdclean = module.require('amdclean');
    var outputFile = data.path;
    var cleanedCode = amdclean.clean({
        'wrap': true,
        'filePath': outputFile,
        'prefixTransform': function (postNormalizedModuleName, preNormalizedModuleName) {
            return '_' + postNormalizedModuleName;
        }
    });
    cleanedCode = fs.readFileSync(configDir + '/npm_wrapper_start.template')
        + '\n' + cleanedCode + '\nreturn _' + data.name.replace(/-/g, '_') + ';\n'
        + fs.readFileSync(configDir + '/npm_wrapper_end.template');
    fs.writeFileSync(outputFile, cleanedCode);
    fs.unlinkSync(outputFile + '.map'); // Delete the source map, as it is incompatible :(

    fs.writeFileSync(path.join(outputPath, 'package.json'), JSON.stringify(packageJson, null, ' '));
}
