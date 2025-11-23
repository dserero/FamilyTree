import { NextRequest, NextResponse } from "next/server";
import { getPhotosForPerson } from "@/lib/neo4j";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const personId = params.id;
        const photos = await getPhotosForPerson(personId);
        return NextResponse.json({ photos });
    } catch (error) {
        console.error("Error fetching photos for person:", error);
        return NextResponse.json(
            { error: "Failed to fetch photos", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
