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
 *
 *
 * @param {ReadiumSDK.Models.Spine} spine
 * @constructor
 */

ReadiumSDK.Models.Spread = function(spine, isSyntheticSpread) {

    var self = this;

    this.spine = spine;

    this.leftItem = undefined;
    this.rightItem = undefined;
    this.centerItem = undefined;

    var _isSyntheticSpread = isSyntheticSpread;

    this.setSyntheticSpread = function(isSyntheticSpread) {
        _isSyntheticSpread = isSyntheticSpread;
    };

    this.isSyntheticSpread = function() {
        return _isSyntheticSpread;
    };

    this.openFirst = function() {

        if( this.spine.items.length == 0 ) {
            resetItems();
        }
        else {
            this.openItem(this.spine.first());
        }
    };

    this.openLast = function() {

        if( this.spine.items.length == 0 ) {
            resetItems();
        }
        else {
            this.openItem(this.spine.last());
        }
    };

    this.openItem = function(item) {

        resetItems();

        var position = getItemPosition(item);
        setItemToPosition(item, position);

        if(position != ReadiumSDK.Models.Spread.POSITION_CENTER && this.spine.isValidLinearItem(item.index)) { // && item.isRenditionSpreadAllowed() not necessary, see getItemPosition() below
            var neighbour = getNeighbourItem(item);
            if(neighbour) {
                var neighbourPos = getItemPosition(neighbour);
                if(neighbourPos != position
                    && neighbourPos != ReadiumSDK.Models.Spread.POSITION_CENTER
                    && !neighbour.isReflowable()
                    && neighbour.isRenditionSpreadAllowed())  {
                    setItemToPosition(neighbour, neighbourPos);
                }
            }
        }
    };

    function resetItems() {

        self.leftItem = undefined;
        self.rightItem = undefined;
        self.centerItem = undefined;
    }

    function setItemToPosition(item, position) {

        if(position == ReadiumSDK.Models.Spread.POSITION_LEFT) {
            self.leftItem = item;
        }
        else if (position == ReadiumSDK.Models.Spread.POSITION_RIGHT) {
            self.rightItem = item;
        }
        else {

            if(position != ReadiumSDK.Models.Spread.POSITION_CENTER) {
                webkit.messageHandlers.consoleerror.postMessage("Unrecognized position value");
            }

            self.centerItem = item;
        }
    }

    function getItemPosition(item) {
        
        // includes !item.isRenditionSpreadAllowed() ("rendition:spread-none") ==> force center position
        if(!_isSyntheticSpread) {
            return ReadiumSDK.Models.Spread.POSITION_CENTER;
        }

        if(item.isLeftPage()) {
            return ReadiumSDK.Models.Spread.POSITION_LEFT;
        }

        if (item.isRightPage()) {
            return ReadiumSDK.Models.Spread.POSITION_RIGHT;
        }

        return ReadiumSDK.Models.Spread.POSITION_CENTER;
    }

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

ReadiumSDK.Models.Spread.POSITION_LEFT = "left";
ReadiumSDK.Models.Spread.POSITION_RIGHT = "right";
ReadiumSDK.Models.Spread.POSITION_CENTER = "center";
