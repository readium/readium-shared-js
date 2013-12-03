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

    var e = $element[0];

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
    "fixed_page_frame" : '<div class="fixed-page-frame"><iframe scrolling="no" class="iframe-fixed"></iframe></div>',
    "reflowable_book_frame" : '<div id="reflowable-book-frame" class="clearfix book-frame reflowable-book-frame"><div id="reflowable-content-frame" class="reflowable-content-frame"><iframe scrolling="no" id="epubContentIframe"></iframe></div></div>'
};
ReadiumSDK.Helpers.setStyles = function(styles, $element) {

    var count = styles.length;

    if(!count) {
        return;
    }

    for(var i = 0; i < count; i++) {
        var style = styles[i];
        $(style.selector, $element).css(style.declarations);
    }

};



