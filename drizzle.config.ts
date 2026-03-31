import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  for (const path of [".env.local", ".env"]) {
    try {
      const lines = readFileSync(path, "utf8").split(/\r?\n/);
      const databaseUrl = lines
        .map((line) => line.trim())
        .find((line) => line.startsWith("DATABASE_URL="))
        ?.slice("DATABASE_URL=".length);

      if (databaseUrl) {
        return databaseUrl;
      }
    } catch {
      continue;
    }
  }

  return "postgres://localhost:5432/breathe";
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: readDatabaseUrl(),
  },
});
