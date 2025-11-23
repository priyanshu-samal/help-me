import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Code2, Brain, Zap } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden relative selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-900">
          <Brain className="h-6 w-6 text-emerald-600" />
          <span>Helper Agent</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-emerald-700 transition-colors">Features</a>
          <a href="#" className="hover:text-emerald-700 transition-colors">How it works</a>
          <a href="#" className="hover:text-emerald-700 transition-colors">Pricing</a>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <Button variant="outline" className="rounded-full border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900">
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </nav>

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center pt-20 pb-32 px-4 text-center z-10">

        {/* Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-200/40 rounded-full blur-2xl -z-10 pointer-events-none animate-pulse" />

        {/* Floating Icons (Glassmorphism) */}
        <div className="absolute left-[15%] top-[30%] hidden lg:block animate-bounce duration-[3000ms]">
          <div className="p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl">
            <Github className="h-8 w-8 text-slate-800" />
          </div>
        </div>
        <div className="absolute right-[15%] top-[40%] hidden lg:block animate-bounce duration-[4000ms]">
          <div className="p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl">
            <Code2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Your Personal AI Twin, <br />
            <span className="text-emerald-600">Context-Aware</span> & Authentic.
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stop sending generic replies. We analyze your <strong>GitHub</strong> and <strong>Resume</strong> to generate responses that actually sound like you.
          </p>

          <div className="pt-8 flex items-center justify-center gap-4">
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <Button size="lg" className="h-14 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg shadow-lg shadow-emerald-200/50 transition-all hover:scale-105">
                Continue with GitHub <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>

          <div className="pt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Auto-Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Smart Retrieval</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pivot Mode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Helper Agent. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://x.com/PriyanshuS92042" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">
              X (Twitter)
            </a>
            <a href="mailto:samalpriyanshu966@gmail.com" className="hover:text-emerald-600 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
