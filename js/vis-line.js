/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

LineChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
  	this.data = _data;
  	this.displayData = []; // see data wrangling
	this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

LineChart.prototype.initVis = function(){
	var vis = this;
	vis.margin = { top: 50,
        right: $(window).width()*.05, bottom: 30, left: $(window).width()*.05 };

	vis.width = $(window).width() - vis.margin.left - vis.margin.right;
  	vis.height = $(window).height() - vis.margin.top - vis.margin.bottom;


  	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height);
	    // .attr("height", vis.height + vis.margin.top + vis.margin.bottom);
    vis.group = vis.svg.append("g")
        .attr("width", vis.width)
	    .attr("transform", "translate(" + (vis.margin.left + vis.margin.right) + "," + (-vis.margin.bottom) + ")");


	// Scales and axes
  	vis.x = d3.time.scale()
		.range([0, vis.width - vis.margin.left - vis.margin.right]);

	vis.y = d3.scale.linear()
		.range([vis.height, 0]);

	vis.xAxis = d3.svg.axis()
		  .scale(vis.x)
		  .orient("bottom");

	vis.yAxis = d3.svg.axis()
	    .scale(vis.y)
	    .orient("left");

	vis.group.append("g")
	    .attr("class", "x-axis axis")
	    .attr("transform", "translate(0," + (vis.height + 10) + ")")
        .attr("stroke-width", 0);

	vis.group.append("g")
        .attr("class", "y-axis axis");



    vis.defs = vis.svg.append("defs")
        .append("pattern")
        .attr("class", "image")
        .attr("id", "preview-background-image")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", vis.width)
        .attr("height", vis.height);
    vis.backgroundimage = vis.defs.append("image")
        .attr("xlink:href", "img/syria-rubble3.jpg")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .attr("preserveAspectRatio", "none")
        .attr("x", -vis.margin.left);

    vis.preview = vis.group.append("rect")
        .attr("class", "rect")
        .attr("id", "preview")
        .attr("width", vis.width - vis.margin.left - vis.margin.right)
        .attr("height", vis.height - vis.margin.bottom)
        .attr("fill", "url(#preview-background-image)")
        .attr("x", 0)
        .attr("y", 0)
        .attr("opacity", 0);
    vis.previewtitlebackground = vis.svg.append("rect")
        .attr("class", "rect rect-background")
        .attr("id", "title-background")
        .attr("fill", "white")
        .attr("x", vis.width/2 + vis.margin.left - 100)
        .attr("y", vis.height/2 - vis.margin.bottom - 40)
        .attr("rx", 3)
        .attr("width", 200)
        .attr("height", 80)
        .attr("opacity", 0);
    vis.previewtitle = vis.svg.append("text")
        .attr("class", "preview preview-title0")
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.height/2 - vis.margin.bottom - 5)
        .text("What's Happened?")
        .attr("opacity", 0);
    vis.previewsubtitle = vis.svg.append("text")
        .attr("class", "preview preview-subtitle0")
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.height/2 - vis.margin.bottom + 18)
        .text("Interact with the circles to see more")
        .attr("opacity", 0);

  	vis.wrangleData();
};



/*
 * Data wrangling
 */
