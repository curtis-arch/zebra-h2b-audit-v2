import { neon, neonConfig } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import * as authSchema from "./schema/auth";
import * as zebraSchema from "./schema/zebra";

neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

// Combine all schemas for full type inference
const schema = {
  ...authSchema,
  ...zebraSchema,
};

type Schema = typeof schema;

// Lazy initialization to avoid requiring DATABASE_URL at build time
let _db: NeonHttpDatabase<Schema> | null = null;

function initDb(): NeonHttpDatabase<Schema> {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Database connection is required at runtime."
      );
    }
    const sql = neon(connectionString);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as NeonHttpDatabase<Schema>, {
  get(target, prop) {
    const database = initDb();
    const value = database[prop as keyof typeof database];
    return typeof value === "function" ? value.bind(database) : value;
  },
});

// Export schemas for direct access
export { authSchema, zebraSchema };

// Re-export Drizzle ORM utilities for API package
export {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
// Export individual tables for convenience
export * from "./schema/auth";
export * from "./schema/zebra";
