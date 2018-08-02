//  Created by Boris Schneiderman.
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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

define(["./spine_item", "../helpers", "URIjs"], function(SpineItem, Helpers, URI) {
/**
 *  Wrapper of the Spine object received from the host application
 *
 * @class  Models.Spine
 * @constructor
 * @param {Models.Package} epubPackage Parent package properties 
 * @param {Object} spineDTO Spine data object, container for spine properties
 */
var Spine = function(epubPackage, spineDTO) {

    var self = this;

    /**
     * The collection of spine items
     *
     * @property items
     * @type Array
     */
    this.items = [];

    /**
     * The page progression direction ltr|rtl|default
     *
     * @property direction
     * @type String
     * @default "ltr"
     */
    this.direction = "ltr";

    /**
     * The container for parent package properties
     *
     * @property package  
     * @type Models.Package
     *
     */
    this.package = epubPackage;

    var _handleLinear = false;

    /**
     * Sets a flag indicating that the app handles linear spine items
     *
     * @method     handleLinear
     * @param      {Boolean} handleLinear  boolean flag
     */
    this.handleLinear = function(handleLinear) {
        _handleLinear = handleLinear;
    };

    function isValidLinearItem(item) {
        return !_handleLinear || item.linear !== "no";
    }

    /**
     * Checks if a spine item is linear. 
     *
     * @method     isValidLinearItem
     * @param      {Number} index  index of a spine item
     * @return     {Boolean} TRUE if the app does not handle linear items or if the item is linear.
    */
    this.isValidLinearItem = function(index) {
        
        if(!isValidIndex(index)) {
            return undefined;
        }

        return isValidLinearItem(this.item(index));
    };

    /**
     * Checks if the page progression direction is right to left.
     *
     * @method     isRightToLeft
     * @return     {Boolean} 
     */
    this.isRightToLeft = function() {

        return self.direction == "rtl";
    };

    /**
     * Checks if the page progression direction is left to right.
     *
     * @method     isLeftToRight
     * @return     {Boolean} TRUE if the direction is not rtl.
     */
    this.isLeftToRight = function() {

        return !self.isRightToLeft();
    };

    /**
     * Checks if an spine item index is valid. 
     *
     * @method     isValidIndex
     * @param      {Number} index  the index of the expected spine item
     * @return     {Boolean} TRUE is the index is valid.
    */
    function isValidIndex(index) {

        return index >= 0 && index < self.items.length;
    }

    function lookForPrevValidItem(ix) {

        if(!isValidIndex(ix)) {
            return undefined;
        }

        var item = self.items[ix];

        if(isValidLinearItem(item)) {
            return item;
        }

        return lookForPrevValidItem(item.index - 1);
    }

    /**
     * Looks for the previous spine item. 
     *
     * @method     prevItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Models.SpineItem} the previous spine item or undefined.
    */
    this.prevItem = function(item) {

        return lookForPrevValidItem(item.index - 1);
    };

    function lookForNextValidItem(ix) {

        if(!isValidIndex(ix)) {
            return undefined;
        }

        var item = self.items[ix];

        if(isValidLinearItem(item)) {
            return item;
        }

        return lookForNextValidItem(item.index + 1);
    }

    /**
     * Looks for the next spine item. 
     *
     * @method     nextItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Models.SpineItem} the next spine item or undefined.
    */
    this.nextItem = function(item) {

        return lookForNextValidItem(item.index + 1);
    };

    /**
     * Gets the relative URL of a spine item. 
     *
     * @method     getItemUrl
     * @param      {Models.SpineItem} item  the spine item
     * @return     {String} the relative URL of the spine item.
    */
    this.getItemUrl = function(item) {

        return self.package.resolveRelativeUrl(item.href);

    };

    /**
     * Returns the first spine item. 
     *
     * @method     first
     * @return     {Models.SpineItem} the first spine item.
    */
    this.first = function() {

        return lookForNextValidItem(0);
    };

    /**
     * Returns the last spine item. 
     *
     * @method     last
     * @return     {Models.SpineItem} the last spine item.
    */
    this.last = function() {

        return lookForPrevValidItem(this.items.length - 1);
    };

    /**
     * Checks if a spine item is the first in the spine. 
     *
     * @method     isFirstItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Boolean} TRUE if the spine item is the first in the list.
    */
    this.isFirstItem = function(item) {

        return self.first() === item;
    };

    /**
     * Checks if a spine item is the last in the spine. 
     *
     * @method     isLastItem
     * @param      {Models.SpineItem} item  a spine item
     * @return     {Boolean} true if the spine item is the last in the list.
    */
    this.isLastItem = function(item) {

        return self.last() === item;
    };

    /**
     * Returns a spine item by its index. 
     *
     * @method     item
     * @param      {Number} index  the index of the expected spine item
     * @return     {Models.SpineItem} the expected spine item or undefined.
    */
   this.item = function(index) {
        
        if (isValidIndex(index))
            return self.items[index];
            
        return undefined;
    };

    /**
     * Returns a spine item by its id.
     *
     * @method     getItemById
     * @param      {Number} idref  the id of the expected spine item
     * @return     {Models.SpineItem} the expected spine item or undefined.
     */
    this.getItemById = function(idref) {

        var length = self.items.length;

        for(var i = 0; i < length; i++) {
            if(self.items[i].idref == idref) {

                return self.items[i];
            }
        }

        return undefined;
    };

    /**
     * Returns a spine item by its href.
     *
     * @method     getItemByHref
     * @param      {String} href  the URL of the expected spine item
     * @return     {Models.SpineItem} the expected spine item or undefined.
     */
    this.getItemByHref = function(href) {
        
        var href1_ = self.package.resolveRelativeUrl(href);
        href1_ = href1_.replace("filesystem:chrome-extension://", "filesystem-chrome-extension://");
        var href1 = new URI(href1_).normalizePathname().pathname();
        
        var length = self.items.length;

        for(var i = 0; i < length; i++) {
            
            var href2_ = self.package.resolveRelativeUrl(self.items[i].href);
            href2_ = href2_.replace("filesystem:chrome-extension://", "filesystem-chrome-extension://");
            var href2 = new URI(href2_).normalizePathname().pathname();
            
            if(href1 == href2) {
                return self.items[i];
            }
        }

        return undefined;
    };

    /**
     * Updates every spine item spread, if not already defined.
     *
     * @method     updateSpineItemsSpread
     */
    function updateSpineItemsSpread() {

        var len = self.items.length;

        var isFirstPageInSpread = false;
        var baseSide = self.isLeftToRight() ? SpineItem.SPREAD_LEFT : SpineItem.SPREAD_RIGHT;

        for(var i = 0; i < len; i++) {

            var spineItem = self.items[i];
            if( !spineItem.page_spread) {

                var spread = spineItem.isRenditionSpreadAllowed() ? (isFirstPageInSpread ? baseSide : SpineItem.alternateSpread(baseSide)) : SpineItem.SPREAD_CENTER;
                spineItem.setSpread(spread);
            }

            isFirstPageInSpread = !spineItem.isRenditionSpreadAllowed() || spineItem.page_spread != baseSide;
        }
    }

    // initialization of the local 'direction' and 'items' array from the spineDTO structure
    if(spineDTO) {

        if(spineDTO.direction) {
            this.direction = spineDTO.direction;
        }

        var length = spineDTO.items.length;
        for(var i = 0; i < length; i++) {
            var item = new SpineItem(spineDTO.items[i], i, this);
            this.items.push(item);
        }

        updateSpineItemsSpread();
    }

};
    return Spine;
});
