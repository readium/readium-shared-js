//  LauncherOSX
//
//  Created by Boris Schneiderman.
//  Modified by Daniel Weck
//  Copyright (c) 2016 Readium Foundation and/or its licensees. All rights reserved.
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
define (["jquery", "../helpers"], function($, Helpers) {
/**
 * Wrapper of a smil iterator object. 
 * A smil iterator is used by the media overlay player, to move along text areas which have an audio overlay. 
 * Such areas are specified in the smil model via parallel smil nodes (text + audio).  
 *
 * @class  Models.SmilIterator
 * @constructor
 * @param {Models.SmilModel} smil The current smil model
 */
var SmilIterator = function(smil) {

   /**
     * The smil model
     *
     * @property smil
     * @type Models.SmilModel
     */
    this.smil = smil;

    /**
     * The current parallel smil node
     *
     * @property currentPar
     * @type object
     */
     
    this.currentPar = undefined;

    /**
     * Resets the iterator. 
     * In practice, looks for the first parallel smil node in the smil model
     *
     * @method     reset
     */

    this.reset = function() {
        this.currentPar = findParNode(0, this.smil, false);
    };

    /*
    this.firstDeep = function(container) {
        var par = container.nodeType === "par" ? container : findParNode(0, container, false);

        return par;
    };
    */
//
//    this.ensureNextValidTextElement = function()
//    {
//        if (!this.currentPar)
//        {
//            console.debug("Par iterator is out of range");
//            return;
//        }
//
//        while (this.currentPar && !this.currentPar.element)
//        {
//            this.next();
//        }
//    };
    
    /**
     * Looks for a text smil node identified by the id parameter 
     * Returns true if the id param identifies a text smil node.
     *
     * @method     findTextId
     * @param      {Number} id A smil node identifier
     * @return     {Boolean} 
     */
    this.findTextId = function(id)
    {
        if (!this.currentPar)
        {
            console.debug("Par iterator is out of range");
            return;
        }

        if (!id)
        {
            return false;
        }

        while (this.currentPar)
        {
            if (this.currentPar.element)
            {
                if (id === this.currentPar.text.srcFragmentId) //this.currentPar.element.id
                {
                    return true;
                }

                // OUTER match
                var parent = this.currentPar.element.parentNode;
                while(parent)
                {
                    if (parent.id && parent.id == id)
                    {
                        return true;
                    }

                    parent = parent.parentNode;
                }
                //console.log(parent);

                // INNER match
                //var inside = this.currentPar.element.ownerDocument.getElementById(id);
                var inside = $("#" + Helpers.escapeJQuerySelector(id), this.currentPar.element);
                if (inside && inside.length && inside[0])
                {
                    return true;
                }
            }
            // moves to the next parallel smil node
            this.next();
        }

        return false;
    }

    /**
     * Looks for the next parallel smil node
     *
     * @method     next 
     */

    this.next = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        this.currentPar = findParNode(this.currentPar.index + 1, this.currentPar.parent, false);
    };

    /**
     * Looks for the previous parallel smil node
     *
     * @method     previous
     */

    this.previous = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        this.currentPar = findParNode(this.currentPar.index - 1, this.currentPar.parent, true);
    };

    /**
     * Checks if the current parallel smil node is the last one in the smil model
     *
     * @method     isLast
     * @return     {Bool}
     */

    this.isLast = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        if (findParNode(this.currentPar.index + 1, this.currentPar.parent, false))
        {
            return false;
        }

        return true;
    }

    /**
     * Moves to the parallel smil node given as a parameter. 
     *
     * @method     goToPar
     * @param      {Containter} par A parallel smil node
     * @return     {Boolean} 
     */

    this.goToPar =  function(par) {

        while(this.currentPar) {
            if(this.currentPar == par) {
                break;
            }

            this.next();
        }
    };

    /**
     * Looks for a parallel smil node in the smil model.
     *
     * @method     findParNode
     * @param      {Number} startIndex Start index inside the container
     * @param      {Models.SMilModel} container The smil model
     * @param      {Boolean} previous True if  search among previous nodes
     * @return     {Smil.ParNode} 
     */

    function findParNode(startIndex, container, previous) {

        for(var i = startIndex, count = container.children.length;
            i >= 0 && i < count;
            i += (previous ? -1 : 1)) {

            var node = container.children[i];
            if(node.nodeType == "par") {
                return node;
            }

            // assert(node.nodeType == "seq")
            node = findParNode(previous ? node.children.length - 1 : 0, node, previous);

            if(node) {
                return node;
            }
        }

        if(container.parent) {
            return findParNode(container.index + (previous ? -1 : 1), container.parent, previous);
        }

        return undefined;
    }

    this.reset();
};

return SmilIterator;
});
