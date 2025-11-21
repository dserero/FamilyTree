import React from "react";

interface PersonCardProps {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
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

export const PersonCard: React.FC<PersonCardProps> = ({ firstName, lastName, dateOfBirth, gender }) => {
    const colors = genderColors[gender];

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                border: `2px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                background: colors.fill,
                fontFamily: "Arial, sans-serif",
                display: "flex",
                flexDirection: "column",
                position: "relative",
            }}
        >
            <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "6px", color: "#333" }}>
                {firstName} {lastName}
            </div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "3px" }}>
                <strong>First Name:</strong> {firstName}
            </div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "3px" }}>
                <strong>Last Name:</strong> {lastName}
            </div>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>
                <strong>DOB:</strong> {dateOfBirth}
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    marginTop: "auto",
                }}
            >
                <button
                    className="node-edit-btn"
                    style={{
                        padding: "4px 8px",
                        fontSize: "10px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "500",
                    }}
                >
                    ✏️ Edit
                </button>
                <div style={{ display: "flex", gap: "3px" }}>
                    <button
                        className="node-create-couple-partner-btn"
                        style={{
                            flex: 1,
                            padding: "4px",
                            fontSize: "9px",
                            backgroundColor: "#9C27B0",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
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
                            padding: "4px",
                            fontSize: "9px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
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
