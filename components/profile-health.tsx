"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";

// Mock data for now - in real app, this would come from the sync analysis
const healthData = {
    score: 85,
    issues: [
        { type: "warning", message: "Project 'Destiny' has a short README. Expand it to improve context." },
        { type: "success", message: "Great job! 'Boombot' has excellent documentation." },
    ]
};

export function ProfileHealth() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Profile Health
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-4">{healthData.score}%</div>
                <div className="space-y-2">
                    {healthData.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                            {issue.type === "warning" ? (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            ) : (
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            )}
                            <span className="text-muted-foreground">{issue.message}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
