import { NextResponse } from "next/server";
import { flipEdgeRelationship } from "@/lib/neo4j";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { personId, coupleId } = body;

        if (!personId || !coupleId) {
            return NextResponse.json({ error: "personId and coupleId are required" }, { status: 400 });
        }

        await flipEdgeRelationship(personId, coupleId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error flipping edge relationship:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to flip edge relationship" },
            { status: 500 }
        );
    }
}
