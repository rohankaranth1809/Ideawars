-- Run this in the Supabase SQL editor once per project.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Anonymous',
  created_at timestamptz not null default now()
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  prompt text not null default '' check (char_length(prompt) <= 280),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  duration_minutes int not null check (duration_minutes in (5, 10)),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create index if not exists threads_created_at_idx on public.threads (created_at desc);
create index if not exists ideas_thread_id_idx on public.ideas (thread_id, created_at desc);
create index if not exists votes_idea_id_idx on public.votes (idea_id);

alter table public.ideas replica identity full;
alter table public.votes replica identity full;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(new.email, '@', 1),
      'Anonymous'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.threads enable row level security;
alter table public.ideas enable row level security;
alter table public.votes enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable" on public.profiles for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "threads are readable" on public.threads;
create policy "threads are readable" on public.threads for select using (true);

drop policy if exists "signed in users create threads" on public.threads;
create policy "signed in users create threads" on public.threads
  for insert with check (auth.uid() = creator_id);

drop policy if exists "ideas are readable" on public.ideas;
create policy "ideas are readable" on public.ideas for select using (true);

drop policy if exists "signed in users post live ideas" on public.ideas;
create policy "signed in users post live ideas" on public.ideas
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.threads t
      where t.id = thread_id and t.ends_at > now()
    )
  );

drop policy if exists "votes are readable" on public.votes;
create policy "votes are readable" on public.votes for select using (true);

drop policy if exists "signed in users vote live ideas" on public.votes;
create policy "signed in users vote live ideas" on public.votes
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.ideas i
      join public.threads t on t.id = i.thread_id
      where i.id = idea_id
        and i.author_id <> auth.uid()
        and t.ends_at > now()
    )
  );

drop policy if exists "users remove own votes" on public.votes;
create policy "users remove own votes" on public.votes
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.ideas i
      join public.threads t on t.id = i.thread_id
      where i.id = idea_id and t.ends_at > now()
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ideas'
  ) then
    alter publication supabase_realtime add table public.ideas;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;
