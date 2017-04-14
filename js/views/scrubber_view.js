define(["../models/page_open_request", "vue", "underscore", "html2canvas"], function(PageOpenRequest, Vue, _, H2C) {
  var ScrubberView = function() {

    Vue.component('scrubber-item', {
      props: ['item'],
      template: '<div class="scrubber_item"><img class="scruber_item_img" v-bind:src=item.src v-on:click="click" alt=""></div>',
      methods: {
        click: function(event) {
          this.$emit('click', this.item.src)
        }
      }
    })

    this.scrubber = new Vue({
      el: '#scrubber',
      data: {
        scrubber_index: 0,
        item_list: [
        ],
        scrubber_left:0,
        seen: false,
        needUpdate: true
      },
      computed: {
        item_count: function() {
          return this.item_list.length
        },
        item_width: function() {
          if (this.$refs.scrubber_scroller.childNodes.length > 0) {
            return this.$refs.scrubber_scroller.childNodes[0].clientWidth
          } else {
            return 0
          }
        }
      },
      updated() {
        // console.error("updated!!! scrubber_index = "+this.scrubber_index);
        if (this.needUpdate) {
          this.updateScrollView()
          this.needUpdate = false
        }
      },
      watch: {
        seen: function(val) {
          if (val === true) {
            this.needUpdate = true;
          }
        }
      },
      methods: {
        updateScrubber: function(event) {
          console.log('updateScrubber')
          console.log(this.item_width)
          this.updateScrollView()
          this.goToPage(this.scrubber_index);
        },
        onScrubberScroll: function(event) {
          console.error(event);
          console.error("onScrubberScroll### scrubber_index = "+this.scrubber_index);
          this.scrubber_index = this.$refs.scrubber_scroller.scrollLeft / this.item_width;
        },
        onScroll: function(event) {
          this.updateScrollView()
        },
        updateScrollView: function() {
          console.error("updateScrollView scrubber_index = "+this.scrubber_index);
          this.scrubber_left = this.scrubber_index * this.item_width;
          console.error("updateScrollView this.scrubber_left = "+this.scrubber_left);
          this.$refs.scrubber_scroller.scrollLeft = this.scrubber_left;
          // this.$forceUpdate();
        },
        goToPage: function(index) {
          console.log('goToPage value = '+index)
          var nextSpineItem = ReadiumSDK.reader.spine().items[index];
          var openPageRequest = new PageOpenRequest(nextSpineItem, ReadiumSDK.reader);
          openPageRequest.setFirstPage();
          ReadiumSDK.reader.goToPage(openPageRequest, 2);
        },
        onSelect: function(src) {
          var index = _.indexOf(this.item_list.map(function(item) {return item.src}), src)
          this.goToPage(index)
          this.scrubber_index = index
        }
      }
    })


    this.setupScrubber = function(el) {

    }

  }

  return ScrubberView;
});
