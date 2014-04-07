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
 * @class ReadiumSDK.Models.Package
 */

ReadiumSDK.Models.Package = function(packageData){

    var self = this;

    this.spine = undefined;
    
    this.rootUrl = undefined;
    this.rootUrlMO = undefined;
    
    this.media_overlay = undefined;
    
    this.rendition_flow = undefined;
    
    this.rendition_layout = undefined;

    //TODO: unused yet!
    this.rendition_spread = undefined;

    //TODO: unused yet!
    this.rendition_orientation = undefined;

    this.resolveRelativeUrlMO = function(relativeUrl) {

        if(self.rootUrlMO && self.rootUrlMO.length > 0) {

            if(ReadiumSDK.Helpers.EndsWith(self.rootUrlMO, "/")){
                return self.rootUrlMO + relativeUrl;
            }
            else {
                return self.rootUrlMO + "/" + relativeUrl;
            }
        }

        return self.resolveRelativeUrl(relativeUrl);
    };

    this.resolveRelativeUrl = function(relativeUrl) {

        if(self.rootUrl) {

            if(ReadiumSDK.Helpers.EndsWith(self.rootUrl, "/")){
                return self.rootUrl + relativeUrl;
            }
            else {
                return self.rootUrl + "/" + relativeUrl;
            }
        }

        return relativeUrl;
    };

    this.isFixedLayout = function() {
        return self.rendition_layout === ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_PREPAGINATED;
    };

    this.isReflowable = function() {
        return !self.isFixedLayout();
    };
    

    if(packageData) {
        
        this.rootUrl = packageData.rootUrl;
        this.rootUrlMO = packageData.rootUrlMO;

        this.rendition_layout = packageData.rendition_layout;
        if(!this.rendition_layout) {
            this.rendition_layout = ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_REFLOWABLE;
        }
        
        this.rendition_flow = packageData.rendition_flow;
        this.rendition_orientation = packageData.rendition_orientation;
        this.rendition_spread = packageData.rendition_spread;
        
        this.spine = new ReadiumSDK.Models.Spine(this, packageData.spine);

        this.media_overlay = ReadiumSDK.Models.MediaOverlay.fromDTO(packageData.media_overlay, this);
    }
};
