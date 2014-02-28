//  LauncherOSX
//
//  Created by Boris Schneiderman.
// Modified by Daniel Weck
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

ReadiumSDK.Models.Smil.SmilNode = function(parent) {

    this.parent = parent;
    
    this.id = "";
    
    //root node is a smil model
    this.getSmil = function() {

        var node = this;
        while(node.parent) {
            node = node.parent;
        }

        return node;
    };
    
    this.hasAncestor = function(node)
    {
        var parent = this.parent;
        while(parent)
        {
            if (parent == node)
            {
                return true;
            }

            parent = parent.parent;
        }

        return false;
    };
};

ReadiumSDK.Models.Smil.TimeContainerNode = function(parent) {

    this.parent = parent;
    
    this.children = undefined;
    this.index = undefined;
    
    this.epubtype = "";

    this.isEscapable = function(userEscapables)
    {
        if (this.epubtype === "")
        {
            return false;
        }

        var smilModel = this.getSmil();
        if (!smilModel.mo)
        {
            return false;
        }

        var arr = smilModel.mo.escapables;
        if (userEscapables.length > 0)
        {
            arr = userEscapables;
        }

        for (var i = 0; i < arr.length; i++)
        {
            if (this.epubtype.indexOf(arr[i]) >= 0)
            {
                return true;
            }
        }

        return false;
    };

    this.isSkippable = function(userSkippables)
    {
        if (this.epubtype === "")
        {
            return false;
        }
        
        var smilModel = this.getSmil();
        if (!smilModel.mo)
        {
            return false;
        }

        var arr = smilModel.mo.skippables;
        if (userSkippables.length > 0)
        {
            arr = userSkippables;
        }

        for (var i = 0; i < arr.length; i++)
        {
            if (this.epubtype.indexOf(arr[i]) >= 0)
            {
                return true;
            }
        }

        return false;
    };
};

ReadiumSDK.Models.Smil.TimeContainerNode.prototype = new ReadiumSDK.Models.Smil.SmilNode();

//////////////////////////
//MediaNode

ReadiumSDK.Models.Smil.MediaNode = function(parent) {

    this.parent = parent;
    
    this.src = "";
};

ReadiumSDK.Models.Smil.MediaNode.prototype = new ReadiumSDK.Models.Smil.SmilNode();

////////////////////////////
//SeqNode

ReadiumSDK.Models.Smil.SeqNode = function(parent) {

    this.parent = parent;
    
    this.children = [];
    this.nodeType = "seq";
    this.textref = "";
    
    this.durationMilliseconds = function()
    {
        var smilData = this.getSmil();
            
        var total = 0;
        
        for (var i = 0; i < this.children.length; i++)
        {
            var container = this.children[i];
            if (container.nodeType === "par")
            {
                if (!container.audio)
                {
                    continue;
                }
                if (container.text && (!container.text.manifestItemId || container.text.manifestItemId != smilData.spineItemId))
                {
// console.log(container.text);
// console.log(smilData.spineItemId);
                    continue;
                }
                
                var clipDur = container.audio.clipDurationMilliseconds();
                total += clipDur;
            }
            else if (container.nodeType === "seq")
            {
                total += container.durationMilliseconds();
            }
        }

        return total;
    };
    
    this.clipOffset = function(offset, par)
    {
        var smilData = this.getSmil();
        
        for (var i = 0; i < this.children.length; i++)
        {
            var container = this.children[i];
            if (container.nodeType === "par")
            {
                if (container == par)
                {
                    return true;
                }

                if (!container.audio)
                {
                    continue;
                }

                if (container.text && (!container.text.manifestItemId || container.text.manifestItemId != smilData.spineItemId))
                {
                    continue;
                }

                var clipDur = container.audio.clipDurationMilliseconds();
                offset.offset += clipDur;
            }
            else if (container.nodeType === "seq")
            {
                var found = container.clipOffset(offset, par);
                if (found)
                {
                    return true;
                }
            }
        }

        return false;
    };

    this.parallelAt = function(timeMilliseconds)
    {
        var smilData = this.getSmil();
        
        var offset = 0;

        for (var i = 0; i < this.children.length; i++)
        {
            var timeAdjusted = timeMilliseconds - offset;

            var container = this.children[i];
            
            if (container.nodeType === "par")
            {
                if (!container.audio)
                {
                    continue;
                }

                if (container.text && (!container.text.manifestItemId || container.text.manifestItemId != smilData.spineItemId))
                {
                    continue;
                }

                var clipDur = container.audio.clipDurationMilliseconds();

                if (clipDur > 0 && timeAdjusted <= clipDur)
                {
                    return container;
                }

                offset += clipDur;
            }
            else if (container.nodeType === "seq")
            {
                var para = container.parallelAt(timeAdjusted);
                if (para)
                {
                    return para;
                }

                offset += container.durationMilliseconds();
            }
        }

        return undefined;
    };

    this.nthParallel = function(index, count)
    {
        for (var i = 0; i < this.children.length; i++)
        {
            var container = this.children[i];
            
            if (container.nodeType === "par")
            {
                count.count++;

                if (count.count == index)
                {
                    return container;
                }
            }
            else if (container.nodeType === "seq")
            {
                var para = container.nthParallel(index, count);
                if (para)
                {
                    return para;
                }
            }
        }

        return undefined;
    };
    
};

