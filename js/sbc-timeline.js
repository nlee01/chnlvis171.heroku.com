

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the
 */

Timeline = function(_parentElement, _data){
	this.parentElement = _parentElement;
	this.data = _data;
	this.displayData = []; // see data wrangling

	// DEBUG RAW DATA
	// console.log(this.data);
	this.count = 0;
	this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Timeline.prototype.initVis = function() {
	var vis = this;

	vis.margin = { top: 10, right: 50, bottom: 60, left: 140 };

	vis.width = $(window).width()*.47 - vis.margin.left - vis.margin.right;
	vis.height = $(window).height()*.4 - vis.margin.top - vis.margin.bottom;


	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
		.attr("width", vis.width + vis.margin.left + vis.margin.right)
		.attr("height", vis.height + vis.margin.top + vis.margin.bottom);
	vis.group = vis.svg.append("g")
		.attr("class", "group")
		.attr("transform", "translate(" + vis.margin.left + "," +
			(vis.margin.top) + ")")
        .attr("opacity", 0);

	// Scales and axes
	vis.x = d3.time.scale()
		.range([0, vis.width]);

	vis.y = d3.scale.linear()
		.rangeRound([vis.height, 0]);

	// vis.z = d3.scale.category10();
    vis.z = colors;

	vis.xAxis = d3.svg.axis()
		.scale(vis.x)
		.orient("bottom")
        .ticks(12)
        .tickFormat(d3.time.format("%b '%y"));

	vis.yAxis = d3.svg.axis()
		.scale(vis.y)
		.orient("left");

	vis.group.append("g")
		.attr("class", "x-axis axis")
		.attr("transform", "translate(0," + vis.height + ")");

	vis.group.append("g")
		.attr("class", "y-axis axis");

	// TO-DO: (Filter, aggregate, modify data)
	vis.wrangleData();
};



/*
 * Data wrangling
 */

Timeline.prototype.wrangleData = function(){
	var vis = this;

	vis.parseMonth = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
	// Africa, Americas, Asia, Europe, Middle East
	for (var i = 0; i < vis.data.length; i++) {
		var deaths_a = vis.data[i].deaths_a,
			deaths_b = vis.data[i].deaths_b,
			deaths_civilians = vis.data[i].deaths_civilians,
			deaths_unknown = vis.data[i].deaths_unknown,
			best_est = vis.data[i].best_est;
		month_year = vis.parseMonth[parseInt(vis.data[i].date_start.getMonth())] + "-" + vis.data[i].date_start.getFullYear();

		function countMonth() {
			for (i; i < vis.data.length - 1; i++) {
				if ((vis.parseMonth[parseInt(vis.data[i].date_start.getMonth())] + vis.data[i].date_start.getFullYear()) ==
					(vis.parseMonth[parseInt(vis.data[i+1].date_start.getMonth())] + vis.data[i+1].date_start.getFullYear())) {
					deaths_a += vis.data[i+1].deaths_a;
					deaths_b += vis.data[i+1].deaths_b;
					deaths_civilians += vis.data[i+1].deaths_civilians;
					deaths_unknown += vis.data[i+1].deaths_unknown;
					best_est += vis.data[i+1].best_est;
				}
				else {
					month_year = vis.parseMonth[parseInt(vis.data[i].date_start.getMonth())] + "-" + vis.data[i].date_start.getFullYear();
					return;
				}
			}
		}
		countMonth();
		var newMonth = {
			month_year: d3.time.format("%m-%Y").parse(month_year.toString()),
			deaths_a: deaths_a,
			deaths_b: deaths_b,
			deaths_civilians: deaths_civilians,
			deaths_unknown: deaths_unknown,
			best_est: best_est
		};
		vis.displayData.push(newMonth);
	}

	function getTotal(data) {
		var t = 0;
		data.forEach(function(d) {
			t += d.best_est;
		});
		return t;
	}

    vis.selectionChanged(sbc.brush.extent());
};

Timeline.prototype.createLayers = function(){
    var vis = this;

    vis.categories = ["deaths_a", "deaths_b", "deaths_unknown", "deaths_civilians"];

    vis.layers = d3.layout.stack()(vis.categories.map(function(c) {
        return vis.displayBarData.map(function(d) {
            return {x: d.month_year, y: d[c]};
        });
    }));

    // Update the visualization
    vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

Timeline.prototype.updateVis = function(){
	var vis = this;

    vis.y.domain([0, d3.max(vis.displayBarData, function(d) { return d.best_est; })]);

	vis.layer = vis.group.selectAll(".layer")
		.data(vis.layers);
    vis.bars = vis.layer.selectAll(".bar")
        .data(function(d) { return d; });

    vis.layer.exit().remove();
    vis.bars.exit().remove();

    vis.layer
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return vis.z(i); });
    vis.bars.enter().append("rect")
		.attr("class", "bar sbc-bar")
        .on("mouseover", function() {
            console.log("mouse");
            tooltip.style("display", null);
        })
        .on("mouseout", function() {
            console.log("mouse");
            tooltip.style("display", "none");
        })
        .on("mousemove", function(d) {
            console.log("mouse");
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 25;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text("Deaths: " + d.y);
        })
        .on("click", function() { console.log("clicked!"); })
		.attr("opacity", 0.7);


    vis.bars
		.transition()
        .attr("x", function(d,i) { return i * (vis.width/vis.displayBarData.length); })
		.attr("y", function(d) { return vis.y(d.y + d.y0); })
        .attr("width", vis.width/vis.displayBarData.length)
        .attr("height", function(d) { return vis.y(d.y0) - vis.y(d.y + d.y0); });

	// Call axis functions with the new domain
	vis.svg.select(".x-axis").transition().call(vis.xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function() {
            return "rotate(-45)"
        });

    var tooltip = vis.svg.append("g")
        .attr("class", "tooltip")
        .style("display", "none");

    tooltip.append("rect")
        .attr("width", 30)
        .attr("height", 20)
        .attr("fill", "white")
        .style("opacity", 0.5);

    tooltip.append("text")
        .attr("x", 15)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");


	vis.svg.select(".y-axis").transition().call(vis.yAxis);
};

Timeline.prototype.selectionChanged = function(brushRegion){
    var vis = this;
    vis.limit = brushRegion;
    vis.displayBarData = vis.displayData.filter(function(d) {
        return (d.month_year >= vis.limit[0] && d.month_year < vis.limit[1]);
    });
    vis.limitPlusOne = new Date(new Date(vis.limit[1]).setMonth(vis.limit[1].getMonth() + 1));
    vis.x.domain([vis.limit[0], vis.limitPlusOne]);
    vis.createLayers();
};