LineChart.prototype.wrangleData = function(){
	var vis = this;
    d3.json("data/news.json", function(data) {
        function addToRegion(d) {
            if (d.region == "Africa") { africa += d.best_est; }
            else if (d.region == "Americas") { americas += d.best_est; }
            else if (d.region == "Asia") { asia += d.best_est; }
            else if (d.region == "Europe") { europe += d.best_est; }
            else if (d.region == "Middle East") { middle_east += d.best_est; }
            total += d.best_est;
        }
        for (var i = 0; i < vis.data.length; i++) {
            var africa = 0,
                americas = 0,
                asia = 0,
                europe = 0,
                middle_east = 0,
                total = 0,
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
                Middle_East: middle_east,
                Total: total
            };
            vis.displayData.push(newYear);
        }

        for (var j = 0; j < data.length; j++) {
            vis.displayData[j].headline = data[j].headline;
            vis.displayData[j].news_date = data[j].news_date;
            vis.displayData[j].content = data[j].content;
            vis.displayData[j].source = data[j].source;
            vis.displayData[j].source_name = data[j].source_name;
        }

        // Update the visualization
        vis.updateVis();
    });
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */
LineChart.prototype.updateVis = function(){
	var vis = this;

    vis.x.domain(d3.extent(vis.displayData, function(d) { return d.year; }));
    vis.y.domain([0, d3.max(vis.displayData, function(d) { return d.Total; })]);
    var valueline = d3.svg.line()
        .x(function(d) { return vis.x(d.year); })
        .y(function(d) { return vis.y(d.Total); });
    var valueline2 = d3.svg.line()
        .x(function(d) { return vis.x(d.year); })
        .y(function() { return vis.y(0); });



    vis.preview
        .transition()
        .delay(1500)
        .duration(1000)
        .attr("opacity", 1);
    vis.previewtitlebackground
        .transition()
        .delay(2000)
        .duration(500)
        .attr("opacity", .8);
    vis.previewtitle
        .transition()
        .delay(2000)
        .duration(500)
        .attr("opacity", 1);
    vis.previewsubtitle
        .transition()
        .delay(2000)
        .duration(500)
        .attr("opacity", 1);



    var defaults = {
        "width": vis.width/2 - (vis.margin.left + vis.margin.right),
        "height": vis.height/2
    };
    if ($(window).width() < 700) {
        defaults.align = "middle";
        defaults.width = vis.width - 2*(vis.margin.right + vis.margin.left);

    }
    else { defaults.align = "left"; }
    vis.svg.selectAll("text.preview-title")
        .data(vis.displayData)
        .enter()
        .append("text")
        .attr("class", "preview preview-title")
        .attr("id", function(d) { return "preview-title-" + d.year.getFullYear(); })
        .attr("text-anchor", "right")
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.margin.top + vis.margin.bottom)
        .text(function(d) {
            return d.year.getFullYear()
        });
    vis.svg.selectAll("text.preview-subtitle")
        .data(vis.displayData)
        .enter()
        .append("text")
        .attr("class", "preview preview-subtitle")
        .attr("id", function(d) { return "preview-subtitle-" + d.year.getFullYear(); })
        .attr("text-anchor", "right")
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.margin.top + vis.margin.bottom + 25)
        .text(function(d) {
            return d3.format(',')(d.Total) + " Total Deaths";
        });
    vis.svg.selectAll("text.preview-subtitle")
        .data(vis.displayData)
        .enter()
        .append("text")
        .attr("class", "preview preview-subtitle")
        .attr("id", function(d) { return "preview-subtitle-" + d.year.getFullYear(); })
        .attr("text-anchor", "right")
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.margin.top + vis.margin.bottom + 25)
        .text(function(d) {
            return "Total Deaths: " + d.Total;
        });
    vis.svg.selectAll("text.headline")
        .data(vis.displayData)
        .enter().append("text")
        .attr("class", "headline")
        .attr("text-anchor", function() {
            if ($(window).width() < 700) { return "middle"; }
            else { return "left"; }
        })
        .attr("id", function(d) { return "headline-" + d.year.getFullYear(); })
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.margin.top + vis.margin.bottom + 70)
        .text(function(d) { return d.headline; });
    vis.svg.selectAll("text.headline-subtitle")
        .data(vis.displayData)
        .enter().append("text")
        .attr("class", "headline-subtitle")
        .attr("text-anchor", function() {
            if ($(window).width() < 700) { return "middle"; }
            else { return "left"; }
        })
        .attr("id", function(d) { return "headline-subtitle-" + d.year.getFullYear(); })
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.margin.top + vis.margin.bottom + 107)
        .text(function(d) { return d.news_date; });

    vis.svg.selectAll("text.content")
        .data(vis.displayData)
        .enter()
        .append("text")
        .attr("class", "wrap content")
        .attr("id", function(d) { return "wrap-content-" + d.year.getFullYear(); })
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.margin.top + vis.margin.bottom + 140)
        .text(function(d) { return d.content; });

    vis.svg.selectAll("text.source")
        .data(vis.displayData)
        .enter()
        .append("svg:text")
        .attr("class", "wrap source")
        .attr("id", function(d) { return "wrap-source-" + d.year.getFullYear(); })
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.height*3/5)
        .attr("font-size", 11)
        .text(function(d) { return "See this article on " + d.source_name; })
        .on("click", function(d) {
            window.open(d.source);
        });
    vis.svg.selectAll("text.source-more")
        .data(vis.displayData)
        .enter()
        .append("svg:text")
        .attr("class", "wrap source-more")
        .attr("id", function(d) { return "wrap-source-more-" + d.year.getFullYear(); })
        .attr("x", vis.width/2 + vis.margin.left)
        .attr("y", vis.height*3/5 + 20)
        .attr("font-size", 11)
        .text(function(d) { return "[see other major conflicts in " + d.year.getFullYear() + "]"; })
        .on("click", function(d) {
            window.open("https://en.wikipedia.org/wiki/Category:Conflicts_in_" + d.year.getFullYear());
        });
    vis.svg.selectAll(".preview-image")
        .data(vis.displayData)
        .enter()
        .append("svg:image")
        .attr("class", "preview-image")
        .attr("id", function(d) { return "preview-image-" + d.year.getFullYear(); })
        .attr("x", vis.width/8 + vis.margin.left)
        .attr("y", vis.margin.top + vis.margin.bottom + 50)
        .attr("width", vis.width/3)
        .attr("height", vis.height*6/11)
        .attr("xlink:href", function(d) { return "img/news/" + d.year.getFullYear() + ".jpg"; });


    vis.line = vis.group.append("path")
        .attr("class", "line")
        .attr("d", valueline(vis.displayData))
        .attr("stroke", "red")
        .attr("stroke-width", 3)
        .attr("fill", "none");

    vis.points = vis.group.selectAll("point")
        .data(vis.displayData)
        .enter().append("circle")
        .attr("class", "point")
        .attr("id", function(d) { return "point-" + d.year.getFullYear(); })
        .attr("r", 6)
        .attr("fill", "black")
        .attr("stroke", "white")
        .attr("cx", function(d) { return vis.x(d.year); })
        .attr("cy", function(d) { return vis.y(d.Total); });
    setTimeout(function() {
        vis.points
            .on("mouseover", function(d) {
                vis.group.selectAll(".point").transition().attr("opacity", 0.4).attr("r", 6).attr("stroke-width", 1);
                vis.group.select(".line").transition().attr("opacity", 0.5);
                vis.group.select("#point-" + d.year.getFullYear()).transition().attr("opacity", 1).attr("r", 12).attr("stroke-width", 3);
                view(d.year.getFullYear());
            })
            .on("mouseout", function() {
                vis.group.selectAll(".point").transition().delay(1000).attr("opacity", 1);
                vis.group.select(".line").transition().delay(1000).attr("opacity", 1);
            });
    }, 2000);

    $(".preview-title").hide();
    $(".preview-subtitle").hide();
    $(".headline").hide();
    $(".headline-subtitle").hide();
    $(".wrap").hide();
    $(".preview-image").hide();
    vis.line
        .transition()
        .delay(500)
        .duration(1000)
        .attr("d", valueline2(vis.displayData));
    vis.points
        .transition()
        .delay(500)
        .duration(1000)
        .attr("cy", vis.y(0));

    vis.wrapped = [];
    function view(year) {
        $(".preview").fadeOut(500);
        $("#preview-title-" + year).fadeIn(500);
        $(".headline").fadeOut(500);
        $("#headline-" + year).fadeIn(500);
        $(".headline-subtitle").fadeOut(500);
        $("#headline-subtitle-" + year).fadeIn(500);
        $(".wrap").fadeOut(500);
        $("#wrap-content-" + year).fadeIn(500);
        $("#wrap-source-" + year).fadeIn(500);
        $("#wrap-source-more-" + year).fadeIn(500);
        function alreadyWrapped(y) {
            if (vis.wrapped.indexOf(y) == -1) {
                d3plus.textwrap()
                    .container(d3.select("#wrap-content-" + year))
                    .align(defaults.align)
                    .config(defaults)
                    .draw();
                d3plus.textwrap()
                    .container(d3.select("#headline-" + year))
                    .align(defaults.align)
                    .config(defaults)
                    .draw();
                vis.wrapped.push(y);
            }
        }
        alreadyWrapped(year);
        $("#preview-subtitle-" + year).fadeIn(500);
        vis.svg.select("#title-background")
            .transition()
            .duration(500)
            .attr("x", 0)
            .attr("y", -vis.margin.top)
            .attr("rx", 3)
            .attr("width", function() {
                return (vis.backgroundimage.node().getBBox().width - vis.margin.left - vis.margin.right - 10);
            })
            .attr("height", vis.height - vis.margin.top - 20)
            .attr("transform", "translate(" +
                (vis.margin.left + vis.margin.right + 5) + "," +
                (vis.margin.top + 5) + ")");
        $(".preview-image").fadeOut(500);
        if ($(window).width() > 700) { $("#preview-image-" + year).fadeIn(500); }
    }

    // Call axis functions with the new domain
    vis.group.select(".x-axis").call(vis.xAxis);
};
// function mousemove takes the position of the viewer's cursor on the focus svg rectangle and dynamically
// maps the circle and vertical line to the currently focused cursor position.