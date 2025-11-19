# Suggested Commands

## Package Management
```bash
# Install dependencies
bun install

# Add a dependency to a specific workspace
bun add <package> --filter web
bun add <package> --filter @zebra-h2b-audit-v2/api
```

## Development
```bash
# Run all apps in development mode
bun run dev

# Run specific app only
bun run dev:web    # Web app on port 3001
bun run dev:native # Native app (if applicable)
```

## Building
```bash
# Build all applications
bun run build

# Build specific workspace
turbo build --filter web
```

## Type Checking
```bash
# Check TypeScript types across all workspaces
bun run check-types
```

## Code Quality
```bash
# Format and lint code (auto-fix)
bun run check

# Or use Biome directly
npx biome check --write .
npx biome format --write .

# Check without fixing
npx biome check .

# Diagnose Biome setup
npx ultracite doctor
```

## Database Commands
```bash
# Push schema changes to database (development)
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate
```

## Git Operations
```bash
# Standard Darwin/macOS git commands
git status
git add .
git commit -m "message"
git push
git pull
```

## System Utilities (Darwin/macOS)
```bash
# File operations
ls -la          # List files with details
find . -name    # Find files by name
grep -r         # Search in files recursively
cat <file>      # View file contents
head/tail       # View start/end of files

# Navigation
cd <dir>        # Change directory
pwd             # Print working directory
```

## Turbo Commands
```bash
# Run command in all workspaces
turbo <command>

# Run in specific workspace
turbo <command> --filter <workspace-name>
turbo <command> -F <workspace-name>

# Clear Turbo cache
turbo clean
```