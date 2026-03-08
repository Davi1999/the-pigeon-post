// src/components/auth/SignInForm.tsx

"use client";

import { signIn } from "@/lib/auth-client";
import { useState } from "react";

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        await signIn.social({ provider: "google", callbackURL: "/dashboard" });
        setIsLoading(false);
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/20 bg-foreground px-4 py-3 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
    >
      {isLoading ? "Signing in…" : "Sign in with Google"}
    </button>
  );
}
