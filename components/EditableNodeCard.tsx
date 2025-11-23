"use client";

import { useState, useEffect } from "react";
import { PersonNode, CoupleNode, Node } from "@/types/graph";
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
    const [showRelationDialog, setShowRelationDialog] = useState(false);
    const [showCoupleRelationDialog, setShowCoupleRelationDialog] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState<"partner" | "child" | null>(null);
    const [allPersons, setAllPersons] = useState<PersonNode[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredPersons, setFilteredPersons] = useState<PersonNode[]>([]);

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

    // Fetch all persons when showing link dialog
    useEffect(() => {
        if (showLinkDialog && node.nodeType === "couple") {
            fetchAllPersons();
        }
    }, [showLinkDialog, node.nodeType]);

    // Filter persons based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredPersons(allPersons);
        } else {
            const searchLower = searchTerm.toLowerCase();
            const filtered = allPersons.filter((person) => {
                const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
                return (
                    fullName.includes(searchLower) ||
                    person.firstName.toLowerCase().includes(searchLower) ||
                    person.lastName.toLowerCase().includes(searchLower)
                );
            });
            setFilteredPersons(filtered);
        }
    }, [searchTerm, allPersons]);

    const fetchAllPersons = async () => {
        try {
            const response = await fetch("/api/family-tree");
            if (!response.ok) {
                throw new Error("Failed to fetch persons");
            }
            const data = await response.json();
            const persons = data.nodes.filter((n: Node): n is PersonNode => n.nodeType === "person");
            setAllPersons(persons);
            setFilteredPersons(persons);
        } catch (err) {
            console.error("Error fetching persons:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch persons");
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleLinkExistingPerson = async (personId: string) => {
        if (node.nodeType !== "couple" || !showLinkDialog) return;

        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/couple/link", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    personId,
                    coupleId: node.id,
                    role: showLinkDialog,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to link person");
            }

            // Refresh the graph data
            if (onRefresh) {
                onRefresh();
            }

            // Close dialogs and card
            setShowLinkDialog(null);
            setSearchTerm("");
            onClose();
        } catch (err) {
            console.error("Error linking person:", err);
            setError(err instanceof Error ? err.message : "Failed to link person");
        } finally {
            setIsSaving(false);
        }
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

    const handleCreateCouple = async (role: "partner" | "child") => {
        if (node.nodeType !== "person") return;

        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/couple", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    personId: node.id,
                    role: role,
                }),
            });

            if (response.ok) {
                // Refresh the graph data
                if (onRefresh) {
                    onRefresh();
                }

                // Close the dialog and card
                setShowRelationDialog(false);
                onClose();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create couple");
            }
        } catch (err) {
            console.error("Error creating couple:", err);
            setError(err instanceof Error ? err.message : "Failed to create couple");
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
        // If showing link dialog
        if (showLinkDialog) {
            return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Card className="w-[500px] bg-white max-h-[600px] flex flex-col">
                            <CardHeader>
                                <CardTitle>
                                    Link Existing Person as {showLinkDialog === "partner" ? "Partner" : "Child"}
                                </CardTitle>
                                <CardDescription>Search and select a person from your family tree</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
                                {error && (
                                    <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
                                    {filteredPersons.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">No persons found</div>
                                    ) : (
                                        <div className="divide-y">
                                            {filteredPersons.map((person) => (
                                                <div
                                                    key={person.id}
                                                    onClick={() => handleLinkExistingPerson(person.id)}
                                                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <div className="font-semibold text-sm">
                                                        {person.firstName} {person.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Born: {person.dateOfBirth}
                                                        {person.placeOfBirth && ` • ${person.placeOfBirth}`}
                                                    </div>
                                                    {person.dateOfDeath && (
                                                        <div className="text-xs text-gray-600">
                                                            Died: {person.dateOfDeath}
                                                            {person.placeOfDeath && ` • ${person.placeOfDeath}`}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <button
                                    onClick={() => {
                                        setShowLinkDialog(null);
                                        setSearchTerm("");
                                        setError(null);
                                    }}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors"
                                >
                                    {isSaving ? "Linking..." : "Cancel"}
                                </button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            );
        }

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
                                            type="text"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                            placeholder="YYYY or YYYY-MM-DD"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter year only (e.g., 1990) or full date (e.g., 1990-05-15)
                                        </p>
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
                                            type="text"
                                            value={formData.dateOfDeath}
                                            onChange={(e) => handleInputChange("dateOfDeath", e.target.value)}
                                            placeholder="YYYY or YYYY-MM-DD"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter year only (e.g., 2020) or full date (e.g., 2020-12-31)
                                        </p>
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
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        This is a couple relationship node connecting two partners. You can:
                                    </p>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                        <li>Add a new parent/partner or child</li>
                                        <li>Link an existing person as partner or child</li>
                                    </ul>
                                </div>
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
                                    <div className="w-full space-y-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsCreating("parent")}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                                            >
                                                Add Parent
                                            </button>
                                            <button
                                                onClick={() => setShowLinkDialog("partner")}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                                            >
                                                Link Partner
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsCreating("child")}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                                            >
                                                Add Child
                                            </button>
                                            <button
                                                onClick={() => setShowLinkDialog("child")}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                                            >
                                                Link Child
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                                            >
                                                {isDeleting ? "Deleting..." : "Delete"}
                                            </button>
                                            <button
                                                onClick={onClose}
                                                disabled={isDeleting}
                                                className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors text-sm"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
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
                {showRelationDialog ? (
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
                                    disabled={isSaving}
                                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-left"
                                >
                                    <div className="font-semibold">💑 As Partner/Lover</div>
                                    <div className="text-sm opacity-90">
                                        Create a couple node where this person is one of the partners
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleCreateCouple("child")}
                                    disabled={isSaving}
                                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-left"
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
                                onClick={() => setShowRelationDialog(false)}
                                disabled={isSaving}
                                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors"
                            >
                                {isSaving ? "Creating..." : "Cancel"}
                            </button>
                        </CardFooter>
                    </Card>
                ) : (
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
                                            type="text"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                            placeholder="YYYY or YYYY-MM-DD"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter year only (e.g., 1990) or full date (e.g., 1990-05-15)
                                        </p>
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
                                            type="text"
                                            value={formData.dateOfDeath}
                                            onChange={(e) => handleInputChange("dateOfDeath", e.target.value)}
                                            placeholder="YYYY or YYYY-MM-DD"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter year only (e.g., 2020) or full date (e.g., 2020-12-31)
                                        </p>
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
                                        onClick={() => setShowRelationDialog(true)}
                                        disabled={isDeleting}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md transition-colors font-bold text-lg"
                                    >
                                        +
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
                )}
            </div>
        </div>
    );
}
