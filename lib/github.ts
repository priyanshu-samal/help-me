import { Octokit } from "@octokit/rest";

// Initialize Octokit (can be used without auth for public repos, but rate limits apply)
// Ideally, we should use a token if provided by the user.
export const getOctokit = (token?: string) => {
  return new Octokit({ auth: token });
};

export interface RepoInfo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics: string[];
  pushed_at: string;
}

export interface SkillSet {
  languages: string[];
  frameworks: string[];
  tools: string[];
  source: string; // e.g., "package.json", "README"
}

export async function fetchUserRepos(username: string, token?: string): Promise<RepoInfo[]> {
  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.listForUser({
      username,
      sort: "pushed",
      per_page: 100, // Increased limit to fetch more repos
      type: "owner",
    });

    return data.map((repo) => ({
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language || null,
      topics: (repo as any).topics || [],
      pushed_at: repo.pushed_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching repos:", error);
    return [];
  }
}

export async function fetchFileContent(
  username: string,
  repo: string,
  path: string,
  token?: string
): Promise<string | null> {
  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.getContent({
      owner: username,
      repo,
      path,
    });

    if ("content" in data && typeof data.content === "string") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch (error) {
    // File not found or other error
    return null;
  }
}

export function extractSkillsFromPackageJson(content: string): string[] {
  try {
    const json = JSON.parse(content);
    const deps = { ...json.dependencies, ...json.devDependencies };
    return Object.keys(deps);
  } catch (e) {
    return [];
  }
}

// Simple heuristic to categorize skills (can be improved with LLM later)
export function categorizeSkills(skills: string[]) {
  const categories = {
    frameworks: ["next", "react", "vue", "angular", "svelte", "express", "nest", "django", "flask", "fastapi"],
    databases: ["mongoose", "pg", "mysql", "sequelize", "prisma", "typeorm", "mongodb", "redis"],
    tools: ["typescript", "eslint", "prettier", "webpack", "vite", "jest", "cypress", "docker", "kubernetes", "aws-sdk"],
  };

  // This is just a helper for display; the LLM will understand the raw list better.
  return skills;
}
