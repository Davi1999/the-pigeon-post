import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments } from "@/db/schema";
import { getPostForUser } from "@/lib/feed";
import type { PostComment } from "@/lib/comments";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("postId" in body) ||
    !("content" in body)
  ) {
    return NextResponse.json(
      { error: "Both postId and content are required." },
      { status: 400 },
    );
  }

  const { postId, content, parentId } = body as {
    postId: unknown;
    content: unknown;
    parentId?: unknown;
  };

  if (typeof postId !== "string" || !postId.trim()) {
    return NextResponse.json(
      { error: "postId must be a non-empty string." },
      { status: 400 },
    );
  }

  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "content must be a string." },
      { status: 400 },
    );
  }

  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return NextResponse.json(
      { error: "Comment content is required." },
      { status: 400 },
    );
  }

  const MAX_LENGTH = 5_000;
  if (trimmedContent.length > MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Comment must be at most ${MAX_LENGTH.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  let parentIdValue: string | null = null;
  if (parentId != null) {
    if (typeof parentId !== "string" || !parentId.trim()) {
      return NextResponse.json(
        { error: "parentId, if provided, must be a non-empty string." },
        { status: 400 },
      );
    }
    parentIdValue = parentId;
  }

  // Ensure the current user has access to this post before allowing comments.
  const post = await getPostForUser(session.user.id, postId);
  if (!post) {
    return NextResponse.json(
      { error: "You do not have access to this post." },
      { status: 404 },
    );
  }

  try {
    const [inserted] = await db
      .insert(comments)
      .values({
        postId,
        authorId: session.user.id,
        parentId: parentIdValue,
        content: trimmedContent,
      })
      .returning({
        id: comments.id,
        postId: comments.postId,
        parentId: comments.parentId,
        content: comments.content,
        createdAt: comments.createdAt,
      });

    let replySnippet: string | null = null;
    if (inserted.parentId) {
      const [parent] = await db
        .select({
          content: comments.content,
        })
        .from(comments)
        .where(eq(comments.id, inserted.parentId))
        .limit(1);

      if (parent?.content) {
        const snippet = parent.content.slice(0, 20);
        replySnippet =
          snippet.length < parent.content.length ? `${snippet}…` : snippet;
      }
    }

    const responseComment: PostComment = {
      id: inserted.id,
      postId: inserted.postId,
      parentId: inserted.parentId,
      content: inserted.content,
      createdAt: inserted.createdAt,
      authorDisplayName: "You",
      replySnippet,
    };

    return NextResponse.json(responseComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the comment." },
      { status: 500 },
    );
  }
}

