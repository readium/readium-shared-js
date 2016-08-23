//  LauncherOSX
//
//  Created by Boris Schneiderman.
// Modified by Daniel Weck
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

define(["./smil_model"], function(SmilModel) {

/**
 * Contains the informations about media overlays
 *
 * @class Models.media_overlay
 *
 * @constructor
 *
 * @param package
 * @param {boolean} isFixedLayout is fixed or reflowable spine item
 * @return MediaOverlay
*/

var MediaOverlay = function(package) {

    this.package = package;

    /**
     * Checks out where parallel media overlays are
     *
     * @method     parallelAt
     * @param      {number} timeMilliseconds
     * @return     undefined   
     */

    this.parallelAt = function(timeMilliseconds)
    {
        var offset = 0;
        
        for (var i = 0; i < this.smil_models.length; i++)
        {
            var smilData = this.smil_models[i];
            
            var timeAdjusted = timeMilliseconds - offset;

            var para = smilData.parallelAt(timeAdjusted);
            if (para)
            {
                return para;
            }

            offset += smilData.durationMilliseconds_Calculated();
        }

        return undefined;
    };
    
    /**
     * Calculates the position of the smil data in percent
     *
     * @method     parallelAt
     * @param      {number} percent
     * @param      {object} smilData
     * @param      {container} par
     * @param      {number} timeMilliseconds 
     */

    this.percentToPosition = function(percent, smilData, par, milliseconds)
    {
        if (percent < 0.0 || percent > 100.0)
        {
            percent = 0.0;
        }
            
        var total = this.durationMilliseconds_Calculated();

        var timeMs = total * (percent / 100.0);

        par.par = this.parallelAt(timeMs);
        if (!par.par)
        {
            return;
        }
        
        var smilDataPar = par.par.getSmil();
        if (!smilDataPar)
        {
            return;
        }
        
        var smilDataOffset = 0;
        
        for (var i = 0; i < this.smil_models.length; i++)
        {
            smilData.smilData = this.smil_models[i];
            if (smilData.smilData == smilDataPar)
            {
                break;
            }
            smilDataOffset += smilData.smilData.durationMilliseconds_Calculated();
        }

        milliseconds.milliseconds = timeMs - (smilDataOffset + smilData.smilData.clipOffset(par.par));
    };

    /**
     * Estimates the duration of the smil files
     *
     * @method     durationMilliseconds_Calculated
     * @return     {number} total
     */

    this.durationMilliseconds_Calculated = function()
    {
        var total = 0;
        
        for (var i = 0; i < this.smil_models.length; i++)
        {
            var smilData = this.smil_models[i];

            total += smilData.durationMilliseconds_Calculated();
        }
        
        return total;
    };
    
    /**
     * Locates the smilIndex
     *
     * @method     smilAt
     * @return     this.smil_models[smilIndex]
     */

    this.smilAt = function(smilIndex)
    {
        if (smilIndex < 0 || smilIndex >= this.smil_models.length)
        {
            return undefined;
        }
        
        return this.smil_models[smilIndex];
    }
    
    /**
     * Calculates the position of the smil data in percent
     *
     * @method     parallelAt
     * @param      {number} smilIndex
     * @param      {???} parIndex
     * @param      {number} milliseconds
     * @return     {number} percent 
     */

    this.positionToPercent = function(smilIndex, parIndex, milliseconds)
    {
// console.log(">>>>>>>>>>");
// console.log(milliseconds);
// console.log(smilIndex);
// console.log(parIndex);
// console.log("-------");
                
        if (smilIndex >= this.smil_models.length)
        {
            return -1.0;
        }

        var smilDataOffset = 0;
        for (var i = 0; i < smilIndex; i++)
        {
            var sd = this.smil_models[i];
            smilDataOffset += sd.durationMilliseconds_Calculated();
        }

//console.log(smilDataOffset);
        
        var smilData = this.smil_models[smilIndex];

        var par = smilData.nthParallel(parIndex);
        if (!par)
        {
            return -1.0;
        }

        var offset = smilDataOffset + smilData.clipOffset(par) + milliseconds;

//console.log(offset);
        
        var total = this.durationMilliseconds_Calculated();

///console.log(total);

        var percent = (offset / total) * 100;

//console.log("<<<<<<<<<<< " + percent);
        
        return percent;
      };

    /**
     * List of the smil models
     *
     * @property smil_models
     * @type array
     */

    this.smil_models = [];

    /**
     * List of the skippable smil files
     *
     * @property skippables
     * @type array
     */

    this.skippables = [];
    
    /**
     * List of the escapable smil models
     *
     * @property escapables
     * @type array
     */

    this.escapables = [];

    /**
     * Duration of the smil files
     *
     * @property duration
     * @type undefined
     */

    this.duration = undefined;

    /**
     * Narrator?
     *
     * @property narrator
     * @type undefined
     */

    this.narrator = undefined;

    /**
     * Is the class active?
     *
     * @property activeClass
     * @type undefined
     */

    this.activeClass = undefined;

    /**
     * is the playback active?
     *
     * @property playbackActiveClass
     * @type undefined
     */

    this.playbackActiveClass = undefined;

    this.DEBUG = false;

    /**
     * Gets smil files by the spine item
     *
     * @method     getSmilBySpineItem
     * @param      {object} spineItem
     * @return     {number} undefined
     */

    this.getSmilBySpineItem = function (spineItem) {
        if (!spineItem) return undefined;

        for(var i = 0, count = this.smil_models.length; i < count; i++)
        {
            var smil = this.smil_models[i];
            if(smil.spineItemId === spineItem.idref) {
                if (spineItem.media_overlay_id !== smil.id)
                {
                    console.error("SMIL INCORRECT ID?? " + spineItem.media_overlay_id + " /// " + smil.id);
                }
                return smil;
            }
        }

        return undefined;
    };

    /*
    this.getSmilById = function (id) {

        for(var i = 0, count = this.smil_models.length; i < count; i++) {

            var smil = this.smil_models[i];
            if(smil.id === id) {
                return smil;
            }
        }

        return undefined;
    };
    */

    /**
     * Gets the next smil file
     *
     * @method     getNextSmil
     * @param      {object} smil
     * @return     this.smil_models[index + 1];
     */

    this.getNextSmil = function(smil) {

        var index = this.smil_models.indexOf(smil);
        if(index == -1 || index == this.smil_models.length - 1) {
            return undefined;
        }

        return this.smil_models[index + 1];
    }

    /**
     * Gets the previous smil file
     *
     * @method     getPreviousSmil
     * @param      {object} smil
     * @return     this.smil_models[index - 1];
     */

    this.getPreviousSmil = function(smil) {

        var index = this.smil_models.indexOf(smil);
        if(index == -1 || index == 0) {
            return undefined;
        }

        return this.smil_models[index - 1];
    }
};

MediaOverlay.fromDTO = function(moDTO, pack) {

    var mo = new MediaOverlay(pack);

    if(!moDTO) {
        console.debug("No Media Overlay.");
        return mo;
    }

    // if (mo.DEBUG)
    //     console.debug(JSON.stringify(moDTO));
        
    mo.duration = moDTO.duration;
    if (mo.duration && mo.duration.length && mo.duration.length > 0)
    {
        console.error("SMIL total duration is string, parsing float... (" + mo.duration + ")");
        mo.duration = parseFloat(mo.duration);
    }
    if (mo.DEBUG)
        console.debug("Media Overlay Duration (TOTAL): " + mo.duration);

    mo.narrator = moDTO.narrator;
    if (mo.DEBUG)
        console.debug("Media Overlay Narrator: " + mo.narrator);

    mo.activeClass = moDTO.activeClass;
    if (mo.DEBUG)
        console.debug("Media Overlay Active-Class: " + mo.activeClass);

    mo.playbackActiveClass = moDTO.playbackActiveClass;
    if (mo.DEBUG)
        console.debug("Media Overlay Playback-Active-Class: " + mo.playbackActiveClass);

    var count = moDTO.smil_models.length;
    if (mo.DEBUG)
        console.debug("Media Overlay SMIL count: " + count);

    for(var i = 0; i < count; i++) {
        var smilModel = SmilModel.fromSmilDTO(moDTO.smil_models[i], mo);
        mo.smil_models.push(smilModel);

        if (mo.DEBUG)
            console.debug("Media Overlay Duration (SPINE ITEM): " + smilModel.duration);
    }

    count = moDTO.skippables.length;
    if (mo.DEBUG)
        console.debug("Media Overlay SKIPPABLES count: " + count);

    for(var i = 0; i < count; i++) {
        mo.skippables.push(moDTO.skippables[i]);

        //if (mo.DEBUG)
        //    console.debug("Media Overlay SKIPPABLE: " + mo.skippables[i]);
    }

    count = moDTO.escapables.length;
    if (mo.DEBUG)
        console.debug("Media Overlay ESCAPABLES count: " + count);

    for(var i = 0; i < count; i++) {
        mo.escapables.push(moDTO.escapables[i]);

        //if (mo.DEBUG)
        //    console.debug("Media Overlay ESCAPABLE: " + mo.escapables[i]);
    }

    return mo;
};

return MediaOverlay;
});


