// src/app/(main)/dashboard/page.tsx

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.name ?? user.email}
        </h1>
        <p className="text-gray-500">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <div className="pt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
