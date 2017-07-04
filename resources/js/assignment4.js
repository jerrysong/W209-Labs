'use strict';

// Define constants
var dataPath = "resources/data/composite.csv"
var svgWidth = 1100;
var svgHeight = 500;
var margin = {
    top: 20,
    right: 80,
    bottom: 30,
    left: 80
};
var chartWidth = svgWidth - margin.left - margin.right;
var chartHeight = svgHeight - margin.top - margin.bottom;
var legendX = chartWidth - 300;
var legendY = -margin.top;
var buttonSelectedColor = "#0000FF";
var buttonUnselectedColor = "#182029";
var tickCount = 5;
var selectedTimeRange = "all_time";
var timeRanges = ["all_time", "one_year", "six_month", "three_month"];
var sampleStart = [0, 52, 26, 13];
var dataMap = {};
var monthMap = {
    0: "Jan",
    1: "Feb",
    2: "Mar",
    3: "Apr",
    4: "May",
    5: "Jun",
    6: "Jul",
    7: "Aug",
    8: "Sept",
    9: "Oct",
    10: "Nov",
    11: "Dec",
};

// Define auxiliary functions
var parseTime = d3.timeParse("%Y-%m-%d");

var parseRow = function(d) {
    return {
        date: parseTime(d.date),
        price: +d.price,
        index: +d.index
    };
};

var highlightSelectedPoint = function(x, y, color) {
    var chart = d3.select("#svg_chart");
    chart.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", color);
};

var highlightSelectedLine = function(x) {
    var chart = d3.select("#svg_chart");
    chart.append("line")
        .attr("id", "highlight_line")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", chartHeight)
        .attr("fill", "none")
        .attr("stroke", "white");
}

var highlightTooltip = function(x, y, date, price, index) {
    // Get the tooptip element
    var tooltip = d3.select("#tooltip")
        .style("left", x + "px")
        .style("top", y + "px");

    tooltip.classed("hidden", false);
    tooltip.select("#time")
        .text("Date: " + date);
    tooltip.select("#price")
        .text("Price: $" + price);
    tooltip.select("#index")
        .text("Search Index: " + index);
};

var unhighlightAll = function() {
    d3.select("#tooltip").classed("hidden", true);
    d3.select("#highlight_line").remove();
    d3.selectAll("circle").remove();
};

var getXScale = function(data) {
    return d3.scaleTime()
        .domain(d3.extent(data, function(d) {
            return d.date;
        }))
        .rangeRound([0, chartWidth]);
};

var getPriceScale = function(data) {
    return d3.scaleLinear()
        .domain([Math.floor(d3.min(data, function(d) {
                return d.price;
            }) / 100) * 100,
            Math.ceil(d3.max(data, function(d) {
                return d.price;
            }) / 100) * 100
        ])
        .rangeRound([chartHeight, 0]);
};

var getIndexScale = function(data) {
    return d3.scaleLinear()
        .domain(d3.extent(data, function(d) {
            return d.index;
        }))
        .rangeRound([chartHeight, 0]);
};

var getFeatures = function(data, xScale, priceScale, indexScale) {
    return [{
            name: "Price",
            color: "#00ffff",
            data: data,
            line: d3.line()
                .x(function(d) {
                    return xScale(d.date);
                })
                .y(function(d) {
                    return priceScale(d.price);
                })(data)
        },
        {
            name: "Search Index",
            color: "#ff0000",
            data: data,
            line: d3.line()
                .x(function(d) {
                    return xScale(d.date);
                })
                .y(function(d) {
                    return indexScale(d.index);
                })(data)
        },
    ];
};

