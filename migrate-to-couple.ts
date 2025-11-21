// Migration script to rename Relationship nodes to Couple nodes
import * as dotenv from "dotenv";
import { getSession, closeDriver } from "./lib/neo4j";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function migrateRelationshipToCouple() {
    console.log("Starting migration: Relationship -> Couple\n");

    const session = getSession();

    try {
        // Check how many Relationship nodes exist
        const countResult = await session.run(`
            MATCH (r:Relationship)
            RETURN count(r) as count
        `);
        const count = countResult.records[0].get("count").toNumber();
        console.log(`Found ${count} Relationship nodes to migrate.\n`);

        if (count === 0) {
            console.log("No Relationship nodes found. Nothing to migrate.");
            return;
        }

        // Rename the label from Relationship to Couple
        console.log("Renaming Relationship nodes to Couple...");
        const result = await session.run(`
            MATCH (r:Relationship)
            SET r:Couple
            REMOVE r:Relationship
            RETURN count(r) as migrated
        `);

        const migrated = result.records[0].get("migrated").toNumber();
        console.log(`✅ Successfully migrated ${migrated} nodes from Relationship to Couple.\n`);

        // Verify the migration
        const verifyResult = await session.run(`
            MATCH (c:Couple)
            RETURN count(c) as count
        `);
        const coupleCount = verifyResult.records[0].get("count").toNumber();
        console.log(`Verification: Found ${coupleCount} Couple nodes in the database.\n`);

        // Check that no Relationship nodes remain
        const remainingResult = await session.run(`
            MATCH (r:Relationship)
            RETURN count(r) as count
        `);
        const remaining = remainingResult.records[0].get("count").toNumber();

        if (remaining === 0) {
            console.log("✅ Migration completed successfully! No Relationship nodes remain.");
        } else {
            console.log(`⚠️  Warning: ${remaining} Relationship nodes still exist.`);
        }
    } catch (error) {
        console.error("\n❌ Error during migration:", error);
        throw error;
    } finally {
        await session.close();
        await closeDriver();
        console.log("\nDatabase connection closed.");
    }
}

migrateRelationshipToCouple();
