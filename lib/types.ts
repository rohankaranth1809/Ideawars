export type Profile = {
  id?: string;
  display_name?: string;
};

export type Thread = {
  id: string;
  title: string;
  prompt: string;
  creator_id: string;
  duration_minutes: 5 | 10;
  ends_at: string;
  created_at: string;
  profiles?: Profile | Profile[] | null;
};

export type IdeaRow = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: Profile | Profile[] | null;
  votes?: { user_id: string }[];
};

export type Idea = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
  vote_count: number;
  voted: boolean;
};
