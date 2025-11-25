# Terminology Clarification: "Attribute Labels" vs "Component Types"

**Document Date:** November 24, 2025
**Research Level:** Medium Exploration
**Status:** Complete

---

## Executive Summary

In the zebra-h2b-audit-v2 codebase, **"attribute labels"** and **"component types"** refer to different levels of data abstraction within the configuration grammar system:

- **Attribute Labels**: High-level field names from SKU position definitions (e.g., "Memory", "Battery", "Processor Type")
- **Component Types**: Semantic categories of extracted sub-components within option descriptions (e.g., "memory_spec", "connectivity", "region")

These terms exist on different layers of the data model and serve different analytical purposes.

---

## 1. Attribute Labels (Database: `config_position.attribute_label`)

### Definition

An **attribute label** is the raw, user-facing name of a configuration position that describes what aspect of a SKU a particular character position represents.

### Where It Appears

1. **Database Table**: `config_position`
   - **Column**: `attribute_label` (TEXT, NOT NULL)
   - **Relation**: 1 position = 1 label per file
   - **Unique Constraint**: `(file_id, position_index, normalized_label)`

2. **Drizzle Schema** (`packages/db/src/schema/zebra.ts`, lines 59-60):
   ```typescript
   attributeLabel: text("attribute_label").notNull(),
   normalizedLabel: varchar("normalized_label", { length: 255 }).notNull(),
   ```

3. **Embeddings Cache**: Selected attribute labels are embedded for visualization
   - `embedding_cache.value`: Contains the attribute label text
   - `embedding_cache.source_column`: Set to `"attribute_label"`
   - `embedding_cache.source_table`: Set to `"config_position"`

### Examples of Attribute Labels

From field-population page analysis:

```
- "Memory"
- "Operating System"
- "Series"
- "Family"
- "Battery"
- "Processor"
- "Processor Type"
- "Connectivity"
- "Display"
- "Storage"
```

### Key Characteristics

1. **Extracted from source files**: Parsed from CSV/XLSX configuration matrix headers
2. **Case-sensitive**: "Memory" and "memory" are stored as different labels
3. **Position-specific**: Each configuration file defines its own set of labels
4. **Grammar-level**: Part of the formal grammar definition for SKU structure
5. **User-visible**: Appears in Field Population page, displayed as "fields"

### Data Population

In the field-population page (`apps/web/src/app/field-population/page.tsx`):
- Shows **distinct attribute labels** from `config_position`
- Calculates coverage: how many files have each label
- Displays unique values, position counts per label
- Allows drill-down to see products with/without each attribute

### Database Query Example

```sql
-- Get all distinct attribute labels with coverage stats
SELECT 
    attribute_label AS field,
    COUNT(DISTINCT file_id) AS files_with_data,
    COUNT(DISTINCT code) AS unique_values,
    COUNT(DISTINCT position_index) AS unique_positions
FROM config_position
LEFT JOIN config_option ON config_option.position_id = config_position.id
GROUP BY attribute_label
ORDER BY files_with_data DESC;
```

---

## 2. Component Types (Database: `config_option_component.component_type`)

### Definition

A **component type** is a semantic classification of extracted sub-components within option descriptions. It represents what kind of information a component represents (e.g., "connectivity", "memory_spec", "region").

### Where It Appears

1. **Database Table**: `config_option_component`
   - **Column**: `component_type` (VARCHAR(100), NULLABLE)
   - **Relation**: Many components per option; many options per position; many positions per attribute label
   - **Unique Constraint**: `(option_id, sequence_position)` (per-position uniqueness)

2. **Drizzle Schema** (`packages/db/src/schema/zebra.ts`, lines 156-198):
   ```typescript
   export const configOptionComponent = pgTable(
     "config_option_component",
     {
       id: serial("id").primaryKey(),
       optionId: integer("option_id").references(() => configOption.id),
       rawValue: varchar("raw_value", { length: 255 }).notNull(),
       sequencePosition: integer("sequence_position").notNull(),
       componentType: varchar("component_type", { length: 100 }),  // <-- HERE
       normalizedValue: varchar("normalized_value", { length: 255 }),
       taxonomyId: integer("taxonomy_id"),
       createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
     },
     // ... constraints ...
   );
   ```

3. **Semantics**: Extracted/assigned per component, enabling classification

### Extraction Pipeline

Component extraction happens in a separate layer:

