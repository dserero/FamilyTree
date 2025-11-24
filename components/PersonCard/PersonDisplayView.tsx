"use client";

import { PersonNode } from "@/types/graph";
import { Calendar, MapPin, Upload, Image as ImageIcon } from "lucide-react";

interface PersonDisplayViewProps {
    node: PersonNode;
    onShowPhotos: () => void;
    onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploadingPhoto: boolean;
}

export function PersonDisplayView({ node, onShowPhotos, onPhotoUpload, uploadingPhoto }: PersonDisplayViewProps) {
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                            <Calendar className="w-4 h-4" />
                            Born
                        </div>
                        <p className="text-base font-semibold">{node.dateOfBirth || "Not specified"}</p>
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
                        node.gender === "male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                    }`}
                >
                    {node.gender === "male" ? "👨 Male" : "👩 Female"}
                </span>
            </div>

            {node.profession && (
                <div className="flex items-center justify-between py-2 px-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <span className="text-sm font-medium text-gray-700">Profession</span>
                    <span className="text-sm font-semibold text-purple-700">💼 {node.profession}</span>
                </div>
            )}

            <div className="space-y-2">
                {node.photoCount !== undefined && node.photoCount > 0 ? (
                    <>
                        <button
                            onClick={onShowPhotos}
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
                    onChange={onPhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                />
            </div>
        </div>
    );
}
