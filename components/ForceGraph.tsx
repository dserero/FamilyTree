"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Node, Link, linkColors, PersonNode, CoupleNode } from "@/types/graph";
import { createArrowMarkers, calculateLinkPosition, getNodeDimensions } from "@/utils/graphUtils";
import { applyDagreLayout } from "@/utils/dagreLayout";
import { PersonCard, CoupleNode as CoupleNodeComponent } from "./NodeCards";
import { Legend } from "./Legend";
import { EditableNodeCard } from "./EditableNodeCard";
import { SearchBar } from "./SearchBar";
import { AddFamilyMemberDialog } from "./ForceGraph/AddFamilyMemberDialog";
import { CoupleSelectionDialog } from "./ForceGraph/CoupleSelectionDialog";
import { FlipEdgeDialog } from "./ForceGraph/FlipEdgeDialog";
import { CreatePersonDialog } from "./ForceGraph/CreatePersonDialog";
import { useFamilyMemberActions } from "./ForceGraph/useFamilyMemberActions";
import { useFlipEdge } from "./ForceGraph/useFlipEdge";
import { renderToStaticMarkup } from "react-dom/server";

const getPersonDetailRows = (person: Partial<PersonNode>) => {
    const rows: Array<{ label: string; value: string }> = [
        { label: "Date of Birth", value: person.dateOfBirth || "Unknown" },
        { label: "Place of Birth", value: person.placeOfBirth || "Unknown" },
    ];

    if (person.profession) {
        rows.push({ label: "Profession", value: person.profession });
    }

    if (person.notes) {
        rows.push({ label: "Notes", value: person.notes });
    }

    if (person.dateOfDeath) {
        rows.push({ label: "Date of Death", value: person.dateOfDeath });
        rows.push({
            label: "Place of Death",
            value: person.placeOfDeath || "Unknown",
        });
    } else if (person.placeOfDeath) {
        rows.push({ label: "Place of Death", value: person.placeOfDeath });
    }

    return rows;
};

