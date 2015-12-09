define(function() {
    var HighlightHelpers = {
        getMatrix: function($obj) {
            var matrix = $obj.css("-webkit-transform") ||
                $obj.css("-moz-transform") ||
                $obj.css("-ms-transform") ||
                $obj.css("-o-transform") ||
                $obj.css("transform");
            return matrix === "none" ? undefined : matrix;
        },
        getScaleFromMatrix: function(matrix) {
            if (matrix) {
                var matrixRegex = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*(-?\d*\.?\d+),\s*0,\s*0\)/;
                var matches = matrix.match(matrixRegex);

                if (matches && matches.length > 0)
                    return matches[1];
            }
            
            return 1.0;
        }
    };

    return HighlightHelpers;
});
