define(['readium-plugins', './annotations_manager'], function (Plugins, AnnotationsManager) {
    var config = {};

    Plugins.register("annotations", function (api) {
        var _annotationsManager, _annotationsApi, _initialized = false, _initializedLate = false;

        _annotationsApi = function () {
            var self = this;

            function isInitialized() {
                if (!_initialized) {
                    api.plugin.warn('Not initialized!')
                }
                return _initialized;
            }

            this.initialize = function (options) {
                if (_initialized) {
                    api.plugin.warn('Already initialized!');
                    return;
                }

                _annotationsManager = new AnnotationsManager(self, options);

                if (_initializedLate) {
                    api.plugin.warn('Unable to attach to currently loaded content document.\n' +
                    'Initialize the plugin before loading a content document.');
                }

                _initialized = true;
            };

            /**
             * Returns current selection partial Cfi, useful for workflows that need to check whether the user has selected something.
             *
             * @method getCurrentSelectionCfi
             * @returns {object | undefined} partial cfi object or undefined if nothing is selected
             *
             */
            this.getCurrentSelectionCfi = function () {
                if (!isInitialized()) {
                    return
                }

                return _annotationsManager.getCurrentSelectionCfi();
            };

            /**
             * Creates a higlight based on given parameters
             *
             * @method addHighlight
             * @param {string} spineIdRef spine idref that defines the partial Cfi
             * @param {string} CFI partial CFI (withouth the indirection step) relative to the spine index
             * @param {string} id id of the highlight. must be unique
             * @param {string} type currently "highlight" only
             *
             * @returns {object | undefined} partial cfi object of the created highlight
             *
             */
            this.addHighlight = function (spineIdRef, Cfi, id, type, styles) {
                if (!isInitialized()) {
                    return
                }

                return _annotationsManager.addHighlight(spineIdRef, Cfi, id, type, styles);
            };


            /**
             * Creates a higlight based on current selection
             *
             * @method addSelectionHighlight
             * @param {string} id id of the highlight. must be unique
             * @param {string} type currently "highlight" only
             *
             * @returns {object | undefined} partial cfi object of the created highlight
             *
             */
            this.addSelectionHighlight = function (id, type) {
                if (!isInitialized()) {
                    return
                }

                return _annotationsManager.addSelectionHighlight(id, type);
            };

            /**
             * Removes given highlight
             *
             * @method removeHighlight
             * @param {string} id id of the highlight.
             *
             * @returns {undefined}
             *
             */
            this.removeHighlight = function (id) {
                if (!isInitialized()) {
                    return
                }

                return _annotationsManager.removeHighlight(id);
            };

        };


        api.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            if (_initialized) {
                _annotationsManager.attachAnnotations($iframe, spineItem);
            } else {
                _initializedLate = true;
            }
        });

        // Extend the Reader API with the Annotations API under its own namespace
        api.extendReader(new _annotationsApi());
    });

    return config;
});