import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver {
    if (!driver) {
        // Access environment variables dynamically to ensure they're loaded
        const uri = process.env.NEO4J_URI;
        const username = process.env.NEO4J_USERNAME;
        const password = process.env.NEO4J_PASSWORD;

        if (!uri || !username || !password) {
            throw new Error("Missing required Neo4j environment variables");
        }

        driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    }
    return driver;
}

export function getSession(): Session {
    return getDriver().session({ database: process.env.NEO4J_DATABASE || "neo4j" });
}

export async function closeDriver(): Promise<void> {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

export const getFamilyTreeData = async () => {
    const session = getSession();

    try {
        // Query to get all Person nodes
        const personResult = await session.run(`
            MATCH (p:Person)
            RETURN p
        `);

        // Query to get all Couple nodes
        const relationshipResult = await session.run(`
            MATCH (r:Couple)
            RETURN r
        `);

        // Query to get PARTNER_IN relationships (Person -> Couple)
        const partnerInResult = await session.run(`
            MATCH (p:Person)-[:PARTNER_IN]->(r:Couple)
            RETURN p.id as personId, r.id as relationshipId
        `);

        // Query to get PARENT_OF relationships (Couple -> Person)
        const parentOfResult = await session.run(`
            MATCH (r:Couple)-[:PARENT_OF]->(child:Person)
            RETURN r.id as relationshipId, child.id as childId
        `);

        // Process Person nodes - database has 'id' and 'name' properties
        const persons = personResult.records.map((record) => {
            const person = record.get("p").properties;
            return {
                id: person.id, // UUID string
                nodeType: "person" as const,
                name: person.name || "",
                // Optional properties if they exist in your database
                firstName: person.firstName || person.name?.split(" ")[0] || "",
                lastName: person.lastName || person.name?.split(" ").slice(1).join(" ") || "",
                dateOfBirth: person.dateOfBirth || "",
                gender: person.gender || "male",
            };
        });

        // Process Couple nodes - use UUID string ids
        const relationships = relationshipResult.records.map((record) => {
            const rel = record.get("r").properties;
            return {
                id: rel.id, // UUID string
                nodeType: "couple" as const,
            };
        });

        // Process edges - use string IDs (UUIDs)
        const marriageLinks: Array<{ source: string; target: string; type: "marriage" }> = [];
        const parentChildLinks: Array<{ source: string; target: string; type: "parent-child" }> = [];

        // PARTNER_IN edges (person -> relationship)
        partnerInResult.records.forEach((record) => {
            marriageLinks.push({
                source: record.get("personId"),
                target: record.get("relationshipId"),
                type: "marriage",
            });
        });

        // PARENT_OF edges (relationship -> child)
        parentOfResult.records.forEach((record) => {
            parentChildLinks.push({
                source: record.get("relationshipId"),
                target: record.get("childId"),
                type: "parent-child",
            });
        });

        // Combine nodes
        const nodes = [...persons, ...relationships];
        const links = [...marriageLinks, ...parentChildLinks];

        return { nodes, links };
    } finally {
        await session.close();
    }
};

// Helper functions for database operations

// Get all persons
export async function getAllPersons(): Promise<Array<{ id: string; name: string }>> {
    const session = getSession();
    try {
        const result = await session.run("MATCH (p:Person) RETURN p");
        return result.records.map((record) => {
            const node = record.get("p");
            return {
                id: node.properties.id,
                name: node.properties.name,
            };
        });
    } finally {
        await session.close();
    }
}

// Create a Person node
export async function createPersonNode(name: string): Promise<{ id: string; name: string }> {
    const session = getSession();
    try {
        const result = await session.run(
            `CREATE (p:Person {id: randomUUID(), name: $name})
             RETURN p`,
            { name }
        );
        const node = result.records[0].get("p");
        return {
            id: node.properties.id,
            name: node.properties.name,
        };
    } finally {
        await session.close();
    }
}

// Create a Person node with full details
export async function createFullPersonNode(personData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: "male" | "female";
}): Promise<{ id: string; name: string }> {
    const session = getSession();
    try {
        const name = `${personData.firstName} ${personData.lastName}`;
        const result = await session.run(
            `CREATE (p:Person {
                id: randomUUID(), 
                name: $name,
                firstName: $firstName,
                lastName: $lastName,
                dateOfBirth: $dateOfBirth,
                gender: $gender
             })
             RETURN p`,
            {
                name,
                firstName: personData.firstName,
                lastName: personData.lastName,
                dateOfBirth: personData.dateOfBirth,
                gender: personData.gender,
            }
        );
        const node = result.records[0].get("p");
        return {
            id: node.properties.id,
            name: node.properties.name,
        };
    } finally {
        await session.close();
    }
}

// Add a child to a couple
export async function addChildToCouple(
    coupleId: string,
    childData: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: "male" | "female";
    }
): Promise<{ id: string; name: string }> {
    const session = getSession();
    try {
        const name = `${childData.firstName} ${childData.lastName}`;
        const result = await session.run(
            `MATCH (couple:Couple {id: $coupleId})
             CREATE (child:Person {
                id: randomUUID(), 
                name: $name,
                firstName: $firstName,
                lastName: $lastName,
                dateOfBirth: $dateOfBirth,
                gender: $gender
             })
             CREATE (couple)-[:PARENT_OF]->(child)
             RETURN child`,
            {
                coupleId,
                name,
                firstName: childData.firstName,
                lastName: childData.lastName,
                dateOfBirth: childData.dateOfBirth,
                gender: childData.gender,
            }
        );
        const node = result.records[0].get("child");
        return {
            id: node.properties.id,
            name: node.properties.name,
        };
    } finally {
        await session.close();
    }
}

