import { NextResponse } from "next/server";
import { linkPartnerToCouple, linkChildToCouple, createFullPersonNode } from "@/lib/neo4j";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { personId, coupleId, role, personData } = body;

        if (!coupleId || !role) {
            return NextResponse.json({ error: "coupleId and role are required" }, { status: 400 });
        }

        if (role !== "partner" && role !== "child") {
            return NextResponse.json({ error: "Invalid role. Must be 'partner' or 'child'" }, { status: 400 });
        }

        let finalPersonId = personId;

        // If no personId provided, create a new person with default values
        if (!finalPersonId) {
            // Create new person with minimal default data
            const newPerson = await createFullPersonNode({
                firstName: personData?.firstName || "New",
                lastName: personData?.lastName || "Person",
                dateOfBirth: personData?.dateOfBirth || new Date().toISOString().split("T")[0],
                gender: personData?.gender || "male",
                dateOfDeath: personData?.dateOfDeath,
                placeOfBirth: personData?.placeOfBirth,
                placeOfDeath: personData?.placeOfDeath,
                profession: personData?.profession,
            });

            finalPersonId = newPerson.id;
        }

        // Link the person to the couple with the specified role
        if (role === "partner") {
            await linkPartnerToCouple(finalPersonId, coupleId);
        } else if (role === "child") {
            await linkChildToCouple(finalPersonId, coupleId);
        }

        return NextResponse.json({ success: true, personId: finalPersonId });
    } catch (error) {
        console.error("Error linking person to couple:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to link person to couple" },
            { status: 500 }
        );
    }
}
