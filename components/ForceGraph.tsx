"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Node, Link, linkColors, PersonNode, CoupleNode } from "@/types/graph";
import { createArrowMarkers, calculateLinkPosition, getNodeDimensions } from "@/utils/graphUtils";
import { PersonCard, CoupleNode as CoupleNodeComponent } from "./NodeCards";
import { Legend } from "./Legend";
import { EditableNodeCard } from "./EditableNodeCard";
import { SearchBar } from "./SearchBar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    const [showRelationDialog, setShowRelationDialog] = useState(false);
    const [pendingPersonId, setPendingPersonId] = useState<string | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Link | null>(null);
    const [showFlipEdgeDialog, setShowFlipEdgeDialog] = useState(false);

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
        const minYear = hasValidDates ? Math.min(...validBirthYears) : 1350;
        const maxYear = hasValidDates ? Math.max(...validBirthYears) : 2500;

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
            .force("charge", d3.forceManyBody().strength(-100000))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(120))
            .force("x", d3.forceX(width / 2).strength(1))
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
                    .strength(hasValidDates ? 3 : 0.3) // Weaker Y force when no dates available
            );

        // Create links
        const link = container
            .append("g")
            .selectAll("path")
            .data(graphData.links)
            .join("path")
            .attr("class", "link")
            .attr("stroke", (d: any) => linkColors[d.type as "marriage" | "parent-child"])
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-end", (d: any) => `url(#arrowhead-${d.type})`)
            .style("cursor", "pointer")
            .on("click", (event: any, d: any) => {
                event.stopPropagation();
                setSelectedEdge(d);
                setShowFlipEdgeDialog(true);
            })
            .on("mouseenter", function (this: any) {
                d3.select(this).attr("stroke-width", 4).attr("stroke-opacity", 1);
            })
            .on("mouseleave", function (this: any) {
                d3.select(this).attr("stroke-width", 2).attr("stroke-opacity", 0.8);
            });

        // Create node groups
        const node = container
            .append("g")
            .selectAll("g")
            .data(graphData.nodes)
            .join("g")
            .attr("class", "node")
            .attr("id", (d: any) => `node-${d.id}`)
            .style("cursor", "pointer")
            .call(
                d3
                    .drag<any, Node>()
                    .filter((event) => {
                        if (event.type === "touchstart") {
                            return event.touches.length === 1;
                        }
                        return event.button === 0;
                    })
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

        // Person nodes
        const personNodes = node.filter((d: any) => d.nodeType === "person");

        const nodeWidth = 240;
        let nodeHeight = 60; // Base height for name

        personNodes.each(function (d: any) {
            let height = 60;
            if (d.dateOfBirth) height += 20;
            if (d.placeOfBirth) height += 20;
            if (d.dateOfDeath) height += 20;
            if (d.placeOfDeath) height += 20;
            d.nodeHeight = Math.max(nodeHeight, height);
        });

        personNodes
            .append("rect")
            .attr("width", nodeWidth)
            .attr("height", (d: any) => d.nodeHeight)
            .attr("rx", 15)
            .attr("ry", 15)
            .attr("fill", (d: any) => (d.gender === "male" ? "#E3F2FD" : "#FCE4EC"))
            .attr("stroke", (d: any) => (d.gender === "male" ? "#90CAF9" : "#F48FB1"))
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))");

        // Person Name
        personNodes
            .append("text")
            .attr("x", nodeWidth / 2)
            .attr("y", 35)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "700")
            .style("fill", "#333")
            .text((d: any) => d.name);

        // Details
        const details = personNodes
            .append("text")
            .attr("x", 20)
            .attr("y", 65)
            .style("font-size", "12px")
            .style("fill", "#555");

        details.each(function (d: any) {
            const text = d3.select(this);
            if (d.dateOfBirth) {
                text.append("tspan").attr("x", 20).attr("dy", "1.2em").text(`Born: ${d.dateOfBirth}`);
            }
            if (d.placeOfBirth) {
                text.append("tspan").attr("x", 20).attr("dy", "1.2em").text(`In: ${d.placeOfBirth}`);
            }
            if (d.dateOfDeath) {
                text.append("tspan").attr("x", 20).attr("dy", "1.2em").text(`Died: ${d.dateOfDeath}`);
            }
            if (d.placeOfDeath) {
                text.append("tspan").attr("x", 20).attr("dy", "1.2em").text(`In: ${d.placeOfDeath}`);
            }
        });

        // Couple nodes
        const coupleNodes = node.filter((d: any) => d.nodeType === "couple");
        coupleNodes.append("circle").attr("r", 20).attr("fill", "#FFA500");

        // Add click event to nodes
        node.on("click", (event, d: any) => {
            event.stopPropagation();
            setSelectedNode(d);
        });

        // Update positions on each tick
        simulation.on("tick", () => {
            link.attr("d", (d: any) => {
                const source = d.source as Node;
                const target = d.target as Node;
                return `M${source.x},${source.y}L${target.x},${target.y}`;
            });

            node.attr("transform", (d: any) => {
                if (d.nodeType === "person") {
                    return `translate(${(d.x || 0) - 120}, ${(d.y || 0) - (d.nodeHeight || 90) / 2})`;
                }
                return `translate(${d.x || 0}, ${d.y || 0})`;
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

        const nodeToUpdate = data.nodes.find((node) => node.id === updatedNode.id);
        if (nodeToUpdate && nodeToUpdate.nodeType === "person") {
            Object.assign(nodeToUpdate, updatedNode);

            const svg = d3.select(svgRef.current);
            const personNode = svg.select(`#node-${updatedNode.id}`);

            personNode.select("text").text(updatedNode.name);

            personNode
                .selectAll("text")
                .filter((d, i) => i === 1)
                .text(() => {
                    const birth = updatedNode.dateOfBirth ? `b. ${updatedNode.dateOfBirth}` : "";
                    const death = updatedNode.dateOfDeath ? `d. ${updatedNode.dateOfDeath}` : "";
                    return [birth, death].filter(Boolean).join(" - ");
                });
        }

        setSelectedNode(null);
    };

    const handleCreateCouple = async (role: "partner" | "child") => {
        if (!pendingPersonId) return;

        try {
            const response = await fetch("/api/couple", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    personId: pendingPersonId,
                    role: role,
                }),
            });

            if (response.ok) {
                await fetchData(); // Refresh the graph
                setShowRelationDialog(false);
                setPendingPersonId(null);
            } else {
                console.error("Failed to create couple");
            }
        } catch (error) {
            console.error("Error creating couple:", error);
        }
    };

    const handleFlipEdge = async () => {
        if (!selectedEdge || !selectedEdge.personId || !selectedEdge.coupleId) return;

        try {
            const response = await fetch("/api/flip-edge", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    personId: selectedEdge.personId,
                    coupleId: selectedEdge.coupleId,
                }),
            });

            if (response.ok) {
                await fetchData(); // Refresh the graph
                setShowFlipEdgeDialog(false);
                setSelectedEdge(null);
            } else {
                const errorData = await response.json();
                console.error("Failed to flip edge:", errorData.error);
                alert(`Failed to flip edge: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error flipping edge:", error);
            alert("Error flipping edge");
        }
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
            {showRelationDialog && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => {
                        setShowRelationDialog(false);
                        setPendingPersonId(null);
                    }}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <Card className="w-[400px] bg-white">
                            <CardHeader>
                                <CardTitle>Create Couple Node</CardTitle>
                                <CardDescription>Choose the relationship type</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    How should this person be connected to the new couple node?
                                </p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleCreateCouple("partner")}
                                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-left"
                                    >
                                        <div className="font-semibold">💑 As Partner/Lover</div>
                                        <div className="text-sm opacity-90">
                                            Create a couple node where this person is one of the partners
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleCreateCouple("child")}
                                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-left"
                                    >
                                        <div className="font-semibold">👨‍👩‍👦 As Child</div>
                                        <div className="text-sm opacity-90">
                                            Create a couple node where this person is a child of that couple
                                        </div>
                                    </button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <button
                                    onClick={() => {
                                        setShowRelationDialog(false);
                                        setPendingPersonId(null);
                                    }}
                                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
            {showFlipEdgeDialog && selectedEdge && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => {
                        setShowFlipEdgeDialog(false);
                        setSelectedEdge(null);
                    }}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <Card className="w-[450px] bg-white">
                            <CardHeader>
                                <CardTitle>Flip Edge Relationship</CardTitle>
                                <CardDescription>Change the relationship type</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-700">
                                    This edge is currently a{" "}
                                    <strong>
                                        {selectedEdge.type === "marriage" ? '"Partner in Couple"' : '"Child in Couple"'}
                                    </strong>{" "}
                                    relationship.
                                </p>
                                <p className="text-sm text-gray-600">
                                    Do you want to flip it to a{" "}
                                    <strong>
                                        {selectedEdge.type === "marriage" ? '"Child in Couple"' : '"Partner in Couple"'}
                                    </strong>{" "}
                                    relationship?
                                </p>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm">
                                        {selectedEdge.type === "marriage" ? (
                                            <>
                                                <span className="text-purple-700">💑 Partner in Couple</span> →{" "}
                                                <span className="text-green-700">👨‍👩‍👦 Child in Couple</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-green-700">👨‍👩‍👦 Child in Couple</span> →{" "}
                                                <span className="text-purple-700">💑 Partner in Couple</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowFlipEdgeDialog(false);
                                        setSelectedEdge(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFlipEdge}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                >
                                    Flip Relationship
                                </button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </>
    );
};

export default ForceGraph;
