import { NextResponse } from "next/server";
import { createCoupleAsPartner, createCoupleAsParents } from "@/lib/neo4j";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { personId, role } = body;

        if (!personId || !role) {
            return NextResponse.json({ error: "personId and role are required" }, { status: 400 });
        }

        let newCouple;
        if (role === "partner") {
            // Person becomes a partner in the new couple
            newCouple = await createCoupleAsPartner(personId);
        } else if (role === "child") {
            // Person becomes a child of the new couple
            newCouple = await createCoupleAsParents(personId);
        } else {
            return NextResponse.json({ error: "Invalid role. Must be 'partner' or 'child'" }, { status: 400 });
        }

        return NextResponse.json(newCouple);
    } catch (error) {
        console.error("Error creating couple:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create couple" },
            { status: 500 }
        );
    }
}
