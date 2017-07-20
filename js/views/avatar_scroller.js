define(["../globals", "underscore", "vue"],
function(Globals, _, Vue) {
    var AvatarScroller = function() {
        Vue.component('avatar-item', {
            props: ['item'],
            template: '<div class="avatar_item"><img class="avatar_item_img" v-bind:src=item.src v-on:click="click" alt=""></div>',
            methods: {
                click: function(event) {
                    this.$emit('click', this.item.src);
                }
            }
        });

        this.scroller = new Vue({
            el: '#read_and_record_editing_container',
            data: {
                item_list: [],
                seen: false,
                recording_name: '',
                isAfterSeen: false,
                selectedIndex: 0
            },
            computed: {
                item_count: function() {
                    return this.item_list.length;
                },
            },
            updated: function() {
                //console.debug("updated: " + this.isAfterSeen);
                if (this.isAfterSeen) {
                    this.setSelectShadow(0);
                    this.isAfterSeen = false;
                }
            },
            watch: {
                seen: function(visible) {
                    //console.debug("seen: " + visible);
                    this.isAfterSeen = visible;
                }
            },
            methods: {
                setSelectShadow: function(index) {
                    _.each(this.$refs.avatar_scroller.childNodes, function(node, i) {
                        if (index != i) {
                            node.style.boxShadow = '';
                        }
                    });
                    this.$refs.avatar_scroller.childNodes[index].style.boxShadow = '0px 0px 5px 5px rgba(0, 178, 209, 0.5)';
                    this.selectedIndex = index;
                },
                onSelect: function(src) {
                    var index = _.indexOf(this.item_list.map(function(item) { return item.src }), src);
                    //console.debug("onSelect: index = " + index);
                    this.setSelectShadow(index);
                },
                onSave: function(event) {
                    //console.debug("onSave: avatar: " + this.item_list[this.selectedIndex].src + ", " + this.recording_name);
                    this.recording_name = '';
                    this.seen = false;
                    ReadiumSDK.reader.emit(Globals.Events.COMPLETE_READ_AND_RECORD,
                            { avatar: this.item_list[this.selectedIndex].src,
                              name: (this.recording_name === "") ? "My Recording" : this.recording_name }
                    );
                },
                onCancel: function(event) {
                    //console.debug("onCancel");
                    this.recording_name = '';
                    this.seen = false;
                    ReadiumSDK.reader.emit(Globals.Events.COMPLETE_READ_AND_RECORD);
                }
            }
        });
    };
    return AvatarScroller;
});
