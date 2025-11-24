"use client";

interface PersonFormData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dateOfDeath?: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    profession?: string;
    gender: "male" | "female";
}

interface PersonFormFieldsProps {
    formData: PersonFormData;
    onChange: (field: keyof PersonFormData, value: string) => void;
}

export function PersonFormFields({ formData, onChange }: PersonFormFieldsProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">First Name</label>
                    <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => onChange("firstName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Last Name</label>
                    <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => onChange("lastName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Date of Birth</label>
                <input
                    type="text"
                    value={formData.dateOfBirth}
                    onChange={(e) => onChange("dateOfBirth", e.target.value)}
                    placeholder="YYYY or YYYY-MM-DD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter year only (e.g., 1990) or full date (e.g., 1990-05-15)
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                    Place of Birth <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    value={formData.placeOfBirth}
                    onChange={(e) => onChange("placeOfBirth", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                    Profession <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => onChange("profession", e.target.value)}
                    placeholder="e.g., Doctor, Teacher, Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                    Date of Death <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    value={formData.dateOfDeath}
                    onChange={(e) => onChange("dateOfDeath", e.target.value)}
                    placeholder="YYYY or YYYY-MM-DD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter year only (e.g., 2020) or full date (e.g., 2020-12-31)
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                    Place of Death <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    value={formData.placeOfDeath}
                    onChange={(e) => onChange("placeOfDeath", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Gender</label>
                <select
                    value={formData.gender}
                    onChange={(e) => onChange("gender", e.target.value as "male" | "female")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
        </div>
    );
}
