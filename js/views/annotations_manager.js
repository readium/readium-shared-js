ReadiumSDK.Views.AnnotationsManager = function (proxyObj) {

    var self = this;
    var liveAnnotations = {};
    var spines = {};
    var proxy = proxyObj; 

    _.extend(self, Backbone.Events);

    // we want to bubble up all of the events that annotations module may trigger up.
    this.on("all", function(eventName) {
        var args = Array.prototype.slice.call(arguments);
        self['trigger'].apply(proxy, args);
    });

    this.attachAnnotations = function($iframe, spineItem) {
        var epubDocument = $iframe[0].contentDocument;
        liveAnnotations[spineItem.index] = new EpubAnnotationsModule(epubDocument, self);
        spines[spineItem.index] = spineItem;

        // check to see which spine indecies can be culled depending on the distance from current spine item
        for(spineIndex in liveAnnotations) {
            if (Math.abs(spineIndex - spineIndex.index) > 3) {
                delete liveAnnotations[spineIndex];
            }
        }
    };


    this.getCurrentSelectionCfi = function() {
        for(spine in liveAnnotations) {
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
                annotation.idref = annotationsForView.idref;
                return annotation;
            }
        }
        return undefined;
    };

    this.addHighlight = function(spineIdRef, partialCfi, id, type, styles) {
        for(spine in liveAnnotations) {
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
        for(spine in liveAnnotations) {
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
