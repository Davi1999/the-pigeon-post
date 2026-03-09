"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { PostArticle } from "./PostArticle";

export type FeedPostSerialized = {
  id: string;
  title: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  isOwnPost: boolean;
};

const PAGE_SIZE = 12;

type DashboardFeedProps = {
  initialPosts: FeedPostSerialized[];
  initialNextCursor: string | null;
};

function distributeIntoColumns<T>(items: T[]): [T[], T[], T[]] {
  const columns: [T[], T[], T[]] = [[], [], []];
  items.forEach((item, index) => {
    columns[index % 3].push(item);
  });
  return columns;
}

export function DashboardFeed({
  initialPosts,
  initialNextCursor,
}: DashboardFeedProps) {
  const [posts, setPosts] = useState<FeedPostSerialized[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        cursor: nextCursor,
      });
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = (await res.json()) as {
        posts: FeedPostSerialized[];
        nextCursor: string | null;
      };
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch {
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && nextCursor && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loading, loadMore]);

  const columns = distributeIntoColumns(posts);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {columns.map((columnPosts, columnIndex) => (
        <div
          key={`column-${columnIndex}`}
          className="space-y-4 border-gray-200 md:border-none md:pt-0"
        >
          {columnPosts.map((post) => (
            <PostArticle
              key={post.id}
              title={post.title}
              body={post.body}
              authorDisplayName={post.authorDisplayName}
              createdAt={new Date(post.createdAt)}
              isOwnPost={post.isOwnPost}
            />
          ))}
        </div>
      ))}
      {nextCursor ? (
        <div
          ref={sentinelRef}
          className="col-span-full flex justify-center py-4"
          aria-hidden
        >
          {loading ? (
            <span className="text-xs text-gray-500">Loading more…</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
