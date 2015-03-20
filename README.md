# readium-shared-js

**EPUB rendering engine written in HTML, CSS and Javascript.**

This is a software component commonly-shared between the Readium Chrome extension and "cloud reader" ( https://github.com/readium/readium-js-viewer ),
as well as various native application "launchers" such as iOS ( https://github.com/readium/SDKLauncher-iOS ),
OSX ( https://github.com/readium/SDKLauncher-OSX ),
Android ( https://github.com/readium/SDKLauncher-Android ),
Windows ( https://github.com/readium/SDKLauncher-Windows ), etc.

You can try Readium here:

* Online "cloud reader" demo: http://readium-cloudreader.divshot.io
* Chrome extension (can be used offline): https://chrome.google.com/webstore/detail/readium/fepbnnnkkadjhjahcafoaglimekefifl


## License

**BSD-3-Clause** ( http://opensource.org/licenses/BSD-3-Clause )

See license.txt ( https://github.com/readium/readium-shared-js/blob/develop/license.txt )


## Prerequisites

* A decent terminal. On Windows, GitShell works great ( http://git-scm.com ), GitBash works too ( https://msysgit.github.io ), and Cygwin adds useful commands ( https://www.cygwin.com ).
* NodeJS ( https://nodejs.org )

## How to use with NPM (Node Package Manager)

All packages "owned" and maintained by the Readium Foundation are listed here: https://www.npmjs.com/~readium

Note that although Node and NPM natively use the CommonJS format, Readium modules are currently only defined as AMD (RequireJS).
This explains why Browserify ( http://browserify.org ) is not used by this Readium project.
More information at http://requirejs.org/docs/commonjs.html and http://requirejs.org/docs/node.html

* Make sure `npm install readium-shared-js` completes successfully ( https://www.npmjs.com/package/readium-shared-js )
* Execute `npm run example`, which opens a web browser to a basic RequireJS bootstrapper located in the `build-output-usage-example` folder (this is *not* a fully-functioning application!)
* To see an actual application that uses this "readium-shared-js" component, try "readium-js-viewer" ( https://www.npmjs.com/package/readium-js-viewer )

Note: the `--dev` option after `npm install readium-shared-js` can be used to force the download of development dependencies,
but this is kind of pointless as the code source and RequireJS build configuration files are missing.
See below if you need to hack the code.


## How to develop

**Initial setup:**

* `npm install` (to download dependencies defined in `package.json`)
* `npm update` (to make sure that the dependency tree is up to date)
* `npm run prepare` (to perform required preliminary tasks)

**Typical workflow:**

* Hack away! (mostly the source code in the `js` and `plugins` folders)
* `npm run build` (to update the RequireJS bundles in the build output folder)
* `npm run example:dev` (to launch an http server with live-reload, automatically opens a web browser instance to the HTML files in the `build-output-usage-example` folder)

Optionally:

* `npm run cson2json` (to re-generate the `package.json` JSON file, for more information see comments in the master `package.cson` CSON file)
* `npm install -g grunt-cli` (to enable Grunt) Note that at this point in time, the "readium-shared-js" build process is Grunt-free, entirely driven from NPM scripts defined in `package.cson` (because CSON is more readable than JSON)


## Build output (AMD bundles)

The `build-output` directory contains common CSS styles, as well as two distinct folders:

### Single bundle

The `_single-bundle` folder contains `readium-shared-js_all.js` (and its associated source-map file),
which aggregates all the required code (library dependencies included),
as well as the "Almond" lightweight AMD loader ( https://github.com/jrburke/almond ).

This means that the full RequireJS library ( http://requirejs.org ) is not actually needed to bootstrap the runtime,
as demonstrated by the HTML file in the `build-output-usage-example` folder (trimmed for brevity):

```html
<html>
<head>

<!-- main code bundle, which includes its own Almond AMD loader (no need for the full RequireJS library) -->
<script type="text/javascript" src="../build-output/_single-bundle/readium-shared-js_all.js"> </script>

<!-- index.js calls into the above library -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```

### Multiple bundles


The `_multiple-bundles` folder contains several Javascript bundles (and their respective source-map files):


* `readium-external-libs.js`: aggregated library dependencies (e.g. Underscore, jQuery, etc.)
* `readium-shared-js.js`: Readium-specific code (basically, equivalent to the `js` folder)
* `readium-plugin-example.js`: simple plugin demo
* `readium-plugin-annotations.js`: the annotation plugin (DOM selection + highlight), which bundle actually contains the "Backbone" library, as this dependency is not already included in the "external libs" bundle.

In addition, the folder contains the full `RequireJS.js` library ( http://requirejs.org ), as the above bundles do no include the lightweight "Almond" AMD loader ( https://github.com/jrburke/almond ).

Usage is demonstrated by the HTML file in the `build-output-usage-example` folder (trimmed for brevity):

```html
<html>
<head>

<!-- full RequireJS library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/RequireJS.js"> </script>


<!-- individual bundles -->

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js"> </script>


<!-- index.js calls into the above libraries -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```


Note how the "external libs" RequireJS bundle can be explicitly described using the `bundles` RequireJS configuration directive
(this eliminates the apparent opacity of such as large set of library dependencies):


```html

<!-- script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js"> </script -->

<script type="text/javascript">
requirejs.config({
    paths: {
        'readium-external-libs': "../build-output/_multiple-bundles/readium-external-libs"
    },
    bundles: {
        
        'readium-external-libs': [
'jquery', 'underscore', 'backbone',
'URIjs', 'punycode', 'SecondLevelDomains', 'IPv6',
'jquerySizes', 'domReady', 'eventEmitter', 'console_shim',
'rangy', 'rangy-core', 'rangy-textrange', 'rangy-highlighter', 'rangy-cssclassapplier', 'rangy-position'
]
    }
});
</script>
```