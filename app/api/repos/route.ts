import { NextRequest, NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        // Fetch Repos (using existing lib function)
        const repos = await fetchUserRepos(githubUsername, token);

        return NextResponse.json({ repos });
    } catch (error) {
        console.error("Error fetching repos:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
