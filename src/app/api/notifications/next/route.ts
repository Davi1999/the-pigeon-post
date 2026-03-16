import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { consumeNextNotificationForUser } from "@/lib/notifications";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ notification: null }, { status: 200 });
  }

  try {
    const notification = await consumeNextNotificationForUser(session.user.id);

    return NextResponse.json(
      { notification },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error fetching next notification:", error);
    return NextResponse.json(
      { notification: null },
      {
        status: 200,
      },
    );
  }
}

