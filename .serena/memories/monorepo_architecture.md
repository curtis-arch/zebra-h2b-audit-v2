# Monorepo Architecture

## Workspace Structure

This project uses **Turborepo** with **Bun workspaces** for monorepo management.

### Apps (`apps/`)

#### `apps/web`
- **Purpose**: Main Next.js 16 application
- **Port**: 3001
- **Key Features**:
  - React 19.2.0 with React Compiler
  - Tailwind CSS 4.1 styling
  - shadcn/ui components with Radix UI
  - Tanstack React Form for forms
  - Tanstack React Query for state management
  - next-themes for theme switching
  - Sonner for toast notifications
- **Dependencies**: Uses workspace packages `@zebra-h2b-audit-v2/api` and `@zebra-h2b-audit-v2/auth`
- **Scripts**:
  - `dev`: Runs on port 3001
  - `build`: Builds Next.js app
  - `start`: Starts production server

### Packages (`packages/`)

#### `packages/api`
- **Purpose**: tRPC API layer and business logic
- **Usage**: Imported by apps to access type-safe API endpoints
- **Contains**: tRPC routers, procedures, and business logic

#### `packages/auth`
- **Purpose**: Authentication configuration and utilities
- **Tech**: better-auth
- **Usage**: Shared auth setup across apps

#### `packages/db`
- **Purpose**: Database layer
- **Tech**: Drizzle ORM with PostgreSQL
- **Contains**: Schema definitions, migrations, queries
- **Scripts**:
  - `db:push`: Push schema to database
  - `db:studio`: Open Drizzle Studio
  - `db:generate`: Generate migrations
  - `db:migrate`: Run migrations

#### `packages/config`
- **Purpose**: Shared configuration files
- **Contains**: TypeScript configs, shared constants

## Workspace Catalog

The root `package.json` defines a workspace catalog for dependency versioning:
```json
"catalog": {
  "next": "16.0.0",
  "zod": "^4.1.12",
  "@trpc/server": "^11.5.0",
  "@trpc/client": "^11.5.0",
  "better-auth": "^1.3.28",
  "dotenv": "^17.2.2"
}
```

Workspaces reference catalog versions with `"package": "catalog:"`.

## Turborepo Pipeline

From `turbo.json`, the build pipeline includes:

### Cached Tasks
- **build**: Builds with dependency outputs, includes `.env*` as input
- **lint**: Lints with dependency outputs
- **check-types**: Type checks with dependency outputs

### Uncached Tasks (persistent)
- **dev**: Development server
- **db:push**: Database schema push
- **db:studio**: Database UI
- **db:migrate**: Run migrations
- **db:generate**: Generate migrations

## Cross-Workspace Dependencies

```
apps/web
├── depends on: @zebra-h2b-audit-v2/api
├── depends on: @zebra-h2b-audit-v2/auth
└── depends on: @zebra-h2b-audit-v2/config (dev)

packages/api
├── depends on: @zebra-h2b-audit-v2/db
└── depends on: @zebra-h2b-audit-v2/auth

packages/auth
└── depends on: @zebra-h2b-audit-v2/db
```

## Environment Files

- Root `.env`: Global environment variables
- `apps/web/.env`: Web-specific variables (DB connection, etc.)
- `.env.example` files: Templates for required variables

## Adding New Packages

```bash
# Create new workspace package
mkdir -p packages/new-package
cd packages/new-package
bun init

# Reference it from other workspaces
bun add @zebra-h2b-audit-v2/new-package --filter web
```