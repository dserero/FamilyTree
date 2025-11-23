"use client";

import { useState, useEffect, FormEvent } from "react";
import UploadPhotoModal from "@/components/Photos/UploadPhotoModal";
import PhotoGallery from "@/components/Photos/PhotoGallery";

interface Person {
    id: string;
    name: string;
}

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

export default function PhotosPage() {
    const [people, setPeople] = useState<Person[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Form state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [caption, setCaption] = useState("");
    const [location, setLocation] = useState("");
    const [dateTaken, setDateTaken] = useState("");
    const [comments, setComments] = useState("");

    // Load people and photos from API
    useEffect(() => {
        const fetchPeople = async () => {
            try {
                const response = await fetch("/api/family-tree");
                const data = await response.json();
                const personNodes = data.nodes
                    .filter((node: any) => node.nodeType === "person")
                    .map((node: any) => ({ id: node.id, name: node.name }))
                    .sort((a: Person, b: Person) => a.name.localeCompare(b.name));
                setPeople(personNodes);
            } catch (error) {
                console.error("Error fetching people:", error);
            }
        };

        fetchPeople();
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/photos");
            const data = await response.json();
            setPhotos(data.photos || []);
        } catch (error) {
            console.error("Error fetching photos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const filesArray = Array.from(files);
            setSelectedFiles(filesArray);

            // Create previews for all files
            const previewPromises = filesArray.map((file) => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(previewPromises).then((urls) => {
                setPreviewUrls(urls);
            });
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePersonToggle = (personId: string) => {
        setSelectedPeople((prev) =>
            prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            alert("Please select at least one file to upload");
            return;
        }

        setUploading(true);

        try {
            // Upload files one by one
            let successCount = 0;
            let failCount = 0;

            for (const file of selectedFiles) {
                try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("personIds", selectedPeople.join(","));
                    formData.append("caption", caption);
                    formData.append("location", location);
                    formData.append("dateTaken", dateTaken);
                    formData.append("comments", comments);

                    const response = await fetch("/api/photos", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        console.error("Server error:", error);
                        throw new Error(error.details || error.error || "Upload failed");
                    }

                    successCount++;
                } catch (error) {
                    console.error(`Error uploading ${file.name}:`, error);
                    failCount++;
                }
            }

            // Reset form
            setSelectedFiles([]);
            setPreviewUrls([]);
            setSelectedPeople([]);
            setCaption("");
            setLocation("");
            setDateTaken("");
            setComments("");

            // Refresh photos
            await fetchPhotos();

            // Close modal and show result
            setIsUploadModalOpen(false);

            if (failCount === 0) {
                alert(`${successCount} ${successCount === 1 ? "photo" : "photos"} uploaded successfully!`);
            } else {
                alert(
                    `${successCount} ${
                        successCount === 1 ? "photo" : "photos"
                    } uploaded successfully. ${failCount} failed.`
                );
            }
        } catch (error) {
            console.error("Error uploading photos:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            alert(`Failed to upload photos: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-block mb-4">
                        <span className="text-5xl sm:text-6xl animate-bounce-slow">📸</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 bg-clip-text text-transparent mb-4 leading-tight">
                        Family Photo Gallery
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Preserve your family memories. Upload and tag photos to build your visual family story.
                    </p>
                </div>

                {/* Photo Gallery */}
                <PhotoGallery
                    photos={photos}
                    loading={loading}
                    onDelete={async (id) => {
                        const resp = await fetch(`/api/photos?id=${id}`, { method: "DELETE" });
                        if (resp.ok) await fetchPhotos();
                    }}
                    allPeople={people}
                    onUpdate={fetchPhotos}
                />

                {/* Floating Add Button */}
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full shadow-2xl hover:shadow-pink-500/50 hover:scale-110 transition-all duration-200 flex items-center justify-center text-3xl z-50 group"
                    title="Upload photos"
                >
                    <span className="group-hover:rotate-90 transition-transform duration-200">+</span>
                </button>

                {/* Upload Modal */}
                <UploadPhotoModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    people={people}
                    selectedFiles={selectedFiles}
                    previewUrls={previewUrls}
                    selectedPeople={selectedPeople}
                    caption={caption}
                    location={location}
                    dateTaken={dateTaken}
                    comments={comments}
                    uploading={uploading}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                    onPersonToggle={handlePersonToggle}
                    onChangeCaption={setCaption}
                    onChangeLocation={setLocation}
                    onChangeDateTaken={setDateTaken}
                    onChangeComments={setComments}
                    onSubmit={handleSubmit}
                />
            </div>
        </main>
    );
}
