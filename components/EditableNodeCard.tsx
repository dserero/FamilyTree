"use client";

import { useState, useEffect } from "react";
import { PersonNode, CoupleNode, Node } from "@/types/graph";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Image as ImageIcon, X, Edit2, Trash2, Plus } from "lucide-react";
import { PhotoViewer } from "./PersonCard/PhotoViewer";
import { PhotoGalleryView } from "./PersonCard/PhotoGalleryView";
import { PersonFormFields } from "./PersonCard/PersonFormFields";
import { PersonDisplayView } from "./PersonCard/PersonDisplayView";
import { CoupleRelationDialog } from "./PersonCard/CoupleRelationDialog";
import { usePhotoManager } from "./PersonCard/usePhotoManager";

interface EditableNodeCardProps {
    node: PersonNode | CoupleNode;
    onClose: () => void;
    onUpdate: (updatedNode: PersonNode) => void;
    onRefresh?: () => void;
    initialAction?: "parent" | "child" | null;
    onSelectNode?: (node: Node) => void;
}

export function EditableNodeCard({
    node,
    onClose,
    onUpdate,
    onRefresh,
    initialAction,
    onSelectNode,
}: EditableNodeCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRelationDialog, setShowRelationDialog] = useState(false);
    const [showPhotos, setShowPhotos] = useState(false);
    const [allPeople, setAllPeople] = useState<Array<{ id: string; name: string }>>([]);

    const photoManager = usePhotoManager(node.nodeType === "person" ? node : null, onUpdate);

    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        dateOfDeath?: string;
        placeOfBirth?: string;
        placeOfDeath?: string;
        profession?: string;
        notes?: string;
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
                  profession: node.profession || "",
                  notes: node.notes || "",
                  gender: node.gender,
              }
            : {
                  firstName: "",
                  lastName: "",
                  dateOfBirth: "",
                  dateOfDeath: "",
                  placeOfBirth: "",
                  placeOfDeath: "",
                  profession: "",
                  notes: "",
                  gender: "male",
              }
    );

    useEffect(() => {
        if (showPhotos && node.nodeType === "person") {
            photoManager.fetchPhotos();
            fetchAllPeople();
        }
    }, [showPhotos, node.nodeType]);

    const fetchAllPeople = async () => {
        try {
            const response = await fetch("/api/family-tree");
            if (!response.ok) throw new Error("Failed to fetch people");
            const data = await response.json();
            const people = data.nodes
                .filter((n: any) => n.nodeType === "person")
                .map((n: any) => ({
                    id: n.id,
                    name: `${n.firstName} ${n.lastName}`,
                }));
            setAllPeople(people);
        } catch (err) {
            console.error("Error fetching people:", err);
        }
    };

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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: node.id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    name: `${formData.firstName} ${formData.lastName}`,
                    dateOfBirth: formData.dateOfBirth,
                    dateOfDeath: formData.dateOfDeath || undefined,
                    placeOfBirth: formData.placeOfBirth || undefined,
                    placeOfDeath: formData.placeOfDeath || undefined,
                    profession: formData.profession || undefined,
                    notes: formData.notes || undefined,
                    gender: formData.gender,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update person");
            }

            const updatedNode: PersonNode = {
                ...node,
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`,
                dateOfBirth: formData.dateOfBirth,
                dateOfDeath: formData.dateOfDeath || undefined,
                placeOfBirth: formData.placeOfBirth || undefined,
                placeOfDeath: formData.placeOfDeath || undefined,
                profession: formData.profession || undefined,
                notes: formData.notes || undefined,
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
                profession: node.profession || "",
                notes: node.notes || "",
                gender: node.gender,
            });
        }
        setIsEditing(false);
        setError(null);
    };

    const handleCreateCouple = async (role: "partner" | "child") => {
        if (node.nodeType !== "person") return;

        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/couple", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personId: node.id, role }),
            });

            if (response.ok) {
                if (onRefresh) onRefresh();
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

        if (!window.confirm(confirmMessage)) return;

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

            if (onRefresh) onRefresh();
            onClose();
        } catch (err) {
            console.error("Error deleting node:", err);
            setError(err instanceof Error ? err.message : "Failed to delete node");
        } finally {
            setIsDeleting(false);
        }
    };

    // Render for CoupleNode - simplified since it's less common
    if (node.nodeType === "couple") {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
                <div onClick={(e) => e.stopPropagation()}>
                    <Card className="w-[500px] bg-white">
                        <CardHeader>
                            <CardTitle>Couple Node</CardTitle>
                            <CardDescription>Manage this family relationship</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-3">
                                <p className="text-sm text-gray-700 mb-4">
                                    This is a couple relationship node connecting two partners. You can add a new
                                    partner or child to this family:
                                </p>
                                <button
                                    onClick={async () => {
                                        setIsSaving(true);
                                        setError(null);
                                        try {
                                            const response = await fetch("/api/couple/link", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ coupleId: node.id, role: "partner" }),
                                            });
                                            if (response.ok) {
                                                const result = await response.json();
                                                if (onRefresh) await onRefresh();
                                                // Fetch the newly created person and open edit dialog
                                                const treeResponse = await fetch("/api/family-tree");
                                                if (treeResponse.ok) {
                                                    const treeData = await treeResponse.json();
                                                    const newPerson = treeData.nodes.find(
                                                        (n: any) => n.id === result.personId
                                                    );
                                                    if (newPerson && onSelectNode) {
                                                        onClose();
                                                        // Use setTimeout to ensure the close animation completes
                                                        setTimeout(() => onSelectNode(newPerson), 100);
                                                    } else {
                                                        onClose();
                                                    }
                                                } else {
                                                    onClose();
                                                }
                                            } else {
                                                const errorData = await response.json();
                                                throw new Error(errorData.error || "Failed to create partner");
                                            }
                                        } catch (err) {
                                            console.error("Error creating partner:", err);
                                            setError(err instanceof Error ? err.message : "Failed to create partner");
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="w-full px-5 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">➕</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-base mb-1">
                                                {isSaving ? "Creating..." : "Add Partner"}
                                            </div>
                                            <div className="text-sm opacity-90">
                                                Add another partner to this family unit (e.g., for remarriages or
                                                polyamorous families)
                                            </div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsSaving(true);
                                        setError(null);
                                        try {
                                            const response = await fetch("/api/couple/link", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ coupleId: node.id, role: "child" }),
                                            });
                                            if (response.ok) {
                                                const result = await response.json();
                                                if (onRefresh) await onRefresh();
                                                // Fetch the newly created person and open edit dialog
                                                const treeResponse = await fetch("/api/family-tree");
                                                if (treeResponse.ok) {
                                                    const treeData = await treeResponse.json();
                                                    const newPerson = treeData.nodes.find(
                                                        (n: any) => n.id === result.personId
                                                    );
                                                    if (newPerson && onSelectNode) {
                                                        onClose();
                                                        // Use setTimeout to ensure the close animation completes
                                                        setTimeout(() => onSelectNode(newPerson), 100);
                                                    } else {
                                                        onClose();
                                                    }
                                                } else {
                                                    onClose();
                                                }
                                            } else {
                                                const errorData = await response.json();
                                                throw new Error(errorData.error || "Failed to create child");
                                            }
                                        } catch (err) {
                                            console.error("Error creating child:", err);
                                            setError(err instanceof Error ? err.message : "Failed to create child");
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="w-full px-5 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">👶</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-base mb-1">
                                                {isSaving ? "Creating..." : "Add Child"}
                                            </div>
                                            <div className="text-sm opacity-90">Add a new child to this couple</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || isSaving}
                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? "Deleting..." : "Delete Couple"}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isSaving}
                                className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Close
                            </button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // Render for PersonNode
    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div onClick={(e) => e.stopPropagation()}>
                {/* Photo Viewer Modal */}
                {photoManager.selectedPhoto && (
                    <PhotoViewer
                        photo={photoManager.selectedPhoto}
                        photoIndex={photoManager.selectedPhotoIndex}
                        totalPhotos={photoManager.photos.length}
                        onClose={photoManager.closePhotoViewer}
                        onNext={photoManager.goToNextPhoto}
                        onPrevious={photoManager.goToPreviousPhoto}
                        showActions={true}
                        onEdit={() => {
                            // Close photo viewer and switch to gallery view to edit
                            photoManager.closePhotoViewer();
                            setShowPhotos(true);
                        }}
                        onDelete={async () => {
                            try {
                                await photoManager.deletePhoto(photoManager.selectedPhoto!.id);
                            } catch (e) {
                                console.error(e);
                                alert("Failed to delete photo");
                            }
                        }}
                    />
                )}

                {showRelationDialog ? (
                    <CoupleRelationDialog
                        isSaving={isSaving}
                        onCreateAsPartner={() => handleCreateCouple("partner")}
                        onCreateAsChild={() => handleCreateCouple("child")}
                        onCancel={() => setShowRelationDialog(false)}
                    />
                ) : showPhotos ? (
                    <PhotoGalleryView
                        firstName={node.firstName}
                        lastName={node.lastName}
                        photos={photoManager.photos}
                        loadingPhotos={photoManager.loadingPhotos}
                        uploadingPhoto={photoManager.uploadingPhoto}
                        uploadError={photoManager.uploadError}
                        onPhotoClick={photoManager.selectPhoto}
                        onPhotoUpload={photoManager.handlePhotoUpload}
                        onPhotoUpdate={photoManager.updatePhoto}
                        onPhotoDelete={photoManager.deletePhoto}
                        allPeople={allPeople}
                        onClose={() => setShowPhotos(false)}
                    />
                ) : (
                    <Card className="w-[520px] bg-white shadow-2xl border-2">
                        <CardHeader
                            className={`${
                                node.gender === "male"
                                    ? "bg-gradient-to-r from-blue-50 to-cyan-50"
                                    : "bg-gradient-to-r from-pink-50 to-rose-50"
                            } border-b`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2 text-2xl">
                                        <User className="w-6 h-6" />
                                        {isEditing ? "Edit Person" : `${node.firstName} ${node.lastName}`}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {node.dateOfBirth}
                                        </span>
                                        {node.photoCount !== undefined && node.photoCount > 0 && (
                                            <span className="flex items-center gap-1 text-orange-600 font-semibold">
                                                <ImageIcon className="w-3 h-3" />
                                                {node.photoCount} photo{node.photoCount !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <span className="text-red-600">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {photoManager.uploadError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <span className="text-red-600">⚠️</span>
                                    <span>{photoManager.uploadError}</span>
                                </div>
                            )}

                            {photoManager.uploadingPhoto && (
                                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Uploading photo...</span>
                                </div>
                            )}

                            {isEditing ? (
                                <PersonFormFields formData={formData} onChange={handleInputChange} />
                            ) : (
                                <PersonDisplayView
                                    node={node}
                                    onShowPhotos={() => setShowPhotos(true)}
                                    onPhotoUpload={photoManager.handlePhotoUpload}
                                    uploadingPhoto={photoManager.uploadingPhoto}
                                />
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2 border-t bg-gray-50">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        {isSaving ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saving...
                                            </span>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        disabled={isDeleting}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setShowRelationDialog(true)}
                                        disabled={isDeleting}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Relation
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        {isDeleting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Deleting...
                                            </span>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        disabled={isDeleting}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                                    >
                                        <X className="w-4 h-4" />
                                        Close
                                    </button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
