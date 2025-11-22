import { NextRequest, NextResponse } from "next/server";
import { fetchUserRepos, extractSkillsFromPackageJson, fetchFileContent } from "@/lib/github";
import { addDocuments, clearMemory } from "@/lib/rag";
import { auth } from "@/auth";

// Helper to delay execution (Throttling)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { bio, repos: selectedRepos } = await req.json();

        // @ts-ignore
        const token = session.accessToken;
        if (!token) {
            return NextResponse.json({ error: "Missing GitHub Token" }, { status: 401 });
        }

        // Fetch authenticated user to get username
        const userRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();
        const githubUsername = userData.login;

        // Clear old memory to start fresh
        await clearMemory();

        const docs: { text: string; metadata: Record<string, any> }[] = [];

        // 1. Add Bio
        if (bio) {
            docs.push({
                text: `User Bio: ${bio}`,
                metadata: { type: "bio", source: "user" },
            });
        }

        // 2. Process Selected Repos
        // If no repos selected (legacy call), we might want to fetch all, but for now let's rely on selection
        const reposToSync = selectedRepos || [];

        console.log(`Syncing ${reposToSync.length} selected repositories...`);

        for (const repoItem of reposToSync) {
            const repoName = repoItem.name;
            const tags = repoItem.tags || [];

            // Fetch Repo Info (we need description etc, so we might need to fetch individual repo or pass it from frontend)
            // To save API calls, let's fetch the single repo details
            try {
                const repoRes = await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const repoData = await repoRes.json();

                // Add Repo Info with Tags
                docs.push({
                    text: `Repository: ${repoData.name}\nDescription: ${repoData.description}\nLanguage: ${repoData.language}\nTopics: ${repoData.topics?.join(", ")}\nTags: ${tags.join(", ")}`,
                    metadata: { type: "repo_info", source: "github", repo: repoData.name, tags: tags },
                });

                // Fetch package.json
                const packageJson = await fetchFileContent(githubUsername, repoName, "package.json", token);
                if (packageJson) {
                    const skills = extractSkillsFromPackageJson(packageJson);
                    if (skills.length > 0) {
                        docs.push({
                            text: `Skills used in ${repoName}: ${skills.join(", ")}`,
                            metadata: { type: "skills", source: "package.json", repo: repoName, tags: tags },
                        });
                    }
                }

                // Fetch README
                const readme = await fetchFileContent(githubUsername, repoName, "README.md", token);
                if (readme) {
                    const truncatedReadme = readme.slice(0, 3000);
                    docs.push({
                        text: `README for ${repoName}:\n${truncatedReadme}`,
                        metadata: { type: "readme", source: "README.md", repo: repoName, tags: tags },
                    });
                }

            } catch (e) {
                console.error(`Failed to sync repo ${repoName}:`, e);
            }
        }

        // Ingest into Vector Store
        console.log(`Ingesting ${docs.length} documents...`);

        if (docs.length > 0) {
            await addDocuments(docs);
        }

        return NextResponse.json({ success: true, count: docs.length });
    } catch (error) {
        console.error("Error in sync API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
