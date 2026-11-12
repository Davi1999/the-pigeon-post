"use client";

import {
  useState,
  useEffect,
  useRef,
  FormEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  PrepareImageError,
  prepareImageForUpload,
} from "@/lib/prepareImage";

interface NewPostFormProps {
  authorName: string;
}

export default function NewPostForm({ authorName }: NewPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  /** Reuses an already-uploaded file when retrying a failed post creation. */
  const uploadedImageRef = useRef<{ file: File; path: string } | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Revoke the last object URL when the form unmounts.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  // The submit button sits below a tall textarea, so surface errors where the
  // user is looking instead of leaving the banner off-screen at the top.
  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  function selectImageFile(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setImageFile(file);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageError(null);
    uploadedImageRef.current = null;

    if (!file) {
      selectImageFile(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      selectImageFile(null);
      setImageError("Choose a JPEG, PNG, or WebP image.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    selectImageFile(file);
  }

  function clearImage() {
    selectImageFile(null);
    setImageError(null);
    uploadedImageRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadImage(file: File): Promise<string> {
    if (uploadedImageRef.current?.file === file) {
      return uploadedImageRef.current.path;
    }

    const prepared = await prepareImageForUpload(file);
    const formData = new FormData();
    formData.append("file", prepared);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(
        (data && typeof data.error === "string" && data.error) ||
          "Unable to upload the featured image. Please try again.",
      );
    }

    const data = (await response.json()) as { path?: string };

    if (!data.path) {
      throw new Error("Unable to upload the featured image. Please try again.");
    }

    uploadedImageRef.current = { file, path: data.path };
    return data.path;
  }

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

    setIsSubmitting(true);

    try {
      let featuredImagePath: string | null = null;

      if (imageFile) {
        featuredImagePath = await uploadImage(imageFile);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          body: trimmedBody,
          ...(featuredImagePath ? { featuredImagePath } : {}),
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
    } catch (caught) {
      setError(
        caught instanceof PrepareImageError || caught instanceof Error
          ? caught.message
          : "Something went wrong while saving your post. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-muted">
          Posting as <span className="font-medium text-foreground">{authorName}</span>
        </p>
      </div>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
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
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-soft focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground dark:border-foreground/40 dark:bg-foreground/5"
          placeholder="Give your post a headline"
        />
        <p className="text-xs text-muted-soft">
          Up to 200 characters. Make it punchy and clear.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="featuredImage" className="block text-sm font-medium">
          Featured image <span className="font-normal text-muted-soft">(optional)</span>
        </label>
        <input
          ref={fileInputRef}
          id="featuredImage"
          name="featuredImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          disabled={isSubmitting}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-muted-strong hover:file:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:file:border-foreground/40 dark:file:bg-foreground/10 dark:file:text-foreground dark:hover:file:bg-foreground/20"
        />
        <p className="text-xs text-muted-soft">
          JPEG, PNG, or WebP. Large images are resized automatically before upload.
        </p>
        {imageError && (
          <p className="text-xs text-red-600 dark:text-red-400">{imageError}</p>
        )}
        {previewUrl && (
          <div className="space-y-2">
            <img
              src={previewUrl}
              alt="Featured image preview"
              className="aspect-[16/9] max-h-[420px] w-full rounded-md border border-gray-300 object-cover dark:border-foreground/40"
            />
            <button
              type="button"
              onClick={clearImage}
              disabled={isSubmitting}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-muted-strong hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-foreground/40 dark:bg-transparent dark:text-foreground dark:hover:bg-foreground/10"
            >
              Remove image
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="block text-sm font-medium">
          Body
        </label>
        <textarea
          id="body"
          name="body"
          rows={12}
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-soft focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground dark:border-foreground/40 dark:bg-foreground/5"
          placeholder="Write your dispatch here. Plain text only."
        />
        <p className="text-xs text-muted-soft">
          {body.length.toLocaleString()} characters
        </p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-muted-strong hover:bg-gray-50 dark:border-foreground/40 dark:bg-transparent dark:text-foreground dark:hover:bg-foreground/10"
          onClick={() => {
            setTitle("");
            setBody("");
            setError(null);
            clearImage();
          }}
          disabled={isSubmitting}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Publishing…" : "Publish post"}
        </button>
      </div>
    </form>
  );
}
