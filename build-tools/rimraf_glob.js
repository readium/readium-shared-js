
var args = process.argv.slice(2);

console.log("rimraf.js arguments: ");
console.log(args);

var glob = require("glob");
var rimraf = require("rimraf");

glob(args[0], {}, function (er, files) {
	if (er) console.log(er);
	for (var i in files) {
		console.log(files[i]);
		rimraf(files[i], function(e) {
			if (e) console.log(e);
		});
	}
});