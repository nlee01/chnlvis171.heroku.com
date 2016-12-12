GlobeVis = function(_parentElement, _data, _data2) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.conflictData = _data2;
    this.wrangleData();
};

GlobeVis.prototype.initVis = function() {
    var vis = this;
    vis.animateDots = false;

    vis.margin = { top: 210, right: 0, bottom: 0, left: 0};

    vis.width = $(window).width() - vis.margin.left - vis.margin.right;
    vis.height = $(window).height() - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height);

    vis.tip = d3.tip()
        .attr("class", "map-tooltip")
        .html("");

    vis.projection = d3.geo.mercator()
        .translate([$(window).width()/2, vis.height/1.5])
        .scale(1300);

    vis.path = d3.geo.path()
        .projection(vis.projection);

    vis.g = vis.svg.append("g")
        .attr("transform", "translate(" + (vis.margin.left) + ",0)");

    // vis.g.append("defs").append("clipPath")
    //     .attr("id", "clip")
    //     .append("rect")
    //     .attr("width", vis.width)
    //     .attr("height", vis.height);

    vis.g.selectAll("path")
        .attr("id", "countries")
        .data(vis.data.features)
        .enter().append("path")
        .attr("id", function(d) {
            return d.id;
        })
        .style("fill-opacity", .7)
        .attr("d", vis.path)
        .on("mouseover", function() {
            d3.select(this).style("fill-opacity", 1);
        })
        .on("mouseout", function() {
            d3.selectAll("path")
                .style("fill-opacity", .7)
        });

    vis.tip = vis.tip.html(function(d) {
        return "Conflict: " + d.name + "<br>Year started: "+ (d.year + 1900) +"<br>Fatalities: "+d.count;
    });

    vis.zoom = d3.behavior.zoom()
        .center([vis.width/2, vis.height/2])
        .size([vis.width, vis.height])
        .on("zoom",function() {
            vis.g.attr("transform","translate("+
                d3.event.translate.join(",")+")scale("+d3.event.scale+")");
            vis.g.selectAll("circle")
                .attr("d", vis.path.projection(vis.projection));
            vis.g.selectAll("path")
                .attr("d", vis.path.projection(vis.projection));
        });


    d3.selectAll("button[data-zoom]")
        .on("click", clicked);

    function clicked() {
        vis.svg.call(vis.zoom.event);
        vis.center0 = vis.zoom.center();
        vis.translate0 = vis.zoom.translate();
        vis.coordinates0 = coordinates(vis.center0);
        vis.zoom.scale(vis.zoom.scale()*Math.pow(2, +this.getAttribute("data-zoom")));

        vis.center1 = point(vis.coordinates0);
        vis.zoom.translate([vis.translate0[0] + vis.center0[0] - vis.center1[0], vis.translate0[1] + vis.center0[1] - vis.center1[1]]);
        vis.svg.transition().duration(750).call(vis.zoom.event);
    }
    function coordinates(point) {
        var scale = vis.zoom.scale();
        var translate = vis.zoom.translate();
        return [(point[0] - translate[0])/scale, (point[1] - translate[1])/scale];
    }
    function point(coordinates) {
        var scale = vis.zoom.scale();
        var translate = vis.zoom.translate();
        return [coordinates[0]*scale + translate[0], coordinates[1]*scale + translate[1]];
    }

    vis.svg.call(vis.zoom);

    function convertToRadius(val) {
        if (val < 100) {
            return 1;
        }
        else if (val < 500) {
            return 3;
        }
        else if (val < 1000) {
            return 5;
        }
        else if (val < 5000) {
            return 10;
        }
        else return 20;
    }

    var ind = 0, l = vis.monthlyDataArray.length;
    var direct = vis.g;
    var divDataPoint = null;
    // Define the div for the tooltip

    function appendPoint() {
        if (ind >= l) {
            return;
        }
        if (vis.animateDots) {
            var dataPoint = vis.monthlyDataArray[ind];
            var coords = vis.projection([dataPoint.longitude, dataPoint.latitude]);
            var circle = direct.append("circle")
                .attr("cx", coords[0])
                .attr("cy", coords[1]);
            circle.on("mouseover", function() {
                vis.tip.show(dataPoint);
                divDataPoint = circle[0][0];
            })
                .on("mouseout", vis.tip.hide)
                .attr("r", convertToRadius(dataPoint.count))
                .attr("opacity", 0.7);
            ind++;
            if (ind > 1000) {
                var point = direct.select("circle")[0][0];
                if (point == divDataPoint) {
                    vis.tip.hide();
                }
                point.remove();
            }
        }
        setTimeout(appendPoint, 5);
    }

    appendPoint();
    vis.g.call(vis.tip);

    d3.selectAll("#play")
        .on("click", function() {
            vis.animateDots = !vis.animateDots;
            if (this.innerHTML == "Play") { this.innerHTML = "Pause"; }
            else { this.innerHTML = "Play"; }

        });
    d3.selectAll("#restart")
        .on("click", function() {
            ind = 0;
            vis.g.selectAll("circle")
                .remove();
            vis.tip.hide();
        });

};


GlobeVis.prototype.wrangleData = function() {
    var vis = this;

    var monthlyData = {};
    vis.monthlyDataArray = [];
    vis.conflictData.forEach(function (d) {
        var month= d.date_start.getMonth();
        var year = d.date_start.getYear();
        // var month_year = (month + "-" + year);
        // var date = d3.time.format("%m-%Y").parse(month_year.toString());
        var name = d.conflict_name;

        var pair = String(month) + String(year) + String(name);
        if (pair in monthlyData) {
            monthlyData[pair].count += d.best_est;
        } else {
            var dNew = {
                "month":month,
                "year":year,
                //"date": date,
                "name":name,
                "count":d.best_est,
                "latitude": d.latitude,
                "longitude": d.longitude
            };
            monthlyData[pair] = dNew;
        }
    });


    for (var key in monthlyData) {
        vis.monthlyDataArray.push(monthlyData[key])
    }

    // vis.monthlyDataArray.forEach(function(d) {
    //     d.year = +d.year;
    // });


    vis.initVis();
};

