"use client";

import React, { FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface Props {
    selectedFiles: File[];
    previewUrls: string[];
    caption: string;
    location: string;
    dateTaken: string;
    comments: string;
    uploading: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    onChangeCaption: (v: string) => void;
    onChangeLocation: (v: string) => void;
    onChangeDateTaken: (v: string) => void;
    onChangeComments: (v: string) => void;
    onSubmit: (e: FormEvent) => void;
}

export default function UploadForm({
    selectedFiles,
    previewUrls,
    caption,
    location,
    dateTaken,
    comments,
    uploading,
    onFileChange,
    onRemoveFile,
    onChangeCaption,
    onChangeLocation,
    onChangeDateTaken,
    onChangeComments,
    onSubmit,
}: Props) {
    return (
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-orange-500 rounded-full" />
                    <Upload className="w-6 h-6 text-pink-600" />
                    Upload Photo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Photos *</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-50 file:to-orange-50 file:text-pink-700 hover:file:from-pink-100 hover:file:to-orange-100 transition-all cursor-pointer"
                            required
                        />
                        {selectedFiles.length > 0 && (
                            <p className="text-xs text-gray-600 mt-2">
                                {selectedFiles.length} {selectedFiles.length === 1 ? "photo" : "photos"} selected
                            </p>
                        )}
                    </div>

                    {previewUrls.length > 0 && (
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">Previews</label>
                            <div className="grid grid-cols-2 gap-3">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                                            <img
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveFile(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove photo"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Caption</label>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => onChangeCaption(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                            placeholder="Add a caption..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => onChangeLocation(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                            placeholder="Where was this taken?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date Taken</label>
                        <input
                            type="date"
                            value={dateTaken}
                            onChange={(e) => onChangeDateTaken(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Comments</label>
                        <textarea
                            value={comments}
                            onChange={(e) => onChangeComments(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white resize-none"
                            placeholder="Add any additional comments..."
                            rows={3}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || selectedFiles.length === 0}
                        className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white py-4 px-6 rounded-xl hover:from-pink-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98"
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Uploading...
                            </span>
                        ) : (
                            `Upload ${
                                selectedFiles.length > 0
                                    ? `${selectedFiles.length} ${selectedFiles.length === 1 ? "Photo" : "Photos"}`
                                    : "Photos"
                            }`
                        )}
                    </button>
                </form>
            </CardContent>
        </Card>
    );
}
