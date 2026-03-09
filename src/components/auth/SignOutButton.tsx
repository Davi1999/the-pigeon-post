// src/components/auth/SignOutButton.tsx

"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => handleSignOut()}>
      Sign out
    </Button>
  );
}
