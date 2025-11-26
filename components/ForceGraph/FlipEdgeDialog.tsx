"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/types/graph";

interface FlipEdgeDialogProps {
    edge: Link;
    onClose: () => void;
    onFlip: () => void;
}

export function FlipEdgeDialog({ edge, onClose, onFlip }: FlipEdgeDialogProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <Card className="w-[450px] bg-white">
                    <CardHeader>
                        <CardTitle>Flip Edge Relationship</CardTitle>
                        <CardDescription>Change the relationship type</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-700">
                            This edge is currently a{" "}
                            <strong>{edge.type === "marriage" ? '"Partner in Couple"' : '"Child in Couple"'}</strong>{" "}
                            relationship.
                        </p>
                        <p className="text-sm text-gray-600">
                            Do you want to flip it to a{" "}
                            <strong>{edge.type === "marriage" ? '"Child in Couple"' : '"Partner in Couple"'}</strong>{" "}
                            relationship?
                        </p>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm">
                                {edge.type === "marriage" ? (
                                    <>
                                        <span className="text-purple-700">💑 Partner in Couple</span> →{" "}
                                        <span className="text-green-700">👨‍👩‍👦 Child in Couple</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-green-700">👨‍👩‍👦 Child in Couple</span> →{" "}
                                        <span className="text-purple-700">💑 Partner in Couple</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onFlip}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                            Flip Relationship
                        </button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
