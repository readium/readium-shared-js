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
        
        var rendition_spread = self.getRenditionSpread();
        return !rendition_spread || rendition_spread != ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_NONE;
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

    this.isFixedLayout = function() {
        
        // cannot use isPropertyValueSetForItemOrPackage() here!

        var isLayoutExplicitlyDefined = self.getRenditionLayout();

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

        return self.spine.package.rendition_flow;
    };

    this.getRenditionSpread = function() {

        if(self.rendition_spread) {
            return self.rendition_spread;
        }

        return self.spine.package.rendition_spread;
    };

    this.getRenditionOrientation = function() {

        if(self.rendition_orientation) {
            return self.rendition_orientation;
        }

        return self.spine.package.rendition_orientation;
    };

    this.getRenditionLayout = function() {

        if(self.rendition_layout) {
            return self.rendition_layout;
        }

        return self.spine.package.rendition_layout;
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

