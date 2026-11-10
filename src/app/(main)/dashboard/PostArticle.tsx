import { LetterButton } from "@/components/LetterButton";

type PostArticleProps = {
  postId: string;
  title: string;
  body: string;
  featuredImage?: string | null;
  authorDisplayName: string;
  createdAt: Date;
  isOwnPost: boolean;
  continuedFromTitle?: string | null;
  showContinueButton?: boolean;
};

function formatDate(date: Date) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function PostArticle({
  postId,
  title,
  body,
  featuredImage,
  authorDisplayName,
  createdAt,
  isOwnPost,
  continuedFromTitle,
  showContinueButton = true,
}: PostArticleProps) {
  const displayTitle = title || "Untitled story";
  const dateLabel = formatDate(createdAt);
  const showImage = Boolean(featuredImage) && !continuedFromTitle;

  return (
    <article
      data-post-id={postId}
      className="space-y-1 border-b border-black dark:border-[#f5ecd8] pb-3 text-xs leading-relaxed last:border-b-0"
    >
      {continuedFromTitle ? (
        <div className="continued-from-tag">
          Continued from &ldquo;{continuedFromTitle}&rdquo;
        </div>
      ) : (
        <header className="space-y-0.5" style={{ breakInside: "avoid" }}>
          <h2 className="text-base font-semibold uppercase tracking-wide text-center font-notable break-words">
            {displayTitle}
          </h2>
          <div className="mt-1 flex flex-col items-center gap-0.5 pb-2 pt-2">
            <div className="h-px w-8 bg-black dark:bg-[#f5ecd8]" />
            <p className="text-[10px] uppercase tracking-wide text-gray-500 text-center p-2">
              {isOwnPost ? "By You" : `By ${authorDisplayName}`}
              {dateLabel ? ` — ${dateLabel}` : null}
            </p>
            <div className="h-px w-8 bg-black dark:bg-[#f5ecd8]" />
          </div>
          {showImage && featuredImage ? (
            // Plain <img> (not next/image): the newspaper paginator renders
            // the same markup as an HTML string and measures it off-screen,
            // so both paths must match. The fixed aspect ratio reserves height
            // before the image loads, keeping pagination stable.
            <img
              src={featuredImage}
              alt={displayTitle}
              loading="lazy"
              decoding="async"
              className="mt-3 aspect-[16/9] max-h-[420px] w-full border border-black object-cover dark:border-[#f5ecd8]"
            />
          ) : null}
        </header>
      )}
      <p className="post-article-body mt-1 whitespace-pre-wrap text-[11px] text-justify">
        {body}
      </p>
      {showContinueButton && (
        <div className="mt-3 flex justify-center">
          <LetterButton
            href={`/post/${postId}`}
            label="Continue conversation"
            ariaLabel={`Continue conversation about ${displayTitle}`}
          />
        </div>
      )}
    </article>
  );
}
