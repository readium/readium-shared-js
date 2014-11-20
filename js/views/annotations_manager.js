//  Created by Dmitry Markushevich (dmitrym@evidentpoint.com)
// 
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

/*



# Highlighting in Readium - A primer

Please note:

- only simple text highlighting is currently supported
- it's the job of the reading system to keep track of annotations. readium-js simply displays your annotations.
- full CFIs for annotations are not currently available. We use so called "partial CFI"s, a tuple containing idref of the spine item and the CFI definition relative to the root of the spine item.

Currently, the API exposed via `ReaderView` exposes 4 functions and 1 even which should be sufficient for a simple highlighting workflow.


# API

For the purposes of the examples below, `RReader` is a previously instantiated `ReaderView` instance.


## Is anything selected (getCurrentSelectionCfi())

Before proceeding with the highlighting workflow it is sometimes necessary to determine whether the user has in fact selected anything. This can be accomplished with the following:


	> RReader.getCurrentSelectionCfi()
	Object {idref: "id-id2604743", cfi: "/4/2/6,/1:74,/1:129"}

The response contains a partial CFI that is sufficient to create a highlight based on selection. If nothing is selected *undefined* is returned. 

You can also use partial Cfi with `openSpineItemElementCfi()` to navigate to where this selection is later.

## Highlighting (addHighlight and addSelectionHighlight)

Once we've determined what needs to be highlighted (by generating a partial CFI from a selection, or having an existing partial CFI stored externally) we can add it to the reader by calling `addHighlight()`:

	> RReader.addHighlight('id-id2604743', "/4/2/6,/1:74,/1:129", 123, "highlight")
	Object {CFI: "/4/2/6,/1:74,/1:129", selectedElements: Array[1], idref: "id-id2604743"}

*addHighligh*t takes the following parameters:

- *id-id2604743* - `idref` is the idref value from `getCurrentSelectionCfi()
- * /4/2/6,/1:74,/1:129* - `cfi` is the cfi value from `getCurrentSelectionCfi()
- *123* - `id` is the unique id that defines this annotation
- *highlight* - 'type' of annotation. only 'highlight' is currently supported.

### addSelectioHighlight

Alternatively, you can call addSelectionHighlight(). It combines both getCurrentSelectionCfi() and addHighlight into one call:

	> RReader.addSelectionHighlight(124, "highlight")
	Object {CFI: "/4/2/4,/1:437,/1:503", selectedElements: Array[1], idref: "id-id2604743"}

Note that it provides no validation. If nothing is selected, `undefined` is returned.


## Removing highlights 

To remove the highlight, call `removeHighlight`:

	> RReader.removeHighlight(123)
	undefined


# Handling annotation click events

When a user clicks on a highlight `annotationClicked` event is dispatched with the following arguments:

- type of annotation
- idref of the spine item
- partial Cfi of the annotation
- annotationdId


	> RReader.on('annotationClicked', function(type, idref, cfi, annotationId) { console.log (type, idref, cfi, annotationId)});
	ReadiumSDK.Views.ReaderView {on: function, once: function, off: function, trigger: function, listenTo: function???}
	
Then when the user clicks on the highlight the following will show up in the console:

	highlight id-id2604743 /4/2/6,/1:74,/1:129 123 
	

*/

/**
 *
 * @param proxyObj
 * @param options
 * @constructor
 */
ReadiumSDK.Views.AnnotationsManager = function (proxyObj, options) {

    var self = this;
    var liveAnnotations = {};
    var spines = {};
    var proxy = proxyObj; 
    var annotationCSSUrl = options.annotationCSSUrl;

    if (!annotationCSSUrl) {
        console.warn("WARNING! Annotations CSS not supplied. Highlighting is not going to work.");
    }

    _.extend(self, Backbone.Events);

    // we want to bubble up all of the events that annotations module may trigger up.
    this.on("all", function(eventName) {
        var args = Array.prototype.slice.call(arguments);
        // mangle annotationClicked event. What really needs to happen is, the annotation_module needs to return a 
        // bare Cfi, and this class should append the idref.
        var annotationClickedEvent = 'annotationClicked';
        if (args.length && args[0] === annotationClickedEvent) {
            for (var spineIndex in liveAnnotations)
            {
                var jQueryEvent = args[4];
                var annotationId = args[3];
                var fullFakeCfi = args[2];
                var type = args[1];
                if (liveAnnotations[spineIndex].getHighlight(annotationId)) {
                    var idref = spines[spineIndex].idref;
                    var partialCfi = getPartialCfi(fullFakeCfi);
                    args = [annotationClickedEvent, type, idref, partialCfi, annotationId, jQueryEvent];
                }
            }
        }
        self['trigger'].apply(proxy, args);
    });

    this.attachAnnotations = function($iframe, spineItem) {
        var epubDocument = $iframe[0].contentDocument;
        liveAnnotations[spineItem.index] = new EpubAnnotationsModule(epubDocument, self, annotationCSSUrl);
        spines[spineItem.index] = spineItem;

        // check to see which spine indecies can be culled depending on the distance from current spine item
        for(var spineIndex in liveAnnotations) {
            if (Math.abs(spineIndex - spineIndex.index) > 3) {
                delete liveAnnotations[spineIndex];
            }
        }
    };


    this.getCurrentSelectionCfi = function() {
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine]; 
            var partialCfi = annotationsForView.getCurrentSelectionCFI();
            if (partialCfi) {
                return {"idref":spines[spine].idref, "cfi":partialCfi};
            }
        }
        return undefined;
    };

    this.addSelectionHighlight = function(id, type) {
        for(spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine]; 
            if (annotationsForView.getCurrentSelectionCFI()) {
                var annotation = annotationsForView.addSelectionHighlight(id, type);
                annotation.idref = spines[spine].idref;
                return annotation;
            }
        }
        return undefined;
    };

    this.addHighlight = function(spineIdRef, partialCfi, id, type, styles) {
        for(var spine in liveAnnotations) {
            if (spines[spine].idref === spineIdRef) {
                var fakeCfi = "epubcfi(/99!" + partialCfi + ")";
                var annotationsForView = liveAnnotations[spine]; 
                var annotation = annotationsForView.addHighlight(fakeCfi, id, type, styles);
                annotation.idref = spineIdRef;
                annotation.CFI = getPartialCfi(annotation.CFI);
                return annotation;
            }
        }
        return undefined;
    };

    this.removeHighlight = function(id) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine]; 
            result  = annotationsForView.removeHighlight(id);
        }
        return result;
    };



    function getPartialCfi(CFI) {
        var cfiWrapperPattern = new RegExp("^.*!")
        // remove epubcfi( and indirection step
        var partiallyNakedCfi = CFI.replace(cfiWrapperPattern, "");
        // remove last paren
        var nakedCfi = partiallyNakedCfi.substring(0, partiallyNakedCfi.length -1);
        return nakedCfi;
    }


};
