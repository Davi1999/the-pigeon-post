import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { notifications, notificationViews } from "@/db/schema";

export type UserNotification = {
  id: string;
  body: string;
  link: string | null;
  createdAt: Date;
};

export async function consumeNextNotificationForUser(
  userId: string,
): Promise<UserNotification | null> {
  const candidates = await db
    .select({
      id: notifications.id,
      body: notifications.body,
      link: notifications.link,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(25);

  if (!candidates.length) {
    return null;
  }

  const ids = candidates.map((c) => c.id);

  const seen = await db
    .select({ notificationId: notificationViews.notificationId })
    .from(notificationViews)
    .where(
      and(
        eq(notificationViews.userId, userId),
        inArray(notificationViews.notificationId, ids),
      ),
    );

  const seenIds = new Set(seen.map((s) => s.notificationId));

  const next = candidates.find((c) => !seenIds.has(c.id));

  if (!next) {
    return null;
  }

  await db.insert(notificationViews).values({
    notificationId: next.id,
    userId,
  });

  return {
    id: next.id,
    body: next.body,
    link: next.link,
    createdAt: next.createdAt,
  };
}

