"use client";

import { useState } from "react";
import { Node } from "@/types/graph";

interface UseFamilyMemberActionsProps {
    onRefresh: () => Promise<void>;
    onSelectNode: (node: Node) => void;
    data: { nodes: Node[]; links: any[] } | null;
}

export function useFamilyMemberActions({ onRefresh, onSelectNode, data }: UseFamilyMemberActionsProps) {
    const [pendingPersonId, setPendingPersonId] = useState<string | null>(null);
    const [showRelationDialog, setShowRelationDialog] = useState(false);
    const [showCoupleSelectionDialog, setShowCoupleSelectionDialog] = useState(false);
    const [coupleSelectionData, setCoupleSelectionData] = useState<{
        role: "parent" | "child" | "partner";
        couples: string[];
    } | null>(null);

    const handleCreateParent = async () => {
        if (!pendingPersonId) return;

        try {
            // Get existing couples where this person is a child
            const couplesResponse = await fetch(`/api/person/${pendingPersonId}/couples`);
            if (!couplesResponse.ok) throw new Error("Failed to fetch couples");

            const { asChild } = await couplesResponse.json();

            if (asChild.length === 0) {
                // No existing couple, create new couple with parent
                await createPersonWithCouple("parent", null);
            } else if (asChild.length === 1) {
                // One couple exists, show choice to use it or create new
                setCoupleSelectionData({ role: "parent", couples: asChild });
                setShowCoupleSelectionDialog(true);
            } else {
                // Multiple couples, show selection
                setCoupleSelectionData({ role: "parent", couples: asChild });
                setShowCoupleSelectionDialog(true);
            }
        } catch (error) {
            console.error("Error handling parent creation:", error);
            alert("Error creating parent");
        }
    };

    const handleCreateChild = async () => {
        if (!pendingPersonId) return;

        try {
            // Get existing couples where this person is a partner
            const couplesResponse = await fetch(`/api/person/${pendingPersonId}/couples`);
            if (!couplesResponse.ok) throw new Error("Failed to fetch couples");

            const { asPartner } = await couplesResponse.json();

            if (asPartner.length === 0) {
                // No existing couple, create new couple with child
                await createPersonWithCouple("child", null);
            } else if (asPartner.length === 1) {
                // One couple exists, show choice to use it or create new
                setCoupleSelectionData({ role: "child", couples: asPartner });
                setShowCoupleSelectionDialog(true);
            } else {
                // Multiple couples, show selection
                setCoupleSelectionData({ role: "child", couples: asPartner });
                setShowCoupleSelectionDialog(true);
            }
        } catch (error) {
            console.error("Error handling child creation:", error);
            alert("Error creating child");
        }
    };

    const handleCreatePartner = async () => {
        if (!pendingPersonId) return;

        try {
            // Get existing couples where this person is a partner
            const couplesResponse = await fetch(`/api/person/${pendingPersonId}/couples`);
            if (!couplesResponse.ok) throw new Error("Failed to fetch couples");

            const { asPartner } = await couplesResponse.json();

            if (asPartner.length === 0) {
                // No existing couple, create new couple with partner
                await createPersonWithCouple("partner", null);
            } else if (asPartner.length === 1) {
                // One couple exists, show choice to use it or create new
                setCoupleSelectionData({ role: "partner", couples: asPartner });
                setShowCoupleSelectionDialog(true);
            } else {
                // Multiple couples, show selection
                setCoupleSelectionData({ role: "partner", couples: asPartner });
                setShowCoupleSelectionDialog(true);
            }
        } catch (error) {
            console.error("Error handling partner creation:", error);
            alert("Error creating partner");
        }
    };

    const createPersonWithCouple = async (role: "parent" | "child" | "partner", coupleId: string | null) => {
        if (!pendingPersonId) return;

        try {
            const response = await fetch("/api/couple/with-person", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    personId: pendingPersonId,
                    role: role,
                    coupleId: coupleId,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                await onRefresh();
                setShowRelationDialog(false);
                setShowCoupleSelectionDialog(false);
                setPendingPersonId(null);
                setCoupleSelectionData(null);

                // Open the newly created person in edit mode
                setTimeout(() => {
                    if (data) {
                        const newPerson = data.nodes.find((n) => n.id === result.personId);
                        if (newPerson) {
                            onSelectNode(newPerson);
                        }
                    }
                }, 500);
            } else {
                const errorData = await response.json();
                console.error("Failed to create person:", errorData.error);
                alert(`Failed to create: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error creating person with couple:", error);
            alert("Error creating person");
        }
    };

    const openAddFamilyDialog = (personId: string) => {
        setPendingPersonId(personId);
        setShowRelationDialog(true);
    };

    const closeDialogs = () => {
        setShowRelationDialog(false);
        setShowCoupleSelectionDialog(false);
        setPendingPersonId(null);
        setCoupleSelectionData(null);
    };

    return {
        // State
        showRelationDialog,
        showCoupleSelectionDialog,
        coupleSelectionData,
        // Actions
        handleCreateParent,
        handleCreateChild,
        handleCreatePartner,
        createPersonWithCouple,
        openAddFamilyDialog,
        closeDialogs,
    };
}
