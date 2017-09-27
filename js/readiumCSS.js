define([
    "text!readium_shared_css/ReadiumCSS-base.css",
    "text!readium_shared_css/ReadiumCSS-html5patch.css",
    "text!readium_shared_css/ReadiumCSS-safeguards.css",
    "text!readium_shared_css/ReadiumCSS-default.css",
    "text!readium_shared_css/ReadiumCSS-highlights.css",
    "text!readium_shared_css/ReadiumCSS-pagination.css",
    "text!readium_shared_css/ReadiumCSS-scroll.css",
    "text!readium_shared_css/ReadiumCSS-night_mode.css",
    "text!readium_shared_css/ReadiumCSS-sepia_mode.css",
    "text!readium_shared_css/ReadiumCSS-os_a11y.css",
    "text!readium_shared_css/ReadiumCSS-user_settings.css",
    "text!readium_shared_css/ReadiumCSS-fs_normalize.css"
], function (base_css,
             html5patch_css,
             safeguards_css,
             default_css,
             highlights_css,
             pagination_css,
             scroll_css,
             night_mode_css,
             sepia_mode_css,
             os_a11y_css,
             user_settings_css,
             fs_normalize_css) {

    function ReadiumCSS(contentDocument, options) {
        this._contentDocument = contentDocument;
        this._options = options;

        debugger;
    }

    function hasAuthorStyles(contentDocument) {
        var includesInlineStyles = !!contentDocument.querySelector("*[style]");
        var includesExternalOrInternalStylesheets = !!contentDocument.styleSheets.length;
        return includesInlineStyles || includesExternalOrInternalStylesheets;
    }

    ReadiumCSS.prototype.inject = function() {

    };


    return ReadiumCSS;
});