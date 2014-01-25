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
 @class ReadiumSDK.Models.BookmarkData
 */
ReadiumSDK.Models.BookmarkData = function(idref, contentCFI) {

    var self = this;

    /**
     * spine item idref
     * @property idref
     * @type {string}
     */
    this.idref = idref;

    /**
     * cfi of the first visible element
     * @property contentCFI
     * @type {string}
     */
    this.contentCFI = contentCFI;

    /**
     * serialize to string
     * @return JSON string representation
     */
    this.toString = function(){
        return JSON.stringify(self);
    }

};

/**
 * Deserialize from string
 * @param str
 * @returns {ReadiumSDK.Models.BookmarkData}
 */
ReadiumSDK.Models.BookmarkData.fromString = function(str) {
    var obj = JSON.parse(str);
    return new ReadiumSDK.Models.BookmarkData(obj.idref,obj.contentCFI);
}
