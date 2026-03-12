import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureRequestLikes } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";

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

  if (typeof body !== "object" || body === null || !("requestId" in body)) {
    return NextResponse.json(
      { error: "requestId is required." },
      { status: 400 },
    );
  }

  const { requestId } = body as { requestId: unknown };

  if (typeof requestId !== "string" || !requestId.trim()) {
    return NextResponse.json(
      { error: "requestId must be a non-empty string." },
      { status: 400 },
    );
  }

  const trimmedRequestId = requestId.trim();

  try {
    // Toggle like: if a like exists for this user/request, remove it; otherwise add it.
    const [existing] = await db
      .select({ id: featureRequestLikes.id })
      .from(featureRequestLikes)
      .where(
        and(
          eq(featureRequestLikes.requestId, trimmedRequestId),
          eq(featureRequestLikes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(featureRequestLikes)
        .where(eq(featureRequestLikes.id, existing.id));
    } else {
      await db.insert(featureRequestLikes).values({
        requestId: trimmedRequestId,
        userId: session.user.id,
      });
    }

    const [stats] = await db
      .select({
        likeCount: count(featureRequestLikes.id).as("like_count"),
      })
      .from(featureRequestLikes)
      .where(eq(featureRequestLikes.requestId, trimmedRequestId));

    const likeCount = stats ? Number(stats.likeCount) : 0;

    const [currentUserLike] = await db
      .select({
        id: featureRequestLikes.id,
      })
      .from(featureRequestLikes)
      .where(
        and(
          eq(featureRequestLikes.requestId, trimmedRequestId),
          eq(featureRequestLikes.userId, session.user.id),
        ),
      )
      .limit(1);

    return NextResponse.json(
      {
        likeCount,
        likedByCurrentUser: Boolean(currentUserLike),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error liking feature request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while liking the feature request." },
      { status: 500 },
    );
  }
}

