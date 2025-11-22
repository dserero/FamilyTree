"use client";

import React, { useState, useEffect, useRef } from "react";
import { PersonNode, Node } from "@/types/graph";

interface SearchBarProps {
    nodes: Node[];
    onSelectNode: (nodeId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ nodes, onSelectNode }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<PersonNode[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter person nodes based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const personNodes = nodes.filter((node): node is PersonNode => node.nodeType === "person");
        const filtered = personNodes.filter((node) => {
            const fullName = `${node.firstName} ${node.lastName}`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return (
                fullName.includes(searchLower) ||
                node.firstName.toLowerCase().includes(searchLower) ||
                node.lastName.toLowerCase().includes(searchLower)
            );
        });

        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
        setHighlightedIndex(-1);
    }, [searchTerm, nodes]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as HTMLElement)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSuggestion = (node: PersonNode) => {
        setSearchTerm(`${node.firstName} ${node.lastName}`);
        setIsOpen(false);
        onSelectNode(node.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[highlightedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                width: "90%",
                maxWidth: "400px",
            }}
        >
            <div style={{ position: "relative" }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for a person..."
                    style={{
                        width: "100%",
                        padding: "12px 40px 12px 16px",
                        fontSize: "14px",
                        fontFamily: "Arial, sans-serif",
                        border: "2px solid #2196F3",
                        borderRadius: "8px",
                        outline: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        boxSizing: "border-box",
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#666",
                        fontSize: "18px",
                        pointerEvents: "none",
                    }}
                >
                    🔍
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "2px solid #2196F3",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        maxHeight: "300px",
                        overflowY: "auto",
                        zIndex: 1001,
                    }}
                >
                    {suggestions.map((node, index) => (
                        <div
                            key={node.id}
                            onClick={() => handleSelectSuggestion(node)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            style={{
                                padding: "12px 16px",
                                cursor: "pointer",
                                backgroundColor: highlightedIndex === index ? "#E3F2FD" : "white",
                                borderBottom: index < suggestions.length - 1 ? "1px solid #e0e0e0" : "none",
                                transition: "background-color 0.2s",
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    color: "#333",
                                    marginBottom: "4px",
                                }}
                            >
                                {node.firstName} {node.lastName}
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#666",
                                }}
                            >
                                Born: {node.dateOfBirth}
                                {node.placeOfBirth && ` • ${node.placeOfBirth}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
