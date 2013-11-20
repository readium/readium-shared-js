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


/**
 * Top level ReadiumSDK namespace
 * @class ReadiumSDK
 * @static
 */
ReadiumSDK = {

    /**
     Current version of the JS SDK
     @method version
     @static
     @return {string} version
     */
    version: function() {
        return "0.8.0";
    },

    Models :    {
                    Smil: {}
                },
    Views : {},
    Collections: {},
    Routers: {},
    Helpers: {},
    Events: {
                READER_INITIALIZED: "ReaderInitialized",
                PAGINATION_CHANGED: "PaginationChanged",
                SETTINGS_APPLIED: "SettingsApplied",
                CONTENT_DOCUMENT_LOADED: "ContentDocumentLoaded",
                CURRENT_VIEW_PAGINATION_CHANGED: "CurrentViewPaginationChanged", // used internally
                MEDIA_OVERLAY_STATUS_CHANGED: "MediaOverlayStatusChanged",
                MEDIA_OVERLAY_TTS_SPEAK: "MediaOverlayTTSSpeak",
                MEDIA_OVERLAY_TTS_STOP: "MediaOverlayTTSStop"
            }

};

_.extend(ReadiumSDK, Backbone.Events);
