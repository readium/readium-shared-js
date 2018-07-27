//  LauncherOSX
//
//  Created by Boris Schneiderman.
//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification,
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation and/or
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be
//  used to endorse or promote products derived from this software without specific
//  prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
//  OF THE POSSIBILITY OF SUCH DAMAGE.
define(["./globals", 'underscore', "jquery", "jquerySizes", "./models/spine_item", 'URIjs'], function(Globals, _, $, JQuerySizes, SpineItem, URI) {
    
(function()
{
/* jshint strict: true */
/* jshint -W034 */
    "use strict";
    
    if(window.performance)
    {
        if (window.performance.now)
        {
            return;
        }
        
        var vendors = ['webkitNow', 'mozNow', 'msNow', 'oNow'];
        
        for (var i = 0; i < vendors.length; i++)
        {
            if (vendors[i] in window.performance)
            {
                window.performance.now = window.performance[vendors[i]];
                return;
            }
        }
    }
    else
    {
        window.performance = {};
        
    }
    
    if(Date.now)
    {
        window.performance.now = function()
        {
            return Date.now();
        };
        return;
    }
    
    window.performance.now = function()
    {
        return +(new Date());
    };
})();

var Helpers = {};

/**
 *
 * @param ebookURL URL string, or Blob (possibly File)
 * @returns string representing the file path / name from which the asset referenced by this URL originates
 */
Helpers.getEbookUrlFilePath = function(ebookURL) {
    if (!window.Blob || !window.File) return ebookURL;

    if (ebookURL instanceof File) {
        return ebookURL.name;
    } else if (ebookURL instanceof Blob) {
        return "readium-ebook.epub";
    } else {
        return ebookURL;
    }
};

/**
 * @param initialQuery: (optional) initial query string
 * @returns object (map between URL query parameter names and corresponding decoded / unescaped values)
 */
Helpers.getURLQueryParams = function(initialQuery) {
    var params = {};

    var query = initialQuery || window.location.search;
    if (query && query.length) {
        query = query.substring(1);
        var keyParams = query.split('&');
        for (var x = 0; x < keyParams.length; x++)
        {
            var keyVal = keyParams[x].split('=');
            if (keyVal.length > 1) {
                params[keyVal[0]] = decodeURIComponent(keyVal[1]);
            }
        }
    }

    return params;
};


/**
 * @param initialUrl: string corresponding a URL. If undefined/null, the default window.location is used.
 * @param queryStringOverrides: object that maps query parameter names with values (to be included in the resulting URL, while any other query params in the current window.location are preserved as-is)
 * @returns string corresponding to a URL obtained by concatenating the given URL with the given query parameters
 */
Helpers.buildUrlQueryParameters = function(initialUrl, queryStringOverrides) {
    var uriInstance = new URI(initialUrl || window.location);
    var startingQueryString = uriInstance.search();
    var urlFragment = uriInstance.hash();
    var urlPath = uriInstance.search('').hash('').toString();

    var newQueryString = "";

    for (var overrideKey in queryStringOverrides) {
        if (!queryStringOverrides.hasOwnProperty(overrideKey)) continue;

        if (!queryStringOverrides[overrideKey]) continue;

        var overrideEntry = queryStringOverrides[overrideKey];
        if (_.isString(overrideEntry)) {
            overrideEntry = overrideEntry.trim();
        }

        if (!overrideEntry) continue;

        if (overrideEntry.verbatim) {
            overrideEntry = overrideEntry.value; // grab value from entry as object
        } else {
            overrideEntry = encodeURIComponent(overrideEntry);
        }

        console.debug("URL QUERY PARAM OVERRIDE: " + overrideKey + " = " + overrideEntry);

        newQueryString += (overrideKey + "=" + overrideEntry);
        newQueryString += "&";
    }


    var parsedQueryString = Helpers.getURLQueryParams(startingQueryString);
    for (var parsedKey in parsedQueryString) {
        if (!parsedQueryString.hasOwnProperty(parsedKey)) continue;

        if (!parsedQueryString[parsedKey]) continue;

        if (queryStringOverrides[parsedKey]) continue;

        var parsedValue = parsedQueryString[parsedKey].trim();
        if (!parsedValue) continue;

        console.debug("URL QUERY PARAM PRESERVED: " + parsedKey + " = " + parsedValue);

        newQueryString += (parsedKey + "=" + encodeURIComponent(parsedValue));
        newQueryString += "&";
    }

    // remove trailing "&"
    newQueryString = newQueryString.slice(0, -1);

    return urlPath + "?" + newQueryString + urlFragment;
};


/**
 *
 * @param left
 * @param top
 * @param width
 * @param height
 * @constructor
 */
Helpers.Rect = function (left, top, width, height) {

    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;

    this.right = function () {
        return this.left + this.width;
    };

    this.bottom = function () {
        return this.top + this.height;
    };

    this.isOverlap = function (rect, tolerance) {

        if (tolerance == undefined) {
            tolerance = 0;
        }

        return !(rect.right() < this.left + tolerance ||
        rect.left > this.right() - tolerance ||
        rect.bottom() < this.top + tolerance ||
        rect.top > this.bottom() - tolerance);
    }
};

/**
 *
 * @param $element
 * @returns {Helpers.Rect}
 */
//This method treats multicolumn view as one long column and finds the rectangle of the element in this "long" column
//we are not using jQuery Offset() and width()/height() function because for multicolumn rendition_layout it produces rectangle as a bounding box of element that
// reflows between columns this is inconstant and difficult to analyze .
Helpers.Rect.fromElement = function ($element) {

    var e;
    if (_.isArray($element) || $element instanceof jQuery)
        e = $element[0];
    else
        e = $element;
    // TODODM this is somewhat hacky. Text (range?) elements don't have a position so we have to ask the parent.
    if (e.nodeType === 3) {
        e = $element.parent()[0];
    }


    var offsetLeft = e.offsetLeft;
    var offsetTop = e.offsetTop;
    var offsetWidth = e.offsetWidth;
    var offsetHeight = e.offsetHeight;

    while (e = e.offsetParent) {
        offsetLeft += e.offsetLeft;
        offsetTop += e.offsetTop;
    }

    return new Helpers.Rect(offsetLeft, offsetTop, offsetWidth, offsetHeight);
};
/**
 *
 * @param $epubHtml: The html that is to have font attributes added.
 * @param fontSize: The font size that is to be added to the element at all locations.
 * @param fontObj: The font Object containing at minimum the URL, and fontFamilyName (In fields url and fontFamily) respectively. Pass in null's on the object's fields to signal no font.
 * @param callback: function invoked when "done", which means that if there are asynchronous operations such as font-face loading via injected stylesheets, then the UpdateHtmlFontAttributes() function returns immediately but the caller should wait for the callback function call if fully-loaded font-face *stylesheets* are required on the caller's side (note that the caller's side may still need to detect *actual font loading*, via the FontLoader API or some sort of ResizeSensor to indicate that the updated font-family has been used to render the document). 
 */

Helpers.UpdateHtmlFontAttributes = function ($epubHtml, fontSize, fontObj, callback) {


    var FONT_FAMILY_ID = "readium_font_family_link";

    var docHead = $("head", $epubHtml);
    var link = $("#" + FONT_FAMILY_ID, docHead);

    const NOTHING = 0, ADD = 1, REMOVE = 2; //Types for css font family.
    var changeFontFamily = NOTHING;

    var fontLoadCallback = function() {
            
        var perf = false;

        // TODO: very slow on Firefox!
        // See https://github.com/readium/readium-shared-js/issues/274
        if (perf) var time1 = window.performance.now();



        if (changeFontFamily != NOTHING) {
            var fontFamilyStyle = $("style#readium-fontFamily", docHead);

            if (fontFamilyStyle && fontFamilyStyle[0]) {
                // REMOVE, or ADD (because we remove before re-adding from scratch)
                docHead[0].removeChild(fontFamilyStyle[0]);
            }
            if (changeFontFamily == ADD) {
                var style = $epubHtml[0].ownerDocument.createElement('style');
                style.setAttribute("id", "readium-fontFamily");
                style.appendChild($epubHtml[0].ownerDocument.createTextNode('html * { font-family: "'+fontObj.fontFamily+'" !important; }')); // this technique works for text-align too (e.g. text-align: justify !important;)

                docHead[0].appendChild(style);

                //fontFamilyStyle = $(style);
            }
        }
        
        // The code below does not work because jQuery $element.css() on html.body somehow "resets" the font: CSS directive by removing it entirely (font-family: works with !important, but unfortunately further deep inside the DOM there may be CSS applied with the font: directive, which somehow seems to take precedence! ... as shown in Chrome's developer tools)
        // ...thus why we use the above routine instead, to insert a new head>style element
        // // var doc = $epubHtml[0].ownerDocument;
        // // var body = doc.body;
        // var $body = $("body", $epubHtml);
        // // $body.css({
        // //     "font-size" : fontSize + "%",
        // //     "font-family" : ""
        // // });
        // $body.css("font-family", "");
        // if (changeFontFamily == ADD) {
            
        //     var existing = $body.attr("style");
        //     $body[0].setAttribute("style",
        //         existing + " ; font-family: '" + fontObj.fontFamily + "' !important ;" + " ; font: regular 100% '" + fontObj.fontFamily + "' !important ;");
        // }


        var factor = fontSize / 100;
        var win = $epubHtml[0].ownerDocument.defaultView;
        if (!win) {
            console.log("NIL $epubHtml[0].ownerDocument.defaultView");
            return;
        }

        // TODO: is this a complete list? Is there a better way to do this?
        //https://github.com/readium/readium-shared-js/issues/336
        // Note that font-family is handled differently, using an injected stylesheet with a catch-all selector that pushes an "!important" CSS value in the document's cascade.
        var $textblocks = $('p, div, span, h1, h2, h3, h4, h5, h6, li, blockquote, td, pre, dt, dd, code, a', $epubHtml); // excludes section, body etc.

        // need to do two passes because it is possible to have nested text blocks.
        // If you change the font size of the parent this will then create an inaccurate
        // font size for any children.
        for (var i = 0; i < $textblocks.length; i++) {

            var ele = $textblocks[i];
            
            var fontSizeAttr = ele.getAttribute('data-original-font-size');
            if (fontSizeAttr) {
                // early exit, original values already set.
                break;
            }

            var style = win.getComputedStyle(ele);
            
            var originalFontSize = parseInt(style.fontSize);
            ele.setAttribute('data-original-font-size', originalFontSize);

            var originalLineHeight = parseInt(style.lineHeight);
            // getComputedStyle will not calculate the line-height if the value is 'normal'. In this case parseInt will return NaN
            if (originalLineHeight) {
                ele.setAttribute('data-original-line-height', originalLineHeight);
            }
            
            // var fontFamilyAttr = ele.getAttribute('data-original-font-family');
            // if (!fontFamilyAttr) {
            //     var originalFontFamily = style.fontFamily;
            //     if (originalFontFamily) {
            //         ele.setAttribute('data-original-font-family', originalFontFamily);
            //     }
            // }
        }

        for (var i = 0; i < $textblocks.length; i++) {
            var ele = $textblocks[i];

            // TODO: group the 3x potential $(ele).css() calls below to avoid multiple jQuery style mutations 

            var fontSizeAttr = ele.getAttribute('data-original-font-size');
            var originalFontSize = fontSizeAttr ? Number(fontSizeAttr) : 0;
            if (originalFontSize) {
                $(ele).css("font-size", (originalFontSize * factor) + 'px');
            }

            var lineHeightAttr = ele.getAttribute('data-original-line-height');
            var originalLineHeight = lineHeightAttr ? Number(lineHeightAttr) : 0;
            if (originalLineHeight) {
                $(ele).css("line-height", (originalLineHeight * factor) + 'px');
            }
            
            // var fontFamilyAttr = ele.getAttribute('data-original-font-family');
            // switch(changeFontFamily){
            //     case NOTHING:
            //         break;
            //     case ADD:
            //         $(ele).css("font-family", fontObj.fontFamily);
            //         break;
            //     case REMOVE:
            //         $(ele).css("font-family", fontFamilyAttr);
            //         break;
            // }
        }

        $epubHtml.css("font-size", fontSize + "%");

        
        
        if (perf) {
            var time2 = window.performance.now();
        
            // Firefox: 80+
            // Chrome: 4-10
            // Edge: 15-34
            // IE: 10-15
            // https://readium.firebase.com/?epub=..%2Fepub_content%2Faccessible_epub_3&goto=%7B%22idref%22%3A%22id-id2635343%22%2C%22elementCfi%22%3A%22%2F4%2F2%5Bbuilding_a_better_epub%5D%2F10%2F44%2F6%2C%2F1%3A334%2C%2F1%3A335%22%7D
            
            var diff = time2-time1;
            console.log(diff);
            
            // setTimeout(function(){
            //     alert(diff);
            // }, 2000);
        }

        callback();
    };
    var fontLoadCallback_ = _.once(fontLoadCallback);

    if(fontObj.fontFamily && fontObj.url){
        var dataFontFamily = link.length ? link.attr("data-fontfamily") : undefined;

        if(!link.length){
            changeFontFamily = ADD;

            setTimeout(function(){
                
                link = $("<link/>", {
                    "id" : FONT_FAMILY_ID,
                    "data-fontfamily" : fontObj.fontFamily,
                    "rel" : "stylesheet",
                    "type" : "text/css"
                });
                docHead.append(link);
                    
                link.attr({
                    "href" : fontObj.url
                });
            }, 0);
        }
        else if(dataFontFamily != fontObj.fontFamily){
            changeFontFamily = ADD;
        
            link.attr({
                "data-fontfamily" : fontObj.fontFamily,
                "href" : fontObj.url
            });
        } else {
            changeFontFamily = NOTHING;
        }
    }
    else{
        changeFontFamily = REMOVE;
        if(link.length) link.remove();
    }

    if (changeFontFamily == ADD) {
        // just in case the link@onload does not trigger, we set a timeout
        setTimeout(function(){
            fontLoadCallback_();
        }, 100);
    }
    else { // REMOVE, NOTHING
        fontLoadCallback_();
    }
};


/**
 *
 * @param contentRef
 * @param sourceFileHref
 * @returns {string}
 * @constructor
 */
Helpers.ResolveContentRef = function (contentRef, sourceFileHref) {

    if (!sourceFileHref) {
        return contentRef;
    }

    var sourceParts = sourceFileHref.split("/");
    sourceParts.pop(); //remove source file name

    var pathComponents = contentRef.split("/");

    while (sourceParts.length > 0 && pathComponents[0] === "..") {

        sourceParts.pop();
        pathComponents.splice(0, 1);
    }

    var combined = sourceParts.concat(pathComponents);

    return combined.join("/");

};

/**
 *
 * @param str
 * @param suffix
 * @returns {boolean}
 * @static
 */
Helpers.EndsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 *
 * @param str
 * @param suffix
 * @returns {boolean}
 * @static
 */
Helpers.BeginsWith = function (str, suffix) {

    return str.indexOf(suffix) === 0;
};

/**
 *
 * @param str
 * @param toRemove
 * @returns {string}
 * @static
 */
Helpers.RemoveFromString = function (str, toRemove) {

    var startIx = str.indexOf(toRemove);

    if (startIx == -1) {
        return str;
    }

    return str.substring(0, startIx) + str.substring(startIx + toRemove.length);
};

/**
 *
 * @param margin
 * @param border
 * @param padding
 * @constructor
 */
Helpers.Margins = function (margin, border, padding) {

    this.margin = margin;
    this.border = border;
    this.padding = padding;

    this.left = this.margin.left + this.border.left + this.padding.left;
    this.right = this.margin.right + this.border.right + this.padding.right;
    this.top = this.margin.top + this.border.top + this.padding.top;
    this.bottom = this.margin.bottom + this.border.bottom + this.padding.bottom;

    this.width = function () {
        return this.left + this.right;
    };

    this.height = function () {
        return this.top + this.bottom;
    }
};

/**
 *
 * @param $iframe
 */
Helpers.triggerLayout = function ($iframe) {

    var doc = $iframe[0].contentDocument;

    if (!doc) {
        return;
    }

    var ss = undefined;
    try {
        ss = doc.styleSheets && doc.styleSheets.length ? doc.styleSheets[0] : undefined;
        if (!ss) {
            var style = doc.createElement('style');
            doc.head.appendChild(style);
            style.appendChild(doc.createTextNode(''));
            ss = style.sheet;
        }

        if (ss) {
            var cssRule = 'body:first-child::before {content:\'READIUM\';color: red;font-weight: bold;}';
            if (ss.cssRules) {
                ss.insertRule(cssRule, ss.cssRules.length);
            } else {
                ss.insertRule(cssRule, 0);
            }
        }
    }
    catch (ex) {
        console.error(ex);
    }

    try {
        var el = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
        el.appendChild(doc.createTextNode("*{}"));
        doc.body.appendChild(el);
        doc.body.removeChild(el);

        if (ss) {
            if (ss.cssRules) {
                ss.deleteRule(ss.cssRules.length - 1);
            } else {
                ss.deleteRule(0);
            }
        }
    }
    catch (ex) {
        console.error(ex);
    }

    if (doc.body) {
        var val = doc.body.offsetTop; // triggers layout
    }

};

/**
 *
 * @param $viewport
 * @param spineItem
 * @param settings
 * @returns {boolean}
 */
//Based on https://docs.google.com/spreadsheet/ccc?key=0AoPMUkQhc4wcdDI0anFvWm96N0xRT184ZE96MXFRdFE&usp=drive_web#gid=0 doc
// Returns falsy and truthy
// true and false mean that the synthetic-spread or single-page is "forced" (to be respected whatever the external conditions)
// 1 and 0 mean that the synthetic-spread or single-page is "not forced" (is allowed to be overriden by external conditions, such as optimum column width / text line number of characters, etc.)
Helpers.deduceSyntheticSpread = function ($viewport, spineItem, settings) {

    if (!$viewport || $viewport.length == 0) {
        return 0; // non-forced
    }

    //http://www.idpf.org/epub/fxl/#property-spread-values

    var rendition_spread = spineItem ? spineItem.getRenditionSpread() : undefined;

    if (rendition_spread === SpineItem.RENDITION_SPREAD_NONE) {
        return false; // forced

        //"Reading Systems must not incorporate this spine item in a synthetic spread."
    }

    if (settings.syntheticSpread == "double") {
        return true; // forced
    }
    else if (settings.syntheticSpread == "single") {
        return false; // forced
    }

    if (!spineItem) {
        return 0; // non-forced
    }

    if (rendition_spread === SpineItem.RENDITION_SPREAD_BOTH) {
        return true; // forced

        //"Reading Systems should incorporate this spine item in a synthetic spread regardless of device orientation."
    }

    var orientation = Helpers.getOrientation($viewport);

    if (rendition_spread === SpineItem.RENDITION_SPREAD_LANDSCAPE) {
        return orientation === Globals.Views.ORIENTATION_LANDSCAPE; // forced

        //"Reading Systems should incorporate this spine item in a synthetic spread only when the device is in landscape orientation."
    }

    if (rendition_spread === SpineItem.RENDITION_SPREAD_PORTRAIT) {
        return orientation === Globals.Views.ORIENTATION_PORTRAIT; // forced

        //"Reading Systems should incorporate this spine item in a synthetic spread only when the device is in portrait orientation."
    }

    if (!rendition_spread || rendition_spread === SpineItem.RENDITION_SPREAD_AUTO) {
        // if no spread set in document and user didn't set in in setting we will do double for landscape
        var landscape = orientation === Globals.Views.ORIENTATION_LANDSCAPE;
        return landscape ? 1 : 0; // non-forced

        //"Reading Systems may use synthetic spreads in specific or all device orientations as part of a display area utilization optimization process."
    }

    console.warn("Helpers.deduceSyntheticSpread: spread properties?!");
    return 0; // non-forced
};

/**
 *
 * @param $element
 * @returns {Helpers.Rect}
 */
Helpers.Margins.fromElement = function ($element) {
    return new this($element.margin(), $element.border(), $element.padding());
};

/**
 * @returns {Helpers.Rect}
 */
Helpers.Margins.empty = function () {

    return new this({left: 0, right: 0, top: 0, bottom: 0}, {left: 0, right: 0, top: 0, bottom: 0}, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    });

};

/**
 *
 * @param name
 * @param params
 * @returns {Helpers.loadTemplate.cache}
 */
Helpers.loadTemplate = function (name, params) {
    return Helpers.loadTemplate.cache[name];
};

/**
 *
 * @type {{fixed_book_frame: string, single_page_frame: string, scrolled_book_frame: string, reflowable_book_frame: string, reflowable_book_page_frame: string}}
 */
Helpers.loadTemplate.cache = {
    "fixed_book_frame": '<div id="fixed-book-frame" class="clearfix book-frame fixed-book-frame"></div>',
    "single_page_frame": '<div><div id="scaler"><iframe enable-annotation="enable-annotation" allowfullscreen="allowfullscreen" scrolling="no" class="iframe-fixed"></iframe></div></div>',
    //"single_page_frame" : '<div><iframe scrolling="no" class="iframe-fixed" id="scaler"></iframe></div>',

    "scrolled_book_frame": '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="scrolled-content-frame"></div></div>',
    "reflowable_book_frame": '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"></div>',
    "reflowable_book_page_frame": '<div id="reflowable-content-frame" class="reflowable-content-frame"><iframe enable-annotation="enable-annotation" allowfullscreen="allowfullscreen" scrolling="no" id="epubContentIframe"></iframe></div>'
    /***
     * The `enable-annotation` attribute on an iframe helps detect the content frames for annotating tools such as Hypothesis
     * See here for more details:
     * https://h.readthedocs.io/projects/client/en/latest/publishers/embedding/
     * https://github.com/hypothesis/client/pull/533
     ***/
};

/**
 *
 * @param styles
 * @param $element
 */
Helpers.setStyles = function (styles, $element) {

    var count = styles.length;

    if (!count) {
        return;
    }

    var stylingGlobal = "";
    var stylings = [];
    var elementIsDocument = ($element && $element.createTextNode) ? true : false;

    for (var i = 0; i < count; i++) {
        var style = styles[i];

        if (elementIsDocument) {
            if (!style.selector || style.selector == "" || style.selector == "html" || style.selector == "body" || style.selector == "*") {
                for (var prop in style.declarations) {
                    if (style.declarations.hasOwnProperty(prop)) {
                        // backgroundColor => background-color
                        var prop_ = prop.replace(/[A-Z]/g, function(a) {return '-' + a.toLowerCase()});

                        stylingGlobal += prop_ + ": " + style.declarations[prop] + " !important; ";
                    }
                }
            } else {
                //$(style.selector, $($element.doumentElement)).css(style.declarations);

                var cssProperties = "";

                for (var prop in style.declarations) {
                    if (style.declarations.hasOwnProperty(prop)) {
                        // backgroundColor => background-color
                        var prop_ = prop.replace(/[A-Z]/g, function(a) {return '-' + a.toLowerCase()});
                        cssProperties += prop_ + ": " + style.declarations[prop] + " !important; ";
                    }
                }

                stylings.push({selector: style.selector, cssProps: cssProperties});
            }
            
        } else { // HTML element
            if (style.selector) {
                $(style.selector, $element).css(style.declarations);
            }
            else {
                $element.css(style.declarations);
            }
        }
    }

    if (elementIsDocument) { // HTML document

        var doc = $element;

        var bookStyleElement = $("style#readium-bookStyles", doc.head);

        if (bookStyleElement && bookStyleElement[0]) {
            // we remove before re-adding from scratch
            doc.head.removeChild(bookStyleElement[0]);
        }
        
        var cssStylesheet = "";

        if (stylingGlobal.length > 0) {
            cssStylesheet += ' body, body::after, body::before, body *, body *::after, body *::before { ' + stylingGlobal + ' } ';
        }

        if (stylings.length > 0) {
            for (var i = 0; i < stylings.length; i++) {
                var styling = stylings[i];

                cssStylesheet += ' ' + styling.selector + ' { ' + styling.cssProps + ' } ';
            }
        }

        if (cssStylesheet.length > 0) {

            var styleElement = doc.createElement('style');
            styleElement.setAttribute("id", "readium-bookStyles");
            styleElement.appendChild(doc.createTextNode(cssStylesheet));

            doc.head.appendChild(styleElement);

            //bookStyleElement = $(styleElement);
        }
    }
};

/**
 *
 * @param iframe
 * @returns {boolean}
 */
Helpers.isIframeAlive = function (iframe) {
    var w = undefined;
    var d = undefined;
    try {
        w = iframe.contentWindow;
        d = iframe.contentDocument;
    }
    catch (ex) {
        console.error(ex);
        return false;
    }

    return w && d;
};

/**
 *
 * @param $viewport
 * @returns {Globals.Views.ORIENTATION_LANDSCAPE|Globals.Views.ORIENTATION_PORTRAIT}
 */
Helpers.getOrientation = function ($viewport) {

    var viewportWidth = $viewport.width();
    var viewportHeight = $viewport.height();

    if (!viewportWidth || !viewportHeight) {
        return undefined;
    }

    return viewportWidth >= viewportHeight ? Globals.Views.ORIENTATION_LANDSCAPE : Globals.Views.ORIENTATION_PORTRAIT;
};

/**
 *
 * @param item
 * @param orientation
 * @returns {boolean}
 */
Helpers.isRenditionSpreadPermittedForItem = function (item, orientation) {

    var rendition_spread = item.getRenditionSpread();

    return !rendition_spread
        || rendition_spread == SpineItem.RENDITION_SPREAD_BOTH
        || rendition_spread == SpineItem.RENDITION_SPREAD_AUTO
        || (rendition_spread == SpineItem.RENDITION_SPREAD_LANDSCAPE
        && orientation == Globals.Views.ORIENTATION_LANDSCAPE)
        || (rendition_spread == SpineItem.RENDITION_SPREAD_PORTRAIT
        && orientation == Globals.Views.ORIENTATION_PORTRAIT );
};

Helpers.CSSTransition = function ($el, trans) {

    // does not work!
    //$el.css('transition', trans);

    var css = {};
    // empty '' prefix FIRST!
    _.each(['', '-webkit-', '-moz-', '-ms-'], function (prefix) {
        css[prefix + 'transition'] = prefix + trans;
    });
    $el.css(css);
}

//scale, left, top, angle, origin
Helpers.CSSTransformString = function (options) {
    var enable3D = options.enable3D ? true : false;

    var translate, scale, rotation,
        origin = options.origin;

    if (options.left || options.top) {
        var left = options.left || 0,
            top = options.top || 0;

        translate = enable3D ? ("translate3D(" + left + "px, " + top + "px, 0)") : ("translate(" + left + "px, " + top + "px)");
    }
    if (options.scale) {
        scale = enable3D ? ("scale3D(" + options.scale + ", " + options.scale + ", 0)") : ("scale(" + options.scale + ")");
    }
    if (options.angle) {
        rotation = enable3D ? ("rotate3D(0,0," + options.angle + "deg)") : ("rotate(" + options.angle + "deg)");
    }

    if (!(translate || scale || rotation)) {
        return {};
    }

    var transformString = (translate && scale) ? (translate + " " + scale) : (translate ? translate : scale); // the order is important!
    if (rotation) {
        transformString = transformString + " " + rotation;
        //transformString = rotation + " " + transformString;
    }

    var css = {};
    css['transform'] = transformString;
    css['transform-origin'] = origin ? origin : (enable3D ? '0 0 0' : '0 0');
    return css;
};

Helpers.extendedThrottle = function (startCb, tickCb, endCb, tickRate, waitThreshold, context) {
    if (!tickRate) tickRate = 250;
    if (!waitThreshold) waitThreshold = tickRate;

    var first = true,
        last,
        deferTimer;

    return function () {
        var ctx = context || this,
            now = (Date.now && Date.now()) || new Date().getTime(),
            args = arguments;

        if (!(last && now < last + tickRate)) {
            last = now;
            if (first) {
                startCb.apply(ctx, args);
                first = false;
            } else {
                tickCb.apply(ctx, args);
            }
        }

        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
            last = now;
            first = true;
            endCb.apply(ctx, args);
        }, waitThreshold);
    };
};


