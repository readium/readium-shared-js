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

define([], function() {
/**
 *
 * @param settingsData
 * @constructor
 */
var ViewerSettings = function(settingsData) {

    var self = this;

    /** Set to "auto"
     *
     * @property syntheticSpread
     * @type 
     */

    this.syntheticSpread = "auto";

    /** 
     *
     * @property fontSelection
     * @type number
     */
    
    this.fontSelection = 0;

    /** 
     *
     * @property fontSize
     * @type number
     */

    this.fontSize = 100;

    /** 
     *
     * @property columnGap
     * @type number
     */

    this.columnGap = 20;
    
    /** 
     *
     * @property columnMaxWidth
     * @type number
     */

    this.columnMaxWidth = 700;

    /** 
     *
     * @property columnMinWidth
     * @type number
     */

    this.columnMinWidth = 400;

    /** 
     *
     * @property mediaOverlaysPreservePlaybackWhenScroll
     * @type bool
     */

    this.mediaOverlaysPreservePlaybackWhenScroll = false;

    /** 
     *
     * @property mediaOverlaysSkipSkippables
     * @type bool
     */

    this.mediaOverlaysSkipSkippables = false;

    /** 
     *
     * @property mediaOverlaysEscapables
     * @type bool
     */

    this.mediaOverlaysEscapeEscapables = true;

    /** 
     *
     * @property mediaOverlaysSkippables
     * @type array
     */

    this.mediaOverlaysSkippables = [];
    
    /** 
     *
     * @property mediaOverlaysEscapables
     * @type array
     */

    this.mediaOverlaysEscapables = [];

    /** 
     *
     * @property mediaOverlaysEnableClick
     * @type bool
     */
    
    this.mediaOverlaysEnableClick = true;

    /** 
     *
     * @property mediaOverlaysRate
     * @type number
     */

    this.mediaOverlaysRate = 1;

    /** 
     *
     * @property mediaOverlaysVolume
     * @type number
     */

    this.mediaOverlaysVolume = 100;

    /** 
     *
     * @property mediaOverlaysSynchronizationGranularity
     * @type string
     */
    
    this.mediaOverlaysSynchronizationGranularity = "";

    /** 
     *
     * @property mediaOverlaysAutomaticPageTurn
     * @type bool
     */    

    this.mediaOverlaysAutomaticPageTurn = true;

    /** 
     *
     * @property enableGPUHardwareAccelerationCSS3D
     * @type bool
     */    


    this.enableGPUHardwareAccelerationCSS3D = false;

    // -1 ==> disable
    // [0...n] ==> index of transition in pre-defined array
    
    /** 
     *
     * @property pageTransition
     * @type number
     */        

    this.pageTransition = -1;
 
    /** 
     *
     * @property scroll
     * @type string
     */        

    this.scroll = "auto";

    /**
     * Builds an array
     *
     * @method     buildArray
     * @param      {string} str
     * @return     {array} retArr
     */

    function buildArray(str)
    {
        var retArr = [];
        var arr = str.split(/[\s,;]+/); //','
        for (var i = 0; i < arr.length; i++)
        {
            var item = arr[i].trim();
            if (item !== "")
            {
                retArr.push(item);
            }
        }
        return retArr;
    }

    /**
     * Maps the properties to the settings
     *
     * @method     mapProperty
     * @param      {string} propName
     * @param      settingsData
     * @param      functionToApply
     */

    function mapProperty(propName, settingsData, functionToApply) {

        if(settingsData[propName] !== undefined) {
            if(functionToApply) {

                self[propName] = functionToApply(settingsData[propName]);
            }
            else {
                self[propName] = settingsData[propName];
            }
        }

    }

    /**
     * Updates the settings' new values
     *
     * @method     update
     * @param      settingsData
     */

    this.update = function(settingsData) {

        mapProperty("columnGap", settingsData);
        mapProperty("columnMaxWidth", settingsData);
        mapProperty("columnMinWidth", settingsData);
        mapProperty("fontSize", settingsData);
        mapProperty("fontSelection", settingsData);
        mapProperty("mediaOverlaysPreservePlaybackWhenScroll", settingsData);
        mapProperty("mediaOverlaysSkipSkippables", settingsData);
        mapProperty("mediaOverlaysEscapeEscapables", settingsData);
        mapProperty("mediaOverlaysSkippables", settingsData, buildArray);
        mapProperty("mediaOverlaysEscapables", settingsData, buildArray);
        mapProperty("mediaOverlaysEnableClick", settingsData);
        mapProperty("mediaOverlaysRate", settingsData);
        mapProperty("mediaOverlaysVolume", settingsData);
        mapProperty("mediaOverlaysSynchronizationGranularity", settingsData);
        mapProperty("mediaOverlaysAutomaticPageTurn", settingsData);
        mapProperty("scroll", settingsData);
        mapProperty("syntheticSpread", settingsData);
        mapProperty("pageTransition", settingsData);
        mapProperty("enableGPUHardwareAccelerationCSS3D", settingsData);
    };

    this.update(settingsData);
};
    return ViewerSettings;
});
