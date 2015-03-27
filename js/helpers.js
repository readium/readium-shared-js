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

/**
 *
 * @param left
 * @param top
 * @param width
 * @param height
 * @constructor
 */
ReadiumSDK.Helpers.Rect = function(left, top, width, height) {

    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;

    this.right = function () {
        return this.left + this.width;
    };

    this.bottom = function() {
        return this.top + this.height;
    };

    this.isOverlap = function(rect, tolerance) {

        if(tolerance == undefined) {
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
 * @returns {ReadiumSDK.Helpers.Rect}
 */
//This method treats multicolumn view as one long column and finds the rectangle of the element in this "long" column
//we are not using jQuery Offset() and width()/height() function because for multicolumn rendition_layout it produces rectangle as a bounding box of element that
// reflows between columns this is inconstant and difficult to analyze .
ReadiumSDK.Helpers.Rect.fromElement = function($element) {

    var e;
    if (_.isArray($element) || $element instanceof jQuery)
       e = $element[0];
    else
        e = $element;
    // TODODM this is somewhat hacky. Text (range?) elements don't have a position so we have to ask the parent.
    if (e.nodeType === 3)
    {
        e = $element.parent()[0];
    }


    var offsetLeft = e.offsetLeft;
    var offsetTop = e.offsetTop;
    var offsetWidth = e.offsetWidth;
    var offsetHeight = e.offsetHeight;

    while(e = e.offsetParent) {
        offsetLeft += e.offsetLeft;
        offsetTop += e.offsetTop;
    }

    return new ReadiumSDK.Helpers.Rect(offsetLeft, offsetTop, offsetWidth, offsetHeight);
};

ReadiumSDK.Helpers.UpdateHtmlFontSize = function($epubHtml, fontSize){

    
    var factor = fontSize/100;
    var win = $epubHtml[0].ownerDocument.defaultView;
    var $textblocks = $('p, div, span, h1, h2, h3, h4, h5, h6, li, blockquote, td, pre', $epubHtml);
    var originalLineHeight;


    // need to do two passes because it is possible to have nested text blocks. 
    // If you change the font size of the parent this will then create an inaccurate
    // font size for any children. 
    for (var i = 0; i < $textblocks.length; i++){
        var ele = $textblocks[i],
            fontSizeAttr = ele.getAttribute('data-original-font-size');

        if (!fontSizeAttr){
            var style = win.getComputedStyle(ele);
            var originalFontSize = parseInt(style.fontSize);
            originalLineHeight = parseInt(style.lineHeight);
            
            ele.setAttribute('data-original-font-size', originalFontSize);
            // getComputedStyle will not calculate the line-height if the value is 'normal'. In this case parseInt will return NaN
            if (originalLineHeight){
                ele.setAttribute('data-original-line-height', originalLineHeight);
            }
        }
    }

    // reset variable so the below logic works. All variables in JS are function scoped. 
    originalLineHeight = 0;
    for (var i = 0; i < $textblocks.length; i++){
        var ele = $textblocks[i],
            fontSizeAttr = ele.getAttribute('data-original-font-size'),
            lineHeightAttr = ele.getAttribute('data-original-line-height'),
            originalFontSize = Number(fontSizeAttr);

        if (lineHeightAttr){
            originalLineHeight = Number(lineHeightAttr);
        }
        else{
            originalLineHeight = 0;
        }

        ele.style.fontSize = (originalFontSize * factor) + 'px';
        if (originalLineHeight){
            ele.style.lineHeight = (originalLineHeight * factor) + 'px';
        }

    }
    $epubHtml.css("font-size", fontSize + "%");
}


/**
 *
 * @param contentRef
 * @param sourceFileHref
 * @returns {string}
 * @constructor
 */
ReadiumSDK.Helpers.ResolveContentRef = function(contentRef, sourceFileHref) {

    if(!sourceFileHref) {
        return contentRef;
    }

    var sourceParts = sourceFileHref.split("/");
    sourceParts.pop(); //remove source file name

    var pathComponents = contentRef.split("/");

    while(sourceParts.length  > 0 && pathComponents[0] === "..") {

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
ReadiumSDK.Helpers.EndsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 *
 * @param str
 * @param suffix
 * @returns {boolean}
 * @static
 */
ReadiumSDK.Helpers.BeginsWith = function (str, suffix) {

    return str.indexOf(suffix) === 0;
};

/**
 *
 * @param str
 * @param toRemove
 * @returns {string}
 * @static
 */
ReadiumSDK.Helpers.RemoveFromString = function(str, toRemove) {

    var startIx = str.indexOf(toRemove);

    if(startIx == -1) {
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
ReadiumSDK.Helpers.Margins = function(margin, border, padding) {

    this.margin = margin;
    this.border = border;
    this.padding = padding;

    this.left =  this.margin.left + this.border.left + this.padding.left;
    this.right = this.margin.right + this.border.right + this.padding.right;
    this.top = this.margin.top + this.border.top + this.padding.top;
    this.bottom = this.margin.bottom + this.border.bottom + this.padding.bottom;

    this.width = function() {
        return this.left + this.right;
    };

    this.height = function() {
        return this.top + this.bottom;
    }
};

/**
 *
 * @param $iframe
 */
ReadiumSDK.Helpers.triggerLayout = function($iframe) {

    var doc = $iframe[0].contentDocument;

    if(!doc) {
        return;
    }
    
    var ss = undefined;
    try
    {
        ss = doc.styleSheets && doc.styleSheets.length ? doc.styleSheets[0] : undefined;
        if (!ss)
        {
            var style = doc.createElement('style');
            doc.head.appendChild(style);
            style.appendChild(doc.createTextNode(''));
            ss = style.sheet;
        }
    
        if (ss)
            ss.insertRule('body:first-child::before {content:\'READIUM\';color: red;font-weight: bold;}', ss.cssRules.length);
    }
    catch (ex)
    {
        webkit.messageHandlers.consoleerror.postMessage(ex.toString());
    }
    
    try
    {
        var el = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
        el.appendChild(doc.createTextNode("*{}"));
        doc.body.appendChild(el);
        doc.body.removeChild(el);

        if (ss)
            ss.deleteRule(ss.cssRules.length-1);
    }
    catch (ex)
    {
        webkit.messageHandlers.consoleerror.postMessage(ex.toString());
    }

    if(doc.body) {
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
ReadiumSDK.Helpers.deduceSyntheticSpread = function($viewport, spineItem, settings) {

    if(!$viewport || $viewport.length == 0) {
        return 0; // non-forced
    }

    //http://www.idpf.org/epub/fxl/#property-spread-values

    var rendition_spread = spineItem ? spineItem.getRenditionSpread() : undefined;

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_NONE) {
        return false; // forced
        
        //"Reading Systems must not incorporate this spine item in a synthetic spread."
    }

    if(settings.syntheticSpread == "double") {
        return true; // forced
    }
    else if(settings.syntheticSpread == "single") {
        return false; // forced
    }

    if(!spineItem) {
        return 0; // non-forced
    }

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_BOTH) {
        return true; // forced
        
        //"Reading Systems should incorporate this spine item in a synthetic spread regardless of device orientation."
    }

    var orientation = ReadiumSDK.Helpers.getOrientation($viewport);

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_LANDSCAPE) {
        return orientation === ReadiumSDK.Views.ORIENTATION_LANDSCAPE; // forced
        
        //"Reading Systems should incorporate this spine item in a synthetic spread only when the device is in landscape orientation."
    }

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_PORTRAIT) {
        return orientation === ReadiumSDK.Views.ORIENTATION_PORTRAIT; // forced
        
        //"Reading Systems should incorporate this spine item in a synthetic spread only when the device is in portrait orientation."
    }

    if(!rendition_spread || rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_AUTO) {
        // if no spread set in document and user didn't set in in setting we will do double for landscape
        var landscape = orientation === ReadiumSDK.Views.ORIENTATION_LANDSCAPE;
        return landscape ? 1 : 0; // non-forced

        //"Reading Systems may use synthetic spreads in specific or all device orientations as part of a display area utilization optimization process."
    }

    webkit.messageHandlers.consolewarn.postMessage("ReadiumSDK.Helpers.deduceSyntheticSpread: spread properties?!");
    return 0; // non-forced
};

/**
 *
 * @param $element
 * @returns {ReadiumSDK.Helpers.Rect}
 */
ReadiumSDK.Helpers.Margins.fromElement = function($element) {
    return new this($element.margin(), $element.border(), $element.padding());
};

/**
 * @returns {ReadiumSDK.Helpers.Rect}
 */
ReadiumSDK.Helpers.Margins.empty = function() {

    return new this({left:0, right:0, top:0, bottom: 0}, {left:0, right:0, top:0, bottom: 0}, {left:0, right:0, top:0, bottom: 0});

};

/**
 *
 * @param name
 * @param params
 * @returns {ReadiumSDK.Helpers.loadTemplate.cache}
 */
ReadiumSDK.Helpers.loadTemplate = function(name, params) {
    return ReadiumSDK.Helpers.loadTemplate.cache[name];
};

/**
 *
 * @type {{fixed_book_frame: string, single_page_frame: string, scrolled_book_frame: string, reflowable_book_frame: string, reflowable_book_page_frame: string}}
 */
ReadiumSDK.Helpers.loadTemplate.cache = {
    "fixed_book_frame" : '<div id="fixed-book-frame" class="clearfix book-frame fixed-book-frame"></div>',
    
    "single_page_frame" : '<div><div id="scaler"><iframe scrolling="no" class="iframe-fixed"></iframe></div></div>',
    //"single_page_frame" : '<div><iframe scrolling="no" class="iframe-fixed" id="scaler"></iframe></div>',
    
    "scrolled_book_frame" : '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="scrolled-content-frame"></div></div>',
    "reflowable_book_frame" : '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"></div>',
    "reflowable_book_page_frame": '<div id="reflowable-content-frame" class="reflowable-content-frame"><iframe scrolling="no" id="epubContentIframe"></iframe></div>'
};

/**
 *
 * @param styles
 * @param $element
 */
ReadiumSDK.Helpers.setStyles = function(styles, $element) {

    var count = styles.length;

    if(!count) {
        return;
    }

    for(var i = 0; i < count; i++) {
        var style = styles[i];
        if(style.selector) {
            $(style.selector, $element).css(style.declarations);
        }
        else {
            $element.css(style.declarations);
        }
    }

};

/**
 *
 * @param iframe
 * @returns {boolean}
 */
ReadiumSDK.Helpers.isIframeAlive = function(iframe)
{
    var w = undefined;
    var d = undefined;
    try
    {
        w = iframe.contentWindow;
        d = iframe.contentDocument;
    }
    catch (ex)
    {
        webkit.messageHandlers.consoleerror.postMessage(ex.toString());
        return false;
    }
    
    return w && d;
}

/**
 *
 * @param $viewport
 * @returns {ReadiumSDK.Views.ORIENTATION_LANDSCAPE|ReadiumSDK.Views.ORIENTATION_PORTRAIT}
 */
ReadiumSDK.Helpers.getOrientation = function($viewport) {

    var viewportWidth = $viewport.width();
    var viewportHeight = $viewport.height();

    if(!viewportWidth || !viewportHeight) {
        return undefined;
    }

    return viewportWidth >= viewportHeight ? ReadiumSDK.Views.ORIENTATION_LANDSCAPE : ReadiumSDK.Views.ORIENTATION_PORTRAIT;
};

/**
 *
 * @param item
 * @param orientation
 * @returns {boolean}
 */
ReadiumSDK.Helpers.isRenditionSpreadPermittedForItem = function(item, orientation) {

    var rendition_spread = item.getRenditionSpread();

    return  !rendition_spread
        ||  rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_BOTH
        ||  rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_AUTO
        ||  (rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_LANDSCAPE
        && orientation == ReadiumSDK.Views.ORIENTATION_LANDSCAPE)
        ||  (rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_PORTRAIT
        && orientation == ReadiumSDK.Views.ORIENTATION_PORTRAIT );
};

ReadiumSDK.Helpers.CSSTransition = function($el, trans) {
    
    // does not work!
    //$el.css('transition', trans);
    
    var css={};
    // empty '' prefix FIRST!
    _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) {
        css[prefix + 'transition'] = prefix + trans;
    });
    $el.css(css);
}

//scale, left, top, angle, origin
ReadiumSDK.Helpers.CSSTransformString = function(options) {
    var enable3D = options.enable3D ? true : false;
    
    var translate, scale, rotation,
        origin = options.origin;

    if (options.left || options.top){
        var left = options.left || 0, 
            top = options.top || 0;

        translate = enable3D ? ("translate3D(" + left + "px, " + top + "px, 0)") : ("translate(" + left + "px, " + top + "px)");
    }
    if (options.scale){
        scale = enable3D ? ("scale3D(" + options.scale + ", " + options.scale + ", 0)") : ("scale(" + options.scale + ")");
    }
    if (options.angle){
        rotation =  enable3D ? ("rotate3D(0,0," + options.angle + "deg)") : ("rotate(" + options.angle + "deg)");
    }
    
    if (!(translate || scale || rotation)){
        return {};
    }

    var transformString = (translate && scale) ? (translate + " " + scale) : (translate ? translate : scale); // the order is important!
    if (rotation)
    {
        transformString = transformString + " " + rotation;
        //transformString = rotation + " " + transformString;
    }

    var css = {};
    css['transform'] = transformString;
    css['transform-origin'] = origin ? origin : (enable3D ? '0 0 0' : '0 0');
    return css;
};

ReadiumSDK.Helpers.extendedThrottle = function (startCb, tickCb, endCb, tickRate, waitThreshold, context) {
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
ReadiumSDK.Helpers.escapeJQuerySelector = function(sel) {
        //http://api.jquery.com/category/selectors/
        //!"#$%&'()*+,./:;<=>?@[\]^`{|}~
        // double backslash escape
        
        if (!sel) return undefined;
        
        var selector = sel.replace(/([;&,\.\+\*\~\?':"\!\^#$%@\[\]\(\)<=>\|\/\\{}`])/g, '\\$1');
        
        // if (selector !== sel)
        // {
        //     webkit.messageHandlers.consoledebug.postMessage("---- SELECTOR ESCAPED");
        //     webkit.messageHandlers.consoledebug.postMessage("1: " + sel);
        //     webkit.messageHandlers.consoledebug.postMessage("2: " + selector);
        // }
        // else
        // {
        //     webkit.messageHandlers.consoledebug.postMessage("---- SELECTOR OKAY: " + sel);
        // }
        
        return selector;
};
    // TESTS BELOW ALL WORKING FINE :)
    // (RegExp typos are hard to spot!)
    // escapeSelector('!');
    // escapeSelector('"');
    // escapeSelector('#');
    // escapeSelector('$');
    // escapeSelector('%');
    // escapeSelector('&');
    // escapeSelector("'");
    // escapeSelector('(');
    // escapeSelector(')');
    // escapeSelector('*');
    // escapeSelector('+');
    // escapeSelector(',');
    // escapeSelector('.');
    // escapeSelector('/');
    // escapeSelector(':');
    // escapeSelector(';');
    // escapeSelector('<');
    // escapeSelector('=');
    // escapeSelector('>');
    // escapeSelector('?');
    // escapeSelector('@');
    // escapeSelector('[');
    // escapeSelector('\\');
    // escapeSelector(']');
    // escapeSelector('^');
    // escapeSelector('`');
    // escapeSelector('{');
    // escapeSelector('|');
    // escapeSelector('}');
    // escapeSelector('~');
