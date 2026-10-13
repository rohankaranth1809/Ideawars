# Idea Wars

Timed discussion threads. People post ideas, vote, and a leaderboard ranks the winners.

## Stack

Next.js (App Router) + Supabase Auth/Postgres + Vercel.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Authentication → Providers → enable Email.
3. Authentication → URL configuration:
   - Site URL: `http://localhost:3000` locally, then your Vercel URL in production.
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://YOUR-APP.vercel.app/auth/callback`.
4. SQL Editor → paste and run `supabase/schema.sql`.
5. Copy `.env.example` to `.env.local` and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push this repo and import it in Vercel.
2. Add the same two env vars in the Vercel project settings.
3. Set the Supabase Site URL and redirect URL to the Vercel domain.
4. Deploy. No extra build config is required.

Optional: turn off “Confirm email” in Supabase Auth while testing so sign-up can sign in immediately.
