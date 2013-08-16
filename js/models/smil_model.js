

/////////////////////////
//SmilNode

ReadiumSDK.Models.Smil.SmilNode = function() {

    this.parent = null;

};

ReadiumSDK.Models.Smil.TimeContainerNode = function() {
    this.id = "";
    this.epubtype = "";
    this.children = undefined;
};

ReadiumSDK.Models.Smil.TimeContainerNode.prototype = new ReadiumSDK.Models.Smil.SmilNode();

//////////////////////////
//MediaNode

ReadiumSDK.Models.Smil.MediaNode = function() {
    this.src = "";
};

ReadiumSDK.Models.Smil.MediaNode.prototype = new ReadiumSDK.Models.Smil.SmilNode();

////////////////////////////

ReadiumSDK.Models.Smil.SeqNode = function() {
    this.children = [];
    this.nodeType = "seq";
    this.textref = "";

};

ReadiumSDK.Models.Smil.SeqNode.prototype = new ReadiumSDK.Models.Smil.TimeContainerNode();

//////////////////////////
//SeqNode

ReadiumSDK.Models.Smil.ParNode = function() {
    this.children = [];
    this.nodeType = "par";
};

ReadiumSDK.Models.Smil.ParNode.prototype = new ReadiumSDK.Models.Smil.TimeContainerNode();

//////////////////////////
//TextNode

ReadiumSDK.Models.Smil.TextNode = function() {

    this.nodeType = "text";
};

ReadiumSDK.Models.Smil.TextNode.prototype = new ReadiumSDK.Models.Smil.MediaNode();

///////////////////////////
//AudioNode

ReadiumSDK.Models.Smil.AudioNode = function() {

    this.nodeType = "audio";
    this.clipBegin = "";
    this.clipEnd = "";

};
ReadiumSDK.Models.Smil.AudioNode.prototype = new ReadiumSDK.Models.Smil.MediaNode();
