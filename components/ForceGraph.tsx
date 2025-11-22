"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Node, Link, linkColors, PersonNode, CoupleNode } from "@/types/graph";
import { createArrowMarkers, calculateLinkPosition, getNodeDimensions } from "@/utils/graphUtils";
import { PersonCard, CoupleNode as CoupleNodeComponent } from "./NodeCards";
import { Legend } from "./Legend";
import { EditableNodeCard } from "./EditableNodeCard";
import { SearchBar } from "./SearchBar";
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
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
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
        const isMobile = width < 768;

        svg.attr("width", width).attr("height", height);

        // Clear any existing content
        svg.selectAll("*").remove();

        // Create a container group for zoom/pan
        const container = svg.append("g").attr("class", "zoom-container");

        // Set up zoom behavior with mobile-friendly filter
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4]) // Allow zooming from 10% to 400%
            .filter((event) => {
                // Allow zoom on wheel, pinch, and background pan
                // Prevent zoom when dragging nodes (foreignObject elements)
                const target = event.target as Element;
                const isNode = target.closest("foreignObject") !== null;

                // Allow all touch events for pinch-zoom and pan
                if (event.type === "touchstart" || event.type === "touchmove") {
                    // Allow pinch zoom (2+ fingers)
                    if (event.touches && event.touches.length >= 2) {
                        return true;
                    }
                    // Allow pan only when not on a node
                    return !isNode;
                }

                // Allow wheel zoom
                if (event.type === "wheel") {
                    return true;
                }

                // For mouse events, allow only on background (not on nodes)
                return !isNode && (event.button === 0 || event.type === "wheel");
            })
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        // Apply zoom behavior to SVG
        svg.call(zoom);

        // Store zoom reference for search functionality
        zoomRef.current = zoom;

        // Set initial zoom to fit content better on mobile
        if (isMobile) {
            svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.7));
        }

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

        // Create force simulation with consistent parameters
        // D3 zoom will handle visual scaling for different screen sizes
        const simulation = d3
            .forceSimulation(graphData.nodes)
            .force(
                "link",
                d3
                    .forceLink(graphData.links)
                    .id((d: any) => d.id)
                    .distance(200)
                    .strength(3)
            )
            .force("charge", d3.forceManyBody().strength(-30000))
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
            .attr("width", (d: any) => getNodeDimensions(d.nodeType).width)
            .attr("height", (d: any) => getNodeDimensions(d.nodeType).height)
            .attr("class", "node")
            .style("cursor", "pointer")
            .style("overflow", "visible")
            .call(
                d3
                    .drag<any, Node>()
                    .filter((event) => {
                        // Only allow dragging with single touch or left mouse button
                        if (event.type === "touchstart") {
                            return event.touches.length === 1;
                        }
                        return event.button === 0;
                    })
                    .subject((event, d) => {
                        // Get current transform to properly calculate drag coordinates
                        const t = d3.zoomTransform(svg.node()!);
                        return { x: t.applyX(d.x!), y: t.applyY(d.y!) };
                    })
                    .on("start", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on("drag", (event, d) => {
                        // Invert the zoom transform to get simulation coordinates
                        const t = d3.zoomTransform(svg.node()!);
                        d.fx = t.invertX(event.x);
                        d.fy = t.invertY(event.y);
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
            .style("display", "block")
            .style("width", (d: any) => `${getNodeDimensions(d.nodeType).width}px`)
            .style("height", (d: any) => `${getNodeDimensions(d.nodeType).height}px`)
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
                            dateOfDeath={person.dateOfDeath}
                            placeOfBirth={person.placeOfBirth}
                            placeOfDeath={person.placeOfDeath}
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

            // Use transform instead of x/y for better mobile browser support
            node.attr("transform", (d: any) => {
                const dims = getNodeDimensions(d.nodeType);
                const x = (d.x || 0) - dims.halfWidth;
                const y = (d.y || 0) - dims.halfHeight;
                return `translate(${x}, ${y})`;
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
        // This preserves D3's references for the force simulation
        const nodeToUpdate = data.nodes.find((node) => node.id === updatedNode.id);
        if (nodeToUpdate && nodeToUpdate.nodeType === "person") {
            // Update properties in place
            nodeToUpdate.firstName = updatedNode.firstName;
            nodeToUpdate.lastName = updatedNode.lastName;
            nodeToUpdate.name = updatedNode.name;
            nodeToUpdate.dateOfBirth = updatedNode.dateOfBirth;
            nodeToUpdate.dateOfDeath = updatedNode.dateOfDeath;
            nodeToUpdate.placeOfBirth = updatedNode.placeOfBirth;
            nodeToUpdate.placeOfDeath = updatedNode.placeOfDeath;
            nodeToUpdate.gender = updatedNode.gender;

            // Update the visual representation directly in the DOM
            const svg = d3.select(svgRef.current);
            svg.selectAll("foreignObject")
                .filter((d: any) => d.id === updatedNode.id)
                .select("div")
                .html(() => {
                    return renderToStaticMarkup(
                        <PersonCard
                            firstName={updatedNode.firstName}
                            lastName={updatedNode.lastName}
                            dateOfBirth={updatedNode.dateOfBirth}
                            dateOfDeath={updatedNode.dateOfDeath}
                            placeOfBirth={updatedNode.placeOfBirth}
                            placeOfDeath={updatedNode.placeOfDeath}
                            gender={updatedNode.gender}
                        />
                    );
                });
        }

        // Close the card
        setSelectedNode(null);
    };

    const handleSearchSelect = (nodeId: string) => {
        if (!data || !svgRef.current || !zoomRef.current) return;

        // Find the node
        const node = data.nodes.find((n) => n.id === nodeId);
        if (!node || !node.x || !node.y) return;

        const svg = d3.select(svgRef.current);
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Calculate transform to center the node
        const scale = 1.5; // Zoom level
        const x = width / 2 - node.x * scale;
        const y = height / 2 - node.y * scale;

        // Animate to the node
        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));

        // Highlight the node temporarily
        svg.selectAll("foreignObject")
            .filter((d: any) => d.id === nodeId)
            .select("div")
            .transition()
            .duration(300)
            .style("box-shadow", "0 0 20px 5px rgba(33, 150, 243, 0.8)")
            .transition()
            .duration(300)
            .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
            .transition()
            .duration(300)
            .style("box-shadow", "0 0 20px 5px rgba(33, 150, 243, 0.8)")
            .transition()
            .duration(300)
            .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");
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
            {data && <SearchBar nodes={data.nodes} onSelectNode={handleSearchSelect} />}
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
