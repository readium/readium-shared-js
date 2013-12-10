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

ReadiumSDK.Models.Package = Backbone.Model.extend({

    spine: undefined,
    rendition_layout: undefined,
    rootUrl: undefined,
    rootUrlMO: undefined,
    media_overlay: undefined,

    initialize : function() {

        this.reset();

        var packageData = this.get("packageData");

        if(packageData) {

            this.rootUrl = packageData.rootUrl;
            this.rootUrlMO = packageData.rootUrlMO;

            this.rendition_layout = packageData.rendition_layout;

            if(!this.rendition_layout) {
                this.rendition_layout = "reflowable";
            }

            this.spine = new ReadiumSDK.Models.Spine(this, packageData.spine);

            this.media_overlay = ReadiumSDK.Models.MediaOverlay.fromDTO(packageData.media_overlay);
        }
    },

    resolveRelativeUrlMO: function(relativeUrl) {

        if(this.rootUrlMO && this.rootUrlMO.length > 0) {

            if(ReadiumSDK.Helpers.EndsWith(this.rootUrlMO, "/")){
                return this.rootUrlMO + relativeUrl;
            }
            else {
                return this.rootUrlMO + "/" + relativeUrl;
            }
        }

        return this.resolveRelativeUrl(relativeUrl);
    },

    resolveRelativeUrl: function(relativeUrl) {

        if(this.rootUrl) {

            if(ReadiumSDK.Helpers.EndsWith(this.rootUrl, "/")){
                return this.rootUrl + relativeUrl;
            }
            else {
                return this.rootUrl + "/" + relativeUrl;
            }
        }

        return relativeUrl;
    },

    reset: function() {
        this.spine = undefined;
        this.rendition_layout = undefined;
        this.rootUrl = undefined;
        this.rootUrlMO = undefined;
    },

    isFixedLayout: function() {
        return this.rendition_layout === "pre-paginated";
    },

    isReflowable: function() {
        return !this.isFixedLayout();
    }
});
