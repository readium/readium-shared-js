//
//  Created by Mickaël Menu.
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

// A plugin used to notify the host app when an EPUB 3 footnote is clicked.
//
// When the user activate a footnote, the FootnoteClicked notification is sent
// to the host app with the following argument:
// {
//    x: x position of the click,
//    y: y position of the click,
//    title: title of the link of the footnote,
//    content: HTML content of the footnote
// }
//
// When loading the plugin, you can specify as an argument whether you want to
// hides the original footnote nodes in the document.
//

ReadiumSDK.Events.FOOTNOTE_CLICKED = "FootnoteClicked";

function FootnotesPlugin(hideFootnotes) {
    this.hideFootnotes = hideFootnotes;

    var self = this;
    this.onDocumentLoadedBeforeInjection = function($iframe, $document, spineItem) {
        // adds behaviour for noteref
        $document.
            find("a[epub\\:type='noteref']").
            on("click", function(event) {
                var title = $(this).html();
                var content = $document.find($(this).attr('href')).html();

                ReadiumSDK.reader.trigger(ReadiumSDK.Events.FOOTNOTE_CLICKED, {
                    x: event.pageX,
                    y: event.pageY,
                    title: title,
                    content: content
                });
                
                // we stop immediate propagation to avoid Readium to move the reader
                // to the internal location of the footnote
                event.stopImmediatePropagation();
                return false;
            });

        // hides footnotes if needed
        if (self.hideFootnotes) {
            $document.find("aside[epub\\:type='footnote']").hide();
            $document.find("aside[epub\\:type='note']").hide();
        }
    };
}
