# Tool Protocol - READ BEFORE ANY CODE TASK

## Decision Tree

```
Need to understand code?
├── Architectural question → warp_grep (natural language query)
├── Find specific pattern → ast-grep find_code
└── Single known file → Read (only if path is certain)

Need to edit code?
├── Any edit → mcp__filesystem-with-morph__edit_file
└── NEVER: Read → Edit chains (wasteful, context pollution)

Need library docs?
├── First → Context7 resolve-library-id
├── Then → Context7 get-library-docs
└── NEVER: WebSearch guessing, stale knowledge

Need to verify UI?
├── Take snapshot → chrome-devtools take_snapshot
├── Check console → chrome-devtools list_console_messages
├── Screenshot → chrome-devtools take_screenshot
└── NEVER: Push and pray

Need database info?
├── List tables → Neon MCP get_database_tables
├── Schema → Neon MCP describe_table_schema
├── Query → Neon MCP run_sql
└── NEVER: raw psql commands

Need to search files?
├── Code patterns → ast-grep find_code
├── Semantic search → warp_grep
└── Simple text → Grep (only if pattern is literal)
```

## Anti-Patterns to Avoid

| Bad Pattern | Why It's Bad | Do This Instead |
|-------------|--------------|-----------------|
| `Read → Read → Read` chains | Context pollution, slow | Single warp_grep query |
| `Read → Edit` | Wastes context | Direct edit_file |
| `Grep → Read → Grep` | Inefficient exploration | warp_grep semantic search |
| Guessing library APIs | Stale knowledge, errors | Context7 docs first |
| Raw psql commands | Bypasses safety, verbose | Neon MCP tools |
| Push to prod untested | UI bugs in production | chrome-devtools first |

## Tool Quick Reference

### Semantic Code Search
```
mcp__filesystem-with-morph__warpgrep_codebase_search
- Use for: "Where is X handled?", "How does Y work?"
- Natural language queries
```

### Pattern-Based Code Search
```
mcp__ast-grep__find_code
- Use for: Finding specific syntax patterns
- Example: find_code(pattern="export function $NAME", language="typescript")
```

### Smart File Editing
```
mcp__filesystem-with-morph__edit_file
- Use for: ALL file edits
- Use "// ... existing code ..." placeholders
- No need to Read first
```

### Browser Testing
```
mcp__chrome-devtools__take_snapshot    # Get page state
mcp__chrome-devtools__take_screenshot  # Visual verification
mcp__chrome-devtools__list_console_messages  # JS errors
mcp__chrome-devtools__click / fill     # Interactive testing
```

### Database Operations
```
mcp__Neon__get_database_tables        # List all tables
mcp__Neon__describe_table_schema      # Get table structure
mcp__Neon__run_sql                    # Execute queries
```

### Library Documentation
```
mcp__context7__resolve-library-id     # Find library ID
mcp__context7__get-library-docs       # Fetch current docs
```

## Project-Specific Notes

- **Neon Project**: See `agent_docs/infrastructure.md` for project ID
- **tRPC Routers**: Located in `packages/api/src/routers/`
- **Drizzle Schema**: Located in `packages/db/src/schema/`
- **UI Components**: Located in `apps/web/src/components/`
