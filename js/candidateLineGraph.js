/*
 * LineGraph - Object constructor function,
 * borrows heavily from Lab 7 and Homework 5
 */

CandidateLineChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};


var brush;
/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

var RepublicanKey = {
    TRUMP: "Donald Trump",
    KASICH: "John Kasich",
    BUSH: "Jeb Bush",
    CRUZ: "Ted Cruz",
    CARSON: "Ben Carson",
    CHRISTIE: "Chris Christie",
    RUBIO: "Marco Rubio",
    ROMNEY: "Mitt Romney",
    RYAN: "Paul Ryan",
    PAUL: "Rand Paul"
};
var DemocratKey = {
    SANDERS: "Bernie Sanders",
    CLINTON: "Hillary Clinton",
    OMALLEY: "Martin OMalley"

};


CandidateLineChart.prototype.initVis = function(){
    var vis = this;

    // make the dropbox
    /*// prepare data!
    vis.allCandidates = _.chain(vis.data).map(function(d) {
        return d.candidate;
    }).uniq().value();
    vis.allDates = _.chain(vis.data).map(function(d) {
        return timeFormat(d.date);
    }).uniq().value();
*/


    //document.getElementById("candidate")
    vis.margin = { top: 40, right: 60, bottom: 60, left: 60 };

    vis.width = 600 - vis.margin.left - vis.margin.right;
        vis.height = 200 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.time.scale()
        .range([0, vis.width]);
    //console.log(vis.x);
    vis.y = d3.scale.linear()
        .range([vis.height, 0])
        .domain([0, 1]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        .ticks(d3.time.months, 1)
        .tickFormat(d3.time.format('%b %y'))
        .tickSize(0)
        .tickPadding(8);;

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .ticks(2)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");


    // brush
    vis.brush = d3.svg.brush()
        .x(vis.x)
        .on("brush", brushmove)
    brush = vis.brush;

    vis.svg.append("g")
        .attr("class", "brush")
        .call(vis.brush)
        .selectAll('rect')
        .attr('height', vis.height);

    vis.tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10,0])
        .html(function(d) {
            return d;
        });


    vis.svg.call(vis.tip);

    /* Might not need
    // Tooltip placeholder
    vis.label = vis.svg.append("text")
        .attr("x", 10)
        .attr("y", 10);
    */


    vis.wrangleData();
};

function brushmove() {
    //$("input.amountCloud[data-index=0]").val(brush.extent()[0] * 1000).toDateString();
    //$("input.amountCloud[data-index=1]").val(brush.extent()[1] * 1000).toDateString();
    wordcloud.min = brush.extent()[0];
    wordcloud.max = brush.extent()[1];
    $( "#slider-range2" ).slider( "option", "values", [ wordcloud.min / 1000, wordcloud.max / 1000 ] );
    //console.log(new Date(wordcloud.min).toDateString());
    $("input.amountCloud[data-index=0]").val(new Date(wordcloud.min).toDateString());
    $("input.amountCloud[data-index=1]").val(new Date(wordcloud.max).toDateString());


    wordcloud.wrangleData();
}

/*
 * Data wrangling
 */

CandidateLineChart.prototype.wrangleData = function(){
    var vis = this;
    var candidateSelected = d3.select("#candidate").property("value");
    var name;
    if (RepublicanKey[candidateSelected] == undefined) {
        vis.displayData = vis.data.democrats;
        name = DemocratKey[candidateSelected.replace("'","")]
    }
    else {
        vis.displayData = vis.data.republicans;
        name = RepublicanKey[candidateSelected]
    }
    console.log(name);

    vis.format = [];
    vis.names = [];

    // went through and got unique markets based on unique first words
    var marketNames = ["Betfair", "Bookie","PredictIt"];
    //console.log(vis.data.candidates);

    for (var key in vis.displayData.candidates[name]) {
        if ($.inArray(key,marketNames) == -1) continue;
        vis.format.push(vis.displayData.candidates[name][key]);
        vis.names.push(key);
    }
    vis.updateVis();
};



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

CandidateLineChart.prototype.updateVis = function(){
    var vis = this;

    // Update x scale after wrangle

    vis.x.domain(d3.extent(vis.displayData.timestamps));



    vis.line = d3.svg.line()
        .interpolate("basis")
        .x(function(d, i) { return vis.x(vis.displayData.timestamps[i]); })
        .y(vis.y);


    vis.lines = vis.svg.selectAll(".line")
        .data(vis.format);

    vis.lines
        .enter().append("path");

    vis.lines
        .exit().transition().duration(800).remove();

    vis.lines
        .transition().duration(800)
        .attr("class", "line")
        .style("stroke", function(d, i) {
            var cand = vis.names[i].split(" ");
            cand = cand[cand.length - 1];
            return colorScale(cand);
        })
        .attr("d", vis.line)
        .attr("data-legend", function(d,i) { return vis.names[i]})

    // legend
    vis.legend = vis.svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(20,10)")
        .style("font-size","12px")
        .call(d3.legend)
        .style("fill", "white")
        .style("stroke","black")
        .style("opacity", 0.8);



    // Call axis functions with the new domain
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);
};

/* function to show debate dates
 */
var showDebateToggle = 0;
CandidateLineChart.prototype.showDebateDates = function() {
    var vis = this;

    $(".toggle-button").toggleClass('toggle-button-selected');
    if (!showDebateToggle % 2) {
        // show debate dates
        var dates = _.chain(cloudData).map(function(item) { return timeFormat(item.date) }).uniq().value();
        //var RepublicanCandidates =
        dates.forEach( function(d) {
            //console.log(d);
            vis.dateLines = vis.svg.append("line")
                .attr("y1", vis.y(0))
                .attr("y2", vis.y(1))
                .attr("x1", vis.x(timeFormat.parse(d)))
                .attr("x2", vis.x(timeFormat.parse(d)))
                .attr("class", "debateDates")
                .attr("stroke-width", 2)
                .attr("stroke", "black")
                .style("stroke-dasharray", ("3, 3"));

            vis.dateLines
                .on("mouseover", vis.tip.show)
                .on("mouseout", vis.tip.hide)


        })
        showDebateToggle++;
    }
    else {
        d3.selectAll(".debateDates").remove();
        showDebateToggle--;
    }

};



