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

    console.log('Generating AMD cleaned bundle...');

    var fs = module.require('fs');
    var path = module.require('path');
    var rimraf = module.require('rimraf');
    var sorcery = module.require('sorcery');
    var Concat = module.require('concat-with-sourcemaps');
    var amdclean = module.require('amdclean');

    var outputPath = path.dirname(data.path);
    var outputFileName = path.basename(data.path);
    var rootPath = path.resolve(outputPath, '../../');
    
    var configDir = process.cwd()
        + "/"
        + process._RJS_Path_RelCwd__ConfigDir;
    
    var codePath = data.path;
    
    var mapPath = codePath + '.map';
    var map = fs.readFileSync(mapPath, 'utf8');
    var mapJSON = JSON.parse(map);
    mapJSON.sourceRoot = '../../';
    map = JSON.stringify(mapJSON);
    fs.writeFileSync(mapPath, map);
    var code = fs.readFileSync(codePath, 'utf8');
    var cleaned = amdclean.clean({
        'sourceMap': map,
        'code': fs.readFileSync(codePath, 'utf8'),
        'wrap': false, // do not use wrap together with escodegen.sourceMapWithCode since it breaks the logic
        'prefixTransform': function (postNormalizedModuleName, preNormalizedModuleName) {
            return '_' + postNormalizedModuleName;
        },
        'esprima': {
            'source': outputFileName // name of your file to appear in sourcemap
        },
        'escodegen': {
            'sourceMap': true,
            'sourceMapWithCode': true
        }
    });
    console.log("AMD cleaned bundle generated.");
    
    var cleanedOutputPath = path.resolve(outputPath, '../_umd-bundle');
    rimraf.sync(cleanedOutputPath);
    fs.mkdirSync(cleanedOutputPath);
    
    
    var newCodePath = path.join(cleanedOutputPath, outputFileName);
    var newMapPath = path.join(cleanedOutputPath, outputFileName + '.map');
    var newCode = cleaned.code;
    cleaned.map.sourceRoot = '../../';
    var newMap = cleaned.map.toString();
    
    var concat = new Concat(true, newCodePath, '\n');
    concat.add(null, fs.readFileSync(configDir + '/umd_wrapper_start.template'));
    concat.add(null, newCode, newMap);
    concat.add(null, 'return _' + data.name.replace(/-/g,'_') + ';');
    concat.add(null, fs.readFileSync(configDir + '/umd_wrapper_end.template'));
    concat.add(null, '//# sourceMappingURL=' + outputFileName + '.map');
    
    var concatenatedContent = concat.content.toString();
    var sourceMapForContent = concat.sourceMap;
    
    fs.writeFileSync(newCodePath, concatenatedContent);
    fs.writeFileSync(newMapPath, sourceMapForContent);
    
    rimraf.sync(outputPath); // Delete the original path as it was temporary
    
    console.log("UMD bundle created.");
    // var pathTo =  path.join(cleanedOutputPath, outputFileName);
    // var chain = sorcery.loadSync(pathTo, {
    //     content: {
    //         [newCodePath]: concatenatedContent,
    //         [codePath]: code,
    //     },
    //     sourcemaps: {
    //         [newMapPath]: sourceMapForContent,
    //         [mapPath]: map
    //     }
    // });
    // chain.writeSync(newCodePath);
    // console.log("UMD source map created.");
}
