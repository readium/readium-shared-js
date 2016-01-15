define(['readium_js_plugins', 'readium_shared_js/globals', './manager'], function (Plugins, Globals, HighlightsManager) {
    var config = {};

    Plugins.register("highlights", function (api) {
        var reader = api.reader, _highlightsManager, _initialized = false, _initializedLate = false;

        var self = this;

        function isInitialized() {
            if (!_initialized) {
                api.plugin.warn('Not initialized!')
            }
            return _initialized;
        }

        this.initialize = function (options) {
            options = options || {};

            setTimeout(isInitialized, 1000);

            if (_initialized) {
                api.plugin.warn('Already initialized!');
                return;
            }

            if (reader.getFirstVisibleCfi && reader.getLastVisibleCfi && !options.getVisibleCfiRangeFn) {
                options.getVisibleCfiRangeFn = function () {
                    return {firstVisibleCfi: reader.getFirstVisibleCfi(), lastVisibleCfi: reader.getLastVisibleCfi()};
                };
            }

            _highlightsManager = new HighlightsManager(self, options);

            if (_initializedLate) {
                api.plugin.warn('Unable to attach to currently loaded content document.\n' +
                'Initialize the plugin before loading a content document.');
            }

            _initialized = true;
        };

        this.getHighlightsManager = function() {
            return _highlightsManager;
        };

        /**
         * Returns current selection partial Cfi, useful for workflows that need to check whether the user has selected something.
         *
         * @returns {object | undefined} partial cfi object or undefined if nothing is selected
         */
        this.getCurrentSelectionCfi = function() {
            return _highlightsManager.getCurrentSelectionCfi();
        };

        /**
         * Creates a higlight based on given parameters
         *
         * @param {string} spineIdRef		Spine idref that defines the partial Cfi
         * @param {string} cfi				Partial CFI (withouth the indirection step) relative to the spine index
         * @param {string} id				Id of the highlight. must be unique
         * @param {string} type 			Name of the class selector rule in annotations stylesheet.
         * 									The style of the class will be applied to the created hightlight
         * @param {object} styles			Object representing CSS properties to be applied to the highlight.
         * 									e.g., to apply background color pass in: {'background-color': 'green'}
         *
         * @returns {object | undefined} partial cfi object of the created highlight
         */
        this.addHighlight = function(spineIdRef, cfi, id, type, styles) {
            return _highlightsManager.addHighlight(spineIdRef, cfi, id, type, styles);
        };

        /**
         * Creates a higlight based on the current selection
         *
         * @param {string} id id of the highlight. must be unique
         * @param {string} type - name of the class selector rule in annotations.css file.
         * @param {boolean} clearSelection - set to true to clear the current selection
         * after it is highlighted
         * The style of the class will be applied to the created hightlight
         * @param {object} styles - object representing CSS properties to be applied to the highlight.
         * e.g., to apply background color pass this {'background-color': 'green'}
         *
         * @returns {object | undefined} partial cfi object of the created highlight
         */
        this.addSelectionHighlight =  function(id, type, styles, clearSelection) {
            return _highlightsManager.addSelectionHighlight(id, type, styles, clearSelection);
        };

        /**
         * Removes a given highlight
         *
         * @param {string} id  The id associated with the highlight.
         *
         * @returns {undefined}
         *
         */
        this.removeHighlight = function(id) {
            return _highlightsManager.removeHighlight(id);
        };

        /**
         * Removes highlights of a given type
         *
         * @param {string} type type of the highlight.
         *
         * @returns {undefined}
         *
         */
        this.removeHighlightsByType = function(type) {
            return _highlightsManager.removeHighlightsByType(type);
        };

        /**
         * Client Rectangle
         * @typedef {object} ReadiumSDK.Views.ReaderView.ClientRect
         * @property {number} top
         * @property {number} left
         * @property {number} height
         * @property {number} width
         */

        /**
         * Highlight Info
         *
         * @typedef {object} ReadiumSDK.Views.ReaderView.HighlightInfo
         * @property {string} id - unique id of the highlight
         * @property {string} type - highlight type (css class)
         * @property {string} CFI - partial CFI range of the highlight
         * @property {ReadiumSDK.Views.ReaderView.ClientRect[]} rectangleArray - array of rectangles consituting the highlight
         * @property {string} selectedText - concatenation of highlight nodes' text
         */

        /**
         * Gets given highlight
         *
         * @param {string} id id of the highlight.
         *
         * @returns {ReadiumSDK.Views.ReaderView.HighlightInfo} Object describing the highlight
         */
        this.getHighlight = function(id) {
            return _highlightsManager.getHighlight(id);
        };

        /**
         * Update annotation by the id, reapplies CSS styles to the existing annotaion
         *
         * @param {string} id id of the annotation.
         * @property {string} type - annotation type (name of css class)
         * @param {object} styles - object representing CSS properties to be applied to the annotation.
         * e.g., to apply background color pass this {'background-color': 'green'}.
         */
        this.updateAnnotation = function(id, type, styles) {
            _highlightsManager.updateAnnotation(id, type, styles);
        };

        /**
         * Replace annotation with this id. Current annotation is removed and a new one is created.
         *
         * @param {string} id id of the annotation.
         * @property {string} cfi - partial CFI range of the annotation
         * @property {string} type - annotation type (name of css class)
         * @param {object} styles - object representing CSS properties to be applied to the annotation.
         * e.g., to apply background color pass this {'background-color': 'green'}.
         */
        this.replaceAnnotation = function(id, cfi, type, styles) {
            _highlightsManager.replaceAnnotation(id, cfi, type, styles);
        };


        /**
         * Redraws all annotations
         */
        this.redrawAnnotations = function() {
            _highlightsManager.redrawAnnotations();
        };

        /**
         * Updates an annotation to use the supplied styles
         *
         * @param {string} id
         * @param {string} styles
         */
        this.updateAnnotationView = function(id, styles) {
            _highlightsManager.updateAnnotationView(id, styles);
        };

        /**
         * Updates an annotation view state, such as whether its hovered in or not.
         * @param {string} id       The id associated with the highlight.
         * @param {string} state    The state type to be updated
         * @param {string} value    The state value to apply to the highlight
         * @returns {undefined}
         */
        this.setAnnotationViewState = function(id, state, value) {
            return _highlightsManager.setAnnotationViewState(id, state, value);
        };

        /**
         * Updates an annotation view state for all views.
         * @param {string} state    The state type to be updated
         * @param {string} value    The state value to apply to the highlights
         * @returns {undefined}
         */
        this.setAnnotationViewStateForAll = function (state, value) {
            return _highlightsManager.setAnnotationViewStateForAll(state, value);
        };

        /**
         * Gets a list of the visible midpoint positions of all annotations
         *
         * @returns {HTMLElement[]}
         */
        this.getVisibleAnnotationMidpoints = function () {
            if (reader.getVisibleElements) {
                var $visibleElements = reader.getVisibleElements(_highlightsManager.getAnnotationsElementSelector(), true);

                var elementMidpoints = _highlightsManager.getAnnotationMidpoints($visibleElements);
                return elementMidpoints || [];
            } else {
                // FIXME: Expose the getVisibleElements call from the reader's internal views.
                console.warn('getAnnotationMidpoints won\'t work with this version of Readium');
            }
        };

        reader.on(Globals.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            if (_initialized) {
                _highlightsManager.attachAnnotations($iframe, spineItem, reader.getLoadedSpineItems());
            } else {
                _initializedLate = true;
            }
        });

        ////FIXME: JCCR mj8: this is sometimes faulty, consider removal
        //// automatically redraw annotations.
        //reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, _.debounce(function () {
        //    self.redrawAnnotations();
        //}, 10, true));



    });

    return config;
});