1. **Raw Option Description**: "802.11ac WiFi with Bluetooth 5.0 and NFC"
2. **Component Extraction**: Breaking description into semantic pieces
   - Component 1: "802.11ac" → component_type: "connectivity"
   - Component 2: "Bluetooth 5.0" → component_type: "connectivity"
   - Component 3: "NFC" → component_type: "connectivity"
3. **Storage**: Each extracted piece stored in `config_option_component`

### Examples of Component Types

From analysis scripts (`apps/web/scripts/analyze-components.ts`, lines 62):

**Target Focus Areas:**
```
- "connectivity"     (e.g., WiFi, Bluetooth, 4G, LTE)
- "memory_spec"      (e.g., 4GB, 6GB, 8GB, RAM)
- "region"           (e.g., US, EU, APAC, CN)
```

**Other Common Types:**
- "battery"
- "processor"
- "display"
- "storage"
- "feature"
- "unknown"

### Key Characteristics

1. **Extracted from option descriptions**: Not directly from source files
2. **Semantic classification**: Represents meaning, not raw text
3. **Option-level**: Associated with `config_option`, not `config_position`
4. **Optional field**: NULL values are common (unclassified components)
5. **Frequency-based**: Analyzed for vectorization opportunities
6. **Variation analysis**: Used to identify similar-looking values

### Data Population

In the components page (`apps/web/src/app/components/page.tsx`):
- Fetches **distinct component types** via `trpc.components.getComponentTypes`
- Groups by `componentType` and counts `rawValue` frequency
- Shows "Component Explorer" with type selector
- Allows drill-down to see products using specific component values

### Database Query Example

```sql
-- Get component type statistics
SELECT 
    component_type,
    COUNT(*) AS total_count,
    COUNT(DISTINCT raw_value) AS unique_values
FROM config_option_component
WHERE component_type IS NOT NULL
GROUP BY component_type
ORDER BY COUNT(*) DESC;

-- Example output:
-- component_type | total_count | unique_values
-- ---|---|---
-- connectivity | 847 | 156
-- memory_spec | 634 | 42
-- region | 521 | 18
```

---

## 3. Relationship & Data Flow

### Hierarchical Structure

```
config_file (289 files)
    └── config_position (attribute labels)
        │   ├── attribute_label: "Memory"
        │   ├── position_index: 5
        │   └── normalized_label: "memory"
        │
        └── config_option (allowed values)
            ├── code: "A"
            ├── description: "4GB RAM with 128GB SSD"
            │
            └── config_option_component (extracted sub-components)
                ├── raw_value: "4GB"
                ├── component_type: "memory_spec"
                ├── sequence_position: 0
                │
                ├── raw_value: "128GB SSD"
                ├── component_type: "storage"
                └── sequence_position: 1
```

### Data Cardinality

| Table | Row Count | Relation | Key Field |
|-------|-----------|----------|-----------|
| config_file | 289 | Base products | base_model |
| config_position | 2,647 | Positions per file | attribute_label |
| config_option | 6,981 | Options per position | code |
| config_option_component | ~20,000+ | Components per option | component_type |

### Extraction Timeline

1. **Phase 1: Grammar Extraction**
   - Source: CSV/XLSX files
   - Output: config_position records with attribute_label
   - Tool: zebra-data-parser (Python)

2. **Phase 2: Component Extraction** (Current)
   - Source: config_option.description
   - Output: config_option_component records with component_type
   - Tool: To be implemented (semantic extraction)

---

## 4. Field-Population Page: What It Displays

The **Field Population Page** (`apps/web/src/app/field-population/page.tsx`) focuses on **attribute labels**, not component types.

### Primary Display

1. **Field Coverage Grid**
   - Shows each distinct `attribute_label`
   - Displays coverage percentage (% of files with this attribute)
   - Indicates unique values and position counts

2. **Drill-Down Details**
   - Product list: which files have/miss the selected attribute
   - Tab filters: "All Products", "Has [Field]", "Missing [Field]"

3. **Component Variants Section**
   - **Title**: "Component Variants for [AttributeLabel]"
   - **Data Source**: config_option_component entries linked to this attribute
   - **Breakdown**: Shows extracted components grouped by component_type
   - **Purpose**: Analyze semantic variation within a single attribute

### Example Flow

