// src/app/(main)/new-post/page.tsx

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import NewPostForm from "@/app/(main)/new-post/NewPostForm";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export default async function NewPostPage() {
  const session = await requireSession();

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Write a new post
          </h1>
          <p className="text-sm text-gray-500">
            Share a long-form dispatch with your friends. Plain text only, up to
            10,000 characters.
          </p>
        </header>

        <NewPostForm
          authorName={session.user.name ?? session.user.email ?? "You"}
          maxLength={10000}
        />
      </div>
    </div>
  );
}

