define(["./view"], function(HighlightView) {

    // This is not a backbone view.

    var HighlightBorderView = HighlightView.extend({

        template: "<div class=\"rd-highlight-border\"></div>",

        setCSS: function() {

            this.$el.css({
                backgroundClip: 'padding-box',
                borderStyle: 'solid',
                borderWidth: '5px',
                boxSizing: "border-box"
            });
            this._super();
        },

        setBaseHighlight: function() {

            this.$el.addClass("highlight-border");
            this.$el.removeClass("hover-highlight-border").removeClass("focused-highlight-border");
        },

        setHoverHighlight: function() {

            this.$el.addClass("hover-highlight-border");
            this.$el.removeClass("highlight-border");
        },

        setFocusedHighlight: function() {
            this.$el.addClass('focused-highlight-border');
            this.$el.removeClass('highlight-border').removeClass('hover-highlight-border');
        }
    });

    return HighlightBorderView;
});
