// src/app/(main)/dashboard/page.tsx

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonVariants } from "@/components/ui/Button";
import { getFeedPostsPage } from "@/lib/feed";
import { DashboardFeed } from "./DashboardFeed";

const INITIAL_PAGE_SIZE = 12;

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const { user } = session;

  const { posts: initialPosts, nextCursor: initialNextCursor } =
    await getFeedPostsPage(user.id, { limit: INITIAL_PAGE_SIZE });

  const hasPosts = initialPosts.length > 0;

  const serializedInitialPosts = initialPosts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Masthead */}
        <header className="border-b border-gray-300 pb-4 text-center">
          <h1 className="text-3xl font-semibold tracking-[0.25em] uppercase">
            The Pigeon Post
          </h1>
          <p className="mt-2 text-xs uppercase text-gray-500">
            Personal Dispatches from You and Your Friends
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_260px]">
          {/* Columns 1–3: Feed */}
          <div className="lg:col-span-3">
            {hasPosts ? (
              <DashboardFeed
                initialPosts={serializedInitialPosts}
                initialNextCursor={initialNextCursor}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="space-y-3 border border-dashed bg-gray-50 px-4 py-6 text-center text-sm text-gray-700">
                    <p className="text-base font-semibold uppercase tracking-wide">
                      No stories on your front page yet
                    </p>
                    <p className="text-xs text-gray-500">
                      Start your edition of The Pigeon Post by writing your
                      first article or adding a friend.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      <Link
                        href="/new-post"
                        className={buttonVariants({
                          variant: "primary",
                          size: "sm",
                        })}
                      >
                        Write a new story
                      </Link>
                      <Link
                        href="/add-friends"
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        Add friends
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 4: Links & options */}
          <aside className="space-y-4 border-t border-gray-200 pt-4 text-sm md:border-none md:pt-0">
            <section className="space-y-3 border bg-background px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Edition Options
              </h2>
              <nav className="space-y-2">
                <Link
                  href="/new-post"
                  className={buttonVariants({
                    variant: "primary",
                    block: true,
                  })}
                >
                  Create new post
                </Link>
                <Link
                  href="/add-friends"
                  className={buttonVariants({
                    variant: "secondary",
                    block: true,
                  })}
                >
                  Add friends
                </Link>
              </nav>
            </section>

            <section className="space-y-3 border bg-background px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Account
              </h2>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="truncate">{user.email}</span>
              </div>
              <div className="pt-1">
                <SignOutButton />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
