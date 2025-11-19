import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import * as authSchema from "./schema/auth";
import * as zebraSchema from "./schema/zebra";

neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

const sql = neon(process.env.DATABASE_URL || "");

// Combine all schemas for full type inference
const schema = {
  ...authSchema,
  ...zebraSchema,
};

export const db = drizzle(sql, { schema });

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
