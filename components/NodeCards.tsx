import React from "react";

interface PersonCardProps {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dateOfDeath?: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    profession?: string;
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
    profession,
    gender,
    photoCount = 0,
}) => {
    const colors = genderColors[gender];

    return (
        <div
            style={{
                width: "180px",
                height: "160px",
                background: `linear-gradient(135deg, ${colors.fill} 0%, white 100%)`,
                border: `3px solid ${colors.border}`,
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                padding: "8px",
                boxSizing: "border-box",
                position: "relative",
                transition: "all 0.3s ease",
            }}
            className="person-card-hover"
        >
            {photoCount > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: "-10px",
                        right: "-10px",
                        background: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
                        color: "white",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                        boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
                        border: "3px solid white",
                        cursor: "pointer",
                    }}
                    title={`${photoCount} photo${photoCount !== 1 ? "s" : ""}`}
                >
                    📷
                    <br />
                    {photoCount}
                </div>
            )}
            <div
                style={{
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    marginBottom: "6px",
                    lineHeight: "1.2",
                    textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                }}
            >
                {firstName} {lastName}
            </div>
            <div style={{ flex: 1, fontSize: "10px", color: "#555", lineHeight: "1.4" }}>
                <div style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontWeight: "600", color: "#666" }}>📅</span>
                    <span>{dateOfBirth}</span>
                </div>
                {placeOfBirth && (
                    <div style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: "600", color: "#666" }}>📍</span>
                        <span
                            style={{
                                fontSize: "9px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {placeOfBirth}
                        </span>
                    </div>
                )}
                {profession && (
                    <div style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: "600", color: "#666" }}>💼</span>
                        <span
                            style={{
                                fontSize: "9px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight: "600",
                                color: "#7C3AED",
                            }}
                        >
                            {profession}
                        </span>
                    </div>
                )}
                {dateOfDeath && (
                    <div
                        style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px", opacity: 0.8 }}
                    >
                        <span style={{ fontWeight: "600", color: "#666" }}>⚰️</span>
                        <span>{dateOfDeath}</span>
                    </div>
                )}
                {placeOfDeath && (
                    <div
                        style={{ marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px", opacity: 0.8 }}
                    >
                        <span style={{ fontWeight: "600", color: "#666" }}>📍</span>
                        <span
                            style={{
                                fontSize: "9px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {placeOfDeath}
                        </span>
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                <button
                    className="node-edit-btn"
                    style={{
                        flex: 1,
                        padding: "5px 8px",
                        fontSize: "10px",
                        background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        boxShadow: "0 2px 4px rgba(33,150,243,0.3)",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(33,150,243,0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(33,150,243,0.3)";
                    }}
                >
                    ✏️ Edit
                </button>
                <button
                    className="node-create-couple-btn"
                    style={{
                        flex: 0,
                        padding: "5px 12px",
                        fontSize: "16px",
                        background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        boxShadow: "0 2px 4px rgba(76,175,80,0.3)",
                        transition: "all 0.2s ease",
                    }}
                    title="Create couple"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(76,175,80,0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(76,175,80,0.3)";
                    }}
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
                width: "90px",
                height: "90px",
                background: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
                border: "4px solid #FF9800",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(255,152,0,0.3)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                padding: "8px",
                gap: "6px",
                transition: "all 0.3s ease",
                cursor: "pointer",
            }}
            className="couple-node-hover"
        >
            <div
                style={{
                    textAlign: "center",
                    fontSize: "28px",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
            >
                💑
            </div>
            <button
                className="node-add-person-btn"
                style={{
                    padding: "4px 14px",
                    fontSize: "18px",
                    background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(76,175,80,0.4)",
                    transition: "all 0.2s ease",
                }}
                title="Add Person"
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(76,175,80,0.5)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(76,175,80,0.4)";
                }}
            >
                +
            </button>
        </div>
    );
};
