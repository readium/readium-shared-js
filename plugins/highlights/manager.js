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

define(['jquery', 'underscore', 'eventEmitter', './controller', './helpers', 'readium_shared_js/models/bookmark_data'], function($, _, EventEmitter, HighlightsController, HighlightHelpers, BookmarkData) {

var defaultContext = {};

//determine if browser is IE9 or IE10
var div = document.createElement("div");
div.innerHTML = "<!--[if IE 9]><i></i><![endif]-->";
defaultContext.isIe9 = (div.getElementsByTagName("i").length == 1);
// IE10 introduced a prefixed version of PointerEvent, but not unprefixed.
defaultContext.isIe10 = window.MSPointerEvent && !window.PointerEvent;

/**
 *
 * @param proxyObj
 * @param options
 * @constructor
 */
var HighlightsManager = function (proxyObj, options) {

    var self = this;

    // live annotations contains references to the annotation _module_ for visible spines
    var liveAnnotations = {};
    var spines = {};
    var proxy = proxyObj;
    var annotationCSSUrl = options.annotationCSSUrl;

    if (!annotationCSSUrl) {
        console.warn("WARNING! Annotations CSS not supplied. Highlighting might not work.");
    }

    _.extend(this, new EventEmitter());

    // this.on("all", function() {
    // });
    //TODO: EventEmitter3 does not support "all" or "*" (catch-all event sink)
    //https://github.com/primus/eventemitter3/blob/master/index.js#L61
    //...so instead we patch trigger() and emit() (which are synonymous, see Bootstrapper.js EventEmitter.prototype.trigger = EventEmitter.prototype.emit;)

    var originalEmit = self['emit'];

    var triggerEmitPatch = function() {
        var args = Array.prototype.slice.call(arguments);
        // mangle annotationClicked event. What really needs to happen is, the annotation_module needs to return a
        // bare Cfi, and this class should append the idref.
        var mangleEvent = function(annotationEvent){
            if (args.length && args[0] === annotationEvent) {
                for (var spineIndex in liveAnnotations)
                {
                    var contentDocumentFrame = args[5];
                    var jQueryEvent = args[4];
                    if (typeof jQueryEvent.clientX === 'undefined') {
                        jQueryEvent.clientX = jQueryEvent.pageX;
                        jQueryEvent.clientY = jQueryEvent.pageY;
                    }

                    var annotationId = args[3];
                    var partialCfi = args[2];
                    var type = args[1];
                    if (liveAnnotations[spineIndex].getHighlight(annotationId)) {
                        var idref = spines[spineIndex].idref;
                        args = [annotationEvent, type, idref, partialCfi, annotationId, jQueryEvent, contentDocumentFrame];
                    }
                }
            }
        }
        mangleEvent('annotationClicked');
        mangleEvent('annotationTouched');
        mangleEvent('annotationRightClicked');
        mangleEvent('annotationHoverIn');
        mangleEvent('annotationHoverOut');

        originalEmit.apply(this, args);
        originalEmit.apply(proxy, args);
    };

    this.trigger = triggerEmitPatch;
    this.emit = triggerEmitPatch;

    this.attachAnnotations = function($iframe, spineItem, loadedSpineItems) {
        var iframe = $iframe[0];

        var context = _.extend({
            document: iframe.contentDocument,
            window: iframe.contentWindow,
            iframe: iframe,
            manager: self,
            cssUrl: annotationCSSUrl,
            isFixedLayout: spineItem.isFixedLayout(),
            isRTL: spineItem.spine.isRightToLeft(),
            paginationInfo: function() { return spineItem.paginationInfo; }
            
        }, defaultContext);

        liveAnnotations[spineItem.index] = new HighlightsController(context, {getVisibleCfiRangeFn: options.getVisibleCfiRangeFn});
        spines[spineItem.index] = spineItem;

        // check to see which spine indicies can be culled depending on the currently loaded spine items
        for(var spineIndex in liveAnnotations) {
            if (liveAnnotations.hasOwnProperty(spineIndex) && !_.contains(loadedSpineItems, spines[spineIndex])) {
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

    this.addSelectionHighlight = function(id, type, clearSelection, styles) {
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            if (annotationsForView.getCurrentSelectionCFI()) {
                var annotation = annotationsForView.addSelectionHighlight(
                    id, type, clearSelection, styles);
                return new BookmarkData(spines[spine].idref, annotation.CFI);
            }
        }
        return undefined;
    };

    this.addHighlight = function(spineIdRef, partialCfi, id, type, styles) {
        for(var spine in liveAnnotations) {
            if (spines[spine].idref === spineIdRef) {
                var annotationsForView = liveAnnotations[spine];
                var annotation = annotationsForView.addHighlight(partialCfi, id, type, styles);
                if (annotation) {
                    return new BookmarkData(spineIdRef, annotation.CFI);
                }
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

    this.removeHighlightsByType = function(type) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result  = annotationsForView.removeHighlightsByType(type);
        }
        return result;
    };

    this.getHighlight = function(id) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result  = annotationsForView.getHighlight(id);
            if (result !== undefined)
				return result;
        }
        return result;
    };

    this.updateAnnotation = function(id, type, styles) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.updateAnnotation(id, type, styles);
            if(result) {
                break;
            }
        }
        return result;
    };

    this.replaceAnnotation = function(id, cfi, type, styles) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.replaceAnnotation(id, cfi, type, styles);
            if(result) {
                break;
            }
        }
        return result;
    };

    // redraw gets called on pagination change, so for progressive rendering we may have to add annotations that were previously not visible.
    this.redrawAnnotations = function(){
        for(var spine in liveAnnotations) {
            liveAnnotations[spine].redraw();
        }
    };

    this.updateAnnotationView = function(id, styles) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.updateAnnotationView(id,styles);
            if(result){
                break;
            }
        }
        return result;
    };

    this.setAnnotationViewState = function(id, state, value) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.setAnnotationViewState(id, state, value);
            if(result){
                break;
            }
        }
        return result;
    };

    this.setAnnotationViewStateForAll = function(state, value) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.setAnnotationViewStateForAll(state, value);
            if(result){
                break;
            }
        }
        return result;
    };

    this.cfiIsBetweenTwoCfis = function (cfi, lowBoundaryCfi, highBoundaryCfi) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.cfiIsBetweenTwoCfis(cfi, lowBoundaryCfi, highBoundaryCfi);
            if(result){
                break;
            }
        }
        return result;
    };

    this.contentCfiComparator = function(contCfi1, contCfi2) {
        var result = undefined;
        for(var spine in liveAnnotations) {
            var annotationsForView = liveAnnotations[spine];
            result = annotationsForView.contentCfiComparator(contCfi1, contCfi2);
            if(result){
                break;
            }
        }
        return result;
    };

    function getElementFromViewElement(element) {
        //TODO JC: yuck, we get two different collection structures from non fixed and fixed views.. must refactor..
        return element.element ? element.element : element;
    }

    this.getAnnotationMidpoints = function($elementSpineItemCollection){
        var output = [];

        _.each($elementSpineItemCollection, function (item){
            var annotations = [];

            var lastId = null;

            var baseOffset = {top: 0, left: 0};
            if (item.elements && item.elements.length > 0) {
                var firstElement = getElementFromViewElement(item.elements[0]);
                var offsetElement = firstElement.ownerDocument.defaultView.frameElement.parentElement;
                baseOffset = {top: offsetElement.offsetTop, left: offsetElement.offsetLeft};
            }

            _.each(item.elements, function(element){

                var $element = $(getElementFromViewElement(element));
                var elementId = $element.attr('data-id');

                if(!elementId){
                    console.warn('AnnotationsManager:getAnnotationMidpoints: Got an annotation element with no ID??')
                    return;
                }
                if (elementId === lastId) return;
                lastId = elementId;

                //calculate position offsets with scaling
                var scale = 1;
                //figure out a better way to get the html parent from an element..
                var $html = $element.parent();
                //get transformation scale from content document
                var matrix = HighlightHelpers.getMatrix($html);
                if (matrix) {
                    scale = HighlightHelpers.getScaleFromMatrix(matrix);
                }
                var offset = $element.offset();
                offset.top += baseOffset.top + ($element.height() / 2);
                offset.left += baseOffset.left;
                if(scale !== 1){
                    offset = {top: (offset.top * scale)*(1/scale), left: offset.left };
                }
                var $highlighted = {id: elementId, position: offset, lineHeight: parseInt($element.css('line-height'),10)};
                annotations.push($highlighted)
            });

            output.push({annotations:annotations, spineItem: item.spineItem});
        });

        return output;
    };

    this.getAnnotationsElementSelector = function () {
        return 'div.rd-highlight, div.rd-highlight-border';
    };

};

return HighlightsManager;
});
