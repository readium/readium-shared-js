define([
    "text!readium_shared_css/ReadiumCSS-base.css",
    "text!readium_shared_css/ReadiumCSS-html5patch.css",
    "text!readium_shared_css/ReadiumCSS-safeguards.css",
    "text!readium_shared_css/ReadiumCSS-default.css",
    "text!readium_shared_css/ReadiumCSS-highlights.css",
    "text!readium_shared_css/ReadiumCSS-pagination.css",
    "text!readium_shared_css/ReadiumCSS-vertical_writing.css",
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
             vertical_writing_css,
             scroll_css,
             night_mode_css,
             sepia_mode_css,
             os_a11y_css,
             user_settings_css,
             fs_normalize_css) {

    function ReadiumCSS(contentDocument, options) {
        this._contentDocument = contentDocument;
        this._options = options;
    }

    function hasAuthorStyles(contentDocument) {
        var includesInlineStyles = !!contentDocument.querySelector("*[style]");
        var includesExternalOrInternalStylesheets = !!contentDocument.styleSheets.length;
        return includesInlineStyles || includesExternalOrInternalStylesheets;
    }


    function injectStylesheet(contentDocument, cssText, prepend) {
        var headElement = contentDocument.head;

        var styleElement = contentDocument.createElement("style");
        styleElement.textContent = cssText;
        if (prepend) {
            headElement.insertBefore(styleElement, headElement.firstChild);
        } else {
            headElement.appendChild(styleElement);
        }
    }

    ReadiumCSS.prototype.inject = function () {
        var contentDocument = this._contentDocument;
        var hasNoAuthorStyles = !hasAuthorStyles(contentDocument);

        injectStylesheet(contentDocument, safeguards_css, true);
        injectStylesheet(contentDocument, html5patch_css, true);
        injectStylesheet(contentDocument, base_css, true);

        if (hasNoAuthorStyles) {
            injectStylesheet(contentDocument, default_css);
        }

        injectStylesheet(contentDocument, highlights_css);

        if (this._options.pagination) {
            injectStylesheet(contentDocument, pagination_css);
        }

        if (this._options.verticalWriting) {
            injectStylesheet(contentDocument, vertical_writing_css);
        }

        if (this._options.scroll) {
            injectStylesheet(contentDocument, scroll_css);
        }

        if (this._options.displayMode === 'night') {
            injectStylesheet(contentDocument, night_mode_css);
        } else if (this._options.displayMode === 'sepia') {
            injectStylesheet(contentDocument, sepia_mode_css);
        }

        injectStylesheet(contentDocument, os_a11y_css);
        injectStylesheet(contentDocument, user_settings_css);

        if (this._options.fontSizeNormalize) {
            injectStylesheet(contentDocument, fs_normalize_css);
        }

    };


    return ReadiumCSS;
});