var createSVGChart = function() {
    d3.select("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("id", "svg_chart")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
};

var createLegend = function(features) {
    var textPadding = 30;
    var barPadding = 24;
    var legend = d3.select("#svg_chart")
        .append("g");

    legend.selectAll("rect")
        .data(features)
        .enter().append("rect")
        .attr("x", legendX + 10)
        .attr("y", function(d, i) {
            return i * 20 + barPadding;
        })
        .attr("width", 30)
        .attr("height", 5)
        .attr("fill", function(d) {
            return d.color;
        });

    legend.selectAll("text")
        .data(features)
        .enter().append("text")
        .text(function(d) {
            return d.name;
        })
        .attr("x", legendX + 50)
        .attr("y", function(d, i) {
            return i * 20 + textPadding;
        });
};

var createHorizontalLines = function() {
    var yValues = [];
    var interval = chartHeight / (tickCount - 1);
    for (var i=0; i<tickCount-1; i++) {
        yValues.push(interval * i);
    }
    d3.select("#svg_chart")
        .selectAll("line")
        .data(yValues)
        .enter().append("line")
        .attr("x1", 0)
        .attr("y1", function(d) { return d;})
        .attr("x2", chartWidth)
        .attr("y2", function(d) { return d;} )
        .attr("fill", "none")
        .attr("stroke", "white");
    console.log(yValues)
};

var createButtonHandler = function() {
    d3.selectAll("#menu li")
        .on("click", function() {
            if (selectedTimeRange != this.id) {
                var prevSamplingPointCount = dataMap[selectedTimeRange].length;
                var currSamplingPointCount = dataMap[this.id].length;
                var useAnimation = currSamplingPointCount > prevSamplingPointCount ? false : true;
                selectedTimeRange = this.id;

                // Highlight the selected button and unhighlight the other one
                d3.select(this)
                    .style("background", buttonSelectedColor);
                var selectedData = dataMap[selectedTimeRange];
                // Update the page with the selected data
                updatePage(selectedData, useAnimation);

                // Unhighlight the other buttons, if they are highlighted
                for (var i = 0; i < timeRanges.length; i++) {
                    var curr = timeRanges[i];
                    if (curr != selectedTimeRange) {
                        d3.select("#" + curr)
                            .style("background", buttonUnselectedColor);
                    }
                };
            }
        });
};

var createMouseMovementHandler = function(data) {
    d3.select("#svg_chart")
        .append("rect")
        .datum(data)
        .attr("id", "touch_area")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("fill-opacity", 0)
        .attr("pointer-events", "all")
        .on("mousemove", function(d) {
            var xScale = getXScale(d);
            var priceScale = getPriceScale(d);
            var indexScale = getIndexScale(d);
            var features = getFeatures(d, xScale, priceScale, indexScale);

            // Find the index of the closet line points
            var interval = chartWidth / d.length;
            var coordinates = d3.mouse(this);
            var x = coordinates[0];
            var y = coordinates[1];
            var index = Math.min(d.length - 1, (Math.floor((x - 0.5) / interval)));
            index = Math.max(0, index);
            var date = d[index].date;
            var strDate = monthMap[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();

            // Remove previous tooltip and unhighlight points
            unhighlightAll();

            // Highlight the tooltip and closet samping points
            highlightTooltip(x, y, strDate, d[index].price, d[index].index);

            highlightSelectedPoint(xScale(d[index].date), priceScale(d[index].price), features[0].color);

            highlightSelectedPoint(xScale(d[index].date), indexScale(d[index].index), features[1].color);

            highlightSelectedLine(xScale(d[index].date));
        })
        .on("mouseout", function() {
            unhighlightAll();
        });
};

var createXAxis = function(xScale) {
    d3.select("#svg_chart")
        .append("g")
        .attr("class", "axis")
        .attr("id", "x_axis")
        .attr("transform", "translate(0," + chartHeight + ")")
        .call(d3.axisBottom(xScale))
};

var createYPriceAxis = function(priceScale) {
    var start = priceScale.domain()[0];
    var stop = priceScale.domain()[priceScale.domain().length - 1];
    var ticks = d3.ticks(start, stop, tickCount);

    d3.select("#svg_chart")
        .append("g")
        .call(d3.axisLeft(priceScale).tickValues(ticks))
        .attr("class", "axis")
        .attr("id", "price_axis")
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left / 2)
        .text("Price (US$)");
};

var createYIndexAxis = function(indexScale) {
    var start = indexScale.domain()[0];
    var stop = indexScale.domain()[indexScale.domain().length - 1];
    var ticks = d3.ticks(start, stop, tickCount);

    d3.select("#svg_chart")
        .append("g")
        .call(d3.axisRight(indexScale).tickValues(ticks))
        .attr("class", "axis")
        .attr("id", "index_axis")
        .attr("transform", "translate(" + chartWidth + ",0)")
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", margin.right / 2)
        .text("Google Search Index");
};

var createLinePaths = function(features) {
    d3.select("#svg_chart")
        .append("g")
        .attr("id", "paths")
        .selectAll("path")
        .data(features)
        .enter().append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", function(d) {
            return d.color;
        })
        .attr("d", function(d) {
            return d.line;
        })
};

var createPage = function(data) {
    var xScale = getXScale(data);
    var priceScale = getPriceScale(data);
    var indexScale = getIndexScale(data);
    var features = getFeatures(data, xScale, priceScale, indexScale);

    createSVGChart()

    createLegend(features);

    createHorizontalLines();

    createXAxis(xScale);

    createYPriceAxis(priceScale);

    createYIndexAxis(indexScale);

    createLinePaths(features);

    createMouseMovementHandler(data);

    createButtonHandler()
};

var updateAxis = function(xScale, priceScale, indexScale) {
    d3.select("#x_axis")
        .transition()
        .call(d3.axisBottom(xScale));

    var priceStart = priceScale.domain()[0];
    var priceStop = priceScale.domain()[priceScale.domain().length - 1];
    var priceTicks = d3.ticks(priceStart, priceStop, tickCount);

    d3.select("#price_axis")
        .transition()
        .call(d3.axisLeft(priceScale).tickValues(priceTicks));

    var indexStart = indexScale.domain()[0];
    var indexStop = indexScale.domain()[indexScale.domain().length - 1];
    var indexTicks = d3.ticks(indexStart, indexStop, tickCount);

    d3.select("#index_axis")
        .transition()
        .call(d3.axisRight(indexScale).tickValues(indexTicks));
};

var updateLinePaths = function(features, useAnimation) {
    var paths = d3.select("#paths")
        .selectAll("path")
        .data(features)

    if (useAnimation) {
        paths.transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr("stroke", function(d) {
                return d.color;
            })
            .attr("d", function(d) {
                return d.line;
            });
    } else {
        paths.attr("stroke", function(d) {
                return d.color;
            })
            .attr("d", function(d) {
                return d.line;
            });
    }
};

var updatePage = function(data, useAnimation) {
    var xScale = getXScale(data);
    var priceScale = getPriceScale(data);
    var indexScale = getIndexScale(data);
    var features = getFeatures(data, xScale, priceScale, indexScale);

    updateAxis(xScale, priceScale, indexScale);
    updateLinePaths(features, useAnimation);
    updateMouseMovementHandler(data);
};

var updateMouseMovementHandler = function(data) {
    d3.select("#touch_area")
        .datum(data)
};

var main = function() {
    d3.csv(dataPath, parseRow, function(d) {
        for (var i = 0; i < timeRanges.length; i++) {
            dataMap[timeRanges[i]] = d.slice(-sampleStart[i]);
        }
        createPage(d);
    });
};

// Load the raw data and render the page!
main();
