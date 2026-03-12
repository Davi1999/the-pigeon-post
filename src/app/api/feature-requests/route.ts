import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { createFeatureRequest } from "@/lib/featureRequests";

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
    !("description" in body)
  ) {
    return NextResponse.json(
      { error: "Both title and description are required." },
      { status: 400 },
    );
  }

  const { title, description } = body as {
    title: unknown;
    description: unknown;
  };

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Title must be a non-empty string." },
      { status: 400 },
    );
  }

  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json(
      { error: "Description must be a non-empty string." },
      { status: 400 },
    );
  }

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  const MAX_TITLE_LENGTH = 200;
  const MAX_DESCRIPTION_LENGTH = 5_000;

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      {
        error: `Title must be at most ${MAX_TITLE_LENGTH.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        error: `Description must be at most ${MAX_DESCRIPTION_LENGTH.toLocaleString()} characters.`,
      },
      { status: 400 },
    );
  }

  try {
    const created = await createFeatureRequest({
      authorId: session.user.id,
      title: trimmedTitle,
      description: trimmedDescription,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating feature request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the feature request." },
      { status: 500 },
    );
  }
}

