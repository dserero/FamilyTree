"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CoupleSelectionDialogProps {
    role: "parent" | "child" | "partner";
    couples: string[];
    onClose: () => void;
    onSelectCouple: (coupleId: string | null) => void;
}

export function CoupleSelectionDialog({ role, couples, onClose, onSelectCouple }: CoupleSelectionDialogProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <Card className="w-[480px] bg-white">
                    <CardHeader>
                        <CardTitle>Choose Family Connection</CardTitle>
                        <CardDescription>
                            {couples.length === 1
                                ? "Use existing family or create new one?"
                                : "Which family should this person belong to?"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {couples.length === 1 ? (
                            <>
                                <button
                                    onClick={() => onSelectCouple(couples[0])}
                                    className="w-full px-5 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">✅</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-base mb-1">Use Existing Family</div>
                                            <div className="text-sm opacity-90">Add to the existing family/couple</div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => onSelectCouple(null)}
                                    className="w-full px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">➕</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-base mb-1">Create New Family</div>
                                            <div className="text-sm opacity-90">Create a new couple/family unit</div>
                                        </div>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-700 mb-2">
                                    This person has {couples.length} families. Select one:
                                </p>
                                {couples.map((coupleId, index) => (
                                    <button
                                        key={coupleId}
                                        onClick={() => onSelectCouple(coupleId)}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-xl">👨‍👩‍👦</div>
                                            <div className="font-semibold">Family {index + 1}</div>
                                        </div>
                                    </button>
                                ))}
                                <button
                                    onClick={() => onSelectCouple(null)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left mt-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-xl">➕</div>
                                        <div className="font-semibold">Create New Family</div>
                                    </div>
                                </button>
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
