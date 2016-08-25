//  LauncherOSX
//
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

define(["jquery", "../helpers"], function($, Helpers) {
/**
 * Setter for epub Triggers
 *
 * @class Models.Trigger
 * @param domNode
 * @constructor
 */

var Trigger = function(domNode) {
    
    /**
     * An element from the epub
     *
     * @property el
     * @type 
     */

    var $el = $(domNode);
    
    /**
     * Maps an action to the element
     *
     * @property action
     * @type 
     */

    this.action     = $el.attr("action");
    
    /**
     * Maps a reference to the element
     *
     * @property ref
     * @type 
     */

    this.ref         = $el.attr("ref");
    
    /**
     * Maps an event to the element
     *
     * @property event
     * @type 
     */

    this.event         = $el.attr("ev:event");
    
    /**
     * Maps an event observer to the element
     *
     * @property observer
     * @type 
     */

    this.observer     = $el.attr("ev:observer");
    this.ref         = $el.attr("ref");
};
/**
 * Register the triggers
 *
 * @class Models.Trigger.register
 * @param dom
 * @constructor
 */
Trigger.register = function(dom) {
    $('trigger', dom).each(function() {
        var trigger = new Trigger(this);
        trigger.subscribe(dom);
    });
};

/**
 * Subscribes  to the prototyped trigger
 *
 * @class Models.Trigger.subscribe
 * @param dom
 * @constructor
 */

Trigger.prototype.subscribe = function(dom) {
    
    /**
     *
     * @property selector
     * @type 
     */

    var selector = "#" + this.observer;
    var that = this;
    $(selector, dom).on(this.event, function() {
        that.execute(dom);
    });
};

/**
 * Executes the prototyped trigger by using a switch-case
 *
 * @class Models.Trigger.execute
 * @param dom
 * @constructor
 */

Trigger.prototype.execute = function(dom) {
    
    /**
     *
     * @property $target
     * @type 
     */

    var $target = $( "#" + Helpers.escapeJQuerySelector(this.ref), dom);
    switch(this.action)
    {
        case "show":
            $target.css("visibility", "visible");
            break;
        case "hide":
            $target.css("visibility", "hidden");
            break;
        case "play":
            $target[0].currentTime = 0;
            $target[0].play();
            break;
        case "pause":
            $target[0].pause();
            break;
        case "resume":
            $target[0].play();
            break;
        case "mute":
            $target[0].muted = true;
            break;
        case "unmute":
            $target[0].muted = false;
            break;
        default:
            console.log("do not no how to handle trigger " + this.action);
    }
};
    return Trigger;
});
