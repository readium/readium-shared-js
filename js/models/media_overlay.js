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
 * Wrapper of the MediaOverlay object
 *
 * @class Models.MediaOverlay
 * @constructor
 * @param {Models.Package} packageModel  EPUB package
*/

var MediaOverlay = function(packageModel) {

    /**
     * The parent package object
     *
     * @property package
     * @type Models.Package
     */    
    this.package = packageModel;

    /**
     * Checks if a parallel smil node exists at a given timecode. 
     * Returns the first corresponding node found in a smil model found, or undefined.
     *
     * @method     parallelAt
     * @param      {number} timeMilliseconds
     * @return     {Smil.ParNode}  
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
     * Calculates a timecode corresponding to a percent of the total audio duration (the function parameters smilData, par, and milliseconds are objects with a single field using the same name)
     *
     * @method     percentToPosition
     * @param      {Number} percent
     * @param      {Models.SmilModel} smilData (object with a single field using the same name, used as OUT param)
     * @param      {Smil.ParNode} par (object with a single field using the same name, used as OUT param)
     * @param      {Number} milliseconds (object with a single field using the same name, used as OUT param)
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
     * Calculates the accumulated audio duration of each smil overlay
     *
     * @method     durationMilliseconds_Calculated
     * @return     {Number} total duration 
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
     * Returns the smil overlay at the given index
     *
     * @method     smilAt
     * @param      {Number} smilIndex
     * @return     {Models.SmilModel}
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
     * Calculates a percent of the total audio duration corresponding to a timecode
     * 
     * @method     positionToPercent
     * @param      {Number} smilIndex Index of a smil model
     * @param      {Number} parIndex
     * @param      {Number} milliseconds
     * @return     {Number} percent 
     */

    this.positionToPercent = function(smilIndex, parIndex, milliseconds)
    {
           
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
        
        var smilData = this.smil_models[smilIndex];

        var par = smilData.nthParallel(parIndex);
        if (!par)
        {
            return -1.0;
        }

        var offset = smilDataOffset + smilData.clipOffset(par) + milliseconds;
        
        var total = this.durationMilliseconds_Calculated();

        var percent = (offset / total) * 100;
        
        return percent;
      };

    /**
     * Array of smil models {Models.SmilModel}
     *
     * @property smil_models
     * @type Array
     */

    this.smil_models = [];

    /**
     * List of the skippable smil items
     *
     * @property skippables
     * @type Array
     */

    this.skippables = [];
    
    /**
     * List of the escapable smil items
     *
     * @property escapables
     * @type Array
     */

    this.escapables = [];

    /**
     * Duration of the smil audio
     *
     * @property duration
     * @type Number
     */

    this.duration = undefined;

    /**
     * Narrator
     *
     * @property narrator
     * @type String
     */

    this.narrator = undefined;

    /**
     * Author-defined name of the CSS "active class" (applied to the document as a whole)
     *
     * @property activeClass
     * @type String
     */

    this.activeClass = undefined;

    /**
     * Author-defined name of the CSS "playback active class" (applied to a single audio fragment)
     *
     * @property playbackActiveClass
     * @type String
     */

    this.playbackActiveClass = undefined;

    // Debug messages, must be false in production!
    this.DEBUG = false;

    /**
     * Returns the smil model corresponding to a spine item, or undefined if not found.
     *
     * @method     getSmilBySpineItem
     * @param      {Models.SpineItem} spineItem
     * @return     {Models.SmilModel} 
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
     * Returns the next smil model
     *
     * @method     getNextSmil
     * @param      {Models.SmilModel} smil The current smil model
     * @return     {Models.SmilModel} 
     */

    this.getNextSmil = function(smil) {

        var index = this.smil_models.indexOf(smil);
        if(index == -1 || index == this.smil_models.length - 1) {
            return undefined;
        }

        return this.smil_models[index + 1];
    }

    /**
     * Returns the previous smil model
     *
     * @method     getPreviousSmil
     * @param      {Models.SmilModel} smil The current smil model
     * @return     {Models.SmilModel} 
     */

    this.getPreviousSmil = function(smil) {

        var index = this.smil_models.indexOf(smil);
        if(index == -1 || index == 0) {
            return undefined;
        }

        return this.smil_models[index - 1];
    }
};

/**
 * Static MediaOverlay.fromDTO method, returns a clean MediaOverlay object
 *
 * @method MediaOverlay.fromDTO
 * @param {Object} moDTO Media overlay data object (raw JSON, as returned by a parser)
 * @param {Models.Package} packageModel EPUB package object
 * @return {Models.MediaOverlay}
*/

MediaOverlay.fromDTO = function(moDTO, packageModel) {

    var mo = new MediaOverlay(packageModel);

    if(!moDTO) {
        return mo;
    }

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
    }

    count = moDTO.escapables.length;
    if (mo.DEBUG)
        console.debug("Media Overlay ESCAPABLES count: " + count);

    for(var i = 0; i < count; i++) {
        mo.escapables.push(moDTO.escapables[i]);

    }

    return mo;
};

return MediaOverlay;
});


