"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RepoSelector } from "./repo-selector";

export function SyncButton() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSync = async (selectedRepos: { name: string; tags: string[] }[]) => {
        setLoading(true);
        try {
            const res = await fetch("/api/sync", {
                method: "POST",
                body: JSON.stringify({ bio: "User Bio", repos: selectedRepos }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Synced ${data.count} items successfully!`);
            } else {
                toast.error("Sync failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                disabled={loading}
                variant="outline"
                className="gap-2"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Sync Profile
            </Button>

            <RepoSelector
                open={open}
                onOpenChange={setOpen}
                onSync={handleSync}
            />
        </>
    );
}
