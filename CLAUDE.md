# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack TypeScript monorepo built with:
- **Next.js 16** with App Router
- **tRPC** for end-to-end type-safe APIs
- **Drizzle ORM** with PostgreSQL (Neon)
- **Better-Auth** for authentication
- **Turborepo** for monorepo management
- **Bun** as package manager (v1.3.0)
- **Ultracite** (Biome) for linting/formatting

## Development Commands

### Setup
```bash
bun install                    # Install dependencies
bun run db:push                # Push schema changes to database
```

### Development
```bash
bun run dev                    # Start all apps in dev mode
bun run dev:web                # Start only web app (port 3001)
bun run dev:native             # Start only native app
```

### Building & Type Checking
```bash
bun run build                  # Build all apps
bun run check-types            # Type check all workspaces
bun run check                  # Run Biome linter/formatter (auto-fix)
```

### Database Operations
```bash
bun run db:push                # Push schema to database
bun run db:studio              # Open Drizzle Studio UI
bun run db:generate            # Generate migrations
bun run db:migrate             # Run migrations
```

All database commands target the `@zebra-h2b-audit-v2/db` package and read from `apps/web/.env`.

## Architecture

### Monorepo Structure

```
zebra-h2b-audit-v2/
├── apps/
│   └── web/                   # Next.js application (port 3001)
└── packages/
    ├── api/                   # tRPC routers & procedures
    ├── auth/                  # Better-Auth configuration
    ├── db/                    # Drizzle schema & database client
    └── config/                # Shared TypeScript configs
```

### Package Dependencies

- `web` → `api`, `auth`
- `api` → `auth`, `db`
- `auth` → `db`
- All packages → `config`

### tRPC Setup

**API Layer** (`packages/api/`):
- `src/index.ts` - Exports base tRPC builder (`t`, `router`, `publicProcedure`, `protectedProcedure`)
- `src/context.ts` - Creates request context with Better-Auth session
- `src/routers/` - tRPC routers (combined into `appRouter`)

**Web Integration** (`apps/web/`):
- `src/app/api/trpc/[trpc]/route.ts` - Next.js API route handler
- `src/utils/trpc.ts` - Client-side tRPC setup with TanStack Query

**Adding New Procedures**:
1. Create/edit router in `packages/api/src/routers/`
2. Export from `packages/api/src/routers/index.ts`
3. Use `publicProcedure` (unauthenticated) or `protectedProcedure` (requires session)

### Database Schema

**Location**: `packages/db/src/schema/`

**Current Tables** (in `auth.ts`):
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth/credential providers
- `verification` - Email verification tokens

**Adding Tables/Columns**:
1. Edit or create schema file in `packages/db/src/schema/`
2. Export from `packages/db/src/index.ts`
3. Run `bun run db:push` to sync with database
4. For production, use `bun run db:generate` then `bun run db:migrate`

**Drizzle Config**: `packages/db/drizzle.config.ts` reads `DATABASE_URL` from `apps/web/.env`

### Authentication

**Better-Auth** configured in `packages/auth/src/index.ts`:
- Uses Drizzle adapter with PostgreSQL
- Email/password authentication enabled
- Next.js cookies plugin for session management

**Session Access**:
- In tRPC: `ctx.session` (available in all procedures via context)
- Use `protectedProcedure` to enforce authentication

### Workspace Catalog

The root `package.json` defines a catalog for shared dependency versions:
```json
"catalog": {
  "next": "16.0.0",
  "zod": "^4.1.12",
  "@trpc/server": "^11.5.0",
  "@trpc/client": "^11.5.0",
  "better-auth": "^1.3.28"
}
```

Packages reference catalog entries with `"package": "catalog:"` syntax.

## Environment Setup

**Required**: `apps/web/.env` file with:
```
DATABASE_URL=              # PostgreSQL connection string (Neon)
BETTER_AUTH_SECRET=        # Secret for auth tokens
BETTER_AUTH_URL=          # Application URL (http://localhost:3001)
CORS_ORIGIN=              # Allowed CORS origin
```

Copy `apps/web/.env.example` and fill in values.

## Code Standards

This project uses **Ultracite** (Biome preset) - see existing `.claude/CLAUDE.md` for complete standards.

**Key Points**:
- Run `bun run check` before committing
- React 19: use `ref` as prop (not `forwardRef`)
- Next.js: use Server Components by default
- TypeScript: explicit types for function params/returns
- Use `for...of` over `.forEach()`
- Extract magic numbers to named constants
