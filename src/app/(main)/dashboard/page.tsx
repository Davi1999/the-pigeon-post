import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonVariants } from "@/components/ui/Button";
import { getFeedPostsPage } from "@/lib/feed";
import { DashboardFeed } from "./DashboardFeed";
import { DashboardEmptyState } from "./DashboardEmptyState";

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

  const sidebarContent = (
    <>
      <h2 className="text-base font-semibold uppercase tracking-wide text-center font-notable">
        Edition Options
      </h2>
      <div className="mt-1 flex flex-col items-center gap-0.5 pb-2 pt-2">
        <div className="h-px w-8 bg-black dark:bg-[#f5ecd8]" />
        <p className="text-[10px] uppercase tracking-wide text-gray-500 text-center p-2">
          Work on your edition.
        </p>
        <div className="h-px w-8 bg-black dark:bg-[#f5ecd8]" />
        <p className="post-article-body mt-1 whitespace-pre-wrap text-[11px] text-justify">
          This is where you can contribute to the Pigeon Post. Add your friends,
          write your articles, and more. A great place to start is by creating a
          new post. Take the time to write something meaningful, and share it
          with your friends. Once you&apos;ve created a post, you can add your
          friends, read their posts, and start conversations.
        </p>
      </div>
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
    </>
  );

  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Masthead */}
        <header className="border-b border-black dark:border-[#f5ecd8] pb-4 text-center">
          <h1 className="text-3xl font-semibold tracking-[0.25em] uppercase font-diplomata text-center">
            Personal Dispatches from You and Your Friends!
          </h1>
        </header>

        {hasPosts ? (
          <DashboardFeed
            initialPosts={serializedInitialPosts}
            initialNextCursor={initialNextCursor}
            sidebarContent={sidebarContent}
          />
        ) : (
          <DashboardEmptyState sidebarContent={sidebarContent}>
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
          </DashboardEmptyState>
        )}
      </div>
    </div>
  );
}
