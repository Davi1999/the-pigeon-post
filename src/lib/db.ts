import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// TODO: Use provider CA cert (e.g. DATABASE_CA_CERT) with ssl: { ca } and keep
// rejectUnauthorized true for proper server verification instead of disabling it.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool);

export const db = drizzle(pool);