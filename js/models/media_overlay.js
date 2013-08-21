
ReadiumSDK.Models.MediaOverlay = function() {

    this.smil_models = [];

};

ReadiumSDK.Models.MediaOverlay.fromDTO = function(moDTO) {

    var mo = new ReadiumSDK.Models.MediaOverlay();

    if(!moDTO) {
        console.debug("No media overlay data found");
        return mo;
    }

    var count = moDTO.smil_models.length;
    for(var i = 0; i < count; i++) {
        var smilModel = ReadiumSDK.Models.SmilModel.fromSmilDTO(moDTO.smil_models[i]);
        mo.smil_models.push(smilModel);
    }

    return mo;
};


