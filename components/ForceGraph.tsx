"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Node, Link, linkColors, PersonNode, CoupleNode } from "@/types/graph";
import { createArrowMarkers, calculateLinkPosition, getNodeDimensions } from "@/utils/graphUtils";
import { PersonCard, CoupleNode as CoupleNodeComponent } from "./NodeCards";
import { Legend } from "./Legend";
import { EditableNodeCard } from "./EditableNodeCard";
import { renderToStaticMarkup } from "react-dom/server";

// Toggle this to switch between hardcoded data and Neo4j data
const USE_HARDCODED_DATA = false;

// Hardcoded sample data for testing
const SAMPLE_DATA = {
    nodes: [
        {
            id: "1",
            nodeType: "person" as const,
            name: "John Doe",
            firstName: "John",
            lastName: "Doe",
            dateOfBirth: "1950-05-15",
            gender: "male" as const,
        },
        {
            id: "2",
            nodeType: "person" as const,
            name: "Jane Smith",
            firstName: "Jane",
            lastName: "Smith",
            dateOfBirth: "1952-08-20",
            gender: "female" as const,
        },
        {
            id: "3",
            nodeType: "couple" as const,
        },
        {
            id: "4",
            nodeType: "person" as const,
            name: "Alice Doe",
            firstName: "Alice",
            lastName: "Doe",
            dateOfBirth: "1975-03-10",
            gender: "female" as const,
        },
        {
            id: "5",
            nodeType: "person" as const,
            name: "Bob Doe",
            firstName: "Bob",
            lastName: "Doe",
            dateOfBirth: "1978-11-25",
            gender: "male" as const,
        },
    ],
    links: [
        { source: "1", target: "3", type: "marriage" as const },
        { source: "2", target: "3", type: "marriage" as const },
        { source: "3", target: "4", type: "parent-child" as const },
        { source: "3", target: "5", type: "parent-child" as const },
    ],
};

