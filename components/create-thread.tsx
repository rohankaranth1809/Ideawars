"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CreateThread({ userId }: { userId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!userId) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-bg"
      >
        Sign in to start a thread
      </button>
    );
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const endsAt = new Date(Date.now() + duration * 60_000).toISOString();
    const { data, error: insertError } = await supabase
      .from("threads")
      .insert({
        title: title.trim(),
        prompt: prompt.trim(),
        creator_id: userId,
        duration_minutes: duration,
        ends_at: endsAt,
      })
      .select("id")
      .single();
    setBusy(false);
    if (insertError || !data) {
      setError(insertError?.message ?? "Could not create thread.");
      return;
    }
    router.push(`/t/${data.id}`);
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-bg transition hover:scale-[1.02]"
        >
          Start a war
        </button>
      ) : (
        <form onSubmit={create} className="idea-enter space-y-3 rounded-3xl border border-line bg-paper p-5">
          <input
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the fight about?"
            className="w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-gold"
          />
          <textarea
            maxLength={280}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional prompt for people dropping ideas"
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-gold"
          />
          <div className="flex gap-2">
            {[5, 10].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDuration(mins as 5 | 10)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  duration === mins ? "bg-gold text-bg" : "border border-line text-muted"
                }`}
              >
                {mins} min timer
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-ember">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
            >
              {busy ? "Opening…" : "Open the ring"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 text-sm text-muted">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
