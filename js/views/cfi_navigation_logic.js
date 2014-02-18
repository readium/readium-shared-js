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

/*
 * CFI navigation helper class
 *
 * @param $viewport
 * @param $iframe
 * @param options Additional settings for NavigationLogic object
 *      - rectangleBased    If truthy, clientRect-based geometry will be used
 *      - paginationInfo    Layout details, used by clientRect-based geometry
 * @constructor
 */

ReadiumSDK.Views.CfiNavigationLogic = function($viewport, $iframe, options){

    options = options || {};

    this.getRootElement = function(){

        return $iframe[0].contentDocument.documentElement;
    };

    var visibilityCheckerFunc = options.rectangleBased
        ? checkVisibilityByRectangles
        : checkVisibilityByVerticalOffsets;

    /**
     * @private
     * Retrieves _current_ full width of a column (including its gap)
     *
     * @returns {number} Full width of a column in pixels
     */
    function getColumnFullWidth() {
        return options.paginationInfo.columnWidth + options.paginationInfo.columnGap;
    }

    /**
     * @private
     *
     * Retrieves _current_ offset of a viewport
     * (related to the beginning of the chapter)
     */
    function getVisibleContentOffsets() {
        return {
            left: options.paginationInfo.pageOffset
        };
    }

    // Old (offsetTop-based) algorithm, useful in top-to-bottom layouts
    function checkVisibilityByVerticalOffsets(
            $element, visibleContentOffsets, shouldCalculateVisibilityOffset) {

        var elementRect = ReadiumSDK.Helpers.Rect.fromElement($element);
        if (_.isNaN(elementRect.left)) {
            // this is actually a point element, doesnt have a bounding rectangle
            elementRect = new ReadiumSDK.Helpers.Rect(
                    $element.position().top, $element.position().left, 0, 0);
        }
        var topOffset = visibleContentOffsets.top || 0;
        var isBelowVisibleTop = elementRect.bottom() > topOffset;
        var isAboveVisibleBottom = visibleContentOffsets.bottom === undefined
            ? elementRect.top < visibleContentOffsets.bottom
            : true; //this check always passed, if corresponding offset isn't set

        var percentOfElementHeight = 0;
        if (isBelowVisibleTop && isAboveVisibleBottom) { // element is visible
            if (!shouldCalculateVisibilityOffset) {
                return true;
            }
            else if (elementRect.top <= topOffset) {
                percentOfElementHeight = Math.ceil(
                    100 * (topOffset - elementRect.top) / elementRect.height
                );

                // below goes another algorithm, which has been used in getVisibleElements pattern,
                // but it seems to be a bit incorrect
                // (as spatial offset should be measured at the first visible point of the element):
                //
                // var visibleTop = Math.max(elementRect.top, visibleContentOffsets.top);
                // var visibleBottom = Math.min(elementRect.bottom(), visibleContentOffsets.bottom);
                // var visibleHeight = visibleBottom - visibleTop;
                // var percentVisible = Math.round((visibleHeight / elementRect.height) * 100);
            }
            return [$element, percentOfElementHeight];
        }
        return false; // element isn't visible
    }

    /**
     * New (rectangle-based) algorithm, useful in multi-column layouts
     *
     * Note: the second param (props) ignored intentionally
     * (no need to use them in normalization)
     *
     * @param {jQuery} $element
     * @param {Object} _props
     * @param {boolean} shouldCalculateVisibilityOffset
     * @returns {Boolean|Array}
     */
    function checkVisibilityByRectangles(
            $element, _props, shouldCalculateVisibilityOffset) {

        var elementRectangles = getNormalizedRectangles($element);
        var clientRectangles = elementRectangles.clientRectangles;

        // for an element split between several CSS columns,
        // both Firefox and IE produce as many client rectangles
        // only the last one's `left` property should be checked
        var rightmostRectangle = _.last(clientRectangles);
        if (clientRectangles.length === 1) {
            var frameHeight = $iframe.height();
            // because of webkit inconsistency, that single rectangle should be adjusted
            // until it hits the end OR will be based on the FIRST column that is visible
            adjustRectangle(rightmostRectangle, frameHeight);
        }

        if (rightmostRectangle.left >= 0) {
            // some part of element IS visible
            return shouldCalculateVisibilityOffset
                ? [$element, measureVisibilityRangeOffsetsByRectangles(clientRectangles)]
                : true;
        }
        return false;
    }

    function findPageByRectangles($element) {
        var visibleContentOffsets = getVisibleContentOffsets();
        var elementRectangles = getNormalizedRectangles($element, visibleContentOffsets);
        var clientRectangles  = elementRectangles.clientRectangles;
        var leftmostRectangle = _.first(clientRectangles);
        var frameHeight = $iframe.height();
        if (clientRectangles.length === 1) {
            adjustRectangle(leftmostRectangle, frameHeight);
        }

        var columnFullWidth = getColumnFullWidth();
        var pageIndex = Math.round(leftmostRectangle.left / columnFullWidth);
        if (leftmostRectangle.top < 0) {
            pageIndex -= Math.ceil(-leftmostRectangle.top / frameHeight);
        }

        return pageIndex;
    }

    /**
     * @private
     * Calculates the visibility percentage based on its ClientRect dimensions
     *
     * @param {Array} clientRectangles (should already be normalized)
     * @returns {number} - visibility percentage (0 < n <= 100)
     */
    function measureVisibilityRangeOffsetsByRectangles(clientRectangles) {

        var heightTotal = 0;
        var heightVisible = 0;

        if (clientRectangles.length > 1) {
            _.each(clientRectangles, function(rect) {
                heightTotal += rect.height;
                if (rect.left > 0) {
                    heightVisible += rect.height;
                }
            });
        }
        else if (clientRectangles[0].top < 0) {
            heightTotal   = clientRectangles[0].height;
            heightVisible = heightTotal + clientRectangles[0].top;
        }
        else { // trivial case: element is 100% visible, y-offset is 0
            return 0; // ... percents
        }
        return 100 - Math.floor(100 * heightVisible / heightTotal);
    }

    /**
     * @private
     * Retrieves the position of $element in multi-column layout
     *
     * @param {jQuery} $el
     * @param {Object} [visibleContentOffsets]
     * @returns {Object}
     */
    function getNormalizedRectangles($el, visibleContentOffsets) {

        visibleContentOffsets = visibleContentOffsets || {};
        var leftOffset = visibleContentOffsets.left || 0;
        var topOffset  = visibleContentOffsets.top  || 0;

        // union of all rectangles wrapping the element
        var wrapperRectangle = normalizeRectangle(
                $el[0].getBoundingClientRect(), leftOffset, topOffset);

        // all the separate rectangles (for detecting position of the element
        // split between several columns)
        var clientRectangles = [];
        var clientRectList = $el[0].getClientRects();
        for (var i = 0, l = clientRectList.length; i < l; ++i) {
            if (clientRectList[i].height > 0) {
                // Firefox sometimes gets it wrong,
                // adding literally empty (height = 0) client rectangle preceding the real one,
                // that empty client rectanle shouldn't be retrieved
                clientRectangles.push(
                    normalizeRectangle(clientRectList[i], leftOffset, topOffset));
            }
        }

        return {
            wrapperRectangle: wrapperRectangle,
            clientRectangles: clientRectangles
        };
    }

    /**
     * @private
     * Converts TextRectangle object into a plain object,
     * taking content offsets (=scrolls, position shifts etc.) into account
     *
     * @param {TextRectangle} textRect
     * @param {number} leftOffset
     * @param {number} topOffset
     * @returns {Object}
     */
    function normalizeRectangle(textRect, leftOffset, topOffset) {

        return {
            left: textRect.left + leftOffset,
            right: textRect.right + leftOffset,
            top: textRect.top + topOffset,
            bottom: textRect.bottom + topOffset,
            width: textRect.right - textRect.left,
            height: textRect.bottom - textRect.top
        };
    }

    /**
     * @private
     *
     * When element is spilled over two or more columns,
     * most of the time Webkit-based browsers
     * still assign a single clientRectangle to it, setting its `top` property to negative value
     * (so it looks like it's rendered based on the second column)
     * Alas, sometimes they decide to continue the first (leftmost) column - from _below_ its real height.
     * In this case, `bottom` property is actually greater than element's height and had to be adjusted accordingly).
     *
     * Ugh.
     *
     * @param {Object} rectangleToAdjust
     * @param {number} frameHeight
     */
    function adjustRectangle(rectangleToAdjust, frameHeight) {
        var columnFullWidth = getColumnFullWidth();
        // because of webkit inconsistency, that rectangle should be adjusted
        // until it will be based on the rightmost column (and still won't be visible)
        // OR will be based on the FIRST column that is visible
        // so first we go left (rebasing on the leftmost column)
        while (rectangleToAdjust.top < 0) {
            rectangleToAdjust.left  -= columnFullWidth;
            rectangleToAdjust.right -= columnFullWidth;
            rectangleToAdjust.top    += frameHeight;
            rectangleToAdjust.bottom += frameHeight;
        }
        // ... then go to right checking the visibility after each step
        while (rectangleToAdjust.bottom > frameHeight
                && rectangleToAdjust.left < 0 ) {
            rectangleToAdjust.left  += columnFullWidth;
            rectangleToAdjust.right += columnFullWidth;
            rectangleToAdjust.top    -= frameHeight;
            rectangleToAdjust.bottom -= frameHeight;
        }
    }

    //we look for text and images
    this.findFirstVisibleElement = function (props) {

        if (typeof props !== 'object') {
            // compatibility with legacy code, `props` is `topOffset` actually
            props = { top: props };
        }

        var $elements;
        var $firstVisibleTextNode = null;
        var percentOfElementHeight = 0;

        $elements = $("body", this.getRootElement()).find(":not(iframe)").contents().filter(function () {
            return isValidTextNode(this) || this.nodeName.toLowerCase() === 'img';
        });

        // Find the first visible text node
        $.each($elements, function() {

            var $element;

            if(this.nodeType === Node.TEXT_NODE)  { //text node
                $element = $(this).parent();
            }
            else {
                $element = $(this); //image
            }

            var visibilityResult = visibilityCheckerFunc($element, props, true);
            if (visibilityResult) {
                $firstVisibleTextNode = visibilityResult[0];
                percentOfElementHeight = visibilityResult[1];
                return false;
            }
            return true;
        });

        return {$element: $firstVisibleTextNode, percentY: percentOfElementHeight};
    };

    this.getFirstVisibleElementCfi = function(topOffset) {

        var foundElement = this.findFirstVisibleElement(topOffset);

        if(!foundElement.$element) {
            console.log("Could not generate CFI no visible element on page");
            return undefined;
        }

        //noinspection JSUnresolvedVariable
        var cfi = EPUBcfi.Generator.generateElementCFIComponent(foundElement.$element[0]);

        if(cfi[0] == "!") {
            cfi = cfi.substring(1);
        }

        return cfi + "@0:" + foundElement.percentY;
    };

    this.getPageForElementCfi = function(cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var cfiParts = splitCfi(cfi);

        var $element = getElementByPartialCfi(cfiParts.cfi, classBlacklist, elementBlacklist, idBlacklist);

        if(!$element) {
            return -1;
        }

        return this.getPageForPointOnElement($element, cfiParts.x, cfiParts.y);
    };

    function getElementByPartialCfi(cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var contentDoc = $iframe[0].contentDocument;

        var wrappedCfi = "epubcfi(" + cfi + ")";
        //noinspection JSUnresolvedVariable
        var $element = EPUBcfi.getTargetElementWithPartialCFI(wrappedCfi, contentDoc, classBlacklist, elementBlacklist, idBlacklist);

        if(!$element || $element.length == 0) {
            console.log("Can't find element for CFI: " + cfi);
            return undefined;
        }

        return $element;
    }

    this.getElementByCfi = function(cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var cfiParts = splitCfi(cfi);
        return getElementByPartialCfi(cfiParts.cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getPageForElement = function($element) {

        return options.rectangleBased
            ? findPageByRectangles($element)
            : this.getPageForPointOnElement($element, 0, 0);
    };

    this.getPageForPointOnElement = function($element, x, y) {

        var posInElement = this.getVerticalOffsetForPointOnElement($element, x, y);
        return Math.floor(posInElement / $viewport.height());
    };

    this.getVerticalOffsetForElement = function($element) {

        return this.getVerticalOffsetForPointOnElement($element, 0, 0);
    };

    this.getVerticalOffsetForPointOnElement = function($element, x, y) {

        var elementRect = ReadiumSDK.Helpers.Rect.fromElement($element);
        return Math.ceil(elementRect.top + y * elementRect.height / 100);
    };

    this.getElementBuyId = function(id) {

        var contentDoc = $iframe[0].contentDocument;

        var $element = $("#" + id, contentDoc);
        if($element.length == 0) {
            return undefined;
        }

        return $element;
    };

    this.getPageForElementId = function(id) {

        var $element = this.getElementBuyId(id);
        if(!$element) {
            return -1;
        }

        return this.getPageForElement($element);
    };

    function splitCfi(cfi) {

        var ret = {
            cfi: "",
            x: 0,
            y: 0
        };

        var ix = cfi.indexOf("@");

        if(ix != -1) {
            var terminus = cfi.substring(ix + 1);

            var colIx = terminus.indexOf(":");
            if(colIx != -1) {
                ret.x = parseInt(terminus.substr(0, colIx));
                ret.y = parseInt(terminus.substr(colIx + 1));
            }
            else {
                console.log("Unexpected terminating step format");
            }

            ret.cfi = cfi.substring(0, ix);
        }
        else {

            ret.cfi = cfi;
        }

        return ret;
    }

    this.getVisibleMediaOverlayElements = function(visibleContentOffsets) {

        var $elements = this.getMediaOverlayElements($("body", this.getRootElement()));
        return this.getVisibleElements($elements, visibleContentOffsets);

    };

    this.isElementVisible = visibilityCheckerFunc;

    this.getAllVisibleElementsWithSelector = function(selector, visibleContentOffset) {
        var elements = $(selector,this.getRootElement()).filter(function(e) { return true; });
        var $newElements = [];
        $.each(elements, function() {
            $newElements.push($(this));
        });
        var visibleDivs = this.getVisibleElements($newElements, visibleContentOffset);
        return visibleDivs;

    };

    this.getVisibleElements = function($elements, visibleContentOffsets) {

        var visibleElements = [];

        // Find the first visible text node
        $.each($elements, function() {
            var $element = this;
            var visibilityResult = visibilityCheckerFunc(
                    $element, visibleContentOffsets, true);

            if (visibilityResult) {
                var $visibleElement = visibilityResult[0];
                var visibilityPercentage = 100 - visibilityResult[1];
                visibleElements.push({
                    element: $visibleElement[0], // DOM Element is pushed
                    percentVisible: visibilityPercentage
                });
                return false;
            }

            // continue if no visibleElements have been found yet,
            // stop otherwise
            return visibleElements.length === 0;
        });

        return visibleElements;
    };

    this.getVisibleTextElements = function(visibleContentOffsets) {

        var $elements = this.getTextElements($("body", this.getRootElement()));

        return this.getVisibleElements($elements, visibleContentOffsets);
    };

    this.getMediaOverlayElements = function($root) {

        var $elements = [];

        function traverseCollection(elements) {

            if (elements == undefined) return;
            
            for(var i = 0, count = elements.length; i < count; i++) {

                var $element = $(elements[i]);

                if( $element.data("mediaOverlayData") ) {
                    $elements.push($element);
                }
                else {
                    traverseCollection($element[0].children);
                }

            }
        }

        traverseCollection([$root[0]]);

        return $elements;
    };

    this.getTextElements = function($root) {

        var $textElements = [];

        $root.find(":not(iframe)").contents().each(function () {

            if( isValidTextNode(this) ) {
                $textElements.push($(this).parent());
            }

        });

        return $textElements;

    };

    function isValidTextNode(node) {

        if(node.nodeType === Node.TEXT_NODE) {

            // Heuristic to find a text node with actual text
            var nodeText = node.nodeValue.replace(/\n/g, "");
            nodeText = nodeText.replace(/ /g, "");

             return nodeText.length > 0;
        }

        return false;

    }

    this.getElement = function(selector) {

        var $element = $(selector, this.getRootElement());

        if($element.length > 0) {
            return $element[0];
        }

        return 0;
    };

};
