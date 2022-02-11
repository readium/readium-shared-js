# readium-shared-js

**EPUB rendering engine written in HTML, CSS and Javascript.**

This is a software component commonly-shared between the Readium Chrome extension and "cloud reader" ( https://github.com/readium/readium-js-viewer ),
as well as various native application "launchers" such as iOS ( https://github.com/readium/SDKLauncher-iOS ),
OSX ( https://github.com/readium/SDKLauncher-OSX ),
Android ( https://github.com/readium/SDKLauncher-Android ),
Windows ( https://github.com/readium/SDKLauncher-Windows ), etc.

You can try Readium here:

* Online "cloud reader" demo: https://readium.firebaseapp.com
* Chrome extension (can be used offline): https://chrome.google.com/webstore/detail/readium/fepbnnnkkadjhjahcafoaglimekefifl


## License

**BSD-3-Clause** ( http://opensource.org/licenses/BSD-3-Clause )

See [license.txt](./license.txt).


## Prerequisites

* A decent terminal. On Windows, GitShell works great ( http://git-scm.com ), GitBash works too ( https://msysgit.github.io ), and Cygwin adds useful commands ( https://www.cygwin.com ).
* NodeJS ( https://nodejs.org ) **v4+** (Note that NodeJS v6+ and NPM v3+ are now supported, including NodeJS v7+ and NPM v4+)
* Optionally: Yarn ( https://yarnpkg.com ) **v0.23+**


## Development

**Initial setup:**

* `git submodule update --init --recursive` to ensure that the readium-shared-js chain of dependencies is initialised (readium-cfi-js)
* `git checkout BRANCH_NAME && git submodule foreach --recursive 'git checkout BRANCH_NAME'` to switch to the desired BRANCH_NAME
* `npm run prepare:all` (to perform required preliminary tasks, like patching code before building)
* OR: `yarn run prepare:yarn:all` (to use Yarn instead of NPM for node_module management)

Note that in some cases, administrator rights may be needed in order to install dependencies, because of NPM-related file access permissions (the console log would clearly show the error). Should this be the case, running `sudo npm run prepare:all` usually solves this.

Note that the above command executes the following:

* `npm install` (to download dependencies defined in `package.json` ... note that the `--production` option can be used to avoid downloading development dependencies, for example when testing only the pre-built `build-output` folder contents)
* `npm update` (to make sure that the dependency tree is up to date)

**Typical workflow:**

* Hack away! (mostly the source code in the `js` and `plugins` folders)
* `npm run build` (to update the RequireJS bundles in the build output folder)
* `npm run http:watch` (to launch an http server with live-reload, automatically opens a web browser instance to the HTML files in the `dev` folder)
* `npm run http` (same as above, but without watching for file changes (no automatic rebuild))

**Plugins integration:**

When invoking the `npm run build` command, the `build-output` folder contains RequireJS module bundles that include the default plugins specified in `plugins/plugins.cson` (see the `PLUGINS.md` documentation). Normally, developers can override the default plugins configuration by using an additional file called `plugins-override.cson`. This file is git-ignored (not persistent in the Git repository), which means that Readium's default configuration is never at risk of being mistakenly overridden by developers, whilst giving developers the possibility of creating custom builds.

However, unlike other Readium repositories, the `readium-shared-js` Git repository includes the `build-output` folder, so that Readium's native application "launchers" can be built directly with those pre-built libraries (no Javascript-specific build process required, i.e. Node, NPM, etc.). So, in the specific case of `readium-shared-js`, developers must set the `RJS_PLUGINS_OVERRIDE` environment variable to "yes" (or "true"), in order for `plugins-override.cson` to be taken into account. For example, using PowerShell on Windows: `Set-Item Env:RJS_PLUGINS_OVERRIDE no`, or Terminal on OSX: `RJS_PLUGINS_OVERRIDE=no npm run build` (which sets a temporary environment variable for the lifespan of the invoked command, rather than a persistent one).

## NPM (Node Package Manager)

All packages "owned" and maintained by the Readium Foundation are listed here: https://www.npmjs.com/~readium

Note that although Node and NPM natively use the CommonJS format, Readium modules are currently only defined as AMD (RequireJS).
This explains why Browserify ( http://browserify.org ) is not used by this Readium project.
More information at http://requirejs.org/docs/commonjs.html and http://requirejs.org/docs/node.html

* Make sure `npm install readium-shared-js` completes successfully ( https://www.npmjs.com/package/readium-shared-js )
* Execute `npm run http`, which opens a web browser to a basic RequireJS bootstrapper located in the `dev` folder (this is *not* a fully-functioning application!)
* To see an actual application that uses this "readium-shared-js" component, try "readium-js-viewer" ( https://www.npmjs.com/package/readium-js-viewer )

Note: the `--dev` option after `npm install readium-shared-js` can be used to force the download of development dependencies,
but this is kind of pointless as the code source and RequireJS build configuration files are missing.
See below if you need to hack the code.


## How to use (RequireJS bundles / AMD modules)

The `build-output` directory contains common CSS styles, as well as two distinct folders:

### Single bundle

The `_single-bundle` folder contains `readium-shared-js_all.js` (and its associated source-map file, as well as a RequireJS bundle index file (which isn't actually needed at runtime, so here just as a reference)),
which aggregates all the required code (external library dependencies included, such as Underscore, jQuery, etc.),
as well as the "Almond" lightweight AMD loader ( https://github.com/jrburke/almond ).

This means that the full RequireJS library ( http://requirejs.org ) is not actually needed to bootstrap the AMD modules at runtime,
as demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

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


The `_multiple-bundles` folder contains several Javascript bundles (and their respective source-map files, as well as RequireJS bundle index files):


* `readium-external-libs.js`: aggregated library dependencies (e.g. Underscore, jQuery, etc.)
* `readium-cfi-js.js`: Readium CFI library (basically, equivalent to the `js` folder of the readium-cfi-js submodule)
* `readium-shared-js.js`: Readium-specific code (basically, equivalent to the `js` folder)
* `readium-plugin-example.js`: simple plugin demo
* `readium-plugin-annotations.js`: the annotation plugin (DOM selection + highlight), which bundle actually contains the "Backbone" library, as this dependency is not already included in the "external libs" bundle.

In addition, the folder contains the full `RequireJS.js` library ( http://requirejs.org ), as the above bundles do no include the lightweight "Almond" AMD loader ( https://github.com/jrburke/almond ).

Usage is demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

```html
<html>
<head>

<!-- full RequireJS library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/RequireJS.js"> </script>



<!-- individual bundles: -->

<!-- readium CFI library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-cfi-js.js"> </script>

<!-- external libraries -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js"> </script>

<!-- readium itself -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js"> </script>

<!-- simple example plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js"> </script>

<!-- annotations plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js"> </script>



<!-- index.js calls into the above libraries -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```


Note how the various sets of AMD modules can be invoked on-demand (lazy) using the `bundles` RequireJS configuration directive
(this eliminates the apparent opacity of such as large container of library dependencies):


```html

<script type="text/javascript">
requirejs.config({
    baseUrl: '../build-output/_multiple-bundles'
});
</script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-cfi-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js.bundles.js"> </script>

```




## CSON vs. JSON (package.json)

CSON = CoffeeScript-Object-Notation ( https://github.com/bevry/cson )

Running the command `npm run cson2json` will re-generate the `package.json` JSON file.
For more information, see comments in the master `package.cson` CSON file.

Why CSON? Because it is a lot more readable than JSON, and therefore easier to maintain.
The syntax is not only less verbose (separators, etc.), more importantly it allows *comments* and *line breaking*!

Although these benefits are not so critical for basic "package" definitions,
here `package.cson/json` declares relatively intricate `script` tasks that are used in the development workflow.
`npm run SCRIPT_NAME` offers a lightweight technique to handle most build tasks,
as NPM CLI utilities are available to perform cross-platform operations (agnostic to the actual command line interface / shell).
For more complex build processes, Grunt / Gulp can be used, but these build systems do not necessarily offer the most readable / maintainable options.

Downside: DO NOT invoke `npm init` or `npm install --save` `--save-dev` `--save-optional`,
as this would overwrite / update the JSON, not the master CSON!

## Maven Package

Once the JS components have been bundled with the `npm build` commands
shown above, a Maven package can be produced containing the relevant
resources. This can then be referenced from Android applications as
a standard library dependency, instead of having to import the sources
directly into the project as a `git submodule`.

To create a package:

```bash
$ mvn clean package
```

After the package has been deployed to a repository with `mvn deploy`,
the package can be referenced from an Android application with (in Maven
dependency syntax):

```
<dependency>
  <groupId>org.readium</groupId>
  <artifactId>readium-shared-js</artifactId>
  <version>0.20.0</version>
</dependency>
```

