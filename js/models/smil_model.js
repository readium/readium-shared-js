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



/////////////////////////
//SmilNode

ReadiumSDK.Models.Smil.SmilNode = function() {

};

ReadiumSDK.Models.Smil.TimeContainerNode = function() {
    this.id = "";
    this.epubtype = "";
    this.parent = undefined;
    this.index = undefined;

    //root node is a smil model
    this.getSmil = function() {

        var node = this;
        while(node.parent) {
            node = node.parent;
        }

        return node;
    }

};

ReadiumSDK.Models.Smil.TimeContainerNode.prototype = new ReadiumSDK.Models.Smil.SmilNode();

//////////////////////////
//MediaNode

ReadiumSDK.Models.Smil.MediaNode = function() {
    this.src = "";
};

ReadiumSDK.Models.Smil.MediaNode.prototype = new ReadiumSDK.Models.Smil.SmilNode();

////////////////////////////
//SeqNode

ReadiumSDK.Models.Smil.SeqNode = function() {
    this.children = [];
    this.nodeType = "seq";
    this.textref = "";

};

ReadiumSDK.Models.Smil.SeqNode.prototype = new ReadiumSDK.Models.Smil.TimeContainerNode();

//////////////////////////
//ParNode

ReadiumSDK.Models.Smil.ParNode = function() {
    this.nodeType = "par";
    this.text = undefined;
    this.audio = undefined;
    this.textFragmentSelector = undefined;
    this.element = undefined;
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

    this.isRightAudioPosition = function(source, position) {

        return this.src == source && position >= this.clipBegin && position <= this.clipEnd;
    }

};
ReadiumSDK.Models.Smil.AudioNode.prototype = new ReadiumSDK.Models.Smil.MediaNode();

//////////////////////////////
//SmilModel

ReadiumSDK.Models.SmilModel = function() {

    this.children = []; //collection of seq or par smil nodes
    this.id = undefined; //manifest item id
    this.href = undefined; //href of the .smil source file
    this.duration = undefined;
};

ReadiumSDK.Models.SmilModel.fromSmilDTO = function(smilDTO) {

    var smilModel = new ReadiumSDK.Models.SmilModel();
    smilModel.id = smilDTO.id;
    smilModel.href = smilDTO.href;
    smilModel.smilVersion = smilDTO.smilVersion;
    smilModel.duration = smilDTO.duration;

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

    var createNodeFromDTO = function(nodeDTO, parent) {

        var node;

        if(nodeDTO.nodeType == "seq") {
            node = new ReadiumSDK.Models.Smil.SeqNode();
            node.parent = parent;
            safeCopyProperty("textref", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            copyChildren(nodeDTO, node);
        }
        else if (nodeDTO.nodeType == "par") {
            node = new ReadiumSDK.Models.Smil.ParNode();
            node.parent = parent;
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            for(var i = 0, count = nodeDTO.children.length; i < count; i++) {
                var child = createNodeFromDTO(nodeDTO.children[i], node);

                if(child.nodeType == "text") {
                    node.text = child;
                    node.textFragmentSelector = extractTextFragmentSelectorFromTextNode(child);
                }
                else if(child.nodeType == "audio") {
                    node.audio = child;
                }
                else {
                    console.error("Unexpected smil node type: " + child.nodeType);
                }
            }
        }
        else if (nodeDTO.nodeType == "text") {
            node = new ReadiumSDK.Models.Smil.TextNode();
            node.parent = parent;
            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
        }
        else if (nodeDTO.nodeType == "audio") {
            node = new ReadiumSDK.Models.Smil.AudioNode();
            node.parent = parent;
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

    var extractTextFragmentSelectorFromTextNode = function(textNode) {

        //assumption is that text node is child of the par node and par node is child of seq node: sec.par.text
        var seq = textNode.parent.parent;
        if(!seq || ! seq.textref) {
            console.debug("unexpected smil structure");
            return undefined;
        }

        return textNode.src.substring(seq.textref.length);
    };

    var copyChildren = function(from, to) {

        var count = from.children.length;

        for(var i = 0; i < count; i++) {
            var node = createNodeFromDTO(from.children[i], to);
            node.index = i;
            to.children.push(node);
        }

    };

    copyChildren(smilDTO, smilModel);

    return smilModel;

};
