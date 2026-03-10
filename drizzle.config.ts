import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL!;
const isLocal = databaseUrl.includes("localhost");

// Parse DATABASE_URL for drizzle CLI dbCredentials
const parsed = new URL(databaseUrl.replace(/^postgres:\/\//, "https://"));

export default defineConfig({
  schema: ["./src/db/auth-schema.ts", "./src/db/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1).split("?")[0],
    ssl: isLocal ? false : { rejectUnauthorized: false },
  },
});