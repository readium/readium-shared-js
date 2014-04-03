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
 *  Wrapper of the spine object received from hosting application
 *
 *  @class  ReadiumSDK.Models.Spine
 */

ReadiumSDK.Models.Spine = function(epubPackage, spineDTO) {

    var self = this;

    /*
     * Collection of spine items
     * @property items
     * @type {Array}
     */
    this.items = [];

    /*
     * Page progression direction ltr|rtl|default
     * @property direction
     * @type {string}
     */
    this.direction = "ltr";

    /*
     * @property package
     * @type {ReadiumSDK.Models.Package}
     *
     */
    this.package = epubPackage;



    this.prevItem = function(item, handleLinear) {

        if(isValidIndex(item.index - 1)) {
            var previous = this.items[item.index - 1];
            if (handleLinear && previous && previous.linear && previous.linear === "no")
            {
                return this.prevItem(previous, true);
            }
            return previous;
        }

        return undefined;
    };

    this.nextItem = function(item, handleLinear){

        if(isValidIndex(item.index + 1)) {
            var next = this.items[item.index + 1];
            if (handleLinear && next && next.linear && next.linear === "no")
            {
                return this.nextItem(next, true);
            }
            return next;
        }

        return undefined;
    };

    this.getItemUrl = function(item) {

        self.package.resolveRelativeUrl(item.href);

    };

    function isValidIndex(index) {

        return index >= 0 && index < self.items.length;
    }

    this.first = function(handleLinear) {
        var item = self.items[0];
        if (handleLinear && item && item.linear && item.linear === "no")
        {
            return this.nextItem(item, true);
        }
    };

    this.last = function(handleLinear) {
        var item = self.items[self.items.length - 1];
        if (handleLinear && item && item.linear && item.linear === "no")
        {
            return this.prevItem(item, true);
        }
    };

    this.isFirstItem = function(item, handleLinear) {
        if (handleLinear)
        {
            var spi = this.first(true);
            return item === spi;
        }
        return item.index === 0;
    };

    this.isLastItem = function(item, handleLinear) {
        if (handleLinear)
        {
            var spi = this.last(true);
            return item === spi;
        }
        return item.index  === self.items.length - 1;
    };

    this.item = function(index) {
		
		if (isValidIndex(index))
        	return self.items[index];
			
		return undefined;
    };

    this.isRightToLeft = function() {

        return self.direction == "rtl";
    };

    this.isLeftToRight = function() {

        return !self.isRightToLeft();
    };

    this.getItemById = function(idref) {

        var length = self.items.length;

        for(var i = 0; i < length; i++) {
            if(self.items[i].idref == idref) {

                return self.items[i];
            }
        }

        return undefined;
    };

    this.getItemByHref = function(href) {

        var length = self.items.length;

        for(var i = 0; i < length; i++) {
            if(self.items[i].href == href) {

                return self.items[i];
            }
        }

        return undefined;
    };

    function updateSpineItemsSpread() {

        var len = self.items.length;

        var isFirstPageInSpread = false;
        var baseSide = self.isLeftToRight() ? ReadiumSDK.Models.SpineItem.SPREAD_LEFT : ReadiumSDK.Models.SpineItem.SPREAD_RIGHT;

        for(var i = 0; i < len; i++) {

            var spineItem = self.items[i];
            if( !spineItem.page_spread) {

                var spread = isFirstPageInSpread ? baseSide : ReadiumSDK.Models.SpineItem.alternateSpread(baseSide);
                spineItem.setSpread(spread);
            }

            isFirstPageInSpread = !spineItem.isRenditionSpreadAllowed() || spineItem.page_spread != baseSide;
        }
    }

    if(spineDTO) {

        if(spineDTO.direction) {
            this.direction = spineDTO.direction;
        }

        var length = spineDTO.items.length;
        for(var i = 0; i < length; i++) {
            var item = new ReadiumSDK.Models.SpineItem(spineDTO.items[i], i, this);
            this.items.push(item);
        }

        updateSpineItemsSpread();
    }

};
