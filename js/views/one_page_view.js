//  Created by Boris Schneiderman.
//  Copyright (c) 2012-2013 The Readium Foundation.
//
//  The Readium SDK is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.


/*
 * Renders one page of fixed layout spread
 * @class ReadiumSDK.Views.OnePageView
 */

//Representation of one fixed page
ReadiumSDK.Views.OnePageView = function(options, classes, enableBookStyleOverrides){

    _.extend(this, Backbone.Events);

    var self = this;

    var _$epubHtml;
    var _$el;
    var _$iframe;
    var _currentSpineItem;
    var _spine = options.spine;
    var _iframeLoader = options.iframeLoader;
    var _bookStyles = options.bookStyles;

    var _fontSize = 100;
    var _isIframeLoaded = false;

    var _enablePageTransitions = options.enablePageTransitions;

    var _enableBookStyleOverrides = enableBookStyleOverrides || false;

    var _meta_size = {
        width: 0,
        height: 0
    };
    
    var _pageSwitchDir = 0; // 0 => stay on same page, 1 => previous, 2 => next
    var _pageSwitchActuallyChanged = false;
    var _pageSwitchActuallyChanged_IFRAME_LOAD = false;
    this.pageSwitchDir = function(dir, hasChanged)
    {
        if (_pageSwitchActuallyChanged_IFRAME_LOAD)
        {
//console.error("pageSwitchDir _pageSwitchActuallyChanged_IFRAME_LOAD SKIP");
            return;
        }
        
        _pageSwitchDir = dir;
        _pageSwitchActuallyChanged = hasChanged;
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

        if(!_$iframe) {

            var template = ReadiumSDK.Helpers.loadTemplate("single_page_frame", {});

            _$el = $(template);
        
            _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
                _$el.css(prefix + "transition", "all 0 ease 0");
            });
        
            _$el.css("height", "100%");
            _$el.css("width", "100%");

            for(var i = 0, count = classes.length; i < count; i++) {
                _$el.addClass(classes[i]);
            }

            _$iframe = $("iframe", _$el);
        }

        return this;
    };

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
            _$epubHtml.css("overflow", "hidden");

            self.applyBookStyles();

            updateMetaSize();
            updateHtmlFontSize();
        }
    }

    this.setViewSettings = function(settings) {

        var isFontChanged = settings.fontSize !== undefined && _fontSize !== settings.fontSize;

        if(isFontChanged) {
            _fontSize = settings.fontSize;
            updateHtmlFontSize();
        }

        return isFontChanged;
    };

    function updateHtmlFontSize() {

        if(_$epubHtml) {
            _$epubHtml.css("font-size", _fontSize + "%");

            self.applyBookStyles();
            updateMetaSize();
            
            _pageSwitchActuallyChanged_IFRAME_LOAD = true; // second pass, but initial display for transition
            
            self.trigger(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPENED, _$iframe, _currentSpineItem, self);
        }
    }

    this.applyBookStyles = function() {
        
         // fixed layout does not apply user styles to publisher content, but reflowable scroll view does
        if (!_enableBookStyleOverrides) return;
        
        if(_$epubHtml) {
            ReadiumSDK.Helpers.setStyles(_bookStyles.getStyles(), _$epubHtml);
        }
    };

    //this is called by scroll_view for fixed spine item
    this.scaleToWidth = function(width) {

        var scale = width / _meta_size.width;
        self.transformContent(scale, 0, 0);
    };

    //this is called by scroll_view for reflowable spine item
    this.resizeIFrameToContent = function() {

//        ReadiumSDK.Helpers.waitForRendering(_$iframe);

        var contHeight = getContentDocHeight();
        _$iframe.css("height", contHeight + "px");
        _$iframe.css("visibility", "visible");

        _$el.css("height", contHeight + "px");

        _$iframe.css("height", contHeight + "px");
        _$iframe.css("visibility", "visible");

        _$el.css("height", contHeight + "px");

        setTimeout(function(){}, 0);

//        ReadiumSDK.Helpers.waitForRendering(_$iframe);
    };

    this.setHeight = function(height) {

        _$iframe.css("height", height + "px");
        _$iframe.css("visibility", "visible");

        _$el.css("height", height + "px");

        setTimeout(function(){}, 0);

        ReadiumSDK.Helpers.waitForRendering(_$iframe);
    };

    this.elementHeight = function() {
        return _$el.height();
    };

    this.showIFrame = function() {
        _$iframe.css("visibility", "visible");
    };

    this.hideIFrame = function() {
        _$iframe.css("visibility", "hidden");
    };

    function getContentDocHeight(){

        if(!_$epubHtml) {
            return 0;
        }

        return _$epubHtml.height();
    }

    this.transformContentImmediate = function(scale, left, top) {
        
        var pageTransition_Translate = false; // TODO: from options
        
        var pageSwitchActuallyChanged = _pageSwitchActuallyChanged || _pageSwitchActuallyChanged_IFRAME_LOAD;
        _pageSwitchActuallyChanged_IFRAME_LOAD = false;
// console.error("transformContent: "+pageSwitchActuallyChanged + " - " + _pageSwitchDir);

        var elWidth = Math.ceil(_meta_size.width * scale);
        var elHeight = Math.floor(_meta_size.height * scale);
    
        _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
            _$el.css(prefix + "transition", "all 0 ease 0");
        });
    
        if (pageSwitchActuallyChanged && _enablePageTransitions)
        {
            if (_pageSwitchDir === 0)
            {
                _$el.css("opacity", "0");
            }
            else
            {
                if (pageTransition_Translate)
                {
                    var initialLeft = elWidth * 0.7 * (_pageSwitchDir === 2 ? 1 : -1);
                    var move = generateTransformCSS(1, Math.round(initialLeft), 0);
                    _$el.css(move);
                }
                else
                {
                    _$el.css("opacity", "0");
                }
            }
        }
        
        _$el.css("left", left + "px");
        _$el.css("top", top + "px");
        _$el.css("width", elWidth + "px");
        _$el.css("height", elHeight + "px");
                                                    
        _$iframe.css("width", elWidth + "px");
        _$iframe.css("height", elHeight + "px");

        var css = generateTransformCSS(scale, 0, 0);

        css["width"] = _meta_size.width;
        css["height"] = _meta_size.height;

        if(!_$epubHtml) {
            debugger;
        }

        _$epubHtml.css(css);

        // // Chrome workaround: otherwise text is sometimes invisible (probably a rendering glitch due to the 3D transform graphics backend?)
        // //_$epubHtml.css("visibility", "hidden"); // "flashing" in two-page spread mode is annoying :(
        _$epubHtml.css("opacity", "0.999");

        _$iframe.css("visibility", "visible");
        
        setTimeout(function()
        {
            //_$epubHtml.css("visibility", "visible");
            _$epubHtml.css("opacity", "1");
        }, 0);
        
        if (pageSwitchActuallyChanged && _enablePageTransitions)
        {
            setTimeout(function()
            {
                if (_pageSwitchDir === 0)
                {
                    _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
                        _$el.css(prefix + "transition", "opacity 250ms linear");
                    });
        
                    _$el.css("opacity", "1");
                }
                else
                {
                    if (pageTransition_Translate)
                    {
                        _$el.css("-webkit-transition", "-webkit-transform 200ms ease-out");
                        var css = {};
                        _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
                            //css[prefix + 'transition'] = prefix + "transform 200ms ease-out";
                            css[prefix + 'transform'] = "none";
                        });
                        _$el.css(css);
                    }
                    else
                    {
                        _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
                            _$el.css(prefix + "transition", "opacity 150ms ease-out");
                        });

                        _$el.css("opacity", "1");
                    }
                }

                // var moveBack = generateTransformCSS(0, 0, 0);
                // _$el.css(css);
                //             
                //_$el.css("left", left + "px");

            }, 10);
        }
    };
    this.transformContent = _.bind(_.debounce(this.transformContentImmediate, 50), self);

    function generateTransformCSS(scale, left, top) {

        var translate = (left !== 0 || top !== 0) ? "translate(" + left + "px, " + top + "px)" : undefined;
        var scale = scale !== 1 ? "scale(" + scale + ")" : undefined;
        
        if (!(translate || scale)) return {};
        
        var transformString = (translate && scale) ? (translate + " " + scale) : (translate ? translate : scale); // the order is important!

        //TODO modernizer library can be used to get browser independent transform attributes names (implemented in readium-web fixed_layout_book_zoomer.js)
        var css = {};
        _.each(['-webkit-', '-moz-', '-ms-', ''], function(prefix) {
            css[prefix + 'transform'] = transformString;
            css[prefix + 'transform-origin'] = '0 0';
        });

        return css;
    }

    function updateMetaSize() {

        _meta_size.width = 0;
        _meta_size.height = 0;

        var contentDocument = _$iframe[0].contentDocument;

        // first try to read viewport size
        var content = $('meta[name=viewport]', contentDocument).attr("content");

        // if not found try viewbox (used for SVG)
        if(!content) {
            content = $('meta[name=viewbox]', contentDocument).attr("content");
        }

        if(content) {
            var size = parseSize(content);
            if(size) {
                _meta_size.width = size.width;
                _meta_size.height = size.height;
            }
        }
        else { //try to get direct svg or image size
            
            // try SVG element's width/height first
            var $svg = $(contentDocument).find('svg');
            if ($svg.length > 0) {
                _meta_size.width = parseInt($svg.attr("width"), 10);
                _meta_size.height = parseInt($svg.attr("height"), 10);
            }
            else {
                var $img = $(contentDocument).find('img');
                if($img.length > 0) {
                    _meta_size.width = $img.width();
                    _meta_size.height = $img.height();
                }
            }
        }

    }

    //expected callback signature: function(success, $iframe, spineItem, isNewlyLoaded, context)
    this.loadSpineItem = function(spineItem, callback, context) {

        if(_currentSpineItem != spineItem) {

            _currentSpineItem = spineItem;
            var src = _spine.package.resolveRelativeUrl(spineItem.href);

            //hide iframe until content is scaled
            _$iframe.css("visibility", "hidden");
            self.trigger(ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPEN_START, _$iframe, _currentSpineItem);
            _iframeLoader.loadIframe(_$iframe[0], src, function(success){

                onIFrameLoad(success);

                if(callback) {
                    callback(success, _$iframe, _currentSpineItem, true, context);
                }

            }, self);
        }
        else
        {
            if(callback) {
                callback(true, _$iframe, _currentSpineItem, false, context);
            }
        }
    };

    function parseSize(content) {

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
    }

};

ReadiumSDK.Views.OnePageView.SPINE_ITEM_OPEN_START = "SpineItemOpenStart";
