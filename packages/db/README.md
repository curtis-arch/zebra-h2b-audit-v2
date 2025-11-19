# @zebra-h2b-audit-v2/db

Database package with Drizzle ORM for Neon PostgreSQL.

## Database Connection

Connected to Neon project: `still-snow-60472291` (zebra-data-parser-h2b)

**Current Data:**
- 198 grammar cohorts
- 289 configuration files
- 2,647 SKU positions
- 6,981 configuration options
- 2,436 extracted components

## Schema

### Tables

1. **config_grammar_cohort** - Groups of files with identical SKU structure
2. **config_file** - Individual configuration matrix files
3. **config_position** - SKU character positions with attribute meanings
4. **config_option** - Valid codes/values for each position
5. **config_file_blob** - Original file content storage (audit trail)
6. **config_option_component** - Extracted semantic components from descriptions

### Relationships

```
config_grammar_cohort (1) → (many) config_file
config_file (1) → (many) config_position
config_file (1) → (1) config_file_blob
config_position (1) → (many) config_option
config_option (1) → (many) config_option_component
```

## Usage in Web App

### Import the database client

```typescript
import { db } from "@zebra-h2b-audit-v2/db";
import { configFile, configPosition, configOption } from "@zebra-h2b-audit-v2/db";
```

### Example queries

```typescript
// Get all files for a base model
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

// Get options for a position
const options = await db
  .select()
  .from(configOption)
  .where(eq(configOption.positionId, positionId));

// Join file with cohort
const filesWithCohorts = await db
  .select({
    fileId: configFile.id,
    baseModel: configFile.baseModel,
    cohortHash: configGrammarCohort.signatureHash,
  })
  .from(configFile)
  .leftJoin(
    configGrammarCohort,
    eq(configFile.cohortId, configGrammarCohort.id)
  );
```

## Scripts

```bash
# Push schema changes to database (introspects existing schema)
bun run db:push

# Open Drizzle Studio (visual database browser)
bun run db:studio

# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate
```

## Environment Variables

Set in `apps/web/.env`:

```bash
DATABASE_URL=postgresql://neondb_owner:xxx@ep-snowy-breeze-xxx.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Type Inference

Drizzle automatically infers TypeScript types from the schema:

```typescript
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { configFile } from "@zebra-h2b-audit-v2/db";

// Infer types from schema
type ConfigFile = InferSelectModel<typeof configFile>;
type NewConfigFile = InferInsertModel<typeof configFile>;
```

## Notes

- **IMPORTANT:** The database schema already exists and contains production data
- DO NOT run migrations that would modify existing tables
- This package provides a read-only interface to the existing Zebra grammar database
- For schema changes, coordinate with the zebra-data-parser-h2b project
