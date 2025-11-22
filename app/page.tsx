import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-3xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Your Personal AI Twin.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A context-aware bot that learns from your <strong>GitHub</strong> and <strong>Resume</strong> to write authentic DMs, emails, and replies.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-white text-black hover:bg-gray-200 transition-all">
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-bold text-lg mb-2">🧠 Context Aware</h3>
            <p className="text-sm text-gray-400">It reads your code and resume to understand your actual skills, not just keywords.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-bold text-lg mb-2">🔄 Auto-Sync</h3>
            <p className="text-sm text-gray-400">One-click sync with your latest GitHub activity. Keeps your twin up-to-date.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-bold text-lg mb-2">⚡ Pivot Mode</h3>
            <p className="text-sm text-gray-400">Missing a skill? It intelligently pivots to your transferable strengths.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
