# Web UI Codebase Structure Research

## Project Overview

This is a **Next.js 16** web application built as part of a TypeScript monorepo using Turborepo. The application is a configuration data analysis and exploration dashboard for Zebra products.

**Key Technologies:**
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4.1.10
- **Component Library**: Radix UI + custom Shadcn components
- **Data Fetching**: tRPC with TanStack React Query
- **State Management**: TanStack React Query for server state
- **Icons**: Lucide React
- **Package Manager**: Bun v1.3.0
- **Linting**: Biome (Ultracite preset)
- **Tables**: TanStack React Table
- **Theming**: next-themes for dark mode support

---

## 1. Framework: Next.js 16 with App Router

**Evidence:**
- `package.json` specifies `"next": "16.0.0"`
- Directory structure uses `/src/app/` pattern (App Router)
- Pages are `.tsx` files in app directories (e.g., `/app/products/page.tsx`)
- Uses `"use client"` directive for client components
- API routes in `/app/api/` (e.g., `/app/api/trpc/[trpc]/route.ts`)

**Configuration:**
- `next.config.ts`: Enables `typedRoutes` and `reactCompiler`
- `tsconfig.json`: Strict mode enabled, path alias `@/*` → `./src/*`

---

## 2. Page Structure

### Directory Organization

```
apps/web/src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Dashboard home page (/)
│   ├── products/
│   │   ├── page.tsx             # Products listing page
│   │   └── [id]/page.tsx        # Product detail page
│   ├── cohorts/
│   │   ├── page.tsx             # Cohorts listing page
│   │   └── [id]/page.tsx        # Cohort detail page
│   ├── components/page.tsx      # Components analysis page
│   ├── field-population/page.tsx # Field population analysis (EXISTING)
│   ├── gap-analysis/page.tsx    # Gap analysis page
│   ├── dashboard/page.tsx       # Dashboard redirect
│   ├── login/                   # Authentication
│   ├── api/                     # API routes
│   │   ├── auth/[...all]/route.ts
│   │   └── trpc/[trpc]/route.ts
│   └── favicon.ico
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   ├── layout/                  # Layout components
│   ├── field-population/        # Field population components
│   ├── products/                # Product page components
│   ├── cohorts/                 # Cohort page components
│   └── components/              # Component analysis components
├── utils/                        # Utility functions
├── lib/                         # Library functions
└── index.css                    # Global styles
```

### Root Layout

**File**: `apps/web/src/app/layout.tsx`

```typescript
- Uses `Geist` and `Geist_Mono` Google fonts
- Wraps children with `Providers` component (React Query, auth, themes)
- Uses `DashboardLayout` for consistent layout across all pages
- Sets metadata: title and description
```

The root layout provides:
1. **Providers wrapper**: Sets up TanStack Query, authentication, and theme
2. **DashboardLayout**: Provides sidebar navigation and header
3. **Global CSS**: Tailwind + custom styles

---

## 3. Existing Field Population Page (/field-population)

### Implementation Path
**File**: `apps/web/src/app/field-population/page.tsx` (476 lines)

### Page Structure

The field-population page is a comprehensive analytical dashboard with multiple sections:

#### A. Header Section
- Uses `DashboardHeader` component
- Title: "Field Population Analysis"
- Subtitle: "Attribute coverage and data quality metrics"
- Dark mode toggle integrated

#### B. Field Coverage Grid (145-228 lines)
**Layout**: Responsive grid (md:2 cols, lg:3 cols)

**Card Components** - One per field attribute:
- Field name and icon
- Coverage percentage (large, color-coded)
- Count of products with/without field
- Count of unique values
- Number of positions
- Progress bars showing:
  - Coverage distribution (green/amber/red)
  - Position distribution

**Interactivity**:
- Cards are clickable
- Selected card shows blue ring
- Loading state: Shows 10 skeleton cards
- Error state: Shows red error card

#### C. Drill-down Details Section (231-472 lines)
Shows when a field is selected:

**Sub-section 1: Product Details Tab**
- Tab selector: "All Products" | "Has {field}" | "Missing {field}"
- Optional component filter badge (with clear button)
- Dynamic product listing using `FieldPopulationTable` component
- Shows product ID, base model, source file, position index, field status

