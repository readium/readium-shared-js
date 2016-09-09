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
define(['../helpers','./spine_item','./spine','./media_overlay', './package_data', 'URIjs'], function (Helpers, SpineItem, Spine, MediaOverlay, PackageData, URI) {

/**
 *  Wrapper of the Package object, created in openBook()
 *
 * @class  Models.Package
 * @constructor
 * @param {Models.PackageData} packageData container for package properties 
 */
var Package = function(packageData){

    var self = this;
    
    /**
     * The associated spine object
     *
     * @property spine
     * @type     Models.Spine
     */
    this.spine = undefined;

    /**
     * The root URL of the package file
     *
     * @property rootUrl
     * @type     String
     */
    this.rootUrl = undefined;

    /**
     * The root URL of the package file, to prefix Media Overlays SMIL audio references
     *
     * @property rootUrlMO 
     * @type     String
     *
     */
    this.rootUrlMO = undefined;
 
    /**
     * The Media Overlays object
     *
     * @property media_overlay 
     * @type     Models.MediaOverlay
     *
     */   
    this.media_overlay = undefined;
    
    /**
     * The rendition viewport (as per the EPUB3 specification)
     *
     * @property rendition_viewport 
     * @type     String
     *
     */   
    this.rendition_viewport = undefined;
    
    /**
     * The rendition flow (as per the EPUB3 specification)
     *
     * @property rendition_flow 
     * @type     String
     *
     */   
    this.rendition_flow = undefined;
    
    /**
     * The rendition layout (as per the EPUB3 specification)
     *
     * @property rendition_layout 
     * @type     String
     *
     */   
    this.rendition_layout = undefined;

    /**
     * The rendition spread (as per the EPUB3 specification)
     *
     * @property rendition_spread 
     * @type     String
     *
     */   
    this.rendition_spread = undefined;

    /**
     * The rendition orientation (as per the EPUB3 specification)
     *
     * @property rendition_orientation 
     * @type     String
     *
     */   
    this.rendition_orientation = undefined;

    /**
     * Returns a resolved relative Url, Media Overlay variant.
     *
     * @method     resolveRelativeUrlMO
     * @param      {String} relativeUrl  the relative URL to resolve
     * @return     {String} the resolved relative URL.
     */
    this.resolveRelativeUrlMO = function(relativeUrl) {
        
        var relativeUrlUri = undefined;
        try {
            relativeUrlUri = new URI(relativeUrl);
        } catch(err) {
            console.error(err);
            console.log(relativeUrl);
        }
        if (relativeUrlUri && relativeUrlUri.is("absolute")) return relativeUrl; //relativeUrlUri.scheme() == "http://", "https://", "data:", etc.


        if(self.rootUrlMO && self.rootUrlMO.length > 0) {

            var url = self.rootUrlMO;
            
            try {
                //url = new URI(relativeUrl).absoluteTo(url).search('').hash('').toString();
                url = new URI(url).search('').hash('').toString();
            } catch(err) {
                console.error(err);
                console.log(url);
            }
            
            if(Helpers.EndsWith(url, "/")){
                return url + relativeUrl;
            }
            else {
                return url + "/" + relativeUrl;
            }
        }

        return self.resolveRelativeUrl(relativeUrl);
    };

    /**
     * Returns a resolved relative Url.
     *
     * @method     resolveRelativeUrl
     * @param      {String} relativeUrl  the relative URL to resolve
     * @return     {String} the resolved relative URL.
     */
    this.resolveRelativeUrl = function(relativeUrl) {

        var relativeUrlUri = undefined;
        try {
            relativeUrlUri = new URI(relativeUrl);
        } catch(err) {
            console.error(err);
            console.log(relativeUrl);
        }
        if (relativeUrlUri && relativeUrlUri.is("absolute")) return relativeUrl; //relativeUrlUri.scheme() == "http://", "https://", "data:", etc.

        
        if(self.rootUrl) {

            var url = self.rootUrl;
            
            try {
                //url = new URI(relativeUrl).absoluteTo(url).search('').hash('').toString();
                url = new URI(url).search('').hash('').toString();
            } catch(err) {
                console.error(err);
                console.log(url);
            }
            
            if(Helpers.EndsWith(url, "/")){
                return url + relativeUrl;
            }
            else {
                return url + "/" + relativeUrl;
            }
        }

        return relativeUrl;
    };

    /**
     * Checks if the package is Fixed Layout.
     *
     * @method     isFixedLayout
     * @return     {Boolean} TRUE if the package is Fixed Layout.
     */
    this.isFixedLayout = function() {
        return self.rendition_layout === SpineItem.RENDITION_LAYOUT_PREPAGINATED;
    };

    /**
     * Checks if the package is Reflowable.
     *
     * @method     isReflowable
     * @return     {Boolean} TRUE if the package is Reflowable (i.e. not Fixed Layout).
     */
    this.isReflowable = function() {
        return !self.isFixedLayout();
    };
    
    if(packageData) {
        
        this.rootUrl = packageData.rootUrl;
        this.rootUrlMO = packageData.rootUrlMO;

        this.rendition_viewport = packageData.rendition_viewport;

        this.rendition_layout = packageData.rendition_layout;

        this.rendition_flow = packageData.rendition_flow;
        this.rendition_orientation = packageData.rendition_orientation;
        this.rendition_spread = packageData.rendition_spread;
        
        this.spine = new Spine(this, packageData.spine);

        this.media_overlay = MediaOverlay.fromDTO(packageData.media_overlay, this);
    }
};

return Package;
});

