define(["../globals", "underscore", "../helpers", "../models/page_open_request", "../models/spine_item", "vue", "html2canvas"],
function(Globals, _, Helpers, PageOpenRequest, SpineItem, Vue, H2C) {
    var ScrubberView = function() {

        Vue.component('scrubber-item', {
            props: ['item'],
            template: '<div class="scrubber_item"><img class="scrubber_item_img" v-bind:src=item.src v-on:click="click" alt=""></div>',
            methods: {
                click: function(event) {
                    this.$emit('click', this.item.src);
                }
            }
        });

        this.scrubber = new Vue({
            el: '#scrubber',
            data: {
                scrubber_index: 0,
                item_list: [],
                scrubber_left: 0,
                seen: false,
                needUpdate: true,
                show_image_scrubber: true,
                needReload: false
            },
            computed: {
                item_count: function() {
                    return this.item_list.length;
                },
            },
            updated: function() {
                //console.debug("updated: scrubber_index = " + this.scrubber_index + ", needUpdate? " + this.needUpdate);
                if (this.needUpdate) {
                    this.updateScrollView();
                }

                if (this.needReload) {
                    this.reloadImage();
                }
            },
            watch: {
                seen: function(val) {
                    //console.debug("seen: val? " + val);
                    this.needUpdate = val;
                }
            },
            methods: {
                itemWidth: function() {
                    if (this.$refs.scrubber_scroller.childNodes.length > 0) {
                        // FIXME: The width might be incorrect when the thumbnail is not loaded
                        //console.debug("itemWidth = " + this.$refs.scrubber_scroller.childNodes[0].clientWidth);
                        return this.$refs.scrubber_scroller.childNodes[0].clientWidth;
                    }
                    return 0;
                },
                twoPagesItemWidth: function() {
                    if (this.$refs.scrubber_scroller.childNodes.length > 1) {
                        return this.$refs.scrubber_scroller.childNodes[1].clientWidth +
                                this.$refs.scrubber_scroller.childNodes[2].clientWidth;
                    }
                    return 0;
                },
                isLandscape: function() {
                    var rendition_spread = ReadiumSDK.reader.package().rendition_spread;
                    var isLandscape = Helpers.getOrientation($('#viewport')) === Globals.Views.ORIENTATION_LANDSCAPE;

                    return rendition_spread === SpineItem.RENDITION_SPREAD_BOTH || isLandscape;
                },
                updateScrubber: function(event) {
                    //console.debug("updateScrubber");
                    if (this.show_image_scrubber) {
                        this.updateScrollView();
                    }
                    //this.goToPage(this.scrubber_index);
                },
                onScrubberScroll: function(event) {
                    //console.debug("onScrubberScroll: needUpdate? " + this.needUpdate);
                    if (this.needUpdate) {
                        this.needUpdate = false;
                    } else if (this.$refs.scrubber_scroller !== undefined) {
                        var scrollerLeft = this.$refs.scrubber_scroller.scrollLeft;

                        if (this.isLandscape()) {
                            var halfNumberOfItems = Math.round(Math.floor($('#viewport').outerWidth() / this.itemWidth()) / 2);

                            if (scrollerLeft > this.itemWidth()) {
                                scrollerLeft -= this.itemWidth();
                                this.scrubber_index = Math.floor(scrollerLeft / this.twoPagesItemWidth()) * 2 + (halfNumberOfItems - 1);
                            } else {
                                this.scrubber_index = 0;
                            }
                        } else {
                            this.scrubber_index = Math.floor(scrollerLeft / this.itemWidth());
                        }
                        //console.debug("onScrubberScroll: scrubber_index = ? " + this.scrubber_index);
                    }
                },
                onScroll: function(event) {
                    this.updateScrollView();
                },
                onSelect: function(src) {
                    var index = _.indexOf(this.item_list.map(function(item) { return item.src }), src);

                    this.goToPage(index);
                    if (!this.isLandscape()) {
                        this.scrubber_index = index;
                    } else {
                        this.scrubber_index = (index > 0) ? (index % 2 == 0 ? index - 1 : index) : index;
                    }
                    //console.debug("onSelect: index = " + index + ", scrubber_index = " + this.scrubber_index);
                    this.needUpdate = true;
                },
                reloadImage: function() {
                    _.each($(".scrubber_item>img"),function(el){
                        el.src = el.src + "?" + new Date().getTime();
                    });
                },
                updateScrollView: function() {
                    if (this.$refs.scrubber_scroller === undefined) {
                        return;
                    }
                    //console.debug("updateScrollView: scrubber_index = " + this.scrubber_index);
                    var $viewport = $('#viewport');
                    var lastChild = this.$refs.scrubber_scroller.childNodes[this.$refs.scrubber_scroller.childNodes.length - 1];
                    var isLandscape = this.isLandscape();
                    var isViewportPortrait = Helpers.getOrientation($viewport) === Globals.Views.ORIENTATION_PORTRAIT;
                    var halfNumberOfItems = Math.round(Math.floor($viewport.outerWidth() / this.itemWidth()) / 2);

                    //console.debug("updateScrollView: halfNumberOfItems = " + halfNumberOfItems);
                    $.each(this.$refs.scrubber_scroller.childNodes, function(index, node) {
                        if (index > 0) {
                            if ((index - 1) % 2 == 0) {
                                node.childNodes[0].style.paddingRight = isLandscape ? 0 : node.childNodes[0].style.paddingLeft;
                            } else {
                                node.childNodes[0].style.paddingLeft = isLandscape ? 0 : node.childNodes[0].style.paddingRight;
                            }
                        }
                    });
                    lastChild.style.marginRight = this.$refs.scrubber_scroller.clientWidth - this.itemWidth();
                    if (this.isLandscape()) {
                        if (this.scrubber_index > (halfNumberOfItems - 1)) {
                            this.scrubber_left = this.itemWidth() + (Math.round((this.scrubber_index - (halfNumberOfItems - 1)) / 2) * this.twoPagesItemWidth());
                            if (isViewportPortrait) {
                                this.scrubber_left -= (this.twoPagesItemWidth() / 4);
                            } else {
                                this.scrubber_left -= (this.twoPagesItemWidth() / 2);
                            }
                            if (halfNumberOfItems == 1) {
                                this.scrubber_left -= this.twoPagesItemWidth();
                            }
                        } else {
                            this.scrubber_left = 0;
                        }
                    } else {
                        if (this.scrubber_index > (halfNumberOfItems - 1)) {
                            this.scrubber_left = (this.scrubber_index - (halfNumberOfItems - 1)) * this.itemWidth();
                            if (halfNumberOfItems == 1) {
                                this.scrubber_left -= this.itemWidth() / 2;
                            }
                        } else {
                            this.scrubber_left = 0;
                        }
                        //this.scrubber_left = (this.scrubber_index == 0 ? this.scrubber_index : this.scrubber_index - 1) * this.itemWidth();
                    }
                    this.$refs.scrubber_scroller.scrollLeft = this.scrubber_left;
                    //console.debug("updateScrollView: scrubber_left = " + this.scrubber_left);
                },
                goToPage: function(index) {
                    var nextSpineItem = ReadiumSDK.reader.spine().items[index];
                    var openPageRequest = new PageOpenRequest(nextSpineItem, ReadiumSDK.reader);
                    openPageRequest.setFirstPage();
                    ReadiumSDK.reader.goToPage(openPageRequest, 2);
                },
            }
        });

        this.updateIndexAndScrollView = function(paginationInfo) {
            // TODO: Need to add implementations for reflowable content
            if (paginationInfo.isFixedLayout) {
                var index = this.scrubber.scrubber_index;
                var openPages = paginationInfo.openPages;

                if (index != openPages[0].spineItemIndex || (openPages.length > 1 && index != openPages[1].spineItemIndex)) {
                    this.scrubber.scrubber_index = paginationInfo.openPages[0].spineItemIndex;
                }
                if (this.scrubber.seen) {
                    this.scrubber.updateScrollView();
                }
            }
        };

        ReadiumSDK.reader.on(Globals.Events.FXL_VIEW_RESIZED, function() {
            this.updateIndexAndScrollView(ReadiumSDK.reader.getPaginationInfo());
        }, this);

        ReadiumSDK.reader.on(Globals.Events.PAGINATION_CHANGED, function(pageChangeData) {
            this.updateIndexAndScrollView(pageChangeData.paginationInfo);
        }, this);
    };

    return ScrubberView;
});
