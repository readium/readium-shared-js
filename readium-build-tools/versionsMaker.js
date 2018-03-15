function() {

//repoNamePaths defined in caller's eval() context

var repoVersions = {};
for (var repoName in repoNamePaths) {

    repoVersions[repoName] = {
        sha: "??",
        tag: "??",
        clean: "??",
        branch: "??",
        version: "??",
        chromeVersion: "??",
        timestamp: "??",
        release: "??",
        path: repoNamePaths[repoName]
    };
}


var args = process.argv.slice(2);

console.log("versionsMaker.js arguments: ");
console.log(args);

var versionFileDestination = args[0];

console.log(process.cwd());
//process.exit(-1);

var git = require('gift');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var repos = [];
for (var repo in repoVersions) {

    repos.push({
        name: repo,
        path: repoVersions[repo].path,
        versionInfo: repoVersions[repo]
    });

    repoVersions[repo].path = undefined;
}

var nextRepo = function(i) {

    if (i >= repos.length) {

        var str = JSON.stringify(repoVersions);

        fs.writeFileSync(path.join(process.cwd(), versionFileDestination), str);
        return;
    }

    var repoPath = repos[i].path;
    console.log("\n\n>> Versioning: " + repoPath);

    var repoPackageFileContents = fs.readFileSync(path.join(repoPath, 'package.json'), 'utf-8');
    var repoPackage = JSON.parse(repoPackageFileContents);
    console.log("Version: " + repoPackage.version);
    var chromeVersion = undefined;
    if (i == 0) { // readium-js-viewer (Chrome Extension / Packaged App)
        chromeVersion = '2.' + repoPackage.version.substring(2);
        console.log("Chrome version: " + chromeVersion);
    }

    var repoGit = git(repoPath);

    repoGit.current_commit(function(err, commit) {
        if (err) {
            console.log("ERROR: 'current_commit'");
            console.log(err);
        }

        var repoCommit = commit.id;
        console.log("SHA: " + repoCommit);

        repoGit.status(function(err, status){
            if (err) {
                console.log("ERROR: 'status'");
                console.log(err);
            }

            var repoIsClean = status.clean;
            console.log("Clean: " + repoIsClean);

            repoVersions[repos[i].name] = {
                sha: repoCommit,

                clean : repoIsClean,

                version: repoPackage.version,

                chromeVersion: (chromeVersion ? chromeVersion : undefined)
            };

            var cmd = "git --git-dir=\""
                        + path.join(repoPath, ".git")
                        + "\" describe --tags --long "   //   "\" name-rev --tags --name-only "
                        + repoCommit;

            exec(cmd,
                { cwd: repoPath },
                function(err, stdout, stderr) {
                    if (err) {
                        console.log("ERROR: 'git describe'");
                        console.log(cmd);
                        console.log(err);
                    }
                    if (stderr) {
                        console.log(stderr);
                    }
                    if (stdout) {
                        var tag = stdout.trim();
                        console.log("Tag: " + tag);

                        repoVersions[repos[i].name].tag = tag;
                    }

                    var gitPath = path.join(repoPath, '.git');
                    var headPath = path.join(gitPath, 'HEAD');

                    var gitStat = fs.lstatSync(gitPath);
                    if (!gitStat.isDirectory() && gitStat.isFile()) { //exists

                        var gitFileContents = fs.readFileSync(gitPath, 'utf-8');
                        if (gitFileContents.indexOf('gitdir: ') == 0) {

                            var gd = gitFileContents.substring('gitdir: '.length).trim();
                            
                            if (gd.indexOf("..") == 0) {
                                // RELATIVE gitdir
                                headPath = path.join(repoPath, gd);
                            } else {
                                // ABSOLUTE gitdir
                                headPath = gd;
                            }

                            headPath = path.join(headPath, 'HEAD');
                        } else {
                            headPath = undefined;
                        }
                    }

                    var setBranch = function(branch, sha) {

                        console.log("Branch: " + branch);

                        repoVersions[repos[i].name].branch = branch;

                        repoVersions[repos[i].name].release = branch ? branch.indexOf('release/') == 0 : false,

                        repoVersions[repos[i].name].timestamp = Date.now();

                        if (repoVersions[repos[i].name].sha !== sha) {
                            console.log("Different SHA?! " + sha);
                        }

                        nextRepo(++i);
                    };

                    var headFileContents = headPath ? fs.readFileSync(headPath, 'utf-8') : "";
                    if (headFileContents.indexOf('ref: ') == 0) {

                        repoGit.branch(function(err, head) {

                            if (err || !head) {
                                // console.log("ERROR: 'git branch'");
                                // console.log(headPath);
                                // console.log(err);
                                console.log("...");

                                repoGit.branches(function(err, heads) {
                                    if (err) {
                                        console.log("ERROR: 'git branch'");
                                        console.log(headPath);
                                        console.log(err);
                                    }

                                    for (var j = 0; j < heads.length; j++) {
                                        head = heads[j];

                                        if (head.commit.id === repoVersions[repos[i].name].sha) {
                                            setBranch(head.name, head.commit.id);
                                            return;
                                        }
                                    }

                                    console.log("No branch match?! " + repoVersions[repos[i].name].sha);
                                    console.log(heads);
                                });

                                return;
                            }

                            setBranch(head.name, head.commit.id);
                        });

                    } else {
                        console.log(headFileContents);
                        var branch = headFileContents.substring(0, headFileContents.length - 1).trim();
                        console.log(branch);

                        setBranch(branch, repoVersions[repos[i].name].sha);
                    }
                }
            );
        });
    });
}

nextRepo(0);

}
