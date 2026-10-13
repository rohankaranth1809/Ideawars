"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ideaSelect, mapIdeas } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/client";
import { formatRemaining, isLive } from "@/lib/time";
import type { Idea, IdeaRow, Thread } from "@/lib/types";

type View = "feed" | "board";

export function Arena({
  thread,
  initialIdeas,
  userId,
}: {
  thread: Thread;
  initialIdeas: Idea[];
  userId: string | null;
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [view, setView] = useState<View>(isLive(thread.ends_at) ? "feed" : "board");
  const [now, setNow] = useState(Date.now());
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [popId, setPopId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const live = isLive(thread.ends_at, now);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!live && view === "feed") setView("board");
  }, [live, view]);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data } = await supabase
        .from("ideas")
        .select(ideaSelect)
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: false });
      setIdeas(mapIdeas(data as IdeaRow[] | null, userId));
    }

    const channel = supabase
      .channel(`thread:${thread.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ideas", filter: `thread_id=eq.${thread.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread.id, userId]);

  const shown = useMemo(() => {
    const copy = [...ideas];
    if (view === "board") {
      copy.sort((a, b) => b.vote_count - a.vote_count || +new Date(a.created_at) - +new Date(b.created_at));
    } else {
      copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return copy;
  }, [ideas, view]);

  async function share() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function post(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) {
      router.push(`/login?next=/t/${thread.id}`);
      return;
    }
    const text = body.trim();
    if (!text) return;
    setError("");
    const supabase = createClient();
    const { error: insertError } = await supabase.from("ideas").insert({
      thread_id: thread.id,
      author_id: userId,
      body: text,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setBody("");
    setPosted(true);
    setTimeout(() => setPosted(false), 700);
  }

  async function toggleVote(idea: Idea) {
    if (!userId) {
      router.push(`/login?next=/t/${thread.id}`);
      return;
    }
    if (!live || idea.author_id === userId) return;
    const supabase = createClient();
    setPopId(idea.id);
    setTimeout(() => setPopId(null), 450);
    setIdeas((current) =>
      current.map((item) =>
        item.id === idea.id
          ? {
              ...item,
              voted: !item.voted,
              vote_count: item.voted ? item.vote_count - 1 : item.vote_count + 1,
            }
          : item,
      ),
    );
    if (idea.voted) {
      await supabase.from("votes").delete().eq("idea_id", idea.id).eq("user_id", userId);
    } else {
      const { error: voteError } = await supabase.from("votes").insert({ idea_id: idea.id, user_id: userId });
      if (voteError) {
        setIdeas((current) =>
          current.map((item) =>
            item.id === idea.id
              ? { ...item, voted: idea.voted, vote_count: idea.vote_count }
              : item,
          ),
        );
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-paper p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">{live ? "Live thread" : "Closed"}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{thread.title}</h1>
        {thread.prompt && <p className="mt-2 text-muted">{thread.prompt}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-line px-3 py-1 text-sm tabular-nums">
            {live ? formatRemaining(thread.ends_at, now) : "Voting locked"}
          </span>
          <span className="text-sm text-muted">{thread.duration_minutes} min round</span>
          <button
            type="button"
            onClick={share}
            className="rounded-full border border-line px-3 py-1 text-sm transition hover:border-gold hover:text-gold"
          >
            {copied ? "Link copied" : "Share URL"}
          </button>
        </div>
      </div>

      <div className="flex rounded-full bg-paper p-1 text-sm">
        <button
          type="button"
          onClick={() => setView("feed")}
          className={`flex-1 rounded-full py-2 ${view === "feed" ? "bg-ink text-bg" : "text-muted"}`}
        >
          Ideas
        </button>
        <button
          type="button"
          onClick={() => setView("board")}
          className={`flex-1 rounded-full py-2 ${view === "board" ? "bg-gold text-bg" : "text-muted"}`}
        >
          Leaderboard
        </button>
      </div>

      {live && (
        <form
          onSubmit={post}
          className={`rounded-3xl border border-line bg-paper p-4 ${posted ? "posted-flash" : ""}`}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={userId ? "Drop your idea into the ring…" : "Sign in to post an idea"}
            className="w-full resize-none bg-transparent outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted">{body.length}/500</p>
            <button
              className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink transition hover:scale-[1.03] active:scale-95"
            >
              Post idea
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-ember">{error}</p>}
        </form>
      )}

      <ul className="space-y-3">
        {shown.length === 0 && (
          <li className="rounded-3xl border border-dashed border-line px-5 py-10 text-center text-muted">
            No ideas yet. Be first in.
          </li>
        )}
        {shown.map((idea, index) => {
          const rank = index + 1;
          const rankClass = view === "board" && rank === 1 ? "rank-1" : view === "board" && rank === 2 ? "rank-2" : view === "board" && rank === 3 ? "rank-3" : "";
          const own = idea.author_id === userId;
          return (
            <li
              key={idea.id}
              className={`idea-enter rounded-3xl border border-line bg-paper p-5 ${rankClass} ${
                popId === idea.id ? "vote-spark" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {view === "board" && (
                  <span className="w-8 font-display text-xl text-gold">{rank}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{idea.body}</p>
                  <p className="mt-2 text-xs text-muted">{own ? "You" : idea.author_name}</p>
                </div>
                <button
                  type="button"
                  disabled={!live || own}
                  onClick={() => toggleVote(idea)}
                  className={`min-w-14 rounded-2xl border px-3 py-2 text-center transition ${
                    idea.voted ? "border-gold bg-gold/15 text-gold" : "border-line text-ink"
                  } ${!live || own ? "cursor-default opacity-60" : "hover:border-gold"}`}
                >
                  <div className={`text-lg font-semibold tabular-nums ${popId === idea.id ? "vote-pop" : ""}`}>
                    {idea.vote_count}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted">
                    {own ? "Yours" : idea.voted ? "Voted" : "Vote"}
                  </div>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-sm text-muted">
        <Link href="/" className="hover:text-gold">
          Back to all threads
        </Link>
      </p>
    </div>
  );
}
