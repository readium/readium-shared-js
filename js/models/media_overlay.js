//  LauncherOSX
//
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


ReadiumSDK.Models.MediaOverlay = function() {

    this.smil_models = [];
    this.duration = undefined;
    this.narrator = undefined;


    this.getSmilById = function (id) {

        for(var i = 0, count = this.smil_models.length; i < count; i++) {

            var smil = this.smil_models[i];
            if(smil.id === id) {
                return smil;
            }
        }

        return undefined;
    };

    this.getNextSmil = function(smil) {

        var index = this.smil_models.indexOf(smil);
        if(index == -1 || index == this.smil_models.length - 1) {
            return undefined;
        }

        return this.smil_models[index + 1];
    }
};

ReadiumSDK.Models.MediaOverlay.fromDTO = function(moDTO) {

    var mo = new ReadiumSDK.Models.MediaOverlay();

    if(!moDTO) {
        console.debug("No media overlay data found");
        return mo;
    }

    mo.duration = moDTO.duration;
    mo.narrator = moDTO.narrator;

    var count = moDTO.smil_models.length;
    for(var i = 0; i < count; i++) {
        var smilModel = ReadiumSDK.Models.SmilModel.fromSmilDTO(moDTO.smil_models[i]);
        mo.smil_models.push(smilModel);
    }

    return mo;
};


