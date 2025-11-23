import { NextResponse } from "next/server";
import { linkPartnerToCouple, linkChildToCouple } from "@/lib/neo4j";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { personId, coupleId, role } = body;

        if (!personId || !coupleId || !role) {
            return NextResponse.json({ error: "personId, coupleId, and role are required" }, { status: 400 });
        }

        if (role === "partner") {
            await linkPartnerToCouple(personId, coupleId);
        } else if (role === "child") {
            await linkChildToCouple(personId, coupleId);
        } else {
            return NextResponse.json({ error: "Invalid role. Must be 'partner' or 'child'" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error linking person to couple:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to link person to couple" },
            { status: 500 }
        );
    }
}
