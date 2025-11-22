"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Repo {
    name: string;
    description: string | null;
    language: string | null;
    tags?: string[];
}

interface RepoSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSync: (selectedRepos: { name: string; tags: string[] }[]) => Promise<void>;
}

const TAG_OPTIONS = ["Frontend", "Backend", "Fullstack", "AI/ML", "Mobile", "Other"];

export function RepoSelector({ open, onOpenChange, onSync }: RepoSelectorProps) {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedRepos, setSelectedRepos] = useState<Record<string, boolean>>({});
    const [repoTags, setRepoTags] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && repos.length === 0) {
            fetchRepos();
        }
    }, [open]);

    const fetchRepos = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/repos");
            const data = await res.json();
            if (data.repos) {
                setRepos(data.repos);
            }
        } catch (error) {
            toast.error("Failed to load repositories");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (repoName: string) => {
        setSelectedRepos(prev => ({
            ...prev,
            [repoName]: !prev[repoName]
        }));
    };

    const handleTagChange = (repoName: string, tag: string) => {
        setRepoTags(prev => ({
            ...prev,
            [repoName]: tag
        }));
        // Auto-select when tagging
        if (!selectedRepos[repoName]) {
            handleToggle(repoName);
        }
    };

    const handleSyncClick = async () => {
        const selectedList = Object.entries(selectedRepos)
            .filter(([_, isSelected]) => isSelected)
            .map(([name]) => ({
                name,
                tags: repoTags[name] ? [repoTags[name]] : []
            }));

        if (selectedList.length === 0) {
            toast.error("Please select at least one repository");
            return;
        }

        setSyncing(true);
        try {
            await onSync(selectedList);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Repositories to Sync</DialogTitle>
                    <DialogDescription>
                        Choose your best projects to teach the AI. Tag them to improve relevance.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden border rounded-md">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <ScrollArea className="h-full w-full">
                            <div className="p-4 space-y-2">
                                {repos.map((repo) => (
                                    <div key={repo.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Checkbox
                                                checked={!!selectedRepos[repo.name]}
                                                onCheckedChange={() => handleToggle(repo.name)}
                                            />
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{repo.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{repo.description || "No description"}</p>
                                            </div>
                                        </div>
                                        <div className="ml-4 w-[140px]">
                                            <Select
                                                value={repoTags[repo.name] || ""}
                                                onValueChange={(val) => handleTagChange(repo.name, val)}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Add Tag" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TAG_OPTIONS.map(tag => (
                                                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {Object.values(selectedRepos).filter(Boolean).length} selected
                    </div>
                    <Button onClick={handleSyncClick} disabled={syncing || loading}>
                        {syncing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            "Sync Selected"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
