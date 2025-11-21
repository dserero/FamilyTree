"use client";

import { useState } from "react";
import { PersonNode, CoupleNode } from "@/types/graph";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface EditableNodeCardProps {
    node: PersonNode | CoupleNode;
    onClose: () => void;
    onUpdate: (updatedNode: PersonNode) => void;
    onRefresh?: () => void;
    initialAction?: "parent" | "child" | null;
}

export function EditableNodeCard({ node, onClose, onUpdate, onRefresh, initialAction }: EditableNodeCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState<"parent" | "child" | null>(initialAction || null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for editable fields (only for PersonNode)
    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        dateOfDeath?: string;
        placeOfBirth?: string;
        placeOfDeath?: string;
        gender: "male" | "female";
    }>(
        node.nodeType === "person"
            ? {
                  firstName: node.firstName,
                  lastName: node.lastName,
                  dateOfBirth: node.dateOfBirth,
                  dateOfDeath: node.dateOfDeath || "",
                  placeOfBirth: node.placeOfBirth || "",
                  placeOfDeath: node.placeOfDeath || "",
                  gender: node.gender,
              }
            : {
                  firstName: "",
                  lastName: "",
                  dateOfBirth: "",
                  dateOfDeath: "",
                  placeOfBirth: "",
                  placeOfDeath: "",
                  gender: "male",
              }
    );

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSave = async () => {
        if (node.nodeType !== "person") return;

        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/family-tree", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: node.id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    name: `${formData.firstName} ${formData.lastName}`,
                    dateOfBirth: formData.dateOfBirth,
                    dateOfDeath: formData.dateOfDeath || undefined,
                    placeOfBirth: formData.placeOfBirth || undefined,
                    placeOfDeath: formData.placeOfDeath || undefined,
                    gender: formData.gender,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update person");
            }

            // Update the node with the new data
            const updatedNode: PersonNode = {
                ...node,
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`,
                dateOfBirth: formData.dateOfBirth,
                dateOfDeath: formData.dateOfDeath || undefined,
                placeOfBirth: formData.placeOfBirth || undefined,
                placeOfDeath: formData.placeOfDeath || undefined,
                gender: formData.gender,
            };

            onUpdate(updatedNode);
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating person:", err);
            setError(err instanceof Error ? err.message : "Failed to update person");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (node.nodeType === "person") {
            setFormData({
                firstName: node.firstName,
                lastName: node.lastName,
                dateOfBirth: node.dateOfBirth,
                dateOfDeath: node.dateOfDeath || "",
                placeOfBirth: node.placeOfBirth || "",
                placeOfDeath: node.placeOfDeath || "",
                gender: node.gender,
            });
        }
        setIsEditing(false);
        setIsCreating(null);
        setError(null);
    };

    const handleCreatePerson = async () => {
        if (node.nodeType !== "couple" || !isCreating) return;

        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/family-tree", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    coupleId: node.id,
                    personData: formData,
                    relationType: isCreating,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create person");
            }

            // Refresh the graph data
            if (onRefresh) {
                onRefresh();
            }

            // Close the card
            onClose();
        } catch (err) {
            console.error("Error creating person:", err);
            setError(err instanceof Error ? err.message : "Failed to create person");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmMessage =
            node.nodeType === "person"
                ? `Are you sure you want to delete ${node.firstName} ${node.lastName}? This will also delete all relationships.`
                : "Are you sure you want to delete this couple node? This will also delete all relationships.";

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/family-tree?id=${node.id}&nodeType=${node.nodeType}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete node");
            }

            // Refresh the graph data
            if (onRefresh) {
                onRefresh();
            }

            // Close the card
            onClose();
        } catch (err) {
            console.error("Error deleting node:", err);
            setError(err instanceof Error ? err.message : "Failed to delete node");
        } finally {
            setIsDeleting(false);
        }
    };

    // Render for CoupleNode
    if (node.nodeType === "couple") {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
                <div onClick={(e) => e.stopPropagation()}>
                    <Card className="w-[450px] bg-white">
                        <CardHeader>
                            <CardTitle>
                                {isCreating ? `Add ${isCreating === "parent" ? "Parent" : "Child"}` : "Couple Node"}
                            </CardTitle>
                            <CardDescription>ID: {node.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            {isCreating ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Place of Birth (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.placeOfBirth}
                                            onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Date of Death (optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dateOfDeath}
                                            onChange={(e) => handleInputChange("dateOfDeath", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Place of Death (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.placeOfDeath}
                                            onChange={(e) => handleInputChange("placeOfDeath", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) =>
                                                handleInputChange("gender", e.target.value as "male" | "female")
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    This is a couple relationship node connecting two partners. You can add a parent or
                                    child to this couple.
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            {isCreating ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreatePerson}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                    >
                                        {isSaving ? "Creating..." : "Create"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsCreating("parent")}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                    >
                                        Add Parent
                                    </button>
                                    <button
                                        onClick={() => setIsCreating("child")}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                    >
                                        Add Child
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors"
                                    >
                                        Close
                                    </button>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // Render for PersonNode
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <Card className="w-[450px] bg-white">
                    <CardHeader>
                        <CardTitle>{isEditing ? "Edit Person" : `${node.firstName} ${node.lastName}`}</CardTitle>
                        <CardDescription>ID: {node.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {isEditing ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Place of Birth (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.placeOfBirth}
                                        onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date of Death (optional)</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfDeath}
                                        onChange={(e) => handleInputChange("dateOfDeath", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Place of Death (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.placeOfDeath}
                                        onChange={(e) => handleInputChange("placeOfDeath", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) =>
                                            handleInputChange("gender", e.target.value as "male" | "female")
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Name:</span>
                                    <p className="text-base">
                                        {node.firstName} {node.lastName}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                                    <p className="text-base">{node.dateOfBirth || "Not specified"}</p>
                                </div>
                                {node.placeOfBirth && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Place of Birth:</span>
                                        <p className="text-base">{node.placeOfBirth}</p>
                                    </div>
                                )}
                                {node.dateOfDeath && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Date of Death:</span>
                                        <p className="text-base">{node.dateOfDeath}</p>
                                    </div>
                                )}
                                {node.placeOfDeath && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Place of Death:</span>
                                        <p className="text-base">{node.placeOfDeath}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Gender:</span>
                                    <p className="text-base capitalize">{node.gender}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors"
                                >
                                    Close
                                </button>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
