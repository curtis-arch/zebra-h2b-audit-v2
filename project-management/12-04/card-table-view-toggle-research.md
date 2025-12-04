# Card/Table View Toggle - UI/UX Research & Recommendations

**Date:** 2024-12-04
**Context:** Field Population page (/apps/web/src/app/field-population/page.tsx)
**Goal:** Add toggle to switch between card grid view and TanStack Table view

---

## Executive Summary

Based on research of current best practices and analysis of the existing codebase, I recommend using a **segmented control (toggle group)** with icon buttons placed in the **header area, aligned to the right** opposite the page title.

---

## 1. Best UI Pattern for View Toggle

### Recommended: Icon Toggle Group (Segmented Control)

**Why this pattern:**
- **Clear affordance**: Users immediately recognize it as a view switcher
- **Single interaction**: Toggle state is visible at a glance
- **Industry standard**: Used by Airbnb, GitHub, Dribbble, Pinterest, Google Drive
- **Compact**: Takes minimal header space
- **Accessible**: Clear focus states, keyboard navigation, screen reader friendly

**Implementation approach:**
```tsx
// Using shadcn/ui Tabs component styled as toggle group
<TabsList className="h-9 w-fit">
  <TabsTrigger value="cards" className="gap-1.5">
    <LayoutGrid className="h-4 w-4" />
    Cards
  </TabsTrigger>
  <TabsTrigger value="table" className="gap-1.5">
    <Table2 className="h-4 w-4" />
    Table
  </TabsTrigger>
</TabsList>
```

**Why NOT dropdown:**
- Requires two clicks (open + select)
- Hides current state
- Overkill for binary choice

**Why NOT separate icon buttons:**
- Active state less obvious
- More visual noise
- Requires careful styling to show state

---

## 2. Placement Recommendation

### Option A: In DashboardHeader Component (RECOMMENDED)

**Location:** Right side of header, opposite the title, replacing or next to ModeToggle

```tsx
<div className="mb-8 flex items-center justify-between">
  <div>
    <h1>Field Population Analysis</h1>
    <p>Attribute coverage metrics...</p>
  </div>
  <div className="flex items-center gap-2">
    <ViewToggle /> {/* NEW */}
    <ModeToggle />
  </div>
</div>
```

**Advantages:**
- ✅ Persistent across page scroll
- ✅ Highly visible - users see it immediately
- ✅ Consistent with dashboard UX patterns (controls in header)
- ✅ Doesn't clutter the content area
- ✅ Aligns with F-pattern reading (controls on right)

**Reference:** This matches the pattern used by:
- GitHub (code view toggles in header)
- Dribbble (shots view toggle in header)
- Pinterest (grid/list toggle in header)

### Option B: Above the Grid

**Location:** Between header and content grid

```tsx
<DashboardHeader ... />
<div className="mb-4 flex justify-end">
  <ViewToggle />
</div>
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
```

**Advantages:**
- ✅ Contextually close to content
- ✅ Doesn't require modifying DashboardHeader

**Disadvantages:**
- ❌ Scrolls away with content
- ❌ Less prominent
- ❌ Creates extra visual layer

---

## 3. Icon Recommendations

### Primary Choice: LayoutGrid + Table2 (from lucide-react)

```tsx
import { LayoutGrid, Table2 } from "lucide-react"
```

**Rationale:**
- `LayoutGrid` - Clearly represents card/grid layout (3x3 grid icon)
- `Table2` - Clearly represents table layout (rows and columns)
- Both icons are semantically accurate
- Already used in codebase (LayoutGrid pattern seen in search results)

### Alternative: LayoutGrid + List

```tsx
import { LayoutGrid, List } from "lucide-react"
```

**When to use:**
- If table view is more list-like (single column)
- If you want more visual contrast between icons

**Not recommended:**
- ❌ `Grid3x3` - Too generic, could be confused with settings
- ❌ `Columns` - Already used for column visibility in tables (see field-population-table.tsx)
- ❌ `Menu` - Implies navigation, not view mode

---

## 4. Existing shadcn/ui Components

### Available Components (Already in Codebase)

**✅ Tabs Component** (`/components/ui/tabs.tsx`)
- **Status:** Already installed and heavily used
- **Usage:** Currently used for "All/Has/Missing" filter tabs
- **Styling:** Supports inline-flex, icon + text, active states
- **Recommendation:** **Reuse this component** - it's perfect for view toggles

**Example from research:**
```tsx
// Tabs component already supports this pattern
<Tabs value={view} onValueChange={setView}>
  <TabsList>
    <TabsTrigger value="cards">
      <LayoutGrid className="h-4 w-4" />
      Cards
    </TabsTrigger>
    <TabsTrigger value="table">
      <Table2 className="h-4 w-4" />
      Table
    </TabsTrigger>
  </TabsList>
</Tabs>
```

