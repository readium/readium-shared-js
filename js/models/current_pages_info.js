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

define(function() {

/**
 * Used to report pagination state back to the host application
 *
 * @class Models.CurrentPagesInfo
 *
 * @constructor
 *
 * @param {Models.Spine} spine
 * @param {boolean} isFixedLayout is fixed or reflowable spine item
 * @return CurrentPagesInfo
*/

var CurrentPagesInfo = function(spine, isFixedLayout) {


    /**
     * The reading direction
     *
     * @property isRightToLeft
     * @type bool
     */

    this.isRightToLeft = spine.isRightToLeft();
    
    /**
     * Is the ebook fixed layout or not?
     *
     * @property isFixedLayout
     * @type bool
     */

    this.isFixedLayout = isFixedLayout;
    
    /**
     * Counts the number of spine items
     *
     * @property spineItemCount
     * @type number
     */    

    this.spineItemCount = spine.items.length
    
    /**
     * returns an array of open pages, each array item is a data structure (plain JavaScript object) with the following fields: spineItemPageIndex, spineItemPageCount, idref, spineItemIndex (as per the parameters of the addOpenPage() function below)
     *
     * @property openPages
     * @type array
     */

    this.openPages = [];

    /**
     * Adds an page item to the openPages array
     *
     * @method     addOpenPage
     * @param      {number} spineItemPageIndex
     * @param      {number} spineItemPageCount
     * @param      {string} idref
     * @param      {number} spineItemIndex   
     */

    this.addOpenPage = function(spineItemPageIndex, spineItemPageCount, idref, spineItemIndex) {
        this.openPages.push({spineItemPageIndex: spineItemPageIndex, spineItemPageCount: spineItemPageCount, idref: idref, spineItemIndex: spineItemIndex});

        this.sort();
    };

    /**
     * Checks if navigation to the page on the left is possible (depending on page-progression-direction: previous page in LTR mode, next page in RTL mode)
     *
     * @method     canGoLeft
     * @return bool true if turning to the left page is possible 
     */

    this.canGoLeft = function () {
        return this.isRightToLeft ? this.canGoNext() : this.canGoPrev();
    };

    /**
     * Checks if navigation to the page on the right is possible (depending on page-progression-direction: next page in LTR mode, previous page in RTL mode)
     *
     * @method     canGoRight
     * @return bool true if turning to the right page is possible 
     */

    this.canGoRight = function () {
        return this.isRightToLeft ? this.canGoPrev() : this.canGoNext();
    };

    /**
     * Checks if navigation to the next page is possible (depending on page-progression-direction: right page in LTR mode, left page in RTL mode)
     *
     * @method     canGoNext
     * @return bool true if turning to the next page is possible 
     */

    this.canGoNext = function() {

        if(this.openPages.length == 0)
            return false;

        var lastOpenPage = this.openPages[this.openPages.length - 1];

        // TODO: handling of non-linear spine items ("ancillary" documents), allowing page turn within the reflowable XHTML, but preventing previous/next access to sibling spine items. Also needs "go back" feature to navigate to source hyperlink location that led to the non-linear document.
        // See https://github.com/readium/readium-shared-js/issues/26

        // Removed, needs to be implemented properly as per above.
        // See https://github.com/readium/readium-shared-js/issues/108
        // if(!spine.isValidLinearItem(lastOpenPage.spineItemIndex))
        //     return false;

        return lastOpenPage.spineItemIndex < spine.last().index || lastOpenPage.spineItemPageIndex < lastOpenPage.spineItemPageCount - 1;
    };

    /**
     * Checks if navigation to the previous page is possible (depending on page-progression-direction: left page in LTR mode, right page in RTL mode)
     *
     * @method     canGoPrev
     * @return bool true if turning to the previous page is possible 
     */

    this.canGoPrev = function() {

        if(this.openPages.length == 0)
            return false;

        var firstOpenPage = this.openPages[0];

        // TODO: handling of non-linear spine items ("ancillary" documents), allowing page turn within the reflowable XHTML, but preventing previous/next access to sibling spine items. Also needs "go back" feature to navigate to source hyperlink location that led to the non-linear document.
        // See https://github.com/readium/readium-shared-js/issues/26

        // Removed, needs to be implemented properly as per above.
        // //https://github.com/readium/readium-shared-js/issues/108
        // if(!spine.isValidLinearItem(firstOpenPage.spineItemIndex))
        //     return false;

        return spine.first().index < firstOpenPage.spineItemIndex || 0 < firstOpenPage.spineItemPageIndex;
    };

    /**
     * Sorts the openPages array based on spineItemIndex and spineItemPageIndex
     *
     * @method     sort
     */

    this.sort = function() {

        this.openPages.sort(function(a, b) {

            if(a.spineItemIndex != b.spineItemIndex) {
                return a.spineItemIndex - b.spineItemIndex;
            }

            return a.spineItemPageIndex - b.spineItemPageIndex;

        });

    };

};

return CurrentPagesInfo;
});