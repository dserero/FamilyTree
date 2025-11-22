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

    // Detect mobile for responsive sizing
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    // Scale sizes for mobile
    const scale = isMobile ? 0.75 : 1;
    const titleFontSize = Math.round(13 * scale);
    const detailFontSize = Math.round(10 * scale);
    const buttonFontSize = Math.round(9 * scale);
    const padding = Math.round(6 * scale);
    const gap = Math.round(2 * scale);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                border: `2px solid ${colors.border}`,
                borderRadius: "8px",
                padding: `${padding}px`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                background: colors.fill,
                fontFamily: "Arial, sans-serif",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    fontWeight: "bold",
                    fontSize: `${titleFontSize}px`,
                    marginBottom: `${gap * 2}px`,
                    color: "#333",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {firstName} {lastName}
            </div>
            <div
                style={{
                    flex: "1",
                    overflowY: "auto",
                    marginBottom: `${gap * 2}px`,
                    fontSize: `${detailFontSize}px`,
                    color: "#666",
                }}
            >
                <div style={{ marginBottom: `${gap}px` }}>
                    <strong>DOB:</strong> {dateOfBirth}
                </div>
                {placeOfBirth && (
                    <div style={{ marginBottom: `${gap}px` }}>
                        <strong>Birth:</strong> {placeOfBirth}
                    </div>
                )}
                {dateOfDeath && (
                    <div style={{ marginBottom: `${gap}px` }}>
                        <strong>DOD:</strong> {dateOfDeath}
                    </div>
                )}
                {placeOfDeath && (
                    <div style={{ marginBottom: `${gap}px` }}>
                        <strong>Death:</strong> {placeOfDeath}
                    </div>
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${gap}px`,
                    flexShrink: 0,
                }}
            >
                <button
                    className="node-edit-btn"
                    style={{
                        padding: `${gap}px ${padding}px`,
                        fontSize: `${buttonFontSize}px`,
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                    }}
                >
                    ✏️ Edit
                </button>
                <div style={{ display: "flex", gap: `${gap}px` }}>
                    <button
                        className="node-create-couple-partner-btn"
                        style={{
                            flex: 1,
                            padding: `${gap}px`,
                            fontSize: `${buttonFontSize}px`,
                            backgroundColor: "#9C27B0",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                        }}
                        title="Create couple (as partner)"
                    >
                        💑
                    </button>
                    <button
                        className="node-create-couple-child-btn"
                        style={{
                            flex: 1,
                            padding: `${gap}px`,
                            fontSize: `${buttonFontSize}px`,
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
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
    // Detect mobile for responsive sizing
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const size = isMobile ? 60 : 80;
    const iconSize = isMobile ? 18 : 24;
    const fontSize = isMobile ? 8 : 10;
    const padding = isMobile ? 6 : 8;

    return (
        <div
            style={{
                width: `${size}px`,
                height: `${size}px`,
                background: "#FFF3E0",
                border: "3px solid #FF9800",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                fontFamily: "Arial, sans-serif",
                padding: `${padding}px`,
                gap: "4px",
            }}
        >
            <div style={{ textAlign: "center", fontSize: `${iconSize}px`, color: "#F57C00" }}>💑</div>
            <div style={{ display: "flex", gap: "2px", width: "100%" }}>
                <button
                    className="node-add-parent-btn"
                    style={{
                        flex: 1,
                        padding: "2px",
                        fontSize: `${fontSize}px`,
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
                        fontSize: `${fontSize}px`,
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
