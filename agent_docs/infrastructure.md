# Infrastructure

## Database (Neon)

| Property | Value |
|----------|-------|
| Project Name | `zebra-data-parser-h2b` |
| Project ID | `still-snow-60472291` |
| Region | `aws-us-east-1` |
| PostgreSQL Version | 17 |
| Organization | CURTIS Digital Inc |

### Tables (Zebra Domain)
- `config_file` - Configuration matrix files
- `config_position` - SKU character positions with attribute meanings
- `config_option` - Valid codes/values for each position
- `config_grammar_cohort` - Groups of files with identical SKU structure
- `config_option_component` - Extracted semantic components from options
- `config_file_blob` - Raw file content storage

### Tables (Auth)
- `user`, `session`, `account`, `verification` (Better-Auth managed)

## Deployment

| Environment | URL |
|-------------|-----|
| Production | Vercel (check `.vercel/project.json` for project ID) |
| Local Dev | `http://localhost:3001` |

## Environment Variables

Required in `apps/web/.env`:
- `DATABASE_URL` - Neon connection string
- `BETTER_AUTH_SECRET` - Auth token secret
- `BETTER_AUTH_URL` - App URL (localhost:3001 for dev)
- `CORS_ORIGIN` - Allowed CORS origin

## Key File Locations

| What | Where |
|------|-------|
| tRPC Routers | `packages/api/src/routers/` |
| Drizzle Schema | `packages/db/src/schema/` |
| Auth Config | `packages/auth/src/index.ts` |
| UI Components | `apps/web/src/components/` |
| App Pages | `apps/web/src/app/` |
