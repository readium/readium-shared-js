var fs = require('fs');
var path = require('path');
var cson = require('cson');

console.log("========>");
console.log("========> Plugins bootstrap ...");
console.log("========>");

// TemplateEngine
// Copyright (C) 2013 Krasimir Tsonev
// http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
// Released under the MIT license.
var TemplateEngine = function(text, options) {
    var re = /<%([^%>]+)?%>/g,
        reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
        code = 'var r=[];\n',
        cursor = 0,
        match;
    var add = function(line, js) {
        js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '");\n' : '');
        return add;
    }
    while (match = re.exec(text)) {
        add(text.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(text.substr(cursor, text.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}

Object.deepExtend = function(destination, source) {
    for (var property in source) {
        if (source[property] && source[property].constructor &&
            source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            arguments.callee(destination[property], source[property]);
        } else {
            destination[property] = source[property];
        }
    }
    return destination;
};

// Modified from: https://github.com/chakrit/node-uneval
// node-uneval/index.js
// ----
// Approximation of uneval for node.js/v8.
// Convert objects into code.
// Don't use this unless you know all the things that could go wrong with this.
var unevalLevel = 0;
uneval = (function(undefined) {
  var util = require('util');

  return function uneval(obj, known) {
    var root = (known === undefined), result;
    known = known || [];

    // some values fail eval() if not wrapped in a ( ) parenthesises
    var wrapRoot = function(result) {
      return root ? ("(" + result + ")") : result;
    }

    // special objects
    if (obj === null)
      return "null";
    if (obj === undefined)
      return "undefined";
    if (obj !== obj) // isNaN does type coercion, so can't use that.
      return "NaN";
    if (obj === Infinity)
      return "Infinity";
    if (obj === -Infinity)
      return "-Infinity";

    // atoms
    switch (typeof obj) {
      case 'function':
        return wrapRoot(obj.toString());
      case 'string':
      case 'number':
      case 'boolean':
        return util.inspect(obj);
    }

    // circular reference check for non-atoms
    if (known.indexOf(obj) !== -1)
      throw new Error("Circular references detected while uneval()-ing.");

    known.push(obj);

    // specialized types
    if (obj instanceof Array)
      return "[" + obj.map(function(o) { return uneval(o, known); }).join(",\n") + "]";

    if (obj instanceof Date)
      return wrapRoot("new Date('" + obj.toString() + "')");

    // hashes
    var key, pairs = [];

    for (key in obj)
      pairs.push(uneval(key, known) + ": " + uneval(obj[key], known));

    return "{\n" + pairs.join(",\n") + "\n}";

  };

})();


var templates = {
    "RequireJS_config_plugins.js": '//Do not modify this file, it is automatically generated.\n' +
        'if(window._RJS_isBrowser){var p=[],c=require.config;require.config=function(e){c.apply(require,arguments);var r=e.packages;'+
        'r&&(p=r),require.config=c,window._RJS_pluginsList=p.map(function(e){return e.name})}}\n'+

        'require.config({packages:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '{\n' +
        'name: "readium_plugin_<%this.plugins[i]%>",\n' +
        'location: process._RJS_rootDir(0) + "/plugins/<%this.plugins[i]%>",\n' +
        'main: "main"\n' +
        '},\n' +
        '<%}%>' +

        '],'+
        '<%this.requireConfig%>'+
        '});\n',

    "RequireJS_config_plugins_multiple-bundles.js": '//Do not modify this file, it is automatically generated.\n' +
        'require.config({modules:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '{\n' +
        'name: "readium-plugin-<%this.plugins[i]%>",\n' +
        'create: true,\n' +
        'include: ["readium_plugin_<%this.plugins[i]%>"],\n' +
        'exclude: ["readium-external-libs", "readium-shared-js"],\n' +
        'insertRequire: ["readium_plugin_<%this.plugins[i]%>"]\n' +
        '},\n' +
        '<%}%>' +

        ']});\n',

    "RequireJS_config_plugins_single-bundle.js": '//Do not modify this file, it is automatically generated.\n' +
        'require.config({include:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '"readium_plugin_<%this.plugins[i]%>",\n' +
        '<%}%>' +

        '],insertRequire:[\n' +

        '<%for(var i in this.plugins) {%>' +
        '"readium_plugin_<%this.plugins[i]%>",\n' +
        '<%}%>' +

        ']});\n'
};

var pluginsDir = path.join(process.cwd(), 'plugins');

var pluginsCsonPathDefault = path.join(pluginsDir, 'plugins.cson');
var pluginsCsonDefault = fs.readFileSync(pluginsCsonPathDefault, {encoding: "utf8"});
pluginsCsonDefault = cson.parse(pluginsCsonDefault);


    var overridePlugins = true;

    // For example, command line parameter after "npm run SCRIPT_NAME":
    //--readium-js-viewer:RJS_PLUGINS_OVERRIDE=no
    // or:
    //--readium-shared-js:RJS_PLUGINS_OVERRIDE=false
    //
    // ... or ENV shell variable, e.g. PowerShell:
    //Set-Item Env:RJS_PLUGINS_OVERRIDE no
    // e.g. OSX terminal:
    //RJS_PLUGINS_OVERRIDE=no npm run build
    //(temporary, process-specific ENV variable)
    console.log('process.env.npm_package_config_RJS_PLUGINS_OVERRIDE:');
    console.log(process.env.npm_package_config_RJS_PLUGINS_OVERRIDE);
    console.log('process.env[RJS_PLUGINS_OVERRIDE]:');
    console.log(process.env['RJS_PLUGINS_OVERRIDE']);
    if ((typeof process.env['RJS_PLUGINS_OVERRIDE'] === "undefined") && process.env.npm_package_config_RJS_PLUGINS_OVERRIDE)
            process.env['RJS_PLUGINS_OVERRIDE'] = process.env.npm_package_config_RJS_PLUGINS_OVERRIDE;

    if (typeof process.env['RJS_PLUGINS_OVERRIDE'] !== "undefined") {
        var overridePlugins = process.env['RJS_PLUGINS_OVERRIDE'];
        overridePlugins = overridePlugins.toLowerCase();
        if (overridePlugins === "false" || overridePlugins === "no") {
            overridePlugins = false;
        } else {
            overridePlugins = true;
        }
    }


var pluginsCsonPathUser = path.join(pluginsDir, 'plugins-override.cson');
var pluginsCsonUser = null;
if (overridePlugins) {
    try {
        pluginsCsonUser = fs.readFileSync(pluginsCsonPathUser, {encoding: "utf8"});
        pluginsCsonUser = cson.parse(pluginsCsonUser);
    } catch (ignored) {}
}

var defaultPlugins = [], includedPlugins = [], excludedPlugins = [];

defaultPlugins = pluginsCsonDefault["plugins"];
console.log("Default plugins: ", defaultPlugins);

if (pluginsCsonUser) {
    includedPlugins = pluginsCsonUser.plugins["include"];
    console.log("Included plugins: ", includedPlugins);

    excludedPlugins = pluginsCsonUser.plugins["exclude"];
    console.log("Excluded plugins: ", excludedPlugins);
} else {
    console.log("No plugin entries to override.");
}

//union defaultPlugins and includedPlugins, without excludedPlugins
var pluginsToLoad = defaultPlugins
    .concat(includedPlugins)
    .filter(function (elem, i, arr) {
        return excludedPlugins.indexOf(elem) === -1 && arr.indexOf(elem) === i;
    });

console.log("Plugins to load: ", pluginsToLoad);

var pluginBuildConfigs = {};

// fs.existsSync is marked as deprecated, so accessSync is used instead (if it's available in the running version of Node).
function doesFileExist(path) {
    var exists;
    if (fs.accessSync) {
        try {
            fs.accessSync(path);
            exists = true;
        } catch (ex) {
            exists = false;
        }
    } else {
        exists = fs.existsSync(path);
    }
    return exists;
}

pluginsToLoad.forEach(function(pluginName) {
    // Check for the existance of main.js inside a plugin's folder
    // This will throw an error if the path does not exist or is unaccessable
    if (!doesFileExist(path.join(pluginsDir, pluginName, 'main.js'))) {
        throw new Error('Error: Does the plugin \'' + pluginName + '\' exist?');
    }

    // Parse rjs-config.js if it exists in the plugin dir
    var buildConfigJsFile = path.join(pluginsDir, pluginName, 'rjs-config.js');
    if (doesFileExist(buildConfigJsFile)) {
        var buildConfigJsText = fs.readFileSync(buildConfigJsFile, {encoding: "utf8"});
        // remove require.config usage to turn the javascript text into a single expression
        // that is: `require.config({paths: []})`` into ``({paths: []})``
        var buildConfigEval = buildConfigJsText.replace('require.config', '');
        var buildConfig = eval(buildConfigEval);
        pluginBuildConfigs[pluginName] = buildConfig;
    }
});

var pluginRequireJsConfig = {};
Object.keys(pluginBuildConfigs).forEach(function(pluginName) {
    try {
        var requireConfigObj = pluginBuildConfigs[pluginName];
        var requireConfigPaths = requireConfigObj.paths;
        Object.keys(requireConfigPaths).forEach(function(pathName) {
            var pathValue = requireConfigPaths[pathName];
            requireConfigPaths[pathName] = "%%rootDir%%/" + path.posix.join("plugins", pluginName, pathValue);
        });
        Object.deepExtend(pluginRequireJsConfig, requireConfigObj);
    } catch (e) {
        console.warn('Plugin `'+pluginName+'`: Failed to parse require js config.');
        console.log(e);
    }
});

var pluginRequireJsConfigJson = uneval(pluginRequireJsConfig);
// Trim away the enclosing {} of the JSON string
pluginRequireJsConfigJson = pluginRequireJsConfigJson
    .substr(1, pluginRequireJsConfigJson.length - 2)
    .replace(/\'%%rootDir%%/g, "process._RJS_rootDir(0) + \'");

var dir = path.join(process.cwd(), 'build-config');

console.log("Generated plugin config files: ");

Object.keys(templates).forEach(function(key) {
    var filePath = path.join(dir, key);
    fs.writeFileSync(filePath, TemplateEngine(templates[key], {
        plugins: pluginsToLoad,
        requireConfig: pluginRequireJsConfigJson
    }));
    console.log(filePath);
});

console.log("========> End of plugins bootstrap.");
