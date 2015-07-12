//  Created by Daniel Weck.
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

/**
 * Mapping Data, see http://www.idpf.org/epub/renditions/multiple/#h.o54dzjuwr54c
 *
 * @typedef {object} ReadiumSDK.Models.MappingData
 * @property string href - the original a@href attribute
 * @property string rendition - the original a@epub:rendition attribute (may be undefined)
 * @property string cfiFull - the entire CFI expression given in href (applies to the OPF itself)
 * @property string cfiPartial - only the part of the CFI expression that applies to the spine item
 * @property string opf - the resolved rendition absolute path (e.g. "/EPUB/package.opf")
 * @property string target - the resolved spine item absolute path (e.g. "/EPUB/html/chapter1.xhtml")
 * @property string idref - the resolved idref of the spine item (i.e. spine>itemref@idref attribute)
 */
 
/**
 * Rendition Data
 *
 * @typedef {object} ReadiumSDK.Models.RenditionData
 * @property string Media - CSS Media Query, see rendition:media http://www.idpf.org/epub/renditions/multiple/#h.v5umqueir7kw
 * @property string Layout - reflowable or pre-paginated, see rendition:layout http://www.idpf.org/epub/renditions/multiple/#h.652no7qrkqt9
 * @property string Language - lang tag, see rendition:language http://www.idpf.org/epub/renditions/multiple/#h.i2sz2e7fiql8
 * @property string AccessMode - auditory, tactile, textual, visual, see rendition:accessMode http://www.idpf.org/epub/renditions/multiple/#h.u174vaicigpv
 * @property string Label - description, see rendition:laberl http://www.idpf.org/epub/renditions/multiple/#h.t1refnod0o2
 */

/**
 * Multiple Renditions Data
 *
 * @typedef {object} ReadiumSDK.Models.MultipleRenditionsData
 * @property [{ReadiumSDK.Models.RenditionData}] renditions - array of rendition objects
 * @property integer selectedIndex - index of currently-selected item in the renditions array
 * @property [[{ReadiumSDK.Models.MappingData}]] mappings - array of arrays of mapping objects (top array stores each UL list container present in nav@epub:type=resource-map, and sub-arrays store actual list items (equivalent locations in different OPF renditions)) see http://www.idpf.org/epub/renditions/multiple/#h.o54dzjuwr54c
 */

define([], function() {

/**
 * EPUB3 Multiple Renditions, see http://www.idpf.org/epub/renditions/multiple
 * @class ReadiumSDK.Models.MultipleRenditions
 * @param {ReadiumSDK.Models.MultipleRenditionsData} multipleRenditions
 * @constructor
 */
var MultipleRenditions = function(multipleRenditions) {

    var self = this;
	
	/**
	 * @see {ReadiumSDK.Models.MultipleRenditionsData}
	 */
	this.renditions = multipleRenditions ? multipleRenditions.renditions : undefined;
	this.selectedIndex = multipleRenditions ? multipleRenditions.selectedIndex : -1;
	this.mappings = multipleRenditions ? multipleRenditions.mappings : undefined;

	
	var cfiTokenise = function(cfi) {
//console.log(cfi);
		var arrayOfIndices = [];
		
		var split = cfi.split("/");
		for (var i = 0; i < split.length; i++) {
			var token = split[i];
			var j = token.indexOf("[");
			if (j > 0) {
				token = token.substr(0, token.length - j);
			}
			j = token.indexOf("@");
			if (j > 0) {
				token = token.substr(0, token.length - j);
			}
			if (!token.length) continue;
			
			var index = parseInt(token);
//console.log(index);
			arrayOfIndices.push(index);
		}

		return arrayOfIndices;
	};
	
	// cfi1 <= cfi2
	var cfiIsBeforeOrEqual = function(cfi1, cfi2) {
		
		var i = 0;
		while (i < cfi1.length && i < cfi2.length) {
			if (cfi1[i] > cfi2[i]) return false;
			i++;
		}

		return true;
	};


	/**
	 * Get spine item data in readium-shared-js accepted format.
	 * @param openPageRequest the original page request
	 * @returns The unmodified openPageRequest parameter if the rendition OPF is the same, or the modified openPageRequest parameter if the rendition OPF was mapped succesfully, or undefined if the OPF could not be mapped.
	 */
	this.adjustPageRequestRenditionMapping = function(openPageRequest) {
		
		if (!openPageRequest) return undefined;
		if (!multipleRenditions || !openPageRequest.opfPath) return openPageRequest;
	
		var rendition = multipleRenditions.renditions[multipleRenditions.selectedIndex];
		
		if (rendition.opfPath == openPageRequest.opfPath) return openPageRequest;

		if (!multipleRenditions.mappings) return undefined;
		
		var nearestMapping = undefined;
		
		console.log("ADJUSTING READING LOCATION");
		console.debug(openPageRequest.elementCfi);
		
		var cfi2 = cfiTokenise(openPageRequest.elementCfi);

		for (var i = 0; i < multipleRenditions.mappings.length; i++) {
			var mappingUL = multipleRenditions.mappings[i];
			
			for (var j = 0; j < mappingUL.length; j++) {
				var mapping = mappingUL[j];
				
				if (openPageRequest.opfPath === mapping.opf && openPageRequest.idref === mapping.idref) {
					var cfi1 = cfiTokenise(mapping.cfiPartial);
					if (nearestMapping) {
						var cfi3 = cfiTokenise(nearestMapping.cfiPartial);
						if (cfiIsBeforeOrEqual(cfi1, cfi3)) {
							break;
						}
					}
					if (cfiIsBeforeOrEqual(cfi1, cfi2)) {
						
						for (var k = 0; k < mappingUL.length; k++) {
							var m = mappingUL[k];
							if (rendition.opfPath === m.opf) {
								nearestMapping = m;
								break;
							}
						}
						
						break;
					}
				}
				
				//mapping.opf
				//openPageRequest.opfPath
				
				//mapping.idref
				//openPageRequest.idref
				
				//mapping.cfiPartial
				//openPageRequest.elementCfi
			}
		}
		
		if (nearestMapping) {
console.log("FOUND!");
console.debug(nearestMapping);
			var elCfi = nearestMapping.cfiPartial;
			var split = elCfi.split("/");
			var lastIndex = split[split.length-1];
			var l = lastIndex.indexOf("@");
			if (l > 0) {
				lastIndex = lastIndex.substr(0, lastIndex.length-l);
			}
			
			var isOdd = (lastIndex % 2) == 1;
			if (isOdd) {
				elCfi = "";
				for (var k = 0; k < split.length-1; k++) {
					var index = split[k];
					if (!index.length) continue;
					elCfi += ("/" + index);
				}
				
console.debug("ODD: "+elCfi);
			}
			
			var l = elCfi.indexOf("@");
			if (l < 0) {
				elCfi += "@0:0";
			}
			
			openPageRequest.opfPath = nearestMapping.opf;
			openPageRequest.idref = nearestMapping.idref;
			openPageRequest.elementCfi = elCfi;
		
console.debug(JSON.stringify(openPageRequest));
		} else {
console.log("RENDITION MAPPING NOT FOUND!");
			openPageRequest = undefined;
		}
		
		return openPageRequest;
	};
};

return MultipleRenditions;
});


