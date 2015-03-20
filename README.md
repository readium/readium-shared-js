# readium-shared-js

EPUB rendering engine written in HTML, CSS and Javascript.
This software component is shared between the Readium Chrome extension, "cloud reader",
and various native application "launchers" (iOS, OSX, Android, Windows, etc.).


## License

BSD-3-Clause ( http://opensource.org/licenses/BSD-3-Clause )

See license.txt ( https://github.com/readium/readium-shared-js/blob/develop/license.txt )


## Prerequisites

* A decent terminal. On Windows, GitShell works great ( http://git-scm.com ), GitBash works too ( https://msysgit.github.io ), and Cygwin adds useful commands ( https://www.cygwin.com ).
* Node ( https://nodejs.org )

## How to use with NPM (Node Package Manager)

Once `npm install readium-shared-js` has completed, run `npm run example`
or alternatively: take a look at the HTML files in the `build-output-usage-example` folder,
which demonstrate a basic RequireJS bootstrapper (this is *not* a fully-functioning application!)
To see an actual application that uses the "readium-shared-js" component, see "readium-js-viewer".

Note: the `--dev` option after `npm install readium-shared-js` can be used to force the download of development dependencies,
but this is kind of pointless as the code source and RequireJS build configuration files are missing.
See below if you need to hack the code.


## How to develop

Initial setup:

* `npm install` (to download dependencies defined in `package.json`)
* `npm update` (to make sure that the dependency tree is up to date)
* `npm run prepare` (to perform required preliminary tasks)

Typical workflow:

* Hack away! (mostly the source code in the `js` and `plugins` folders)
* `npm run build` (to update the RequireJS bundles in the build output folder)
* `npm run example:dev` (to launch an http server with live-reload, automatically opens a web browser instance to the HTML files in the `build-output-usage-example` folder)

Optionally:

* `npm run cson2json` (to re-generate the `package.json` JSON file, for more information see comments in the master `package.cson` CSON file)
* `npm install -g grunt-cli` (to enable Grunt) Note that at this point in time, the "readium-shared-js" build process is entirely driven from NPM scripts defined in `package.cson` (CSON because it's more readable than JSON), so Grunt is actually not needed!