const ForceGraph = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const [data, setData] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [initialAction, setInitialAction] = useState<"parent" | "child" | null>(null);
    const [showCreatePersonDialog, setShowCreatePersonDialog] = useState(false);

    // Fetch data from Neo4j or use hardcoded data
    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch from Neo4j
            const response = await fetch("/api/family-tree");
            if (!response.ok) {
                throw new Error("Failed to fetch family tree data");
            }
            const result = await response.json();
            console.log("Fetched data:", result);
            setData(result);
            setError(null);
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

    // Use custom hooks for dialog management
    const familyMemberActions = useFamilyMemberActions({
        onRefresh: fetchData,
        onSelectNode: setSelectedNode,
        data,
    });

    const flipEdgeActions = useFlipEdge({
        onRefresh: fetchData,
    });

    useEffect(() => {
        if (!svgRef.current || !data) return;

        const graphData = data;

        // Calculate children count for couple nodes
        const coupleChildrenCounts = new Map<string, number>();
        graphData.links.forEach((link: any) => {
            if (link.type === "parent-child") {
                // Handle both string IDs and object references (in case D3 already processed it)
                const sourceId = typeof link.source === "object" ? link.source.id : link.source;
                const count = coupleChildrenCounts.get(sourceId) || 0;
                coupleChildrenCounts.set(sourceId, count + 1);
            }
        });

        // Add children count to couple nodes
        graphData.nodes.forEach((node: any) => {
            if (node.nodeType === "couple") {
                node.childrenCount = coupleChildrenCounts.get(node.id) || 0;
            }
        });

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

        // Apply Dagre hierarchical layout for initial positioning
        const positionedNodes = applyDagreLayout(graphData.nodes, graphData.links, {
            rankdir: "TB", // Top to bottom (oldest generation at top)
            ranksep: 60, // Reduced vertical space between generations
            nodesep: 60, // Reduced horizontal space between siblings
            edgesep: 60, // Slightly reduced space between edges
        });

        // Update the graph data with positioned nodes
        graphData.nodes = positionedNodes;

        console.log("Dagre layout applied:", positionedNodes);

        // Optional: Create a light force simulation just for fine-tuning and interactivity
        // This keeps the hierarchical structure but allows slight adjustments
        const simulation = d3
            .forceSimulation(graphData.nodes)
            .force(
                "link",
                d3
                    .forceLink(graphData.links)
                    .id((d: any) => d.id)
                    .distance(60) // Reduced link distance
                    .strength(0),
            )
            .force("collision", d3.forceCollide().radius(70)) // Reduced collision radius
            .alpha(0.1)
            .alphaDecay(0.1);

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
                flipEdgeActions.openFlipEdgeDialog(d);
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
                    }),
            );

        // Person nodes
        const personNodes = node.filter((d: any) => d.nodeType === "person");

        const nodeWidth = 220;
        const basePadding = 16;
        const headerHeight = 50;
        const rowHeight = 38; // Increased to prevent overlap between label-value pairs
        const buttonSectionHeight = 44; // Space for action buttons

        // Calculate dynamic height for each node
        personNodes.each(function (d: any) {
            const detailRows = getPersonDetailRows(d);
            d.nodeHeight = headerHeight + basePadding + detailRows.length * rowHeight + buttonSectionHeight;
        });

        // Main card background with gradient
        personNodes
            .append("defs")
            .append("linearGradient")
            .attr("id", (d: any) => `gradient-${d.id}`)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .selectAll("stop")
            .data((d: any) => {
                if (d.gender === "male") {
                    return [
                        { offset: "0%", color: "#BBDEFB" },
                        { offset: "100%", color: "#E3F2FD" },
                    ];
                } else {
                    return [
                        { offset: "0%", color: "#F8BBD0" },
                        { offset: "100%", color: "#FCE4EC" },
                    ];
                }
            })
            .enter()
            .append("stop")
            .attr("offset", (d: any) => d.offset)
            .attr("stop-color", (d: any) => d.color);

        personNodes
            .append("rect")
            .attr("width", nodeWidth)
            .attr("height", (d: any) => d.nodeHeight)
            .attr("rx", 16)
            .attr("ry", 16)
            .attr("fill", (d: any) => `url(#gradient-${d.id})`)
            .attr("stroke", (d: any) => (d.gender === "male" ? "#64B5F6" : "#F06292"))
            .attr("stroke-width", 2.5)
            .style("filter", "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))");

        // Header section with name
        personNodes
            .append("rect")
            .attr("width", nodeWidth)
            .attr("height", headerHeight)
            .attr("rx", 16)
            .attr("ry", 16)
            .attr("fill", (d: any) => (d.gender === "male" ? "rgba(33, 150, 243, 0.15)" : "rgba(233, 30, 99, 0.15)"));

        // Person Name
        personNodes
            .append("text")
            .attr("x", nodeWidth / 2)
            .attr("y", headerHeight / 2 + 5)
            .attr("text-anchor", "middle")
            .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
            .style("font-size", "16px")
            .style("font-weight", "700")
            .style("fill", (d: any) => (d.gender === "male" ? "#1565C0" : "#C2185B"))
            .style("letter-spacing", "0.3px")
            .text((d: any) => d.name);

        // Details section with label-value pairs
        personNodes.each(function (d: any) {
            const nodeGroup = d3.select(this);
            const detailRows = getPersonDetailRows(d);
            let yOffset = headerHeight + basePadding;

            detailRows.forEach((row, index) => {
                const currentY = yOffset + index * rowHeight;

                // Label
                nodeGroup
                    .append("text")
                    .attr("x", basePadding)
                    .attr("y", currentY + 12)
                    .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                    .style("font-size", "9px")
                    .style("font-weight", "600")
                    .style("fill", "#757575")
                    .style("text-transform", "uppercase")
                    .style("letter-spacing", "0.5px")
                    .text(row.label);

                // Value
                nodeGroup
                    .append("text")
                    .attr("x", basePadding)
                    .attr("y", currentY + 28)
                    .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                    .style("font-size", "12px")
                    .style("font-weight", "500")
                    .style("fill", "#212121")
                    .text(row.value);
            });
        });

        // Action buttons section
        personNodes.each(function (d: any) {
            const nodeGroup = d3.select(this);
            const buttonY = d.nodeHeight - 36;
            const buttonHeight = 28;
            const buttonPadding = 8;

            // Edit button (left side)
            const editButton = nodeGroup
                .append("g")
                .attr("class", "edit-button")
                .style("cursor", "pointer")
                .on("click", function (event: any) {
                    event.stopPropagation();
                    setSelectedNode(d);
                });

            editButton
                .append("rect")
                .attr("x", basePadding)
                .attr("y", buttonY)
                .attr("width", 65)
                .attr("height", buttonHeight)
                .attr("rx", 6)
                .attr("fill", (dd: any) => (dd.gender === "male" ? "#2196F3" : "#E91E63"))
                .attr("opacity", 0.9)
                .style("transition", "opacity 0.2s");

            editButton
                .append("text")
                .attr("x", basePadding + 33)
                .attr("y", buttonY + buttonHeight / 2 + 5)
                .attr("text-anchor", "middle")
                .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                .style("font-size", "11px")
                .style("font-weight", "600")
                .style("fill", "#fff")
                .text("✏️ Edit");

            editButton
                .on("mouseenter", function () {
                    d3.select(this).select("rect").attr("opacity", 1);
                })
                .on("mouseleave", function () {
                    d3.select(this).select("rect").attr("opacity", 0.9);
                });

            // Add Relationship button (right side)
            const addButton = nodeGroup
                .append("g")
                .attr("class", "add-button")
                .style("cursor", "pointer")
                .on("click", function (event: any) {
                    event.stopPropagation();
                    familyMemberActions.openAddFamilyDialog(d.id);
                });

            addButton
                .append("rect")
                .attr("x", nodeWidth - basePadding - 95)
                .attr("y", buttonY)
                .attr("width", 95)
                .attr("height", buttonHeight)
                .attr("rx", 6)
                .attr("fill", "#4CAF50")
                .attr("opacity", 0.9)
                .style("transition", "opacity 0.2s");

            addButton
                .append("text")
                .attr("x", nodeWidth - basePadding - 47.5)
                .attr("y", buttonY + buttonHeight / 2 + 5)
                .attr("text-anchor", "middle")
                .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                .style("font-size", "11px")
                .style("font-weight", "600")
                .style("fill", "#fff")
                .text("➕ Add Family");

            addButton
                .on("mouseenter", function () {
                    d3.select(this).select("rect").attr("opacity", 1);
                })
                .on("mouseleave", function () {
                    d3.select(this).select("rect").attr("opacity", 0.9);
                });
        });

        // Photo badge (top-right corner)
        personNodes.each(function (d: any) {
            if (d.photoCount && d.photoCount > 0) {
                const nodeGroup = d3.select(this);
                const badgeSize = 32;
                const badgeX = nodeWidth - 16;
                const badgeY = 16;

                // Badge background circle
                nodeGroup
                    .append("circle")
                    .attr("cx", badgeX)
                    .attr("cy", badgeY)
                    .attr("r", badgeSize / 2)
                    .attr("fill", "#FF5722")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2.5)
                    .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.25))");

                // Camera emoji
                nodeGroup
                    .append("text")
                    .attr("x", badgeX)
                    .attr("y", badgeY - 4)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", "14px")
                    .style("pointer-events", "none")
                    .text("📷");

                // Photo count
                nodeGroup
                    .append("text")
                    .attr("x", badgeX)
                    .attr("y", badgeY + 7)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                    .style("font-size", "10px")
                    .style("font-weight", "700")
                    .style("fill", "#fff")
                    .style("pointer-events", "none")
                    .text(d.photoCount);
            }
        });

        // Couple nodes
        const coupleNodes = node.filter((d: any) => d.nodeType === "couple");

        // Gradient for couple nodes
        coupleNodes
            .append("defs")
            .append("radialGradient")
            .attr("id", (d: any) => `couple-gradient-${d.id}`)
            .selectAll("stop")
            .data([
                { offset: "0%", color: "#FFB74D" },
                { offset: "100%", color: "#FF9800" },
            ])
            .enter()
            .append("stop")
            .attr("offset", (d: any) => d.offset)
            .attr("stop-color", (d: any) => d.color);

        // Main circle
        coupleNodes
            .append("circle")
            .attr("r", 28)
            .attr("fill", (d: any) => `url(#couple-gradient-${d.id})`)
            .attr("stroke", "#F57C00")
            .attr("stroke-width", 2.5)
            .style("filter", "drop-shadow(0px 3px 6px rgba(0,0,0,0.2))");

        // Heart icon in center
        coupleNodes
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("font-size", "20px")
            .style("cursor", "pointer")
            .text("💑");

        // Add relationship button for couple nodes
        coupleNodes.each(function (d: any) {
            const coupleGroup = d3.select(this);
            const buttonRadius = 14;
            const buttonOffset = 35;

            const addButton = coupleGroup
                .append("g")
                .attr("class", "couple-add-button")
                .style("cursor", "pointer")
                .on("click", function (event: any) {
                    event.stopPropagation();
                    setSelectedNode(d);
                });

            // Button background
            addButton
                .append("circle")
                .attr("cx", buttonOffset)
                .attr("cy", 0)
                .attr("r", buttonRadius)
                .attr("fill", "#4CAF50")
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("opacity", 0.95)
                .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))")
                .style("transition", "all 0.2s");

            // Plus icon
            addButton
                .append("text")
                .attr("x", buttonOffset)
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .style("font-size", "18px")
                .style("font-weight", "bold")
                .style("fill", "#fff")
                .style("pointer-events", "none")
                .text("+");

            // Hover effects
            addButton
                .on("mouseenter", function () {
                    d3.select(this)
                        .select("circle")
                        .attr("opacity", 1)
                        .attr("r", buttonRadius + 2);
                })
                .on("mouseleave", function () {
                    d3.select(this).select("circle").attr("opacity", 0.95).attr("r", buttonRadius);
                });
        });

        // Children count badge for couple nodes
        coupleNodes.each(function (d: any) {
            if (d.childrenCount && d.childrenCount > 0) {
                const coupleGroup = d3.select(this);
                const badgeRadius = 11;
                const badgeX = 20;
                const badgeY = -20;

                // Badge background
                coupleGroup
                    .append("circle")
                    .attr("cx", badgeX)
                    .attr("cy", badgeY)
                    .attr("r", badgeRadius)
                    .attr("fill", "#8BC34A") // Light green
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2)
                    .style("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))");

                // Child count text
                coupleGroup
                    .append("text")
                    .attr("x", badgeX)
                    .attr("y", badgeY + 1)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                    .style("font-size", "10px")
                    .style("font-weight", "700")
                    .style("fill", "#fff")
                    .style("pointer-events", "none")
                    .text(d.childrenCount);
            }
        });

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
                    return `translate(${(d.x || 0) - 110}, ${(d.y || 0) - (d.nodeHeight || 90) / 2})`;
                }
                return `translate(${d.x || 0}, ${d.y || 0})`;
            });
        });

        // Handle window resize
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            svg.attr("width", newWidth).attr("height", newHeight);

            // Re-apply dagre layout on resize
            const repositionedNodes = applyDagreLayout(graphData.nodes, graphData.links, {
                rankdir: "TB",
                ranksep: 120,
                nodesep: 90,
                edgesep: 60,
            });

            graphData.nodes = repositionedNodes;
            simulation.nodes(repositionedNodes);
            simulation.alpha(0.1).restart();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            simulation.stop();
        };
    }, [data]);

    useEffect(() => {
        // After rendering the graph, center and zoom out to show the overall structure
        if (svgRef.current && data && data.nodes && zoomRef.current && data.nodes.length > 0) {
            // Calculate bounding box of all nodes
            const xs = data.nodes.map((n: any) => n.x || 0);
            const ys = data.nodes.map((n: any) => n.y || 0);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const svg = d3.select(svgRef.current);
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Calculate scale to fit all nodes comfortably
            const graphWidth = maxX - minX + 400;
            const graphHeight = maxY - minY + 400;
            const scale = Math.min(width / graphWidth, height / graphHeight, 0.8); // 0.8 for extra padding
            const x = width / 2 - centerX * scale;
            const y = height / 2 - centerY * scale;
            svg.transition().duration(0).call(zoomRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));
        }
    }, [data]);

    const handleCloseCard = () => {
        setSelectedNode(null);
        setInitialAction(null);
    };

    const handlePersonCreated = async (personId: string) => {
        setShowCreatePersonDialog(false);
        await fetchData();
        // Open the new person's card after data refreshes
        setTimeout(() => {
            setData((prev) => {
                if (prev) {
                    const newNode = prev.nodes.find((n) => n.id === personId);
                    if (newNode) setSelectedNode(newNode);
                }
                return prev;
            });
        }, 500);
    };

    const handleUpdateNode = (updatedNode: PersonNode) => {
        if (!data || !svgRef.current) return;

        // Update the node in the data array (without triggering re-render)
        const nodeToUpdate = data.nodes.find((node) => node.id === updatedNode.id);
        if (nodeToUpdate && nodeToUpdate.nodeType === "person") {
            Object.assign(nodeToUpdate, updatedNode);
        }

        // Update the visual representation of this specific node
        const svg = d3.select(svgRef.current);
        const nodeGroup = svg.select(`#node-${updatedNode.id}`);

        if (nodeGroup.empty()) {
            setSelectedNode(null);
            return;
        }

        // Recalculate node height based on new data
        const detailRows = getPersonDetailRows(updatedNode);
        const headerHeight = 50;
        const basePadding = 16;
        const rowHeight = 38;
        const buttonSectionHeight = 44;
        const newHeight = headerHeight + basePadding + detailRows.length * rowHeight + buttonSectionHeight;
        const nodeWidth = 220;

        // Update stored height on the data object
        if (nodeToUpdate) {
            (nodeToUpdate as any).nodeHeight = newHeight;
        }

        // Update the background rectangles
        nodeGroup
            .select("rect:nth-of-type(1)")
            .attr("height", newHeight)
            .attr(
                "fill",
                updatedNode.gender === "male"
                    ? "url(#gradient-" + updatedNode.id + ")"
                    : "url(#gradient-" + updatedNode.id + ")",
            )
            .attr("stroke", updatedNode.gender === "male" ? "#64B5F6" : "#F06292");

        // Update the gradient stops for gender
        const gradient = nodeGroup.select("linearGradient#gradient-" + updatedNode.id);
        if (!gradient.empty()) {
            const stops =
                updatedNode.gender === "male"
                    ? [
                          { offset: "0%", color: "#BBDEFB" },
                          { offset: "100%", color: "#E3F2FD" },
                      ]
                    : [
                          { offset: "0%", color: "#F8BBD0" },
                          { offset: "100%", color: "#FCE4EC" },
                      ];
            gradient
                .selectAll("stop")
                .data(stops)
                .attr("offset", (d: any) => d.offset)
                .attr("stop-color", (d: any) => d.color);
        }

        // Update the header rectangle color
        nodeGroup
            .select("rect:nth-of-type(2)")
            .attr("fill", updatedNode.gender === "male" ? "rgba(33, 150, 243, 0.15)" : "rgba(233, 30, 99, 0.15)");

        // Update the name (first text element in header)
        nodeGroup
            .select("text")
            .text(updatedNode.name)
            .style("fill", updatedNode.gender === "male" ? "#1565C0" : "#C2185B");

        // Remove only the detail text elements (not button text or name)
        // Detail text has y positions between headerHeight + basePadding and the button area
        const detailStartY = headerHeight + basePadding;
        const detailEndY = newHeight - buttonSectionHeight;

        nodeGroup
            .selectAll("text")
            .filter(function (this: any) {
                const y = parseFloat(d3.select(this).attr("y"));
                // Remove text that's in the detail area but not button text
                return y >= detailStartY && y < detailEndY && !d3.select(this).classed("button-text");
            })
            .remove();

        // Re-add detail rows
        let yOffset = headerHeight + basePadding;
        detailRows.forEach((row, index) => {
            const currentY = yOffset + index * rowHeight;

            // Label
            nodeGroup
                .append("text")
                .attr("x", basePadding)
                .attr("y", currentY + 12)
                .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                .style("font-size", "9px")
                .style("font-weight", "600")
                .style("fill", "#757575")
                .style("text-transform", "uppercase")
                .style("letter-spacing", "0.5px")
                .text(row.label);

            // Value
            nodeGroup
                .append("text")
                .attr("x", basePadding)
                .attr("y", currentY + 28)
                .style("font-family", "'Inter', 'Segoe UI', system-ui, sans-serif")
                .style("font-size", "12px")
                .style("font-weight", "500")
                .style("fill", "#212121")
                .text(row.value);
        });

        // Update button positions
        const buttonY = newHeight - 36;
        const buttonHeight = 28;

        // Update edit button
        nodeGroup
            .select(".edit-button rect")
            .attr("y", buttonY)
            .attr("fill", updatedNode.gender === "male" ? "#2196F3" : "#E91E63");
        nodeGroup.select(".edit-button text").attr("y", buttonY + buttonHeight / 2 + 5);

        // Update add button
        nodeGroup.select(".add-button rect").attr("y", buttonY);
        nodeGroup.select(".add-button text").attr("y", buttonY + buttonHeight / 2 + 5);

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
            <button
                onClick={() => setShowCreatePersonDialog(true)}
                title="Create new person"
                className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-3xl font-bold shadow-lg flex items-center justify-center transition-colors"
            >
                +
            </button>
            {data && <SearchBar nodes={data.nodes} onSelectNode={handleSearchSelect} />}
            {selectedNode && (
                <EditableNodeCard
                    node={selectedNode}
                    onClose={handleCloseCard}
                    onUpdate={handleUpdateNode}
                    onRefresh={fetchData}
                    initialAction={initialAction}
                    onSelectNode={setSelectedNode}
                />
            )}
            {familyMemberActions.showRelationDialog && (
                <AddFamilyMemberDialog
                    onCreateParent={familyMemberActions.handleCreateParent}
                    onCreateChild={familyMemberActions.handleCreateChild}
                    onCreatePartner={familyMemberActions.handleCreatePartner}
                    onClose={familyMemberActions.closeDialogs}
                />
            )}
            {flipEdgeActions.showFlipEdgeDialog && flipEdgeActions.selectedEdge && (
                <FlipEdgeDialog
                    edge={flipEdgeActions.selectedEdge}
                    onFlip={flipEdgeActions.handleFlipEdge}
                    onClose={flipEdgeActions.closeFlipEdgeDialog}
                />
            )}
            {showCreatePersonDialog && (
                <CreatePersonDialog onClose={() => setShowCreatePersonDialog(false)} onCreated={handlePersonCreated} />
            )}
            {familyMemberActions.showCoupleSelectionDialog && familyMemberActions.coupleSelectionData && (
                <CoupleSelectionDialog
                    role={familyMemberActions.coupleSelectionData.role}
                    couples={familyMemberActions.coupleSelectionData.couples}
                    onSelectCouple={(coupleId) =>
                        familyMemberActions.createPersonWithCouple(
                            familyMemberActions.coupleSelectionData!.role,
                            coupleId,
                        )
                    }
                    onClose={familyMemberActions.closeDialogs}
                />
            )}
        </>
    );
};

export default ForceGraph;
