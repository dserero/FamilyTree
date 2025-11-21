// Sample data for the graph
const data = {
    nodes: [
        { id: 1, name: "Node 1", type: "red" },
        { id: 2, name: "Node 2", type: "green" },
        { id: 3, name: "Node 3", type: "red" },
        { id: 4, name: "Node 4", type: "green" },
        { id: 5, name: "Node 5", type: "red" },
        { id: 6, name: "Node 6", type: "green" },
        { id: 7, name: "Node 7", type: "red" },
        { id: 8, name: "Node 8", type: "green" },
    ],
    links: [
        { source: 1, target: 2 },
        { source: 1, target: 3 },
        { source: 2, target: 4 },
        { source: 2, target: 5 },
        { source: 3, target: 6 },
        { source: 4, target: 7 },
        { source: 5, target: 8 },
        { source: 6, target: 8 },
    ],
};

// Color mapping for node types
const nodeColors = {
    red: {
        fill: "#E53935",
        stroke: "#B71C1C",
    },
    green: {
        fill: "#4CAF50",
        stroke: "#2E7D32",
    },
};

// Set up SVG dimensions
const svg = d3.select("#graph");
const width = window.innerWidth;
const height = window.innerHeight;

svg.attr("width", width).attr("height", height);

// Create force simulation
const simulation = d3
    .forceSimulation(data.nodes)
    .force(
        "link",
        d3
            .forceLink(data.links)
            .id((d) => d.id)
            .distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(30));

// Create links
const link = svg.append("g").selectAll("line").data(data.links).join("line").attr("class", "link");

// Create nodes
const node = svg.append("g").selectAll("g").data(data.nodes).join("g").attr("class", "node").call(drag(simulation));

// Add circles to nodes
node.append("circle")
    .attr("r", 20)
    .attr("fill", (d) => nodeColors[d.type]?.fill || "#4CAF50")
    .attr("stroke", (d) => nodeColors[d.type]?.stroke || "#2E7D32");

// Add click event to nodes
node.on("click", (event, d) => {
    alert(`Node: ${d.name}`);
});

// Add labels to nodes
node.append("text")
    .text((d) => d.name)
    .attr("dy", 35);

// Update positions on each tick
simulation.on("tick", () => {
    link.attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
});

// Drag functions
function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}

// Handle window resize
window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.attr("width", newWidth).attr("height", newHeight);

    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(0.3).restart();
});
