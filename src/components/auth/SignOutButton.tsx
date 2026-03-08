// src/components/auth/SignOutButton.tsx

"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => handleSignOut()}
      className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
    >
      Sign out
    </button>
  );
}
