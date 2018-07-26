const path = require("path");

const root = p => path.resolve(__dirname, p);
const webpack = require("webpack");
const {
  createConfig,
  entryPoint,
  setOutput,
  resolve,
  addPlugins,
  babel,
} = require("webpack-blocks");

module.exports = createConfig([
  babel(),
  resolve({
    alias: {
      console_shim: root("./lib/console_shim"),
      eventEmitter: "eventemitter3",
      readium_cfi_js: "readium-cfi-js",
      readium_shared_js: root("./js"),
      readium_js_plugins: root("./js/plugins_controller"),
      ResizeSensor: "css-element-queries/src/ResizeSensor",
      jquerySizes: "jquery-sizes/lib/jquery.sizes"
    }
  }),
  entryPoint(["./js/polyfills", "./js/index"]),
  setOutput({
    path: root("./build"),
    filename: "index.js",
    libraryTarget: "umd"
  }),
  addPlugins([
    new webpack.ProvidePlugin({
      jQuery: "jquery",
      $: "jquery",
      _: "underscore"
    })
  ])
]);
