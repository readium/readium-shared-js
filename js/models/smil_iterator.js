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

ReadiumSDK.Models.SmilIterator = function(smil) {

    this.smil = smil;
    this.currentPar = undefined;

    this.reset = function() {
        this.currentPar = findParNode(0, this.smil, false);
    };

    /*
    this.firstDeep = function(container) {
        var par = container.nodeType === "par" ? container : findParNode(0, container, false);

        return par;
    };
    */

    this.next = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        this.currentPar = findParNode(this.currentPar.index + 1, this.currentPar.parent, false);
    };

    this.previous = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        this.currentPar = findParNode(this.currentPar.index - 1, this.currentPar.parent, true);
    };

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

    this.goToPar =  function(par) {

        while(this.currentPar) {
            if(this.currentPar == par) {
                break;
            }

            this.next();
        }
    };

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