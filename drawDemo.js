function initD3Graph() {
    var height = 480,
        width = 640;

    var leftNodes = [{ name: "Alice" }, { name: "Bob" }, { name: "Jane" }];

    var rightNodes = [{ name: "Jeremy" }, { name: "David" }, { name: "Dylan" }];

    var svg = d3
        .select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var leftDrag = d3.drag();
    var currentDragNode = null;
    var line;

    leftDrag
        .on("start", dragStart)
        .on("drag", dragged)
        .on("end", dragEnd);

    var left = svg
        .selectAll(".left-nodes")
        .data(leftNodes)
        .enter()
        .append("g")
        .classed("node", true)
        .append("circle")
        .on("mousedown", () => {
            d3.event.stopPropagation();
        })
        .attr("cx", (d, i) => 100)
        .attr("cy", (d, i) => 50 * (i + 1))
        .attr("r", width * 0.01)
        .call(leftDrag);

    var right = svg
        .selectAll(".right-nodes")
        .data(rightNodes)
        .enter()
        .append("g")
        .classed("node", true)
        .append("circle")
        .attr("cx", (d, i) => 200)
        .attr("cy", (d, i) => 50 * (i + 1))
        .attr("r", width * 0.01);

    function dragEnd(d) {
        console.log(d3.event.sourceEvent.target);
        /* line.remove() */
        const rightNodes = right.nodes();
    }

    function dragged(d) {
        const startX = d3.select(this).attr("cx");
        const startY = d3.select(this).attr("cy");
        const endX = Math.floor(d3.event.x);
        const endY = Math.floor(d3.event.y);
        const p = d3.path();

        p.moveTo(startX, startY);
        p.lineTo(endX, endY);

        line.attr("d", p.toString());
    }

    function dragStart(d) {
        d3.event.sourceEvent.stopPropagation();
        line = svg
            .append("path")
            .style("fill", "none")
            .style("stroke", "#666")
            .style("stroke-width", 2);
    }

}