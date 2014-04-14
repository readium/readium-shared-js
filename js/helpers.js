//  LauncherOSX
//
//  Created by Boris Schneiderman.
//  Copyright (c) 2012-2013 The Readium Foundation.
//
//  The Readium SDK is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.


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
    "single_page_frame" : '<div><iframe scrolling="no" class="iframe-fixed"></iframe></div>',
    "scrolled_book_frame" : '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="scrolled-content-frame"></div></div>',
    "reflowable_book_frame" : '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="reflowable-content-frame" class="reflowable-content-frame"><iframe scrolling="no" id="epubContentIframe"></iframe></div></div>'
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

    return  !item.rendition_spread
        ||  item.rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_BOTH
        ||  item.rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_AUTO
        ||  (item.rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_LANDSCAPE
        && orientation == ReadiumSDK.Views.ORIENTATION_LANDSCAPE)
        ||  (item.rendition_spread == ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_PORTRAIT
        && orientation == ReadiumSDK.Views.ORIENTATION_PORTRAIT );
};

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