**❌ Toggle Group Component** - NOT installed
- Would need: `npx shadcn@latest add toggle-group`
- **Verdict:** Not needed - Tabs component achieves the same result

### Styling Customization

The existing Tabs component supports:
- Icon + text layout (via `gap-1.5` in TabsTrigger)
- Compact sizing (h-9 from TabsList)
- Active state styling (data-[state=active]:bg-background)
- Keyboard navigation (built into Radix)
- Screen reader support (built into Radix)

---

## 5. Transition/Animation Handling

### Recommended: Minimal/No Animation

**Rationale from research:**
- Card → Table is a complete layout restructure (not a smooth transform)
- Users expect instant response for view changes
- Animations can cause layout shift and confusion
- Dashboard users prioritize speed over delight

**Implementation:**
```tsx
// Simple conditional rendering - no transition wrapper needed
{activeView === "cards" ? (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {/* Card components */}
  </div>
) : (
  <FieldPopulationTable data={fieldData} />
)}
```

**Optional: Subtle Fade (Advanced)**
If animation is desired, use CSS fade only:
```tsx
<div className={cn(
  "transition-opacity duration-150",
  isTransitioning && "opacity-0"
)}>
```

**Why NOT:**
- ❌ Complex layout animations (too jarring)
- ❌ Slide transitions (confusing direction)
- ❌ Skeleton loaders (data is already loaded)

---

## 6. Accessibility Considerations

### WCAG 2.1 AA Compliance Checklist

**✅ Keyboard Navigation**
- Tabs component supports Tab key navigation
- Arrow keys navigate between toggle options
- Enter/Space activates selection

**✅ Screen Reader Support**
```tsx
<Tabs
  value={view}
  onValueChange={setView}
  aria-label="View mode selection"
>
  <TabsList aria-label="Choose between card and table views">
    <TabsTrigger value="cards" aria-label="Card view">
      <LayoutGrid className="h-4 w-4" aria-hidden="true" />
      <span>Cards</span>
    </TabsTrigger>
    <TabsTrigger value="table" aria-label="Table view">
      <Table2 className="h-4 w-4" aria-hidden="true" />
      <span>Table</span>
    </TabsTrigger>
  </TabsList>
</Tabs>
```

**✅ Focus Order**
- Toggle appears in header (top of page)
- Follows DashboardHeader in DOM order
- Users encounter it before content
- Matches visual hierarchy

**✅ Color Contrast**
- Active state uses `bg-background` with `shadow-sm`
- Inactive state uses `text-muted-foreground`
- Both meet WCAG AA contrast requirements (4.5:1)

**✅ State Indication**
- Visual: Background color + shadow for active state
- Programmatic: `data-[state=active]` attribute
- Text label supplements icon (not icon-only)

**✅ Persistent State (Recommended)**
```tsx
// Save preference to localStorage
useEffect(() => {
  localStorage.setItem('fieldPopulationView', view);
}, [view]);

// Restore on mount
const [view, setView] = useState(() => {
  return localStorage.getItem('fieldPopulationView') ?? 'cards';
});
```

---

## 7. Responsive Behavior

### Desktop (≥768px)
```tsx
<TabsList className="h-9 w-fit">
  <TabsTrigger value="cards" className="gap-1.5">
    <LayoutGrid className="h-4 w-4" />
    Cards
  </TabsTrigger>
  <TabsTrigger value="table" className="gap-1.5">
    <Table2 className="h-4 w-4" />
    Table
  </TabsTrigger>
</TabsList>
```

### Mobile (<768px) - Optional Icon-Only
```tsx
<TabsList className="h-9 w-fit">
  <TabsTrigger value="cards" className="gap-1.5">
    <LayoutGrid className="h-4 w-4" />
    <span className="max-sm:sr-only">Cards</span>
  </TabsTrigger>
  <TabsTrigger value="table" className="gap-1.5">
    <Table2 className="h-4 w-4" />
    <span className="max-sm:sr-only">Table</span>
  </TabsTrigger>
</TabsList>
```

**Note:** Keep text labels on mobile if space permits (better accessibility)

---

## 8. Implementation Recommendations

### Component Structure

```tsx
// New component: /components/field-population/view-toggle.tsx
"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ViewToggleProps {
  value: "cards" | "table";
  onValueChange: (value: "cards" | "table") => void;
}

export function ViewToggle({ value, onValueChange }: ViewToggleProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList aria-label="Choose between card and table views">
        <TabsTrigger value="cards" className="gap-1.5">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          <span>Cards</span>
        </TabsTrigger>
        <TabsTrigger value="table" className="gap-1.5">
          <Table2 className="h-4 w-4" aria-hidden="true" />
          <span>Table</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

### Modified DashboardHeader

```tsx
// Update: /components/layout/dashboard-header.tsx
interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode; // NEW: Allow custom actions
}

