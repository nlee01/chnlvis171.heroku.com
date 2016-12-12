/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

StackedAreaChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
  	this.data = _data;
  	this.displayData = []; // see data wrangling
	this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

StackedAreaChart.prototype.initVis = function(){
	var vis = this;

	vis.margin = { top: 200, right: 100, bottom: 0, left: 100 };

  	vis.wrangleData();
};



/*
 * Data wrangling
 */
StackedAreaChart.prototype.wrangleData = function(){
	var vis = this;
    function addToRegion(d) {
        if (d.region == "Africa") { africa += d.best_est; }
        else if (d.region == "Americas") { americas += d.best_est; }
        else if (d.region == "Asia") { asia += d.best_est; }
        else if (d.region == "Europe") { europe += d.best_est; }
        else if (d.region == "Middle East") { middle_east += d.best_est; }
    }
    for (var i = 0; i < vis.data.length; i++) {
        var africa = 0,
            americas = 0,
            asia = 0,
            europe = 0,
            middle_east = 0,
            year = 2015;
        addToRegion(vis.data[i]);
        function countYear() {
            for (i; i < vis.data.length - 1; i++) {
                if (vis.data[i].date_start.getFullYear() == vis.data[i+1].date_start.getFullYear()) {
                    addToRegion(vis.data[i+1]);
                }
                else { year = vis.data[i].date_start.getFullYear(); return; }
            }
        }
        countYear();
        var newYear = {
            year: d3.time.format("%Y").parse(year.toString()),
            Africa: africa,
            Americas: americas,
            Asia: asia,
            Europe: europe,
            Middle_East: middle_east
        };
        vis.displayData.push(newYear);
    }
    // Set ordinal color scale
    vis.colorScale = d3.scale.category20();
    vis.colorScale.domain(d3.keys(vis.displayData[0]).filter(function(d){ return (d != "year" && d != "best_est"); }));
    var dataCategories = vis.colorScale.domain();
    // // Rearrange data into layers
    var transposedData = dataCategories.map(function(name) {
        return {
            name: name,
            values: vis.displayData.map(function(d) {
                return { name: name, year: d.year, y: d[name]};
            })
        };
    });
    var nestData = d3.nest()
        .key(function(d) { return d.year; })
        .entries(transposedData);

    vis.nvData = [
        {
            "key": "Africa",
            "values": []
        },
        {
            "key": "Americas",
            "values": []
        },
        {
            "key": "Asia",
            "values": []
        },
        {
            "key": "Europe",
            "values": []
        },
        {
            "key": "Middle_East",
            "values": []
        }
    ];

    for (var k = 0; k < vis.displayData.length; k++) {
        vis.nvData[0].values[k] = [vis.displayData[k].year, vis.displayData[k].Africa];
        vis.nvData[1].values[k] = [vis.displayData[k].year, vis.displayData[k].Americas];
        vis.nvData[2].values[k] = [vis.displayData[k].year, vis.displayData[k].Asia];
        vis.nvData[3].values[k] = [vis.displayData[k].year, vis.displayData[k].Europe];
        vis.nvData[4].values[k] = [vis.displayData[k].year, vis.displayData[k].Middle_East];
    }
};

StackedAreaChart.prototype.updateVis = function(){
    var vis = this;
    vis.width = $(window).width() - vis.margin.left - vis.margin.right;
    vis.height = $(window).height() - vis.margin.top - vis.margin.bottom;
    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height);
    nv.addGraph(function() {
        var chart = nv.models.stackedAreaChart()
            .margin({right: 120, left: 150, bottom: 130})
            .x(function(d) { return d[0] })   //We can modify the data accessor functions...
            .y(function(d) { return d[1] })   //...in case your data is formatted differently.
            .useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
            .showControls(false)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
            .clipEdge(false);

        //Format x-axis labels with custom function.
        chart.xAxis
            .tickPadding(5)
            .tickFormat(function(d) {
                return d3.time.format('%Y')(new Date(d))
            });

        chart.yAxis
            .tickPadding(20)
            .tickFormat(d3.format(','));

        d3.select("#stackedareachart svg")
            .datum(vis.nvData)
            .call(chart);
        d3.select(".nv-legendWrap")
            .attr("transform", "translate(-30,30)");

        nv.utils.windowResize(chart.update);

        return chart;
    });
};