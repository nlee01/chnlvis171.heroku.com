
// Will be used to the save the loaded JSON data
var allData = [];

// Date parser to convert strings to date objects
var parseDate = d3.time.format("%Y").parse;

// Set ordinal color scale
var colorScale = d3.scale.category20();

// Variables for the visualization instances
var sbc, timeline, gauges;

// Variable for the color scheme

var colors = d3.scale.ordinal()
    .range(["#377eb8", "#984ea3", "#4daf4a", "#e41a1c"]);

function sbcGo() {
    console.log("sbc-setup...");
    sbc = new StackedBarChart("stackedbarchart", allCSV);
    timeline = new Timeline("timeline", allCSV);
    gauges = new Gauges("gauges", timeline.displayData);
    console.log("...done");

}

function sbcBrushed() {
    if (!(sbc.brush.empty())) {
        sbc.start = d3.time.format("%m-%Y").parse(timeline.parseMonth[parseInt(sbc.brush.extent()[0].getMonth())] + "-" + sbc.brush.extent()[0].getFullYear());
        sbc.end = d3.time.format("%m-%Y").parse(timeline.parseMonth[parseInt(sbc.brush.extent()[1].getMonth())] + "-" + sbc.brush.extent()[1].getFullYear());
        sbc.endCut = sbc.end;
        var msecDiff = Math.abs(sbc.end.getTime() - sbc.start.getTime());
        var dayDiff = Math.ceil(msecDiff / (1000 * 3600 * 24));
        if (dayDiff <= 360) {
            sbc.endCut = new Date(new Date(sbc.start).setMonth(sbc.start.getMonth() + 12));
            d3.event.target.extent([sbc.start, sbc.endCut]);
            d3.event.target(d3.select(this));
            timeline.selectionChanged(d3.event.target.extent());
            gauges.wrangleData();
        }
        else if (dayDiff <= 1800) {
            timeline.selectionChanged(sbc.brush.extent());
            gauges.wrangleData();
        }
        else {
            sbc.endCut = new Date(new Date(sbc.start).setMonth(sbc.start.getMonth() + 60));
            d3.event.target.extent([sbc.start, sbc.endCut]);
            d3.event.target(d3.select(this));
            timeline.selectionChanged(d3.event.target.extent());
            gauges.wrangleData();
        }
    }
}