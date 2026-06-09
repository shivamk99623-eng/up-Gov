# Graph Report - up  (2026-06-10)

## Corpus Check
- 71 files · ~26,845 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 441 nodes · 1269 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a7af9825`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Shared UI Primitives|Shared UI Primitives]]
- [[_COMMUNITY_Representative Profile Pages|Representative Profile Pages]]
- [[_COMMUNITY_Excel Data Pipeline|Excel Data Pipeline]]
- [[_COMMUNITY_District Analytics UI|District Analytics UI]]
- [[_COMMUNITY_REST API & Analytics|REST API & Analytics]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_Media Tables & Dates|Media Tables & Dates]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `jsonError()` - 23 edges
3. `formatNumber()` - 15 edges
4. `MediaType` - 13 edges
5. `Skeleton()` - 12 edges
6. `loadRecords()` - 12 edges
7. `getDashboard()` - 12 edges
8. `parseFilters()` - 11 edges
9. `formatDisplayDate()` - 11 edges
10. `resolveConstituencyToken()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyPrint()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/services/constituency.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Shared UI Primitives"
Cohesion: 0.09
Nodes (35): DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), MultiSelect(), MultiSelectProps, Option, SearchableSelectProps (+27 more)

### Community 1 - "Representative Profile Pages"
Cohesion: 0.07
Nodes (60): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, grid, MediaCountChart(), MediaSentimentChart() (+52 more)

### Community 2 - "Excel Data Pipeline"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 3 - "District Analytics UI"
Cohesion: 0.13
Nodes (27): MediaTab(), ConstituencyPage(), MediaTab(), DistrictPage(), useConstituencyAnalytics(), useConstituencyOptions(), useDashboard(), useDistrictAnalytics() (+19 more)

### Community 4 - "REST API & Analytics"
Cohesion: 0.07
Nodes (51): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), GET() (+43 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 6 - "App Shell & Navigation"
Cohesion: 0.06
Nodes (55): endOfCalendarDay(), formatCalendarDate(), parseCalendarDate(), startOfCalendarDay(), classifyEntity(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO (+47 more)

### Community 7 - "Media Tables & Dates"
Cohesion: 0.08
Nodes (41): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+33 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (46): ParsedCache, cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind (+38 more)

## Knowledge Gaps
- **59 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+54 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Representative Profile Pages` to `Shared UI Primitives`, `Excel Data Pipeline`, `Community 5`, `Media Tables & Dates`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `MediaType` connect `District Analytics UI` to `Representative Profile Pages`, `REST API & Analytics`, `App Shell & Navigation`, `Media Tables & Dates`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Community 10` to `Representative Profile Pages`, `District Analytics UI`, `REST API & Analytics`, `App Shell & Navigation`, `Media Tables & Dates`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _59 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Shared UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.08788159111933395 - nodes in this community are weakly interconnected._
- **Should `Representative Profile Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.07099080694586313 - nodes in this community are weakly interconnected._