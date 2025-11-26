"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AddFamilyMemberDialogProps {
    onClose: () => void;
    onCreateParent: () => void;
    onCreateChild: () => void;
    onCreatePartner: () => void;
}

export function AddFamilyMemberDialog({
    onClose,
    onCreateParent,
    onCreateChild,
    onCreatePartner,
}: AddFamilyMemberDialogProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <Card className="w-[480px] bg-white">
                    <CardHeader>
                        <CardTitle>Add Family Member</CardTitle>
                        <CardDescription>Choose which type of family member to add</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-gray-700 mb-3">What would you like to create?</p>
                        <div className="space-y-3">
                            <button
                                onClick={onCreateParent}
                                className="w-full px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">⬆️👤</div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-base mb-1">Create Parent</div>
                                        <div className="text-sm opacity-90">Add a parent to this person</div>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={onCreateChild}
                                className="w-full px-5 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">⬇️👶</div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-base mb-1">Create Child</div>
                                        <div className="text-sm opacity-90">Add a child to this person</div>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={onCreatePartner}
                                className="w-full px-5 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">💑</div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-base mb-1">Create Partner</div>
                                        <div className="text-sm opacity-90">Add a partner/spouse to this person</div>
                                    </div>
                                </div>
                            </button>
                        </div>
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
