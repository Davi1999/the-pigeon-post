import { db } from "@/lib/db";
import { friendRequests, posts } from "@/db/schema";
import { user as userTable } from "@/db/auth-schema";
import { isPostImagePath } from "@/lib/postImages";
import { buildPublicImageUrl } from "@/lib/supabase-admin";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  featuredImage: string | null;
  authorDisplayName: string;
  createdAt: Date;
  isOwnPost: boolean;
};

type ParsedPostContent = {
  title: string;
  body: string;
  featuredImage: string | null;
};

/**
 * Posts store `{ title, body, featuredImagePath }` as JSON in posts.content.
 * Only a validated storage path is accepted; the public URL is built here so
 * arbitrary remote image URLs can never reach the renderer.
 */
function parsePostContent(content: string): ParsedPostContent {
  try {
    const parsed = JSON.parse(content) as {
      title?: unknown;
      body?: unknown;
      featuredImagePath?: unknown;
    };

    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      body: typeof parsed.body === "string" ? parsed.body : "",
      featuredImage: isPostImagePath(parsed.featuredImagePath)
        ? buildPublicImageUrl(parsed.featuredImagePath)
        : null,
    };
  } catch {
    return { title: "", body: content, featuredImage: null };
  }
}

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

/**
 * Parse cursor from "ISO_DATE:uuid" format.
 */
function parseCursor(cursor: string): { createdAt: Date; id: string } | null {
  // ISO timestamps contain colons, so split on the last one: the id (a UUID)
  // never contains a colon.
  const separator = cursor.lastIndexOf(":");
  if (separator === -1) return null;
  const createdAt = new Date(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
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

export async function getPostForUser(
  currentUserId: string,
  postId: string,
): Promise<FeedPost | null> {
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
    return null;
  }

  const [post] =
    (await db
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
      .where(and(eq(posts.id, postId), inArray(posts.authorId, authorIds)))
      .limit(1)) ?? [];

  if (!post) {
    return null;
  }

  const { title, body, featuredImage } = parsePostContent(post.content);

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
    featuredImage,
    authorDisplayName,
    createdAt: post.createdAt,
    isOwnPost,
  };
}

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
    const { title, body, featuredImage } = parsePostContent(post.content);

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
      featuredImage,
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
