

ReadiumSDK.Views.InternalLinksSupport = function(reader) {

    function processDeepLink(uri, $iframe, spineItem) {

        var rootUri = new URI(reader.package().rootUrl);
        var contentDocUri = new URI(spineItem.href);
        var contendToAbsoluteUri = contentDocUri.absoluteTo(rootUri);
        var opfUri = new URI(uri.pathname());
        var absoluteOpfUri = opfUri.absoluteTo(contendToAbsoluteUri);

        if(!absoluteOpfUri) {
            console.error("Unable to resolve " + opfUri.href())
            return;
        }

        var fullPath = reader.package().resolveRelativeUrl(absoluteOpfUri.path());
        var fullCfi = uri.fragment();

        readOpfFile(fullPath, function(opfText) {

            if(!opfText) {
                return;
            }

            var parser = new window.DOMParser;
            var packageDom = parser.parseFromString(opfText, 'text/xml');

            var contentDocRef = EPUBcfi.Interpreter.getContentDocHref(fullCfi, packageDom);

            if(contentDocRef) {
                console.log("Succseesss contenDocHref=" + contentDocRef);
            }
            else {
                console.warn("Unable to find document ref from " +  fullCfi +" cfi");
            }

        });

    }

    function readOpfFile(path, callback) {

        $.ajax({
            url: path,
            dataType: 'text',
            async: true,
            success: function (result) {
                callback(result);
            },
            error: function (xhr, status, errorThrown) {
                console.error('Error when AJAX fetching ' + path);
                console.error(status);
                console.error(errorThrown);
                callback();
            }
        });
    }

    //checks if href includes path to opf file and full cfi
    function isDeepLikHref(uri) {

        var fileName = uri.filename();
        return fileName && ReadiumSDK.Helpers.EndsWith(fileName, ".opf");
    }

    this.processLinkElements = function($iframe, spineItem) {

        var epubContentDocument = $iframe[0].contentDocument;

        var self = this;

        $('a', epubContentDocument).click(function (clickEvent) {
            // Check for both href and xlink:href attribute and get value
            var href;
            if (clickEvent.currentTarget.attributes["xlink:href"]) {
                href = clickEvent.currentTarget.attributes["xlink:href"].value;
            }
            else {
                href = clickEvent.currentTarget.attributes["href"].value;
            }

            var hrefUri = new URI(href);

            if(isDeepLikHref(hrefUri)) {
                processDeepLink(hrefUri, $iframe, spineItem);
                return;
            }

            var hrefIsRelative = hrefUri.is('relative');
            var hrefUriHasFilename = hrefUri.filename();
            var overrideClickEvent = false;

            if (hrefIsRelative) {
                // TODO:
                if (hrefUriHasFilename /* TODO: && check whether href actually resolves to a spine item */) {

                    var currentSpineItemUri = new URI(spineItem.href);
                    var openedSpineItemUri = hrefUri.absoluteTo(currentSpineItemUri);
                    var newSpineItemHref = openedSpineItemUri.pathname();
                    var hashFrag = openedSpineItemUri.fragment();
                    var newSpineItem = reader.spine().getItemByHref(newSpineItemHref);

                    if(newSpineItem) {
                        reader.openSpineItemElementId(newSpineItem.idref, hashFrag, self);
                    }
                    else {
                        console.error("spine item with href=" + newSpineItemHref + " not found");
                    }

                    overrideClickEvent = true;
                } // otherwise it's probably just a hash frag that needs to be handled by browser's default handling
            } else {
                // It's an absolute URL to a remote site - open it in a separate window outside the reader
                window.open(href, '_blank');
                overrideClickEvent = true;
            }

            if (overrideClickEvent) {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
            }
        });

    }

};
