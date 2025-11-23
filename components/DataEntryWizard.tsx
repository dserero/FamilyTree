"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface Person {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dateOfDeath?: string;
    placeOfBirth: string;
    placeOfDeath?: string;
    gender: "male" | "female";
    distance: number;
    missingFields: string[];
}

interface Question {
    field: string;
    label: string;
    type: "text" | "date" | "select";
    options?: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
    { field: "firstName", label: "What is their first name?", type: "text" },
    { field: "lastName", label: "What is their last name?", type: "text" },
    { field: "dateOfBirth", label: "When were they born?", type: "date" },
    { field: "placeOfBirth", label: "Where were they born?", type: "text" },
    {
        field: "gender",
        label: "What is their gender?",
        type: "select",
        options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
        ],
    },
    { field: "dateOfDeath", label: "When did they pass away? (Optional)", type: "date" },
    { field: "placeOfDeath", label: "Where did they pass away? (Optional)", type: "text" },
];

export default function DataEntryWizard({ startPersonId }: { startPersonId: string }) {
    const [people, setPeople] = useState<Person[]>([]);
    const [currentPersonIndex, setCurrentPersonIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState(0);

    useEffect(() => {
        fetchIncompleteData();
    }, [startPersonId]);

    const fetchIncompleteData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/data-entry?startPersonId=${startPersonId}`);
            const data = await response.json();
            const incompletePeople: Person[] = data.people || [];

            setPeople(incompletePeople);

            const total = incompletePeople.reduce((sum, person) => sum + person.missingFields.length, 0);
            setTotalQuestions(total);
            setAnsweredQuestions(0);
            setCurrentPersonIndex(0);
            setCurrentQuestionIndex(0);
            setCompleted(total === 0);
        } catch (error) {
            console.error("Error fetching incomplete data:", error);
        } finally {
            setLoading(false);
        }
    };

    const currentPerson = people[currentPersonIndex];
    const currentQuestions = currentPerson
        ? QUESTIONS.filter((q) => currentPerson.missingFields.includes(q.field))
        : [];
    const currentQuestion = currentQuestions[currentQuestionIndex];

    const handleSubmit = async () => {
        if (!answer.trim() && !currentQuestion.field.includes("Death")) return;

        setSaving(true);
        try {
            const updates: any = {};
            updates[currentQuestion.field] = answer;

            await fetch("/api/data-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    personId: currentPerson.id,
                    updates,
                }),
            });

            // Update local state to remove the answered field from missingFields
            setPeople((prevPeople) =>
                prevPeople.map((person) =>
                    person.id === currentPerson.id
                        ? {
                              ...person,
                              ...updates,
                              missingFields: person.missingFields.filter((f) => f !== currentQuestion.field),
                          }
                        : person
                )
            );

            setAnsweredQuestions((prev) => Math.min(prev + 1, totalQuestions));

            moveToNextQuestion();
        } catch (error) {
            console.error("Error saving data:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        moveToNextQuestion();
    };

    const moveToNextQuestion = () => {
        setAnswer("");

        if (currentQuestionIndex < currentQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else if (currentPersonIndex < people.length - 1) {
            setCurrentPersonIndex(currentPersonIndex + 1);
            setCurrentQuestionIndex(0);
        } else {
            setCompleted(true);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    if (completed) {
        return (
            <Card className="p-8 text-center">
                <div className="mb-4 text-6xl">🎉</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">All Done!</h2>
                <p className="text-xl text-gray-600 mb-6">
                    You've completed all available data entry for people close to you in the family tree.
                </p>
                <button
                    onClick={() => {
                        setCompleted(false);
                        setCurrentPersonIndex(0);
                        setCurrentQuestionIndex(0);
                        fetchIncompleteData();
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Check Again
                </button>
            </Card>
        );
    }

    if (!currentPerson || !currentQuestion) {
        return (
            <Card className="p-8 text-center">
                <p className="text-gray-600">No incomplete data found.</p>
            </Card>
        );
    }

    const rawProgress = totalQuestions === 0 ? 100 : (answeredQuestions / totalQuestions) * 100;
    const progress = Math.min(100, Math.max(0, rawProgress));

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <Card className="p-8">
                <div className="mb-6">
                    <div className="text-sm text-gray-500 mb-2">
                        About: <span className="font-semibold">{currentPerson.name}</span>
                        {currentPerson.distance > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {currentPerson.distance} {currentPerson.distance === 1 ? "step" : "steps"} away
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">{currentQuestion.label}</h2>
                </div>

                <div className="mb-6">
                    {currentQuestion.type === "text" && (
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your answer..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && answer.trim()) {
                                    handleSubmit();
                                }
                            }}
                        />
                    )}
                    {currentQuestion.type === "date" && (
                        <input
                            type="date"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    )}
                    {currentQuestion.type === "select" && (
                        <div className="space-y-3">
                            {currentQuestion.options?.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setAnswer(option.value);
                                        // Auto-submit after selection
                                        setTimeout(() => {
                                            const updates: any = {};
                                            updates[currentQuestion.field] = option.value;
                                            setSaving(true);
                                            fetch("/api/data-entry", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    personId: currentPerson.id,
                                                    updates,
                                                }),
                                            })
                                                .then(() => {
                                                    // Update local state to remove the answered field from missingFields
                                                    setPeople((prevPeople) =>
                                                        prevPeople.map((person) =>
                                                            person.id === currentPerson.id
                                                                ? {
                                                                      ...person,
                                                                      ...updates,
                                                                      missingFields: person.missingFields.filter(
                                                                          (f) => f !== currentQuestion.field
                                                                      ),
                                                                  }
                                                                : person
                                                        )
                                                    );
                                                    setAnsweredQuestions((prev) => Math.min(prev + 1, totalQuestions));
                                                    moveToNextQuestion();
                                                })
                                                .finally(() => setSaving(false));
                                        }, 100);
                                    }}
                                    className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSkip}
                        disabled={saving}
                        className="flex-1 px-6 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Skip
                    </button>
                    {currentQuestion.type !== "select" && (
                        <button
                            onClick={handleSubmit}
                            disabled={(!answer.trim() && !currentQuestion.field.includes("Death")) || saving}
                            className="flex-1 px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : "Submit"}
                        </button>
                    )}
                </div>
            </Card>

            {/* Stats */}
            <div className="mt-6 text-center text-sm text-gray-500">
                Person {currentPersonIndex + 1} of {people.length} • Question {currentQuestionIndex + 1} of{" "}
                {currentQuestions.length}
            </div>
        </div>
    );
}
