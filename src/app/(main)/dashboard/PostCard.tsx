import Link from "next/link";
import type { FeedPostSerialized } from "./types";

type PostCardProps = {
  post: FeedPostSerialized;
  /** `feed` clamps the body and links to the full article. */
  variant?: "feed" | "detail";
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function PostCard({ post, variant = "feed" }: PostCardProps) {
  const title = post.title || "Untitled story";
  const date = formatDate(post.createdAt);
  const byline = post.isOwnPost
    ? "By You"
    : `By ${post.authorDisplayName}`;
  const href = `/post/${post.id}`;

  return (
    <article
      id={`post-${post.id}`}
      className={
        variant === "feed"
          ? "mb-6 break-inside-avoid border-b border-black/60 pb-5 last:mb-0 dark:border-[#f5ecd8]/50"
          : "border-b border-black/60 pb-6 dark:border-[#f5ecd8]/50"
      }
    >
      <header className="space-y-1">
        <h2
          className={
            "text-center font-notable font-semibold uppercase leading-snug tracking-wide " +
            (variant === "feed" ? "text-base" : "text-xl")
          }
        >
          {variant === "feed" ? (
            <Link
              href={href}
              className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-[#f5ecd8]"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>

        <div className="flex flex-col items-center gap-1 pb-1 pt-1">
          <span className="h-px w-8 bg-black dark:bg-[#f5ecd8]" />
          <p className="px-2 py-1 text-center text-[10px] uppercase tracking-wide text-muted">
            {byline}
            {date ? ` — ${date}` : null}
          </p>
          <span className="h-px w-8 bg-black dark:bg-[#f5ecd8]" />
        </div>

        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={title}
            loading="lazy"
            decoding="async"
            className="mt-2 aspect-[16/9] max-h-[420px] w-full border border-black object-cover dark:border-[#f5ecd8]"
          />
        ) : null}
      </header>

      {post.body ? (
        <p
          className={
            variant === "feed"
              ? "post-article-body mt-2 whitespace-pre-wrap text-[11px] leading-relaxed post-card-excerpt"
              : "post-article-body post-article-body--detail mt-3 whitespace-pre-wrap text-[13px] leading-relaxed"
          }
        >
          {post.body}
        </p>
      ) : null}

      {variant === "feed" ? (
        <div className="mt-3 flex justify-center">
          <Link
            href={href}
            className="text-[10px] font-semibold uppercase tracking-[0.08em] underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-[#f5ecd8]"
            aria-label={`Continue reading ${title}`}
          >
            Continue reading →
          </Link>
        </div>
      ) : null}
    </article>
  );
}
