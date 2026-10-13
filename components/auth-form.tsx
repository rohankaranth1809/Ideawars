"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState(params.get("error") ? "Could not complete sign-in." : "");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();

    if (mode === "signup") {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Check your email to confirm, then sign in.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-paper p-6">
      <div className="flex rounded-full bg-paper-2 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full py-2 ${mode === "signin" ? "bg-gold text-bg" : "text-muted"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full py-2 ${mode === "signup" ? "bg-gold text-bg" : "text-muted"}`}
        >
          Sign up
        </button>
      </div>
      {mode === "signup" && (
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-gold"
            placeholder="Rohan"
          />
        </label>
      )}
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-gold"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-gold"
        />
      </label>
      {message && <p className="text-sm text-ember">{message}</p>}
      <button
        disabled={busy}
        className="w-full rounded-full bg-ink py-2.5 font-medium text-bg transition hover:bg-gold disabled:opacity-60"
      >
        {busy ? "Working…" : mode === "signup" ? "Create account" : "Enter the arena"}
      </button>
    </form>
  );
}
