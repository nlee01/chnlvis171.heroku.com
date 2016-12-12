

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the
 */

Gauges = function(_parentElement, _data){
	this.parentElement = _parentElement;
	this.data = _data;
    this.count = 0;
	this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Gauges.prototype.initVis = function() {
	var vis = this;

    vis.total_a = 0;
    vis.total_b = 0;
    vis.total_unknown = 0;
    vis.total_civilians = 0;

    vis.data.forEach(function(d) {
        vis.total_a += d.deaths_a;
        vis.total_b += d.deaths_b;
        vis.total_unknown += d.deaths_unknown;
        vis.total_civilians += d.deaths_civilians;
    });

    vis.proportions = $(window).width();
    vis.buffer = { top: 20 };
    vis.hp = 28;
    vis.w = d3.scale.linear()
        .range([0, 2 * Math.round($(window).width()/(vis.hp * 2))])
        .domain([0, d3.max(vis.data, function(d) { return d.deaths_civilians; })]);

    vis.h = d3.scale.linear()
        .range([0, 2 * Math.round($(window).width()/vis.hp)])
        .domain([0, d3.max(vis.data, function(d) { return d.deaths_civilians; })]);

    vis.coffin = { width: 2 * Math.round(vis.proportions/28), height: vis.proportions/6, buffer: vis.proportions/10 };
    vis.coffin_a = { width: vis.w(vis.total_a), height: vis.h(vis.total_a) };
    vis.coffin_b = { width: vis.w(vis.total_b), height: vis.h(vis.total_b) };
    vis.coffin_unknown = { width: vis.w(vis.total_unknown), height: vis.h(vis.total_unknown) };
    vis.coffin_civilians = { width: vis.w(vis.total_civilians), height: vis.h(vis.total_civilians) };
	vis.margin = { top: 100, right: 50, bottom: 50, left: 50 };

	vis.width = $(window).width() - vis.margin.left - vis.margin.right;
	vis.height = $(window).height()/2 - vis.margin.top - vis.margin.bottom;


    vis.coffinPath_a = "" + vis.coffin_a.width / 4 + " 0, " + vis.coffin_a.width * 3 / 4 + " 0, " +
        vis.coffin_a.width + " " + vis.coffin_a.height / 5 + ", " +
        vis.coffin_a.width * 3 / 4 + " " + vis.coffin_a.height + ", " +
        vis.coffin_a.width / 4 + " " + vis.coffin_a.height + ", 0 " +
        vis.coffin_a.height / 5;

    vis.coffinPath_b = "" + vis.coffin_b.width / 4 + " 0, " + vis.coffin_b.width * 3 / 4 + " 0, " +
        vis.coffin_b.width + " " + vis.coffin_b.height/ 5 + ", " +
        vis.coffin_b.width * 3 / 4 + " " + vis.coffin_b.height + ", " +
        vis.coffin_b.width / 4 + " " + vis.coffin_b.height + ", 0 " +
        vis.coffin_b.height/ 5;

    vis.coffinPath_unknown = "" + vis.coffin_unknown.width / 4 + " 0, " + vis.coffin_unknown.width * 3 / 4 + " 0, " +
        vis.coffin_unknown.width + " " + vis.coffin_unknown.height/ 5 + ", " +
        vis.coffin_unknown.width * 3 / 4 + " " + vis.coffin_unknown.height + ", " +
        vis.coffin_unknown.width / 4 + " " + vis.coffin_unknown.height + ", 0 " +
        vis.coffin_unknown.height/ 5;

    vis.coffinPath_civilians = "" + vis.coffin_civilians.width / 4 + " 0, " + vis.coffin_civilians.width * 3 / 4 + " 0, " +
        vis.coffin_civilians.width + " " + vis.coffin_civilians.height/ 5 + ", " +
        vis.coffin_civilians.width * 3 / 4 + " " + vis.coffin_civilians.height + ", " +
        vis.coffin_civilians.width / 4 + " " + vis.coffin_civilians.height + ", 0 " +
        vis.coffin_civilians.height/ 5;

	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("id", "gauge-group")
        .attr("width", $(window).width())
        .attr("height", $(window).height());

    vis.group = vis.svg.append("g")
        .attr("class", "group")
        .attr("transform", "translate(" + (timeline.width*.66) + "," +
            ($(window).height()/2 - vis.coffin_civilians.height*1.7) + ") scale(0.7)");

    vis.g1 = vis.group.append("g")
        .attr("class", "sub-group")
        .attr("transform", "translate(200," + (2*vis.coffin_civilians.height - 3*vis.coffin_a.height/2) + ")");
    vis.g2 = vis.group.append("g")
        .attr("class", "sub-group")
        .attr("transform", "translate(200," + (2*vis.coffin_civilians.height - 3*vis.coffin_b.height/2) + ")");
    vis.g3 = vis.group.append("g")
        .attr("class", "sub-group")
        .attr("transform", "translate(200," + (2*vis.coffin_civilians.height - 3*vis.coffin_unknown.height/2) + ")");
    vis.g4 = vis.group.append("g")
        .attr("class", "sub-group")
        .attr("transform", "translate(200," + (vis.coffin_civilians.height - vis.coffin_civilians.height/2) + ")");
    vis.gauge1 = vis.g1.append("svg")
        .attr("id", "gauge1")
        .attr("width", vis.coffin_a.width * 2)
        .attr("height", vis.coffin_a.height * 2)
        .attr("clip-path", "url(#coffin-clip-a)");
    vis.gauge2 = vis.g2.append("svg")
        .attr("id", "gauge2")
        .attr("width", vis.coffin_b.width * 2)
        .attr("height", vis.coffin_b.height * 2)
        .attr("x", vis.coffin.buffer)
        .attr("clip-path", "url(#coffin-clip-b)");
    vis.gauge3 = vis.g3.append("svg")
        .attr("id", "gauge3")
        .attr("width", vis.coffin_unknown.width * 2)
        .attr("height", vis.coffin_unknown.height * 2)
        .attr("x", 2*vis.coffin.buffer)
        .attr("clip-path", "url(#coffin-clip-unknown)");
    vis.gauge4 = vis.g4.append("svg")
        .attr("id", "gauge4")
        .attr("width", vis.coffin_civilians.width * 2)
        .attr("height", vis.coffin_civilians.height * 2)
        .attr("x", 3*vis.coffin.buffer)
        .attr("clip-path", "url(#coffin-clip-civilians)");

    vis.group.append("defs").append("clipPath")
        .attr("id", "coffin-clip-a")
        .append("polygon")
        .attr("points", vis.coffinPath_a)
        .attr("transform", "translate(" + vis.coffin_a.width/2 + ", " + vis.coffin_a.height/2 + ")");
    vis.group.append("defs").append("clipPath")
        .attr("id", "coffin-clip-b")
        .append("polygon")
        .attr("points", vis.coffinPath_b)
        .attr("transform", "translate(" + vis.coffin_b.width/2 + ", " + vis.coffin_b.height/2 + ")");
    vis.group.append("defs").append("clipPath")
        .attr("id", "coffin-clip-unknown")
        .append("polygon")
        .attr("points", vis.coffinPath_unknown)
        .attr("transform", "translate(" + vis.coffin_unknown.width/2 + ", " + vis.coffin_unknown.height/2 + ")");
    vis.group.append("defs").append("clipPath")
        .attr("id", "coffin-clip-civilians")
        .append("polygon")
        .attr("points", vis.coffinPath_civilians)
        .attr("transform", "translate(" + vis.coffin_civilians.width/2 + ", " + vis.coffin_civilians.height/2 + ")");


    vis.g1
        .append("polygon")
        .attr("class", "coffin-outline")
        .attr("stroke", colors(0))
        .attr("points", vis.coffinPath_a)
        .attr("transform", "translate(" + vis.coffin_a.width/2 + ", " + vis.coffin_a.height/2 + ")");
    vis.g2
        .append("polygon")
        .attr("class", "coffin-outline")
        .attr("stroke", colors(1))
        .attr("points", vis.coffinPath_b)
        .attr("transform", "translate(" + (vis.coffin.buffer + vis.coffin_b.width/2) +
            ", " + vis.coffin_b.height/2 + ")");
    vis.g3
        .append("polygon")
        .attr("class", "coffin-outline")
        .attr("stroke", colors(2))
        .attr("points", vis.coffinPath_unknown)
        .attr("transform", "translate(" + (2*vis.coffin.buffer + vis.coffin_unknown.width/2) +
            ", " + vis.coffin_unknown.height/2 + ")");
    vis.g4
        .append("polygon")
        .attr("class", "coffin-outline")
        .attr("stroke", colors(3))
        .attr("points", vis.coffinPath_civilians)
        .attr("transform", "translate(" + (3*vis.coffin.buffer + vis.coffin_civilians.width/2) +
            ", " + vis.coffin_civilians.height/2 + ")");

    vis.config1 = liquidFillGaugeDefaultSettings();
    vis.config2 = liquidFillGaugeDefaultSettings();
    vis.config3 = liquidFillGaugeDefaultSettings();
    vis.config4 = liquidFillGaugeDefaultSettings();
    vis.config1.maxValue = vis.total_a + vis.total_a*0.03;
    vis.config2.maxValue = vis.total_b + vis.total_b*0.03;
    vis.config3.maxValue = vis.total_unknown + vis.total_unknown*0.03;
    vis.config4.maxValue = vis.total_civilians + vis.total_civilians*0.03;
    vis.config1.radius = vis.h(vis.config1.maxValue)*.52;
    vis.config2.radius = vis.h(vis.config2.maxValue)*.52;
    vis.config3.radius = vis.h(vis.config3.maxValue)*.52;
    vis.config4.radius = vis.h(vis.config4.maxValue)*.52;
    vis.config1.textColor = colors(0);
    vis.config2.textColor = colors(1);
    vis.config3.textColor = colors(2);
    vis.config4.textColor = colors(3);

    vis.gauge_a = loadLiquidFillGauge("gauge1", vis.total_a, vis.config1);
    vis.gauge_b = loadLiquidFillGauge("gauge2", vis.total_b, vis.config2);
    vis.gauge_unknown = loadLiquidFillGauge("gauge3", vis.total_unknown, vis.config3);
    vis.gauge_civilians = loadLiquidFillGauge("gauge4", vis.total_civilians, vis.config4);

    vis.label_a = vis.g1.append("text")
        .attr("class", "coffin-labels")
        .attr("x", vis.coffin_a.width)
        .attr("y", 3*vis.coffin_a.height/2 + 20)
        .text("Side A Deaths");
    vis.label_a = vis.g2.append("text")
        .attr("class", "coffin-labels")
        .attr("text-anchor", "middle")
        .attr("x", vis.coffin_b.width + vis.coffin.buffer)
        .attr("y", 3*vis.coffin_b.height/2 + 20)
        .text("Side B Deaths");
    vis.label_a = vis.g3.append("text")
        .attr("class", "coffin-labels")
        .attr("x", vis.coffin_unknown.width + 2*vis.coffin.buffer)
        .attr("y", 3*vis.coffin_unknown.height/2 + 20)
        .text("Unknown Deaths");
    vis.label_a = vis.g4.append("text")
        .attr("class", "coffin-labels")
        .attr("x", vis.coffin_civilians.width + 3*vis.coffin.buffer)
        .attr("y", 3*vis.coffin_civilians.height/2 + 20)
        .text("Civilian Deaths");
    vis.svg.append("text")
        .attr("class", "gauge-titles gauge-subtitle")
        .attr("y", 50)
        .attr("fill", "white")
        .text("Jan '89 to Jan '90")
        .attr("opacity", 0);

};



/*
 * Data wrangling
 */

Gauges.prototype.wrangleData = function(){
	var vis = this;
    vis.total_a = 0;
    vis.total_b = 0;
    vis.total_unknown = 0;
    vis.total_civilians = 0;
    timeline.displayBarData.forEach(function(d) {
        vis.total_a += d.deaths_a;
        vis.total_b += d.deaths_b;
        vis.total_unknown += d.deaths_unknown;
        vis.total_civilians += d.deaths_civilians;
    });
    // console.log(vis.total_a);
    // console.log(vis.total_b);
    // console.log(vis.total_unknown);
    // console.log(vis.total_civilians);
	// Update the visualization
	vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

Gauges.prototype.updateVis = function(){
	var vis = this;
    vis.gauge_a.update(vis.total_a, vis.config1);
    vis.gauge_b.update(vis.total_b, vis.config2);
    vis.gauge_unknown.update(vis.total_unknown, vis.config3);
    vis.gauge_civilians.update(vis.total_civilians, vis.config4);

    vis.svg.selectAll("text.gauge-subtitle").remove();

    vis.svg.append("text")
        .attr("class", "gauge-titles gauge-subtitle")
        .attr("x", $(window).width()*.525)
        .attr("y", 50)
        .attr("fill", "white")
        .text(function() {
            return d3.time.format("%B '%y")(sbc.brush.extent()[0])
                + " to " +
                d3.time.format("%B '%y")(sbc.brush.extent()[1]);
        });


};