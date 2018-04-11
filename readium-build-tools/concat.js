var fs = require('fs');
var glob = require('glob');

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

var args = process.argv.splice(2);

console.log("=== concat [" + args[0] + "] into [" + args[1] + "] ...");
if (args[2]) console.log("Input encoding: " + args[2]);
    
if (doesFileExist(args[1])) {
    console.log("~~ delete: " + args[1]);
    fs.unlinkSync(args[1]);
}

var files = [];
glob.sync(args[0]).forEach(function(file) {
    files.push(file);
});

var appendFile = function(i) {
    
    if (i >= files.length) return;
    
    var file = files[i];
    console.log("-- append: " + file);
    
    var src = fs.readFileSync(file, args[2] ? args[2] : 'utf8');
    src = src.replace(/^\uFEFF/, ''); // BOM strip
    fs.appendFileSync(args[1], src, 'utf8');
    
    // Give the kernel / low-level filesystem some time to flushing the write buffers.
    // (on some machines, calling appendFileSync() or even appendFile() in sequence causes mangled output buffer) 
    // http://www.daveeddy.com/2013/03/26/synchronous-file-io-in-nodejs/
    setTimeout(function() {
        appendFile(++i);
    }, 100);
};

appendFile(0);