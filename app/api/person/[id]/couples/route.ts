import { NextResponse } from "next/server";
import { getCouplesForPerson } from "@/lib/neo4j";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const personId = params.id;

        if (!personId) {
            return NextResponse.json({ error: "Person ID is required" }, { status: 400 });
        }

        const couples = await getCouplesForPerson(personId);

        return NextResponse.json(couples);
    } catch (error) {
        console.error("Error fetching couples for person:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch couples" },
            { status: 500 }
        );
    }
}
