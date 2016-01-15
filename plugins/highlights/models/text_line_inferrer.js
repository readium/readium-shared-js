define(["../lib/class"], function(Class) {
    var TextLineInferrer = Class.extend({

        init: function(options) {
            this.lineHorizontalThreshold = options.lineHorizontalThreshold || 0;
            this.lineHorizontalLimit = options.lineHorizontalLimit || 0;
        },

        // ----------------- PUBLIC INTERFACE --------------------------------------------------------------

        inferLines: function(rectTextList) {
            var inferredLines = [];
            var numRects = rectTextList.length;
            var numLines = 0;
            var currLine;
            var currRect;
            var currRectTextObj;
            var rectAppended;

            // Iterate through each rect
            for (var currRectNum = 0; currRectNum <= numRects - 1; currRectNum++) {
                currRectTextObj = rectTextList[currRectNum];
                currRect = currRectTextObj.rect;
                // Check if the rect can be added to any of the current lines
                rectAppended = false;

                if (inferredLines.length > 0) {
                    currLine = inferredLines[inferredLines.length - 1];

                    if (this.includeRectInLine(currLine.line, currRect.top, currRect.left,
                            currRect.width, currRect.height)) {
                        rectAppended = this.expandLine(currLine.line, currRect.left, currRect.top,
                            currRect.width, currRect.height);

                        currLine.data.push(currRectTextObj);
                    }
                }

                if (!rectAppended) {
                    inferredLines.push({
                        data: [currRectTextObj],
                        line: this.createNewLine(currRect.left, currRect.top,
                            currRect.width, currRect.height)
                    });
                    // Update the number of lines, so we're not using .length on every iteration
                    numLines = numLines + 1;
                }
            }
            return inferredLines;
        },


        // ----------------- PRIVATE HELPERS ---------------------------------------------------------------

        includeRectInLine: function(currLine, rectTop, rectLeft, rectWidth, rectHeight) {
            // is on an existing line : based on vertical position
            if (this.rectIsWithinLineVertically(rectTop, rectHeight, currLine.maxTop, currLine.maxBottom)) {
                if (this.rectIsWithinLineHorizontally(rectLeft, rectWidth, currLine.left,
                        currLine.width, currLine.avgHeight)) {
                    return true;
                }
            }
            return false;
        },

        rectIsWithinLineVertically: function(rectTop, rectHeight, currLineMaxTop, currLineMaxBottom) {
            var rectBottom = rectTop + rectHeight;
            var lineHeight = currLineMaxBottom - currLineMaxTop;
            var lineHeightAdjustment = (lineHeight * 0.75) / 2;
            var rectHeightAdjustment = (rectHeight * 0.75) / 2;

            rectTop = rectTop + rectHeightAdjustment;
            rectBottom = rectBottom - rectHeightAdjustment;
            currLineMaxTop = currLineMaxTop + lineHeightAdjustment;
            currLineMaxBottom = currLineMaxBottom - lineHeightAdjustment;

            if (rectTop === currLineMaxTop && rectBottom === currLineMaxBottom) {
                return true;
            } else if (rectTop < currLineMaxTop && rectBottom < currLineMaxBottom &&
                rectBottom > currLineMaxTop) {
                return true;
            } else if (rectTop > currLineMaxTop && rectBottom > currLineMaxBottom &&
                rectTop < currLineMaxBottom) {
                return true;
            } else if (rectTop > currLineMaxTop && rectBottom < currLineMaxBottom) {
                return true;
            } else if (rectTop < currLineMaxTop && rectBottom > currLineMaxBottom) {
                return true;
            } else {
                return false;
            }
        },

        rectIsWithinLineHorizontally: function(rectLeft, rectWidth, currLineLeft, currLineWidth,
            currLineAvgHeight) {
            var lineGapHeuristic = 2 * currLineAvgHeight;
            var rectRight = rectLeft + rectWidth;
            var currLineRight = rectLeft + currLineWidth;

            if ((currLineLeft - rectRight) > lineGapHeuristic) {
                return false;
            } else if ((rectLeft - currLineRight) > lineGapHeuristic) {
                return false;
            } else {
                return true;
            }
        },

        createNewLine: function(rectLeft, rectTop, rectWidth, rectHeight) {
            var maxBottom = rectTop + rectHeight;

            return {
                left: rectLeft,
                startTop: rectTop,
                width: rectWidth,
                avgHeight: rectHeight,
                maxTop: rectTop,
                maxBottom: maxBottom,
                numRects: 1
            };
        },

        expandLine: function(currLine, rectLeft, rectTop, rectWidth, rectHeight) {
            var lineOldRight = currLine.left + currLine.width;

            // Update all the properties of the current line with rect dimensions
            var rectRight = rectLeft + rectWidth;
            var rectBottom = rectTop + rectHeight;
            var numRectsPlusOne = currLine.numRects + 1;

            // Average height calculation
            var currSumHeights = currLine.avgHeight * currLine.numRects;
            var avgHeight = Math.ceil((currSumHeights + rectHeight) / numRectsPlusOne);
            currLine.avgHeight = avgHeight;
            currLine.numRects = numRectsPlusOne;

            // Expand the line vertically
            currLine = this.expandLineVertically(currLine, rectTop, rectBottom);
            currLine = this.expandLineHorizontally(currLine, rectLeft, rectRight);

            return currLine;
        },

        expandLineVertically: function(currLine, rectTop, rectBottom) {
            if (rectTop < currLine.maxTop) {
                currLine.maxTop = rectTop;
            }
            if (rectBottom > currLine.maxBottom) {
                currLine.maxBottom = rectBottom;
            }

            return currLine;
        },

        expandLineHorizontally: function(currLine, rectLeft, rectRight) {
            var newLineLeft = currLine.left <= rectLeft ? currLine.left : rectLeft;
            var lineRight = currLine.left + currLine.width;
            var newLineRight = lineRight >= rectRight ? lineRight : rectRight;
            var newLineWidth = newLineRight - newLineLeft;

            //cancel the expansion if the line is going to expand outside a horizontal limit
            //this is used to prevent lines from spanning multiple columns in a two column epub view
            var horizontalThreshold = this.lineHorizontalThreshold;
            var horizontalLimit = this.lineHorizontalLimit;

            var leftBoundary = Math.floor(newLineLeft / horizontalLimit) * horizontalLimit;
            var centerBoundary = leftBoundary + horizontalThreshold;
            var rightBoundary = leftBoundary + horizontalLimit;
            if ((newLineLeft > leftBoundary && newLineRight > centerBoundary && newLineLeft < centerBoundary) || (newLineLeft > centerBoundary && newLineRight > rightBoundary)) {
                return undefined;
            }

            currLine.left = newLineLeft;
            currLine.width = newLineWidth;

            return currLine;
        }
    });

    return TextLineInferrer;
});
