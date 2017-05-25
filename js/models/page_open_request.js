//  Created by Boris Schneiderman.
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

define(function() {
/**
 * Representation of opening page request
 * Provides the spine item to be opened and one of the following properties:
 *  spineItemPageIndex {Number},
 *  elementId {String},
 *  elementCfi {String},
 *  firstPage {bool},
 *  lastPage {bool}
 *
 * @class Models.PageOpenRequest
 * @constructor
 * @param {Models.SpineItem} spineItem
 * @param {object} [initiator]
 *

 */
var PageOpenRequest = function(spineItem, initiator) {

    this.spineItem = spineItem;
    this.spineItemPageIndex = undefined;
    this.elementId = undefined;
    this.elementCfi = undefined;
    this.firstVisibleCfi = undefined;
    this.lastVisibleCfi = undefined;
    this.firstPage = false;
    this.lastPage = false;
    this.initiator = initiator;

    /**
     * Resets the reading system
     *
     * @method     reset
     */

    this.reset = function() {
        this.spineItemPageIndex = undefined;
        this.elementId = undefined;
        this.elementCfi = undefined;
        this.firstPage = false;
        this.lastPage = false;
    };

    /**
     * Sets the first page of the book
     *
     * @method     setFirstPage
     */

    this.setFirstPage = function() {
        this.reset();
        this.firstPage = true;
    };

    /**
     * Sets the last page of the book
     *
     * @method     setLastPage
     */

    this.setLastPage = function() {
        this.reset();
        this.lastPage = true;
    };

    /**
     * Sets the index of the book
     *
     * @method     setPageIndex
     * @param      pageIndex
     */

    this.setPageIndex = function(pageIndex) {
        this.reset();
        this.spineItemPageIndex = pageIndex;
    };

    /**
     * Sets the ID of the current element
     *
     * @method     setElementId
     * @param      {number} elementId 
     */

    this.setElementId = function(elementId) {
        this.reset();
        this.elementId = elementId;
    };
    
    /**
     * Sets the CFI of the current element
     *
     * @method     setElementCfi
     * @param      elementCfi
     */

    this.setElementCfi = function(elementCfi) {
        this.reset();
        this.elementCfi = elementCfi;
    };

    // Used by ReflowView to better keep track of the current page
    // using just a bookmark to firstVisibleElement makes the current
    // page gradually shift to the beginning of the chapter. By bookmarking
    // both the first and last visible elements, we can keep track of the 
    // "middle" of the visible area.
    this.setFirstAndLastVisibleCfi = function(firstVisibleCfi, lastVisibleCfi) {
        this.reset();
        this.firstVisibleCfi = firstVisibleCfi;
        this.lastVisibleCfi = lastVisibleCfi;
    }

};

return PageOpenRequest;
});