import dagre from "dagre";
import { Node, Link } from "@/types/graph";

export interface LayoutConfig {
    rankdir?: "TB" | "BT" | "LR" | "RL"; // Direction: Top-Bottom, Bottom-Top, Left-Right, Right-Left
    ranksep?: number; // Separation between ranks (generations)
    nodesep?: number; // Separation between nodes in the same rank
    edgesep?: number; // Separation between edges
}

/**
 * Apply Dagre hierarchical layout to graph nodes
 * This creates a clean, structured layout for family trees
 */
export const applyDagreLayout = (nodes: Node[], links: Link[], config: LayoutConfig = {}) => {
    const {
        rankdir = "TB", // Top to bottom (oldest generation at top)
        ranksep = 150, // Vertical space between generations
        nodesep = 100, // Horizontal space between siblings
        edgesep = 50, // Space between edges
    } = config;

    // Create a new directed graph
    const g = new dagre.graphlib.Graph();

    // Set graph configuration
    g.setGraph({
        rankdir,
        ranksep,
        nodesep,
        edgesep,
        marginx: 20,
        marginy: 20,
    });

    // Default edge configuration
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to the graph with their dimensions
    nodes.forEach((node) => {
        const dimensions = getNodeDimensions(node);
        g.setNode(node.id, {
            width: dimensions.width,
            height: dimensions.height,
            ...node,
        });
    });

    // Add edges to the graph
    links.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;

        g.setEdge(sourceId, targetId, {
            ...link,
        });
    });

    // Run the layout algorithm
    dagre.layout(g);

    // Extract positioned nodes
    const positionedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
            ...node,
            x: nodeWithPosition.x,
            y: nodeWithPosition.y,
        };
    });

    return positionedNodes;
};

/**
 * Get dimensions for different node types
 */
const getNodeDimensions = (node: Node) => {
    if (node.nodeType === "couple") {
        return { width: 80, height: 80 };
    }

    // Person node - calculate height based on details
    const baseHeight = 50; // Header
    const padding = 16;
    const rowHeight = 38;
    const buttonHeight = 44;

    let detailRowCount = 2; // DOB and POB are always present

    if (node.nodeType === "person") {
        if (node.profession) detailRowCount++;
        if (node.dateOfDeath) detailRowCount += 2; // Date and place of death
        else if (node.placeOfDeath) detailRowCount++;
    }

    const height = baseHeight + padding + detailRowCount * rowHeight + buttonHeight;

    return { width: 220, height };
};

/**
 * Alternative: Custom hierarchical layout based on parent-child relationships
 * This gives more control over generation positioning
 */
export const applyCustomHierarchicalLayout = (nodes: Node[], links: Link[], width: number, height: number) => {
    // Build adjacency maps
    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();

    links.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;

        if (link.type === "parent-child") {
            // Source (couple) -> Target (child)
            if (!childrenMap.has(sourceId)) childrenMap.set(sourceId, []);
            childrenMap.get(sourceId)!.push(targetId);

            if (!parentsMap.has(targetId)) parentsMap.set(targetId, []);
            parentsMap.get(targetId)!.push(sourceId);
        }
    });

    // Find root nodes (nodes without parents)
    const roots = nodes.filter((node) => !parentsMap.has(node.id));

    // Assign levels (generations) using BFS
    const levels = new Map<string, number>();
    const queue: Array<{ id: string; level: number }> = [];

    roots.forEach((root) => {
        levels.set(root.id, 0);
        queue.push({ id: root.id, level: 0 });
    });

    let maxLevel = 0;

    while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        const children = childrenMap.get(id) || [];

        children.forEach((childId) => {
            if (!levels.has(childId) || levels.get(childId)! > level + 1) {
                levels.set(childId, level + 1);
                queue.push({ id: childId, level: level + 1 });
                maxLevel = Math.max(maxLevel, level + 1);
            }
        });
    }

    // Group nodes by level
    const nodesByLevel = new Map<number, Node[]>();
    nodes.forEach((node) => {
        const level = levels.get(node.id) ?? 0;
        if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
        nodesByLevel.get(level)!.push(node);
    });

    // Position nodes
    const levelHeight = height / (maxLevel + 2);

    const positionedNodes = nodes.map((node) => {
        const level = levels.get(node.id) ?? 0;
        const nodesInLevel = nodesByLevel.get(level) || [];
        const indexInLevel = nodesInLevel.indexOf(node);
        const levelWidth = width / (nodesInLevel.length + 1);

        return {
            ...node,
            x: levelWidth * (indexInLevel + 1),
            y: levelHeight * (level + 1),
        };
    });

    return positionedNodes;
};
