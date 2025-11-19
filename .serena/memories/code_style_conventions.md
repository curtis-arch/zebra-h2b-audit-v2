# Code Style & Conventions

This project strictly follows **Ultracite** code standards, which are enforced through Biome.

## Ultracite Standards Overview

Ultracite is a zero-config Biome preset that enforces strict code quality. Most issues are automatically fixable with `bun run check`.

### Type Safety
- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` for genuinely unknown types
- Use const assertions (`as const`) for immutable values
- Leverage TypeScript's type narrowing instead of type assertions
- Extract magic numbers into named constants

### Modern JavaScript/TypeScript
- Arrow functions for callbacks and short functions
- Prefer `for...of` over `.forEach()` and indexed loops
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Template literals over string concatenation
- Destructuring for object/array assignments
- `const` by default, `let` only when reassignment needed, never `var`

### Async/Promises
- Always `await` promises in async functions
- Use `async/await` over promise chains
- Handle errors with try-catch blocks
- Never use async functions as Promise executors

### React Best Practices
- Function components only (no class components)
- Hooks at top level only, never conditionally
- Correct dependency arrays in useEffect/useMemo/useCallback
- Use `key` prop with unique IDs (not array indices)
- Nest children between tags, not as props
- Never define components inside components
- React 19: Use `ref` as a prop (not `forwardRef`)

### Accessibility (A11y)
- Meaningful alt text for images
- Proper heading hierarchy (h1, h2, h3...)
- Labels for all form inputs
- Keyboard handlers alongside mouse handlers
- Semantic HTML (`<button>`, `<nav>`, etc.) over divs with roles

### Error Handling
- Remove `console.log`, `debugger`, `alert` from production
- Throw `Error` objects with descriptive messages
- Use try-catch meaningfully (not just to rethrow)
- Early returns for error cases

### Code Organization
- Keep functions focused and simple
- Extract complex conditions into named booleans
- Early returns to reduce nesting
- Simple conditionals over nested ternaries
- Group related code, separate concerns

### Security
- Add `rel="noopener"` with `target="_blank"`
- Avoid `dangerouslySetInnerHTML`
- No `eval()` or direct `document.cookie` assignment
- Validate and sanitize user input

### Performance
- Avoid spread in loop accumulators
- Top-level regex literals
- Specific imports over namespace imports
- Avoid barrel files (index re-exports)
- Use Next.js `<Image>` over `<img>`

### Next.js Specific
- Use Next.js `<Image>` component
- Use App Router metadata API for head elements
- Server Components for async data fetching

## Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case for utilities (e.g., `api-client.ts`)
- **Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE or camelCase for const objects
- **Types/Interfaces**: PascalCase (e.g., `UserData`, `ApiResponse`)

## File Organization
- Components in component-specific folders when they have multiple files
- Co-locate tests with source files
- Shared utilities in `packages/` workspaces
- Keep imports organized: React → third-party → workspace packages → local

## Comments & Documentation
- Prefer self-documenting code over comments
- Add comments for complex business logic
- Use JSDoc for public API functions
- Explain "why", not "what"