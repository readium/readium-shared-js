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


define(function() {
/**
 * This object is not instantiated directly but provided by the host application to the DOMAccess layer in the
 * Views.ReaderView.OpenBookData function
 *
 * Provided for reference only
 *
 * @class Models.PackageData
 */
var PackageData = {

    /**
     * The Url of the package file
     *
     * @property rootUrl 
     * @type {String}
     *
     */
    rootUrl: "",
    /**
     * The Url of the package file, to prefix Media Overlays SMIL audio references
     *
     * @property rootUrlMO 
     * @type {String}
     *
     */
    rootUrlMO: "",
    /**
     * The rendering layout; expected values are "reflowable"|"pre-paginated"
     *
     * @property rendering_layout 
     * @type {String}
     */
    rendering_layout: "",

    /**
     * The spine properties
     *
     * @property spine 
     * @type {Object}
     */
    spine: {

        direction: "ltr",
        items: [
            {
                href:"",
                idref:"",
                page_spread:"", //"page-spread-left"|"page-spread-right"|"page-spread-center"
                rendering_layout:"" //"reflowable"|"pre-paginated"
            }
        ]
    }
};

return PackageData;
});