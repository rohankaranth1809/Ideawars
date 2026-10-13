import { notFound } from "next/navigation";
import { Arena } from "@/components/arena";
import { isSupabaseConfigured } from "@/lib/config";
import { ideaSelect, mapIdeas } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";
import type { IdeaRow, Thread } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) notFound();

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, prompt, creator_id, duration_minutes, ends_at, created_at")
    .eq("id", id)
    .single();

  if (!thread) notFound();

  const { data: ideaRows } = await supabase
    .from("ideas")
    .select(ideaSelect)
    .eq("thread_id", id)
    .order("created_at", { ascending: false });

  return (
    <Arena
      thread={thread as Thread}
      initialIdeas={mapIdeas(ideaRows as IdeaRow[] | null, user?.id ?? null)}
      userId={user?.id ?? null}
    />
  );
}