ReadiumSDK.Models.Smil.SeqNode.prototype = new ReadiumSDK.Models.Smil.TimeContainerNode();

//////////////////////////
//ParNode

ReadiumSDK.Models.Smil.ParNode = function(parent) {

    this.parent = parent;
    
    this.children = [];
    this.nodeType = "par";
    this.text = undefined;
    this.audio = undefined;
    this.element = undefined;
    

    this.getFirstSeqAncestorWithEpubType = function(epubtype) {
        if (!epubtype) return undefined;
        
        var parent = this.parent;
        while (parent)
        {
            if (parent.epubtype && parent.epubtype.indexOf(epubtype) >= 0)
            {
                return parent; // assert(parent.nodeType === "seq")
            }
            
            parent = parent.parent;
        }
        
        return undefined;
    };
};

ReadiumSDK.Models.Smil.ParNode.prototype = new ReadiumSDK.Models.Smil.TimeContainerNode();

//////////////////////////
//TextNode

ReadiumSDK.Models.Smil.TextNode = function(parent) {

    this.parent = parent;

    this.nodeType = "text";
    this.srcFile = "";
    this.srcFragmentId = "";
    
    
    this.manifestItemId = undefined;
    this.updateMediaManifestItemId = function()
    {
        var smilData = this.getSmil();
        
        if (!smilData.href || !smilData.href.length)
        {
            return; // Blank MO page placeholder, no real SMIL
        }
        
        // var srcParts = item.src.split('#');
//         item.srcFile = srcParts[0];
//         item.srcFragmentId = (srcParts.length === 2) ? srcParts[1] : "";
        
        var src = this.srcFile ? this.srcFile : this.src;
// console.log("src: " + src);
// console.log("smilData.href: " + smilData.href);
        var ref = ReadiumSDK.Helpers.ResolveContentRef(src, smilData.href);
//console.log("ref: " + ref);
        var full = smilData.mo.package.resolveRelativeUrlMO(ref);
// console.log("full: " + full);
// console.log("---");
        for (var j = 0; j < smilData.mo.package.spine.items.length; j++)
        {
            var item = smilData.mo.package.spine.items[j];
//console.log("item.href: " + item.href);
            var url = smilData.mo.package.resolveRelativeUrl(item.href);
//console.log("url: " + url);
            if (url === full)
            {
//console.error("FOUND: " + item.idref);
                this.manifestItemId = item.idref;
                return;
            }
        }
        
        console.error("Cannot set the Media ManifestItemId? " + this.src + " && " + smilData.href);
        
//        throw "BREAK";
    };
    
};

ReadiumSDK.Models.Smil.TextNode.prototype = new ReadiumSDK.Models.Smil.MediaNode();

///////////////////////////
//AudioNode

ReadiumSDK.Models.Smil.AudioNode = function(parent) {

    this.parent = parent;

    this.nodeType = "audio";

    this.clipBegin = 0;

    this.MAX = 1234567890.1; //Number.MAX_VALUE - 0.1; //Infinity;
    this.clipEnd = this.MAX;
    

    this.clipDurationMilliseconds = function()
    {
        var _clipBeginMilliseconds = this.clipBegin * 1000;
        var _clipEndMilliseconds = this.clipEnd * 1000;
        
        if (this.clipEnd >= this.MAX || _clipEndMilliseconds <= _clipBeginMilliseconds)
        {
            return 0;
        }

        return _clipEndMilliseconds - _clipBeginMilliseconds;
    };  
};

ReadiumSDK.Models.Smil.AudioNode.prototype = new ReadiumSDK.Models.Smil.MediaNode();

//////////////////////////////
//SmilModel

ReadiumSDK.Models.SmilModel = function() {

    this.parent = undefined;
    
    
    
    this.children = []; //collection of seq or par smil nodes
    this.id = undefined; //manifest item id
    this.href = undefined; //href of the .smil source file
    this.duration = undefined;
    this.mo = undefined;
    
    this.parallelAt = function(timeMilliseconds)
    {
        return this.children[0].parallelAt(timeMilliseconds);
    };

    this.nthParallel = function(index)
    {
        var count = {count: -1};
        return this.children[0].nthParallel(index, count);
    };

    this.clipOffset = function(par)
    {
        var offset = {offset: 0};
        if (this.children[0].clipOffset(offset, par))
        {
            return offset.offset;
        }

        return 0;
    };
    
    this.durationMilliseconds_Calculated = function()
    {
        return this.children[0].durationMilliseconds();
    };
};

