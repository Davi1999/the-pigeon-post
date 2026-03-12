import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { siteUpdates } from "@/db/schema";

export type SiteUpdate = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
};

export async function getLatestUpdates(limit = 50): Promise<SiteUpdate[]> {
  const rows = await db
    .select({
      id: siteUpdates.id,
      title: siteUpdates.title,
      body: siteUpdates.body,
      createdAt: siteUpdates.createdAt,
    })
    .from(siteUpdates)
    .orderBy(desc(siteUpdates.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
  }));
}