**Sub-section 2: Component Variants Breakdown**
- Conditional display when component breakdown data exists
- Three KPI cards:
  - Total Unique Variants
  - Most Common Variant (with frequency)
  - Products Coverage percentage
- Full component breakdown table showing:
  - Variant value
  - Frequency
  - Percentage of coverage
  - Products with variant count
- Clickable rows to filter products

**Empty State**:
- Shows when no field is selected
- Icon, title, and guidance text

### Data Flow & Queries

```
// Query 1: Get field population statistics
useQuery(trpc.dashboard.getFieldPopulationStats.queryOptions())
├── Returns: Field name, coverage %, filesWithData, filesMissing, uniqueValues, uniquePositions

// Query 2: Get products with/without field (conditional - enabled when field selected)
useQuery(trpc.dashboard.getProductsMissingField.queryOptions({field}))
├── Returns: productsWithField[], productsMissingField[]
├── Maps each to ProductFieldStatus with hasField flag

// Query 3: Component breakdown (conditional - enabled when field selected)
useQuery(trpc.dashboard.getComponentBreakdownForField.queryOptions({field}))
├── Returns: components[], coverage{...}

// Query 4: Products for component (conditional - enabled when component + field selected)
useQuery(trpc.dashboard.getProductsByComponentValue.queryOptions({field, componentValue}))
├── Returns: Product[] filtered by component value
```

### State Management

```typescript
const [selectedField, setSelectedField] = useState<string | null>(null)
const [activeTab, setActiveTab] = useState<"all" | "has" | "missing">("all")
const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
const detailsSectionRef = useRef<HTMLDivElement>(null)
```

**Behaviors**:
- Selecting a field triggers scroll to details section
- Selecting component filters products and switches to "has" tab
- Clearing selection resets all filters
- Tab changes re-filter the combined product list

### Components Used

**Custom Components**:
- `FieldPopulationTable` - Product list with sorting/filtering
- `ComponentBreakdownTable` - Component variants breakdown

**UI Components** (from `@/components/ui/`):
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge`
- `Button`
- `Skeleton` (loading states)
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`

**Layout Components**:
- `DashboardHeader`

**Icons** (lucide-react):
- `BarChart3`, `X`

---

## 4. Routing Structure

### Navigation Setup

**File**: `apps/web/src/components/layout/sidebar.tsx` (135 lines)

```typescript
const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Cohorts", href: "/cohorts", icon: Layers },
  { name: "Components", href: "/components", icon: Cpu },
  { name: "Field Population", href: "/field-population", icon: BarChart3 },
  { name: "Gap Analysis", href: "/gap-analysis", icon: AlertCircle },
]
```

**Features**:
- Mobile-responsive with hamburger menu
- Active link highlighting using `usePathname()`
- Smooth sidebar transitions
- Mobile backdrop when open
- Last updated date in footer

### URL Structure

**Pages** (all use .tsx files in App Router):
- `/` - Dashboard home (KPI cards)
- `/products` - Product list
- `/products/[id]` - Product detail
- `/cohorts` - Cohorts list
- `/cohorts/[id]` - Cohort detail
- `/components` - Component analysis
- `/field-population` - Field population analysis
- `/gap-analysis` - Gap analysis
- `/login` - Authentication

**API Routes**:
- `/api/trpc/[trpc]` - tRPC handler
- `/api/auth/[...all]` - Better-Auth handler

---

## 5. UI Components & Design System

### Component Library

**Location**: `apps/web/src/components/ui/`

**Base Components** (Shadcn/Radix UI):
- `badge.tsx` - Badge component with variants (default, secondary, outline, destructive)
- `button.tsx` - Button with variants (default, destructive, outline, secondary, ghost, link)
- `card.tsx` - Card layout (root, header, footer, title, description, content)
- `checkbox.tsx` - Checkbox component
- `command.tsx` - Command palette / search
- `dialog.tsx` - Modal dialog
- `dropdown-menu.tsx` - Dropdown menu
- `input.tsx` - Text input field
- `label.tsx` - Form label
- `popover.tsx` - Popover tooltip
- `scroll-area.tsx` - Scrollable area
- `select.tsx` - Select dropdown
- `separator.tsx` - Divider line
- `skeleton.tsx` - Loading skeleton
- `sonner.tsx` - Toast notifications
- `table.tsx` - Table layout (thead, tbody, tfoot, th, td)
- `tabs.tsx` - Tabbed interface

