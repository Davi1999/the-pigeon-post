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
      className="mt-3 space-y-2 border border-dashed border-black/30 bg-[#f5ecd8]/40 p-3 text-xs"
    >
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </label>
      <textarea
        className="mt-1 block h-24 w-full resize-vertical border border-black/40 bg-white px-2 py-1 text-[11px] leading-relaxed text-justify outline-none focus-visible:ring-2 focus-visible:ring-black"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        disabled={submitting}
      />
      {error ? (
        <p className="text-[10px] text-red-600">{error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center border border-black/40 bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#f5ecd8] disabled:opacity-60"
        >
          {submitting ? "Publishing…" : "Publish"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-[10px] uppercase tracking-wide text-gray-600 underline underline-offset-2 disabled:opacity-60"
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
    <section className="space-y-4 border-t border-black pt-4 text-xs leading-relaxed">
      <header className="text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600">
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
        {topLevelComments.map((comment) => {
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
              className="space-y-2 border-b border-black/40 pb-3 last:border-b-0"
            >
              <header className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 text-center">
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
                  ariaLabel={`Respond to comment by ${comment.authorDisplayName}`}
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
                <div className="mt-3 space-y-3">
                  {replies.map((reply) => {
                    const replyCreatedAt = new Date(reply.createdAt);
                    const replyDateLabel = replyCreatedAt.toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    );

                    // Fallback snippet if for some reason replySnippet is missing.
                    let snippet = reply.replySnippet;
                    if (!snippet && comment.content) {
                      const raw = comment.content.slice(0, 20);
                      snippet =
                        raw.length < comment.content.length
                          ? `${raw}…`
                          : raw;
                    }

                    return (
                      <article key={reply.id} className="space-y-1">
                        {snippet ? (
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">
                            Responding to: “{snippet}”
                          </p>
                        ) : null}
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">
                          {`By ${reply.authorDisplayName}`}
                          {replyDateLabel ? ` — ${replyDateLabel}` : null}
                        </p>
                        <p className="post-article-body mt-1 whitespace-pre-wrap text-[11px] text-justify">
                          {reply.content}
                        </p>
                        <div className="mt-2 flex justify-center">
                          <LetterButton
                            label="Respond to comment"
                            size="small"
                            onClick={() => {
                              setArticleFormOpen(false);
                              setReplyingToId((current) =>
                                current === reply.id ? null : reply.id,
                              );
                            }}
                            ariaLabel={`Respond to reply by ${reply.authorDisplayName}${
                              snippet ? `, responding to ${snippet}` : ""
                            }`}
                          />
                        </div>
                        {replyingToId === reply.id ? (
                          <CommentForm
                            label={`Responding to ${reply.authorDisplayName}`}
                            autoFocus
                            onSubmit={async (content) => {
                              await createComment(content, reply.id);
                              setReplyingToId(null);
                            }}
                            onCancel={() => setReplyingToId(null)}
                          />
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}

        {topLevelComments.length === 0 && !articleFormOpen ? (
          <p className="text-[10px] text-center text-gray-500">
            No responses yet. Be the first to add your thoughts to this story.
          </p>
        ) : null}
      </div>
    </section>
  );
}

