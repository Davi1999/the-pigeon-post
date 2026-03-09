"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface NewPostFormProps {
  authorName: string;
  maxLength: number;
}

export default function NewPostForm({ authorName, maxLength }: NewPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = maxLength - body.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    if (!trimmedBody) {
      setError("Body is required.");
      return;
    }

    if (trimmedBody.length > maxLength) {
      setError(`Body must be at most ${maxLength.toLocaleString()} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          body: trimmedBody,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Unable to create post. Please try again.";
        setError(message);
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong while saving your post. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          Posting as <span className="font-medium text-foreground">{authorName}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Give your post a headline"
        />
        <p className="text-xs text-gray-400">
          Up to 200 characters. Make it punchy and clear.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="block text-sm font-medium">
          Body
        </label>
        <textarea
          id="body"
          name="body"
          rows={12}
          maxLength={maxLength}
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Write your dispatch here. Plain text only."
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {body.length.toLocaleString()} / {maxLength.toLocaleString()} characters
          </span>
          <span
            className={
              remaining <= Math.floor(maxLength * 0.1)
                ? "font-medium text-red-600"
                : "text-gray-400"
            }
          >
            {remaining.toLocaleString()} characters remaining
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => {
            setTitle("");
            setBody("");
            setError(null);
          }}
          disabled={isSubmitting}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Publishing…" : "Publish post"}
        </button>
      </div>
    </form>
  );
}

