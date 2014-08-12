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


ReadiumSDK.Models.ViewerSettings = function(settingsData) {

    var self = this;

    this.syntheticSpread = "auto";
    this.fontSize = 100;
    this.columnGap = 20;

    this.mediaOverlaysPreservePlaybackWhenScroll = false;

    this.mediaOverlaysSkipSkippables = false;
    this.mediaOverlaysEscapeEscapables = true;

    this.mediaOverlaysSkippables = [];
    this.mediaOverlaysEscapables = [];
    
    this.mediaOverlaysEnableClick = true;
    this.mediaOverlaysRate = 1;
    this.mediaOverlaysVolume = 100;
    
    this.mediaOverlaysSynchronizationGranularity = "";

    this.mediaOverlaysAutomaticPageTurn = true;

    this.enableGPUHardwareAccelerationCSS3D = true;

    // -1 ==> disable
    // [0...n] ==> index of transition in pre-defined array
    this.pageTransition = -1;
    
    this.scroll = "auto";

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

    this.update = function(settingsData) {

        mapProperty("columnGap", settingsData);
        mapProperty("fontSize", settingsData);
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
