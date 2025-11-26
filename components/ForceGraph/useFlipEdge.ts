"use client";

import { useState } from "react";
import { Link } from "@/types/graph";

interface UseFlipEdgeProps {
    onRefresh: () => Promise<void>;
}

export function useFlipEdge({ onRefresh }: UseFlipEdgeProps) {
    const [selectedEdge, setSelectedEdge] = useState<Link | null>(null);
    const [showFlipEdgeDialog, setShowFlipEdgeDialog] = useState(false);

    const openFlipEdgeDialog = (edge: Link) => {
        setSelectedEdge(edge);
        setShowFlipEdgeDialog(true);
    };

    const closeFlipEdgeDialog = () => {
        setShowFlipEdgeDialog(false);
        setSelectedEdge(null);
    };

    const handleFlipEdge = async () => {
        if (!selectedEdge || !selectedEdge.personId || !selectedEdge.coupleId) return;

        try {
            const response = await fetch("/api/flip-edge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    personId: selectedEdge.personId,
                    coupleId: selectedEdge.coupleId,
                }),
            });

            if (response.ok) {
                await onRefresh();
                closeFlipEdgeDialog();
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

    return {
        selectedEdge,
        showFlipEdgeDialog,
        openFlipEdgeDialog,
        closeFlipEdgeDialog,
        handleFlipEdge,
    };
}
