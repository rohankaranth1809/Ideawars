import type { Idea, IdeaRow, Profile } from "@/lib/types";

export function profileName(profile?: Profile | Profile[] | null) {
  if (!profile) return "Anonymous";
  return (Array.isArray(profile) ? profile[0] : profile)?.display_name ?? "Anonymous";
}

export function mapIdeas(rows: IdeaRow[] | null | undefined, userId: string | null): Idea[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    thread_id: row.thread_id,
    author_id: row.author_id,
    body: row.body,
    created_at: row.created_at,
    author_name: profileName(row.profiles),
    vote_count: row.votes?.length ?? 0,
    voted: Boolean(userId && row.votes?.some((vote) => vote.user_id === userId)),
  }));
}

export const ideaSelect = "id, thread_id, author_id, body, created_at, profiles(display_name), votes(user_id)";
