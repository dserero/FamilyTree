"use client";

import { useState, useEffect } from "react";
import { PersonNode, CoupleNode, Node } from "@/types/graph";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    User,
    Calendar,
    MapPin,
    Users,
    Image as ImageIcon,
    X,
    Edit2,
    Trash2,
    Plus,
    ChevronLeft,
    ChevronRight,
    Upload,
} from "lucide-react";

interface Photo {
    id: string;
    url: string;
    caption?: string;
    location?: string;
    dateTaken?: string;
    comments?: string;
    uploadedAt: string;
}

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
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [showPhotos, setShowPhotos] = useState(false);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // State for editable fields (only for PersonNode)
    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        dateOfDeath?: string;
        placeOfBirth?: string;
        placeOfDeath?: string;
        profession?: string;
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

    // Fetch photos for person
    const fetchPhotos = async () => {
        if (node.nodeType !== "person") return;

        setLoadingPhotos(true);
        try {
            const response = await fetch(`/api/person/${node.id}/photos`);
            if (!response.ok) {
                throw new Error("Failed to fetch photos");
            }
            const data = await response.json();
            setPhotos(data.photos || []);
        } catch (err) {
            console.error("Error fetching photos:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch photos");
        } finally {
            setLoadingPhotos(false);
        }
    };

    // Load photos when showing photos view
    useEffect(() => {
        if (showPhotos && node.nodeType === "person") {
            fetchPhotos();
        }
    }, [showPhotos, node.nodeType]);

    // Navigate to next photo
    const goToNextPhoto = () => {
        if (selectedPhotoIndex < photos.length - 1) {
            const nextIndex = selectedPhotoIndex + 1;
            setSelectedPhotoIndex(nextIndex);
            setSelectedPhoto(photos[nextIndex]);
        }
    };

    // Navigate to previous photo
    const goToPreviousPhoto = () => {
        if (selectedPhotoIndex > 0) {
            const prevIndex = selectedPhotoIndex - 1;
            setSelectedPhotoIndex(prevIndex);
            setSelectedPhoto(photos[prevIndex]);
        }
    };

    // Close photo viewer
    const closePhotoViewer = () => {
        setSelectedPhoto(null);
        setSelectedPhotoIndex(-1);
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPhoto) return;

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goToPreviousPhoto();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goToNextPhoto();
            } else if (e.key === "Escape") {
                e.preventDefault();
                closePhotoViewer();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPhoto, selectedPhotoIndex, photos]);

    // Touch/Swipe support for mobile
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNextPhoto();
        } else if (isRightSwipe) {
            goToPreviousPhoto();
        }
    };

    // Handle photo upload
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (node.nodeType !== "person") return;

        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setUploadError("Please select an image file");
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError("File size must be less than 10MB");
            return;
        }

        setUploadingPhoto(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("taggedPeople", JSON.stringify([node.id]));

            const response = await fetch("/api/photos", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to upload photo");
            }

            // Refresh photos list
            await fetchPhotos();

            // Update photo count in the node
            if (onRefresh) {
                onRefresh();
            }

            setShowUploadDialog(false);

            // Reset file input
            event.target.value = "";
        } catch (err) {
            console.error("Error uploading photo:", err);
            setUploadError(err instanceof Error ? err.message : "Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

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
                    profession: formData.profession || undefined,
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
                profession: formData.profession || undefined,
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
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <Card className="w-[550px] bg-white max-h-[700px] flex flex-col shadow-2xl border-2">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Link Existing Person as {showLinkDialog === "partner" ? "Partner" : "Child"}
                                </CardTitle>
                                <CardDescription>Search and select a person from your family tree</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col pt-6">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                        <span className="text-red-600">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto border-2 border-gray-200 rounded-lg">
                                    {filteredPersons.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">
                                            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No persons found</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {filteredPersons.map((person) => (
                                                <div
                                                    key={person.id}
                                                    onClick={() => handleLinkExistingPerson(person.id)}
                                                    className="p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all group"
                                                >
                                                    <div className="font-semibold text-sm group-hover:text-purple-700 transition-colors flex items-center gap-2">
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                person.gender === "male" ? "bg-blue-500" : "bg-pink-500"
                                                            }`}
                                                        ></span>
                                                        {person.firstName} {person.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Born: {person.dateOfBirth}
                                                        {person.placeOfBirth && (
                                                            <>
                                                                <span className="mx-1">•</span>
                                                                <MapPin className="w-3 h-3" />
                                                                {person.placeOfBirth}
                                                            </>
                                                        )}
                                                    </div>
                                                    {person.dateOfDeath && (
                                                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Died: {person.dateOfDeath}
                                                            {person.placeOfDeath && (
                                                                <>
                                                                    <span className="mx-1">•</span>
                                                                    <MapPin className="w-3 h-3" />
                                                                    {person.placeOfDeath}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-gray-50">
                                <button
                                    onClick={() => {
                                        setShowLinkDialog(null);
                                        setSearchTerm("");
                                        setError(null);
                                    }}
                                    disabled={isSaving}
                                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                                >
                                    {isSaving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                            Linking...
                                        </span>
                                    ) : (
                                        "Cancel"
                                    )}
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
                                        <label className="block text-sm font-medium mb-1">Profession (optional)</label>
                                        <input
                                            type="text"
                                            value={formData.profession}
                                            onChange={(e) => handleInputChange("profession", e.target.value)}
                                            placeholder="e.g., Doctor, Teacher, Engineer"
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
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div onClick={(e) => e.stopPropagation()}>
                {/* Photo Viewer Modal */}
                {selectedPhoto && (
                    <div
                        className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
                        onClick={closePhotoViewer}
                    >
                        <div
                            className="relative max-w-6xl max-h-[95vh] w-full flex items-center"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {/* Close Button */}
                            <button
                                onClick={closePhotoViewer}
                                className="absolute -top-14 right-0 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 backdrop-blur-sm z-10"
                                title="Close (Esc)"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Photo Counter */}
                            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm font-medium">
                                {selectedPhotoIndex + 1} / {photos.length}
                            </div>

                            {/* Photo Container */}
                            <div className="flex-1 flex flex-col items-center touch-none select-none relative">
                                <div className="relative">
                                    <img
                                        key={selectedPhoto.id}
                                        src={selectedPhoto.url}
                                        alt={selectedPhoto.caption || "Photo"}
                                        className="max-w-full max-h-[75vh] rounded-lg shadow-2xl object-contain pointer-events-none photo-viewer-image"
                                    />

                                    {/* Previous Button - positioned on left side of photo */}
                                    {selectedPhotoIndex > 0 && (
                                        <button
                                            onClick={goToPreviousPhoto}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all bg-black/50 hover:bg-black/70 rounded-full p-3 backdrop-blur-sm group z-10 opacity-0 hover:opacity-100 focus:opacity-100"
                                            title="Previous (← or swipe right)"
                                        >
                                            <ChevronLeft className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                        </button>
                                    )}

                                    {/* Next Button - positioned on right side of photo */}
                                    {selectedPhotoIndex < photos.length - 1 && (
                                        <button
                                            onClick={goToNextPhoto}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all bg-black/50 hover:bg-black/70 rounded-full p-3 backdrop-blur-sm group z-10 opacity-0 hover:opacity-100 focus:opacity-100"
                                            title="Next (→ or swipe left)"
                                        >
                                            <ChevronRight className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                        </button>
                                    )}

                                    {/* Mobile Swipe Hint - shows only on first photo */}
                                    {selectedPhotoIndex === 0 && photos.length > 1 && (
                                        <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none animate-pulse">
                                            👈 Swipe to navigate 👉
                                        </div>
                                    )}
                                </div>

                                {/* Photo Info */}
                                {(selectedPhoto.caption ||
                                    selectedPhoto.dateTaken ||
                                    selectedPhoto.location ||
                                    selectedPhoto.comments) && (
                                    <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 text-white max-w-2xl w-full">
                                        {selectedPhoto.caption && (
                                            <p className="text-lg font-semibold mb-2">{selectedPhoto.caption}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                                            {selectedPhoto.dateTaken && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {selectedPhoto.dateTaken}
                                                </span>
                                            )}
                                            {selectedPhoto.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {selectedPhoto.location}
                                                </span>
                                            )}
                                        </div>
                                        {selectedPhoto.comments && (
                                            <p className="mt-2 text-sm text-gray-200">{selectedPhoto.comments}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showRelationDialog ? (
                    <Card className="w-[420px] bg-white shadow-2xl border-2">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Create Couple Node
                            </CardTitle>
                            <CardDescription>Choose the relationship type</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <p className="text-sm text-gray-600">
                                How should this person be connected to the new couple node?
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleCreateCouple("partner")}
                                    disabled={isSaving}
                                    className="w-full px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                                >
                                    <div className="font-semibold flex items-center gap-2">💑 As Partner/Lover</div>
                                    <div className="text-sm opacity-90 mt-1">
                                        Create a couple node where this person is one of the partners
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleCreateCouple("child")}
                                    disabled={isSaving}
                                    className="w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                                >
                                    <div className="font-semibold flex items-center gap-2">👨‍👩‍👦 As Child</div>
                                    <div className="text-sm opacity-90 mt-1">
                                        Create a couple node where this person is a child of that couple
                                    </div>
                                </button>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <button
                                onClick={() => setShowRelationDialog(false)}
                                disabled={isSaving}
                                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                            >
                                {isSaving ? "Creating..." : "Cancel"}
                            </button>
                        </CardFooter>
                    </Card>
                ) : showPhotos ? (
                    <Card className="w-[600px] max-h-[80vh] bg-white shadow-2xl border-2 flex flex-col">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        Photos of {node.firstName} {node.lastName}
                                    </CardTitle>
                                    <CardDescription>
                                        {photos.length} photo{photos.length !== 1 ? "s" : ""}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="photo-upload"
                                        className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload Photo
                                    </label>
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        disabled={uploadingPhoto}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => setShowPhotos(false)}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4">
                            {uploadError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <span className="text-red-600">⚠️</span>
                                    <span>{uploadError}</span>
                                </div>
                            )}
                            {uploadingPhoto && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Uploading photo...</span>
                                </div>
                            )}
                            {loadingPhotos ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : photos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                    <ImageIcon className="w-12 h-12 mb-2" />
                                    <p>No photos tagged with this person yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {photos.map((photo, index) => (
                                        <div
                                            key={photo.id}
                                            onClick={() => {
                                                setSelectedPhoto(photo);
                                                setSelectedPhotoIndex(index);
                                            }}
                                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all"
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.caption || "Photo"}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2">
                                                {photo.caption && (
                                                    <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                                                        {photo.caption}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Photo number indicator */}
                                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                                                {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t bg-gray-50">
                            <button
                                onClick={() => setShowPhotos(false)}
                                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Back to Profile
                            </button>
                        </CardFooter>
                    </Card>
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

                            {uploadError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <span className="text-red-600">⚠️</span>
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            {uploadingPhoto && (
                                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Uploading photo...</span>
                                </div>
                            )}

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                            placeholder="YYYY or YYYY-MM-DD"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter year only (e.g., 1990) or full date (e.g., 1990-05-15)
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                            Place of Birth <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.placeOfBirth}
                                            onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                            Profession <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.profession}
                                            onChange={(e) => handleInputChange("profession", e.target.value)}
                                            placeholder="e.g., Doctor, Teacher, Engineer"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                            Date of Death <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.dateOfDeath}
                                            onChange={(e) => handleInputChange("dateOfDeath", e.target.value)}
                                            placeholder="YYYY or YYYY-MM-DD"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter year only (e.g., 2020) or full date (e.g., 2020-12-31)
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                            Place of Death <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.placeOfDeath}
                                            onChange={(e) => handleInputChange("placeOfDeath", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-gray-700">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) =>
                                                handleInputChange("gender", e.target.value as "male" | "female")
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Born
                                                </div>
                                                <p className="text-base font-semibold">
                                                    {node.dateOfBirth || "Not specified"}
                                                </p>
                                                {node.placeOfBirth && (
                                                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {node.placeOfBirth}
                                                    </p>
                                                )}
                                            </div>
                                            {node.dateOfDeath && (
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                                        <Calendar className="w-4 h-4" />
                                                        Died
                                                    </div>
                                                    <p className="text-base font-semibold">{node.dateOfDeath}</p>
                                                    {node.placeOfDeath && (
                                                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {node.placeOfDeath}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Gender</span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                node.gender === "male"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-pink-100 text-pink-700"
                                            }`}
                                        >
                                            {node.gender === "male" ? "👨 Male" : "👩 Female"}
                                        </span>
                                    </div>

                                    {node.profession && (
                                        <div className="flex items-center justify-between py-2 px-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                                            <span className="text-sm font-medium text-gray-700">Profession</span>
                                            <span className="text-sm font-semibold text-purple-700">
                                                💼 {node.profession}
                                            </span>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {node.photoCount !== undefined && node.photoCount > 0 ? (
                                            <>
                                                <button
                                                    onClick={() => setShowPhotos(true)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                    View {node.photoCount} Photo{node.photoCount !== 1 ? "s" : ""}
                                                </button>
                                                <label
                                                    htmlFor="profile-photo-upload"
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium cursor-pointer"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Add More Photos
                                                </label>
                                            </>
                                        ) : (
                                            <label
                                                htmlFor="profile-photo-upload"
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium cursor-pointer"
                                            >
                                                <Upload className="w-5 h-5" />
                                                Upload First Photo
                                            </label>
                                        )}
                                        <input
                                            id="profile-photo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            disabled={uploadingPhoto}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
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
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setShowRelationDialog(true)}
                                        disabled={isDeleting}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Relation
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-red-400 disabled:to-rose-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
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
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
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
