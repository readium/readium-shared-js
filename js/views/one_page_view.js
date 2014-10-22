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


/*
 * Renders one page of fixed layout spread
 * @class ReadiumSDK.Views.OnePageView
 */

//Representation of one fixed page
ReadiumSDK.Views.OnePageView = function(options, classes, enableBookStyleOverrides, reader){

    _.extend(this, Backbone.Events);

    var self = this;

    var _$epubHtml;
    var _$el;
    var _$iframe;
    var _currentSpineItem;
    var _spine = options.spine;
    var _iframeLoader = options.iframeLoader;
    var _bookStyles = options.bookStyles;

    var _$viewport = options.$viewport;
    
    var _isIframeLoaded = false;

    var _$scaler;

    var PageTransitionHandler = function(opts)
    {
        var PageTransition = function(begin, end)
        {
            this.begin = begin;
            this.end = end;
        };
        
        var _pageTransition_OPACITY = new PageTransition(
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {
                $el.css("opacity", "0");
            },
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {
                $el.css("transform", "none");
                
                var css = {};
                _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) { // NOTE THAT empty '' must be the FIRST prefix!!
                    css[prefix + "transition"] = "opacity 150ms ease-out";
                });
                $el.css(css);

                $el.css("opacity", "1");
            }
        );
        
        var _pageTransition_TRANSLATE = new PageTransition(
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {
                $el.css("opacity", "0");
                
                var elWidth = Math.ceil(meta_width * scale);
                
                var initialLeft = elWidth * 0.8 * (pageSwitchDir === 2 ? 1 : -1);
                var move = ReadiumSDK.Helpers.CSSTransformString({left: Math.round(initialLeft), origin: "50% 50% 0", enable3D: _enable3D});
                $el.css(move);
            },
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {
                $el.css("opacity", "1");
                
                var css = {};
                _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) { // NOTE THAT empty '' must be the FIRST prefix!!
                    css[prefix + "transition"] = prefix + "transform 150ms ease-out";
                });
                $el.css(css);

                //$el.css("-webkit-transition", "-webkit-transform 200ms ease-out");
                
                $el.css("transform", "none");
            }
        );
        
        var _pageTransition_ROTATE = new PageTransition(
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {
                $el.css("opacity", "0");

                var elWidth = Math.ceil(meta_width * scale);

                var initialLeft = elWidth * 1.7 * (pageSwitchDir === 2 ? 1 : -1);
                var trans = ReadiumSDK.Helpers.CSSTransformString({left: Math.round(initialLeft), angle: (pageSwitchDir === 2 ? -1 : 1) * 30, origin: "50% 50% 0", enable3D: _enable3D}); //(pageSwitchDir === 2 ? '0% 0%' : '100% 0%')
                $el.css(trans);
            },
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {
                $el.css("opacity", "1");
                
                var css = {};
                _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) { // NOTE THAT empty '' must be the FIRST prefix!!
                    css[prefix + "transition"] = prefix + "transform 300ms ease-in-out";
                });
                $el.css(css);

                //$el.css("-webkit-transition", "-webkit-transform 200ms ease-out");
                
                $el.css("transform", "none");
            }
        );
        
        var _pageTransition_SWING = new PageTransition(
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {            
                $el.css("opacity", "0");
                
                // SUPER HACKY!! (just for demo)
                var isLeft = false;
                var isCenter = false;
                var isRight = false;
                for (var i = 0; i < classes.length; i++)
                {
                    var c = classes[i].toLowerCase();
                    if (c.indexOf("left") >= 0)
                    {
                        isLeft = true;
                        break;
                    }
                    if (c.indexOf("right") >= 0)
                    {
                        isRight = true;
                        break;
                    }
                    if (c.indexOf("center") >= 0)
                    {
                        isCenter = true;
                        break;
                    }
                }
                
                var elWidth = Math.ceil(meta_width * scale);
                
                var initialLeft = elWidth * 0.5 * ((isLeft || isCenter && pageSwitchDir === 1) ? 1 : -1);
                var trans = ReadiumSDK.Helpers.CSSTransformString({scale: 0.2, left: Math.round(initialLeft), angle: ((isLeft || isCenter && pageSwitchDir === 1) ? 1 : -1) * 30, origin: '50% 50% 0', enable3D: _enable3D});
                $el.css(trans);
            },
            function(scale, left, top, $el, meta_width, meta_height, pageSwitchDir)
            {
                $el.css("opacity", "1");
                
                var css = {};
                _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) { // NOTE THAT empty '' must be the FIRST prefix!!
                    css[prefix + "transition"] = prefix + "transform 400ms ease-out";
                });
                $el.css(css);

                //$el.css("-webkit-transition", "-webkit-transform 200ms ease-out");
                
                $el.css("transform", "none");
            }
        );
        
        var _pageTransitions = [];
        _pageTransitions.push(_pageTransition_OPACITY); // 0
        _pageTransitions.push(_pageTransition_TRANSLATE); // 1
        _pageTransitions.push(_pageTransition_ROTATE); // 2
        _pageTransitions.push(_pageTransition_SWING); // 3
        
        var _disablePageTransitions = opts.disablePageTransitions || false;

        var _pageTransition = -1;

        var _enable3D = new ReadiumSDK.Models.ViewerSettings({}).enableGPUHardwareAccelerationCSS3D;
        
        var _viewerSettings = undefined;
        this.updateOptions = function(o)
        {
            _viewerSettings = o;
        
            var settings = _viewerSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
            {
                //defaults
                settings = new ReadiumSDK.Models.ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D)
            {
                _enable3D = true;
            }
            
            if (o.pageTransition !== null && typeof o.pageTransition !== "undefined")
            {
                _pageTransition = o.pageTransition;
            }
        };
        this.updateOptions(opts);
        
        var _pageSwitchDir = 0;
        var _pageSwitchActuallyChanged = false;
        var _pageSwitchActuallyChanged_IFRAME_LOAD = false;

        // dir: 0 => new or same page, 1 => previous, 2 => next
        this.updatePageSwitchDir = function(dir, hasChanged)
        {
            if (_pageSwitchActuallyChanged_IFRAME_LOAD)
            {
                return;
            }
            
            _pageSwitchDir = dir;
            _pageSwitchActuallyChanged = hasChanged;
        };
        
        this.onIFrameLoad = function()
        {
            _pageSwitchActuallyChanged_IFRAME_LOAD = true; // second pass, but initial display for transition
        };
        
        this.transformContentImmediate_BEGIN = function($el, scale, left, top)
        {
            var pageSwitchActuallyChanged = _pageSwitchActuallyChanged || _pageSwitchActuallyChanged_IFRAME_LOAD;
            _pageSwitchActuallyChanged_IFRAME_LOAD = false;

            if (_disablePageTransitions || _pageTransition === -1) return;

            var css = {};
            _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) { // NOTE THAT empty '' must be the FIRST prefix!!
                css[prefix + "transition"] = "all 0 ease 0";
            });
            $el.css(css);

            if (!pageSwitchActuallyChanged) return;

            var pageTransition = (_pageTransition >= 0 && _pageTransition < _pageTransitions.length) ? _pageTransitions[_pageTransition] : undefined;

            if (_pageSwitchDir === 0 || !pageTransition)
            {
                $el.css("opacity", "0");
            }
            else
            {
                pageTransition.begin(scale, left, top, $el, self.meta_width(), self.meta_height(), _pageSwitchDir);
            }
        };
        
        this.transformContentImmediate_END = function($el, scale, left, top)
        {
            if (_disablePageTransitions || _pageTransition === -1)
            {
                $el.css("transform", "none");
                return;
            }
        
            setTimeout(function()
            {
                var pageTransition = (_pageTransition >= 0 && _pageTransition < _pageTransitions.length) ? _pageTransitions[_pageTransition] : undefined;

                if (_pageSwitchDir === 0 || !pageTransition)
                {
                    $el.css("transform", "none");
                    
                    var css = {};
                    _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) {// NOTE THAT empty '' must be the FIRST prefix!!
                        css[prefix + "transition"] = "opacity 250ms linear";
                    });
                    $el.css(css);

                    $el.css("opacity", "1");
                }
                else
                {
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
    
    this.element = function() {
        return _$el;
    };

    this.meta_height = function() {
        return _meta_size.height;
    };

    this.meta_width = function() {
        return _meta_size.width;
    };

    this.isDisplaying = function() {

        return _isIframeLoaded;
    };

    this.render = function() {

        var template = ReadiumSDK.Helpers.loadTemplate("single_page_frame", {});

        _$el = $(template);
        
        _$scaler = $("#scaler", _$el);
    
        _.each(['', '-webkit-', '-moz-', '-ms-'], function(prefix) {// NOTE THAT empty '' must be the FIRST prefix!!
            _$el.css(prefix + "transition", "all 0 ease 0");
        });
        
        _$el.css("transform", "none");
    
        var settings = reader.viewerSettings();
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
        {
            //defaults
            settings = new ReadiumSDK.Models.ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D) {

            // This fixes rendering issues with WebView (native apps), which crops content embedded in iframes unless GPU hardware acceleration is enabled for CSS rendering.
            _$el.css("transform", "translateZ(0)");
        }
    
        _$el.css("height", "100%");
        _$el.css("width", "100%");

        for(var i = 0, count = classes.length; i < count; i++) {
            _$el.addClass(classes[i]);
        }

        _$iframe = $("iframe", _$el);
    
        return this;
    };


    this.decorateIframe = function()
    {
        if (!_$iframe || !_$iframe.length) return;
        
        _$iframe.css("border-bottom", "1px dashed silver");
        _$iframe.css("border-top", "1px dashed silver");
    }
    
    this.remove = function() {
        _isIframeLoaded = false;
        _currentSpineItem = undefined;
        _$el.remove();
    };

    this.clear = function() {
        _isIframeLoaded = false;
        _$iframe[0].src = "";
    };

    this.currentSpineItem = function() {

        return _currentSpineItem;
    };

    function onIFrameLoad(success) {

        if(success) {
            _isIframeLoaded = true;
            var epubContentDocument = _$iframe[0].contentDocument;
            _$epubHtml = $("html", epubContentDocument);
            if (!_$epubHtml || _$epubHtml.length == 0) {
                _$epubHtml = $("svg", epubContentDocument);
            }
            
            //_$epubHtml.css("overflow", "hidden");

            if (_enableBookStyleOverrides) {
                self.applyBookStyles();
            }
            
            updateMetaSize();

            _pageTransitionHandler.onIFrameLoad();
        }
    }

    var _viewSettings = undefined;
    this.setViewSettings = function(settings) {
        
        _viewSettings = settings;

        if (_enableBookStyleOverrides) {
            self.applyBookStyles();
        }
        
        updateMetaSize();

        _pageTransitionHandler.updateOptions(settings);
    };

    function updateHtmlFontSize() {
        
        if (!_enableBookStyleOverrides) return;
        
        if(_$epubHtml && _viewSettings) {
            ReadiumSDK.Helpers.UpdateHtmlFontSize(_$epubHtml, _viewSettings.fontSize);
        }
    }

    this.applyBookStyles = function() {
        
        if (!_enableBookStyleOverrides) return;
        
        if(_$epubHtml) {
            ReadiumSDK.Helpers.setStyles(_bookStyles.getStyles(), _$epubHtml);
            updateHtmlFontSize();
        }
    };

    //this is called by scroll_view for fixed spine item
    this.scaleToWidth = function(width) {

        if (_meta_size.width <= 0) return; // resize event too early!

        var scale = width / _meta_size.width;
        self.transformContentImmediate(scale, 0, 0);
    };

    //this is called by scroll_view for reflowable spine item
    this.resizeIFrameToContent = function() {
        var contHeight = getContentDocHeight();
        //console.log("resizeIFrameToContent: " + contHeight);

        self.setHeight(contHeight);

        self.showIFrame();
    };
    
    this.setHeight = function(height) {

        _$scaler.css("height", height + "px");
        _$el.css("height", height + "px");

//        _$iframe.css("height", height + "px");
    };

    var _useCSSTransformToHideIframe = true;

    this.showIFrame = function() {

        _$iframe.css("visibility", "visible");
        
        if (_useCSSTransformToHideIframe)
        {
            _$iframe.css("transform", "none");

            var enable3D = false;
            var settings = _viewSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
            {
                //defaults
                settings = new ReadiumSDK.Models.ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D)
            {
                enable3D = true;
                _$iframe.css("transform", "translateZ(0)");
            }
        }
        else
        {
            _$iframe.css({left: "0px", top: "0px"});
        }
    };

    this.hideIFrame = function() {

        _$iframe.css("visibility", "hidden");
        
        // With some books, despite the iframe and its containing div wrapper being hidden,
        // the iframe's contentWindow / contentDocument is still visible!
        // Thus why we translate the iframe out of view instead.
        
        if (_useCSSTransformToHideIframe)
        {
            var enable3D = false;
            var settings = _viewSettings;
            if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
            {
                //defaults
                settings = new ReadiumSDK.Models.ViewerSettings({});
            }
            if (settings.enableGPUHardwareAccelerationCSS3D)
            {
                enable3D = true;
            }

            var css = ReadiumSDK.Helpers.CSSTransformString({left: "10000", top: "10000", enable3D: enable3D});
            _$iframe.css(css);
        }
        else
        {
            _$iframe.css({left: "10000px", top: "10000px"});
        }
    };

    function getContentDocHeight(){

        if(!_$iframe || !_$iframe.length) {
            return 0;
        }
        
        if (ReadiumSDK.Helpers.isIframeAlive(_$iframe[0]))
        {
            var win = _$iframe[0].contentWindow;
            var doc = _$iframe[0].contentDocument;
            
            var height = Math.round(parseFloat(win.getComputedStyle(doc.documentElement).height)); //body can be shorter!
            return height;
        }
        else if (_$epubHtml)
        {
            console.error("getContentDocHeight ??");
            
            var jqueryHeight = _$epubHtml.height();
            return jqueryHeight;
        }

        return 0;
    }

    // dir: 0 => new or same page, 1 => previous, 2 => next
    this.updatePageSwitchDir = function(dir, hasChanged)
    {
        _pageTransitionHandler.updatePageSwitchDir(dir, hasChanged);
    };
    

    this.transformContentImmediate = function(scale, left, top) {

        var elWidth = Math.ceil(_meta_size.width * scale);
        var elHeight = Math.floor(_meta_size.height * scale);

        _pageTransitionHandler.transformContentImmediate_BEGIN(_$el, scale, left, top);

        _$el.css("left", left + "px");
        _$el.css("top", top + "px");
        _$el.css("width", elWidth + "px");
        _$el.css("height", elHeight + "px");

        if(!_$epubHtml) {
//            debugger;
            return;
        }
    
        var enable3D = false;
        var settings = _viewSettings;
        if (!settings || typeof settings.enableGPUHardwareAccelerationCSS3D === "undefined")
        {
            //defaults
            settings = new ReadiumSDK.Models.ViewerSettings({});
        }
        if (settings.enableGPUHardwareAccelerationCSS3D)
        {
            enable3D = true;
        }

        if (reader.needsFixedLayoutScalerWorkAround())
        {
            var css1 = ReadiumSDK.Helpers.CSSTransformString({scale : scale, enable3D: enable3D});
            _$epubHtml.css(css1);

            var css2 = ReadiumSDK.Helpers.CSSTransformString({scale : 1, enable3D: enable3D});
            css2["width"] = _meta_size.width;
            css2["height"] = _meta_size.height;
            _$scaler.css(css2);
        }
        else
        {
            var css = ReadiumSDK.Helpers.CSSTransformString({scale : scale, enable3D: enable3D});
            css["width"] = _meta_size.width;
            css["height"] = _meta_size.height;
            _$scaler.css(css);
        }

        // Chrome workaround: otherwise text is sometimes invisible (probably a rendering glitch due to the 3D transform graphics backend?)
        //_$epubHtml.css("visibility", "hidden"); // "flashing" in two-page spread mode is annoying :(
        _$epubHtml.css("opacity", "0.999");

        self.showIFrame();
                
        setTimeout(function()
        {
            //_$epubHtml.css("visibility", "visible");
            _$epubHtml.css("opacity", "1");
        }, 0);

        _pageTransitionHandler.transformContentImmediate_END(_$el, scale, left, top);
    };

    this.getCalculatedPageHeight = function() {
        return _$el.height();
    };

    this.transformContent = _.bind(_.debounce(this.transformContentImmediate, 50), self);

    function updateMetaSize() {

        _meta_size.width = 0;
        _meta_size.height = 0;

        var size = undefined;

        var contentDocument = _$iframe[0].contentDocument;

        // first try to read viewport size
        var content = $('meta[name=viewport]', contentDocument).attr("content");

        // if not found try viewbox (used for SVG)
        if(!content) {
            content = $('meta[name=viewbox]', contentDocument).attr("content");
        }

        if(content) {
            size = parseMetaSize(content);
        }
        
        if (!size) {
            // TODO: the picked SVG element may be the root...may be deep inside the markup!
            var $svg = $(contentDocument).find('svg');
            //var $svg = $(contentDocument.documentElement);
            // contentDocument.documentElement.nodeName == "svg"
            if($svg.length > 0) {

                var width = undefined;
                var height = undefined;
                
                var wAttr = $svg[0].getAttribute("width");
                if (wAttr) {
                    try {
                        width = parseInt(wAttr, 10);
                    }
                    catch (err)
                    {}
                }
                var hAttr = $svg[0].getAttribute("height");
                if (hAttr) {
                    try {
                        height = parseInt(hAttr, 10);
                    }
                    catch (err)
                    {}
                }

                if (width && height)
                {
                    size = {
                        width: width,
                        height: height
                    }
                }
                else
                {
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

        if(!size && _currentSpineItem) {
            content = _currentSpineItem.getRenditionViewport();

            if(content) {
                size = parseMetaSize(content);
                if (size) {
                    console.log("Viewport: using rendition:viewport dimensions");
                }
            }
        }
        
        if (!size) {
            // Image fallback (auto-generated HTML template when WebView / iFrame is fed with image media type)
            var $img = $(contentDocument).find('img');
            if($img.length > 0) {
                size = {
                    width: $img.width(),
                    height: $img.height()
                }
                // if (contentDocument && contentDocument.documentElement && contentDocument.documentElement.nodeName && contentDocument.documentElement.nodeName.toLowerCase() == "svg") {
                //     contentDocument.documentElement.setAttribute("width", size.width);
                //     contentDocument.documentElement.setAttribute("height", size.height);
                // }

                var isImage = _currentSpineItem && _currentSpineItem.media_type && _currentSpineItem.media_type.length && _currentSpineItem.media_type.indexOf("image/") == 0;
                if (!isImage) {
                    console.warn("Viewport: using img dimensions!");
                }
            }
            else {
                $img = $(contentDocument).find('image');
                if($img.length > 0) {
                    var width = undefined;
                    var height = undefined;
                
                    var wAttr = $img[0].getAttribute("width");
                    if (wAttr) {
                        try {
                            width = parseInt(wAttr, 10);
                        }
                        catch (err)
                        {}
                    }
                    var hAttr = $img[0].getAttribute("height");
                    if (hAttr) {
                        try {
                            height = parseInt(hAttr, 10);
                        }
                        catch (err)
                        {}
                    }

                    if (width && height)
                    {
                        size = {
                            width: width,
                            height: height
                        }

                        // if (contentDocument && contentDocument.documentElement && contentDocument.documentElement.nodeName && contentDocument.documentElement.nodeName.toLowerCase() == "svg") {
                        //     contentDocument.documentElement.setAttribute("width", size.width);
                        //     contentDocument.documentElement.setAttribute("height", size.height);
                        // }

                        console.warn("Viewport: using image dimensions!");
                    }
                }
            }
        }
        
        if (!size) {
            // Not a great fallback, as it has the aspect ratio of the full window, but it is better than no display at all.
            width = _$viewport.width();
            height = _$viewport.height();
            size = {
                width: width,
                height: height
            }

            console.warn("Viewport: using browser / e-reader viewport dimensions!");
        }
        
        if(size) {
            _meta_size.width = size.width;
            _meta_size.height = size.height;
        }
    }

    //expected callback signature: function(success, $iframe, spineItem, isNewlyLoaded, context)
    this.loadSpineItem = function(spineItem, callback, context) {

        if(_currentSpineItem != spineItem) {

            _currentSpineItem = spineItem;
            var src = _spine.package.resolveRelativeUrl(spineItem.href);

            //if (spineItem && spineItem.isFixedLayout())
            if (true) // both fixed layout and reflowable documents need hiding due to flashing during layout/rendering
            {
                //hide iframe until content is scaled
                self.hideIFrame();
            }
            
            self.trigger(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPEN_START, _$iframe, _currentSpineItem);
            _iframeLoader.loadIframe(_$iframe[0], src, function(success){

                if(success && callback)
                {
                    var func = function() {
                        callback(success, _$iframe, _currentSpineItem, true, context);
                    };
                    
                    if (ReadiumSDK.Helpers.isIframeAlive(_$iframe[0]))
                    {
                        onIFrameLoad(success); // applies styles
                        
                        func();
                    }
                    else
                    {
                        console.error("onIFrameLoad !! doc && win + TIMEOUT");
                        console.debug(spineItem.href);
                        
                        onIFrameLoad(success);
                        
                        setTimeout(func, 500);
                    }
                }
                else
                {
                    onIFrameLoad(success);
                }
                
            }, self, {spineItem: _currentSpineItem});
        }
        else
        {
            if(callback) {
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

        for(var i = 0;  i  < pairs.length; i++) {
            var nameVal = pairs[i].split("=");
            if(nameVal.length == 2) {

                dict[nameVal[0]] = nameVal[1];
            }
        }

        var width = Number.NaN;
        var height = Number.NaN;

        if(dict["width"]) {
            width = parseInt(dict["width"]);
        }

        if(dict["height"]) {
            height = parseInt(dict["height"]);
        }

        if(!isNaN(width) && !isNaN(height)) {
            return { width: width, height: height} ;
        }

        return undefined;
    }

    this.getFirstVisibleElementCfi = function(){

        var navigation = new ReadiumSDK.Views.CfiNavigationLogic(_$el, _$iframe);
        return navigation.getFirstVisibleElementCfi(0);

    };

    this.getNavigator = function() {

        return new ReadiumSDK.Views.CfiNavigationLogic(_$el, _$iframe);
    };

    this.getElementByCfi = function(spineItem, cfi, classBlacklist, elementBlacklist, idBlacklist) {

        if(spineItem != _currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = new ReadiumSDK.Views.CfiNavigationLogic(_$el, _$iframe);
        return navigation.getElementByCfi(cfi, classBlacklist, elementBlacklist, idBlacklist);
    };

    this.getElementById = function(spineItem, id) {

        if(spineItem != _currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = new ReadiumSDK.Views.CfiNavigationLogic(_$el, _$iframe);
        return navigation.getElementById(id);
    };

    this.getElement = function(spineItem, selector) {

        if(spineItem != _currentSpineItem) {
            console.error("spine item is not loaded");
            return undefined;
        }

        var navigation = new ReadiumSDK.Views.CfiNavigationLogic(_$el, _$iframe);
        return navigation.getElement(selector);
    };

    this.getFirstVisibleMediaOverlayElement = function() {
        var navigation = new ReadiumSDK.Views.CfiNavigationLogic(_$el, _$iframe);
        return navigation.getFirstVisibleMediaOverlayElement({top:0, bottom: _$iframe.height()});
    };

    this.offset = function()
    {
        if (_$iframe)
        {
            return _$iframe.offset();
        }
        return undefined;
    }
};

ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPEN_START = "SpineItemOpenStart";
