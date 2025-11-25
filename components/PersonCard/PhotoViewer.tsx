"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Calendar, MapPin, Edit2, Trash2, Users } from "lucide-react";

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

interface PhotoViewerProps {
    photo: Photo;
    photoIndex: number;
    totalPhotos: number;
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
}

export function PhotoViewer({
    photo,
    photoIndex,
    totalPhotos,
    onClose,
    onNext,
    onPrevious,
    onEdit,
    onDelete,
    showActions = false,
}: PhotoViewerProps) {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                onPrevious();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                onNext();
            } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, onNext, onPrevious]);

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
            onNext();
        } else if (isRightSwipe) {
            onPrevious();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="relative max-w-6xl max-h-[95vh] w-full flex items-center"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Top Bar */}
                <div className="absolute -top-14 left-0 right-0 flex items-center justify-between z-10">
                    {/* Photo Counter */}
                    <div className="text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm font-medium">
                        {photoIndex + 1} / {totalPhotos}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {showActions && (
                            <>
                                {onEdit && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit();
                                        }}
                                        className="text-white hover:text-blue-300 transition-colors bg-black/50 hover:bg-blue-600 rounded-full p-2 backdrop-blur-sm"
                                        title="Edit photo"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this photo?")) {
                                                onDelete();
                                            }
                                        }}
                                        className="text-white hover:text-red-300 transition-colors bg-black/50 hover:bg-red-600 rounded-full p-2 backdrop-blur-sm"
                                        title="Delete photo"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 backdrop-blur-sm"
                            title="Close (Esc)"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Photo Container */}
                <div className="flex-1 flex flex-col items-center touch-none select-none relative">
                    <div className="relative">
                        <img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.caption || "Photo"}
                            className="max-w-full max-h-[75vh] rounded-lg shadow-2xl object-contain pointer-events-none"
                        />

                        {/* Previous Button */}
                        {photoIndex > 0 && (
                            <button
                                onClick={onPrevious}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all bg-black/50 hover:bg-black/70 rounded-full p-3 backdrop-blur-sm group z-10 opacity-0 hover:opacity-100 focus:opacity-100"
                                title="Previous (← or swipe right)"
                            >
                                <ChevronLeft className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            </button>
                        )}

                        {/* Next Button */}
                        {photoIndex < totalPhotos - 1 && (
                            <button
                                onClick={onNext}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all bg-black/50 hover:bg-black/70 rounded-full p-3 backdrop-blur-sm group z-10 opacity-0 hover:opacity-100 focus:opacity-100"
                                title="Next (→ or swipe left)"
                            >
                                <ChevronRight className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            </button>
                        )}

                        {/* Mobile Swipe Hint */}
                        {photoIndex === 0 && totalPhotos > 1 && (
                            <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none animate-pulse">
                                👈 Swipe to navigate 👉
                            </div>
                        )}
                    </div>

                    {/* Photo Info */}
                    {(photo.caption ||
                        photo.dateTaken ||
                        photo.location ||
                        photo.comments ||
                        (photo.people && photo.people.length > 0)) && (
                        <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-5 text-white max-w-3xl w-full space-y-3">
                            {photo.caption && <p className="text-xl font-semibold">{photo.caption}</p>}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-200">
                                {photo.dateTaken && (
                                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                        <Calendar className="w-4 h-4" />
                                        {photo.dateTaken}
                                    </span>
                                )}
                                {photo.location && (
                                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                        <MapPin className="w-4 h-4" />
                                        {photo.location}
                                    </span>
                                )}
                            </div>
                            {photo.people && photo.people.length > 0 && (
                                <div className="flex items-start gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                    <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-semibold text-sm">People: </span>
                                        <span className="text-sm">{photo.people.map((p) => p.name).join(", ")}</span>
                                    </div>
                                </div>
                            )}
                            {photo.comments && (
                                <p className="text-sm text-gray-200 italic bg-white/10 p-3 rounded-lg">
                                    "{photo.comments}"
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
