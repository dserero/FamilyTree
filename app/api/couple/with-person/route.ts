import { NextResponse } from "next/server";
import {
    createCoupleWithParent,
    createCoupleWithChild,
    createCoupleWithPartner,
    linkPartnerToCouple,
    linkChildToCouple,
    createFullPersonNode,
} from "@/lib/neo4j";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { personId, role, personData, coupleId } = body;

        if (!personId || !role) {
            return NextResponse.json({ error: "personId and role are required" }, { status: 400 });
        }

        if (role !== "parent" && role !== "child" && role !== "partner") {
            return NextResponse.json(
                { error: "Invalid role. Must be 'parent', 'child', or 'partner'" },
                { status: 400 }
            );
        }

        // Default person data if not provided
        const defaultPersonData = {
            firstName: personData?.firstName || "New",
            lastName: personData?.lastName || "Person",
            dateOfBirth: personData?.dateOfBirth || new Date().toISOString().split("T")[0],
            gender: personData?.gender || "male",
            dateOfDeath: personData?.dateOfDeath,
            placeOfBirth: personData?.placeOfBirth,
            placeOfDeath: personData?.placeOfDeath,
            profession: personData?.profession,
        };

        let result;

        // If coupleId is provided, use existing couple
        if (coupleId) {
            // Create the new person
            const newPerson = await createFullPersonNode(defaultPersonData);

            // Link to existing couple based on role
            if (role === "parent") {
                // New person is parent, existing person is child
                await linkPartnerToCouple(newPerson.id, coupleId);
            } else if (role === "child") {
                // New person is child, existing person is parent
                await linkChildToCouple(newPerson.id, coupleId);
            } else {
                // New person is partner, existing person is also partner
                await linkPartnerToCouple(newPerson.id, coupleId);
            }

            result = {
                coupleId: coupleId,
                personId: newPerson.id,
            };
        } else {
            // Create new couple with person
            if (role === "parent") {
                // Create a couple and a parent person, where the existing person is the child
                result = await createCoupleWithParent(personId, defaultPersonData);
            } else if (role === "child") {
                // Create a couple and a child person, where the existing person is the parent
                result = await createCoupleWithChild(personId, defaultPersonData);
            } else {
                // Create a couple and a partner person, where the existing person is also a partner
                result = await createCoupleWithPartner(personId, defaultPersonData);
            }
        }

        return NextResponse.json({
            success: true,
            coupleId: result.coupleId,
            personId: result.personId,
        });
    } catch (error) {
        console.error("Error creating couple with person:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create couple with person" },
            { status: 500 }
        );
    }
}
