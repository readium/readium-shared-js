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
 *
 *
 *
 * @param {ReadiumSDK.Models.Spine} spine
 * @constructor
 */

ReadiumSDK.Models.Spread = function(spine, orientation) {

    var self = this;

    this.orientation = orientation;
    this.spine = spine;

    this.leftItem = undefined;
    this.rightItem = undefined;
    this.centerItem = undefined;

    var _isSyntheticSpread = true;

    this.setSyntheticSpread = function(isSyntheticSpread) {
        _isSyntheticSpread = isSyntheticSpread;
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

        if(position != ReadiumSDK.Models.Spread.POSITION_CENTER) {
            var neighbour = getNeighbourItem(item, true);
            if(neighbour) {
                var neighbourPos = getItemPosition(neighbour);
                if(neighbourPos != position && position != ReadiumSDK.Models.Spread.POSITION_CENTER)  {
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
                console.error("Unrecognized position value");
            }

            self.centerItem = item;
        }

    }

    function getItemPosition(item) {

        if(!_isSyntheticSpread) {
            return ReadiumSDK.Models.Spread.POSITION_CENTER;
        }

        if(!ReadiumSDK.Helpers.isRenditionSpreadPermittedForItem(item, self.orientation)) {
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