### Styling System

**CSS Approach**:
- **Tailwind CSS 4.1.10** - Utility-first CSS framework
- **Dark mode**: next-themes integration
- **Custom CSS**: `apps/web/src/index.css`
- **Shadcn configuration**: `components.json` for component templates

**Color Scheme**:
- Primary colors for actions
- Muted colors for secondary text
- Green/Amber/Red for status indicators
- Dark mode support throughout

### Common Patterns

#### Loading States
```typescript
{isLoading
  ? <Skeleton className="h-10 w-full" />
  : <ActualContent />
}
```

#### Error States
```typescript
{isError && (
  <Card className="border-red-200 bg-red-50">
    <CardTitle>Error message</CardTitle>
    <CardContent>{error.message}</CardContent>
  </Card>
)}
```

#### Responsive Layouts
```typescript
// Grid that adapts to screen size
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items}
</div>
```

#### Button Groups
```typescript
<div className="flex gap-2">
  <Button>Action 1</Button>
  <Button variant="ghost">Action 2</Button>
</div>
```

---

## 6. Table Implementation Pattern

### Tables Use TanStack React Table

**Location of Field Population Table**: `apps/web/src/components/field-population/field-population-table.tsx` (360 lines)

**Features**:
- Sorting (click column headers)
- Global search/filtering
- Column visibility toggle
- Responsive design
- Row click handling

**Column Definition Pattern**:
```typescript
const columns: ColumnDef<ProductFieldStatus>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: ({ column }) => (
      <Button onClick={() => column.toggleSorting()}>
        ID <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("id")}</div>,
  },
  // ... more columns
]
```

**UI Components**:
- Search input with icon (lucide Search)
- Dropdown for column visibility toggle (Columns icon)
- Clear filters button
- Result count indicator
- Table with header/body/rows/cells
- Empty state message

**Data Transformation**:
```typescript
// Combine two data sources into single view
const combinedProducts = useMemo(() => {
  const withField = productDetails.data.productsWithField.map(p => ({
    ...p, hasField: true
  }))
  const missingField = productDetails.data.productsMissingField.map(p => ({
    ...p, hasField: false
  }))
  return [...withField, ...missingField]
}, [productDetails.data])
```

---

## 7. Data Fetching & API Integration

### tRPC Setup

**Client Configuration**: `apps/web/src/utils/trpc.ts` (40 lines)

```typescript
// QueryClient for React Query
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: { label: "retry", onClick: () => queryClient.invalidateQueries() }
      })
    }
  })
})

// tRPC client setup
const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",  // Include cookies for auth
        })
      }
    })
  ]
})

// Export for use in components
export const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient })
```

### API Package Structure

**Location**: `packages/api/src/routers/`

**Router Files**:
- `index.ts` - Combines all routers into `appRouter`
- `dashboard.ts` - Dashboard metrics and analytics
- `products.ts` - Product queries
- `cohorts.ts` - Cohort queries
- `components.ts` - Component analysis

**Dashboard Router Procedures**:
```typescript
dashboardRouter = {
  healthCheck: publicProcedure.query(() => "OK"),
  getKPIMetrics: publicProcedure.query(...),
  getFieldPopulationStats: publicProcedure.query(...),
  getProductsMissingField: publicProcedure.input(z.object({field})).query(...),
  getComponentBreakdownForField: publicProcedure.input(z.object({field})).query(...),
  getProductsByComponentValue: publicProcedure.input(...).query(...),
  getGapAnalysis: publicProcedure.query(...)
}
```

### Usage Pattern in Pages

```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/utils/trpc"

export default function Page() {
  const { data, isLoading, error } = useQuery(
    trpc.dashboard.getKPIMetrics.queryOptions()
  )

  return (
    <div>
      {isLoading && <Skeleton />}
      {error && <ErrorCard />}
      {data && <Content data={data} />}
    </div>
  )
}
```

### Conditional Queries

```typescript
// Query only enabled when condition is true
const productsQuery = useQuery({
  ...trpc.dashboard.getProductsMissingField.queryOptions({ field }),
  enabled: field !== null,  // Don't run until field is selected
})
```

