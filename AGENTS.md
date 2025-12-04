# Project: Zebra H2B Audit v2

## Purpose
Dashboard for analyzing Zebra product configuration matrices. Parses SKU structures, groups files into grammar cohorts, and provides data exploration tools.

## Stack
- **Runtime:** Bun 1.3.0
- **Framework:** Next.js 16 + React 19 (App Router)
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Auth:** Better-Auth
- **API:** tRPC + TanStack Query
- **Linting:** Ultracite (Biome)

## Structure
```
apps/web/              # Next.js app (port 3001)
packages/
  api/                 # tRPC routers
  auth/                # Better-Auth config
  db/                  # Drizzle schema & client
```

## Commands
**Package Manager: Bun** (NEVER npm/yarn/pnpm)

```bash
bun install            # Install deps
bun dev                # Start all apps
bun dev:web            # Start web only (port 3001)
bun build              # Build all
bun run check          # Lint/format (Biome)
bun run check-types    # Type check all workspaces
bun run db:push        # Push schema to Neon
bun run db:studio      # Open Drizzle Studio
```

## Work Style
Act as **architect and delegator**:
- **DEFAULT TO DELEGATION** - Ask "can a subagent handle this?" before doing work yourself
- If task touches 3+ files or spans multiple domains, spawn parallel subagents
- Use `context-researcher` to fetch current docs before implementing
- Run independent subagent tasks in parallel (single message, multiple Task calls)
- Only do work yourself for single-file, single-domain tasks
- Verify subagent output before accepting

### Delegation Triggers
- Database/schema work -> `neon-drizzle-expert`
- Auth changes -> `better-auth-expert`
- UI components -> `frontend-ui-expert`
- API routes/tRPC -> `api-expert`
- Next.js routing/RSC -> `nextjs-16-expert`
- React hooks/components -> `react-19-expert`
- Type issues -> `typescript-expert`
- Deployment -> `vercel-expert`
- Need library docs -> `context-researcher` first, THEN specialist

## Tool Rules

**STOP. Read `agent_docs/tool-protocol.md` before any code task.**

| Task | Use This | NOT This |
|------|----------|----------|
| Package manager | **Bun only** | npm/yarn/pnpm |
| DB queries | **Neon MCP** | raw psql |
| File edits | `mcp__filesystem-with-morph__edit_file` | Read -> Edit chains |
| Code search | `warp_grep` or `ast-grep` | Grep -> Read chains |
| Browser debug | **chrome-devtools MCP** | push and pray |
| Library docs | **Context7 MCP** | WebSearch/guessing |

## Critical Rules
1. **No mock data** - use real DB/APIs (UI-only work excepted)
2. **Organize output** - tests to `agent_tests/<feature>/`, docs to `project-management/`
3. **Browser first** - use chrome-devtools MCP to verify before deploying
4. **Real packages** - check Context7 for current API before using libraries

## Additional Context
- `agent_docs/tool-protocol.md` - **READ FIRST** - MCP tool decision tree
- `agent_docs/infrastructure.md` - Neon project ID, deployment URLs
