"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CreatePersonDialogProps {
    onClose: () => void;
    onCreated: (personId: string) => void;
}

export function CreatePersonDialog({ onClose, onCreated }: CreatePersonDialogProps) {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "male" as "male" | "female",
        placeOfBirth: "",
        profession: "",
        notes: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/person", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to create person");
                return;
            }

            onCreated(data.personId);
        } catch {
            setError("Failed to create person");
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <Card className="w-[440px] bg-white">
                    <CardHeader>
                        <CardTitle>Create New Person</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="create-person-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>First Name *</label>
                                    <input
                                        className={inputClass}
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                        placeholder="First name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Last Name *</label>
                                    <input
                                        className={inputClass}
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                        placeholder="Last name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Date of Birth *</label>
                                    <input
                                        className={inputClass}
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Gender *</label>
                                    <select
                                        className={inputClass}
                                        value={form.gender}
                                        onChange={(e) =>
                                            setForm({ ...form, gender: e.target.value as "male" | "female" })
                                        }
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Place of Birth</label>
                                <input
                                    className={inputClass}
                                    value={form.placeOfBirth}
                                    onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
                                    placeholder="City, Country"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Profession</label>
                                <input
                                    className={inputClass}
                                    value={form.profession}
                                    onChange={(e) => setForm({ ...form, profession: e.target.value })}
                                    placeholder="e.g. Engineer, Doctor"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Notes</label>
                                <textarea
                                    className={inputClass}
                                    rows={2}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Any additional notes"
                                />
                            </div>

                            {error && <p className="text-sm text-red-600">{error}</p>}
                        </form>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-person-form"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-colors font-medium text-sm"
                        >
                            {loading ? "Creating…" : "Create Person"}
                        </button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
