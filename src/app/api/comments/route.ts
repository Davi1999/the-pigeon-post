import { NextResponse, after } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments } from "@/db/schema";
import { user as userTable } from "@/db/auth-schema";
import { getPostForUser, getPostNotificationDetails } from "@/lib/feed";
import {
  sendCommentReplyNotificationEmail,
  sendReplyNotificationEmail,
} from "@/lib/email";
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
    let parentComment: {
      authorId: string;
      authorName: string | null;
      authorEmail: string;
      content: string;
    } | null = null;

    if (inserted.parentId) {
      const [parent] = await db
        .select({
          authorId: comments.authorId,
          authorName: userTable.name,
          authorEmail: userTable.email,
          content: comments.content,
        })
        .from(comments)
        .innerJoin(userTable, eq(comments.authorId, userTable.id))
        .where(eq(comments.id, inserted.parentId))
        .limit(1);

      if (parent) {
        parentComment = parent;
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

    // Notify the post author and/or the author of the comment being replied
    // to. This runs after the response is sent so Resend latency never blocks
    // publishing.
    const shouldNotifyPostAuthor = !post.isOwnPost;
    const shouldNotifyParentAuthor =
      parentComment != null && parentComment.authorId !== session.user.id;

    if (shouldNotifyPostAuthor || shouldNotifyParentAuthor) {
      const commenterName = session.user.name?.trim() || "Someone";
      const isReplyToComment = inserted.parentId != null;

      after(async () => {
        try {
          const details = await getPostNotificationDetails(postId);

          if (!details) {
            return;
          }

          const postTitle = post.title || details.title;

          if (details.authorId !== session.user.id) {
            await sendReplyNotificationEmail({
              to: details.authorEmail,
              recipientName: details.authorName,
              postId,
              postTitle,
              commenterName,
              commentContent: trimmedContent,
              isReplyToComment,
            });
          }

          // The post author already received the email above, so only notify
          // the parent comment author when they are a different person.
          if (
            parentComment &&
            parentComment.authorId !== session.user.id &&
            parentComment.authorId !== details.authorId
          ) {
            await sendCommentReplyNotificationEmail({
              to: parentComment.authorEmail,
              recipientName: parentComment.authorName,
              postId,
              postTitle,
              commenterName,
              commentContent: trimmedContent,
              originalCommentContent: parentComment.content,
            });
          }
        } catch (error) {
          console.error("Error sending comment notification email:", error);
        }
      });
    }

    return NextResponse.json(responseComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the comment." },
      { status: 500 },
    );
  }
}

