# Neon Database + Drizzle Setup Complete ✅

## Overview

Successfully connected the `zebra-h2b-audit-v2` project to the existing Neon PostgreSQL database containing Zebra configuration grammar data.

## What Was Done

### 1. Environment Variables (`apps/web/.env`)
- ✅ Set `DATABASE_URL` to Neon project `still-snow-60472291`
- ✅ Configured connection string with `sslmode=require&channel_binding=require`
- ✅ Already had `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `CORS_ORIGIN`

### 2. Drizzle Schema (`packages/db/src/schema/zebra.ts`)
Created complete schema matching existing database:

**6 Tables:**
1. `configGrammarCohort` - 198 grammar cohorts (groups of files with identical SKU structure)
2. `configFile` - 289 configuration matrix files
3. `configPosition` - 2,647 SKU character positions with attribute meanings
4. `configOption` - 6,981 valid codes/values for each position
5. `configFileBlob` - 289 original file content blobs (audit trail)
6. `configOptionComponent` - 2,436 extracted semantic components

**Relationships:**
- `cohort → files` (1:many)
- `file → positions` (1:many)
- `file → blob` (1:1)
- `position → options` (1:many)
- `option → components` (1:many)

**Features:**
- ✅ Proper foreign keys with `onDelete: cascade`
- ✅ Unique constraints matching database
- ✅ Indexes for performance
- ✅ TypeScript type inference via Drizzle
- ✅ Full JSDoc comments for IntelliSense

### 3. Exports (`packages/db/src/index.ts`)
- ✅ Combined auth + zebra schemas
- ✅ Exported `db` client with full schema typing
- ✅ Exported all individual tables for direct import
- ✅ Configured for Neon serverless HTTP driver

### 4. Database Connection
**Verified:**
- ✅ Connection to `still-snow-60472291` project works
- ✅ All 6 tables are accessible
- ✅ Queries return correct row counts
- ✅ Joins between tables work correctly
- ✅ Type inference works properly

## Usage Examples

### Import in your Next.js app

```typescript
import { db, configFile, configPosition, configOption } from "@zebra-h2b-audit-v2/db";
import { eq } from "drizzle-orm";

// Get all MC3300 files
const mc3300Files = await db
  .select()
  .from(configFile)
  .where(eq(configFile.baseModel, "MC3300"));

// Get positions for a file
const positions = await db
  .select()
  .from(configPosition)
  .where(eq(configPosition.fileId, fileId))
  .orderBy(configPosition.positionIndex);
```

### Type inference

```typescript
import { type InferSelectModel } from "drizzle-orm";
import { configFile } from "@zebra-h2b-audit-v2/db";

type ConfigFile = InferSelectModel<typeof configFile>;
// {
//   id: number;
//   baseModel: string | null;
//   productCode: string | null;
//   specStyle: string;
//   cohortId: number | null;
//   ...
// }
```

## Available Commands

```bash
# From project root
bun run db:push      # Introspect and sync schema
bun run db:studio    # Open Drizzle Studio (visual browser)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations

# From packages/db
cd packages/db
bun run db:push
bun run db:studio
```

## Database Info

**Neon Project:** `still-snow-60472291`
**Database:** `neondb`
**Region:** aws-us-east-1
**PostgreSQL:** 17

**Connection String Location:**
`/Users/johncurtis/projects/zebra-h2b-audit-v2/apps/web/.env`

## Current Data Snapshot

As of 2025-11-19:
- 289 configuration files parsed (96% coverage)
- 198 unique grammar cohorts identified
- 150 unique base models (e.g., MC3300, TC52, ZD)
- Average 9.2 positions per file
- 2,436 semantic components extracted

## Important Notes

⚠️ **READ-ONLY INTERFACE**
This database is managed by the `zebra-data-parser-h2b` project. The web app should primarily query data, not modify the schema.

⚠️ **PRODUCTION DATA**
The database contains real parsed configuration data. Handle carefully.

✅ **READY TO USE**
You can now build queries, Server Actions, tRPC procedures, etc. using the Drizzle ORM with full type safety!

## Next Steps

1. Create Server Actions in `apps/web/src/actions/` to query grammar data
2. Build tRPC routers in `packages/api/src/routers/` for type-safe API
3. Create React Server Components to display configurations
4. Consider adding Drizzle relations for easier joins:
   ```typescript
   export const configFileRelations = relations(configFile, ({ one, many }) => ({
     cohort: one(configGrammarCohort, {
       fields: [configFile.cohortId],
       references: [configGrammarCohort.id],
     }),
     positions: many(configPosition),
   }));
   ```

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Neon Serverless Driver](https://github.com/neondatabase/serverless)
- [Database README](./packages/db/README.md)
- [Original Schema SQL](../zebra-data-parser-h2b/sql/)

---

Setup completed: 2025-11-19
Database package: `@zebra-h2b-audit-v2/db`
Schema version: Matching production (2 migrations applied)
