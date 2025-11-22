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

export const calculateLinkPosition = (
    sourceNode: any,
    targetNode: any,
    isStart: boolean,
    isMobile: boolean = false
) => {
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const node = isStart ? sourceNode : targetNode;
    const dims = getNodeDimensions(node.nodeType, isMobile);
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

export const getNodeDimensions = (nodeType: "person" | "couple", isMobile: boolean = false) => {
    if (nodeType === "couple") {
        const width = isMobile ? 60 : 80;
        const height = isMobile ? 75 : 100;
        return { width, height, halfWidth: width / 2, halfHeight: height / 2 };
    }
    const width = isMobile ? 120 : 180;
    const height = isMobile ? 140 : 170;
    return { width, height, halfWidth: width / 2, halfHeight: height / 2 };
};
