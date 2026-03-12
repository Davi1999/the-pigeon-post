import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  featureRequestLikes,
  featureRequests,
  type featureRequests as FeatureRequestsTable,
} from "@/db/schema";

export type FeatureRequestWithMeta = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  authorId: string;
  likeCount: number;
  likedByCurrentUser: boolean;
};

export async function createFeatureRequest(input: {
  authorId: string;
  title: string;
  description: string;
}): Promise<FeatureRequestWithMeta> {
  const [inserted] = await db
    .insert(featureRequests)
    .values({
      authorId: input.authorId,
      title: input.title,
      description: input.description,
    })
    .returning();

  return {
    id: inserted.id,
    title: inserted.title,
    description: inserted.description,
    createdAt: inserted.createdAt,
    authorId: inserted.authorId,
    likeCount: 0,
    likedByCurrentUser: false,
  };
}

export async function getFeatureRequestsWithLikeCounts(
  currentUserId: string,
): Promise<FeatureRequestWithMeta[]> {
  const rows = await db
    .select({
      id: featureRequests.id,
      title: featureRequests.title,
      description: featureRequests.description,
      createdAt: featureRequests.createdAt,
      authorId: featureRequests.authorId,
      likeCount: count(featureRequestLikes.id).as("like_count"),
    })
    .from(featureRequests)
    .leftJoin(
      featureRequestLikes,
      eq(featureRequests.id, featureRequestLikes.requestId),
    )
    .groupBy(
      featureRequests.id,
      featureRequests.title,
      featureRequests.description,
      featureRequests.createdAt,
      featureRequests.authorId,
    )
    .orderBy(desc(count(featureRequestLikes.id)), desc(featureRequests.createdAt));

  if (!rows.length) {
    return [];
  }

  const likedRows = await db
    .select({
      requestId: featureRequestLikes.requestId,
    })
    .from(featureRequestLikes)
    .where(eq(featureRequestLikes.userId, currentUserId));

  const likedSet = new Set(likedRows.map((row) => row.requestId));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt,
    authorId: row.authorId,
    likeCount: Number(row.likeCount),
    likedByCurrentUser: likedSet.has(row.id),
  }));
}

export async function addLikeToFeatureRequest(params: {
  requestId: string;
  userId: string;
}): Promise<void> {
  try {
    await db.insert(featureRequestLikes).values({
      requestId: params.requestId,
      userId: params.userId,
    });
  } catch (error) {
    // If the like already exists, ignore the error to make this idempotent.
    // drizzle-kit for pg throws a generic error; we can rely on the unique index
    // at the database level without special casing here.
    console.error("Error adding like to feature request:", error);
  }
}

