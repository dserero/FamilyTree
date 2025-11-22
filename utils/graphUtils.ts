import * as d3 from "d3";
import { linkColors } from "@/types/graph";

export const createArrowMarkers = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.append("defs");

    // Marriage edge arrow (purple)
    defs.append("marker")
        .attr("id", "arrowhead-marriage")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", linkColors.marriage);

    // Parent-child edge arrow (green)
    defs.append("marker")
        .attr("id", "arrowhead-parent-child")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", linkColors["parent-child"]);
};

export const calculateLinkPosition = (sourceNode: any, targetNode: any, isStart: boolean) => {
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const node = isStart ? sourceNode : targetNode;
    const dims = getNodeDimensions(node.nodeType);
    const radiusX = dims.halfWidth;
    const radiusY = dims.halfHeight;

    const offsetX = (dx / dist) * radiusX;
    const offsetY = (dy / dist) * radiusY;

    if (isStart) {
        return {
            x: sourceNode.x + offsetX,
            y: sourceNode.y + offsetY,
        };
    } else {
        return {
            x: targetNode.x - offsetX,
            y: targetNode.y - offsetY,
        };
    }
};

export const getNodeDimensions = (nodeType: "person" | "couple") => {
    // Fixed dimensions - zoom will handle scaling
    if (nodeType === "couple") {
        return { width: 80, height: 100, halfWidth: 40, halfHeight: 50 };
    }
    // Simplified person node - same size as couple for testing
    return { width: 100, height: 100, halfWidth: 50, halfHeight: 50 };
};
