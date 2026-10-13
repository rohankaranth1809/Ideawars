"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full border border-line px-3 py-1.5 text-sm text-ink transition hover:border-gold hover:text-gold"
    >
      Sign out
    </button>
  );
}
