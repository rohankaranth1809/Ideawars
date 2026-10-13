import Link from "next/link";
import { CreateThread } from "@/components/create-thread";
import { isSupabaseConfigured } from "@/lib/config";
import { profileName } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";
import { formatRemaining, isLive } from "@/lib/time";
import type { Thread } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let userId: string | null = null;
  let live: Thread[] = [];
  let closed: Thread[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    const { data } = await supabase
      .from("threads")
      .select("id, title, prompt, creator_id, duration_minutes, ends_at, created_at, profiles(display_name)")
      .order("created_at", { ascending: false });
    const threads = (data ?? []) as unknown as Thread[];
    live = threads.filter((thread) => isLive(thread.ends_at));
    closed = threads.filter((thread) => !isLive(thread.ends_at));
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-ember">Timed idea battles</p>
        <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight">
          Put ideas in the ring.
          <span className="block text-gold">The crowd decides.</span>
        </h1>
        <p className="max-w-lg text-muted">
          Start a 5 or 10 minute thread, share the URL, and let people post ideas. Votes stack in
          real time. Flip to the leaderboard whenever you want a ranking.
        </p>
        {isSupabaseConfigured ? (
          <CreateThread userId={userId} />
        ) : (
          <div className="rounded-3xl border border-line bg-paper p-5 text-sm text-muted">
            Add <code className="text-gold">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-gold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="text-gold">.env.local</code>, then run{" "}
            <code className="text-gold">supabase/schema.sql</code>.
          </div>
        )}
      </section>

      <ThreadList title="Live now" threads={live} empty="No live threads. Start one and share the link." />
      <ThreadList title="Closed" threads={closed} empty="Finished wars will land here." />
    </div>
  );
}

function ThreadList({
  title,
  threads,
  empty,
}: {
  title: string;
  threads: Thread[];
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl">{title}</h2>
      {threads.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/t/${thread.id}`}
                className="block rounded-3xl border border-line bg-paper p-5 transition hover:border-gold/50 hover:bg-paper-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl">{thread.title}</h3>
                    {thread.prompt && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{thread.prompt}</p>
                    )}
                    <p className="mt-3 text-xs text-muted">
                      {profileName(thread.profiles)} · {thread.duration_minutes} min
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-line px-3 py-1 text-xs tabular-nums">
                    {formatRemaining(thread.ends_at)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
