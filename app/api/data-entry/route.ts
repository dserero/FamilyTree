import { NextResponse } from "next/server";
import { getSession, updatePersonNode } from "@/lib/neo4j";

// Get incomplete data for people in the family tree
export async function GET(request: Request) {
    const session = getSession();

    try {
        const { searchParams } = new URL(request.url);
        const startPersonId = searchParams.get("startPersonId");

        if (!startPersonId) {
            return NextResponse.json({ error: "startPersonId is required" }, { status: 400 });
        }

        // Get all people with incomplete data, ordered by distance from the starting person
        const result = await session.run(
            `
            MATCH path = (start:Person {id: $startPersonId})-[*0..5]-(p:Person)
            WITH p, length(path) as distance
            ORDER BY distance
            RETURN DISTINCT p, distance
            `,
            { startPersonId }
        );

        const people = result.records.map((record) => {
            const person = record.get("p").properties;
            const distance = record.get("distance");

            // Check which fields are missing
            const missingFields: string[] = [];
            if (!person.firstName) missingFields.push("firstName");
            if (!person.lastName) missingFields.push("lastName");
            if (!person.dateOfBirth) missingFields.push("dateOfBirth");
            if (!person.placeOfBirth) missingFields.push("placeOfBirth");
            if (!person.gender || person.gender === "male") missingFields.push("gender"); // Assume male is default

            return {
                id: person.id,
                name: person.name || "",
                firstName: person.firstName || "",
                lastName: person.lastName || "",
                dateOfBirth: person.dateOfBirth || "",
                dateOfDeath: person.dateOfDeath || "",
                placeOfBirth: person.placeOfBirth || "",
                placeOfDeath: person.placeOfDeath || "",
                gender: person.gender || "male",
                distance,
                missingFields,
                hasIncompleteData: missingFields.length > 0,
            };
        });

        // Filter to only those with incomplete data
        const incompleteData = people.filter((p) => p.hasIncompleteData);

        return NextResponse.json({ people: incompleteData });
    } catch (error) {
        console.error("Error fetching incomplete data:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch data" },
            { status: 500 }
        );
    } finally {
        await session.close();
    }
}

// Update person data
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { personId, updates } = body;

        if (!personId || !updates) {
            return NextResponse.json({ error: "personId and updates are required" }, { status: 400 });
        }

        const updatedPerson = await updatePersonNode(personId, updates);
        return NextResponse.json(updatedPerson);
    } catch (error) {
        console.error("Error updating person:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update person" },
            { status: 500 }
        );
    }
}
