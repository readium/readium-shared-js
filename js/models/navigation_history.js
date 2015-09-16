//  Created by Boris Schneiderman.
// Modified by Daniel Weck
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

define([
    //"jquery", "underscore"
    ],
    function (
        //$, _
        ) {


var NavigationHistory = function (readerview) {

    var _DEBUG = true;

    var self = this;
    
    var _readerView = readerview;
    
    var _breadcrumb = [];
    
    var _skipNext = false;
    
    this.flush = function () {
        if (_DEBUG) {
            console.error("NavigationHistory FLUSH.");
        }
        
        _breadcrumb = [];
    };
    this.flush();

    this.push = function (bookMark) {
        
        if (_skipNext) {
                
            if (_DEBUG) {
                console.error("NavigationHistory PUSH SKIP: ");
                console.debug(bookMark);
            }
        
            _skipNext = false;
            return;
        }
        
        if (_DEBUG) {
            console.error("NavigationHistory PUSH: ");
            console.debug(bookMark);
        }
        
        if (_breadcrumb.length) {
            var lastBookMark = _breadcrumb[_breadcrumb.length-1];
            
            var bookMark_contentCFI = bookMark.contentCFI;
            // TODO bookmark spatial @x:y! (should be charcter offset)
            // if (bookMark_contentCFI) {
            //     var i = bookMark_contentCFI.lastIndexOf("@");
            //     if (i > 1) {
            //         bookMark_contentCFI = bookMark_contentCFI.substr(0, i);
            //     }
            // }
            
            var lastBookMark_contentCFI = lastBookMark.contentCFI;
            // TODO bookmark spatial @x:y! (should be charcter offset)
            // if (lastBookMark_contentCFI) {
            //     i = lastBookMark_contentCFI.lastIndexOf("@");
            //     if (i > 1) {
            //         lastBookMark_contentCFI = lastBookMark_contentCFI.substr(0, i);
            //     }
            // }
            
            if (bookMark.idref == lastBookMark.idref
                && bookMark_contentCFI == lastBookMark_contentCFI) {
                
                if (_DEBUG) {
                    console.log("--- NavigationHistory skipping duplicate bookmark: " + bookMark.idref + " -- " + bookMark_contentCFI);
                }
                return;
            }
        }
        
        _breadcrumb.push(bookMark);
    };
    
    this.pop = function () {
        var bookMark = _breadcrumb.pop();
        
        if (_DEBUG) {
            console.error("NavigationHistory POP: ");
            console.debug(bookMark);
        }
        
        return bookMark;
    };
        
    this.canPop = function() {
        return _breadcrumb.length > 0;
    };
    
    this.skipNext = function() {
        if (_DEBUG) {
            console.error("NavigationHistory SKIP NEXT.");
        }
        _skipNext = true;
    };
};
return NavigationHistory;

});