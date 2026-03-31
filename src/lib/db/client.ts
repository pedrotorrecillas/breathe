import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let databaseClient: ReturnType<typeof drizzle> | null = null;
let sqlClient: postgres.Sql | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!sqlClient) {
    sqlClient = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: false,
    });
  }

  if (!databaseClient) {
    databaseClient = drizzle(sqlClient);
  }

  return databaseClient;
}