---

## 8. Layout Components

### DashboardLayout

**File**: `apps/web/src/components/layout/dashboard-layout.tsx`

```typescript
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Providers>
          {children}
        </Providers>
      </main>
    </div>
  )
}
```

**Structure**:
- Sidebar (fixed left)
- Main content area (flex-1, scrollable)

### DashboardHeader

**File**: `apps/web/src/components/layout/dashboard-header.tsx` (21 lines)

```typescript
interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      <ModeToggle />  {/* Dark mode button */}
    </div>
  )
}
```

### Sidebar

**File**: `apps/web/src/components/layout/sidebar.tsx` (135 lines)

**Features**:
- Fixed width (w-64)
- Border right
- Navigation array with icons
- Active link highlighting
- Mobile responsive (hidden on mobile, hamburger menu)
- Backdrop when open on mobile

---

## 9. Existing Page Examples

### 1. Products Page

**File**: `apps/web/src/app/products/page.tsx` (72 lines)

**Structure**:
- DashboardHeader
- Card wrapper
- ProductsTable component
- Error and loading states

**Data**:
```typescript
const { data, isLoading, error } = useQuery(
  trpc.products.getAll.queryOptions({ page: 1, limit: 500 })
)
```

### 2. Components Page

**File**: `apps/web/src/app/components/page.tsx` (250+ lines)

**Structure**:
- Multiple queries with conditional enabling
- Dropdown selector for component type
- KPI cards with stats
- Popover for component type selection
- Table of components
- Products list for selected component

**State Management**:
```typescript
const [activeType, setActiveType] = useState<string | null>(null)
const [open, setOpen] = useState(false)
const [selectedComponent, setSelectedComponent] = useState<{type, value} | null>(null)
```

### 3. Gap Analysis Page

**File**: `apps/web/src/app/gap-analysis/page.tsx` (200+ lines)

**Structure**:
- Summary card with coverage metrics
- Three category sections:
  - Supplies files (info icon, blue)
  - Filename issues (warning icon, amber)
  - Parser failures (error icon, red)
- File lists within each section

**Color-Coded Sections**:
- Info = Blue/info color
- Warning = Amber/warning color
- Error = Red/destructive color

---

## 10. Key Patterns for New Pages

### Pattern 1: Page Template

```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import { DashboardHeader } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/utils/trpc"

export default function NewPage() {
  const query = useQuery(trpc.router.procedure.queryOptions())

  const { data, isLoading, error } = query

  return (
    <div>
      <DashboardHeader title="Page Title" description="Subtitle" />

      {error && <ErrorCard error={error} />}
      {isLoading && <LoadingState />}
      {data && <Content data={data} />}
    </div>
  )
}
```

### Pattern 2: Grid of Cards (Discovery)

```typescript
<div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <Card
      key={item.id}
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected === item.id ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => setSelected(item.id)}
    >
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Display metrics */}
      </CardContent>
    </Card>
  ))}
</div>
```

### Pattern 3: Tabs with Multiple Views

```typescript
<Tabs onValueChange={setTab} value={tab}>
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="all">All ({total})</TabsTrigger>
    <TabsTrigger value="has">Has ({count1})</TabsTrigger>
    <TabsTrigger value="missing">Missing ({count2})</TabsTrigger>
  </TabsList>

  <TabsContent value="all">
    <Table data={allData} />
  </TabsContent>
  <TabsContent value="has">
    <Table data={hasData} />
  </TabsContent>
  <TabsContent value="missing">
    <Table data={missingData} />
  </TabsContent>
</Tabs>
```

### Pattern 4: Drill-down with Details Section

```typescript
{selectedItem ? (
  <Card>
    <CardHeader>
      <div className="flex justify-between">
        <CardTitle>{selectedItem.name}</CardTitle>
        <Button onClick={handleClear} variant="ghost">
          <X className="h-4 w-4" /> Clear
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {/* Detailed content */}
    </CardContent>
  </Card>
) : (
  <Card>
    <CardContent className="py-8 text-center">
      <p className="text-muted-foreground">Select an item to view details</p>
    </CardContent>
  </Card>
)}
```

### Pattern 5: Table with Filtering

