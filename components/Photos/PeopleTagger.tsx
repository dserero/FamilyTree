"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Person {
    id: string;
    name: string;
}

interface Props {
    people: Person[];
    selectedPeople: string[];
    onToggle: (id: string) => void;
}

export default function PeopleTagger({ people, selectedPeople, onToggle }: Props) {
    return (
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-1 h-8 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
                    Tag People in Photo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4 bg-pink-50 p-3 rounded-lg border border-pink-100">
                    💡 Select the people who appear in this photo
                </p>
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {people.map((person, index) => (
                        <label
                            key={person.id}
                            className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-orange-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-pink-200 transition-all duration-200 group"
                            style={{
                                animationDelay: `${index * 30}ms`,
                                animation: "slideInRight 0.3s ease-out forwards",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedPeople.includes(person.id)}
                                onChange={() => onToggle(person.id)}
                                className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                            />
                            <span className="text-gray-700 group-hover:text-pink-700 font-medium transition-colors">
                                {person.name}
                            </span>
                        </label>
                    ))}
                </div>
                {selectedPeople.length > 0 && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg border border-pink-200 animate-fade-in">
                        <p className="text-sm font-semibold text-pink-700">
                            ✓ Selected: {selectedPeople.length} {selectedPeople.length === 1 ? "person" : "people"}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
