define(["../globals", "underscore", "../helpers", "../models/page_open_request", "../models/spine_item", "vue", "html2canvas"],
function(Globals, _, Helpers, PageOpenRequest, SpineItem, Vue, H2C) {
    var ScrubberView = function() {

        function Orientation(scrubber) {
            this.scrubber = scrubber;
        };

        Orientation.prototype.onScrubberScroll = function() {

        };

        Orientation.prototype.onSelect = function() {

        };

        Orientation.prototype.updateScrollView = function() {
            this.scrubber.getDirection().updateScrollView();
        };

        function Landscape(scrubber) {
            Landscape.prototype.scrubber = scrubber;
        }
        Landscape.prototype = new Orientation();

        Landscape.prototype.constructor = Landscape;

        Landscape.prototype.updateScrollView = function(halfNumberOfItems, isViewportPortrait) {
            if (this.scrubber.scrubber_index > (halfNumberOfItems - 1)) {
                this.scrubber.scrubber_left = this.scrubber.itemWidth() + (Math.round((this.scrubber.scrubber_index - (halfNumberOfItems - 1)) / 2) * this.scrubber.twoPagesItemWidth());

                if (!isViewportPortrait) {
                    this.scrubber.scrubber_left -= (this.scrubber.twoPagesItemWidth() / 2);
                }
                if (halfNumberOfItems == 1) {
                    this.scrubber.scrubber_left -= this.scrubber.twoPagesItemWidth();
                }
            } else {
                this.scrubber.scrubber_left = 0;
            }
            Orientation.prototype.updateScrollView.call(this);
        }

        Landscape.prototype.onScrubberScroll = function(scrollerLeft) {
            var halfNumberOfItems = Math.round(Math.floor($('#viewport').outerWidth() / this.scrubber.itemWidth()) / 2);

            if (scrollerLeft > this.scrubber.itemWidth()) {
                scrollerLeft -= this.scrubber.itemWidth();
                this.scrubber.scrubber_index = Math.floor(scrollerLeft / this.scrubber.twoPagesItemWidth()) * 2 + (halfNumberOfItems - 1)
                * this.scrubber.getDirection().getOffsetFactor();
            } else {
                this.scrubber.scrubber_index = 0;
            }
        }

        Landscape.prototype.onSelect = function(index) {
            this.scrubber.scrubber_index = (index > 0) ? (index % 2 == 0 ? index - 1 : index) : index;
        }

        function Portrait (scrubber) {
            Portrait.prototype.scrubber = scrubber;
        }

        Portrait.prototype = new Orientation();

        Portrait.prototype.constructor = Portrait;

        Portrait.prototype.updateScrollView = function(halfNumberOfItems, isViewportPortrait) {
            if (this.scrubber.scrubber_index > (halfNumberOfItems - 1)) {
                this.scrubber.scrubber_left = (this.scrubber.scrubber_index - (halfNumberOfItems - 1)) * this.scrubber.itemWidth();
                if (halfNumberOfItems == 1) {
                    this.scrubber.scrubber_left -= this.scrubber.itemWidth() / 2;
                }
            } else {
                this.scrubber.scrubber_left = 0;
            }
            Orientation.prototype.updateScrollView.call(this);
        }

        Portrait.prototype.onScrubberScroll = function(scrollerLeft) {
            this.scrubber.scrubber_index = Math.floor(scrollerLeft / this.scrubber.itemWidth())
             * this.scrubber.getDirection().getOffsetFactor();
        }

        Portrait.prototype.onSelect = function(index) {
            this.scrubber.scrubber_index = index;
        }

        function Direction(scrubber) {
            this.scrubber = scrubber;
        }

        Direction.prototype.updateScrollView = function() {

        }

        Direction.prototype.getOffsetFactor = function() {
            return 1;
        }

        Direction.prototype.updateScrubberPadding = function() {

        }

        function LeftToRight(scrubber) {
            LeftToRight.prototype.scrubber = scrubber;
        }

        LeftToRight.prototype = new Direction();

        LeftToRight.prototype.constructor = LeftToRight;

        LeftToRight.prototype.updateScrollView = function() {
            this.scrubber.$refs.scrubber_scroller.scrollLeft = this.scrubber.scrubber_left;
        }

        LeftToRight.prototype.updateScrubberPadding = function(isLandscape) {
            _.each(this.scrubber.$refs.scrubber_scroller.childNodes, function(node, index) {
                if (index > 0) {
                    if ((index - 1) % 2 == 0) {
                        node.childNodes[0].style.paddingRight = isLandscape ? 0 : node.childNodes[0].style.paddingLeft;
                    } else {
                        node.childNodes[0].style.paddingLeft = isLandscape ? 0 : node.childNodes[0].style.paddingRight;
                    }
                }
            });
        }

        function RightToLeft(scrubber) {
            RightToLeft.prototype.scrubber = scrubber;
        }

        RightToLeft.prototype = new Direction();

        RightToLeft.prototype.constructor = RightToLeft;

        RightToLeft.prototype.updateScrollView = function() {
            this.scrubber.$refs.scrubber_scroller.scrollLeft = this.scrubber.scrubber_left * -1;
        }

        RightToLeft.prototype.getOffsetFactor = function() {
            return -1;
        }

        RightToLeft.prototype.updateScrubberPadding = function(isLandscape) {
            _.each(this.scrubber.$refs.scrubber_scroller.childNodes, function(node, index) {
                if (index > 0) {
                    if ((index - 1) % 2 == 0) {
                        node.childNodes[0].style.paddingLeft = isLandscape ? 0 : node.childNodes[0].style.paddingLeft;
                    } else {
                        node.childNodes[0].style.paddingRight = isLandscape ? 0 : node.childNodes[0].style.paddingRight;
                    }
                }
            });
        }



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
                    return ReadiumSDK.reader.getPaginationInfo().openPages.length > 1;
                },
                getOrientation: function() {
                    return this.isLandscape() ? new Landscape(this) : new Portrait(this);
                },
                isLeftToRight: function() {
                    return window.ReadiumSDK.reader.package().spine.isLeftToRight();
                },
                getDirection: function() {
                    return this.isLeftToRight() ? new LeftToRight(this) : new RightToLeft(this);
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
                        this.getOrientation().onScrubberScroll(scrollerLeft);
                        //console.debug("onScrubberScroll: scrubber_index = ? " + this.scrubber_index);
                    }
                },
                onScroll: function(event) {
                    this.updateScrollView();
                },
                onSelect: function(src) {
                    var index = _.indexOf(this.item_list.map(function(item) { return item.src }), src);

                    this.goToPage(index);
                    this.getOrientation().onSelect(index);
                    // console.debug("onSelect: index = " + index + ", scrubber_index = " + this.scrubber_index);
                    this.needUpdate = true;
                },
                reloadImage: function() {
                    _.each($(".scrubber_item>img"),function(el){
                        el.src = el.src + "?" + new Date().getTime();
                    });
                    this.needReload = false;
                },
                updateScrollView: function() {
                    if (this.$refs.scrubber_scroller === undefined) {
                        return;
                    }
                    console.debug("updateScrollView: scrubber_index = " + this.scrubber_index);
                    var $viewport = $('#viewport');
                    var lastChild = this.$refs.scrubber_scroller.childNodes[this.$refs.scrubber_scroller.childNodes.length - 1];
                    var isLandscape = this.isLandscape();
                    var isViewportPortrait = Helpers.getOrientation($viewport) === Globals.Views.ORIENTATION_PORTRAIT;
                    var halfNumberOfItems = Math.round(Math.floor($viewport.outerWidth() / this.itemWidth()) / 2);

                    //console.debug("updateScrollView: halfNumberOfItems = " + halfNumberOfItems);
                    this.getDirection().updateScrubberPadding(isLandscape);
                    lastChild.style.marginRight = this.$refs.scrubber_scroller.clientWidth - this.itemWidth();
                    this.getOrientation().updateScrollView(halfNumberOfItems, isViewportPortrait);
                },
                goToPage: function(index) {
                    var nextSpineItem = ReadiumSDK.reader.spine().items[index];
                    var openPageRequest = new PageOpenRequest(nextSpineItem, ReadiumSDK.reader);
                    openPageRequest.setFirstPage();
                    ReadiumSDK.reader.goToPage(openPageRequest, 2);
                },
                directionClass: function() {
                    var result = [];
                    if (!this.isLeftToRight()) {
                        result.push('right_to_left');
                    }
                    // console.log('directionClass result = '+result);
                    return result;
                }
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
