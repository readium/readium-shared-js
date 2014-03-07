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


ReadiumSDK.Models.ViewerSettings = function(settingsData) {

    var self = this;
    this.isSyntheticSpread = true;
    this.fontSize = 100;
    this.columnGap = 20;
    this.mediaOverlaysSkipSkippables = false;
    this.mediaOverlaysEscapeEscapables = true;

    this.mediaOverlaysSkippables = [];
    this.mediaOverlaysEscapables = [];
    
    this.mediaOverlaysEnableClick = true;
    this.mediaOverlaysRate = 1;
    this.mediaOverlaysVolume = 100;
    
    this.mediaOverlaysSynchronizationGranularity = "";
    
    this.isScrollViewDoc = false;
    this.isScrollViewContinuous = false;

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

        mapProperty("isSyntheticSpread", settingsData);
        mapProperty("columnGap", settingsData);
        mapProperty("fontSize", settingsData);
        mapProperty("mediaOverlaysSkipSkippables", settingsData);
        mapProperty("mediaOverlaysEscapeEscapables", settingsData);
        mapProperty("mediaOverlaysSkippables", settingsData, buildArray);
        mapProperty("mediaOverlaysEscapables", settingsData, buildArray);
        mapProperty("mediaOverlaysEnableClick", settingsData);
        mapProperty("mediaOverlaysRate", settingsData);
        mapProperty("mediaOverlaysVolume", settingsData);
        mapProperty("mediaOverlaysSynchronizationGranularity", settingsData);
        mapProperty("isScrollViewDoc", settingsData);
        mapProperty("isScrollViewContinuous", settingsData);
    };

    this.update(settingsData);
};