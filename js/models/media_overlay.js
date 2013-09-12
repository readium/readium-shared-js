
ReadiumSDK.Models.MediaOverlay = function() {

    this.smil_models = [];
    this.duration = undefined;
    this.narrator = undefined;

};

ReadiumSDK.Models.MediaOverlay.fromDTO = function(moDTO) {

    var mo = new ReadiumSDK.Models.MediaOverlay();

    if(!moDTO) {
        console.debug("No media overlay data found");
        return mo;
    }

    mo.duration = moDTO.duration;
    console.debug("Media Overlay Duration (TOTAL): " + mo.duration);

    mo.narrator = moDTO.narrator;
    console.debug("Media Overlay Narrator: " + mo.narrator);

    var count = moDTO.smil_models.length;
    for(var i = 0; i < count; i++) {
        var smilModel = ReadiumSDK.Models.SmilModel.fromSmilDTO(moDTO.smil_models[i]);
        mo.smil_models.push(smilModel);

        console.debug("Media Overlay Duration (SPINE ITEM): " + smilModel.duration);
    }

    return mo;
};


