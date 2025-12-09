# Enhanced Similarity Reports and XLSX Import - Task Tracker

**Beads Epic:** `zebra-h2b-audit-v2-wxr`

## Tasks

| ID | Title | Beads ID | Status | Est |
|----|-------|----------|--------|-----|
| 001 | Enhanced CSV/JSON Reports with Match Scores | `zebra-h2b-audit-v2-wxr.1` | open | 120m |
| 002 | Parse HTB XLSX File | `zebra-h2b-audit-v2-wxr.2` | open | 60m |
| 003 | HTB Attribute Mapping Table Schema | `zebra-h2b-audit-v2-wxr.3` | open | 30m |
| 004 | Import HTB Data to Database | `zebra-h2b-audit-v2-wxr.4` | open | 45m |
| 005 | Config-Driven Embedding Sync Script | `zebra-h2b-audit-v2-wxr.5` | open | 180m |
| 006 | Generate HTB Attribute Embeddings | `zebra-h2b-audit-v2-wxr.6` | open | 30m |
| 007 | UMAP Coordinates and TSV Export | `zebra-h2b-audit-v2-wxr.7` | open | 90m |

## Dependency Graph
```
001 (standalone - ready)

002 ──> 003 ──> 004 ──┐
                      │
005 ─────────────────┼──> 006 ──> 007
                      │
```

## Ready to Start
- `bd ready` to see unblocked tasks
- Task 001 (standalone)
- Task 002 (no deps)
- Task 005 (no deps)

## Commands
```bash
bd show zebra-h2b-audit-v2-wxr      # View epic
bd ready                             # See available work
bd update <id> --status=in_progress  # Claim task
bd close <id>                        # Complete task
bd sync                              # Sync with git
```