// Add a parent to a couple (creates the parent and links them as PARTNER_IN)
export async function addParentToCouple(
    coupleId: string,
    parentData: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: "male" | "female";
    }
): Promise<{ id: string; name: string }> {
    const session = getSession();
    try {
        const name = `${parentData.firstName} ${parentData.lastName}`;
        const result = await session.run(
            `MATCH (couple:Couple {id: $coupleId})
             CREATE (parent:Person {
                id: randomUUID(), 
                name: $name,
                firstName: $firstName,
                lastName: $lastName,
                dateOfBirth: $dateOfBirth,
                gender: $gender
             })
             CREATE (parent)-[:PARTNER_IN]->(couple)
             RETURN parent`,
            {
                coupleId,
                name,
                firstName: parentData.firstName,
                lastName: parentData.lastName,
                dateOfBirth: parentData.dateOfBirth,
                gender: parentData.gender,
            }
        );
        const node = result.records[0].get("parent");
        return {
            id: node.properties.id,
            name: node.properties.name,
        };
    } finally {
        await session.close();
    }
}

// Create a Couple node with graph connections
export async function createRelationshipNode(person1Id: string, person2Id: string): Promise<{ id: string }> {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (person1:Person {id: $person1Id})
             MATCH (person2:Person {id: $person2Id})
             CREATE (r:Couple {id: randomUUID()})
             CREATE (person1)-[:PARTNER_IN]->(r)
             CREATE (person2)-[:PARTNER_IN]->(r)
             RETURN r`,
            { person1Id, person2Id }
        );
        const node = result.records[0].get("r");
        return { id: node.properties.id };
    } finally {
        await session.close();
    }
}

// Create a Couple node and link a person as a partner
export async function createCoupleAsPartner(personId: string): Promise<{ id: string }> {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (person:Person {id: $personId})
             CREATE (couple:Couple {id: randomUUID()})
             CREATE (person)-[:PARTNER_IN]->(couple)
             RETURN couple`,
            { personId }
        );
        const node = result.records[0].get("couple");
        return { id: node.properties.id };
    } finally {
        await session.close();
    }
}

// Create a Couple node and link a person as a child
export async function createCoupleAsParents(childId: string): Promise<{ id: string }> {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (child:Person {id: $childId})
             CREATE (couple:Couple {id: randomUUID()})
             CREATE (couple)-[:PARENT_OF]->(child)
             RETURN couple`,
            { childId }
        );
        const node = result.records[0].get("couple");
        return { id: node.properties.id };
    } finally {
        await session.close();
    }
}

// Link a child to a parent couple
export async function linkChildToRelationship(childId: string, relationshipId: string): Promise<void> {
    const session = getSession();
    try {
        await session.run(
            `MATCH (child:Person {id: $childId})
             MATCH (r:Couple {id: $relationshipId})
             CREATE (r)-[:PARENT_OF]->(child)`,
            { childId, relationshipId }
        );
    } finally {
        await session.close();
    }
}

// Update a Person node
export async function updatePersonNode(
    id: string,
    updates: {
        name?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        gender?: "male" | "female";
    }
): Promise<{ id: string; name: string }> {
    const session = getSession();
    try {
        // Build the SET clause dynamically based on provided updates
        const setClauses: string[] = [];
        const params: Record<string, any> = { id };

        if (updates.name !== undefined) {
            setClauses.push("p.name = $name");
            params.name = updates.name;
        }
        if (updates.firstName !== undefined) {
            setClauses.push("p.firstName = $firstName");
            params.firstName = updates.firstName;
        }
        if (updates.lastName !== undefined) {
            setClauses.push("p.lastName = $lastName");
            params.lastName = updates.lastName;
        }
        if (updates.dateOfBirth !== undefined) {
            setClauses.push("p.dateOfBirth = $dateOfBirth");
            params.dateOfBirth = updates.dateOfBirth;
        }
        if (updates.gender !== undefined) {
            setClauses.push("p.gender = $gender");
            params.gender = updates.gender;
        }

        if (setClauses.length === 0) {
            throw new Error("No updates provided");
        }

        const result = await session.run(
            `MATCH (p:Person {id: $id})
             SET ${setClauses.join(", ")}
             RETURN p`,
            params
        );

        if (result.records.length === 0) {
            throw new Error(`Person with id ${id} not found`);
        }

        const node = result.records[0].get("p");
        return {
            id: node.properties.id,
            name: node.properties.name,
        };
    } finally {
        await session.close();
    }
}

// Find person by name
export async function findPersonByName(name: string): Promise<{ id: string; name: string } | null> {
    const allPersons = await getAllPersons();
    return allPersons.find((p) => p.name === name) || null;
}

// Delete a Person node
export async function deletePersonNode(id: string): Promise<void> {
    const session = getSession();
    try {
        await session.run(
            `MATCH (p:Person {id: $id})
             DETACH DELETE p`,
            { id }
        );
    } finally {
        await session.close();
    }
}

// Delete a Couple node
export async function deleteCoupleNode(id: string): Promise<void> {
    const session = getSession();
    try {
        await session.run(
            `MATCH (c:Couple {id: $id})
             DETACH DELETE c`,
            { id }
        );
    } finally {
        await session.close();
    }
}

// Clear database (use with caution!)
export async function clearDatabase(): Promise<void> {
    const session = getSession();
    try {
        await session.run("MATCH (n) DETACH DELETE n");
    } finally {
        await session.close();
    }
}
