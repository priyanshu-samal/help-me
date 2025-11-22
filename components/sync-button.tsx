"use client";

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function SyncButton() {
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        setLoading(true);
        try {
            // We don't need to pass github username anymore, the backend gets it from session
            // We might want to pass the bio again if we had it stored, but for now let's just sync repos
            const res = await fetch("/api/sync", {
                method: "POST",
                body: JSON.stringify({}), // No bio update, just sync
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                toast.success("Profile synced successfully!");
            } else {
                toast.error("Failed to sync profile");
            }
        } catch (error) {
            toast.error("Error syncing profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Syncing..." : "Sync Profile"}
        </Button>
    );
}
