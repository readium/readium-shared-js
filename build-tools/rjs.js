
var args = process.argv.slice(2);
console.log("=====> process.argv.slice(2):");
console.log(args);


var fs = require('fs');
var extend = require('util')._extend;

var requirejs_config = {};

for (var i = 0; i < args.length; i++)
{
    var arg = args[i];
        
    var requirejs_config_full_path = __dirname + '/' + arg;
    
    console.log("=====> requirejs_config_full_path:");
    console.log(requirejs_config_full_path);

//var requirejs_config_import = require(requirejs_config_full_path);
//console.log(requirejs_config_import);

    var requirejs_config_file_contents = fs.readFileSync(requirejs_config_full_path, 'utf8');
    
    //console.log("=====> requirejs_config_file_contents:");
    //console.log(requirejs_config_file_contents);

    var requirejs_config_eval = eval(requirejs_config_file_contents);
    
    //console.log("=====> requirejs_config_eval:");
    //console.log(requirejs_config_eval);

    extend(requirejs_config, requirejs_config_eval);
}



var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require
});

console.log("=====> requirejs_config:");
console.log(requirejs_config);

requirejs.config(requirejs_config);

console.log("=====> requirejs.config():");
//console.log(requirejs.config());
console.log(requirejs.s.contexts._.config);

requirejs.optimize(requirejs_config,
function (buildResponse)
{
	//console.log(buildResponse);
	
	//var fs = require('fs');
    //var contents = fs.readFileSync(requirejs_config.out, 'utf8');
},
function(err) {

    console.log("=====> requirejs.optimize() ERROR:");
    console.log(err);
    process.exit(-1);
});