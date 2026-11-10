import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { PostCard } from "./PostCard";
import type { FeedPostSerialized } from "./types";

function EmptyFeed() {
  return (
    <div className="space-y-3 border border-dashed border-black/40 px-4 py-8 text-center text-sm dark:border-[#f5ecd8]/40">
      <p className="text-base font-semibold uppercase tracking-wide">
        No stories on your front page yet
      </p>
      <p className="text-xs text-muted">
        Start your edition of The Pigeon Post by writing your first article or
        adding a friend.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link
          href="/new-post"
          className={buttonVariants({ variant: "primary", size: "sm" })}
        >
          Write a new story
        </Link>
        <Link
          href="/add-friends"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Add friends
        </Link>
      </div>
    </div>
  );
}

export function HomeFeed({ posts }: { posts: FeedPostSerialized[] }) {
  if (posts.length === 0) {
    return <EmptyFeed />;
  }

  return (
    <div className="newspaper-feed-columns">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} variant="feed" />
      ))}
    </div>
  );
}
