import { NextRequest, NextResponse } from "next/server";
import { uploadPhotoToB2 } from "@/lib/b2";
import { createPhoto, linkPhotoToPerson, getAllPhotos } from "@/lib/neo4j";

export async function POST(request: NextRequest) {
    try {
        console.log("=== Photo Upload Request ===");
        console.log("ENV Check:", {
            hasKeyId: !!process.env.B2_KEY_ID,
            hasAppKey: !!process.env.B2_APPLICATION_KEY,
            hasBucketName: !!process.env.B2_BUCKET_NAME,
            region: process.env.B2_REGION,
        });

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const personIds = formData.get("personIds") as string; // Comma-separated IDs
        const caption = formData.get("caption") as string;
        const location = formData.get("location") as string;
        const dateTaken = formData.get("dateTaken") as string;
        const comments = formData.get("comments") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log("File to upload:", { name: file.name, type: file.type, size: file.size });

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to B2
        console.log("Starting B2 upload...");
        const photoUrl = await uploadPhotoToB2(buffer, file.name, file.type);
        console.log("B2 upload successful:", photoUrl);

        // Create photo node in Neo4j
        const photo = await createPhoto({
            url: photoUrl,
            caption: caption || undefined,
            location: location || undefined,
            dateTaken: dateTaken || undefined,
            comments: comments || undefined,
        });

        // Link photo to people
        if (personIds) {
            const ids = personIds
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);
            for (const personId of ids) {
                await linkPhotoToPerson(photo.id, personId);
            }
        }

        return NextResponse.json({
            success: true,
            photo: {
                id: photo.id,
                url: photo.url,
            },
        });
    } catch (error) {
        console.error("Error uploading photo:", error);
        return NextResponse.json(
            { error: "Failed to upload photo", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const photos = await getAllPhotos();
        return NextResponse.json({ photos });
    } catch (error) {
        console.error("Error fetching photos:", error);
        return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { photoId, caption, location, dateTaken, comments, personIds } = body;

        if (!photoId) {
            return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
        }

        const { updatePhoto, linkPhotoToPerson, getSession } = await import("@/lib/neo4j");

        // Update photo metadata
        await updatePhoto(photoId, {
            caption: caption || "",
            location: location || "",
            dateTaken: dateTaken || "",
            comments: comments || "",
        });

        // Update person tags - remove all existing tags and add new ones
        const session = getSession();
        try {
            // Remove all existing APPEARS_IN relationships
            await session.run(
                `MATCH (person:Person)-[r:APPEARS_IN]->(photo:Photo {id: $photoId})
                 DELETE r`,
                { photoId }
            );

            // Add new relationships
            if (personIds && Array.isArray(personIds)) {
                for (const personId of personIds) {
                    if (personId) {
                        await linkPhotoToPerson(photoId, personId);
                    }
                }
            }
        } finally {
            await session.close();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating photo:", error);
        return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const photoId = searchParams.get("id");

        if (!photoId) {
            return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
        }

        // Import deletePhoto function
        const { deletePhoto } = await import("@/lib/neo4j");

        // Delete from Neo4j (B2 deletion would require storing fileId, skip for now)
        await deletePhoto(photoId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting photo:", error);
        return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
    }
}
