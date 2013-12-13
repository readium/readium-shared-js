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
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

ReadiumSDK.Views.ScrollView = Backbone.View.extend({

    currentSpineItem: undefined,
    isWaitingFrameRender: false,
    deferredPageRequest: undefined,
    spine: undefined,
    fontSize:100,
    $viewport: undefined,
    $contentFrame: undefined,
    userStyles: undefined,
    bookStyles: undefined,
    navigationLogic: undefined,
    iframeLoader: undefined,

    initialize: function() {

        this.$viewport = this.options.$viewport;
        this.spine = this.options.spine;
        this.userStyles = this.options.userStyles;
        this.bookStyles = this.options.bookStyles;
        this.iframeLoader = this.options.iframeLoader;
    }

});
