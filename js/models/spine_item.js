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

define([], function() {

/**
 * Wrapper of the SpineItem object received from the host application
 *
 * @class  Models.SpineItem
 * @constructor
 * @param itemData container for spine item properties
 * @param {Number} index index of this spine item in the parent spine 
 * @param {Models.Spine} spine parent spine
 *
 */
var SpineItem = function(itemData, index, spine){

    var self = this;

    /**
     * The idref of the spine item, i.e. the ID-based pointer to the actual 
     * manifest item that the spine item references
     *
     * @property idref
     * @type String
     * @default  None
     */
    this.idref = itemData.idref;

    /**
     * The href of the spine item, i.e. the URI to the resource in the EPUB
     * which the spineitem will render
     *
     * @property href
     * @type String
     * @default  None
     */
    this.href = itemData.href;

    /**
     * The package level CFI of the spine item, i.e. the CFI path to the spine item
     * element in the package document.
     *
     * @property cfi
     * @type String
     * @default  None
     */
    this.cfi = itemData.cfi;

    /**
     * A flag indicating whether the spineItem has the attribute linear, which 
     * is either yes or no.  Default is yes.
     *
     * @property linear
     * @type String
     * @default  yes
     */
    this.linear = itemData.linear ? itemData.linear.toLowerCase() : itemData.linear;

    /**
     * A variable indicating the type of synthetic spread for this specific
     * spine item, where page:spread-* can be left, right or center or auto
     *
     * @property page_spread
     * @type String
     * @default  auto
     */
    this.page_spread = itemData.page_spread;
    
    /**
     * A string specifying the height and width from the rendition:viewport tag.
     * Note: This is deprecated in EPUB 3.1
     *
     * @property rendition_viewport
     * @type     String
     * @default  None
     */
    this.rendition_viewport = itemData.rendition_viewport;
    
    /**
     * A string specifying the type of synthetic spread for ALL spine items, where
     * where rendtion:spread-* can be left, right or center or auto
     *
     * @property rendition_spread
     * @type     String
     * @default  auto
     */
    this.rendition_spread = itemData.rendition_spread;

    /**
     * A string specifying desired orientation for ALL spine items. Possible values are
     * rendition-orientation-*, which can be none, landscape, portrait, both or auto
     *
     * Note: Not yet implemented.
     *
     * @property rendition_orientation
     * @type     String
     * @default  auto
     */
    this.rendition_orientation = itemData.rendition_orientation;

    /**
     * A string indicating the type of document layout, either prepaginated or reflowable
     *
     * @property rendition_layout
     * @type     String
     * @default  reflowable
     */
    this.rendition_layout = itemData.rendition_layout;
    
    /**
     * A string specifying how "overflow" content that exceeds the current viewport should
     * be laid out.  Possible values are paginated, scrolled-continuous, scrolled-doc or auto
     *
     * @property rendition_flow
     * @type     String
     * @default  auto
     */
    this.rendition_flow = itemData.rendition_flow;
    
    /**
     * The ID, if any, of the root SMIL element of the media overlay for the document.
     *
     * @property media_overlay_id
     * @type     String
     * @default  None
     */
    this.media_overlay_id = itemData.media_overlay_id;

    /**
     * The mimetype of this specific spine item.
     *
     * @property media_type
     * @type     String
     * @default  None
     */
    this.media_type = itemData.media_type;

    /**
     * The index of this spine item in the parent spine .
     * 
     * @property index
     * @type     String
     * @default  None
     */
    this.index = index;

    /**
     * The object which is the actual spine of which this spineItem is a child.
     *
     * @property spine
     * @type     Models.Spine
     * @default  None
     */
    this.spine = spine;

    validateSpread();

    /**
     * Sets a new page spread and checks its validity
     *
     * @method     setSpread
     * @param      {String} spread  the new page spread 
     */
    this.setSpread = function(spread) {
        this.page_spread = spread;

        validateSpread();
    };

    /* private method (validateSpread) */
    function validateSpread() {

        if(!self.page_spread) {
            return;
        }

        if( self.page_spread != SpineItem.SPREAD_LEFT &&
            self.page_spread != SpineItem.SPREAD_RIGHT &&
            self.page_spread != SpineItem.SPREAD_CENTER ) {

            console.error(self.page_spread + " is not a recognized spread type");
        }
    };

    /**
     * Checks to see if the manifest has specified a spread property of "none"
     *
     * @method     isRenditionSpreadAllowed
     * @return     {Boolean} TRUE if spread=none has NOT been specified, else FALSE
     */
    this.isRenditionSpreadAllowed = function() {
        
        var rendition_spread = self.getRenditionSpread();
        return !rendition_spread || rendition_spread != SpineItem.RENDITION_SPREAD_NONE;
    };

    /**
     * Checks to see if this spineItem explicitly specifies SPREAD_LEFT
     *
     * @method     isLeftPage
     * @return     {Boolean} 
     */
    this.isLeftPage = function() {
        return self.page_spread == SpineItem.SPREAD_LEFT;
    };

    /**
     * Checks to see if this spineItem explicitly specifies SPREAD_RIGHT
     *
     * @method     isRightPage
     * @return     {Boolean} 
     */
    this.isRightPage = function() {
        return self.page_spread == SpineItem.SPREAD_RIGHT;
    };

    /**
     * Checks to see if this spineItem explicitly specifies SPREAD_CENTER
     *
     * @method     isCenterPage
     * @return     {Boolean} 
     */
    this.isCenterPage = function() {
        return self.page_spread == SpineItem.SPREAD_CENTER;
    };

    /**
     * Checks to see if the parent package of this spineIem is
     * reflowable
     *
     * @method     isReflowable
     * @return     {Boolean} 
     */
    this.isReflowable = function() {
        return !self.isFixedLayout();
    };

    /**
     * Checks to see if the parent package of to this spineIem is
     * fixed layout
     *
     * @method     isFixedLayout
     * @return     {Boolean} 
     */
    this.isFixedLayout = function() {
        
        // cannot use isPropertyValueSetForItemOrPackage() here!

        var isLayoutExplicitlyDefined = self.getRenditionLayout();

        if(isLayoutExplicitlyDefined) {

            if (self.rendition_layout)
            {
                if (self.rendition_layout === SpineItem.RENDITION_LAYOUT_PREPAGINATED) return true;
                if (self.rendition_layout === SpineItem.RENDITION_LAYOUT_REFLOWABLE) return false;
            }

            return self.spine.package.isFixedLayout();
        }

        // if image or svg use fixed layout
        return self.media_type.indexOf("image/") >= 0;
    };

    /**
     * Returns a string indicating the type of layout for viewport overflow, 
     * i.e. scrolldoc, scroll-continuous, paginated or auto.  Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned
     *
     * @method     getRenditionFlow
     * @return     {String} 
     */
   this.getRenditionFlow = function() {

        if(self.rendition_flow) {
            return self.rendition_flow;
        }

        return self.spine.package.rendition_flow;
    };
    
    /**
     * Returns the rendition:viewport, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     * Note that this attribute is deprecated in EPUB 3.1
     *
     * @method     getRenditionViewport
     * @return     {Boolean} 
     */
     this.getRenditionViewport = function() {

        if(self.rendition_viewport) {
            return self.rendition_viewport;
        }

        return self.spine.package.rendition_viewport;
    };

    /**
     * Returns the rendition:spread, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     *
     * @method     getRenditionSpread
     * @return     {Boolean} 
     */
    this.getRenditionSpread = function() {

        if(self.rendition_spread) {
            return self.rendition_spread;
        }

        return self.spine.package.rendition_spread;
    };

    /**
     * Returns the rendition:orientation, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     *
     * @method     getRenditionOrientation
     * @return     {Boolean} 
     */
    this.getRenditionOrientation = function() {

        if(self.rendition_orientation) {
            return self.rendition_orientation;
        }

        return self.spine.package.rendition_orientation;
    };

    /**
     * Returns the rendition:layout, if any. Note that if the spineItem 
     * has an override (local value) that is returned, else the package's 
     * value is returned.
     *
     * @method     getRenditionLayout
     * @return     {String} 
     */
    this.getRenditionLayout = function() {

        if(self.rendition_layout) {
            return self.rendition_layout;
        }

        return self.spine.package.rendition_layout;
    };

    /**
     * Checks to see if the specified property is set in this spineItem and
     * matches the supplied value.  If the property is NOT set in the spineItem
     * then the the package is checked. If not set in either place then 
     * the function returns FALSE.
     *
     * @method     isPropertyValueSetForItemOrPackage
     * @param      {String} propName  The name of the property to be checked
     * @param      {String} propValue The value of the property to be checked
     * @return     {Boolean} 
     */
    function isPropertyValueSetForItemOrPackage(propName, propValue) {

        if(self[propName]) {
            return self[propName] === propValue;
        }

        if(self.spine.package[propName]) {
            return self.spine.package[propName] === propValue;
        }

        return false;
    }

    /**
     * Checks if this spineItem or its parent package has its overflow content 
     * layout specified as scrolled-continuous.
     *
     * @method     isFlowScrolledContinuous
     * @return     {Boolean} 
     */
    this.isFlowScrolledContinuous = function() {

        return isPropertyValueSetForItemOrPackage("rendition_flow", SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS);
    };

    /**
     * Checks if this spineItem or its parent package has its overflow content 
     * layout specified as scrolled-doc.
     *
     * @method     isFlowScrolledDoc
     * @return     {Boolean} 
     */
    this.isFlowScrolledDoc = function() {

        return isPropertyValueSetForItemOrPackage("rendition_flow", SpineItem.RENDITION_FLOW_SCROLLED_DOC);
    };
};

/** 
 * @property RENDITION_LAYOUT_REFLOWABLE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_LAYOUT_REFLOWABLE = "reflowable";

/** 
 * @property RENDITION_LAYOUT_PREPAGINATED 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_LAYOUT_PREPAGINATED = "pre-paginated";

/** 
 * @property RENDITION_ORIENTATION_LANDSCAPE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_ORIENTATION_LANDSCAPE = "landscape";

/** 
 * @property RENDITION_ORIENTATION_PORTRAIT 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_ORIENTATION_PORTRAIT = "portrait";
/** 
 * @property RENDITION_ORIENTATION_AUTO
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_ORIENTATION_AUTO = "auto";

/** 
 * @property SPREAD_LEFT 
 * @type {String}
 * @static 
 */
SpineItem.SPREAD_LEFT = "page-spread-left";

/** 
 * @property SPREAD_RIGHT 
 * @type {String}
 * @static 
 */
SpineItem.SPREAD_RIGHT = "page-spread-right";

/** 
 * @property SPREAD_CENTER 
 * @type {String}
 * @static 
 */
SpineItem.SPREAD_CENTER = "page-spread-center";

/** 
 * @property RENDITION_SPREAD_NONE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_NONE = "none";

/** 
 * @property RENDITION_SPREAD_LANDSCAPE 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_LANDSCAPE = "landscape";

/** 
 * @property RENDITION_SPREAD_PORTRAIT 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_PORTRAIT = "portrait";

/** 
 * @property RENDITION_SPREAD_BOTH 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_BOTH = "both";

/** 
 * @property RENDITION_SPREAD_AUTO 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_SPREAD_AUTO = "auto";

/** 
 * @property RENDITION_FLOW_PAGINATED 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_PAGINATED = "paginated";

/** 
 * @property RENDITION_FLOW_SCROLLED_CONTINUOUS 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS = "scrolled-continuous";

/** 
 * @property RENDITION_FLOW_SCROLLED_DOC 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_SCROLLED_DOC = "scrolled-doc";

/** 
 * @property RENDITION_FLOW_AUTO 
 * @type {String}
 * @static 
 */
SpineItem.RENDITION_FLOW_AUTO = "auto";

/**
 * Returns the inversion of the spineItem's SPREAD property. i.e
 * if the page-spread is right it returns LEFT and vice versa.  If 
 * the spread is center then it returns CENTER
 *
 * @method     alternateSpread
 * @return     {String} 
 */
SpineItem.alternateSpread = function(spread) {

    if(spread === SpineItem.SPREAD_LEFT) {
        return SpineItem.SPREAD_RIGHT;
    }

    if(spread === SpineItem.SPREAD_RIGHT) {
        return SpineItem.SPREAD_LEFT;
    }

    return spread;

};
    return SpineItem;
});


