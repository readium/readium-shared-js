ReadiumSDK.Views.MediaOverlayDataInjector = function (mediaOverlay, mediaOverlayPlayer) {


    this.attachMediaOverlayData = function ($iframe, spineItem, mediaOverlaySettings) {

        var contentDocElement = $iframe[0].contentDocument.documentElement;

        if (!spineItem.media_overlay_id && mediaOverlay.smil_models.length === 0) {
            return;
        }

        var $body = $("body", contentDocElement);
        if ($body.length == 0) {
            console.error("! BODY ???");
        }
        else {
            var click = $body.data("mediaOverlayClick");
            if (click) {
                console.error("[WARN] already mediaOverlayClick");
            }
            else {
                $body.data("mediaOverlayClick", {ping: "pong"});

                var clickEvent = 'ontouchstart' in document.documentElement ? 'touchstart' : 'click';
                $body.bind(clickEvent, function (event)
                {
                    var elem = $(this)[0]; // body
                    elem = event.target; // body descendant

                    if (!elem)
                    {
                        mediaOverlayPlayer.touchInit();
                        return true;
                    }

                    console.debug("MO CLICK: " + elem.id);

                    var data = undefined;
                    var el = elem;

                    var inLink = false;
                    if (el.nodeName.toLowerCase() === "a")
                    {
                        inLink = true;
                    }

                    while (!(data = $(el).data("mediaOverlayData")))
                    {
                        if (el.nodeName.toLowerCase() === "a")
                        {
                            inLink = true;
                        }
                        el = el.parentNode;
                        if (!el)
                        {
                            break;
                        }
                    }

                    if (data && data.par)
                    {
                        if (!mediaOverlaySettings.mediaOverlaysEnableClick)
                        {
                            console.debug("MO CLICK DISABLED");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        if (inLink)
                        {
                            console.debug("MO CLICKED LINK");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        var par = data.par;

                        if (el && el != elem && el.nodeName.toLowerCase() === "body" && par && !par.getSmil().id)
                        {
                            console.debug("MO CLICKED BLANK BODY");
                            mediaOverlayPlayer.touchInit();
                            return true;
                        }

                        mediaOverlayPlayer.playUserPar(par);
                        return true;
                    }
                    else
                    {
                        var readaloud = $(elem).attr("ibooks:readaloud");
                        if (!readaloud)
                        {
                            readaloud = $(elem).attr("epub:readaloud");
                        }
                        if (readaloud)
                        {
                            console.debug("MO readaloud attr: " + readaloud);

                            var isPlaying = mediaOverlayPlayer.isPlaying();
                            if (readaloud === "start" && !isPlaying ||
                                readaloud === "stop" && isPlaying ||
                                readaloud === "startstop")
                            {
                                mediaOverlayPlayer.toggleMediaOverlay();
                                return true;
                            }
                        }
                    }

                    mediaOverlayPlayer.touchInit();
                    return true;
                });
            }
        }

        var smil = mediaOverlay.getSmilBySpineItem(spineItem);
        if (!smil)
        {
            console.error("NO SMIL?? " + spineItem.idref + " /// " + spineItem.media_overlay_id);
            return;
        }

//console.debug("[[MO ATTACH]] " + spineItem.idref + " /// " + spineItem.media_overlay_id + " === " + smil.id);

        var iter = new ReadiumSDK.Models.SmilIterator(smil);

        while (iter.currentPar) {
            iter.currentPar.element = undefined;

            if (true) { //iter.currentPar.text.srcFragmentId (includes empty frag ID)

                var textRelativeRef = ReadiumSDK.Helpers.ResolveContentRef(iter.currentPar.text.srcFile, iter.smil.href);

                var same = textRelativeRef === spineItem.href;
                if (same) {
                    var selector = iter.currentPar.text.srcFragmentId.length == 0 ? "body" : "#" + iter.currentPar.text.srcFragmentId;
                    var $element = $(selector, contentDocElement);

                    if ($element.length > 0) {

                        if (iter.currentPar.element && iter.currentPar.element !== $element[0]) {
                            console.error("DIFFERENT ELEMENTS??! " + iter.currentPar.text.srcFragmentId + " /// " + iter.currentPar.element.id);
                        }

                        var name = $element[0].nodeName ? $element[0].nodeName.toLowerCase() : undefined;
                        if (name === "audio" || name === "video") {
                            $element.attr("preload", "auto");
                        }

                        iter.currentPar.element = $element[0];

                        var modata = $element.data("mediaOverlayData");
                        if (modata) {
                            console.error("[WARN] MO DATA already exists.");

                            if (modata.par && modata.par !== iter.currentPar) {
                                console.error("DIFFERENT PARS??!");
                            }
                        }

                        $element.data("mediaOverlayData", {par: iter.currentPar});

                        /*
                         $element.click(function() {
                         var elem = $(this)[0];
                         console.debug("MO CLICK (ELEM): " + elem.id);

                         var par = $(this).data("mediaOverlayData").par;
                         mediaOverlayPlayer.playUserPar(par);
                         });
                         */
                    }
                    else {
                        console.error("!! CANNOT FIND ELEMENT: " + iter.currentPar.text.srcFragmentId + " == " + iter.currentPar.text.srcFile + " /// " + spineItem.href);
                    }
                }
                else {
//console.debug("[INFO] " + spineItem.href + " != " + textRelativeRef + " # " + iter.currentPar.text.srcFragmentId);
                }
            }

            iter.next();
        }
    }
};