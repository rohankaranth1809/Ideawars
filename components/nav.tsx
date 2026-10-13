import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out";

export async function Nav() {
  let email: string | null = null;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gold text-xs font-bold text-bg">
            IW
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Idea Wars</span>
        </Link>
        {email ? (
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden max-w-40 truncate sm:block">{email}</span>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-bg transition hover:bg-gold"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
