import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posts } from "@/db/schema";
import { getFeedPostsPage } from "@/lib/feed";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 12, 50) : 12;
  const cursor = searchParams.get("cursor") ?? undefined;

  const { posts: feedPosts, nextCursor } = await getFeedPostsPage(
    session.user.id,
    { limit, cursor: cursor || null },
  );

  return NextResponse.json({
    posts: feedPosts,
    nextCursor,
  });
}

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
    !("title" in body) ||
    !("body" in body)
  ) {
    return NextResponse.json(
      { error: "Both title and body are required." },
      { status: 400 },
    );
  }

  const rawTitle = (body as { title: unknown }).title;
  const rawContent = (body as { body: unknown }).body;

  if (typeof rawTitle !== "string" || typeof rawContent !== "string") {
    return NextResponse.json(
      { error: "Title and body must be strings." },
      { status: 400 },
    );
  }

  const title = rawTitle.trim();
  const contentBody = rawContent.trim();

  if (!title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 },
    );
  }

  if (title.length > 200) {
    return NextResponse.json(
      { error: "Title must be at most 200 characters." },
      { status: 400 },
    );
  }

  if (!contentBody) {
    return NextResponse.json(
      { error: "Body is required." },
      { status: 400 },
    );
  }

  const MAX_LENGTH = 10_000;

  if (contentBody.length > MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Body must be at most ${MAX_LENGTH.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  const combinedContent = JSON.stringify({
    title,
    body: contentBody,
  });

  try {
    const [inserted] = await db
      .insert(posts)
      .values({
        authorId: session.user.id,
        content: combinedContent,
      })
      .returning({
        id: posts.id,
      });

    return NextResponse.json(
      {
        id: inserted.id,
        success: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the post." },
      { status: 500 },
    );
  }
}

