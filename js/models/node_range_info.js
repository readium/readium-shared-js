//  Created by Juan Corona
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

define(function () {

    /**
     * @class Models.NodeRangePositionInfo
     * @constructor
     * @param {Node} node The actual DOM node
     * @param {Number} offest The position offsetf for the node
     */
    var NodeRangePositionInfo = function (node, offset) {

        /**
         * The actual DOM node
         * @property node
         * @type Node
         */
        this.node = node;

        /**
         * The position offsetf for the node
         * @property offset
         * @type Number
         */
        this.offset = offset;

    };

    /**
     * @class Models.NodeRangeInfo
     * @constructor
     * @param {ClientRect} clientRect
     * @param {Models.NodeRangePositionInfo} startInfo
     * @param {Models.NodeRangePositionInfo} endInfo
     */
    var NodeRangeInfo = function (clientRect, startInfo, endInfo) {

        var self = this;
        /**
         * Client rectangle information for the range content bounds
         * @property clientRect
         * @type ClientRect
         */
        this.clientRect = clientRect;

        /**
         * Node and position information providing where and which node the range starts with
         * @property startInfo
         * @type Models.NodeRangePositionInfo
         */
        this.startInfo = startInfo;

        /**
         * Node and position information providing where and which node the range ends with
         * @property endInfo
         * @type Models.NodeRangePositionInfo
         */
        this.endInfo = endInfo;


        this.setStartInfo = function (info) {
            self.startInfo = new NodeRangePositionInfo(info);
            return self;
        };

        this.setEndInfo = function (info) {
            self.endInfo = new NodeRangePositionInfo(info);
            return self;
        };
    };

    return NodeRangeInfo;
});