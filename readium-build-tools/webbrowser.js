
var fs = require('fs');
var path = require('path');

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


if (doesFileExist(path.join(process.cwd(), '/open_webbrowser.js'))) {
    
        console.log('web browser opening...');

        // var i = 0;
        // var MAX = 10;
        // var htmlFileExists = false;
              // try {
              //         fs.accessSync(process.cwd() + '/dist/index.html');
        //     htmlFileExists = true;
              // } catch (e) {
              //         // ignored
              // }
        // while (i < MAX && !htmlFileExists) {
            // i++;
            // console.log('.');
        // }

        // console.log('./dist/index.html is ready.');
} else {
    console.log('web browser already open.');
    process.exit(-1);
}
