// Set dimensions and margins for the chart

const margin = { top: 70, right: 200, bottom: 40, left: 80 };
const width = 1500 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Set up the x and y scales

const x = d3.scaleTime().range([0, width]);

const y = d3.scaleLinear().range([height, 0]);

// Create the SVG element and append it to the chart container

const svg = d3.select("#chart-container")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


// Create tooltip div (hidden by default)

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// Create a vertical grid line for tooltip
const verticalLine = svg.append("line")
    .attr("class", "vertical-line")
    .style("stroke", "#999")
    .style("stroke-width", 1)
    .style("stroke-dasharray", "4")
    .style("opacity", 0)
    .style("pointer-events", "none");    

// Load and Process Data

d3.csv("sg_cars_data_by_fuel_type1.csv").then(function(data) {

// Parse the date and convert the cars column to a number
const parseDate = d3.timeParse("%Y-%m-%d");
data.forEach(d => {
    d.month = parseDate(d.month);
    d.number = +d.number;
});

// Define the x and y domains

x.domain(d3.extent(data, d => d.month));
y.domain([0, d3.max(data, d => d.number)]);

// Add the x-axis

svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y")));        

// Add the y-axis

svg.append("g")
    .call(d3.axisLeft(y)
        .tickFormat(d => {
            return `${(d / 1000).toFixed(0)}k`;
    }));

// Add horizontal grid lines
svg.selectAll("yGrid")
    .data(y.ticks(10))
    .join("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", .5)

// Group the data by fuel type
const groups = d3.groups(data, d => d.fuel_type);

// Draw the lines
const line = d3.line()
  .x(d => x(d.month))
  .y(d => y(d.number));

// Add multiple colours for different fuel types
const color = d3.scaleOrdinal()
  .domain(Array.from(groups.keys()))
  .range(d3.schemeTableau10);

// Draw a path for each series
  svg.append("g")
    .selectAll("path")
    .data(groups)
    .join("path")
      .attr("fill", "none")
      .attr("stroke", ([key]) => color(key))
      .attr("stroke-width", 1.5)
      .attr("d", ([key, values]) => line(values));

// Add labels at the end of each line
svg.append("g")
    .selectAll("text")
    .data(groups)
    .join("text")
      .attr("x", d => x(d[1][d[1].length - 1].month))
      .attr("y", d => y(d[1][d[1].length - 1].number))
      .attr("dx", 8)
      .attr("dy", 4)
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", ([key]) => color(key))
      .style("font-family", "sans-serif")
      .text(([key]) => key);

// New: Create a listening rectangle to capture mouse movements
const listeningRect = svg.append("rect")
    .attr("width", width)
    .attr("height", height);

// New: Add mouse event listeners to the listening rectangle
listeningRect.on("mousemove", function (event) {
    const [xCoord] = d3.pointer(event, this);
    const bisectDate = d3.bisector(d => d.month).left;
    const x0 = x.invert(xCoord);
    const i = bisectDate(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];
    const d = x0 - d0.month > d1.month - x0 ? d1 : d0;

// Get the date for the closest data point
const closestDate = d.month;

// Filter all data points for this date (both fuel types)
const dataForDate = data.filter(item => item.month.getTime() === closestDate.getTime());

// Find the first data point for positioning the tooltip
const firstD = dataForDate[0];
const xPos = x(firstD.month);
const yPos = y(firstD.number);

// Update vertical line
verticalLine
.style("opacity", 1)
.attr("x1", xPos)
.attr("x2", xPos)
.attr("y1", 0)
.attr("y2", height);

// Build tooltip HTML with all fuel types for this date
let tooltipHTML = `<strong>${d3.timeFormat("%b %Y")(closestDate)}</strong><br>`;
dataForDate.forEach(item => {
    tooltipHTML += `<strong>${item.fuel_type}:</strong> ${item.number.toLocaleString()}<br>`;
});

// Update tooltip
tooltip
    .style("display", "block")
    .style("left", `${xPos + 100}px`)
    .style("top", `${yPos + 50}px`)
    .html(tooltipHTML);
});

// Listening rectangle mouse leave function
listeningRect.on("mouseleave", function () {
    verticalLine.style("opacity", 0);
    tooltip.style("display", "none");
});

// Add chart title
svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", margin.top-100)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("font-family", "sans-serif")
    .text("Tracking Singapore's Shift Away from Conventional Fuel Cars");
    
// Add source note
svg.append("text")
    .attr("class", "chart-source")
    .attr("x", width)
    .attr("y", height + margin.bottom - 3)
    .attr("text-anchor", "end")
    .style("font-size", "12px")
    .style("font-style", "italic")
    .style("font-family", "sans-serif")
    .text("Source: Land Transport Authority (LTA)");

});    
