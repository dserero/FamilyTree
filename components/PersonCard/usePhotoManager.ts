"use client";

import { useState, useEffect } from "react";
import { PersonNode } from "@/types/graph";

interface Photo {
    id: string;
    url: string;
    caption?: string;
    location?: string;
    dateTaken?: string;
    comments?: string;
    uploadedAt: string;
    people?: Array<{ id: string; name: string }>;
}

export interface PhotoUpdates {
    caption: string;
    location: string;
    dateTaken: string;
    comments: string;
    personIds: string[];
}

export function usePhotoManager(node: PersonNode | null, onUpdate: (updatedNode: PersonNode) => void) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fetchPhotos = async () => {
        if (!node || node.nodeType !== "person") return;

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
            throw err;
        } finally {
            setLoadingPhotos(false);
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!node || node.nodeType !== "person") return;

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
            formData.append("personIds", node.id);

            console.log("Uploading photo for person:", node.id);

            const response = await fetch("/api/photos", {
                method: "POST",
                body: formData,
            });

            console.log("Upload response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Upload error:", errorData);
                throw new Error(errorData.error || "Failed to upload photo");
            }

            const responseData = await response.json();
            console.log("Upload successful:", responseData);

            // Refresh photos list
            await fetchPhotos();

            // Update photo count in the node locally
            const updatedNode: PersonNode = {
                ...node,
                photoCount: (node.photoCount || 0) + 1,
            };
            onUpdate(updatedNode);

            // Reset file input
            event.target.value = "";
        } catch (err) {
            console.error("Error uploading photo:", err);
            setUploadError(err instanceof Error ? err.message : "Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const goToNextPhoto = () => {
        if (selectedPhotoIndex < photos.length - 1) {
            const nextIndex = selectedPhotoIndex + 1;
            setSelectedPhotoIndex(nextIndex);
            setSelectedPhoto(photos[nextIndex]);
        }
    };

    const goToPreviousPhoto = () => {
        if (selectedPhotoIndex > 0) {
            const prevIndex = selectedPhotoIndex - 1;
            setSelectedPhotoIndex(prevIndex);
            setSelectedPhoto(photos[prevIndex]);
        }
    };

    const closePhotoViewer = () => {
        setSelectedPhoto(null);
        setSelectedPhotoIndex(-1);
    };

    const selectPhoto = (photo: Photo, index: number) => {
        setSelectedPhoto(photo);
        setSelectedPhotoIndex(index);
    };

    const updatePhoto = async (photoId: string, updates: PhotoUpdates) => {
        try {
            const response = await fetch("/api/photos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photoId,
                    ...updates,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update photo");
            }

            // Refresh the photo list
            await fetchPhotos();

            // If the currently selected photo was updated, refresh it
            if (selectedPhoto && selectedPhoto.id === photoId) {
                const updatedPhoto = photos.find((p) => p.id === photoId);
                if (updatedPhoto) {
                    setSelectedPhoto(updatedPhoto);
                }
            }
        } catch (err) {
            console.error("Error updating photo:", err);
            throw err;
        }
    };

    const deletePhoto = async (photoId: string) => {
        if (!node || node.nodeType !== "person") return;

        try {
            const response = await fetch(`/api/photos?photoId=${photoId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete photo");
            }

            // Refresh the photo list
            await fetchPhotos();

            // Update photo count in the node
            const updatedNode: PersonNode = {
                ...node,
                photoCount: Math.max(0, (node.photoCount || 0) - 1),
            };
            onUpdate(updatedNode);

            // If the deleted photo was currently being viewed, close the viewer
            if (selectedPhoto && selectedPhoto.id === photoId) {
                closePhotoViewer();
            }
        } catch (err) {
            console.error("Error deleting photo:", err);
            throw err;
        }
    };

    return {
        photos,
        loadingPhotos,
        selectedPhoto,
        selectedPhotoIndex,
        uploadingPhoto,
        uploadError,
        fetchPhotos,
        handlePhotoUpload,
        goToNextPhoto,
        goToPreviousPhoto,
        closePhotoViewer,
        selectPhoto,
        updatePhoto,
        deletePhoto,
    };
}
