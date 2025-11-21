import { NextResponse } from "next/server";
import {
    getFamilyTreeData,
    updatePersonNode,
    addChildToCouple,
    addParentToCouple,
    deletePersonNode,
    deleteCoupleNode,
} from "@/lib/neo4j";

export async function GET() {
    try {
        const data = await getFamilyTreeData();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching family tree data:", error);
        return NextResponse.json({ error: "Failed to fetch family tree data" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { coupleId, personData, relationType } = body;

        if (!coupleId || !personData || !relationType) {
            return NextResponse.json({ error: "coupleId, personData, and relationType are required" }, { status: 400 });
        }

        let newPerson;
        if (relationType === "child") {
            newPerson = await addChildToCouple(coupleId, personData);
        } else if (relationType === "parent") {
            newPerson = await addParentToCouple(coupleId, personData);
        } else {
            return NextResponse.json({ error: "Invalid relationType. Must be 'child' or 'parent'" }, { status: 400 });
        }

        return NextResponse.json(newPerson);
    } catch (error) {
        console.error("Error creating person:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create person" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Person ID is required" }, { status: 400 });
        }

        const updatedPerson = await updatePersonNode(id, updates);
        return NextResponse.json(updatedPerson);
    } catch (error) {
        console.error("Error updating person:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update person" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const nodeType = searchParams.get("nodeType");

        if (!id || !nodeType) {
            return NextResponse.json({ error: "id and nodeType are required" }, { status: 400 });
        }

        if (nodeType === "person") {
            await deletePersonNode(id);
        } else if (nodeType === "couple") {
            await deleteCoupleNode(id);
        } else {
            return NextResponse.json({ error: "Invalid nodeType. Must be 'person' or 'couple'" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting node:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete node" },
            { status: 500 }
        );
    }
}
