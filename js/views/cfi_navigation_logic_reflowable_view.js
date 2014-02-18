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
 * @constructor
 */

ReadiumSDK.Views.CfiNavigationLogicReflowable = function ($viewport, $iframe, paginationInfo) {

    this.$viewport = $viewport;
    this.$iframe = $iframe;
    this.paginationInfo = paginationInfo;

    this.getRootElement = function () {
        return $iframe[0].contentDocument.documentElement;
    };

    //we look for text and images
    this.findFirstVisibleElement = function (visibleContentOffsets) {

        var $elements;
        var $firstVisibleTextNode = null;

        $elements = $("body", this.getRootElement()).find(":not(iframe)").contents().filter(function () {
            return isValidTextNode(this) || this.nodeName.toLowerCase() === 'img';
        });

        var self = this;

        var isPartiallyVisibleElementFound = false;
        // Find the first visible text node
        $.each($elements, function () {

            var $element;

            if (this.nodeType === Node.TEXT_NODE) { //text node
                $element = $(this).parent();
            }
            else {
                $element = $(this); //image
            }

            var elementRect = self.getClientRectangle($element, visibleContentOffsets);

            if (elementRect.left > visibleContentOffsets.left) {
                if (!isPartiallyVisibleElementFound && elementRect.top < 0) {
                    isPartiallyVisibleElementFound = true;
                    return true;
                }
                $firstVisibleTextNode = $element;
                return false;
            }
            return true; //next element
        });
        return {$element: $firstVisibleTextNode, percentY: 100};
    };

    this.getFirstVisibleElementCfi = function (visibleContentOffsets) {

        var foundElement = this.findFirstVisibleElement(visibleContentOffsets);

        if (!foundElement.$element) {
            console.log("Could not generate CFI no visible element on page");
            return undefined;
        }

        //noinspection JSUnresolvedVariable
        var cfi = EPUBcfi.Generator.generateElementCFIComponent(foundElement.$element[0]);

        if (cfi[0] == "!") {
            cfi = cfi.substring(1);
        }

        return cfi + "@0:" + foundElement.percentY;
    };

    this.getPageForElementCfi = function (cfi) {

        var cfiParts = splitCfi(cfi);

        var $element = getElementByPartialCfi(cfiParts.cfi);

        if (!$element) {
            return -1;
        }

        return this.getPageForPointOnElement($element, cfiParts.x, cfiParts.y);
    };

    function getElementByPartialCfi(cfi) {

        var contentDoc = $iframe[0].contentDocument;

        var wrappedCfi = "epubcfi(" + cfi + ")";
        //noinspection JSUnresolvedVariable
        var $element = EPUBcfi.Interpreter.getTargetElementWithPartialCFI(wrappedCfi, contentDoc);

        if (!$element || $element.length == 0) {
            console.log("Can't find element for CFI: " + cfi);
            return undefined;
        }

        return $element;
    }

    this.getElementByCfi = function (cfi) {
        var cfiParts = splitCfi(cfi);

        return getElementByPartialCfi(cfiParts.cfi);
    };

    this.getPageForElement = function ($element) {
        return this.getPageForPointOnElement($element, 0, 0);
    };

    this.getClientRectangle = function ($element, visibleContentOffsets) {
        var $el;

        if (_.isArray($element) || $element instanceof jQuery) {
            $el = $element[0];
        }
        else {
            $el = $element;
        }

        var rectangle = $el.getBoundingClientRect();
        var leftPosition = rectangle.left + visibleContentOffsets.left;
        var rightPosition = rectangle.right + visibleContentOffsets.left;
        var topPosition = rectangle.top;
        var bottomPosition = rectangle.bottom;

        return {left: leftPosition, right: rightPosition, top: topPosition, bottom: bottomPosition};
    };

    this.getPageForPointOnElement = function ($element, x, y) {

        var elementRect = $element[0].getBoundingClientRect();
        var columnGap = this.paginationInfo.columnGap;
        var columnWidth = this.paginationInfo.columnWidth;
        var posInElement = Math.round((elementRect.left) / (columnGap + columnWidth));

        if (elementRect.top < 0) {
            posInElement -= Math.ceil(Math.abs(elementRect.top) / this.$iframe.height());
        }

        return posInElement;
    };

    this.getElementBuyId = function (id) {

        var contentDoc = $iframe[0].contentDocument;

        var $element = $("#" + id, contentDoc);
        if ($element.length == 0) {
            return undefined;
        }

        return $element;
    };

    this.getPageForElementId = function (id) {

        var $element = this.getElementBuyId(id);
        if (!$element) {
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

        if (ix != -1) {
            var terminus = cfi.substring(ix + 1);

            var colIx = terminus.indexOf(":");
            if (colIx != -1) {
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

    this.getVisibleMediaOverlayElements = function (visibleContentOffsets) {
        var $elements = this.getMediaOverlayElements($("body", this.getRootElement()));

        return this.getVisibleElements($elements, visibleContentOffsets);
    };

    this.isElementVisible = function ($element, visibleContentOffsets) {

        var elementRect = this.getClientRectangle($element, visibleContentOffsets);

        return !(elementRect.right <= visibleContentOffsets.left || elementRect.left >= visibleContentOffsets.right);
    };

    this.getAllVisibleElementsWithSelector = function (selector, visibleContentOffset) {
        var elements = $(selector, this.getRootElement()).filter(function (e) {
            return true;
        });
        var $newElements = [];
        $.each(elements, function () {
            $newElements.push($(this));
        });
        var visibleDivs = this.getVisibleElements($newElements, visibleContentOffset);

        return visibleDivs;
    };

    this.getVisibleElements = function ($elements, visibleContentOffsets) {

        var visibleElements = [],
            self = this;

        // Find the first visible text node
        $.each($elements, function () {
            var elementRect = self.getClientRectangle(this, visibleContentOffsets);

            if (elementRect.right <= visibleContentOffsets.left) {
                return true; //next element
            }

            if (elementRect.right >= visibleContentOffsets.right) {
                return false; // Break the loop
            }

            visibleElements.push({element: this[0], percentVisible: 100});

            return true;

        });

        return visibleElements;
    };

    this.getVisibleTextElements = function (visibleContentOffsets) {

        var $elements = this.getTextElements($("body", this.getRootElement()));

        return this.getVisibleElements($elements, visibleContentOffsets);
    };

    this.getMediaOverlayElements = function ($root) {

        var $elements = [];

        function traverseCollection(elements) {

            if (elements == undefined) return;

            for (var i = 0, count = elements.length; i < count; i++) {

                var $element = $(elements[i]);

                if ($element.data("mediaOverlayData")) {
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

    this.getTextElements = function ($root) {

        var $textElements = [];

        $root.find(":not(iframe)").contents().each(function () {

            if (isValidTextNode(this)) {
                $textElements.push($(this).parent());
            }

        });

        return $textElements;

    };

    function isValidTextNode(node) {

        if (node.nodeType === Node.TEXT_NODE) {

            // Heuristic to find a text node with actual text
            var nodeText = node.nodeValue.replace(/\n/g, "");
            nodeText = nodeText.replace(/ /g, "");

            return nodeText.length > 0;
        }

        return false;

    }

    this.getElement = function (selector) {

        var $element = $(selector, this.getRootElement());

        if ($element.length > 0) {
            return $element[0];
        }

        return 0;
    };

};
