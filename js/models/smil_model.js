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
define (["../helpers"], function(Helpers) {

var Smil = {};

/**
 * Wrapper of a SmilNode object
 *
 * @class      Smil.SmilNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent node of the new smil node
 */

Smil.SmilNode = function(parent) {

    this.parent = parent;
    
    this.id = "";
    
    /**
     * Finds the smil model object, i.e. the root node of the smil tree
     *
     * @method     getSmil
     * @return     {Smil.SmilModel} node The smil model object
     */    
    this.getSmil = function() {

        var node = this;
        while(node.parent) {
            node = node.parent;
        }

        return node;
    };
    /**
     * Checks if the node given as a parameter is an ancestor of the current node 
     *
     * @method     hasAncestor
     * @param      {Smil.SmilNode} node The checked node
     * @return     {Bool} true if the parameter node is an ancestor
     */
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

////////////////////////////
//TimeContainerNode

/**
 * Wrapper of a time container (smil) node 
 *
 * @class      Smil.TimeContainerNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.TimeContainerNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */
    
    this.parent = parent;
    
    /**
     * The children nodes
     *
     * @property children
     * @type undefined
     */

    this.children = undefined;
    
    /**
     * The index
     *
     * @property index
     * @type undefined
     */

    this.index = undefined;
    
    /**
     * The epub type
     *
     * @property epubtype
     * @type String
     */

    this.epubtype = "";


    /**
     * Checks if the smil node is escapable.
     *
     * @method     isEscapable
     * @param      {Array} userEscapables
     * @return     {Bool} true if the smil node is escapable 
     */

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

    /**
     * Checks is the smil node is skippable
     *
     * @method     isSkippables
     * @param      {Array} userSkippables
     * @return     {Bool} true s the smil node is skippable
     */

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

Smil.TimeContainerNode.prototype = new Smil.SmilNode();


////////////////////////////
//MediaNode

/**
 * Looks for the media parent folder
 *
 * @class      Smil.MediaNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.MediaNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;
    
    /**
     * The source locator
     *
     * @property src
     * @type String
     */

    this.src = "";
};

Smil.MediaNode.prototype = new Smil.SmilNode();

////////////////////////////
//SeqNode

/**
 * Node Sequence
 *
 * @class      Smil.SeqNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.SeqNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;

    /**
     * The children nodes
     *
     * @property children
     * @type Array
     */

    this.children = [];

    /**
     * The node type (seq)
     *
     * @property nodeType
     * @type String
     */

    this.nodeType = "seq";

    /**
     * The text reference
     *
     * @property textref
     * @type String
     */

    this.textref = "";
    
    /**
     * Calculates the total duration of audio clips 
     *
     * @method     durationMilliseconds
     * @return     {Number} 
     */

    this.durationMilliseconds = function()
    {
        // returns the smil object
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
    
   /**
     * Looks for a given parallel node in the current sequence node and its children.
     *  Returns true if found. 
     *
     * @method     clipOffset
     * @param      {Number} offset
     * @param      {Smil.ParNode} par The reference parallel smil node
     * @return     {Boolean} 
     */ 

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


   /**
     * Checks if a parallel smil node exists at a given timecode in the smil sequence node. 
     * Returns the node or undefined.
     *
     * @method     parallelAt
     * @param      {Number} timeMilliseconds
     * @return     {Smil.ParNode}
     */ 

    this.parallelAt = function(timeMilliseconds)
    {
        var smilData = this.getSmil();
        
        var offset = 0;

        for (var i = 0; i < this.children.length; i++)
        {
            var timeAdjusted = timeMilliseconds - offset;

            var container = this.children[i];
            
            // looks for a winning parallel smil node in a child parallel smil node
            if (container.nodeType === "par")
            {
                // the parallel node must contain an audio clip and a text node with a proper id
                if (!container.audio)
                {
                    continue;
                }

                if (container.text && (!container.text.manifestItemId || container.text.manifestItemId != smilData.spineItemId))
                {
                    continue;
                }
                // and the timecode given as a parameter must correspond to the audio clip time range  
                var clipDur = container.audio.clipDurationMilliseconds();

                if (clipDur > 0 && timeAdjusted <= clipDur)
                {
                    return container;
                }

                offset += clipDur;
            }
            // looks for a winning parallel smil node in a child sequence smil node
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

    /**
     * Looks for the nth parallel smil node in the current sequence node
     *
     * @method     nthParallel
     * @param      {Number} index
     * @param      {Number} count
     * @return     {Smil.ParNode} 
     */    

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

Smil.SeqNode.prototype = new Smil.TimeContainerNode();

//////////////////////////
//ParNode

/**
 * Returns the parent of the SMIL file by checking out the nodes
 *
 * @class      Smil.ParNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node

 */

Smil.ParNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;
    
    /**
     * The children files
     *
     * @property children
     * @type Array
     */

    this.children = [];
    
    /**
     * The Node Type
     *
     * @property nodeType which is equal to "par" here
     * @type String
     */

    this.nodeType = "par";

    /**
     * Some text
     *
     * @property text 
     * @type String
     */
    this.text = undefined;
    
    /**
     * Some audio
     *
     * @property audio 
     * @type unknown
     */
    
    this.audio = undefined;

    /**
     * An element of the epub archive
     *
     * @property element 
     * @type unknown
     */
    
    this.element = undefined;    

    /**
     * Gets the first ancestor sequence with a given epub type, or undefined.
     *
     * @method     getFirstSeqAncestorWithEpubType
     * @param      {String} epubtype
     * @param      {Boolean} includeSelf
     * @return     {Smil.SmilNode} 
     */       

    this.getFirstSeqAncestorWithEpubType = function(epubtype, includeSelf) {
        if (!epubtype) return undefined;
        
        var parent = includeSelf ? this : this.parent;
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

Smil.ParNode.prototype = new Smil.TimeContainerNode();

//////////////////////////
//TextNode

/**
 * Node Sequence
 *
 * @class      Smil.TextNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node

 */

Smil.TextNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;

    /**
     * The node type, set to "text"
     *
     * @property nodeType
     * @type String 
     */

    this.nodeType = "text";

    /**
     * The source file
     *
     * @property srcFile
     * @type String
     */
    
    this.srcFile = "";
    
    /**
     * A fragment of the source file ID
     *
     * @property srcFragmentId
     * @type String
     */

    this.srcFragmentId = "";
    
    /**
     * The ID of the manifest for the current item
     *
     * @property manifestItemId
     * @type Number
     */
    
    this.manifestItemId = undefined;
    
    /**
     * Updates the ID of the manifest for the current media
     *
     * @method     updateMediaManifestItemId 
     */  

    this.updateMediaManifestItemId = function() {

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
        var ref = Helpers.ResolveContentRef(src, smilData.href);
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

Smil.TextNode.prototype = new Smil.MediaNode();

///////////////////////////
//AudioNode

/**
 * Looks for the media parent folder
 *
 * @class      Smil.AudioNode
 * @constructor
 * @param      {Smil.SmilNode} parent Parent smil node
 */

Smil.AudioNode = function(parent) {

    /**
     * The parent node
     *
     * @property parent
     * @type Smil.SmilNode
     */

    this.parent = parent;

    /**
     * The node type, set to "audio"
     *
     * @property nodeType 
     * @type String
     */

    this.nodeType = "audio";

    /**
     * The clip begin timecode
     *
     * @property clipBegin 
     * @type Number
     */

    this.clipBegin = 0;

    /**
     * The max duration of the audio clip which is almost infinite
     *
     * @property MAX 
     * @type Number
     */

    this.MAX = 1234567890.1; //Number.MAX_VALUE - 0.1; //Infinity;
    
    /**
     * The clip end timecode
     *
     * @property clipEnd
     * @type Number
     */

    this.clipEnd = this.MAX;
    
    /**
     * Returns the duration of the audio clip
     *
     * @method     clipDurationMilliseconds
     * @return     {Number} 
     */  

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

Smil.AudioNode.prototype = new Smil.MediaNode();

//////////////////////////////
//SmilModel

/**
 * Wrapper of the SmilModel object
 *
 * @class      Models.SmilModel
 * @constructor
 */

var SmilModel = function() {

    /**
     * The parent object
     *
     * @property parent
     * @type any
     */

    this.parent = undefined;
    
    /**
     * The smil model children, i.e. a collection of seq or par smil nodes
     *
     * @property children
     * @type Array
     */
    
    this.children = []; 
    
    /**
     * The manifest item ID
     *
     * @property id
     * @type Number
     */

    this.id = undefined; 

    /**
     * The href of the .smil source file
     *
     * @property href
     * @type String
     */

    this.href = undefined; 
    
    /**
     * The duration of the audio clips
     *
     * @property duration
     * @type Number
     */

    this.duration = undefined;

    /**
     * The media overlay object
     *
     * @property mo
     * @type Models.MediaOverlay
     */

    this.mo = undefined;

    /**
     * Checks if a parallel smil node exists at a given timecode in the smil model. 
     * Returns the node or undefined.
     *
     * @method     parallelAt
     * @param      {Number} timeMillisecond 
     * @return     {Smil.ParNode}
     */
    
    this.parallelAt = function(timeMilliseconds)
    {
        return this.children[0].parallelAt(timeMilliseconds);
    };

    /**
     * Looks for the nth parallel smil node in the current smil model
     *
     * @method     nthParallel
     * @param      {Number} index
     * @return     {Smil.ParNode} 
     */

    this.nthParallel = function(index)
    {
        var count = {count: -1};
        return this.children[0].nthParallel(index, count);
    };

    /**
     * Looks for a given parallel node in the current smil model.
     *  Returns its offset if found. 
     *
     * @method     clipOffset
     * @param      {Smil.ParNode} par The reference parallel smil node
     * @return     {Number} offset of the audio clip
     */

    this.clipOffset = function(par)
    {
        var offset = {offset: 0};
        if (this.children[0].clipOffset(offset, par))
        {
            return offset.offset;
        }

        return 0;
    };

    /**
     * Calculates the total audio duration of the smil model
     *
     * @method     durationMilliseconds_Calculated    
     * @return     {Number}
     */

    this.durationMilliseconds_Calculated = function()
    {
        return this.children[0].durationMilliseconds();
    };
    

    var _epubtypeSyncs = [];
    // 
    // this.clearSyncs = function()
    // {
    //     _epubtypeSyncs = [];
    // };

    // local function, helper
    this.hasSync = function(epubtype)
    {
        for (var i = 0; i < _epubtypeSyncs.length; i++)
        {
            if (_epubtypeSyncs[i] === epubtype)
            {
                return true;
            }
        }
        
        return false;
    };

    /**
     * Stores epub types given as parameters in the _epubtypeSyncs array
     * Note: any use of the _epubtypeSyncs array?
     *
     * @method     addSync
     * @param      {String} epubtypes    
     */

    this.addSync = function(epubtypes)
    {
        if (!epubtypes) return;

        var parts = epubtypes.split(' ');
        for (var i = 0; i < parts.length; i++)
        {
            var epubtype = parts[i].trim();

            if (epubtype.length > 0 && !this.hasSync(epubtype))
            {
                _epubtypeSyncs.push(epubtype);
            }
        }
    };
    
};

/**
 * Static SmilModel.fromSmilDTO method, returns a clean SmilModel object
 *
 * @method      Model.fromSmilDTO
 * @param      {string} smilDTO
 * @param      {string} parent
 * @return {Models.SmilModel}
*/

SmilModel.fromSmilDTO = function(smilDTO, mo) {

    if (mo.DEBUG)
    {
        console.debug("Media Overlay DTO import...");
    }

    // Debug level indenting function
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

    var smilModel = new SmilModel();
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
    
    smilModel.mo = mo; //Models.MediaOverlay

    if (smilModel.mo.DEBUG)
    {
        console.log("JS MO smilVersion=" + smilModel.smilVersion);
        console.log("JS MO id=" + smilModel.id);
        console.log("JS MO spineItemId=" + smilModel.spineItemId);
        console.log("JS MO href=" + smilModel.href);
        console.log("JS MO duration=" + smilModel.duration);
    }

    // Safe copy, helper function
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

    // smil node creation, helper function
    var createNodeFromDTO = function(nodeDTO, parent) {

        var node;

        if(nodeDTO.nodeType == "seq") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO seq");
            }

            node = new Smil.SeqNode(parent);

            safeCopyProperty("textref", nodeDTO, node, ((parent && parent.parent) ? true : false));
            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            if (node.epubtype)
            {
                node.getSmil().addSync(node.epubtype);
            }
            
            indent++;
            copyChildren(nodeDTO, node);
            indent--;
        }
        else if (nodeDTO.nodeType == "par") {

            if (smilModel.mo.DEBUG)
            {
            console.log(getIndent() + "JS MO par");
            }

            node = new Smil.ParNode(parent);

            safeCopyProperty("id", nodeDTO, node);
            safeCopyProperty("epubtype", nodeDTO, node);

            if (node.epubtype)
            {
                node.getSmil().addSync(node.epubtype);
            }

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
                var fakeAudio = new Smil.AudioNode(node);

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

            node = new Smil.TextNode(parent);

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

            node = new Smil.AudioNode(parent);

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

    // recursive copy of a tree, helper function
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

return SmilModel;
});
