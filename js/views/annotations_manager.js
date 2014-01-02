ReadiumSDK.Views.AnnotationsManager = function (proxyObj) {

    var self = this;
    var liveAnnotations = {};
    var proxy = proxyObj; 

    _.extend(self, Backbone.Events);

    this.on("all", function(eventName) {
        var args = Array.prototype.slice.call(arguments);
        self[eventName].apply(proxy, args);
    });

    this.attachAnnotations = function($iframe, spineItem) {
        var epubDocument = $iframe[0].contentDocument;
        liveAnnotations[spineItem.index] = new EpubAnnotationsModule(epubDocument, self);

        // check to see which spine indecies can be culled depending on the distance from current spine item
        for(spineIndex in liveAnnotations) {
            if (Math.abs(spineIndex - spineIndex.index) > 3) {
                delete liveAnnotations[spineIndex];
            }
        }
    };

    this.addSelectionHighlight = function(id, type) {
        for(spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine]; 
            if (annotationsForView.getCurrentSelectionCFI()) {
                var annotation = annotationsForView.addSelectionHighlight(id, type);
                annotation.spineIndex = spine;
                return annotation;
            }
        }
        return undefined;
    };

    this.addHighlight = function(spineIndex, partialCfi, id, type, styles) {
        for(spine in liveAnnotations) {
            if (spine === spineIndex.toString()) {
                var fakeCfi = "epubcfi(/99!" + partialCfi + ")";
                var annotationsForView = liveAnnotations[spine]; 
                var annotation = annotationsForView.addHighlight(fakeCfi, id, type, styles);
                annotation.spineIndex = spine;
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
