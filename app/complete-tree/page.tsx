"use client";

import { useState, useEffect } from "react";
import DataEntryWizard from "@/components/DataEntryWizard";
import { Card } from "@/components/ui/card";

interface Person {
    id: string;
    name: string;
}

export default function DataEntryPage() {
    const [people, setPeople] = useState<Person[]>([]);
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchPeople();
    }, []);

    const fetchPeople = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/family-tree");
            const data = await response.json();
            const personNodes = data.nodes.filter((node: any) => node.nodeType === "person");
            setPeople(personNodes);
        } catch (error) {
            console.error("Error fetching people:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPeople = people.filter((person) => person.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedPersonId) {
        return (
            <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                                Complete Your Family Tree
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Let's fill in the missing pieces together
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedPersonId(null)}
                            className="px-5 py-2.5 text-sm font-medium border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                        >
                            ← Change Person
                        </button>
                    </div>
                    <DataEntryWizard startPersonId={selectedPersonId} />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header section with improved typography */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-block mb-4">
                        <span className="text-5xl sm:text-6xl animate-bounce-slow">🌳</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
                        Complete Your Family Tree
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Help us preserve your family legacy. Start by selecting who you are in the family tree.
                    </p>
                </div>

                {/* Main card with enhanced styling */}
                <Card className="p-6 sm:p-10 shadow-2xl border-0 bg-white/90 backdrop-blur-sm animate-slide-up">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-fuchsia-500 rounded-full"></div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Who are you?</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block relative">
                                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            </div>
                            <div className="text-lg text-gray-600 mt-6 animate-pulse">Loading family members...</div>
                        </div>
                    ) : (
                        <>
                            {/* Enhanced search input */}
                            <div className="mb-8 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for your name..."
                                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Enhanced people list */}
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredPeople.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="text-6xl mb-4 opacity-50">🔍</div>
                                        <p className="text-gray-500 text-lg">
                                            {searchQuery ? "No matching names found" : "No family members found"}
                                        </p>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    filteredPeople.map((person, index) => (
                                        <button
                                            key={person.id}
                                            onClick={() => setSelectedPersonId(person.id)}
                                            className="w-full px-6 py-5 text-left text-lg border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-fuchsia-50 transition-all duration-200 group shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 active:scale-98"
                                            style={{
                                                animationDelay: `${index * 50}ms`,
                                                animation: "slideInRight 0.3s ease-out forwards",
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                                                    {person.name}
                                                </span>
                                                <span className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    →
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </Card>

                {/* Footer hint */}
                {!loading && filteredPeople.length > 0 && (
                    <p className="text-center mt-8 text-gray-500 text-sm animate-fade-in">
                        💡 Select your name to begin completing missing information
                    </p>
                )}
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%,
                    100% {
                        transform: translate(0, 0) scale(1);
                    }
                    25% {
                        transform: translate(20px, -50px) scale(1.1);
                    }
                    50% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    75% {
                        transform: translate(50px, 50px) scale(1.05);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes bounce-slow {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-slide-up {
                    animation: slide-up 0.5s ease-out;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }

                .active\:scale-98:active {
                    transform: scale(0.98);
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #a855f7, #d946ef);
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #9333ea, #c026d3);
                }
            `}</style>
        </main>
    );
}
