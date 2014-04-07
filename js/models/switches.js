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
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

ReadiumSDK.Models.Switches = function() {

};

// Description: Parse the epub "switch" tags and hide
// cases that are not supported
ReadiumSDK.Models.Switches.apply = function(dom) {


    // helper method, returns true if a given case node
    // is supported, false otherwise
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
        return _.include(supportedNamespaces, ns);
    }

    $('switch', dom).each( function() {

        // keep track of whether or now we found one
        var found = false;

        $('case', this).each(function() {

            if( !found && isSupported(this) ) {
                found = true; // we found the node, don't remove it
            }
            else {
                $(this).remove(); // remove the node from the dom
//                    $(this).prop("hidden", true);
            }
        });

        if(found) {
            // if we found a supported case, remove the default
            $('default', this).remove();
//                $('default', this).prop("hidden", true);
        }
    })
};