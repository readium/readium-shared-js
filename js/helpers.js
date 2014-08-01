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


/**
 * @return {string}
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
 * @return {boolean}
 */
ReadiumSDK.Helpers.EndsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

ReadiumSDK.Helpers.BeginsWith = function (str, suffix) {

    return str.indexOf(suffix) === 0;
};

ReadiumSDK.Helpers.RemoveFromString = function(str, toRemove) {

    var startIx = str.indexOf(toRemove);

    if(startIx == -1) {
        return str;
    }

    return str.substring(0, startIx) + str.substring(startIx + toRemove.length);
};

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
        console.error(ex);
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
        console.error(ex);
    }

    if(doc.body) {
        var val = doc.body.offsetTop; // triggers layout
    }

};

//Based on https://docs.google.com/spreadsheet/ccc?key=0AoPMUkQhc4wcdDI0anFvWm96N0xRT184ZE96MXFRdFE&usp=drive_web#gid=0 doc
ReadiumSDK.Helpers.deduceSyntheticSpread = function($viewport, spineItem, settings) {

    if(!$viewport || $viewport.length == 0) {
        return false;
    }

    var rendition_spread = spineItem ? spineItem.getRenditionSpread() : undefined;

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_NONE) {
        return false;
    }

    if(settings.syntheticSpread == "double") {
        return true;
    }
    else if(settings.syntheticSpread == "single") {
        return false;
    }

    if(!spineItem) {
        return false;
    }

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_BOTH) {
        return true;
    }

    var orientation = ReadiumSDK.Helpers.getOrientation($viewport);

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_LANDSCAPE) {
        return orientation === ReadiumSDK.Views.ORIENTATION_LANDSCAPE;
    }

    if(rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_PORTRAIT) {
        return orientation === ReadiumSDK.Views.ORIENTATION_PORTRAIT;
    }

    if(!rendition_spread || rendition_spread === ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_AUTO) {
        // if no spread set in document and user didn't set in in setting we will do double for landscape
        return orientation === ReadiumSDK.Views.ORIENTATION_LANDSCAPE;
    }

    console.warn("Unexpected spread properties condition!");
    return false;

};

ReadiumSDK.Helpers.Margins.fromElement = function($element) {
    return new this($element.margin(), $element.border(), $element.padding());
};

ReadiumSDK.Helpers.Margins.empty = function() {

    return new this({left:0, right:0, top:0, bottom: 0}, {left:0, right:0, top:0, bottom: 0}, {left:0, right:0, top:0, bottom: 0});

};

ReadiumSDK.Helpers.loadTemplate = function(name, params) {
    return ReadiumSDK.Helpers.loadTemplate.cache[name];
};

ReadiumSDK.Helpers.loadTemplate.cache = {
    "fixed_book_frame" : '<div id="fixed-book-frame" class="clearfix book-frame fixed-book-frame"></div>',
    "single_page_frame" : '<div><div id="scaler"><iframe scrolling="no" class="iframe-fixed"></iframe></div></div>',
    "scrolled_book_frame" : '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="scrolled-content-frame"></div></div>',
    "reflowable_book_frame" : '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"></div>',
    "reflowable_book_page_frame": '<div id="reflowable-content-frame" class="reflowable-content-frame"><iframe scrolling="no" id="epubContentIframe"></iframe></div>'
};

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
        console.error(ex);
        return false;
    }
    
    return w && d;
}


ReadiumSDK.Helpers.getOrientation = function($viewport) {

    var viewportWidth = $viewport.width();
    var viewportHeight = $viewport.height();

    if(!viewportWidth || !viewportHeight) {
        return undefined;
    }

    return viewportWidth >= viewportHeight ? ReadiumSDK.Views.ORIENTATION_LANDSCAPE : ReadiumSDK.Views.ORIENTATION_PORTRAIT;
};

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

//scale, left, top, angle, origin
ReadiumSDK.Helpers.CSSTransformString = function(options) {
    var translate, scale, rotation,
        origin = options.origin;

    if (options.left || options.top){
        var left = options.left || 0, 
            top = options.top || 0;

        translate = "translate(" + left + "px, " + top + "px)";
    }
    if (options.scale){
        scale = "scale(" + options.scale + ")";
    }
    if (options.angle){
        rotation =  "rotate(" + options.angle + "deg)";
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

    //TODO modernizer library can be used to get browser independent transform attributes names (implemented in readium-web fixed_layout_book_zoomer.js)
    var css = {};
    _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
        css[prefix + 'transform'] = transformString;
        css[prefix + 'transform-origin'] = origin ? origin : '0 0';
    });

    return css;
};


//TODO: consider using CSSOM escape() or polyfill
//https://github.com/mathiasbynens/CSS.escape/blob/master/css.escape.js
//http://mathiasbynens.be/notes/css-escapes
ReadiumSDK.Helpers.escapeJQuerySelector = function(sel) {
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
