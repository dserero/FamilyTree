"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image as ImageIcon } from "lucide-react";
import PhotoEditDialog, { PhotoUpdates } from "./PhotoEditDialog";

interface Photo {
    id: string;
    url: string;
    caption?: string;
    location?: string;
    dateTaken?: string;
    comments?: string;
    uploadedAt: string;
    people: Array<{ id: string; name: string }>;
}

interface Person {
    id: string;
    name: string;
}

interface Props {
    photos: Photo[];
    loading: boolean;
    onDelete: (photoId: string) => Promise<void>;
    allPeople: Person[];
    onUpdate: () => Promise<void>;
}

export default function PhotoGallery({ photos, loading, onDelete, allPeople, onUpdate }: Props) {
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleEditPhoto = async (photoId: string, updates: PhotoUpdates) => {
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
        await onUpdate();
    };
    return (
        <Card
            className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm animate-slide-up"
            style={{ animationDelay: "100ms" }}
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full" />
                    <ImageIcon className="w-6 h-6 text-orange-600" />
                    <span>Gallery</span>
                    <span className="ml-auto text-lg bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 px-4 py-1 rounded-full font-semibold">
                        {photos.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block relative">
                            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                        </div>
                        <div className="text-lg text-gray-600 mt-6 animate-pulse">Loading photos...</div>
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4 opacity-50 animate-bounce-slow">📷</div>
                        <p className="text-gray-500 text-lg font-medium mb-2">No photos uploaded yet</p>
                        <p className="text-gray-400">Upload your first photo above to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                className="group border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-pink-300 hover:shadow-xl transition-all duration-300 bg-white"
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    animation: "slideInUp 0.4s ease-out forwards",
                                }}
                            >
                                <div
                                    className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden cursor-pointer"
                                    onClick={() => {
                                        setSelectedPhoto(photo);
                                        setIsDialogOpen(true);
                                    }}
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.caption || "Family photo"}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            console.error("Image failed to load:", photo.url);
                                            e.currentTarget.src = "";
                                            e.currentTarget.style.display = "none";
                                        }}
                                        onLoad={() => console.log("Image loaded:", photo.url)}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPhoto(photo);
                                                setIsEditDialogOpen(true);
                                            }}
                                            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                                            title="Edit photo"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm("Delete this photo?")) {
                                                    try {
                                                        await onDelete(photo.id);
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Failed to delete photo");
                                                    }
                                                }
                                            }}
                                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                            title="Delete photo"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    {photo.caption && (
                                        <p className="font-semibold text-gray-800 text-lg">{photo.caption}</p>
                                    )}
                                    {photo.location && (
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <span>📍</span> {photo.location}
                                        </p>
                                    )}
                                    {photo.dateTaken && (
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <span>📅</span> {photo.dateTaken}
                                        </p>
                                    )}
                                    {photo.people.length > 0 && (
                                        <div className="text-sm pt-2 border-t border-gray-100">
                                            <span className="font-semibold text-pink-700">People: </span>
                                            <span className="text-gray-700">
                                                {photo.people.map((p) => p.name).join(", ")}
                                            </span>
                                        </div>
                                    )}
                                    {photo.comments && (
                                        <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg">
                                            "{photo.comments}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Photo Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-black/95 border-0 p-0">
                    {selectedPhoto && (
                        <div className="flex flex-col gap-4 p-6">
                            <div className="relative flex items-center justify-center">
                                <img
                                    src={selectedPhoto.url}
                                    alt={selectedPhoto.caption || "Family photo"}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                                />
                            </div>

                            {(selectedPhoto.caption ||
                                selectedPhoto.location ||
                                selectedPhoto.dateTaken ||
                                selectedPhoto.people.length > 0 ||
                                selectedPhoto.comments) && (
                                <div className="bg-white rounded-lg p-6 space-y-3">
                                    {selectedPhoto.caption && (
                                        <h3 className="font-bold text-xl text-gray-800">{selectedPhoto.caption}</h3>
                                    )}
                                    {selectedPhoto.location && (
                                        <p className="text-gray-700 flex items-center gap-2">
                                            <span>📍</span> {selectedPhoto.location}
                                        </p>
                                    )}
                                    {selectedPhoto.dateTaken && (
                                        <p className="text-gray-700 flex items-center gap-2">
                                            <span>📅</span> {selectedPhoto.dateTaken}
                                        </p>
                                    )}
                                    {selectedPhoto.people.length > 0 && (
                                        <div className="text-gray-700">
                                            <span className="font-semibold text-pink-700">People: </span>
                                            <span>{selectedPhoto.people.map((p) => p.name).join(", ")}</span>
                                        </div>
                                    )}
                                    {selectedPhoto.comments && (
                                        <p className="text-gray-700 italic bg-gray-50 p-3 rounded-lg">
                                            "{selectedPhoto.comments}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Photo Dialog */}
            <PhotoEditDialog
                photo={editingPhoto}
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setIsEditDialogOpen(false);
                    setEditingPhoto(null);
                }}
                onSave={handleEditPhoto}
                allPeople={allPeople}
            />
        </Card>
    );
}
