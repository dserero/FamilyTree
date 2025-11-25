"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

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
    photo: Photo | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (photoId: string, updates: PhotoUpdates) => Promise<void>;
    allPeople: Person[];
}

export interface PhotoUpdates {
    caption: string;
    location: string;
    dateTaken: string;
    comments: string;
    personIds: string[];
}

export default function PhotoEditDialog({ photo, isOpen, onClose, onSave, allPeople }: Props) {
    const [caption, setCaption] = useState("");
    const [location, setLocation] = useState("");
    const [dateTaken, setDateTaken] = useState("");
    const [comments, setComments] = useState("");
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter people based on search query
    const filteredPeople = allPeople.filter((person) => person.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Initialize form when photo changes
    useEffect(() => {
        if (photo) {
            setCaption(photo.caption || "");
            setLocation(photo.location || "");
            setDateTaken(photo.dateTaken || "");
            setComments(photo.comments || "");
            setSelectedPeople(photo.people.map((p) => p.id));
        }
    }, [photo]);

    const handleSave = async () => {
        if (!photo) return;

        setSaving(true);
        try {
            await onSave(photo.id, {
                caption,
                location,
                dateTaken,
                comments,
                personIds: selectedPeople,
            });
            onClose();
        } catch (error) {
            console.error("Failed to save photo updates:", error);
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const togglePerson = (personId: string) => {
        setSelectedPeople((prev) =>
            prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
        );
    };

    if (!photo) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                        Edit Photo 2
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Photo Preview */}
                    <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden bg-gray-100">
                            <img
                                src={photo.url}
                                alt={photo.caption || "Family photo"}
                                className="w-full h-auto object-contain max-h-[400px]"
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Uploaded: {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-4">
                        {/* Caption */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Caption</label>
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Where was this taken?"
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Date Taken */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Date Taken</label>
                            <input
                                type="date"
                                value={dateTaken}
                                onChange={(e) => setDateTaken(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Comments */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">💬 Comments</label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Add any notes or memories..."
                                rows={3}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* People Tagger */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                👥 Tag People ({selectedPeople.length})
                            </label>
                            <Card className="border-2 border-gray-200">
                                <CardContent className="p-4 space-y-3">
                                    {/* Search Bar */}
                                    {allPeople.length > 0 && (
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                🔍
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search people..."
                                                className="w-full pl-9 pr-9 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none transition-colors"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* People List */}
                                    <div className="max-h-[160px] overflow-y-auto space-y-2">
                                        {allPeople.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No people available to tag
                                            </p>
                                        ) : filteredPeople.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-gray-500">
                                                    No people found matching "{searchQuery}"
                                                </p>
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="mt-2 text-pink-600 hover:text-pink-700 text-xs font-medium"
                                                >
                                                    Clear search
                                                </button>
                                            </div>
                                        ) : (
                                            filteredPeople.map((person) => (
                                                <label
                                                    key={person.id}
                                                    className="flex items-center gap-3 p-2 hover:bg-pink-50 rounded-lg cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPeople.includes(person.id)}
                                                        onChange={() => togglePerson(person.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-gray-700">{person.name}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all disabled:opacity-50 font-semibold shadow-lg"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
