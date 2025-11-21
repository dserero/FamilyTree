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

export type Node = PersonNode | CoupleNode;

export interface Link {
    source: string | Node; // UUID string or Node object
    target: string | Node; // UUID string or Node object
    type: "marriage" | "parent-child";
}

export const linkColors = {
    marriage: "#9C27B0",
    "parent-child": "#4CAF50",
};
