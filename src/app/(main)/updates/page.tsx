import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getLatestUpdates } from "@/lib/updates";
import { buttonVariants } from "@/components/ui/Button";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // This route should only be reachable for signed-in users; mirror dashboard behavior.
    throw new Error("Unauthorized");
  }

  return session;
}

export default async function UpdatesPage() {
  await requireSession();

  const updates = await getLatestUpdates();

  return (
    <div className="space-y-6 py-6">
      <header className="border-b border-black pb-4 text-center dark:border-[#f5ecd8]">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.3em] font-diplomata">
          Latest Dispatches from the Newsroom
        </h1>
      </header>

      <div className="flex justify-center">
        <Link
          href="/updates/requests"
          className={buttonVariants({
            variant: "secondary",
          })}
        >
          <span className="flex items-center gap-2">
            <img
              src="/writing.svg"
              alt="Request features"
              className="h-6 w-6"
            />
            <span className="uppercase tracking-wide text-xs">
              Request features
            </span>
          </span>
        </Link>
      </div>

      <section className="space-y-4">
        {updates.length === 0 ? (
          <p className="text-center text-xs text-gray-600">
            No updates just yet. Check back soon for the latest headlines.
          </p>
        ) : (
          updates.map((update) => (
            <article
              key={update.id}
              className="space-y-2 border bg-background px-4 py-3"
            >
              <header>
                <h2 className="text-base font-semibold uppercase tracking-wide">
                  {update.title}
                </h2>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                  {update.createdAt.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </header>
              <p className="post-article-body whitespace-pre-wrap text-[11px] text-justify">
                {update.body}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

