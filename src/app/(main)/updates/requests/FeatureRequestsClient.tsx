"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/Button";

export type FeatureRequestClientModel = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  likeCount: number;
  likedByCurrentUser: boolean;
};

type Props = {
  initialRequests: FeatureRequestClientModel[];
};

export function FeatureRequestsClient({ initialRequests }: Props) {
  const router = useRouter();
  const [requests, setRequests] =
    useState<FeatureRequestClientModel[]>(initialRequests);
  const [isSubmitting, startSubmitting] = useTransition();
  const [isLikingId, setIsLikingId] = useState<string | null>(null);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title || !description) {
      return;
    }

    startSubmitting(() => {
      void (async () => {
        await fetch("/api/feature-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, description }),
        });

        formElement.reset();
        router.refresh();
      })();
    });
  }

  async function handleLike(requestId: string, currentlyLiked: boolean) {
    if (isLikingId === requestId) return;

    setIsLikingId(requestId);

    // Optimistic update
    setRequests((prev) =>
      prev
        .map((req) =>
          req.id === requestId
            ? {
                ...req,
                likedByCurrentUser: !currentlyLiked,
                likeCount: Math.max(
                  0,
                  req.likeCount + (currentlyLiked ? -1 : 1),
                ),
              }
            : req,
        )
        .sort((a, b) => {
          if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }),
    );

    try {
      const res = await fetch("/api/feature-request-likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          likeCount: number;
          likedByCurrentUser: boolean;
        };
        setRequests((prev) =>
          prev
            .map((req) =>
              req.id === requestId
                ? {
                    ...req,
                    likeCount: data.likeCount,
                    likedByCurrentUser: data.likedByCurrentUser,
                  }
                : req,
            )
            .sort((a, b) => {
              if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            }),
        );
      } else {
        router.refresh();
      }
    } catch {
      router.refresh();
    } finally {
      setIsLikingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="border bg-background px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Request a new feature
        </h2>
        <p className="mt-1 text-[11px] text-gray-600">
          Tell us what you&apos;d like to see next in The Pigeon Post. The most
          liked ideas rise to the top of the stack.
        </p>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="title"
              className="text-[10px] font-semibold uppercase tracking-wide text-gray-600"
            >
              Headline
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="w-full border px-2 py-1 text-xs"
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="description"
              className="text-[10px] font-semibold uppercase tracking-wide text-gray-600"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="w-full border px-2 py-1 text-xs"
              rows={4}
              maxLength={5000}
              required
            />
          </div>
          <button
            type="submit"
            className={buttonVariants({ variant: "primary" })}
            disabled={isSubmitting}
          >
            <span className="text-xs uppercase tracking-wide">
              Submit feature request
            </span>
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-center text-xs text-gray-600">
            No feature requests yet. Be the first to file a story.
          </p>
        ) : (
          requests.map((request) => (
            <article
              key={request.id}
              className="space-y-2 border bg-background px-4 py-3"
            >
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    {request.title}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    isLikingId === request.id
                      ? undefined
                      : handleLike(request.id, request.likedByCurrentUser)
                  }
                  disabled={isLikingId === request.id}
                  className={buttonVariants({
                    variant: request.likedByCurrentUser ? "primary" : "secondary",
                    size: "sm",
                  })}
                >
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
                    <img
                      src="/thumb-up.png"
                      alt="Like feature request"
                      className="h-5 w-5"
                    />
                    <span>{request.likeCount}</span>
                  </span>
                </button>
              </header>
              <p className="post-article-body whitespace-pre-wrap text-[11px] text-justify">
                {request.description}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

