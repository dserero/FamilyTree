// Test script to verify Neo4j connection and data structure
import * as dotenv from "dotenv";
import { getAllPersons, getFamilyTreeData, closeDriver } from "./lib/neo4j";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testDatabase() {
    console.log("Testing Neo4j connection...\n");

    // Debug: Check if env variables are loaded
    console.log("Environment variables check:");
    console.log("NEO4J_URI:", process.env.NEO4J_URI ? "✓ loaded" : "✗ missing");
    console.log("NEO4J_USERNAME:", process.env.NEO4J_USERNAME ? "✓ loaded" : "✗ missing");
    console.log("NEO4J_PASSWORD:", process.env.NEO4J_PASSWORD ? "✓ loaded" : "✗ missing");
    console.log();

    try {
        // Test 1: Get all persons
        console.log("1. Fetching all persons:");
        const persons = await getAllPersons();
        console.log(`   Found ${persons.length} persons:`);
        persons.forEach((person) => {
            console.log(`   - ${person.name} (ID: ${person.id})`);
        });

        // Test 2: Get full family tree data
        console.log("\n2. Fetching full family tree data:");
        const data = await getFamilyTreeData();
        console.log(`   Nodes: ${data.nodes.length}`);
        console.log(`   - Persons: ${data.nodes.filter((n) => n.nodeType === "person").length}`);
        console.log(`   - Couples: ${data.nodes.filter((n) => n.nodeType === "couple").length}`);
        console.log(`   Links: ${data.links.length}`);
        console.log(`   - Marriages: ${data.links.filter((l) => l.type === "marriage").length}`);
        console.log(`   - Parent-Child: ${data.links.filter((l) => l.type === "parent-child").length}`);

        // Test 3: Display sample data
        console.log("\n3. Sample person data:");
        if (data.nodes.length > 0) {
            const samplePerson = data.nodes.find((n) => n.nodeType === "person");
            if (samplePerson) {
                console.log(JSON.stringify(samplePerson, null, 2));
            }
        }

        console.log("\n4. Sample couple data:");
        const sampleCouple = data.nodes.find((n) => n.nodeType === "couple");
        if (sampleCouple) {
            console.log(JSON.stringify(sampleCouple, null, 2));
        }

        console.log("\n5. Sample links:");
        if (data.links.length > 0) {
            console.log(
                "   Marriage link:",
                JSON.stringify(
                    data.links.find((l) => l.type === "marriage"),
                    null,
                    2
                )
            );
            console.log(
                "   Parent-child link:",
                JSON.stringify(
                    data.links.find((l) => l.type === "parent-child"),
                    null,
                    2
                )
            );
        }

        console.log("\n✅ Database connection successful!");
    } catch (error) {
        console.error("\n❌ Error testing database:", error);
    } finally {
        await closeDriver();
        console.log("\nDatabase connection closed.");
    }
}

testDatabase();
