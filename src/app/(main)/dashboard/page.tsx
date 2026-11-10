import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFeedPostsPage } from "@/lib/feed";
import { DashboardNotifications } from "./DashboardNotifications";
import { HomePage } from "./HomePage";
import { HomeSidebar } from "./HomeSidebar";

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

  const { posts, nextCursor } = await getFeedPostsPage(user.id, {
    limit: INITIAL_PAGE_SIZE,
  });

  const initialPosts = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }));

  return (
    <div>
      <DashboardNotifications />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <header className="border-b border-black pb-4 text-center dark:border-[#f5ecd8]">
          <h1 className="text-center font-diplomata text-[1.4rem] font-semibold uppercase tracking-[0.08em] sm:text-3xl sm:tracking-[0.25em]">
            Personal Dispatches from You and Your Friends!
          </h1>
        </header>

        <HomePage
          initialPosts={initialPosts}
          initialNextCursor={nextCursor}
          sidebar={<HomeSidebar email={user.email} />}
        />
      </div>
    </div>
  );
}
