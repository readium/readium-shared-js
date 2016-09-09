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
 * Spread the page 
 *
 * @class  Models.Spread
 * @constructor
 * @param spine 
 * @param {Boolean} isSyntheticSpread 
 *
 */
var Spread = function(spine, isSyntheticSpread) {

    var self = this;

    this.spine = spine;
    
    this.leftItem = undefined;
    this.rightItem = undefined;
    this.centerItem = undefined;

    var _isSyntheticSpread = isSyntheticSpread;

    /**
     * Sets whether or not this is a synthetic spread
     *
     * @method     setSyntheticSpread
     * @param      {Bool} isSyntheticSpread
     */

    this.setSyntheticSpread = function(isSyntheticSpread) {
        _isSyntheticSpread = isSyntheticSpread;
    };

    /**
     * Checks out if the spread is synthetic
     *
     * @method     isSyntheticSpread
     * @return     {Bool} true if this is a 2-page synthetic spread
     */

    this.isSyntheticSpread = function() {
        return _isSyntheticSpread;
    };

    /**
     * Opens the first spine item (FXL page)
     *
     * @method     openFirst
     */

    this.openFirst = function() {

        if( this.spine.items.length == 0 ) {
            resetItems();
        }
        else {
            this.openItem(this.spine.first());
        }
    };

    /**
     * Opens the last spine item (FXL page)
     *
     * @method     openLast
     */

    this.openLast = function() {

        if( this.spine.items.length == 0 ) {
            resetItems();
        }
        else {
            this.openItem(this.spine.last());
        }
    };

    /**
     * Opens a spine item (FXL page)
     *
     * @method     openItem
     * @param      {Models.SpineItem} item
     */

    this.openItem = function(item) {

        resetItems();

        var position = getItemPosition(item);
        setItemToPosition(item, position);

        if(position != Spread.POSITION_CENTER && this.spine.isValidLinearItem(item.index)) { // && item.isRenditionSpreadAllowed() not necessary, see getItemPosition() below
            var neighbour = getNeighbourItem(item);
            if(neighbour) {
                var neighbourPos = getItemPosition(neighbour);
                if(neighbourPos != position
                    && neighbourPos != Spread.POSITION_CENTER
                    && !neighbour.isReflowable()
                    && neighbour.isRenditionSpreadAllowed())  {
                    setItemToPosition(neighbour, neighbourPos);
                }
            }
        }
    };

    /**
     * Resets the spine items (FXL pages, left + right + center) to undefined
     *
     * @method     resetItems
     */

    function resetItems() {

        self.leftItem = undefined;
        self.rightItem = undefined;
        self.centerItem = undefined;
    }

    /**
     * Sets the spine item (FXL page) to a position (left, right or center)
     *
     * @method     setItemToPosition
     * @param      {Models.SpineItem} item
     * @param      {Spread.POSITION_CENTER | Spread.POSITION_LEFT | Spread.POSITION_RIGHT} position
     */

    function setItemToPosition(item, position) {

        if(position == Spread.POSITION_LEFT) {
            self.leftItem = item;
        }
        else if (position == Spread.POSITION_RIGHT) {
            self.rightItem = item;
        }
        else {

            if(position != Spread.POSITION_CENTER) {
                console.error("Unrecognized position value");
            }

            self.centerItem = item;
        }
    }

    /**
     * Returns the position of a spine item / FXL page (left, center or right)
     *
     * @method     getItemPosition
     * @param      {Models.SpineItem} item
     * @return     {Spread.POSITION_CENTER | Spread.POSITION_LEFT | Spread.POSITION_RIGHT}
     */

    function getItemPosition(item) {
        
        // includes !item.isRenditionSpreadAllowed() ("rendition:spread-none") ==> force center position
        if(!_isSyntheticSpread) {
            return Spread.POSITION_CENTER;
        }

        if(item.isLeftPage()) {
            return Spread.POSITION_LEFT;
        }

        if (item.isRightPage()) {
            return Spread.POSITION_RIGHT;
        }

        return Spread.POSITION_CENTER;
    }

    /**
     * Opens the next item
     *
     * @method     openNext
     */ 

    this.openNext = function() {

        var items = this.validItems();

        if(items.length == 0) {

            this.openFirst();
        }
        else {

            var nextItem = this.spine.nextItem(items[items.length - 1]);
            if(nextItem) {

                this.openItem(nextItem);
            }
        }
    };

    /**
     * Opens the previous item
     *
     * @method     openPrev
     */ 

    this.openPrev = function() {

        var items = this.validItems();

        if(items.length == 0) {
            this.openLast();
        }
        else {

            var prevItem = this.spine.prevItem(items[0]);
            if(prevItem) {

                this.openItem(prevItem);

            }
        }
    };

    /**
     * Returns an sorrted array of spine items (as per their order in the spine) that are currently in the FXL page layout
     *
     * @method     validItems
     * @return     {array} 
     */ 

    this.validItems = function() {

        var arr = [];

        if(this.leftItem) arr.push(this.leftItem);
        if(this.rightItem) arr.push(this.rightItem);
        if(this.centerItem) arr.push(this.centerItem);

        arr.sort(function(a, b) {
            return a.index - b.index;
        });

        return arr;
    };

    /**
     * Gets the neighbour spine item in the FXL page layout (on left or right of the current item)
     *
     * @method     getNeighbourItem
     * @param      {Models.SpineItem} item
     * @return     {Models.SpineItem} item
     */ 

    function getNeighbourItem(item) {

        if(item.isLeftPage()) {
            return self.spine.isRightToLeft() ? self.spine.prevItem(item) : self.spine.nextItem(item);
        }

        if(item.isRightPage()) {
            return self.spine.isRightToLeft() ? self.spine.nextItem(item) : self.spine.prevItem(item);
        }

        return undefined;
    }

};

Spread.POSITION_LEFT = "left";
Spread.POSITION_RIGHT = "right";
Spread.POSITION_CENTER = "center";

return Spread;
});