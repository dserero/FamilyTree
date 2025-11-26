"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Edit2, Trash2 } from "lucide-react";
import PhotoEditDialog, { PhotoUpdates } from "../Photos/PhotoEditDialog";

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

interface Person {
    id: string;
    name: string;
}

interface PhotoGalleryViewProps {
    firstName: string;
    lastName: string;
    photos: Photo[];
    loadingPhotos: boolean;
    uploadingPhoto: boolean;
    uploadError: string | null;
    onPhotoClick: (photo: Photo, index: number) => void;
    onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onPhotoUpdate?: (photoId: string, updates: PhotoUpdates) => Promise<void>;
    onPhotoDelete?: (photoId: string) => Promise<void>;
    allPeople?: Person[];
    onClose: () => void;
}

export function PhotoGalleryView({
    firstName,
    lastName,
    photos,
    loadingPhotos,
    uploadingPhoto,
    uploadError,
    onPhotoClick,
    onPhotoUpload,
    onPhotoUpdate,
    onPhotoDelete,
    allPeople = [],
    onClose,
}: PhotoGalleryViewProps) {
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleEditPhoto = async (photoId: string, updates: PhotoUpdates) => {
        if (onPhotoUpdate) {
            try {
                await onPhotoUpdate(photoId, updates);
                // Dialog will close via onClose callback after successful save
            } catch (error) {
                // Error handling is done in the parent component
                console.error("Failed to update photo:", error);
            }
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (onPhotoDelete) {
            try {
                await onPhotoDelete(photoId);
            } catch (e) {
                console.error(e);
                alert("Failed to delete photo");
            }
        }
    };

    return (
        <>
            <Card className="w-full max-w-[600px] max-h-[80vh] bg-white shadow-2xl border-2 flex flex-col">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Photos of {firstName} {lastName}
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
                                onChange={onPhotoUpload}
                                disabled={uploadingPhoto}
                                className="hidden"
                            />
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {photos.map((photo, index) => (
                                <div
                                    key={photo.id}
                                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all p-1"
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.caption || "Photo"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
                                        onClick={() => onPhotoClick(photo, index)}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2 pointer-events-none rounded-lg">
                                        {photo.caption && (
                                            <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                                                {photo.caption}
                                            </p>
                                        )}
                                    </div>
                                    {onPhotoUpdate && onPhotoDelete && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingPhoto(photo);
                                                    setIsEditDialogOpen(true);
                                                }}
                                                className="bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-colors shadow-md"
                                                title="Edit photo"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Delete this photo?")) {
                                                        await handleDeletePhoto(photo.id);
                                                    }
                                                }}
                                                className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
                                                title="Delete photo"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="border-t bg-gray-50 px-2 py-3">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Back to Profile
                    </button>
                </CardFooter>
            </Card>

            {/* Edit Photo Dialog */}
            {editingPhoto && (
                <PhotoEditDialog
                    photo={{
                        ...editingPhoto,
                        people: editingPhoto.people || [],
                    }}
                    isOpen={isEditDialogOpen}
                    onClose={() => {
                        setIsEditDialogOpen(false);
                        setEditingPhoto(null);
                    }}
                    onSave={handleEditPhoto}
                    allPeople={allPeople}
                />
            )}
        </>
    );
}
