import React from "react";

interface PersonCardProps {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dateOfDeath?: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    gender: "male" | "female";
    photoCount?: number;
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
    photoCount = 0,
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
                position: "relative",
            }}
        >
            {photoCount > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: "#FF9800",
                        color: "white",
                        borderRadius: "50%",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        border: "2px solid white",
                    }}
                    title={`${photoCount} photo${photoCount !== 1 ? "s" : ""}`}
                >
                    📷 {photoCount}
                </div>
            )}
            <div
                style={{
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: "4px",
                }}
            >
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
            <div style={{ display: "flex", gap: "2px" }}>
                <button
                    className="node-edit-btn"
                    style={{
                        flex: 1,
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
                <button
                    className="node-create-couple-btn"
                    style={{
                        flex: 0,
                        padding: "3px 8px",
                        fontSize: "14px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                    title="Create couple"
                >
                    +
                </button>
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
            <button
                className="node-add-person-btn"
                style={{
                    padding: "4px 12px",
                    fontSize: "16px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontWeight: "bold",
                }}
                title="Add Person"
            >
                +
            </button>
        </div>
    );
};
