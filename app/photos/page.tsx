"use client";

import { useState, useEffect, FormEvent } from "react";
// Note: layout uses componentized UploadForm, PeopleTagger and PhotoGallery
import UploadForm from "@/components/Photos/UploadForm";
import PeopleTagger from "@/components/Photos/PeopleTagger";
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

    // Form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
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
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePersonToggle = (personId: string) => {
        setSelectedPeople((prev) =>
            prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            alert("Please select a file to upload");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
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

            // Reset form
            setSelectedFile(null);
            setPreviewUrl("");
            setSelectedPeople([]);
            setCaption("");
            setLocation("");
            setDateTaken("");
            setComments("");

            // Refresh photos
            await fetchPhotos();

            alert("Photo uploaded successfully!");
        } catch (error) {
            console.error("Error uploading photo:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            alert(`Failed to upload photo: ${errorMessage}`);
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-slide-up">
                    <UploadForm
                        selectedFile={selectedFile}
                        previewUrl={previewUrl}
                        caption={caption}
                        location={location}
                        dateTaken={dateTaken}
                        comments={comments}
                        uploading={uploading}
                        onFileChange={handleFileChange}
                        onChangeCaption={setCaption}
                        onChangeLocation={setLocation}
                        onChangeDateTaken={setDateTaken}
                        onChangeComments={setComments}
                        onSubmit={handleSubmit}
                    />

                    <PeopleTagger people={people} selectedPeople={selectedPeople} onToggle={handlePersonToggle} />
                </div>
                <PhotoGallery
                    photos={photos}
                    loading={loading}
                    onDelete={async (id) => {
                        const resp = await fetch(`/api/photos?id=${id}`, { method: "DELETE" });
                        if (resp.ok) await fetchPhotos();
                    }}
                />
            </div>
        </main>
    );
}
