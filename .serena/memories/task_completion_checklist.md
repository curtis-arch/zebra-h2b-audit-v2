# Task Completion Checklist

When completing any coding task in this project, follow this checklist:

## 1. Code Quality Check
```bash
# Run Biome to format and lint (auto-fixes most issues)
bun run check
```

This command will:
- Format all code according to Ultracite standards
- Fix auto-fixable linting issues
- Report any remaining issues

## 2. Type Safety Check
```bash
# Verify TypeScript types across all workspaces
bun run check-types
```

Ensure there are no TypeScript errors in any workspace.

## 3. Build Verification (if applicable)
```bash
# Ensure the project builds successfully
bun run build
```

Only run if your changes might affect the build output.

## 4. Manual Verification
- [ ] Test your changes in the browser (run `bun run dev`)
- [ ] Verify functionality works as expected
- [ ] Check for console errors/warnings
- [ ] Test edge cases and error states

## 5. Database Changes (if applicable)
If you modified database schema in `packages/db`:
```bash
# Generate migration files
bun run db:generate

# Push changes to database
bun run db:push
```

## 6. Review Changes
- [ ] Review code for security issues (XSS, injection, etc.)
- [ ] Ensure no sensitive data is hardcoded
- [ ] Check that error messages are user-friendly
- [ ] Verify accessibility (keyboard navigation, screen readers)

## 7. Git Commit
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: descriptive message about changes"

# Push to remote
git push
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code refactoring
- `docs:` for documentation
- `style:` for formatting changes
- `test:` for adding tests
- `chore:` for maintenance tasks

## Quick Summary
For most tasks, this minimal sequence is sufficient:
```bash
bun run check           # Format and lint
bun run check-types     # Type check
# Test manually in browser
git add . && git commit -m "..."
```