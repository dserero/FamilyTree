import React from "react";

export const Legend: React.FC = () => {
    return (
        <div
            style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                background: "white",
                padding: "15px 20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                zIndex: 10,
            }}
        >
            <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "16px" }}>Legend</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "30px",
                            height: "3px",
                            background: "#9C27B0",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                right: "-5px",
                                top: "-3px",
                                width: 0,
                                height: 0,
                                borderLeft: "6px solid #9C27B0",
                                borderTop: "4px solid transparent",
                                borderBottom: "4px solid transparent",
                            }}
                        ></div>
                    </div>
                    <span>Marriage</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "30px",
                            height: "3px",
                            background: "#4CAF50",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                right: "-5px",
                                top: "-3px",
                                width: 0,
                                height: 0,
                                borderLeft: "6px solid #4CAF50",
                                borderTop: "4px solid transparent",
                                borderBottom: "4px solid transparent",
                            }}
                        ></div>
                    </div>
                    <span>Parent-Child</span>
                </div>
            </div>
        </div>
    );
};
