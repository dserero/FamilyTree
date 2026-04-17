import { NextResponse } from "next/server";
import { createFullPersonNode } from "@/lib/neo4j";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, dateOfBirth, gender, placeOfBirth, profession, notes } = body;

        if (!firstName || !lastName || !dateOfBirth || !gender) {
            return NextResponse.json(
                { error: "firstName, lastName, dateOfBirth, and gender are required" },
                { status: 400 },
            );
        }

        if (gender !== "male" && gender !== "female") {
            return NextResponse.json({ error: "gender must be 'male' or 'female'" }, { status: 400 });
        }

        const person = await createFullPersonNode({
            firstName,
            lastName,
            dateOfBirth,
            gender,
            placeOfBirth: placeOfBirth || undefined,
            profession: profession || undefined,
            notes: notes || undefined,
        });

        return NextResponse.json({ success: true, personId: person.id, name: person.name });
    } catch (error) {
        console.error("Error creating person:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create person" },
            { status: 500 },
        );
    }
}