1. User clicks "Memory" field card
2. Page queries config_position WHERE attribute_label = "Memory"
3. Shows 247 products with Memory, 42 without
4. Shows component breakdown: 156 unique values like "4GB", "8GB", "16GB"
   - Internally: "4GB" → component_type: "memory_spec"
5. User clicks component "8GB"
6. Shows 52 products using exactly that memory value

### API Endpoints

From `packages/api/src/routers/dashboard.ts`:

```typescript
// Get field population stats (attribute labels)
getFieldPopulationStats()  // Returns: { field, filesWithData, coverage, ... }

// Get products with/without a field (attribute label)
getProductsMissingField({ field })  // Accept exact attribute_label string

// Get component breakdown for a field
getComponentBreakdownForField({ field })  // Returns components for attribute label

// Get products by component value
getProductsByComponentValue({ field, componentValue })  // Filter by attribute + component
```

---

## 5. Components Page: What It Displays

The **Components Page** (`apps/web/src/app/components/page.tsx`) focuses on **component types**, not attribute labels.

### Primary Display

1. **Component Types Selector**
   - Dropdown of distinct `component_type` values
   - Shows count of unique `raw_value` entries per type

2. **Component Variants Table**
   - Lists all unique `raw_value` entries for selected type
   - Shows frequency and option count for each value

3. **Product Usage Details**
   - Shows which products use a selected component value
   - Links back to product configuration
   - Displays attribute label context (which attribute this component came from)

### Example Flow

1. User selects "connectivity" component type
2. Page shows 156 unique connectivity values: "WiFi", "4G", "Bluetooth", etc.
3. User clicks "WiFi"
4. Shows 89 products using WiFi connectivity
5. For each product: displays attribute label, position index, and description

### API Endpoints

From `packages/api/src/routers/components.ts`:

```typescript
// Get all component types
getComponentTypes()  // Returns: { componentType, totalCount, uniqueValues }

// Get component values for a type
getComponentsByType({ componentType })  // Returns: { rawValue, frequency, optionCount }

// Get products for a component value
getProductsForComponent({ componentType, rawValue })  // Returns products with joins to attributes

// Get component stats for type
getComponentTypeStats({ componentType })  // Returns detailed stats + top values
```

---

## 6. Embeddings & Vectorization

### Attribute Label Embeddings

**From `embedding_cache` table:**
- **value**: The actual attribute label text (e.g., "Memory", "Battery")
- **source_column**: "attribute_label"
- **source_table**: "config_position"
- **embeddings**: OpenAI 1536d and 3072d vectors
- **UMAP coordinates**: 2D/3D reduction for visualization

**Purpose**: Identify similar/duplicate attribute labels semantically

**Example**: Find labels that mean the same thing
```
- "Memory" ≈ "RAM" ≈ "MEMORY"  (should be normalized)
- "Processor" ≈ "CPU" ≈ "Chip"  (should be normalized)
```

### Component Type Analysis

**From `config_option_component` table:**
- **component_type**: Semantic classification (e.g., "connectivity")
- **raw_value**: Extracted text (e.g., "802.11ac WiFi")
- **Analysis**: Variations per component type

**Purpose**: Identify variations that should be normalized

**Example**: Within "connectivity" type
```
- "802.11ac" ≈ "802.11 AC" ≈ "WiFi 5"
- "Bluetooth 5.0" ≈ "BLE 5.0" ≈ "Bluetooth 5"
```

---

## 7. Key Differences Summary

| Aspect | Attribute Label | Component Type |
|--------|---|---|
| **Definition** | Field name in SKU position | Semantic category of sub-component |
| **Database** | `config_position.attribute_label` | `config_option_component.component_type` |
| **Source** | CSV/XLSX headers (phase 1) | Option descriptions (phase 2) |
| **Cardinality** | ~150 unique per ~289 files | ~20,000+ extracted components |
| **Relationships** | 1 per position | Many per option |
| **Case Sensitivity** | YES (stored as-is) | Varies by extraction logic |
| **Null Values** | NO (required field) | YES (optional classification) |
| **User Visible** | YES (Field Population page) | YES (Components page) |
| **Embedding** | YES (vectorized) | Raw values analyzed, not embedded yet |
| **Normalization** | Via embedding clustering | Via component type analysis |
| **Example** | "Memory", "Battery" | "memory_spec", "connectivity" |

---

## 8. Terminology Usage in Codebase

### "Attribute Label" Usage

