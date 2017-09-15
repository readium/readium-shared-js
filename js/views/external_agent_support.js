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

define(["../globals"], function(Globals) {
    /**
     * This module helps external agents that interact with content documents from
     * the level of the iframe browsing context:
     *
     *   - By providing a means of identifying the content through metadata
     *     that's brought down from the package document level.
     *
     *   - By providing a direct link (bringing down the shareable URL) that could be used
     *     to load the content in the proper context with the reader app instead of the actual
     *     content document asset path.
     *
     *   - By responding to an event when the external agent wants to bring a
     *     specific range of content into view.
     *
     * @param {Views.ReaderView} reader     The Reader instance
     * @constructor
     */
    var ExternalAgentSupport = function(reader) {

        var contentDocumentStates = {};
        var contentDocuments = {};

        Globals.on(Globals.Events.PLUGINS_LOADED, function() {
            // Disable the AMD environment since it's not needed anymore at this point.
            // This is done because external agents with their own module systems (Browserify)
            // might load third-party scripts that are in the format of
            // UMD (Universal Module Definition),
            // and will mistakenly try to use Readium's AMD shim, almond.js, or require.js
            if (window.define && window.define.amd) {
                delete window.define.amd;
            }
        });

        function appendMetaTag(_document, property, content) {
            var tag = _document.createElement('meta');
            tag.setAttribute('name', property);
            tag.setAttribute('content', content);
            _document.head.appendChild(tag);
        }

        function injectDublinCoreResourceIdentifiers(contentDocument, spineItem) {
            var renditionIdentifier = reader.metadata().identifier; // the package unique identifier
            var spineItemIdentifier = spineItem.idref; // use the spine item id as an identifier too
            if (renditionIdentifier && spineItemIdentifier) {
                appendMetaTag(contentDocument, 'dc.relation.ispartof', renditionIdentifier);
                appendMetaTag(contentDocument, 'dc.identifier', spineItemIdentifier);
            }
        }

        function injectAppUrlAsCanonicalLink(contentDocument, spineItem) {
            if (contentDocument.defaultView && contentDocument.defaultView.parent) {
                var parentWindow = contentDocument.defaultView.parent;
                var isParentInSameDomain = Object.keys(parentWindow).indexOf('document') !== -1;
                // Only do this if there's no potential cross-domain violation
                // and the reader application URL has a CFI value in a 'goto' query param.
                if (isParentInSameDomain && parentWindow.location.search.match(/goto=.*cfi/i)) {
                    var link = contentDocument.createElement('link');
                    link.setAttribute('rel', 'canonical');
                    link.setAttribute('href', parentWindow.location.href);
                    contentDocument.head.appendChild(link);
                    contentDocumentStates[spineItem.idref].canonicalLinkElement = link;
                }
            }
        }

        function bindBringIntoViewEvent(contentDocument) {
            // 'scrolltorange' is a non-standard event that is emitted on the content frame
            // by some external tools like Hypothes.is
            contentDocument.addEventListener('scrolltorange', function (event) {
                event.preventDefault();

                var range = event.detail;
                var target = reader.getRangeCfiFromDomRange(range);
                var contentDocumentState = contentDocumentStates[target.idref];

                if (contentDocumentState && contentDocumentState.isUpdated) {
                    reader.openSpineItemElementCfi(target.idref, target.contentCFI);
                } else {
                    contentDocumentState.pendingNavRequest = {
                        idref: target.idref,
                        contentCFI: target.contentCFI
                    };
                }
            });
        }

        /***
         *
         * @param {Document} contentDocument    Document instance with DOM tree
         * @param {Models.SpineItem} spineItem  The associated spine item object
         */
        this.bindToContentDocument = function(contentDocument, spineItem) {
            contentDocuments[spineItem.idref] = contentDocument;
            contentDocumentStates[spineItem.idref] = {};
            injectDublinCoreResourceIdentifiers(contentDocument, spineItem);
            injectAppUrlAsCanonicalLink(contentDocument, spineItem);
            bindBringIntoViewEvent(contentDocument);
        };

        /***
         *
         * @param {Models.SpineItem} spineItem  The associated spine item object
         */
        this.updateContentDocument = function (spineItem) {
            var contentDocument = contentDocuments[spineItem.idref];
            var state = contentDocumentStates[spineItem.idref];

            if (contentDocument && state) {

                if (state.canonicalLinkElement &&
                    contentDocument.defaultView &&
                    contentDocument.defaultView.parent) {
                    var parentWindow = contentDocument.defaultView.parent;
                    var isParentInDifferentDomain = 'document' in Object.keys(parentWindow);
                    if (!isParentInDifferentDomain) {
                        state.canonicalLinkElement.setAttribute('href', parentWindow.location.href);
                    }
                }

                state.isUpdated = true;

                var pendingNavRequest = state.pendingNavRequest;
                if (pendingNavRequest) {
                    reader.openSpineItemElementCfi(pendingNavRequest.idref, pendingNavRequest.contentCFI);
                    state.pendingNavRequest = null;
                }
            }
        };
    };

    return ExternalAgentSupport;
});
