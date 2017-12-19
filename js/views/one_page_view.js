//  Created by Boris Schneiderman.
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


define(["../globals", "jquery", "underscore", "eventEmitter", "./cfi_navigation_logic", "../helpers", "../models/viewer_settings", "../models/bookmark_data", "ResizeSensor"],
    function (Globals, $, _, EventEmitter, CfiNavigationLogic, Helpers, ViewerSettings, BookmarkData, ResizeSensor) {

/**
 * Renders one page of fixed layout spread
 *
 * @param options
 * @param classes
 * @param enableBookStyleOverrides
 * @constructor
 */
var OnePageView = function (options, classes, enableBookStyleOverrides, reader) {

    $.extend(this, new EventEmitter());

    var self = this;

    var _$epubHtml;
    var _$epubBody;
    var _$el;
    var _$iframe;
    var _currentSpineItem;
    var _spine = options.spine;
    var _iframeLoader = options.iframeLoader;
    var _navigationLogic = undefined;
    var _bookStyles = options.bookStyles;

    var _$viewport = options.$viewport;

    var _isIframeLoaded = false;

    var _$scaler;

    var _lastBodySize = {
        width: undefined,
        height: undefined
    };

    var PageTransitionHandler = function (opts) {
        var PageTransition = function (begin, end) {
            this.begin = begin;
            this.end = end;
        };

        var _pageTransition_OPACITY = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("transform", "none");

                Helpers.CSSTransition($el, "opacity 150ms ease-out");

                $el.css("opacity", "1");
            }
        );

        var _pageTransition_TRANSLATE = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");

                var elWidth = Math.ceil(meta_width * scale);

                var initialLeft = elWidth * 0.8 * (pageSwitchDir === 2 ? 1 : -1);
                var move = Helpers.CSSTransformString({
                    left: Math.round(initialLeft),
                    origin: "50% 50% 0",
                    enable3D: _enable3D
                });
                $el.css(move);
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "1");

                Helpers.CSSTransition($el, "transform 150ms ease-out");

                $el.css("transform", "none");
            }
        );

        var _pageTransition_ROTATE = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");

                var elWidth = Math.ceil(meta_width * scale);

                var initialLeft = elWidth * 1.7 * (pageSwitchDir === 2 ? 1 : -1);
                var trans = Helpers.CSSTransformString({
                    left: Math.round(initialLeft),
                    angle: (pageSwitchDir === 2 ? -1 : 1) * 30,
                    origin: "50% 50% 0",
                    enable3D: _enable3D
                }); //(pageSwitchDir === 2 ? '0% 0%' : '100% 0%')
                $el.css(trans);
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "1");

                Helpers.CSSTransition($el, "transform 300ms ease-in-out");

                $el.css("transform", "none");
            }
        );

        var _pageTransition_SWING = new PageTransition(
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "0");

                // SUPER HACKY!! (just for demo)
                var isLeft = false;
                var isCenter = false;
                var isRight = false;
                for (var i = 0; i < classes.length; i++) {
                    var c = classes[i].toLowerCase();
                    if (c.indexOf("left") >= 0) {
                        isLeft = true;
                        break;
                    }
                    if (c.indexOf("right") >= 0) {
                        isRight = true;
                        break;
                    }
                    if (c.indexOf("center") >= 0) {
                        isCenter = true;
                        break;
                    }
                }

                var elWidth = Math.ceil(meta_width * scale);

                var initialLeft = elWidth * 0.5 * ((isLeft || isCenter && pageSwitchDir === 1) ? 1 : -1);
                var trans = Helpers.CSSTransformString({
                    scale: 0.2,
                    left: Math.round(initialLeft),
                    angle: ((isLeft || isCenter && pageSwitchDir === 1) ? 1 : -1) * 30,
                    origin: '50% 50% 0',
                    enable3D: _enable3D
                });
                $el.css(trans);
            },
            function (scale, left, top, $el, meta_width, meta_height, pageSwitchDir) {
                $el.css("opacity", "1");

                Helpers.CSSTransition($el, "transform 400ms ease-out");

                $el.css("transform", "none");
            }
        );

        var _pageTransitions = [];
        _pageTransitions.push(_pageTransition_OPACITY); // 0
        _pageTransitions.push(_pageTransition_TRANSLATE); // 1
        _pageTransitions.push(_pageTransition_ROTATE); // 2
        _pageTransitions.push(_pageTransition_SWING); // 3

        var _disablePageTransitions = opts.disablePageTransitions || false;
                
        // TODO: page transitions are broken, sp we disable them to avoid nasty visual artefacts
        _disablePageTransitions = true;

        var _pageTransition = -1;

        var _enable3D = new ViewerSettings({}).enableGPUHardwareAccelerationCSS3D;

        var _viewerSettings = undefined;
        this.updateOptions = function (o) {
            _viewerSettings = o;

            var settings = _viewerSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
                //defaults
                settings = new ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D) {
                _enable3D = true;
            }

            if (o.pageTransition !== null && typeof o.pageTransition !== "undefined") {
                _pageTransition = o.pageTransition;
            }
        };
        this.updateOptions(opts);

        var _pageSwitchDir = 0;
        var _pageSwitchActuallyChanged = false;
        var _pageSwitchActuallyChanged_IFRAME_LOAD = false;

        // dir: 0 => new or same page, 1 => previous, 2 => next
        this.updatePageSwitchDir = function (dir, hasChanged) {
            if (_pageSwitchActuallyChanged_IFRAME_LOAD) {
                return;
            }

            _pageSwitchDir = dir;
            _pageSwitchActuallyChanged = hasChanged;
        };

        this.onIFrameLoad = function () {
            _pageSwitchActuallyChanged_IFRAME_LOAD = true; // second pass, but initial display for transition
        };

        this.transformContentImmediate_BEGIN = function ($el, scale, left, top) {
            var pageSwitchActuallyChanged = _pageSwitchActuallyChanged || _pageSwitchActuallyChanged_IFRAME_LOAD;
            _pageSwitchActuallyChanged_IFRAME_LOAD = false;

            if (_disablePageTransitions || _pageTransition === -1) return;

            Helpers.CSSTransition($el, "all 0 ease 0");

            if (!pageSwitchActuallyChanged) return;

            var pageTransition = (_pageTransition >= 0 && _pageTransition < _pageTransitions.length) ? _pageTransitions[_pageTransition] : undefined;

            if (_pageSwitchDir === 0 || !pageTransition) {
                $el.css("opacity", "0");
            }
            else {
                pageTransition.begin(scale, left, top, $el, self.meta_width(), self.meta_height(), _pageSwitchDir);
            }
        };

        this.transformContentImmediate_END = function ($el, scale, left, top) {
            if (_disablePageTransitions || _pageTransition === -1) {
                $el.css("transform", "none");
                return;
            }

            setTimeout(function () {
                var pageTransition = (_pageTransition >= 0 && _pageTransition < _pageTransitions.length) ? _pageTransitions[_pageTransition] : undefined;

                if (_pageSwitchDir === 0 || !pageTransition) {
                    $el.css("transform", "none");

                    Helpers.CSSTransition($el, "opacity 250ms linear");

                    $el.css("opacity", "1");
                }
                else {
                    pageTransition.end(scale, left, top, $el, self.meta_width(), self.meta_height(), _pageSwitchDir);
                }

            }, 10);
        };
    };
    var _pageTransitionHandler = new PageTransitionHandler(options);


    // fixed layout does not apply user styles to publisher content, but reflowable scroll view does
    var _enableBookStyleOverrides = enableBookStyleOverrides || false;

    var _meta_size = {
        width: 0,
        height: 0
    };

    this.element = function () {
        return _$el;
    };

    this.meta_height = function () {
        return _meta_size.height;
    };

    this.meta_width = function () {
        return _meta_size.width;
    };

    this.isDisplaying = function () {

        return _isIframeLoaded; //_$iframe && _$iframe[0] && _$epubHtml
    };

    this.render = function () {

        var template = Helpers.loadTemplate("single_page_frame", {});

        _$el = $(template);

        _$scaler = $("#scaler", _$el);

        Helpers.CSSTransition(_$el, "all 0 ease 0");

        _$el.css("transform", "none");

        var settings = reader.viewerSettings();
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
            //defaults
            settings = new ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {

            // This fixes rendering issues with WebView (native apps), which crops content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
            _$el.css("transform", "translateZ(0)");
        }

        _$el.css("height", "100%");
        _$el.css("width", "100%");

        for (var i = 0, count = classes.length; i < count; i++) {
            _$el.addClass(classes[i]);
        }

        _$iframe = $("iframe", _$el);

        return this;
    };


    this.decorateIframe = function () {
        if (!_$iframe || !_$iframe.length) return;

        _$iframe.css("border-bottom", "1px dashed silver");
        _$iframe.css("border-top", "1px dashed silver");
    };

    this.remove = function () {
        this.clear();
        
        _currentSpineItem = undefined;
        
        if (_$el && _$el[0]) {
            _$el.remove();
        }
        
        _$el = undefined;
        _$scaler = undefined;
        _$iframe = undefined;
    };

    this.clear = function () {
        _isIframeLoaded = false;
        
        if (_$iframe && _$iframe[0]) {
            _$iframe[0].src = "";
        }
    };

    this.currentSpineItem = function () {

        return _currentSpineItem;
    };

    function onIFrameLoad(success) {

        if (success) {
            _isIframeLoaded = true;
            var epubContentDocument = _$iframe[0].contentDocument;
            _$epubHtml = $("html", epubContentDocument);
            if (!_$epubHtml || _$epubHtml.length == 0) {
                _$epubHtml = $("svg", epubContentDocument);
                _$epubBody = undefined;
            } else {
                _$epubBody = $("body", _$epubHtml);

                if (!_enableBookStyleOverrides) { // fixed layout
                    _$epubBody.css("margin", "0"); // ensures 8px margin default user agent stylesheet is reset to zero
                }
            }

            //_$epubHtml.css("overflow", "hidden");

            if (_enableBookStyleOverrides) { // not fixed layout (reflowable in scroll view)
                self.applyBookStyles();
            }

            updateMetaSize();

            initResizeSensor();

            _pageTransitionHandler.onIFrameLoad();
        }
    }

    function initResizeSensor() {

        if (_$epubBody // undefined with SVG spine items
            && _enableBookStyleOverrides // not fixed layout (reflowable in scroll view)
            ) {

            var bodyElement = _$epubBody[0];
            if (bodyElement.resizeSensor) {
                return;
            }

            // We need to make sure the content has indeed be resized, especially
            // the first time it is triggered
            _lastBodySize.width = $(bodyElement).width();
            _lastBodySize.height = $(bodyElement).height();

            bodyElement.resizeSensor = new ResizeSensor(bodyElement, function() {

                var newBodySize = {
                    width: $(bodyElement).width(),
                    height: $(bodyElement).height()
                };

                console.debug("OnePageView content resized ...", newBodySize.width, newBodySize.height, _currentSpineItem.idref);
                
                if (newBodySize.width != _lastBodySize.width || newBodySize.height != _lastBodySize.height) {
                    _lastBodySize.width = newBodySize.width;
                    _lastBodySize.height = newBodySize.height;

                    console.debug("... updating pagination.");

                    var src = _spine.package.resolveRelativeUrl(_currentSpineItem.href);

                    Globals.logEvent("OnePageView.Events.CONTENT_SIZE_CHANGED", "EMIT", "one_page_view.js [ " + _currentSpineItem.href + " -- " + src + " ]");
                    
                    self.emit(OnePageView.Events.CONTENT_SIZE_CHANGED, _$iframe, _currentSpineItem);
                    
                    //updatePagination();
                } else {
                    console.debug("... ignored (identical dimensions).");
                }
            });
        }
    }
    
    var _viewSettings = undefined;
    this.setViewSettings = function (settings, docWillChange) {

        _viewSettings = settings;

        if (_enableBookStyleOverrides  // not fixed layout (reflowable in scroll view)
            && !docWillChange) {
            self.applyBookStyles();
        }

        updateMetaSize();

        _pageTransitionHandler.updateOptions(settings);
    };

    function updateHtmlFontInfo() {

        if (!_enableBookStyleOverrides) return;  // fixed layout (not reflowable in scroll view)

        if (_$epubHtml && _viewSettings) {
            var i = _viewSettings.fontSelection;
            var useDefault = !reader.fonts || !reader.fonts.length || i <= 0 || (i-1) >= reader.fonts.length;
            var font = (useDefault ?
                        {} :
                        reader.fonts[i - 1]);
            Helpers.UpdateHtmlFontAttributes(_$epubHtml, _viewSettings.fontSize, font, function() {});
        }
    }

    this.applyBookStyles = function () {

        if (!_enableBookStyleOverrides) return;  // fixed layout (not reflowable in scroll view)

        if (_$epubHtml) {
            Helpers.setStyles(_bookStyles.getStyles(), _$epubHtml);
            updateHtmlFontInfo();
        }
    };

    //this is called by scroll_view for fixed spine item
    this.scaleToWidth = function (width) {

        if (_enableBookStyleOverrides) return;  // not fixed layout (reflowable in scroll view)

        if (_meta_size.width <= 0) return; // resize event too early!

        var scale = width / _meta_size.width;
        self.transformContentImmediate(scale, 0, 0);
    };

    //this is called by scroll_view for reflowable spine item
    this.resizeIFrameToContent = function () {
        var contHeight = getContentDocHeight();
        //console.log("resizeIFrameToContent: " + contHeight);

        self.setHeight(contHeight);

        self.showIFrame();
    };

    this.setHeight = function (height) {

        _$scaler.css("height", height + "px");
        _$el.css("height", height + "px");

//        _$iframe.css("height", height + "px");
    };

    var _useCSSTransformToHideIframe = true;

    this.showIFrame = function () {

        _$iframe.css("visibility", "visible");

        if (_useCSSTransformToHideIframe) {
            _$iframe.css("transform", "none");

            var enable3D = false;
            var settings = _viewSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
                //defaults
                settings = new ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D) {
                enable3D = true;
                _$iframe.css("transform", "translateZ(0)");
            }
        }
        else {
            _$iframe.css({left: "0px", top: "0px"});
        }
    };

    this.hideIFrame = function () {

        _$iframe.css("visibility", "hidden");

        // With some books, despite the iframe and its containing div wrapper being hidden,
        // the iframe's contentWindow / contentDocument is still visible!
        // Thus why we translate the iframe out of view instead.

        if (_useCSSTransformToHideIframe) {
            var enable3D = false;
            var settings = _viewSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
                //defaults
                settings = new ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D) {
                enable3D = true;
            }

            var css = Helpers.CSSTransformString({left: "10000", top: "10000", enable3D: enable3D});
            _$iframe.css(css);
        }
        else {
            _$iframe.css({left: "10000px", top: "10000px"});
        }
    };

    function getContentDocHeight() {

        if (!_$iframe || !_$iframe.length) {
            return 0;
        }

        if (Helpers.isIframeAlive(_$iframe[0])) {
            var win = _$iframe[0].contentWindow;
            var doc = _$iframe[0].contentDocument;

            var height = Math.round(parseFloat(win.getComputedStyle(doc.documentElement).height)); //body can be shorter!
            return height;
        }
        else if (_$epubHtml) {
            console.error("getContentDocHeight ??");

            var jqueryHeight = _$epubHtml.height();
            return jqueryHeight;
        }

        return 0;
    }

    // dir: 0 => new or same page, 1 => previous, 2 => next
    this.updatePageSwitchDir = function (dir, hasChanged) {
        _pageTransitionHandler.updatePageSwitchDir(dir, hasChanged);
    };


    this.transformContentImmediate = function (scale, left, top) {

        if (_enableBookStyleOverrides) return;  // not fixed layout (reflowable in scroll view)

        var elWidth = Math.ceil(_meta_size.width * scale);
        var elHeight = Math.floor(_meta_size.height * scale);

        _pageTransitionHandler.transformContentImmediate_BEGIN(_$el, scale, left, top);

        _$el.css("left", left + "px");
        _$el.css("top", top + "px");
        _$el.css("width", elWidth + "px");
        _$el.css("height", elHeight + "px");

        if (!_$epubHtml) {
//                  debugger;
            return;
        }

        var enable3D = false;
        var settings = _viewSettings;
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined") {
            //defaults
            settings = new ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {
            enable3D = true;
        }
        
        if (_$epubBody // not SVG spine item (otherwise fails in Safari OSX)
            && reader.needsFixedLayoutScalerWorkAround()) {

            var css1 = Helpers.CSSTransformString({scale: scale, enable3D: enable3D});
            
            // See https://github.com/readium/readium-shared-js/issues/285 
            css1["min-width"] = _meta_size.width;
            css1["min-height"] = _meta_size.height;
            
            _$epubHtml.css(css1);

            // Ensures content dimensions matches viewport meta (authors / production tools should do this in their CSS...but unfortunately some don't).
            if (_$epubBody && _$epubBody.length) {
                _$epubBody.css({width:_meta_size.width, height:_meta_size.height});
            }

            var css2 = Helpers.CSSTransformString({scale : 1, enable3D: enable3D});
            css2["width"] = _meta_size.width * scale;
            css2["height"] = _meta_size.height * scale;

            _$scaler.css(css2);
        }
        else {
            var css = Helpers.CSSTransformString({scale: scale, enable3D: enable3D});
            css["width"] = _meta_size.width;
            css["height"] = _meta_size.height;
            _$scaler.css(css);
        }

        // Chrome workaround: otherwise text is sometimes invisible (probably a rendering glitch due to the 3D transform graphics backend?)
        //_$epubHtml.css("visibility", "hidden"); // "flashing" in two-page spread mode is annoying :(
        _$epubHtml.css("opacity", "0.999");

        self.showIFrame();

        setTimeout(function () {
            //_$epubHtml.css("visibility", "visible");
            _$epubHtml.css("opacity", "1");
        }, 0);
        
        // TODO: the CSS transitions do not work anymore, tested on Firefox and Chrome.
        // The line of code below still needs to be invoked, but the logic in _pageTransitionHandler probably need adjusting to work around the animation timing issue.
        // PS: opacity=1 above seems to interfere with the fade-in transition, probably a browser issue with mixing inner-iframe effects with effects applied to the iframe parent/ancestors.
        _pageTransitionHandler.transformContentImmediate_END(_$el, scale, left, top);
    };

    this.getCalculatedPageHeight = function () {
        return _$el.height();
    };

    this.transformContent = _.bind(_.debounce(this.transformContentImmediate, 50), self);

    function updateMetaSize() {

        _meta_size.width = 0;
        _meta_size.height = 0;

        if (_enableBookStyleOverrides) return; // not fixed layout (reflowable in scroll view)

        var size = undefined;

        var isFallbackDimension = false;
        var widthPercent = undefined;
        var heightPercent = undefined;

        var contentDocument = _$iframe[0].contentDocument;

        // first try to read viewport size
        var content = $('meta[name=viewport]', contentDocument).attr("content");

        // if not found try viewbox (used for SVG)
        if (!content) {
            content = $('meta[name=viewbox]', contentDocument).attr("content");
        }

        if (content) {
            size = parseMetaSize(content);
        }

        if (!size) {

            //var $svg = $(contentDocument).find('svg');
            // if($svg.length > 0) {
            if (contentDocument && contentDocument.documentElement && contentDocument.documentElement.nodeName && contentDocument.documentElement.nodeName.toLowerCase() == "svg") {

                var width = undefined;
                var height = undefined;

                var wAttr = contentDocument.documentElement.getAttribute("width");
                var isWidthPercent = wAttr && wAttr.length >= 1 && wAttr[wAttr.length - 1] == '%';
                if (wAttr) {
                    try {
                        width = parseInt(wAttr, 10);
                    }
                    catch (err) {}
                }
                if (width && isWidthPercent) {
                    widthPercent = width;
                    width = undefined;
                }

                var hAttr = contentDocument.documentElement.getAttribute("height");
                var isHeightPercent = hAttr && hAttr.length >= 1 && hAttr[hAttr.length - 1] == '%';
                if (hAttr) {
                    try {
                        height = parseInt(hAttr, 10);
                    }
                    catch (err) {}
                }
                if (height && isHeightPercent) {
                    heightPercent = height;
                    height = undefined;
                }

                if (width && height) {
                    size = {
                        width: width,
                        height: height
                    }
                }
                else {
                    /// DISABLED (not a satisfactory fallback)
                    // content = $svg.attr('viewBox');
                    // if(content) {
                    //     size = parseViewBoxSize(content);
                    // }
                    //
                    // if (size) {
                    //     console.warn("Viewport SVG: using viewbox!");
                    // }
                }
            }
        }

        if (!size && _currentSpineItem) {
            content = _currentSpineItem.getRenditionViewport();

            if (content) {
                size = parseMetaSize(content);
                if (size) {
                    console.log("Viewport: using rendition:viewport dimensions");
                }
            }
        }

        if (!size) {
            // Image fallback (auto-generated HTML template when WebView / iFrame is fed with image media type)
            var $img = $(contentDocument).find('img');
            if ($img.length > 0) {
                size = {
                    width: $img.width(),
                    height: $img.height()
                };

                var isImage = _currentSpineItem && _currentSpineItem.media_type && _currentSpineItem.media_type.length && _currentSpineItem.media_type.indexOf("image/") == 0;
                if (!isImage) {
                    console.warn("Viewport: using img dimensions!");
                }
            }
            else {
                $img = $(contentDocument).find('image');
                if ($img.length > 0) {
                    var width = undefined;
                    var height = undefined;

                    var wAttr = $img[0].getAttribute("width");
                    if (wAttr) {
                        try {
                            width = parseInt(wAttr, 10);
                        }
                        catch (err) {}
                    }
                    var hAttr = $img[0].getAttribute("height");
                    if (hAttr) {
                        try {
                            height = parseInt(hAttr, 10);
                        }
                        catch (err) {}
                    }


                    if (width && height) {
                        size = {
                            width: width,
                            height: height
                        };

                        isFallbackDimension = true;

                        console.warn("Viewport: using image dimensions!");
                    }
                }
            }
        }

        if (!size) {
            // Not a great fallback, as it has the aspect ratio of the full window, but it is better than no display at all.
            width = _$viewport.width();
            height = _$viewport.height();

            // hacky method to determine the actual available horizontal space (half the two-page spread is a reasonable approximation, this means that whatever the size of the other iframe / one_page_view, the aspect ratio of this one exactly corresponds to half the viewport rendering surface)
            var isTwoPageSyntheticSpread = $("iframe.iframe-fixed", _$viewport).length > 1;
            if (isTwoPageSyntheticSpread) width *= 0.5;

            // the original SVG width/height might have been specified as a percentage of the containing viewport
            if (widthPercent) {
                width *= (widthPercent / 100);
            }
            if (heightPercent) {
                height *= (heightPercent / 100);
            }

            size = {
                width: width,
                height: height
            };

            isFallbackDimension = true;

            console.warn("Viewport: using browser / e-reader viewport dimensions!");
        }

        if (size) {
            _meta_size.width = size.width;
            _meta_size.height = size.height;

            // Not strictly necessary, let's preserve the percentage values
            // if (isFallbackDimension && contentDocument && contentDocument.documentElement && contentDocument.documentElement.nodeName && contentDocument.documentElement.nodeName.toLowerCase() == "svg") {
            //     contentDocument.documentElement.setAttribute("width", size.width + "px");
            //     contentDocument.documentElement.setAttribute("height", size.height + "px");
            // }
        }
    }

    function onUnload (spineItem) {
        if (spineItem) {
            
            Globals.logEvent("CONTENT_DOCUMENT_UNLOADED", "EMIT", "one_page_view.js [ " + spineItem.href + " ]");
            self.emit(Globals.Events.CONTENT_DOCUMENT_UNLOADED, _$iframe, spineItem);
        }
    }

    this.onUnload = function () {
        onUnload(_currentSpineItem);
    };

    //expected callback signature: function(success, $iframe, spineItem, isNewlyLoaded, context)
    this.loadSpineItem = function (spineItem, callback, context) {

        if (_currentSpineItem != spineItem) {

            var prevSpineItem = _currentSpineItem;
            _currentSpineItem = spineItem;
            var src = _spine.package.resolveRelativeUrl(spineItem.href);

            // both fixed layout and reflowable documents need hiding due to flashing during layout/rendering
            //hide iframe until content is scaled
            self.hideIFrame();

            onUnload(prevSpineItem);


            Globals.logEvent("OnePageView.Events.SPINE_ITEM_OPEN_START", "EMIT", "one_page_view.js [ " + spineItem.href + " -- " + src + " ]");
            self.emit(OnePageView.Events.SPINE_ITEM_OPEN_START, _$iframe, _currentSpineItem);
            
            _iframeLoader.loadIframe(_$iframe[0], src, function (success) {

                if (success && callback) {
                    var func = function () {
                        callback(success, _$iframe, _currentSpineItem, true, context);
                    };

                    if (Helpers.isIframeAlive(_$iframe[0])) {
                        onIFrameLoad(success); // applies styles

                        func();
                    }
                    else {
                        console.error("onIFrameLoad !! doc && win + TIMEOUT");
                        console.debug(spineItem.href);

                        onIFrameLoad(success);

                        setTimeout(func, 500);
                    }
                }
                else {
                    onIFrameLoad(success);
                }

            }, self, {spineItem: _currentSpineItem});
        }
        else {
            if (callback) {
                callback(true, _$iframe, _currentSpineItem, false, context);
            }
        }
    };
    //
    // function parseViewBoxSize(viewBoxString) {
    //
    //     var parts = viewBoxString.split(' ');
    //
    //     if(parts.length < 4) {
    //         console.warn(viewBoxString + " value is not valid viewBox size")
    //         return undefined;
    //     }
    //
    //     var width = parseInt(parts[2]);
    //     var height = parseInt(parts[3]);
    //
    //     if(!isNaN(width) && !isNaN(height)) {
    //         return { width: width, height: height} ;
    //     }
    //
    //     return undefined;
    // }

    function parseMetaSize(content) {

        var pairs = content.replace(/\s/g, '').split(",");

        var dict = {};

        for (var i = 0; i < pairs.length; i++) {
            var nameVal = pairs[i].split("=");
            if (nameVal.length == 2) {

                dict[nameVal[0]] = nameVal[1];
            }
        }

        var width = Number.NaN;
        var height = Number.NaN;

        if (dict["width"]) {
            width = parseInt(dict["width"]);
        }

        if (dict["height"]) {
            height = parseInt(dict["height"]);
        }

        if (!isNaN(width) && !isNaN(height)) {
            return {width: width, height: height};
        }

        return undefined;
    }

    function getVisibleContentOffsets() {
        return {
            top: -_$el.parent().scrollTop(),
            left: 0
        };
    }
    
    function getFrameDimensions() {
        if (reader.needsFixedLayoutScalerWorkAround()) {
            var parentEl = _$el.parent()[0];
            return {
                width: parentEl.clientWidth,
                height: parentEl.clientHeight
            };
        }
        return {
            width: _meta_size.width,
            height: _meta_size.height
        };
    }
    
    this.getNavigator = function () {
        return new CfiNavigationLogic({
            $iframe: _$iframe,
            frameDimensionsGetter: getFrameDimensions,
            visibleContentOffsetsGetter: getVisibleContentOffsets,
            classBlacklist: ["cfi-marker", "mo-cfi-highlight", "resize-sensor", "resize-sensor-expand", "resize-sensor-shrink", "resize-sensor-inner", "js-hypothesis-config", "js-hypothesis-embed"],
            elementBlacklist: ["hypothesis-adder"],
            idBlacklist: ["MathJax_Message", "MathJax_SVG_Hidden"]
        });
    };

    this.getElementByCfi = function (spineItemIdref, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if (spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();
        return navigation.getElementByCfi(cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getElementById = function (spineItemIdref, id) {

        if (spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();
        return navigation.getElementById(id);
    };

    this.getElement = function (spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();
        return navigation.getElement(selector);
    };

    this.getFirstVisibleMediaOverlayElement = function() {
        var navigation = self.getNavigator();
        return navigation.getFirstVisibleMediaOverlayElement();
    };

    this.offset = function () {
        if (_$iframe) {
            return _$iframe.offset();
        }
        return undefined;
    };

    this.getVisibleElementsWithFilter = function (filterFunction) {
        var navigation = self.getNavigator();
        var elements = navigation.getVisibleElementsWithFilter(null, filterFunction);
        return elements;
    };

    this.getVisibleElements = function (selector) {

        var navigation = self.getNavigator();
        var elements = navigation.getAllVisibleElementsWithSelector(selector);
        return elements;
    };

    this.getAllElementsWithFilter = function (filterFunction, outsideBody) {
        var navigation = self.getNavigator();
        var elements = navigation.getAllElementsWithFilter(filterFunction, outsideBody);
        return elements;
    };

    this.getElements = function(spineItemIdref, selector) {

        if(spineItemIdref != _currentSpineItem.idref) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = self.getNavigator();

        return navigation.getElements(selector);
    };

    this.getNodeRangeInfoFromCfi = function (spineIdRef, partialCfi) {
        if (spineIdRef != _currentSpineItem.idref) {
            console.warn("spine item is not loaded");
            return undefined;
        }
        var navigation = self.getNavigator();

        return navigation.getNodeRangeInfoFromCfi(partialCfi);
    };

    function createBookmarkFromCfi(cfi) {
        if (!_currentSpineItem) {
            return null;
        }

        return new BookmarkData(_currentSpineItem.idref, cfi);
    }

    this.getLoadedContentFrames = function () {
        return [{spineItem: _currentSpineItem, $iframe: _$iframe}];
    };

    this.getFirstVisibleCfi = function (visibleContentOffsets, frameDimensions) {
        return createBookmarkFromCfi(self.getNavigator().getFirstVisibleCfi(visibleContentOffsets, frameDimensions));
    };

    this.getLastVisibleCfi = function (visibleContentOffsets, frameDimensions) {
        return createBookmarkFromCfi(self.getNavigator().getLastVisibleCfi(visibleContentOffsets, frameDimensions));
    };

    this.getDomRangeFromRangeCfi = function (rangeCfi, rangeCfi2, inclusive) {
        return self.getNavigator().getDomRangeFromRangeCfi(rangeCfi, rangeCfi2, inclusive);
    };

    this.getRangeCfiFromDomRange = function (domRange) {
        return createBookmarkFromCfi(self.getNavigator().getRangeCfiFromDomRange(domRange));
    };

    this.getVisibleCfiFromPoint = function (x, y, precisePoint) {
        return createBookmarkFromCfi(self.getNavigator().getVisibleCfiFromPoint(x, y, precisePoint));
    };

    this.getRangeCfiFromPoints = function(startX, startY, endX, endY) {
        return createBookmarkFromCfi(self.getNavigator().getRangeCfiFromPoints(startX, startY, endX, endY));
    };

    this.getCfiForElement = function(element) {
        return createBookmarkFromCfi(self.getNavigator().getCfiForElement(element));
    };

    this.getElementFromPoint = function (x, y) {
        return self.getNavigator().getElementFromPoint(x, y);
    };

    this.getStartCfi = function () {
        return createBookmarkFromCfi(self.getNavigator().getStartCfi());
    };

    this.getEndCfi = function () {
        return createBookmarkFromCfi(self.getNavigator().getEndCfi());
    };

    this.getNearestCfiFromElement = function(element) {
        return createBookmarkFromCfi(self.getNavigator().getNearestCfiFromElement(element));
    };
};

OnePageView.Events = {
    SPINE_ITEM_OPEN_START: "SpineItemOpenStart",
    CONTENT_SIZE_CHANGED: "ContentSizeChanged"
};
return OnePageView;
});
