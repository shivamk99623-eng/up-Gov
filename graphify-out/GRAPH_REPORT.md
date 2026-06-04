# Graph Report - .  (2026-06-04)

## Corpus Check
- Corpus is ~19,076 words - fits in a single context window. You may not need a graph.

## Summary
- 299 nodes · 791 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Shared UI Primitives|Shared UI Primitives]]
- [[_COMMUNITY_Representative Profile Pages|Representative Profile Pages]]
- [[_COMMUNITY_Excel Data Pipeline|Excel Data Pipeline]]
- [[_COMMUNITY_District Analytics UI|District Analytics UI]]
- [[_COMMUNITY_REST API & Analytics|REST API & Analytics]]
- [[_COMMUNITY_Home Dashboard Charts|Home Dashboard Charts]]
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_Media Tables & Dates|Media Tables & Dates]]
- [[_COMMUNITY_Table UI Components|Table UI Components]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `jsonError()` - 13 edges
3. `formatNumber()` - 13 edges
4. `MediaType` - 11 edges
5. `Skeleton()` - 10 edges
6. `getDashboard()` - 10 edges
7. `useFilterStore` - 10 edges
8. `Badge()` - 9 edges
9. `Button` - 9 edges
10. `loadRecords()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mla/page.tsx → src/lib/utils.ts
- `MLADetails()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mla/page.tsx → src/lib/utils.ts
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mp/page.tsx → src/lib/utils.ts
- `MPDetails()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mp/page.tsx → src/lib/utils.ts
- `HomePage()` --calls--> `cn()`  [EXTRACTED]
  src/app/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Shared UI Primitives"
Cohesion: 0.09
Nodes (35): EmptyState(), ErrorState(), LoadingState(), DateRangePickerProps, presets, MultiSelect(), MultiSelectProps, Option (+27 more)

### Community 1 - "Representative Profile Pages"
Cohesion: 0.09
Nodes (28): ChartCard(), ChartCardProps, grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), SearchableSelect(), useMLAs() (+20 more)

### Community 2 - "Excel Data Pipeline"
Cohesion: 0.06
Nodes (22): classifyEntity(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractDistrict(), GEO_PATH, getDistrictLookup(), parseDate() (+14 more)

### Community 3 - "District Analytics UI"
Cohesion: 0.11
Nodes (28): SentimentBadge(), DistrictMediaTabs(), MediaScope, MediaTab(), DistrictPage(), GlobalFilters(), Header(), useDistrictAnalytics() (+20 more)

### Community 4 - "REST API & Analytics"
Cohesion: 0.14
Nodes (26): GET(), GET(), GET(), jsonError(), parseFilters(), formatCalendarDate(), filterRecords(), isKnownDistrict() (+18 more)

### Community 5 - "Home Dashboard Charts"
Cohesion: 0.10
Nodes (24): HomePage(), SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart() (+16 more)

### Community 6 - "App Shell & Navigation"
Cohesion: 0.10
Nodes (22): inter, metadata, Providers(), DateRangePicker(), AppShell(), HeaderProps, Emblem(), links (+14 more)

### Community 7 - "Media Tables & Dates"
Cohesion: 0.16
Nodes (18): endOfCalendarDay(), formatDisplayDate(), formatDisplayDateLong(), parseCalendarDate(), startOfCalendarDay(), DataTable(), DataTableColumn, COLUMN_BUILDERS (+10 more)

### Community 8 - "Table UI Components"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **51 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Shared UI Primitives` to `Representative Profile Pages`, `District Analytics UI`, `Home Dashboard Charts`, `App Shell & Navigation`, `Table UI Components`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `MediaType` connect `District Analytics UI` to `Excel Data Pipeline`, `REST API & Analytics`, `Media Tables & Dates`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Excel Data Pipeline` to `District Analytics UI`, `REST API & Analytics`, `Media Tables & Dates`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Shared UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.08897959183673469 - nodes in this community are weakly interconnected._
- **Should `Representative Profile Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.08902439024390243 - nodes in this community are weakly interconnected._
- **Should `Excel Data Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06219512195121951 - nodes in this community are weakly interconnected._