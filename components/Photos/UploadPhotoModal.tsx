"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UploadForm from "./UploadForm";
import PeopleTagger from "./PeopleTagger";

interface Person {
    id: string;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    people: Person[];
    selectedFiles: File[];
    previewUrls: string[];
    selectedPeople: string[];
    caption: string;
    location: string;
    dateTaken: string;
    comments: string;
    uploading: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    onPersonToggle: (id: string) => void;
    onChangeCaption: (value: string) => void;
    onChangeLocation: (value: string) => void;
    onChangeDateTaken: (value: string) => void;
    onChangeComments: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function UploadPhotoModal({
    isOpen,
    onClose,
    people,
    selectedFiles,
    previewUrls,
    selectedPeople,
    caption,
    location,
    dateTaken,
    comments,
    uploading,
    onFileChange,
    onRemoveFile,
    onPersonToggle,
    onChangeCaption,
    onChangeLocation,
    onChangeDateTaken,
    onChangeComments,
    onSubmit,
}: Props) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                        Upload Photos
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    <UploadForm
                        selectedFiles={selectedFiles}
                        previewUrls={previewUrls}
                        caption={caption}
                        location={location}
                        dateTaken={dateTaken}
                        comments={comments}
                        uploading={uploading}
                        onFileChange={onFileChange}
                        onRemoveFile={onRemoveFile}
                        onChangeCaption={onChangeCaption}
                        onChangeLocation={onChangeLocation}
                        onChangeDateTaken={onChangeDateTaken}
                        onChangeComments={onChangeComments}
                        onSubmit={onSubmit}
                    />

                    <PeopleTagger people={people} selectedPeople={selectedPeople} onToggle={onPersonToggle} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