ReadiumSDK.Models.SmilModel.fromSmilDTO = function(smilDTO, mo) {

    if (mo.DEBUG)
    {
        console.debug("Media Overlay DTO import...");
    }

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
    smilModel.spineItemId = smilDTO.spineItemId;
    smilModel.href = smilDTO.href;
    
    smilModel.smilVersion = smilDTO.smilVersion;
    
    smilModel.duration = smilDTO.duration;
    if (smilModel.duration && smilModel.duration.length && smilModel.duration.length > 0)
    {
        console.error("SMIL duration is string, parsing float... (" + smilModel.duration + ")");
        smilModel.duration = parseFloat(smilModel.duration);
    }
    
    smilModel.mo = mo; //ReadiumSDK.Models.MediaOverlay

    if (smilModel.mo.DEBUG)
    {
        console.log("JS MO smilVersion=" + smilModel.smilVersion);
        console.log("JS MO id=" + smilModel.id);
        console.log("JS MO spineItemId=" + smilModel.spineItemId);
        console.log("JS MO href=" + smilModel.href);
        console.log("JS MO duration=" + smilModel.duration);
    }

    var safeCopyProperty = function(property, from, to, isRequired) {

        if((property in from))
        { // && from[property] !== ""

            if( !(property in to) ) {
                console.debug("property " + property + " not declared in smil node " + to.nodeType);
            }

            to[property] = from[property];

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO: [" + property + "=" + to[property] + "]");
            }
        }
        else if(isRequired) {
            console.log("Required property " + property + " not found in smil node " + from.nodeType);
        }
    };

    var createNodeFromDTO = function(nodeDTO, parent) {

        var node;

        if(nodeDTO.nodeType == "seq") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO seq");
            }

            node = new ReadiumSDK.Models.Smil.SeqNode(parent);

            safeCopyProperty("textref", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            indent++;
            copyChildren(nodeDTO, node);
            indent--;
        }
        else if (nodeDTO.nodeType == "par") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO par");
            }

            node = new ReadiumSDK.Models.Smil.ParNode(parent);

            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

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

////////////////
var forceTTS = false; // for testing only!
////////////////

            if (forceTTS || !node.audio)
            {
                // synthetic speech (playback using TTS engine), or embedded media, or blank page
                var fakeAudio = new ReadiumSDK.Models.Smil.AudioNode(node);

                fakeAudio.clipBegin = 0;
                fakeAudio.clipEnd = fakeAudio.MAX;
                fakeAudio.src = undefined;

                node.audio = fakeAudio;
            }
        }
        else if (nodeDTO.nodeType == "text") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO text");
            }

            node = new ReadiumSDK.Models.Smil.TextNode(parent);

            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("srcFile", nodeDTO, node, true);
            safeCopyProperty("srcFragmentId", nodeDTO, node, false);
            safeCopyProperty("id", nodeDTO, node);
            
            node.updateMediaManifestItemId();
        }
        else if (nodeDTO.nodeType == "audio") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO audio");
            }

            node = new ReadiumSDK.Models.Smil.AudioNode(parent);

            safeCopyProperty("src", nodeDTO, node, true);
            safeCopyProperty("id", nodeDTO, node);

            safeCopyProperty("clipBegin", nodeDTO, node);
            if (node.clipBegin && node.clipBegin.length && node.clipBegin.length > 0)
            {
                console.error("SMIL clipBegin is string, parsing float... (" + node.clipBegin + ")");
                node.clipBegin = parseFloat(node.clipBegin);
            }
            if (node.clipBegin < 0)
            {
                if (smilModel.mo.DEBUG)
                {
                    console.log(getIndent() + "JS MO clipBegin adjusted to ZERO");
                }
                node.clipBegin = 0;
            }

            safeCopyProperty("clipEnd", nodeDTO, node);
            if (node.clipEnd && node.clipEnd.length && node.clipEnd.length > 0)
            {
                console.error("SMIL clipEnd is string, parsing float... (" + node.clipEnd + ")");
                node.clipEnd = parseFloat(node.clipEnd);
            }
            if (node.clipEnd <= node.clipBegin)
            {
                if (smilModel.mo.DEBUG)
                {
                    console.log(getIndent() + "JS MO clipEnd adjusted to MAX");
                }
                node.clipEnd = node.MAX;
            }
            
            //node.updateMediaManifestItemId(); ONLY XHTML SPINE ITEMS 
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
