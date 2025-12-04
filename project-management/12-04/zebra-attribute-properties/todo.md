# Task Breakdown: Zebra Attribute Properties

## Phase 1: Data Analysis (Subagent Work)

### 1.1 Excel Parser Script
- **Owner**: TypeScript expert subagent
- **Output**: `scripts/attribute-analysis/parse-xlsx.ts`
- **Research Doc**: `agent-research/excel-parser-design.md`

### 1.2 Data Profiling
- **Owner**: Data analyst subagent
- **Output**: `agent-research/data-profile-report.md`
- **Tasks**:
  - Profile all columns (data types, cardinality, nulls)
  - Identify categorical vs free-text columns
  - Document normalization candidates

### 1.3 Taxonomy Design
- **Owner**: Data analyst subagent
- **Output**: `agent-research/taxonomy-proposal.md`
- **Tasks**:
  - Define normalized property names with traceability
  - Create value mappings (X -> boolean, N/A -> null, etc.)
  - Handle edge cases

## Phase 2: Schema Design (Subagent Work)

### 2.1 Schema Proposal
- **Owner**: Neon/Drizzle expert subagent
- **Output**: `agent-research/schema-proposal.md`
- **Tasks**:
  - Design `zebra_provided_*` tables
  - Define relationships and indexes
  - Consider query patterns for matching

## Phase 3: Consolidation (PM Coordinator)

### 3.1 Final Artifacts
- **Owner**: PM (main agent)
- **Outputs**:
  - Updated `scope.md` with decisions
  - `neverforget.md` with critical learnings
  - Ready-to-execute implementation plan
