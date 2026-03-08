// src/components/auth/SignOutButton.tsx

"use client";

import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
    >
      Sign out
    </button>
  );
}
