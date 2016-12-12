

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

StackedBarChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
	this.data = _data;
	this.displayData = [];
    this.count = 0;
	this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

StackedBarChart.prototype.initVis = function() {
	var vis = this;

	vis.margin = { top: 50, right: 100, bottom: 50, left: 100 };

	vis.width = $(window).width() - vis.margin.left - vis.margin.right;
	vis.height = $(window).height()/3 - vis.margin.top - vis.margin.bottom;


	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", $(window).width())
	    .attr("height", $(window).height());
    vis.group = vis.svg.append("g")
        .attr("class", "group")
		.attr("transform", "translate(" + vis.margin.left + "," + $(window).height()*.4 + ")");

	// Scales and axes
	vis.x = d3.time.scale()
		.range([0, vis.width]);

	vis.y = d3.scale.linear()
		.rangeRound([vis.height, 0]);

    vis.z = colors;

	vis.xAxis = d3.svg.axis()
		  .scale(vis.x)
		  .orient("bottom");

	vis.yAxis = d3.svg.axis()
	    .scale(vis.y)
	    .orient("left");

	vis.group.append("g")
	    .attr("class", "x-axis axis-timeline")
	    .attr("transform", "translate(0," + vis.height + ")");

	vis.group.append("g")
        .attr("class", "y-axis axis-timeline");



	// TO-DO: (Filter, aggregate, modify data)
	vis.wrangleData();
};



/*
 * Data wrangling
 */

StackedBarChart.prototype.wrangleData = function(){
	var vis = this;

    var parseMonth = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
	// Africa, Americas, Asia, Europe, Middle East
	for (var i = 0; i < vis.data.length; i++) {
		var deaths_a = vis.data[i].deaths_a,
			deaths_b = vis.data[i].deaths_b,
            deaths_civilians = vis.data[i].deaths_civilians,
            deaths_unknown = vis.data[i].deaths_unknown,
            best_est = vis.data[i].best_est;
			month_year = parseMonth[parseInt(vis.data[i].date_start.getMonth())] + "-" + vis.data[i].date_start.getFullYear();

		function countMonth() {
			for (i; i < vis.data.length - 1; i++) {
				if ((parseMonth[parseInt(vis.data[i].date_start.getMonth())] + vis.data[i].date_start.getFullYear()) ==
                    (parseMonth[parseInt(vis.data[i+1].date_start.getMonth())] + vis.data[i+1].date_start.getFullYear())) {
                    deaths_a += vis.data[i+1].deaths_a;
                    deaths_b += vis.data[i+1].deaths_b;
                    deaths_civilians += vis.data[i+1].deaths_civilians;
                    deaths_unknown += vis.data[i+1].deaths_unknown;
                    best_est += vis.data[i+1].best_est;
				}
				else {
				    month_year = parseMonth[parseInt(vis.data[i].date_start.getMonth())] + "-" + vis.data[i].date_start.getFullYear();
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

    vis.categories = ["deaths_a", "deaths_b", "deaths_unknown", "deaths_civilians"];

    vis.layers = d3.layout.stack()(vis.categories.map(function(c) {
        return vis.displayData.map(function(d) {
            return {x: d.month_year, y: d[c]};
        });
    }));

    vis.x.domain(d3.extent(vis.displayData, function(d) { return d.month_year; }));
    vis.y.domain([0, d3.max(vis.displayData, function(d) { return d.best_est; })]);
	// Update the visualization
	vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

StackedBarChart.prototype.updateVis = function(){
	var vis = this;

    vis.layer = vis.group.selectAll(".layer")
        .data(vis.layers)
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return vis.z(i); });

    vis.bars = vis.layer.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr("class", "bar")
        .transition()
        .attr("x", function(d, i) { return i*(vis.x(vis.x.domain()[1])/vis.displayData.length); })
        .attr("y", function(d) { return vis.y(d.y + d.y0); })
        .attr("height", function(d) { return vis.y(d.y0) - vis.y(d.y + d.y0); })
        .attr("width", vis.x(vis.x.domain()[1])/vis.displayData.length - 1);

    var s = new Date(1989, 0, 1),
        e = new Date(1990, 0, 1);
    // initialize and appendbrush component
    vis.brush = d3.svg.brush()
        .x(vis.x)
        .extent([s, e])
        .on("brush", sbcBrushed);

    vis.start_box = vis.group.append("rect")
        .attr("class", "start-vis")
        .attr("width", 100)
        .attr("height", 60)
        .attr("x", 100)
        .attr("y", -vis.height*1.5)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .on("click", function() {
            vis.start();
            setTimeout(function() {
                vis.group.append("g")
                    .attr("class", "x brush")
                    .call(vis.brush)
                    .selectAll("rect")
                    .attr("y", -5)
                    .attr("height", vis.height + 5);
            }, 1000);
        });
    vis.start_text = vis.group.append("text")
        .attr("class", "start-vis-text")
        .attr("x", 150)
        .attr("y", -vis.height*1.5 + 36)
        .attr("text-anchor", "middle")
        .text("GO")
        .attr("fill", "white")
        .on("click", function() {
            vis.start();
            setTimeout(function() {
                vis.group.append("g")
                    .attr("class", "x brush")
                    .call(vis.brush)
                    .selectAll("rect")
                    .attr("y", -5)
                    .attr("height", vis.height + 5);
            }, 1000);
        });


    // Call axis functions with the new domain
	vis.svg.select(".x-axis").transition().call(vis.xAxis);
	// vis.svg.select(".y-axis").transition().call(vis.yAxis);
};

StackedBarChart.prototype.start = function(){
    var vis = this;
    vis.start_box.attr("display", "none");
    vis.start_text.attr("display", "none");
    vis.group
        .transition()
        .duration(1000)
        .attr("transform", "translate(" + vis.margin.left + "," + (timeline.height + $(window).height()*.15) + ")");

    vis.svg.selectAll(".bar")
        .transition()
        .duration(1000)
        .attr("opacity", 1);
    vis.svg.selectAll(".bar")
        .transition()
        .delay(500)
        .duration(1000)
        .attr("fill", "gray");
	d3.select(".gauges-subtitle").attr("x", timeline.width + 80);
    gauges.group
        .transition()
        .delay(500)
        .duration(1000)
        .attr("transform", "translate(" + (timeline.width + 80) + "," +
            (-gauges.coffin_civilians.height*.77) + ") scale(0.8)");

    timeline.selectionChanged(sbc.brush.extent());
    timeline.group.transition().delay(1000).duration(1000).attr("opacity", 1);
    setTimeout(function() {
        gauges.wrangleData();
    }, 500);


};