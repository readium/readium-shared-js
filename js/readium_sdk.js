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
    Views : {
        ORIENTATION_LANDSCAPE: "orientation_landscape",
        ORIENTATION_PORTRAIT: "orientation_portrait"
    },
    Collections: {},
    Routers: {},
    Helpers: {},
    Events: {
                READER_INITIALIZED: "ReaderInitialized",
                // PAGINATION_CHANGED gets triggered on every page turnover. it includes spine information and such.
                PAGINATION_CHANGED: "PaginationChanged",
                SETTINGS_APPLIED: "SettingsApplied",
                CONTENT_DOCUMENT_LOAD_START: "ContentDocumentLoadStart",
                CONTENT_DOCUMENT_LOADED: "ContentDocumentLoaded",
                MEDIA_OVERLAY_STATUS_CHANGED: "MediaOverlayStatusChanged",
                MEDIA_OVERLAY_TTS_SPEAK: "MediaOverlayTTSSpeak",
                MEDIA_OVERLAY_TTS_STOP: "MediaOverlayTTSStop"
            },

    InternalEvents: {
        CURRENT_VIEW_PAGINATION_CHANGED: "CurrentViewPaginationChanged",
    }

};


//This is default implementation of reading system object that will be available for the publication's javascript to analyze at runtime
//To extend/modify/replace this object reading system should subscribe ReadiumSDK.Events.READER_INITIALIZED and apply changes in reaction to this event
navigator.epubReadingSystem = {
    name: "",
    version: "0.0.0",
    layoutStyle: "paginated",

    hasFeature: function (feature, version) {

        // for now all features must be version 1.0 so fail fast if the user has asked for something else
        if (version && version !== "1.0") {
            return false;
        }

        if (feature === "dom-manipulation") {
            // Scripts may make structural changes to the document’s DOM (applies to spine-level scripting only).
            return true;
        }
        if (feature === "layout-changes") {
            // Scripts may modify attributes and CSS styles that affect content layout (applies to spine-level scripting only).
            return true;
        }
        if (feature === "touch-events") {
            // The device supports touch events and the Reading System passes touch events to the content.
            return false;
        }
        if (feature === "mouse-events") {
            // The device supports mouse events and the Reading System passes mouse events to the content.
            return true;
        }
        if (feature === "keyboard-events") {
            // The device supports keyboard events and the Reading System passes keyboard events to the content.
            return true;
        }

        if (feature === "spine-scripting") {
            //Spine-level scripting is supported.
            return true;
        }

        return false;
    }
};


_.extend(ReadiumSDK, Backbone.Events);


