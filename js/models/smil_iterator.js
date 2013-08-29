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
        this.currentPar = findParNode(0, this.smil);
    };

    this.next = function() {

        if(!this.currentPar) {
            console.debug("Par iterator is out of range");
            return;
        }

        this.currentPar = findParNode(this.currentPar.index + 1, this.currentPar.parent);
    };

    function findParNode(startIndex, container) {

        for(var i = startIndex, count = container.children.length; i < count; i++) {

            var node = container.children[i];
            if(node.nodeType == "par") {
                return node;
            }

            node = findParNode(0, node);

            if(node) {
                return node;
            }
        }

        if(container.parent) {

            return findParNode(container.index + 1, container.parent);
        }

        return undefined;
    }
};