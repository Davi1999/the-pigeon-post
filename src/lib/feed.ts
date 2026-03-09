import { db } from "@/lib/db";
import { friendRequests, posts } from "@/db/schema";
import { user as userTable } from "@/db/auth-schema";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  authorDisplayName: string;
  createdAt: Date;
  isOwnPost: boolean;
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

/**
 * Parse cursor from "ISO_DATE:uuid" format.
 */
function parseCursor(cursor: string): { createdAt: Date; id: string } | null {
  const colon = cursor.indexOf(":");
  if (colon === -1) return null;
  const createdAt = new Date(cursor.slice(0, colon));
  const id = cursor.slice(colon + 1);
  if (Number.isNaN(createdAt.getTime()) || !id) return null;
  return { createdAt, id };
}

/**
 * Encode last post for next cursor.
 */
function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}:${id}`;
}

export type GetFeedPostsPageOptions = {
  limit?: number;
  cursor?: string | null;
};

export type GetFeedPostsPageResult = {
  posts: FeedPost[];
  nextCursor: string | null;
};

export async function getFeedPostsPage(
  currentUserId: string,
  options: GetFeedPostsPageOptions = {},
): Promise<GetFeedPostsPageResult> {
  const limit = Math.min(
    options.limit ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const cursor = options.cursor ? parseCursor(options.cursor) : null;

  const acceptedFriendships = await db
    .select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      receiverId: friendRequests.receiverId,
    })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, "accepted"),
        or(
          eq(friendRequests.senderId, currentUserId),
          eq(friendRequests.receiverId, currentUserId),
        ),
      ),
    );

  const friendUserIds = acceptedFriendships.map((friendship) =>
    friendship.senderId === currentUserId
      ? friendship.receiverId
      : friendship.senderId,
  );

  const authorIds = [currentUserId, ...friendUserIds];

  if (authorIds.length === 0) {
    return { posts: [], nextCursor: null };
  }

  // Fetch limit+1 to know if there's a next page
  const cursorCondition = cursor
    ? or(
        lt(posts.createdAt, cursor.createdAt),
        and(
          eq(posts.createdAt, cursor.createdAt),
          lt(posts.id, cursor.id),
        ),
      )
    : undefined;

  const rawPosts = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      content: posts.content,
      createdAt: posts.createdAt,
      authorName: userTable.name,
      authorEmail: userTable.email,
    })
    .from(posts)
    .innerJoin(userTable, eq(posts.authorId, userTable.id))
    .where(
      cursorCondition
        ? and(inArray(posts.authorId, authorIds), cursorCondition)
        : inArray(posts.authorId, authorIds),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);

  const hasMore = rawPosts.length > limit;
  const slice = hasMore ? rawPosts.slice(0, limit) : rawPosts;

  const postsList: FeedPost[] = slice.map((post) => {
    let title = "";
    let body = "";

    try {
      const parsed = JSON.parse(post.content) as {
        title?: string;
        body?: string;
      };
      title = parsed.title ?? "";
      body = parsed.body ?? "";
    } catch {
      body = post.content;
    }

    const isOwnPost = post.authorId === currentUserId;
    const authorDisplayName =
      isOwnPost || !post.authorName
        ? isOwnPost
          ? "You"
          : post.authorEmail
          : post.authorName;

    return {
      id: post.id,
      title,
      body,
      authorDisplayName,
      createdAt: post.createdAt,
      isOwnPost,
    };
  });

  const nextCursor =
    hasMore && slice.length > 0
      ? encodeCursor(
          slice[slice.length - 1].createdAt,
          slice[slice.length - 1].id,
        )
      : null;

  return { posts: postsList, nextCursor };
}