//TODO: consider using CSSOM escape() or polyfill
//https://github.com/mathiasbynens/CSS.escape/blob/master/css.escape.js
//http://mathiasbynens.be/notes/css-escapes
/**
 *
 * @param sel
 * @returns {string}
 */
Helpers.escapeJQuerySelector = function (sel) {
    //http://api.jquery.com/category/selectors/
    //!"#$%&'()*+,./:;<=>?@[\]^`{|}~
    // double backslash escape

    if (!sel) return undefined;

    var selector = sel.replace(/([;&,\.\+\*\~\?':"\!\^#$%@\[\]\(\)<=>\|\/\\{}`])/g, '\\$1');

    // if (selector !== sel)
    // {
    //     console.debug("---- SELECTOR ESCAPED");
    //     console.debug("1: " + sel);
    //     console.debug("2: " + selector);
    // }
    // else
    // {
    //     console.debug("---- SELECTOR OKAY: " + sel);
    // }

    return selector;
};

Helpers.polyfillCaretRangeFromPoint = function(document) {
    //Derived from css-regions-polyfill:
    // https://github.com/FremyCompany/css-regions-polyfill/blob/bfbb6445ec2a2a883005ab8801d8463fa54b5701/src/range-extensions.js
    //Copyright (c) 2013 François REMY
    //Copyright (c) 2013 Adobe Systems Inc.
    //Licensed under the Apache License, Version 2.0
    if (!document.caretRangeFromPoint) {
        if (document.caretPositionFromPoint) {
            document.caretRangeFromPoint = function caretRangeFromPoint(x, y) {
                var r = document.createRange();
                var p = document.caretPositionFromPoint(x, y);
                if (!p) return null;
                if (p.offsetNode) {
                    r.setStart(p.offsetNode, p.offset);
                    r.setEnd(p.offsetNode, p.offset);
                }
                return r;
            }
        } else if ((document.body || document.createElement('body')).createTextRange) {
            //
            // we may want to convert TextRange to Range
            //

            //TextRangeUtils, taken from: https://code.google.com/p/ierange/
            //Copyright (c) 2009 Tim Cameron Ryan
            //Released under the MIT/X License
            var TextRangeUtils = {
                convertToDOMRange: function(textRange, document) {
                    var adoptBoundary = function(domRange, textRangeInner, bStart) {
                        // iterate backwards through parent element to find anchor location
                        var cursorNode = document.createElement('a'),
                            cursor = textRangeInner.duplicate();
                        cursor.collapse(bStart);
                        var parent = cursor.parentElement();
                        do {
                            parent.insertBefore(cursorNode, cursorNode.previousSibling);
                            cursor.moveToElementText(cursorNode);
                        } while (cursor.compareEndPoints(bStart ? 'StartToStart' : 'StartToEnd', textRangeInner) > 0 && cursorNode.previousSibling);
                        // when we exceed or meet the cursor, we've found the node
                        if (cursor.compareEndPoints(bStart ? 'StartToStart' : 'StartToEnd', textRangeInner) == -1 && cursorNode.nextSibling) {
                            // data node
                            cursor.setEndPoint(bStart ? 'EndToStart' : 'EndToEnd', textRangeInner);
                            domRange[bStart ? 'setStart' : 'setEnd'](cursorNode.nextSibling, cursor.text.length);
                        } else {
                            // element
                            domRange[bStart ? 'setStartBefore' : 'setEndBefore'](cursorNode);
                        }
                        cursorNode.parentNode.removeChild(cursorNode);
                    };
                    // return a DOM range
                    var domRange = document.createRange();
                    adoptBoundary(domRange, textRange, true);
                    adoptBoundary(domRange, textRange, false);
                    return domRange;
                }
            };

            document.caretRangeFromPoint = function caretRangeFromPoint(x, y) {
                // the accepted number of vertical backtracking, in CSS pixels
                var IYDepth = 40;
                // try to create a text range at the specified location
                var tr = document.body.createTextRange();
                for (var iy = IYDepth; iy; iy = iy - 4) {
                    try {
                        tr.moveToPoint(x, iy + y - IYDepth);
                        return TextRangeUtils.convertToDOMRange(tr, document);
                    } catch (ex) {
                    }
                }
                // if that fails, return the location just after the element located there
                try {
                    var elem = document.elementFromPoint(x - 1, y - 1);
                    var r = document.createRange();
                    r.setStartAfter(elem);
                    return r;
                } catch (ex) {
                    return null;
                }
            }
        }
    }
};

return Helpers;
});
