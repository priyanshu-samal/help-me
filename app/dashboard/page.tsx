import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { SyncButton } from "@/components/sync-button";
import { ProfileHealth } from "@/components/profile-health";
import { OnboardingForm } from "@/components/onboarding-form";
import { Toaster } from "@/components/ui/sonner";

export default async function Dashboard() {
    const session = await auth();

    if (!session) {
        redirect("/");
    }

    // In a real app, we'd check a DB to see if onboarding is done.
    // For now, we'll rely on the client-side check or just show the form if bio is missing.
    // But since we are simplifying, let's just render the main UI and let the components handle state.

    return (
        <main className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, {session.user?.name}</p>
                    </div>
                    <SyncButton />
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-6">
                        {/* We can put a mini-onboarding here if bio is missing, or just the health widget */}
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <h3 className="font-semibold mb-2">Your Bio</h3>
                            <OnboardingForm />
                        </div>
                        <ProfileHealth />
                    </div>
                    <div className="md:col-span-2">
                        <ChatInterface />
                    </div>
                </div>
            </div>
            <Toaster />
        </main>
    );
}
