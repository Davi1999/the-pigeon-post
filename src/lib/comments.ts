import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { comments } from "@/db/schema";
import { user as userTable } from "@/db/auth-schema";

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorDisplayName: string;
  content: string;
  createdAt: Date;
  /**
   * If this comment is a reply, this is a short snippet of the parent
   * comment's content (first ~20 characters) for display in the UI.
   */
  replySnippet?: string | null;
};

export async function getCommentsForPost(
  postId: string,
  currentUserId?: string,
): Promise<PostComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      parentId: comments.parentId,
      content: comments.content,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: userTable.name,
      authorEmail: userTable.email,
    })
    .from(comments)
    .innerJoin(userTable, eq(comments.authorId, userTable.id))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt), asc(comments.id));

  // Build a map of comment content so we can compute reply snippets.
  const contentById = new Map<string, string>();
  for (const row of rows) {
    contentById.set(row.id, row.content);
  }

  const commentsList: PostComment[] = rows.map((row) => {
    const isOwnComment =
      currentUserId != null && row.authorId === currentUserId;
    const authorDisplayName =
      isOwnComment || !row.authorName
        ? isOwnComment
          ? "You"
          : row.authorEmail
        : row.authorName;

    let replySnippet: string | null = null;
    if (row.parentId) {
      const parentContent = contentById.get(row.parentId);
      if (parentContent) {
        const snippet = parentContent.slice(0, 20);
        replySnippet = snippet.length < parentContent.length ? `${snippet}…` : snippet;
      }
    }

    return {
      id: row.id,
      postId: row.postId,
      parentId: row.parentId,
      authorDisplayName,
      content: row.content,
      createdAt: row.createdAt,
      replySnippet,
    };
  });

  return commentsList;
}

