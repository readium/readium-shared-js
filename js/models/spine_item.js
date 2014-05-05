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
 * Wrapper of the SpineItem object received from the host application
 *
 * @class ReadiumSDK.Models.SpineItem
 *
 * @param itemData spine item properties container
 * @param {Number} index
 * @param {ReadiumSDK.Models.Spine} spine
 *
 */

ReadiumSDK.Models.SpineItem = function(itemData, index, spine){

    var self = this;

    this.idref = itemData.idref;
    this.href = itemData.href;

    this.linear = itemData.linear;

    this.page_spread = itemData.page_spread;
    
    this.rendition_spread = itemData.rendition_spread;
    
    //TODO: unused yet!
    this.rendition_orientation = itemData.rendition_orientation;

    this.rendition_layout = itemData.rendition_layout;
    
    this.rendition_flow = itemData.rendition_flow;
    
    
    
    this.media_overlay_id = itemData.media_overlay_id;

    this.media_type = itemData.media_type;

    this.index = index;
    this.spine = spine;

    validateSpread();

    this.setSpread = function(spread) {
        this.page_spread = spread;

        validateSpread();
    };

    this.isRenditionSpreadAllowed = function() {
        return !self.rendition_spread || self.rendition_spread != ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_NONE;
    };

    function validateSpread() {

        if(!self.page_spread) {
            return;
        }

        if( self.page_spread != ReadiumSDK.Models.SpineItem.SPREAD_LEFT &&
            self.page_spread != ReadiumSDK.Models.SpineItem.SPREAD_RIGHT &&
            self.page_spread != ReadiumSDK.Models.SpineItem.SPREAD_CENTER ) {

            console.error(self.page_spread + " is not a recognized spread type");
        }

    }

    this.isLeftPage = function() {
        return self.page_spread == ReadiumSDK.Models.SpineItem.SPREAD_LEFT;
    };

    this.isRightPage = function() {
        return self.page_spread == ReadiumSDK.Models.SpineItem.SPREAD_RIGHT;
    };

    this.isCenterPage = function() {
        return self.page_spread == ReadiumSDK.Models.SpineItem.SPREAD_CENTER;
    };

    this.isReflowable = function() {
        return !self.isFixedLayout();
    };

    this.isLayoutSetExplicitly = function() {
        return self.rendition_layout;
    };

    this.isFixedLayout = function() {
        
        // cannot use isPropertyValueSetForItemOrPackage() here!

        var isLayoutExplicitlyDefined = self.rendition_layout || self.spine.package.rendition_layout;

        if(isLayoutExplicitlyDefined) {

            if (self.rendition_layout)
            {
                if (self.rendition_layout === ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_PREPAGINATED) return true;
                if (self.rendition_layout === ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_REFLOWABLE) return false;
            }

            return self.spine.package.isFixedLayout();
        }

        // if image or svg use fixed layout
        return self.media_type.indexOf("image/") >= 0;

    };

    this.getRenditionFlow = function() {

        if(self.rendition_flow) {
            return self.rendition_flow;
        }

        return self.package.rendition_flow;
    };

    function isPropertyValueSetForItemOrPackage(propName, propValue) {

        if(self[propName]) {
            return self[propName] === propValue;
        }

        if(self.spine.package[propName]) {
            return self.spine.package[propName] === propValue;
        }

        return false;
    }

    this.isFlowScrolledContinuous = function() {

        return isPropertyValueSetForItemOrPackage("rendition_flow", ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS);
    };

    this.isFlowScrolledDoc = function() {

        return isPropertyValueSetForItemOrPackage("rendition_flow", ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_DOC);
    };
};

ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_REFLOWABLE = "reflowable";
ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_PREPAGINATED = "pre-paginated";

ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_LANDSCAPE = "landscape";
ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_PORTRAIT = "portrait";
ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_AUTO = "auto";

ReadiumSDK.Models.SpineItem.SPREAD_LEFT = "page-spread-left";
ReadiumSDK.Models.SpineItem.SPREAD_RIGHT = "page-spread-right";
ReadiumSDK.Models.SpineItem.SPREAD_CENTER = "page-spread-center";

ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_NONE = "none";
ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_LANDSCAPE = "landscape";
ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_PORTRAIT = "portrait";
ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_BOTH = "both";
ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_AUTO = "auto";

ReadiumSDK.Models.SpineItem.RENDITION_FLOW_PAGINATED = "paginated";
ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS = "scrolled-continuous";
ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_DOC = "scrolled-doc";
ReadiumSDK.Models.SpineItem.RENDITION_FLOW_AUTO = "auto";

ReadiumSDK.Models.SpineItem.alternateSpread = function(spread) {

    if(spread === ReadiumSDK.Models.SpineItem.SPREAD_LEFT) {
        return ReadiumSDK.Models.SpineItem.SPREAD_RIGHT;
    }

    if(spread === ReadiumSDK.Models.SpineItem.SPREAD_RIGHT) {
        return ReadiumSDK.Models.SpineItem.SPREAD_LEFT;
    }

    return spread;

};

