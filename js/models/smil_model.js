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
    this.textref = "";
    this.index = undefined;
    this.parent = undefined;
    this.children = undefined;
	
    //root node is a smil model
    this.getSmil = function() {

        var node = this;
        while(node.parent) {
            node = node.parent;
        }

        return node;
    }

    this.isEscapable = function()
    {
        // http://www.idpf.org/epub/30/spec/epub30-mediaoverlays.html#sec-escabaility

        if (this.epubtype === "") return false;

        return (this.epubtype.indexOf("sidebar") >= 0) ||
            (this.epubtype.indexOf("glossary") >= 0);
    }

    this.isSkippable = function()
    {
        // http://www.idpf.org/epub/30/spec/epub30-mediaoverlays.html#sec-skippability

        if (this.epubtype === "") return false;

        return (this.epubtype.indexOf("sidebar") >= 0) ||
            (this.epubtype.indexOf("practice") >= 0) ||
            (this.epubtype.indexOf("marginalia") >= 0) ||
            (this.epubtype.indexOf("annotation") >= 0) ||
            (this.epubtype.indexOf("help") >= 0) ||
            (this.epubtype.indexOf("note") >= 0) ||
            (this.epubtype.indexOf("footnote") >= 0) ||
            (this.epubtype.indexOf("rearnote") >= 0) ||
            (this.epubtype.indexOf("pagebreak") >= 0);
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

};

ReadiumSDK.Models.Smil.SeqNode.prototype = new ReadiumSDK.Models.Smil.TimeContainerNode();

//////////////////////////
//ParNode

ReadiumSDK.Models.Smil.ParNode = function() {
    this.children = [];
    this.nodeType = "par";
    this.text = undefined;
    this.audio = undefined;
    this.element = undefined;
};

ReadiumSDK.Models.Smil.ParNode.prototype = new ReadiumSDK.Models.Smil.TimeContainerNode();

//////////////////////////
//TextNode

ReadiumSDK.Models.Smil.TextNode = function() {

    this.nodeType = "text";
    this.srcFile = "";
    this.srcFragmentId = "";
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

    this.DEBUG = true;
};

ReadiumSDK.Models.SmilModel.fromSmilDTO = function(smilDTO) {

    console.debug("Media Overlay DTO...");

    var indent = 0;
    var getIndent = function()
    {
        var str = "";
        for (var i = 0; i < indent; i++)
        {
            str += "   ";
        }
        return str;
    }

    var smilModel = new ReadiumSDK.Models.SmilModel();
    smilModel.id = smilDTO.id;
    smilModel.href = smilDTO.href;
    smilModel.smilVersion = smilDTO.smilVersion;
    smilModel.duration = smilDTO.duration;

    if (smilModel.DEBUG)
    {
    console.log("JS MO smilVersion=" + smilModel.smilVersion);
    console.log("JS MO id=" + smilModel.id);
    console.log("JS MO href=" + smilModel.href);
    console.log("JS MO duration=" + smilModel.duration);
    }

    var safeCopyProperty = function(property, from, to, isRequired) {

        if(property in from) {

            if( !(property in to) ) {
                console.debug("property " + property + " not declared in smil node " + to.nodeType);
            }

            to[property] = from[property];

            if (smilModel.DEBUG)
            {
            console.log(getIndent() + "JS MO: [" + property + "=" + to[property] + "]");
            }
        }
        else if(isRequired) {
            console.error("Required property " + property + " not found in smil node " + from.nodeType);
        }
    };

    var createNodeFromDTO = function(nodeDTO, parent) {

        var node;

        if(nodeDTO.nodeType == "seq") {

            if (smilModel.DEBUG)
            {
            console.log(getIndent() + "JS MO seq");
            }

            node = new ReadiumSDK.Models.Smil.SeqNode();
            node.parent = parent;
            safeCopyProperty("textref", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            indent++;
            copyChildren(nodeDTO, node);
            indent--;
        }
        else if (nodeDTO.nodeType == "par") {

            if (smilModel.DEBUG)
            {
            console.log(getIndent() + "JS MO par");
            }

            node = new ReadiumSDK.Models.Smil.ParNode();
            node.parent = parent;
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);
            safeCopyProperty("textref", nodeDTO, node);

            indent++;
            copyChildren(nodeDTO, node);
            indent--;
			
            for(var i = 0, count = node.children.length; i < count; i++) {
                var child = node.children[i];

                if(child.nodeType == "text") {
                    node.text = child;
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

            if (smilModel.DEBUG)
            {
            console.log(getIndent() + "JS MO text");
            }

            node = new ReadiumSDK.Models.Smil.TextNode();
            node.parent = parent;
            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("srcFile", nodeDTO, node, true);
            safeCopyProperty("srcFragmentId", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
        }
        else if (nodeDTO.nodeType == "audio") {

            if (smilModel.DEBUG)
            {
            console.log(getIndent() + "JS MO audio");
            }

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
