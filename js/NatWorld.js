var width = parseInt(d3.select("#visContainer").style("width")),
  paddingHor = 50,
  cellSize = (width - paddingHor * 2) / 53,
  paddingTop = 30,
  height = cellSize * 7 + paddingTop * 2.5;

var data,
  weekday = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
  month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var year = d3.time.format("%Y"),
  week = d3.time.format("%U"),
  day = d3.time.format("%w"),
  format = d3.time.format("%-m/%-d/%Y");

//Set up svg's with years for datasets
var visSvg = d3.select("#visContainer").selectAll("svg")
  .data(d3.range(2012,2015))
  .enter().append("svg")
  .attr({
    "class": "Reds",
    "width": width,
    "height": height,
  })
  .append("g")
    .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + ((height - cellSize * 7) / 2 + paddingTop) + ")");

//Create and position day cells in columns by week and row by day
var rectDay = visSvg.selectAll(".day")
  .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("rect")
  .attr({
    "class": "day",
    "width": cellSize,
    "height": cellSize,
    "x": function(d) { return week(d) * cellSize; },
    "y": function(d) { return day(d) * cellSize; }
  })
  .datum(format);

//Create and arrange title for visualizations
  d3.selectAll("svg").selectAll(".year-title")
  .data(function(d) { return d3.time.years(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("text")
  .text(function(d) { return year(d); })
  .attr({
    "class": "year-title",
    "x": width / 2,
    "y": paddingTop,
    "text-anchor": "center"
  });

//Create and arrange x-axis text
d3.selectAll("svg")
  .append("g")
  .attr("class", "axis").selectAll("x")
    .data(weekday)
    .enter().append("text")
    .text(function(d) { return  d; })
    .attr({
      "x": 5,
      "y": function(d,i) { return ((height - cellSize * 7) / 2  + paddingTop) + i * cellSize + cellSize/2; },
      "alignment-baseline": "middle"
    });

//Create and arrange y-axis text
d3.selectAll("svg")
  .append("g")
  .attr("class", "axis").selectAll("y")
  .data(month)
  .enter().append("text")
  .text(function(d) { return  d; })
  .attr({
    "x": function(d,i) { return ((height - cellSize * 7) / 2) + i*4.4 * cellSize + cellSize/2; },
    "y": ((height - cellSize * 7) / 2  + paddingTop - 20),
    "alignment-baseline": "middle"
});

//Load data from csv
d3.csv("NatWorldDailyStats.csv", function(error, csv) {
  data = d3.nest()
    .key(function(d) { return d.Date; })
    .map(csv);

  //Create color scale
  var color = d3.scale.quantize()
    .domain([0, 50]) //d3.mean(d3.values(data), function(d) {return parseInt(d[0].Visitors)})
    .range(d3.range(8).map(function(d) { return "q" + d + "-9"; }));

  //Filter day cells by those in dataset and color based on visitors/hour
  rectDay.filter(function(d) { return d in data; })
    .attr("class", function(d) { return data[d][0].Hours === "0" || data[d][0].Hours === "" ? "day q9-9" : "day " + color(data[d][0].Visitors / data[d][0].Hours); });

  var legend = d3.select("#legend")
    .append("svg")
    .attr({
      "class": "Reds",
      "width": width,
      "height": 100
    });

  legend.selectAll("key")
    .data(color.range())
    .enter().append("rect")
    .attr({
      "class": function(d) { console.log(d); return d; },
      "stroke": "#000",
      "width": cellSize,
      "height": cellSize,
      "x": function(d, i) { return cellSize * (i + 1); },
      "y": (100 - cellSize) / 2
    });

  legend.append("text")
    .attr({
      "x": cellSize * 10 / 2,
      "y": (100 - cellSize) / 2 - cellSize / 4,
      "text-anchor": "middle"
    })
    .text("Visitors per Hour");

  legend.append("text")
    .attr({
      "x": cellSize * 2,
      "y": (100 - cellSize) / 2 + cellSize * 3/2 + 5,
      "text-anchor": "end"
    })
    .text("< " + color.invertExtent("q0-9")[1]);

  legend.append("text")
    .attr({
      "x": cellSize * 8,
      "y": (100 - cellSize) / 2 + cellSize * 3/2 + 5,
      "text-anchor": "start"
    })
    .text("> " + color.invertExtent("q7-9")[0]);
});

//Create tooltip
var tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style({
    "position": "absolute",
    "visibility": "hidden"
  });

//Fire tooltip on mouse hover over day cells
d3.selectAll(".day").on("mouseover", function (d) {
  tooltip.style("visibility", "visible");
  tooltip.html(data[d][0].Hours !== "0" ?
    "<p class='text-center'><strong>" + data[d][0].Date + "</strong></p>" +
    "<p><strong>Visitors: </strong>" + data[d][0].Visitors + "</p>" +
    "<p><strong>Hours open: </strong>" + data[d][0].Hours + "</p>" +
    "<p><strong>Visitors/Hour: </strong>" + Math.round(data[d][0].Visitors / data[d][0].Hours * 10) / 10 + "</p>"
    :
    "<p class='text-center'><strong>" + data[d][0].Date + "</strong></p>" +
    "<p class='text-center'><strong>Closed</strong></p>" +
    "<p class='text-center'><strong>" + data[d][0].Notes + "</strong></p>"
  )
  .style({
    "left": window.innerWidth - d3.event.pageX < 150 ? d3.event.pageX - 150 + "px" : d3.event.pageX + 25 + "px",
    "top": (d3.event.pageY) + "px"
  });
});

//Remove tooltip on mouse out
d3.selectAll(".day").on("mouseout", function () {
  tooltip.style("visibility", "hidden");
});
