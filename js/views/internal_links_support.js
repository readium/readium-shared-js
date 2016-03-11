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

define(['jquery', '../helpers', 'readium_cfi_js', '../globals', '../models/viewer_settings'], function($, Helpers, epubCfi, Globals, ViewerSettings) {
/**
 *
 * @param reader
 * @constructor
 */
var InternalLinksSupport = function(reader) {

    var self = this;

    function splitCfi(fullCfi) {

        var startIx = fullCfi.indexOf("(");
        var bungIx = fullCfi.indexOf("!");
        var endIx = fullCfi.indexOf(")");

        if(bungIx == -1) {
            return undefined;
        }

        if(endIx == -1) {
            endIx = fullCfi.length;
        }

        return {

            spineItemCfi: fullCfi.substring(startIx + 1, bungIx),
            elementCfi: fullCfi.substring(bungIx + 1, endIx)
        }
    }

    function getAbsoluteUriRelativeToSpineItem(hrefUri, spineItem) {

        var fullPath = reader.package().resolveRelativeUrl(spineItem.href);

        var absUrl = hrefUri.absoluteTo(fullPath);

        return absUrl;
    }

    function processDeepLink(hrefUri, spineItem) {

        var absoluteOpfUri = getAbsoluteUriRelativeToSpineItem(hrefUri, spineItem);

        if(!absoluteOpfUri) {
            console.error("Unable to resolve " + hrefUri.href())
            return;
        }

        var fullCfi = hrefUri.fragment();

        var absPath = absoluteOpfUri.toString();

        absPath = Helpers.RemoveFromString(absPath, "#" +  fullCfi);

        readOpfFile(absPath, function(opfText) {

            if(!opfText) {
                return;
            }

            var parser = new window.DOMParser;
            var packageDom = parser.parseFromString(opfText, 'text/xml');
            var cfi = splitCfi(fullCfi);

            if(!cfi) {
                console.warn("Unable to split cfi:" + fullCfi);
                return;
            }

            var contentDocRef = EPUBcfi.Interpreter.getContentDocHref("epubcfi(" + cfi.spineItemCfi + ")", packageDom);

            if(contentDocRef) {

                var newSpineItem = reader.spine().getItemByHref(contentDocRef);
                if(newSpineItem) {

                    reader.openSpineItemElementCfi(newSpineItem.idref, cfi.elementCfi, self);
                }
                else {
                    console.warn("Unable to find spineItem with href=" + contentDocRef);
                }

            }
            else {
                console.warn("Unable to find document ref from " +  fullCfi +" cfi");
            }

        });

    }

    function readOpfFile(path, callback) {

        //TODO: this should use readium-js resource fetcher (file / URI access abstraction layer), as right now this fails with packed EPUBs  
        $.ajax({
            // encoding: "UTF-8",
            // mimeType: "text/plain; charset=UTF-8",
            // beforeSend: function( xhr ) {
            //     xhr.overrideMimeType("text/plain; charset=UTF-8");
            // },
            isLocal: path.indexOf("http") === 0 ? false : true,
            url: path,
            dataType: 'text',
            async: true,
            success: function (result) {
                callback(result);
            },
            error: function (xhr, status, errorThrown) {
                console.error('Error when AJAX fetching ' + path);
                console.error(status);
                console.error(errorThrown);
                callback();
            }
        });
    }

    //checks if href includes path to opf file and full cfi
    function isDeepLikHref(uri) {

        var fileName = uri.filename();
        return fileName && Helpers.EndsWith(fileName, ".opf");
    }

    function processLinkWithHash(hrefUri, spineItem) {

        var fileName = hrefUri.filename();

        var idref;

        //reference to another file
        if(fileName) {
            var normalizedUri = new URI(hrefUri, spineItem.href);
            
            var pathname = decodeURIComponent(normalizedUri.pathname());
            
            var newSpineItem = reader.spine().getItemByHref(pathname);

            if(!newSpineItem) {
                console.error("spine item with href=" + pathname + " not found");
                return;
            }

            idref = newSpineItem.idref;
        }
        else { //hush in the same file
            idref = spineItem.idref;
        }

        var hashFrag = hrefUri.fragment();

        reader.openSpineItemElementId(idref, hashFrag, self);

    }

    this.processLinkElements = function($iframe, spineItem) {

        var settings = reader.viewerSettings();
        if (!settings || typeof settings.epubPopupFootnotes === "undefined")
        {
            //defaults
            settings = new ViewerSettings({});
        }
        var epubPopupFootNotesAreEnabled = settings.epubPopupFootnotes;
        if (epubPopupFootNotesAreEnabled) {
            var doc = ( $iframe[0].contentWindow || $iframe[0].contentDocument ).document;
            var $elements = $("*[epub\\:type]", doc);
            if ($elements.length) {
                
                var sources = [];
                var targets = [];
                
                $elements.each(function(i) {
                    
                    if ($elements[i].localName !== "a"
                        && $elements[i].localName !== "aside") {
                        return true; // continue
                    }
                    
                    var $element = $($elements[i]);
                    var epubType = $element.attr("epub:type"); 

                    if (epubType == "noteref" && $element[0].localName === "a") {
                        sources.push($element);
                    } else if ((epubType == "footnote" || epubType == "note") && $element[0].localName === "aside") {
                        targets.push($element);
                    }
                });
                
                for (var i = 0; i < targets.length; i++) {
                    
                    var target = targets[i]; 
                    
                    var targetID = target.attr("id");
                    
                    if (!targetID) {
                        console.warn("Aside footnote has no ID!");
                        continue;
                    }
                        
                    for (var j = 0; j < sources.length; j++) {
                        var source = sources[j];
                        
                        var sourceIDREF = source.attr("href");
                            
                        if (!sourceIDREF) {
                            console.warn("Link has no HREF!");
                            continue;
                        }
                        
                        if (sourceIDREF === ("#" + targetID)) {
                            
                            target.hide();
                            
                            source.data("popupfootnotedata", targetID);
                        }
                    }
                }
            }
        }

        var epubContentDocument = $iframe[0].contentDocument;

        $('a', epubContentDocument).click(function (clickEvent) {
            
            var $aElement = $(this);
            var popupfootnotedata = $aElement.data("popupfootnotedata");
            if (popupfootnotedata) {
                
                var target = epubContentDocument.getElementById(popupfootnotedata);
                if (target) {
                    var $target = $(target);
                    
                    $("img", $target).each(function(i){
                        var $thiz = $(this);
                        
                        $thiz.attr("data-readium-baseuri", $thiz[0].baseURI);
                        if ($thiz[0].currentSrc) {
                            $thiz.attr("data-readium-src", $thiz[0].currentSrc);
                        }
                    });
                    
                    var htmlFragment = $target.html();
                    //console.debug(htmlFragment);
                    var $html = $("<div>"+htmlFragment+"</div>");
                    
                    
                    $("img", $html).each(function(i){
                        var $thiz = $(this);
                        
                        var readiumSrc = $thiz.attr("data-readium-src");
                        if (readiumSrc) {
                            $thiz.attr("src", readiumSrc);
                        } else {
                            var readiumBaseUri = $thiz.attr("data-readium-baseuri");
                            if (readiumBaseUri) {
                                $thiz.attr("src", readiumBaseUri + "/../" + $thiz.attr("src"));
                            }
                        }
                    });
                    
                    
                    $("a", $html).each(function(i){
                        var $thiz = $(this);
                        
                        $thiz.attr("target", "_BLANK");
                        
                        var href = $thiz.attr("href");
                        if (href && href.indexOf("http") !== 0) {
                            //$thiz.attr("href", "about:blank");
                            $thiz.removeAttr("href");
                        }
                    });
                    
                    $("script", $html).each(function(i){
                        var $thiz = $(this);
                        
                        $thiz.remove();
                    });
                    
                    var sanitizedHTML = $html.html();
                    //console.log(sanitizedHTML);
                    
                    sanitizedHTML = sanitizedHTML.replace(/xmlns="http:\/\/www.w3.org\/1999\/xhtml"/g, ' ');
                    
                    Globals.logEvent("EPUB_POPUP_FOOTNOTE", "EMIT", "internal_links_support.js [ " + popupfootnotedata + " ]");
                    reader.emit(Globals.Events.EPUB_POPUP_FOOTNOTE, popupfootnotedata, sanitizedHTML);
                    
                    overrideClickEvent = true;
                }
            } else {
                // Check for both href and xlink:href attribute and get value
                var href;
                if (clickEvent.currentTarget.attributes["xlink:href"]) {
                    
                    href = clickEvent.currentTarget.attributes["xlink:href"].value;
                }
                else {
                    href = clickEvent.currentTarget.attributes["href"].value;
                }

                var overrideClickEvent = false;
                var hrefUri = new URI(href);
                var hrefIsRelative = hrefUri.is('relative');

                if (hrefIsRelative) {

                    if(isDeepLikHref(hrefUri)) {
                        processDeepLink(hrefUri, spineItem);
                        overrideClickEvent = true;
                    }
                    else {
                        processLinkWithHash(hrefUri, spineItem);
                        overrideClickEvent = true;
                    }

                } else {
                    // It's an absolute URL to a remote site - open it in a separate window outside the reader
                    window.open(href, '_blank');
                    overrideClickEvent = true;
                }
            }
            
            if (overrideClickEvent) {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
            }
        });

    }

};

return InternalLinksSupport;
});