```typescript
const [globalFilter, setGlobalFilter] = useState("")
const table = useReactTable({
  data: filteredData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onGlobalFilterChange: setGlobalFilter,
  state: { globalFilter }
})

return (
  <div>
    <div className="flex gap-2">
      <Input
        placeholder="Search..."
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
      />
      <DropdownMenu>
        {/* Column visibility */}
      </DropdownMenu>
    </div>
    <Table>{/* render */}</Table>
  </div>
)
```

---

## 11. Summary of Key Findings

### Framework Features
1. **Next.js 16 App Router** - All pages use `/app` directory pattern
2. **Type Safety** - End-to-end TypeScript with tRPC
3. **Data Fetching** - TanStack React Query + tRPC for all server data
4. **UI Components** - Shadcn/Radix UI with Tailwind CSS
5. **Responsive Design** - Mobile-first, breakpoint system (sm, md, lg)
6. **Dark Mode** - next-themes integration throughout
7. **Accessibility** - Radix UI primitives ensure WCAG compliance

### Current Page Patterns
- **Field Population**: Discovery cards → Detail drill-down → Tabbed data views
- **Products**: Simple list with table
- **Components**: Multi-step selection with filtering
- **Gap Analysis**: Categorized issue display
- **Dashboard**: KPI card grid with navigation links

### For New Pages
1. Use "use client" directive
2. Import DashboardHeader for consistency
3. Use useQuery with trpc for data fetching
4. Handle loading, error, and data states
5. Use Card/CardContent for sections
6. Use Tabs for multiple views
7. Use responsive grid layout (md: 2 cols, lg: 3 cols)
8. Leverage lucide-react for icons
9. Use Skeleton for loading states
10. Add error cards with red styling

---

## 12. Adding a New Page: Step-by-Step

### Steps to Create a New Page

1. **Create Page File**
   ```bash
   touch apps/web/src/app/new-feature/page.tsx
   ```

2. **Create Components Folder** (if needed)
   ```bash
   mkdir apps/web/src/components/new-feature
   ```

3. **Add to Sidebar Navigation**
   - Edit `apps/web/src/components/layout/sidebar.tsx`
   - Add new route to `navigation` array

4. **Create API Procedure** (if data needed)
   - Add to `packages/api/src/routers/` or edit existing router
   - Export from `packages/api/src/routers/index.ts`

5. **Implement Page Component**
   - Use template pattern shown above
   - Import DashboardHeader, Card, Button, etc.
   - Use useQuery for data fetching
   - Handle all three states: loading, error, data

6. **Add Custom Components**
   - Create in `src/components/new-feature/`
   - Use TanStack React Table for complex tables
   - Use Card + Badge + Button from UI components

7. **Style with Tailwind**
   - Use responsive classes: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
   - Use color utilities: `text-muted-foreground`, `bg-primary`
   - Use spacing: `mb-8`, `gap-4`, `p-4`

---

## 13. File Structure Reference

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Home page
│   │   ├── [feature]/
│   │   │   └── page.tsx            # Feature page
│   │   └── api/
│   │       └── trpc/[trpc]/route.ts # tRPC handler
│   ├── components/
│   │   ├── ui/                     # Base UI components (30+)
│   │   ├── layout/                 # Sidebar, Header, Layout
│   │   ├── [feature]/              # Feature-specific components
│   │   └── providers.tsx           # React Query + Auth providers
│   ├── utils/
│   │   ├── trpc.ts                 # tRPC client setup
│   │   └── export-utils.ts
│   ├── lib/
│   │   ├── auth-client.ts
│   │   └── utils.ts
│   └── index.css                   # Global styles
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── .env                            # Database & auth config
```

---

## Conclusion

The zebra-h2b-audit-v2 web application is a modern, well-structured Next.js dashboard with:

- **Clear separation of concerns**: Pages, components, utilities, API layer
- **Consistent patterns**: All pages follow similar structure (header, loading/error states, content cards)
- **Type safety**: End-to-end TypeScript with tRPC
- **Scalable design**: Easy to add new pages, tables, and API procedures
- **Accessibility built-in**: Radix UI + Shadcn components
- **Mobile-responsive**: Tailwind's responsive utilities throughout

The field-population page serves as an excellent reference for implementing drill-down dashboards with complex data interactions. New pages can follow this proven pattern for consistency and maintainability.
