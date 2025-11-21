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
    const radiusX = node.nodeType === "couple" ? 40 : 90;
    const radiusY = node.nodeType === "couple" ? 50 : 85;

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
    if (nodeType === "couple") {
        return { width: 80, height: 100, halfWidth: 40, halfHeight: 50 };
    }
    return { width: 180, height: 170, halfWidth: 90, halfHeight: 85 };
};
