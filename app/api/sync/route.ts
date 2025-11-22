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

        const { bio } = await req.json();

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

        // Clear old memory
        await clearMemory();

        const docs: { text: string; metadata: Record<string, any> }[] = [];

        // 1. Add Bio
        if (bio) {
            docs.push({
                text: `User Bio: ${bio}`,
                metadata: { type: "bio", source: "user" },
            });
        }

        // 2. Fetch Repos (Authenticated = Higher Limits)
        const repos = await fetchUserRepos(githubUsername, token);

        for (const repo of repos) {
            // Add Repo Info
            docs.push({
                text: `Repository: ${repo.name}\nDescription: ${repo.description}\nLanguage: ${repo.language}\nTopics: ${repo.topics.join(", ")}`,
                metadata: { type: "repo_info", source: "github", repo: repo.name },
            });

            // Fetch package.json
            const packageJson = await fetchFileContent(githubUsername, repo.name, "package.json", token);
            if (packageJson) {
                const skills = extractSkillsFromPackageJson(packageJson);
                if (skills.length > 0) {
                    docs.push({
                        text: `Skills used in ${repo.name}: ${skills.join(", ")}`,
                        metadata: { type: "skills", source: "package.json", repo: repo.name },
                    });
                }
            }

            // Fetch README
            const readme = await fetchFileContent(githubUsername, repo.name, "README.md", token);
            if (readme) {
                // Truncate README to avoid huge context and cost
                const truncatedReadme = readme.slice(0, 3000);
                docs.push({
                    text: `README for ${repo.name}:\n${truncatedReadme}`,
                    metadata: { type: "readme", source: "README.md", repo: repo.name },
                });
            }
        }

        // Ingest into Vector Store
        // We pass all docs to addDocuments, which now handles batching and rate limiting internally.
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
