"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface OnboardingFormProps {
    onComplete?: () => void;
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/sync", {
                method: "POST",
                body: JSON.stringify({ bio }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                toast.success("Profile initialized!");
                if (onComplete) onComplete();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to setup");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Setup your AI Twin</CardTitle>
                <CardDescription>Tell me a bit about yourself to get started.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio / Resume Summary</Label>
                        <Textarea
                            id="bio"
                            placeholder="I am a Full Stack Developer with 5 years of experience..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            required
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Setting up..." : "Complete Setup"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
