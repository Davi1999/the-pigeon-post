"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonVariants } from "@/components/ui/Button";
import { HomeFeed } from "./HomeFeed";
import type { FeedPage, FeedPostSerialized } from "./types";

const PAGE_SIZE = 12;

/** Each loaded batch becomes its own balanced three-column block, so loading
 *  more stories never reflows content that is already on screen. */
function chunkPosts(posts: FeedPostSerialized[], size: number) {
  const batches: FeedPostSerialized[][] = [];
  for (let index = 0; index < posts.length; index += size) {
    batches.push(posts.slice(index, index + size));
  }
  return batches;
}

type HomePageProps = {
  initialPosts: FeedPostSerialized[];
  initialNextCursor: string | null;
  sidebar: React.ReactNode;
};

export function HomePage({
  initialPosts,
  initialNextCursor,
  sidebar,
}: HomePageProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Guards against a second request from a rapid double-click. */
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        cursor: nextCursor,
      });
      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");

      const data = (await response.json()) as FeedPage;
      setPosts((current) => [...current, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch {
      setError("Could not load more stories. Please try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [nextCursor]);

  const batches = useMemo(() => chunkPosts(posts, PAGE_SIZE), [posts]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
      <div className="min-w-0" aria-busy={loading}>
        <div className="mb-6 flex flex-wrap justify-center gap-2 lg:hidden">
          <Link
            href="/new-post"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Write a story
          </Link>
          <Link
            href="/add-friends"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Add friends
          </Link>
          <SignOutButton />
        </div>

        {batches.length === 0 ? (
          <HomeFeed posts={[]} />
        ) : (
          batches.map((batch, index) => (
            <section
              key={`${index}-${batch[0]?.id ?? "empty"}`}
              aria-label={
                index === 0 ? "Latest stories" : `More stories, page ${index + 1}`
              }
              className={
                index > 0
                  ? "mt-8 border-t border-black/40 pt-8 dark:border-[#f5ecd8]/40"
                  : undefined
              }
            >
              <HomeFeed posts={batch} />
            </section>
          ))
        )}

        {nextCursor ? (
          <div
            className="mt-6 flex flex-col items-center gap-2"
            aria-live="polite"
          >
            {loading ? (
              <span className="text-xs text-muted">Loading more stories…</span>
            ) : (
              <button
                type="button"
                onClick={() => void loadMore()}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Load more stories
              </button>
            )}
            {error ? (
              <p role="alert" className="text-xs text-red-700 dark:text-red-300">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <aside
        aria-label="Edition options"
        className="min-w-0 border-t border-black/60 pt-6 dark:border-[#f5ecd8]/50 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
      >
        {sidebar}
      </aside>
    </div>
  );
}
