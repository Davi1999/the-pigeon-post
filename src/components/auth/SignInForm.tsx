// src/components/auth/SignInForm.tsx

"use client";

import { signIn } from "@/lib/auth-client";
import { useState } from "react";

const GOOGLE_LOGO_SRC = "/Google_%22G%22_logo.svg";

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={isLoading}
      aria-label="Sign in with Google"
      onClick={async () => {
        setIsLoading(true);
        await signIn.social({ provider: "google", callbackURL: "/dashboard" });
        setIsLoading(false);
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/20 bg-foreground px-4 py-3 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
    >
      <img
        src={GOOGLE_LOGO_SRC}
        alt=""
        width={24}
        height={24}
        className={isLoading ? "animate-pulse opacity-70" : ""}
      />
      {isLoading && <span>Signing in…</span>}
    </button>
  );
}
