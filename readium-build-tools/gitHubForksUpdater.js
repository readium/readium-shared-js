// function() {

//repoNamePaths defined in caller's eval() context

// var args = process.argv.slice(2);

//console.log("gitHubForksUpdater.js arguments: ");
//console.log(args);

//console.log(process.cwd());
//process.exit(-1);

var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');

//https://github.com/blog/1509-personal-api-tokens
//https://github.com/settings/tokens
var ACCESSTOKEN = "f9ec367b2aa8eb2842272ff2cbafc447febb1c75";

var USERAGENT = "Readium-GitHub";

var httpGet = function(info, callback) {
    
try {
    
    (info.ssl ? https : http).get(info.url, function(response) {

try {
        // console.log("statusCode: ", response.statusCode);
        // console.log("headers: ", response.headers);

        response.setEncoding('utf8');

        response.on('error', function(error) {
            console.log(info.url);
            console.log(error);
            callback(info, undefined);
        });

        var allData = ''
        response.on('data', function(data) {
            allData += data;
        });

        response.on('end', function() {
            //console.log(allData);
            callback(info, allData);
        });
        
} catch(err) {
    callback(info, undefined);
}
    });
    
} catch(err) {
    callback(info, undefined);
}
};

var checkDiff = function(depSource, upstream, ID) {

    var depSource_ = depSource;
    
    var iSlash = depSource_.indexOf('/');
    if (iSlash >= 0) {
        depSource_ = depSource_.substr(0,iSlash);
    }


    var url = {
      hostname: 'api.github.com',
      port: 443,
      path: "/repos/" + upstream + "/compare/" + ID + "..." + depSource_ + ":" + ID + "?access_token=" + ACCESSTOKEN,
      method: 'GET',

      headers: {
        "User-Agent": USERAGENT
      }
    };

    httpGet(
    {ssl: true, url: url, depSource: depSource, upstream: upstream, ID: ID},
    function(info, res) {

        if (!res) return;

        var gitData = JSON.parse(res);
        if (!gitData) return;

        console.log("+++++++ " + info.depSource + " >> " + info.upstream + " [" + info.ID + "]");

        //console.log(info.url);
        //console.log(res);
        
        if (gitData.message) console.log(gitData.message);
        
        //if (gitData.url) console.log(gitData.url);
        //if (gitData.html_url) console.log(gitData.html_url);
        //if (gitData.permalink_url) console.log(gitData.permalink_url);

        if (gitData.behind_by) {

            console.log("!!!!!! NEEDS UPDATING");
            console.log(gitData.status);
            console.log(gitData.behind_by);
            
            console.log("Code diff URLs:");
                    
            var depSource_ = depSource;
            var iSlash = depSource_.indexOf('/');
            if (iSlash >= 0) {
                depSource_ = depSource_.substr(0,iSlash);
            }
            
            var upstream_ = info.upstream;
            iSlash = upstream_.indexOf('/');
            if (iSlash >= 0) {
                upstream_ = upstream_.substr(0,iSlash);
            }
            
            console.log("https://github.com/" + info.upstream + "/compare/" + info.ID + "..." + depSource_ + ":" + info.ID);
            console.log("https://github.com/" + info.depSource + "/compare/" + info.ID + "..." + upstream_ + ":" + info.ID);
            console.log("(open with web browser to visualize code changes, to and from the fork)");
            console.log("..........");
            
            
            console.log("---------------------------------");
            console.log("Recommended steps (command line):");
            console.log("---------------------------------");
            console.log("git clone git@github.com:"+info.depSource+".git");
            console.log("git remote add upstream git@github.com:"+info.upstream+".git");
            console.log("git checkout " + info.ID);
            console.log("git fetch upstream");
            console.log("git merge upstream/" + info.ID);
            console.log("git commit -a");
            console.log("git push");
            console.log("---------------------------------");

            //process.exit(1);
        } else if (gitData.url) {
            console.log("Up to date.");
        } else {
            console.log("GitHub API error?!");
            console.log(res);
        }
    });
};

var alreadyScannedDeps = [];

var scanDeps = function(deps) {

    for (var depName in deps) {
        var depSource = deps[depName];
        depSource = depSource.replace("github:", "");

        if (depSource.indexOf("/") == -1) continue;

        if (alreadyScannedDeps[depSource]) continue;
        alreadyScannedDeps[depSource] = true;

        console.log(depSource);
    
        var ID = "master";
    
        var iHash = depSource.indexOf('#');
        if (iHash >= 0) {
            ID = depSource.substr(iHash+1);
            depSource = depSource.substr(0,iHash);
        }
        
        console.log("[[");
        console.log(depSource);
        console.log(ID);
        console.log("]]");
    
        var url = {
          hostname: 'api.github.com',
          port: 443,
          path: "/repos/" + depSource + "?access_token=" + ACCESSTOKEN,
          method: 'GET',

          headers: {
            "User-Agent": USERAGENT
          }
        };

        httpGet(
        {ssl: true, url: url, depSource: depSource, ID: ID},
        function(info, res) {

            if (!res) return;

            var gitData = JSON.parse(res);
            if (!gitData) return;

            if (!gitData.source && !gitData.parent) {
                if (gitData.message)
                    console.log(res);
                return;
            }

            //console.log("++++++++");
            //console.log(info.url);
            //console.log(res);
            if (gitData.source) {
                //console.log("SOURCE: " + gitData.source.full_name);
                checkDiff(info.depSource, gitData.source.full_name, info.ID);
            }

            if (gitData.parent && (gitData.parent.full_name != gitData.source.full_name)) {
                //console.log("PARENT: " + gitData.parent.full_name);
                checkDiff(info.depSource, gitData.parent.full_name, info.ID);
            }
        });
    }
};

var repoPath = process.cwd();
var repoPackageFile = path.join(repoPath, 'package.json');

var repoPackageFileContents = fs.readFileSync(repoPackageFile, 'utf-8');

var repoPackage = JSON.parse(repoPackageFileContents);

scanDeps(repoPackage.dependencies);
scanDeps(repoPackage.devDependencies);

//
//
// for (var repoName in repoNamePaths) {
//     var repoPath = repoNamePaths[repoName];
//     //
//     console.log("=====================");
//     console.log(repoName);
//     console.log(repoPath);
//     // console.log("---------------");
//
//     // console.log("---------------");
// }

// }