const ForceGraph = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [data, setData] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [initialAction, setInitialAction] = useState<"parent" | "child" | null>(null);

    // Fetch data from Neo4j or use hardcoded data
    const fetchData = async () => {
        try {
            setLoading(true);

            if (USE_HARDCODED_DATA) {
                // Use hardcoded data for testing
                console.log("Using hardcoded data:", SAMPLE_DATA);
                setData(SAMPLE_DATA);
                setError(null);
            } else {
                // Fetch from Neo4j
                const response = await fetch("/api/family-tree");
                if (!response.ok) {
                    throw new Error("Failed to fetch family tree data");
                }
                const result = await response.json();
                console.log("Fetched data:", result);
                setData(result);
                setError(null);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!svgRef.current || !data) return;

        const graphData = data;

        // Set up SVG dimensions
        const svg = d3.select(svgRef.current);
        const width = window.innerWidth;
        const height = window.innerHeight;

        svg.attr("width", width).attr("height", height);

        // Clear any existing content
        svg.selectAll("*").remove();

        // Create a container group for zoom/pan
        const container = svg.append("g").attr("class", "zoom-container");

        // Set up zoom behavior
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4]) // Allow zooming from 10% to 400%
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        // Apply zoom behavior to SVG
        svg.call(zoom);

        // Create arrow markers
        createArrowMarkers(svg);

        // Initialize node positions to avoid NaN
        graphData.nodes.forEach((node: any) => {
            if (!node.x) node.x = width / 2 + (Math.random() - 0.5) * 200;
            if (!node.y) node.y = height / 2 + (Math.random() - 0.5) * 200;
        });

        // Calculate birth year for positioning (only for valid dates)
        const validBirthYears = graphData.nodes
            .filter((n: any) => n.nodeType === "person" && n.dateOfBirth && n.dateOfBirth.trim() !== "")
            .map((n: any) => new Date(n.dateOfBirth).getFullYear())
            .filter((year: number) => !isNaN(year));

        const hasValidDates = validBirthYears.length > 0;
        const minYear = hasValidDates ? Math.min(...validBirthYears) : 1950;
        const maxYear = hasValidDates ? Math.max(...validBirthYears) : 2000;

        console.log("Birth year range:", { minYear, maxYear, hasValidDates, validBirthYears });

        // Create force simulation
        const simulation = d3
            .forceSimulation(graphData.nodes)
            .force(
                "link",
                d3
                    .forceLink(graphData.links)
                    .id((d: any) => d.id)
                    .distance(200)
            )
            .force("charge", d3.forceManyBody().strength(-2000))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(120))
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force(
                "y",
                d3
                    .forceY((d: any) => {
                        if (d.nodeType === "person") {
                            // Position based on birth year if available
                            if (d.dateOfBirth && d.dateOfBirth.trim() !== "") {
                                const birthYear = new Date(d.dateOfBirth).getFullYear();
                                if (!isNaN(birthYear) && hasValidDates) {
                                    const normalizedYear = (birthYear - minYear) / (maxYear - minYear || 1);
                                    return height * 0.2 + normalizedYear * height * 0.6; // Map to 20%-80% of height
                                }
                            }
                            // Fallback: center position for persons without valid dates
                            return height / 2;
                        } else {
                            // Couple nodes positioned based on their partners' average position
                            return height / 2;
                        }
                    })
                    .strength(hasValidDates ? 1 : 0.3) // Weaker Y force when no dates available
            );

        // Create links
        const link = container
            .append("g")
            .selectAll("line")
            .data(graphData.links)
            .join("line")
            .attr("class", "link")
            .attr("stroke", (d: any) => linkColors[d.type as "marriage" | "parent-child"])
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", 2)
            .attr("marker-end", (d: any) => `url(#arrowhead-${d.type})`);

        // Create nodes as foreign objects to embed HTML
        const node = container
            .append("g")
            .selectAll("foreignObject")
            .data(graphData.nodes)
            .join("foreignObject")
            .attr("width", (d: any) => (d.nodeType === "couple" ? 80 : 180))
            .attr("height", (d: any) => (d.nodeType === "couple" ? 100 : 170))
            .attr("class", "node")
            .style("cursor", "pointer")
            .style("overflow", "visible")
            .call(
                d3
                    .drag<any, Node>()
                    .on("start", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on("drag", (event, d) => {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on("end", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    })
            );

        // Add HTML card content to nodes
        node.append("xhtml:div")
            .attr("xmlns", "http://www.w3.org/1999/xhtml")
            .style("width", "100%")
            .style("height", "100%")
            .html((d: any) => {
                if (d.nodeType === "couple") {
                    return renderToStaticMarkup(<CoupleNodeComponent />);
                } else {
                    const person = d as PersonNode;
                    return renderToStaticMarkup(
                        <PersonCard
                            firstName={person.firstName}
                            lastName={person.lastName}
                            dateOfBirth={person.dateOfBirth}
                            gender={person.gender}
                        />
                    );
                }
            });

        // Add click event to nodes and buttons
        node.on("click", async (event, d: any) => {
            // Check if the click was on a button
            const target = event.target as HTMLElement;

            event.stopPropagation();

            if (target.classList.contains("node-edit-btn")) {
                setInitialAction(null);
                setSelectedNode(d);
                return;
            }

            if (target.classList.contains("node-add-parent-btn")) {
                setInitialAction("parent");
                setSelectedNode(d);
                return;
            }

            if (target.classList.contains("node-add-child-btn")) {
                setInitialAction("child");
                setSelectedNode(d);
                return;
            }

            // Handle couple creation buttons for person nodes
            if (target.classList.contains("node-create-couple-partner-btn")) {
                // Create a couple where this person is a partner
                try {
                    const response = await fetch("/api/couple", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            personId: d.id,
                            role: "partner",
                        }),
                    });

                    if (response.ok) {
                        await fetchData(); // Refresh the graph
                    } else {
                        console.error("Failed to create couple");
                    }
                } catch (error) {
                    console.error("Error creating couple:", error);
                }
                return;
            }

            if (target.classList.contains("node-create-couple-child-btn")) {
                // Create a couple where this person is a child
                try {
                    const response = await fetch("/api/couple", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            personId: d.id,
                            role: "child",
                        }),
                    });

                    if (response.ok) {
                        await fetchData(); // Refresh the graph
                    } else {
                        console.error("Failed to create couple");
                    }
                } catch (error) {
                    console.error("Error creating couple:", error);
                }
                return;
            }

            // Default: open card on any node click
            setInitialAction(null);
            setSelectedNode(d);
        });

        // Update positions on each tick
        simulation.on("tick", () => {
            link.attr("x1", (d: any) => calculateLinkPosition(d.source, d.target, true).x)
                .attr("y1", (d: any) => calculateLinkPosition(d.source, d.target, true).y)
                .attr("x2", (d: any) => calculateLinkPosition(d.source, d.target, false).x)
                .attr("y2", (d: any) => calculateLinkPosition(d.source, d.target, false).y);

            node.attr("x", (d: any) => {
                const dims = getNodeDimensions(d.nodeType);
                return (d.x || 0) - dims.halfWidth;
            }).attr("y", (d: any) => {
                const dims = getNodeDimensions(d.nodeType);
                return (d.y || 0) - dims.halfHeight;
            });
        });

        // Handle window resize
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            svg.attr("width", newWidth).attr("height", newHeight);

            simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
            simulation.alpha(0.3).restart();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            simulation.stop();
        };
    }, [data]);

    const handleCloseCard = () => {
        setSelectedNode(null);
        setInitialAction(null);
    };

    const handleUpdateNode = (updatedNode: PersonNode) => {
        if (!data) return;

        // Find the node in the data and update its properties in place
        // This is important to maintain D3's references in the force simulation
        const nodeToUpdate = data.nodes.find((node) => node.id === updatedNode.id);
        if (nodeToUpdate && nodeToUpdate.nodeType === "person") {
            // Update properties in place
            Object.assign(nodeToUpdate, {
                firstName: updatedNode.firstName,
                lastName: updatedNode.lastName,
                name: updatedNode.name,
                dateOfBirth: updatedNode.dateOfBirth,
                gender: updatedNode.gender,
            });

            // Force a re-render by updating the state
            setData({ ...data });
        }

        // Close the card
        setSelectedNode(null);
    };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "18px",
                }}
            >
                Loading family tree data...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "18px",
                    color: "#d32f2f",
                }}
            >
                Error: {error}
            </div>
        );
    }

    return (
        <>
            <svg ref={svgRef} style={{ display: "block" }} />
            <Legend />
            {selectedNode && (
                <EditableNodeCard
                    node={selectedNode}
                    onClose={handleCloseCard}
                    onUpdate={handleUpdateNode}
                    onRefresh={fetchData}
                    initialAction={initialAction}
                />
            )}
        </>
    );
};

export default ForceGraph;
