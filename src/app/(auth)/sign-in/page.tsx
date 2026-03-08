// src/app/(auth)/sign-in/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectReason?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  const { redirectReason } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{redirectReason === "signup" ? "Sign up" : "Sign in"}</h1>
        {redirectReason === "signup" && (
          <p className="text-sm text-gray-500">
            Sign in with Google to create your account — Google handles account
            creation automatically.
          </p>
        )}
        <SignInForm />
        {redirectReason !== "signup" && (
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-foreground underline hover:no-underline"
            >
              Sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
