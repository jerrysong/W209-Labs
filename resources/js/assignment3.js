'use strict';

var parseTime = d3.timeParse("%Y-%m-%d");
var dataPath = "resources/data/eth_btc.csv"

var parseRow = function(d) {
  return {
    week: parseTime(d.week),
    bitcoin: +d.bitcoin,
    ethereum: +d.ethereum
  };
};

d3.csv(dataPath, parseRow, function(data) {
    // Define constants
    var svgWidth = 960;
    var svgHeight = 500;
    var margin = {top: 20, right: 80, bottom: 30, left: 50};
    var chartWidth = svgWidth - margin.left - margin.right;
    var chartHeight = svgHeight - margin.top - margin.bottom;
    var currency = [ ["Bitcoin", "blue"], ["Ethereum", "red"] ];

    // Define scale functions
    var xScale = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d.week; }))
        .rangeRound([0, chartWidth]);

    var yScale = d3.scaleLinear()
        .domain([0, 100])
        .rangeRound([chartHeight, 0]);

    // Define the lines
    var bitcoinLine = d3.line()
        .x(function(d) { return xScale(d.week); })
        .y(function(d) { return yScale(d.bitcoin); });

    var ethereumLine = d3.line()
        .x(function(d) { return xScale(d.week); })
        .y(function(d) { return yScale(d.ethereum); });

    // Plot the line chart
    var chart = d3.select("body")
      .select("div")
      .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    chart.append("g")
        .attr("transform", "translate(0," + chartHeight + ")")
        .attr("class", "axis")
      .call(d3.axisBottom(xScale).ticks(5))
      .append("text")
        .attr("x", chartWidth)
        .attr("y", 20)
        .text("Year");

    chart.append("g")
        .attr("class", "axis")
      .call(d3.axisLeft(yScale).ticks(10))
      .append("text")
        .attr("x", margin.left + 125)
        .attr("y", 6)
        .text("Google Search Trend Index");

    chart.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", currency[0][1])
        .attr("d", bitcoinLine);

    chart.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", currency[1][1])
        .attr("d", ethereumLine);

    var legend = chart.append("g");
    legend.selectAll("rect")
      .data(currency)
      .enter().append("rect")
      .attr("x", 700)
      .attr("y", function(d, i) { return i * 20 - 12;})
      .attr("width", 30)
      .attr("height", 15)
      .attr("fill", function(d) { return d[1];});

    legend.selectAll("text")
      .data(currency)
      .enter().append("text")
      .text(function(d) { return d[0];})
      .attr("x", 740)
      .attr("y", function(d, i) { return i * 20;});
});
