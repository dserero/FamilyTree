import React from "react";

interface PersonCardProps {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dateOfDeath?: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    gender: "male" | "female";
}

const genderColors = {
    male: {
        fill: "#E3F2FD",
        border: "#2196F3",
    },
    female: {
        fill: "#FCE4EC",
        border: "#E91E63",
    },
};

export const PersonCard: React.FC<PersonCardProps> = ({
    firstName,
    lastName,
    dateOfBirth,
    dateOfDeath,
    placeOfBirth,
    placeOfDeath,
    gender,
}) => {
    const colors = genderColors[gender];

    return (
        <div
            style={{
                width: "160px",
                height: "150px",
                background: colors.fill,
                border: `3px solid ${colors.border}`,
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                fontFamily: "Arial, sans-serif",
                padding: "6px",
                boxSizing: "border-box",
            }}
        >
            <div style={{ textAlign: "center", fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>
                {firstName} {lastName}
            </div>
            <div style={{ flex: 1, fontSize: "10px", color: "#666" }}>
                <div style={{ marginBottom: "2px" }}>
                    <strong>DOB:</strong> {dateOfBirth}
                </div>
                {placeOfBirth && (
                    <div style={{ marginBottom: "2px" }}>
                        <strong>Birth:</strong> {placeOfBirth}
                    </div>
                )}
                {dateOfDeath && (
                    <div style={{ marginBottom: "2px" }}>
                        <strong>DOD:</strong> {dateOfDeath}
                    </div>
                )}
                {placeOfDeath && (
                    <div style={{ marginBottom: "2px" }}>
                        <strong>Death:</strong> {placeOfDeath}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button
                    className="node-edit-btn"
                    style={{
                        padding: "3px 6px",
                        fontSize: "9px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontWeight: "500",
                    }}
                >
                    ✏️ Edit
                </button>
                <div style={{ display: "flex", gap: "2px" }}>
                    <button
                        className="node-create-couple-partner-btn"
                        style={{
                            flex: 1,
                            padding: "3px 2px",
                            fontSize: "9px",
                            backgroundColor: "#9C27B0",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                        title="Create couple (as partner)"
                    >
                        💑
                    </button>
                    <button
                        className="node-create-couple-child-btn"
                        style={{
                            flex: 1,
                            padding: "3px 2px",
                            fontSize: "9px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                        title="Create couple (as child)"
                    >
                        👨‍👩‍👦
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CoupleNode: React.FC = () => {
    return (
        <div
            style={{
                width: "80px",
                height: "80px",
                background: "#FFF3E0",
                border: "3px solid #FF9800",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                fontFamily: "Arial, sans-serif",
                padding: "8px",
                gap: "4px",
            }}
        >
            <div style={{ textAlign: "center", fontSize: "24px", color: "#F57C00" }}>💑</div>
            <div style={{ display: "flex", gap: "2px", width: "100%" }}>
                <button
                    className="node-add-parent-btn"
                    style={{
                        flex: 1,
                        padding: "2px",
                        fontSize: "10px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontWeight: "500",
                    }}
                    title="Add Parent"
                >
                    👤
                </button>
                <button
                    className="node-add-child-btn"
                    style={{
                        flex: 1,
                        padding: "2px",
                        fontSize: "10px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontWeight: "500",
                    }}
                    title="Add Child"
                >
                    👶
                </button>
            </div>
        </div>
    );
};
