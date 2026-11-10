"use client";

import { useMemo, useState } from "react";

import type { PostComment } from "@/lib/comments";
import { LetterButton } from "@/components/LetterButton";

type SerializableComment = Omit<PostComment, "createdAt"> & {
  createdAt: string;
};

type PostCommentsSectionProps = {
  postId: string;
  initialComments: SerializableComment[];
  currentUserDisplayName: string;
};

type CommentFormProps = {
  label: string;
  autoFocus?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
};

function CommentForm({
  label,
  autoFocus,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter a comment.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setValue("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving your comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-2 border border-dashed border-black/30 bg-[#f5ecd8]/40 p-3 text-xs dark:border-foreground/30 dark:bg-foreground/10"
    >
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-strong">
        {label}
      </label>
      <textarea
        className="mt-1 block h-24 w-full resize-vertical border border-black/40 bg-white px-2 py-1 text-[11px] leading-relaxed text-justify text-foreground outline-none placeholder:text-muted-soft focus-visible:ring-2 focus-visible:ring-foreground dark:border-foreground/40 dark:bg-foreground/5"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        disabled={submitting}
      />
      {error ? (
        <p className="text-[10px] text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center border border-black/40 bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background hover:bg-foreground/90 disabled:opacity-60 dark:border-foreground/60"
        >
          {submitting ? "Publishing…" : "Publish"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-[10px] uppercase tracking-wide text-muted-strong underline underline-offset-2 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PostCommentsSection({
  postId,
  initialComments,
  currentUserDisplayName,
}: PostCommentsSectionProps) {
  const [comments, setComments] = useState<SerializableComment[]>(
    () => initialComments,
  );
  const [articleFormOpen, setArticleFormOpen] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const orderedComments = useMemo(() => {
    const next = [...comments];
    next.sort((a, b) => {
      const dateDiff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id);
    });
    return next;
  }, [comments]);

  const topLevelComments = useMemo(
    () => orderedComments.filter((c) => !c.parentId),
    [orderedComments],
  );

  const repliesByParentId = useMemo(() => {
    const map = new Map<string, SerializableComment[]>();
    for (const c of orderedComments) {
      if (!c.parentId) continue;
      const list = map.get(c.parentId) ?? [];
      list.push(c);
      map.set(c.parentId, list);
    }
    return map;
  }, [orderedComments]);

  function renderCommentThread(
    comment: SerializableComment,
    isTopLevel: boolean,
  ) {
    const replies = repliesByParentId.get(comment.id) ?? [];
    const createdAt = new Date(comment.createdAt);
    const dateLabel = createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <article
        key={comment.id}
        className={
          isTopLevel
            ? "space-y-2 border-b border-black/40 pb-3 last:border-b-0 dark:border-foreground/30"
            : "space-y-1"
        }
      >
        {comment.replySnippet ? (
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Responding to: &ldquo;{comment.replySnippet}&rdquo;
          </p>
        ) : null}
        <header className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-muted text-center">
            {`By ${comment.authorDisplayName}`}
            {dateLabel ? ` — ${dateLabel}` : null}
          </p>
        </header>
        <p className="post-article-body mt-1 whitespace-pre-wrap text-[11px] text-justify">
          {comment.content}
        </p>

        <div className="mt-2 flex justify-center">
          <LetterButton
            label="Respond to comment"
            size="small"
            onClick={() => {
              setArticleFormOpen(false);
              setReplyingToId((current) =>
                current === comment.id ? null : comment.id,
              );
            }}
            ariaLabel={`Respond to comment by ${comment.authorDisplayName}${
              comment.replySnippet
                ? `, responding to ${comment.replySnippet}`
                : ""
            }`}
          />
        </div>

        {replyingToId === comment.id ? (
          <CommentForm
            label={`Responding to ${comment.authorDisplayName}`}
            autoFocus
            onSubmit={async (content) => {
              await createComment(content, comment.id);
              setReplyingToId(null);
            }}
            onCancel={() => setReplyingToId(null)}
          />
        ) : null}

        {replies.length > 0 ? (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-black/20 dark:border-foreground/25">
            {replies.map((reply) =>
              renderCommentThread(reply, false),
            )}
          </div>
        ) : null}
      </article>
    );
  }

  async function createComment(content: string, parentId?: string | null) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId,
        content,
        parentId: parentId ?? null,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      const message =
        data?.error || "An unexpected error occurred while saving your comment.";
      throw new Error(message);
    }

    const created = (await res.json()) as SerializableComment;
    setComments((prev) => {
      const next = [...prev, created];
      next.sort((a, b) => {
        const dateDiff =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.id.localeCompare(b.id);
      });
      return next;
    });
  }

  return (
    <section className="space-y-4 border-t border-black pt-4 text-xs leading-relaxed dark:border-foreground">
      <header className="text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-strong">
          Responses
        </p>
      </header>

      <div className="flex justify-center">
        <LetterButton
          label="Respond to article"
          onClick={() => {
            setReplyingToId(null);
            setArticleFormOpen((open) => !open);
          }}
          ariaLabel="Respond to this article with a comment"
        />
      </div>

      {articleFormOpen ? (
        <CommentForm
          label={`Your response as ${currentUserDisplayName}`}
          autoFocus
          onSubmit={async (content) => {
            await createComment(content, null);
            setArticleFormOpen(false);
          }}
          onCancel={() => setArticleFormOpen(false)}
        />
      ) : null}

      <div className="space-y-4">
        {topLevelComments.map((comment) => renderCommentThread(comment, true))}

        {topLevelComments.length === 0 && !articleFormOpen ? (
          <p className="text-[10px] text-center text-muted">
            No responses yet. Be the first to add your thoughts to this story.
          </p>
        ) : null}
      </div>
    </section>
  );
}

