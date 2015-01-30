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

    var self = this;
    options = options || {};

    this.getRootElement = function(){

        return $iframe[0].contentDocument.documentElement;
    };

    this.getRootDocument = function () {
        return $iframe[0].contentDocument;
    };
    // FIXED LAYOUT if (!options.rectangleBased) alert("!!!options.rectangleBased");

    ///* <-debug
     //used for visual debug atm
     function getRandomColor() {
     var letters = '0123456789ABCDEF'.split('');
     var color = '#';
     for (var i = 0; i < 6; i++) {
     color += letters[Math.round(Math.random() * 15)];
     }
     return color;
     }

     //used for visual debug atm
     function addOverlayRect(rects, color, doc) {
     var random = getRandomColor();
     if (!(rects instanceof Array)) {
     rects = [rects];
     }
     for (var i = 0; i != rects.length; i++) {
     var rect = rects[i];
     var tableRectDiv = doc.createElement('div');
     tableRectDiv.style.position = 'absolute';
     $(tableRectDiv).css('z-index', '-1');
     $(tableRectDiv).css('opacity', '0.4');
     tableRectDiv.style.border = '1px solid white';
     if (!color && !random) {
     tableRectDiv.style.background = 'purple';
     } else if (random && !color) {
     tableRectDiv.style.background = random;
     } else {
     if(color === true){
     color ='red';
     }
     tableRectDiv.style.border = '1px solid '+color;
     tableRectDiv.style.background = 'red';
     }

     tableRectDiv.style.margin = tableRectDiv.style.padding = '0';
     tableRectDiv.style.top = (rect.top ) + 'px';
     tableRectDiv.style.left = (rect.left ) + 'px';
     // we want rect.width to be the border width, so content width is 2px less.
     tableRectDiv.style.width = (rect.width - 2) + 'px';
     tableRectDiv.style.height = (rect.height - 2) + 'px';
     doc.body.appendChild(tableRectDiv);
     }
     }

     function getPaginationLeftOffset() {

     var $htmlElement = $("html", self.getRootDocument());
     var offsetLeftPixels = $htmlElement.css("left");
     var offsetLeft = parseInt(offsetLeftPixels.replace("px", ""));
     if(isNaN(offsetLeft)){
     //for fixed layouts, $htmlElement.css("left") has no numerical value
     offsetLeft = 0;
     }
     return offsetLeft;
     }
     //debug -> */

    function createRange() {
        return self.getRootDocument().createRange();
    }

    function getTextNodeFragments(node, buffer, startOverride, endOverride) {

        if (!buffer && ReadiumSDK.Overrides.TextNodeFragmentBuffer) {
            buffer = ReadiumSDK.Overrides.TextNodeFragmentBuffer;
        } else if (!buffer) {
            buffer = 60;
        }

        //create our range
        var range = createRange();
        var collection = [];

        //allow the range offsets to be specified explicitly, without iteration
        if (startOverride && endOverride) {
            range.setStart(node, startOverride);
            range.setEnd(node, endOverride);
            return [
                {start: startOverride, end: endOverride, rect: normalizeRectangle(range.getBoundingClientRect(),0,0)}
            ];
        }

        //go through a "buffer" of characters to create the fragments
        for (var i = 0; i < node.length; i += buffer) {
            var start = i;
            var end = i + buffer;
            //create ranges for the character buffer
            range.setStart(node, start);
            if (end > node.length) {
                end = node.length;
            }
            range.setEnd(node, end);
            //get the client rectangle for this character buffer
            var rect = normalizeRectangle(range.getBoundingClientRect(),0,0);
            //push the character offsets and client rectangle associated with this buffer iteration
            collection.push({start: start, end: end, rect: rect})
        }
        return collection;
    }

    function getNodeClientRect(node) {
        var range = createRange();
        range.selectNode(node);
        return normalizeRectangle(range.getBoundingClientRect(),0,0);
    }

    function getElementClientRect($element) {
        return normalizeRectangle($element[0].getBoundingClientRect(),0,0);
    }

    function getNodeRangeClientRect(startNode, startOffset, endNode, endOffset) {
        var range = createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return normalizeRectangle(range.getBoundingClientRect(),0,0);
    }

    function isNodeClientRectVisible(rect) {
        //Text nodes without printable text dont have client rectangles
        if (!rect) {
            return false;
        }
        //Sometimes we get client rects that are "empty" and aren't supposed to be visible
        if (rect.left == 0 && rect.right == 0 && rect.top == 0 && rect.bottom == 0) {
            return false;
        }
        return (rect.left >= 0 && rect.right <= getViewportClientWidth());
    }

    function getRootDocumentClientWidth() {
        return self.getRootElement().clientWidth;
    }

    function getViewportClientWidth() {
        return $iframe[0].clientWidth;
    }

    function getRootDocumentClientHeight() {
        return self.getRootElement().clientHeight;
    }

    function getFirstVisibleTextNodeRange(textNode) {

        //"split" the single textnode into fragments based on client rect calculations
        //the function used for this could be optimized further with a binary search like approach
        var fragments = getTextNodeFragments(textNode);
        var found = false;
        //go through each fragment, figure out which one is visible
        $.each(fragments, function (n, fragment) {
            var rect = fragment.rect;
            if (!found) {
                //if the fragment's left or right value is within the visible client boundaries
                //then this is the one we want
                if (isNodeClientRectVisible(rect)) {
                    found = fragment;
                    ///* <- debug
                     console.log("visible textnode fragment found:");
                     console.log(fragment);
                     console.log("------------");
                     //debug -> */
                }
            }
        });
        if (!found) {
            //if we didn't find a visible textnode fragment on the clientRect iteration
            //it might still mean that its visible, just only at the very end
            var endFragment = getTextNodeFragments(textNode, null, textNode.length > 3 ? (textNode.length - 2) : 0, textNode.length)[0];

            if (endFragment && isNodeClientRectVisible(endFragment.rect)) {
                found = endFragment;
            } else {
                console.error("Error! No visible textnode fragment found!");
            }
        }
        //create an optimized range to return based on the fragment results
        var resultRangeData = {start: found.end > 3 ? (found.end - 2) : 0, end: found.end};
        var resultRangeRect = getNodeRangeClientRect(textNode, resultRangeData.start, textNode, resultRangeData.end);
        return {start: resultRangeData.start, end: resultRangeData.end, rect: resultRangeRect};
    }


    var visibilityCheckerFunc = options.rectangleBased
        ? checkVisibilityByRectangles
        : checkVisibilityByVerticalOffsets;

    /**
     * @private
     * Checks whether or not pages are rendered right-to-left
     *
     * @returns {boolean}
     */
    function isPageProgressionRightToLeft() {
        return options.paginationInfo && !!options.paginationInfo.rightToLeft;
    }

    /**
     * @private
     * Checks whether or not pages are rendered with vertical writing mode
     *
     * @returns {boolean}
     */
    function isVerticalWritingMode() {
        return options.paginationInfo && !!options.paginationInfo.isVerticalWritingMode;
    }


    /**
     * @private
     * Checks whether or not a (fully adjusted) rectangle is at least partly visible
     *
     * @param {Object} rect
     * @param {Object} frameDimensions
     * @param {boolean} [isVwm]           isVerticalWritingMode
     * @returns {boolean}
     */
    function isRectVisible(rect, frameDimensions, isVwm) {
        if (isVwm) {
            return rect.top >= 0 && rect.top < frameDimensions.height;
        }
        return rect.left >= 0 && rect.left < frameDimensions.width;
    }

    /**
     * @private
     * Retrieves _current_ full width of a column (including its gap)
     *
     * @returns {number} Full width of a column in pixels
     */
    function getColumnFullWidth() {
        
        if (!options.paginationInfo || isVerticalWritingMode())
        {
            return $iframe.width();
        }
        
        return options.paginationInfo.columnWidth + options.paginationInfo.columnGap;
    }

    /**
     * @private
     *
     * Retrieves _current_ offset of a viewport
     * (related to the beginning of the chapter)
     *
     * @returns {Object}
     */
    function getVisibleContentOffsets() {
        if(isVerticalWritingMode()){
            return {
                top: (options.paginationInfo ? options.paginationInfo.pageOffset : 0)
            };
        }
        return {
            left: (options.paginationInfo ? options.paginationInfo.pageOffset : 0)
                * (isPageProgressionRightToLeft() ? -1 : 1)
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
        var isAboveVisibleBottom = visibleContentOffsets.bottom !== undefined
            ? elementRect.top < visibleContentOffsets.bottom
            : true; //this check always passed, if corresponding offset isn't set

        var percentOfElementHeight = 0;
        if (isBelowVisibleTop && isAboveVisibleBottom) { // element is visible
            if (!shouldCalculateVisibilityOffset) {
                return 100;
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
            return 100 - percentOfElementHeight;
        }
        return 0; // element isn't visible
    }

    /**
     * New (rectangle-based) algorithm, useful in multi-column layouts
     *
     * Note: the second param (props) is ignored intentionally
     * (no need to use those in normalization)
     *
     * @param {jQuery} $element
     * @param {Object} _props
     * @param {boolean} shouldCalculateVisibilityPercentage
     * @returns {number|null}
     *      0 for non-visible elements,
     *      0 < n <= 100 for visible elements
     *      (will just give 100, if `shouldCalculateVisibilityPercentage` => false)
     *      null for elements with display:none
     */
    function checkVisibilityByRectangles(
            $element, _props, shouldCalculateVisibilityPercentage) {

        var elementRectangles = getNormalizedRectangles($element);
        var clientRectangles = elementRectangles.clientRectangles;
        if (clientRectangles.length === 0) { // elements with display:none, etc.
            return null;
        }

        var isRtl = isPageProgressionRightToLeft();
        var isVwm = isVerticalWritingMode();
        var columnFullWidth = getColumnFullWidth();
        var frameDimensions = {
            width: $iframe.width(),
            height: $iframe.height()
        };

        if (clientRectangles.length === 1) {
            // because of webkit inconsistency, that single rectangle should be adjusted
            // until it hits the end OR will be based on the FIRST column that is visible
            adjustRectangle(clientRectangles[0], frameDimensions, columnFullWidth,
                    isRtl, isVwm, true);
        }

        // for an element split between several CSS columns,
        // both Firefox and IE produce as many client rectangles;
        // each of those should be checked
        var visibilityPercentage = 0;
        for (var i = 0, l = clientRectangles.length; i < l; ++i) {
            if (isRectVisible(clientRectangles[i], frameDimensions, isVwm)) {
                visibilityPercentage = shouldCalculateVisibilityPercentage
                    ? measureVisibilityPercentageByRectangles(clientRectangles, i)
                    : 100;
                break;
            }
        }
        return visibilityPercentage;
    }

    /**
     * Finds a page index (0-based) for a specific element.
     * Calculations are based on rectangles retrieved with getClientRects() method.
     *
     * @param {jQuery} $element
     * @param {number} spatialVerticalOffset
     * @returns {number|null}
     */
    function findPageByRectangles($element, spatialVerticalOffset) {
        var visibleContentOffsets = getVisibleContentOffsets();
        var elementRectangles = getNormalizedRectangles($element, visibleContentOffsets);
        var clientRectangles  = elementRectangles.clientRectangles;
        if (clientRectangles.length === 0) { // elements with display:none, etc.
            return null;
        }

        return calculatePageIndexByRectangles(clientRectangles, spatialVerticalOffset);
    }

    /**
     * @private
     * Calculate a page index (0-based) for given client rectangles.
     *
     * @param {object} clientRectangles
     * @param {number} spatialVerticalOffset
     * @returns {number|null}
     */
    function calculatePageIndexByRectangles(clientRectangles, spatialVerticalOffset) {
        var isRtl = isPageProgressionRightToLeft();
        var isVwm = isVerticalWritingMode();
        var columnFullWidth = getColumnFullWidth();

        var frameHeight = $iframe.height();
        var frameWidth  = $iframe.width();

        if (spatialVerticalOffset) {
            trimRectanglesByVertOffset(clientRectangles, spatialVerticalOffset,
                frameHeight, columnFullWidth, isRtl, isVwm);
        }

        var firstRectangle = _.first(clientRectangles);
        if (clientRectangles.length === 1) {
            adjustRectangle(firstRectangle, {
                height: frameHeight, width: frameWidth
            }, columnFullWidth, isRtl, isVwm);
        }

        var pageIndex;

        if (isVwm) {
            var topOffset = firstRectangle.top;
            pageIndex = Math.floor(topOffset / frameHeight);
        } else {
            var leftOffset = firstRectangle.left;
            if (isRtl) {
                leftOffset = (columnFullWidth * (options.paginationInfo ? options.paginationInfo.visibleColumnCount : 1)) - leftOffset;
            }
            pageIndex = Math.floor(leftOffset / columnFullWidth);
        }

        if (pageIndex < 0) {
            pageIndex = 0;
        }
        else if (pageIndex >= (options.paginationInfo ? options.paginationInfo.columnCount : 1)) {
            pageIndex = (options.paginationInfo ? (options.paginationInfo.columnCount - 1) : 0);
        }

        return pageIndex;
    }

    /**
     * Finds a page index (0-based) for a specific client rectangle.
     * Calculations are based on viewport dimensions, offsets, and rectangle coordinates
     *
     * @param {ClientRect} clientRectangle
     * @returns {number|null}
     */
    function findPageBySingleRectangle(clientRectangle) {
        var normalizedRectangle = normalizeRectangle(
            clientRectangle, 0, 0);

        return calculatePageIndexByRectangles([normalizedRectangle]);
    }

    /**
     * @private
     * Calculates the visibility offset percentage based on ClientRect dimensions
     *
     * @param {Array} clientRectangles (should already be normalized)
     * @param {number} firstVisibleRectIndex
     * @returns {number} - visibility percentage (0 < n <= 100)
     */
    function measureVisibilityPercentageByRectangles(
            clientRectangles, firstVisibleRectIndex) {

        var heightTotal = 0;
        var heightVisible = 0;

        if (clientRectangles.length > 1) {
            _.each(clientRectangles, function(rect, index) {
                heightTotal += rect.height;
                if (index >= firstVisibleRectIndex) {
                    // in this case, all the rectangles after the first visible
                    // should be counted as visible
                    heightVisible += rect.height;
                }
            });
        }
        else {
            // should already be normalized and adjusted
            heightTotal   = clientRectangles[0].height;
            heightVisible = clientRectangles[0].height - Math.max(
                    0, -clientRectangles[0].top);
        }
        return heightVisible === heightTotal
            ? 100 // trivial case: element is 100% visible
            : Math.floor(100 * heightVisible / heightTotal);
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

        if (clientRectangles.length === 0) {
            // sometimes an element is either hidden or empty, and that means
            // Webkit-based browsers fail to assign proper clientRects to it
            // in this case we need to go for its sibling (if it exists)
            $el = $el.next();
            if ($el.length) {
                return getNormalizedRectangles($el, visibleContentOffsets);
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

        var plainRectObject = {
            left: textRect.left,
            right: textRect.right,
            top: textRect.top,
            bottom: textRect.bottom,
            width: textRect.right - textRect.left,
            height: textRect.bottom - textRect.top
        };
        offsetRectangle(plainRectObject, leftOffset, topOffset);
        return plainRectObject;
    }

    /**
     * @private
     * Offsets plain object (which represents a TextRectangle).
     *
     * @param {Object} rect
     * @param {number} leftOffset
     * @param {number} topOffset
     */
    function offsetRectangle(rect, leftOffset, topOffset) {

        rect.left   += leftOffset;
        rect.right  += leftOffset;
        rect.top    += topOffset;
        rect.bottom += topOffset;
    }

    /**
     * @private
     *
     * When element is spilled over two or more columns,
     * most of the time Webkit-based browsers
     * still assign a single clientRectangle to it, setting its `top` property to negative value
     * (so it looks like it's rendered based on the second column)
     * Alas, sometimes they decide to continue the leftmost column - from _below_ its real height.
     * In this case, `bottom` property is actually greater than element's height and had to be adjusted accordingly.
     *
     * Ugh.
     *
     * @param {Object} rect
     * @param {Object} frameDimensions
     * @param {number} columnFullWidth
     * @param {boolean} isRtl
     * @param {boolean} isVwm               isVerticalWritingMode
     * @param {boolean} shouldLookForFirstVisibleColumn
     *      If set, there'll be two-phase adjustment
     *      (to align a rectangle with a viewport)

     */
    function adjustRectangle(rect, frameDimensions, columnFullWidth, isRtl, isVwm,
            shouldLookForFirstVisibleColumn) {

        // Rectangle adjustment is not needed in VWM since it does not deal with columns
        if (isVwm) {
            return;
        }

        if (isRtl) {
            columnFullWidth *= -1; // horizontal shifts are reverted in RTL mode
        }

        // first we go left/right (rebasing onto the very first column available)
        while (rect.top < 0) {
            offsetRectangle(rect, -columnFullWidth, frameDimensions.height);
        }

        // ... then, if necessary (for visibility offset checks),
        // each column is tried again (now in reverse order)
        // the loop will be stopped when the column is aligned with a viewport
        // (i.e., is the first visible one).
        if (shouldLookForFirstVisibleColumn) {
            while (rect.bottom >= frameDimensions.height) {
                if (isRectVisible(rect, frameDimensions, isVwm)) {
                    break;
                }
                offsetRectangle(rect, columnFullWidth, -frameDimensions.height);
            }
        }
    }

    /**
     * @private
     * Trims the rectangle(s) representing the given element.
     *
     * @param {Array} rects
     * @param {number} verticalOffset
     * @param {number} frameHeight
     * @param {number} columnFullWidth
     * @param {boolean} isRtl
     * @param {boolean} isVwm               isVerticalWritingMode
     */
    function trimRectanglesByVertOffset(
            rects, verticalOffset, frameHeight, columnFullWidth, isRtl, isVwm) {

        //TODO: Support vertical writing mode
        if (isVwm) {
            return;
        }
        
        var totalHeight = _.reduce(rects, function(prev, cur) {
            return prev + cur.height;
        }, 0);

        var heightToHide = totalHeight * verticalOffset / 100;
        if (rects.length > 1) {
            var heightAccum = 0;
            do {
                heightAccum += rects[0].height;
                if (heightAccum > heightToHide) {
                    break;
                }
                rects.shift();
            } while (rects.length > 1);
        }
        else {
            // rebase to the last possible column
            // (so that adding to top will be properly processed later)
            if (isRtl) {
                columnFullWidth *= -1;
            }
            while (rects[0].bottom >= frameHeight) {
                offsetRectangle(rects[0], columnFullWidth, -frameHeight);
            }

            rects[0].top += heightToHide;
            rects[0].height -= heightToHide;
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
        var foundTextNode = null;

        $elements = $("body", this.getRootElement()).find(":not(iframe)").contents().filter(function () {
            return isValidTextNode(this) || this.nodeName.toLowerCase() === 'img';
        });

        // Find the first visible text node
        $.each($elements, function() {

            var $element;

            if(this.nodeType === Node.TEXT_NODE)  { //text node
                $element = $(this).parent();
                foundTextNode = this;
            }
            else {
                $element = $(this); //image
            }

            var visibilityResult = visibilityCheckerFunc($element, props, true);
            if (visibilityResult) {
                $firstVisibleTextNode = $element;
                percentOfElementHeight = 100 - visibilityResult;
                return false;
            } else if (foundTextNode === this) {
                //if our textnode parent element is not visible
                foundTextNode = null;
                $firstVisibleTextNode = null;
                //reset the textnode flags
            }
            return true;
        });

        return {$element: $firstVisibleTextNode, percentY: percentOfElementHeight, foundTextNode: foundTextNode};
    };


    this.getFirstVisibleElementCfi = function (topOffset) {
        var cfi;
        var foundElement = this.findFirstVisibleElement(topOffset);
        var $element = foundElement.$element;

        // we may get a text node or an img element here. For a text node, we can generate a complete range CFI that
        // most specific.
        //
        // For an img node we generate an offset CFI
        var node = foundElement.foundTextNode;
        if (node) {

            var startRange, endRange;
            //if we get a text node we need to get an approximate range for the first visible character offsets.
            var nodeRange = getFirstVisibleTextNodeRange(node);
            startRange = nodeRange.start;
            endRange = nodeRange.end;
            ///* <- debug
             var rect = nodeRange.rect;
             var leftOffset = -getPaginationLeftOffset();
             addOverlayRect({
             left: rect.left + leftOffset,
             top: rect.top,
             width: rect.width,
             height: rect.height
             }, true, self.getRootDocument());
             // debug -> */
            cfi = EPUBcfi.Generator.generateCharOffsetRangeComponent(node, startRange, node, endRange,
                ["cfi-marker"],
                [],
                ["MathJax_Message"]);
        } else if ($element) {
            //noinspection JSUnresolvedVariable
            cfi = EPUBcfi.Generator.generateElementCFIComponent(foundElement.$element[0],
                ["cfi-marker"],
                [],
                ["MathJax_Message"]);

            if (cfi[0] == "!") {
                cfi = cfi.substring(1);
            }

            cfi = cfi + "@0:" + foundElement.percentY;
        } else {
            console.log("Could not generate CFI no visible element on page");
        }

        //This should not happen but if it does print some output, just in case
        if (cfi && cfi.indexOf('NaN') !== -1) {
            console.log('Did not generate a valid CFI:' + cfi);
            return undefined;
        }

        return cfi;
    };

    function getWrappedCfi(partialCfi) {
        return "epubcfi(" + partialCfi + ")";
    }

    function getWrappedCfiRelativeToContent(partialCfi) {
        return "epubcfi(/99!" + partialCfi + ")";
    }

    this.isRangeCfi = function (partialCfi) {
        return EPUBcfi.Interpreter.isRangeCfi(getWrappedCfi(partialCfi));
    };

    this.getPageForElementCfi = function(cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var cfiParts = splitCfi(cfi);
        var partialCfi = cfiParts.cfi;

        if (this.isRangeCfi(partialCfi)) {
            //if given a range cfi the exact page index needs to be calculated by getting node info from the range cfi
            var nodeRangeInfoFromCfi = this.getNodeRangeInfoFromCfi(partialCfi);
            //the page index is calculated from the node's client rectangle
            console.log(nodeRangeInfoFromCfi.clientRect);
            return findPageBySingleRectangle(nodeRangeInfoFromCfi.clientRect);
        }

        var $element = getElementByPartialCfi(cfiParts.cfi, classBlacklist, elementBlacklist, idBlacklist);

        if(!$element) {
            return -1;
        }

        var pageIndex = this.getPageForPointOnElement($element, cfiParts.x, cfiParts.y);
        console.log(pageIndex);
        return pageIndex;

    };

    function getElementByPartialCfi(cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var contentDoc = self.getRootDocument();

        var wrappedCfi = getWrappedCfi(cfi);

        try {
        //noinspection JSUnresolvedVariable
        var $element = EPUBcfi.getTargetElementWithPartialCFI(wrappedCfi, contentDoc, classBlacklist, elementBlacklist, idBlacklist);

        } catch (ex) {
            //EPUBcfi.Interpreter can throw a SyntaxError
        }

        if(!$element || $element.length == 0) {
            console.log("Can't find element for CFI: " + cfi);
            return undefined;
        }

        return $element;
    }

    //TODO JC: refactor this
    this.getNodeRangeInfoFromCfi = function (cfi) {
        var contentDoc = self.getRootDocument();
        if (self.isRangeCfi(cfi)) {
            var wrappedCfi = getWrappedCfiRelativeToContent(cfi);

            try {
                //noinspection JSUnresolvedVariable
                var nodeResult = EPUBcfi.Interpreter.getRangeTargetElements(wrappedCfi, contentDoc,
                    ["cfi-marker"],
                    [],
                    ["MathJax_Message"]);
                ///* <- debug
                 console.log(nodeResult);
                 //*/
            } catch (ex) {
                //EPUBcfi.Interpreter can throw a SyntaxError
            }

            if (!nodeResult) {
                console.log("Can't find nodes for range CFI: " + cfi);
                return undefined;
            }

            var startRangeInfo = getRangeInfoFromNodeList([nodeResult.startElement], nodeResult.startOffset);
            var endRangeInfo = getRangeInfoFromNodeList([nodeResult.endElement], nodeResult.endOffset);
            var nodeRangeClientRect =
                    startRangeInfo && endRangeInfo ?
                getNodeRangeClientRect(
                    startRangeInfo.node,
                    startRangeInfo.offset,
                    endRangeInfo.node,
                    endRangeInfo.offset)
                : null;
            ///* <- debug
             console.log(nodeRangeClientRect);
             addOverlayRect(nodeRangeClientRect,'purple',contentDoc);
             //*/

            return {startInfo: startRangeInfo, endInfo: endRangeInfo, clientRect: nodeRangeClientRect}
        } else {
            var $element = self.getElementByCfi(cfi,
                ["cfi-marker"],
                [],
                ["MathJax_Message"]);

            var normRects = getNormalizedRectangles($element);
            return {startInfo: null, endInfo: null, clientRect: normRects.wrapperRectangle }
        }
    };

    function getRangeInfoFromNodeList($textNodeList, textOffset) {

        var nodeNum;

        var currTextPosition = 0;
        var nodeOffset;

        for (nodeNum = 0; nodeNum < $textNodeList.length; nodeNum++) {

            if ($textNodeList[nodeNum].nodeType === Node.TEXT_NODE) {

                currNodeMaxIndex = $textNodeList[nodeNum].nodeValue.length + currTextPosition;
                nodeOffset = textOffset - currTextPosition;

                if (currNodeMaxIndex > textOffset) {
                    return {node: $textNodeList[nodeNum], offset: nodeOffset};
                } else if (currNodeMaxIndex == textOffset) {
                    return {node: $textNodeList[nodeNum], offset: $textNodeList[nodeNum].length};
                }
                else {

                    currTextPosition = currNodeMaxIndex;
                }
            }
        }

        return undefined;
    }

    this.getElementByCfi = function(cfi, classBlacklist, elementBlacklist, idBlacklist) {

        var cfiParts = splitCfi(cfi);
        return getElementByPartialCfi(cfiParts.cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getPageForElement = function($element) {

        return this.getPageForPointOnElement($element, 0, 0);
    };

    this.getPageForPointOnElement = function($element, x, y) {

        var pageIndex;
        if (options.rectangleBased) {
            pageIndex = findPageByRectangles($element, y);
            if (pageIndex === null) {
                console.warn('Impossible to locate a hidden element: ', $element);
                return 0;
            }
            return pageIndex;
        }

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

    this.getElementById = function(id) {

        var contentDoc = this.getRootDocument();

        var $element = $(contentDoc.getElementById(id));
        //$("#" + ReadiumSDK.Helpers.escapeJQuerySelector(id), contentDoc);
        
        if($element.length == 0) {
            return undefined;
        }

        return $element;
    };

    this.getPageForElementId = function(id) {

        var $element = this.getElementById(id);
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

    // returns raw DOM element (not $ jQuery-wrapped)
    this.getFirstVisibleMediaOverlayElement = function(visibleContentOffsets)
    {
        var docElement = this.getRootElement();
        if (!docElement) return undefined;

        var $root = $("body", docElement);
        if (!$root || !$root.length || !$root[0]) return undefined;

        var that = this;

        var firstPartial = undefined;

        function traverseArray(arr)
        {
            if (!arr || !arr.length) return undefined;

            for (var i = 0, count = arr.length; i < count; i++)
            {
                var item = arr[i];
                if (!item) continue;

                var $item = $(item);

                if($item.data("mediaOverlayData"))
                {
                    var visible = that.getElementVisibility($item, visibleContentOffsets);
                    if (visible)
                    {
                        if (!firstPartial) firstPartial = item;

                        if (visible == 100) return item;
                    }
                }
                else
                {
                    var elem = traverseArray(item.children);
                    if (elem) return elem;
                }
            }

            return undefined;
        }

        var el = traverseArray([$root[0]]);
        if (!el) el = firstPartial;
        return el;

        // var $elements = this.getMediaOverlayElements($root);
        // return this.getVisibleElements($elements, visibleContentOffsets);
    };

    this.getElementVisibility = function($element, visibleContentOffsets) {
        return visibilityCheckerFunc($element, visibleContentOffsets, true);
    };

    // /**
    //  * @deprecated
    //  */
    // this.getVisibleMediaOverlayElements = function(visibleContentOffsets) {
    // 
    //     var $elements = this.getMediaOverlayElements($("body", this.getRootElement()));
    //     return this.getVisibleElements($elements, visibleContentOffsets);
    // 
    // };

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
            var visibilityPercentage = visibilityCheckerFunc(
                    $element, visibleContentOffsets, true);

            if (visibilityPercentage) {
                var $visibleElement = $element;
                visibleElements.push({
                    element: $visibleElement[0], // DOM Element is pushed
                    percentVisible: visibilityPercentage
                });
                return true;
            }

            // if element's position cannot be determined, just go to next one
            if (visibilityPercentage === null) {
                return true;
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

    /**
     * @deprecated
     */
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
            // If we don't do this, we may get a reference to a node that doesn't get rendered
            // (such as for example a node that has tab character and a bunch of spaces)
            var nodeText = node.nodeValue.replace(/[\s\n\r\t]/g, "");
             return nodeText.length > 0;
        }

        return false;

    }

    this.getElement = function(selector) {

        var $element = $(selector, this.getRootElement());

        if($element.length > 0) {
            return $element;
        }

        return undefined;
    };

};
