"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface CoupleRelationDialogProps {
    isSaving: boolean;
    onCreateAsPartner: () => void;
    onCreateAsChild: () => void;
    onCancel: () => void;
}

export function CoupleRelationDialog({
    isSaving,
    onCreateAsPartner,
    onCreateAsChild,
    onCancel,
}: CoupleRelationDialogProps) {
    return (
        <Card className="w-full max-w-[420px] bg-white shadow-2xl border-2">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Create Couple Node
                </CardTitle>
                <CardDescription>Choose the relationship type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <p className="text-sm text-gray-600">How should this person be connected to the new couple node?</p>
                <div className="space-y-3">
                    <button
                        onClick={onCreateAsPartner}
                        disabled={isSaving}
                        className="w-full px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                    >
                        <div className="font-semibold flex items-center gap-2">💑 As Partner/Lover</div>
                        <div className="text-sm opacity-90 mt-1">
                            Create a couple node where this person is one of the partners
                        </div>
                    </button>
                    <button
                        onClick={onCreateAsChild}
                        disabled={isSaving}
                        className="w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md hover:shadow-lg text-left"
                    >
                        <div className="font-semibold flex items-center gap-2">👨‍👩‍👦 As Child</div>
                        <div className="text-sm opacity-90 mt-1">
                            Create a couple node where this person is a child of that couple
                        </div>
                    </button>
                </div>
            </CardContent>
            <CardFooter>
                <button
                    onClick={onCancel}
                    disabled={isSaving}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                >
                    {isSaving ? "Creating..." : "Cancel"}
                </button>
            </CardFooter>
        </Card>
    );
}
