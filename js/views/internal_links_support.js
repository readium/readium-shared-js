

ReadiumSDK.Views.InternalLinksSupport = function(reader) {

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
