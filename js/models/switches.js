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
define(["jquery", "underscore"], function($, _) {
/** 
 * Switches in the epub publication.
 * 
 * @class Models.Switches
 * @constructor
 */
var Switches = function() {

};

// Description: Parse the epub "switch" tags and hide
// cases that are not supported

/**
 *
 * Static Switches.apply method.
 * 
 * @method Switches.apply
 * @param dom
 */

Switches.apply = function(dom) {

    function isSupported(caseNode) {

        var ns = caseNode.attributes["required-namespace"];
        if(!ns) {
            // the namespace was not specified, that should
            // never happen, we don't support it then
            console.log("Encountered a case statement with no required-namespace");
            return false;
        }
        // all the xmlns that readium is known to support
        // TODO this is going to require maintenance
        var supportedNamespaces = ["http://www.w3.org/1998/Math/MathML"];
        return _.include(supportedNamespaces, ns.value);
    }

    var getQuery = ((window.navigator.userAgent.indexOf("Trident") > 0) || (window.navigator.userAgent.indexOf("Edge") > 0))
        ? function (elementName) { return 'epub\\:' + elementName; }
        : function (elementName) { return elementName; };

    _.each(dom.querySelectorAll(getQuery('switch')), function(switchNode) {

        // keep track of whether or now we found one
        var found = false;

        _.each(switchNode.querySelectorAll(getQuery('case')), function(caseNode) {

            if( !found && isSupported(caseNode) ) {
                found = true; // we found the node, don't remove it
            }
            else {
                $(caseNode).remove(); // remove the node from the dom
            }

        });

        if (found) {

            // if we found a supported case, remove the default
            _.each(switchNode.querySelectorAll(getQuery('default')), function(defaultNode) {
                $(defaultNode).remove();
            });

        }

    });
};
    return Switches;
});
