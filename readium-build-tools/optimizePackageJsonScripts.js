
var path = require('path');

var dirs = process.argv[1].replace(/\\/g, '/').split('/');
dirs.splice(dirs.length - 1);
dirs.splice(dirs.length - 1);

var PATH_PREFIX = dirs.join('/').replace(process.cwd().replace(/\\/g, '/'), '.');

var scripts =
{
    rjs: 'node ' + PATH_PREFIX + '/' + 'node_modules/requirejs/bin/r.js' + ' -o '
          + PATH_PREFIX + '/' + 'readium-build-tools/RequireJS_config.js',
    rimraf: 'node ' + PATH_PREFIX + '/' + 'node_modules/rimraf/bin.js',
    cson2json: 'node ' + PATH_PREFIX + '/' + 'node_modules/cson/bin/cson2json',
    mkdirp: 'node ' + PATH_PREFIX + '/' + 'node_modules/mkdirp/bin/cmd.js',
    cpy: 'node ' + PATH_PREFIX + '/' + 'node_modules/cpy-cli/cli.js',
    ncp: 'node ' + PATH_PREFIX + '/' + 'node_modules/ncp/bin/ncp',
    jshint: 'node ' + PATH_PREFIX + '/' + 'readium-build-tools/jshint_glob.js',
    karma: 'node ' + PATH_PREFIX + '/' + 'node_modules/karma/bin/karma',
    pegjs: 'node ' + PATH_PREFIX + '/' + 'node_modules/pegjs/bin/pegjs',
    watch: 'node ' + PATH_PREFIX + '/' + 'node_modules/watch/cli.js',
    yuidocjs: 'node ' + PATH_PREFIX + '/' + 'node_modules/yuidocjs/lib/cli.js -N -C -c yuidocs.json'
};

var npmCommands = {};
Object.keys(scripts).forEach(function(npmCommand)
{
    npmCommands[npmCommand] =
    {
        replaceFrom: new RegExp('npm run ' + npmCommand, 'g'),
        replaceTo: scripts[npmCommand]
    };
});

var fs = require('fs');

var packagePath = path.join(process.cwd(), 'package.json');

console.log("--- Optimizing package.json NPM scripts: ");
console.log(packagePath);
console.log(PATH_PREFIX);

var packageText = fs.readFileSync(packagePath, {encoding: 'utf8'});

var packageJson = JSON.parse(packageText);

Object.keys(packageJson.scripts).forEach(function(scriptName)
{
    Object.keys(npmCommands).forEach(function(npmCommand)
    {
        if (!npmCommands[npmCommand])
        {
            return;
        }

        packageJson.scripts[scriptName] = packageJson.scripts[scriptName]
        .replace(
            npmCommands[npmCommand].replaceFrom,
            npmCommands[npmCommand].replaceTo
        );
    });
});

var str = JSON.stringify(packageJson, null, 2);
console.log(str);

fs.writeFileSync(packagePath, str);
