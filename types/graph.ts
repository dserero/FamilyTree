export interface PersonNode {
    id: string; // UUID string
    nodeType: "person";
    name: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dateOfDeath?: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    gender: "male" | "female";
    photoCount?: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface CoupleNode {
    id: string; // UUID string
    nodeType: "couple";
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface PhotoNode {
    id: string; // UUID string
    url: string; // B2 storage URL
    caption?: string;
    location?: string;
    dateTaken?: string;
    comments?: string;
    uploadedAt: string;
}

export type Node = PersonNode | CoupleNode;

export interface Link {
    source: string | Node; // UUID string or Node object
    target: string | Node; // UUID string or Node object
    type: "marriage" | "parent-child";
    // For identifying the relationship: when type is "marriage", source is Person, target is Couple
    // when type is "parent-child", source is Couple, target is Person
    personId?: string; // Person ID involved in the relationship
    coupleId?: string; // Couple ID involved in the relationship
}

export const linkColors = {
    marriage: "#9C27B0",
    "parent-child": "#4CAF50",
};
