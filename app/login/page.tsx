import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/config";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold">Join the arena</h1>
        <p className="mt-2 text-muted">Sign up with email, then post ideas and vote.</p>
      </div>
      {isSupabaseConfigured ? (
        <Suspense>
          <AuthForm />
        </Suspense>
      ) : (
        <div className="rounded-3xl border border-line bg-paper p-6 text-sm text-muted">
          Configure Supabase env vars, then sign in with email and password here.
        </div>
      )}
    </div>
  );
}