**Appears in contexts:**
- Database schema documentation
- API endpoint names: `getFieldPopulationStats()`
- UI labels: "Field Population Analysis"
- Comments: "attribute coverage and data quality metrics"
- Query: `WHERE attribute_label = ?`

**Related terms:**
- "field" (user-facing term in UI)
- "position" (structural term)
- "label" (short form)

### "Component Type" Usage

**Appears in contexts:**
- Database schema documentation
- API endpoint names: `getComponentsByType()`
- UI labels: "Component Explorer"
- Comments: "semantic type of this component"
- Query: `WHERE component_type = ?`

**Related terms:**
- "component" (shortened)
- "semantic type" (formal)
- "category" (general)
- "variant" (instances of a type)

---

## 9. Confusion Points Clarified

### Point 1: "What is the difference between 'Memory' (attribute) and 'memory_spec' (type)?"

**Answer:**
- **"Memory"** (attribute label) = the SKU position name, indicating "this character position describes memory"
- **"memory_spec"** (component type) = a semantic category of extracted sub-components within memory-related option descriptions
- **Example**: An option with description "8GB RAM with 128GB SSD" would be:
  - Attribute: "Memory"
  - Components: "8GB" (type: "memory_spec"), "128GB SSD" (type: "storage")

### Point 2: "Why are there two different abstraction levels?"

**Answer:**
- **Attribute Labels**: Define the formal SKU grammar structure
- **Component Types**: Enable semantic analysis and normalization within each attribute
- **Use Case**: You can ask "how many products have Memory attribute?" vs "which connectivity options appear together?"

### Point 3: "Which page shows which one?"

**Answer:**
- **Field Population Page**: Shows attribute labels and their coverage (top-level view)
  - Drill-down includes components extracted from that attribute
- **Components Page**: Shows component types and their variants (semantic view)
  - Includes which attributes/products use each component

### Point 4: "Are attribute labels and component types the same as 'options'?"

**Answer:**
- **No**, these are different layers:
  - **Option**: A single allowed value (code + description) at a position
    - Example: code="A", description="4GB RAM with 128GB SSD"
  - **Attribute Label**: What the position represents
    - Example: "Memory"
  - **Component**: A sub-component extracted from the description
    - Example: "4GB" (type: "memory_spec")

---

## 10. Recommendations for Consistency

### For Code Comments

Use precise terminology:

```typescript
// Good:
// Group components by their component_type (semantic classification)
const byType = groupBy(components, c => c.componentType);

// Avoid:
// Group attributes by type (ambiguous - could mean attribute type)
```

### For UI Labels

Be specific in user-facing text:

```typescript
// Good:
<h2>Component Types</h2>        // Clear: semantic categories
<h2>Field Coverage</h2>          // Clear: attribute labels

// Avoid:
<h2>Attributes</h2>             // Ambiguous: could mean either
<h2>Fields</h2>                 // Only use for attribute labels
```

### For Database Queries

Use table/column names for clarity:

```sql
-- Good:
SELECT DISTINCT attribute_label FROM config_position
SELECT DISTINCT component_type FROM config_option_component

-- Avoid:
SELECT DISTINCT label FROM config_position
SELECT DISTINCT type FROM config_option_component
```

---

## 11. Related Documentation

- **Database Schema**: `/packages/db/src/schema/zebra.ts` (lines 19-198)
- **Embedding Cache**: `/packages/db/src/schema/embeddings.ts` (lines 22-79)
- **API Routers**: `/packages/api/src/routers/{dashboard,components}.ts`
- **UI Pages**: `/apps/web/src/app/{field-population,components}/page.tsx`
- **Analysis Scripts**: `/apps/web/scripts/analyze-components.ts`
- **Component Analysis**: `/scripts/analyze-components-for-vectorization.ts`

---

## Conclusion

In zebra-h2b-audit-v2:

1. **Attribute Labels** are the high-level field names from configuration grammars, used to describe SKU position meanings
2. **Component Types** are semantic categories of extracted sub-components within option descriptions
3. They exist at different abstraction levels serving different analytical purposes
4. The Field Population page focuses on attribute labels; the Components page focuses on component types
5. Both are important for data quality analysis and normalization efforts

The terminology distinction is fundamental to understanding the two-layer analysis approach: structural (grammar) vs semantic (component extraction).

---

**Document Status**: Complete
**Last Updated**: November 24, 2025
**Author**: Claude Code (Research Level: Medium)

