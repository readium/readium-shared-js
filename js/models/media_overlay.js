
ReadiumSDK.Models.MediaOverlay = function() {

    this.children = []; //collection of seq or par smil nodes
    this.id = undefined; //manifest item id
    this.href = undefined; //href of the .smil source file

};

ReadiumSDK.Models.MediaOverlay.fromSmilDTO = function(smilDTO) {

    var mediaOverlay = new ReadiumSDK.Models.MediaOverlay();
    mediaOverlay.id = smilDTO.id;
    mediaOverlay.href = smilDTO.href;
    mediaOverlay.smilVersion = smilDTO.smilVersion;

    var safeCopyProperty = function(property, from, to, isRequired) {

        if(property in from) {

            if( !(property in to) ) {
                console.debug("property " + property + " not declared in smil node " + to.nodeType);
            }

            to[property] = from[property];
        }
        else if(isRequired) {
            console.error("Required property " + property + " not found in smil node " + from.nodeType);
        }
    };

    var createNodeFromDTO = function(nodeDTO) {

        var node;

        if(nodeDTO.nodeType == "seq") {
            node = new ReadiumSDK.Models.Smil.SeqNode();
            safeCopyProperty("textref", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            copyChildren(nodeDTO, node);
        }
        else if (nodeDTO.nodeType == "par") {
            node = new ReadiumSDK.Models.Smil.ParNode();
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            copyChildren(nodeDTO, node);
        }
        else if (nodeDTO.nodeType == "text") {
            node = new ReadiumSDK.Models.Smil.TextNode();
            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
        }
        else if (nodeDTO.nodeType == "audio") {
            node = new ReadiumSDK.Models.Smil.AudioNode();
            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("clipBegin", nodeDTO, node);
            safeCopyProperty("clipEnd", nodeDTO, node);
        }
        else {
            console.error("Unexpected smil node type: " + nodeDTO.nodeType);
            return undefined;
        }

        return node;

    };

    var copyChildren = function(from, to) {

        var count = from.children.length;

        for(var i = 0; i < count; i++) {
            var node = createNodeFromDTO(from.children[i]);
            node.parent = to;
            to.children.push(node);
        }

    };

    copyChildren(smilDTO, mediaOverlay);

    return mediaOverlay;

};