export function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ModeToggle />
      </div>
    </div>
  );
}
```

### Page Integration

```tsx
// Update: /app/field-population/page.tsx
const [view, setView] = useState<"cards" | "table">("cards");

return (
  <div>
    <DashboardHeader
      title="Field Population Analysis"
      description={`Attribute coverage metrics...`}
      actions={<ViewToggle value={view} onValueChange={setView} />}
    />

    {view === "cards" ? (
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Existing card rendering */}
      </div>
    ) : (
      <FieldPopulationStatsTable data={fieldData} />
    )}
  </div>
);
```

---

## 9. Design System Consistency

### Matches Existing Patterns

**Tabs usage in codebase:**
- ✅ `/app/field-population/page.tsx` - "All/Has/Missing" filter tabs
- ✅ Inline-flex layout with icons + text
- ✅ Active state styling with bg-background
- ✅ Gap spacing for icon-text pairs

**Icon usage in codebase:**
- ✅ Lucide-react icons throughout (Sun, Moon, BarChart3, Package, etc.)
- ✅ h-4 w-4 sizing for inline icons
- ✅ text-muted-foreground for inactive states

**Header controls:**
- ✅ ModeToggle already in header (dark/light theme)
- ✅ Pattern: Controls on right, content on left
- ✅ flex items-center justify-between layout

---

## 10. Research Sources

### Industry Examples (December 2024)

1. **GitHub** - Code view toggle (icon buttons, header placement)
2. **Dribbble** - Shots view toggle (segmented control, header)
3. **Airbnb** - Listings view toggle (icon buttons, persistent)
4. **Pinterest** - Board view toggle (segmented control, header)
5. **Google Drive** - File view toggle (icon buttons, header)

### UX Research Findings

From Pencil & Paper UX analysis:
- "Controls should be always accessible; consider a fixed header"
- "Consistent card layout helps users find information quickly"
- "Prioritize actions - make the most important the most noticeable"

From Medium case study (Maeve Shen):
- Cards = exploration, visual browsing, topic selection
- Tables = comparison, analysis, bulk actions
- Both serve distinct user needs - toggle enables both modes

### Accessibility Research

From WCAG 2.1 guidelines:
- Focus order must match visual order (1.3.2, 2.4.3)
- Meaningful sequence for screen readers (1.3.2)
- Keyboard navigation required (2.1.1)
- Color not sole indicator (1.4.1)

---

## 11. Final Recommendations Summary

| Question | Answer |
|----------|--------|
| **Best UI pattern** | Segmented control using existing Tabs component |
| **Placement** | Header area, right side opposite title |
| **Icons** | `LayoutGrid` (cards) + `Table2` (table) from lucide-react |
| **Components needed** | None - reuse existing Tabs component |
| **Animation** | None or minimal fade (instant is better) |
| **Accessibility** | Built-in via Radix Tabs, add aria-labels |
| **State persistence** | Optional - use localStorage for preference |
| **Responsive** | Keep text labels, or hide on mobile with sr-only |

---

## Next Steps

1. **Create ViewToggle component** (`/components/field-population/view-toggle.tsx`)
2. **Update DashboardHeader** to accept actions prop
3. **Add view state** to field-population page
4. **Create table view component** (if not exists) for field stats
5. **Test keyboard navigation** and screen reader support
6. **Optional:** Add localStorage persistence

---

## Files to Modify

- ✅ `/components/layout/dashboard-header.tsx` - Add actions prop
- ✅ `/app/field-population/page.tsx` - Add view state + toggle
- ✅ New: `/components/field-population/view-toggle.tsx` - Toggle component
- ✅ Optional: `/components/field-population/field-stats-table.tsx` - Table view

---

## Additional Notes

**Why this pattern works for field-population:**

The field stats data (coverage %, files with data, unique values, positions) is well-suited for both views:

**Cards view** (current):
- ✅ Visual scanning for outliers (low coverage fields)
- ✅ Color-coded progress bars
- ✅ Good for initial exploration
- ✅ Works well with drill-down interaction

**Table view** (new):
- ✅ Sortable columns (coverage, unique values, positions)
- ✅ Easier comparison across all fields
- ✅ More data-dense for power users
- ✅ Better for analysis and reporting

Both modes serve legitimate user needs - the toggle lets users choose their preferred workflow.

---

**Document prepared for:** Zebra H2B Audit v2
**Research date:** 2024-12-04
**Status:** Ready for implementation
