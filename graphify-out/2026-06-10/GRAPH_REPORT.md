# Graph Report - up  (2026-06-10)

## Corpus Check
- 71 files · ~26,854 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 465 nodes · 1319 edges · 8 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c84677af`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Shared UI Primitives|Shared UI Primitives]]
- [[_COMMUNITY_Representative Profile Pages|Representative Profile Pages]]
- [[_COMMUNITY_Excel Data Pipeline|Excel Data Pipeline]]
- [[_COMMUNITY_District Analytics UI|District Analytics UI]]
- [[_COMMUNITY_REST API & Analytics|REST API & Analytics]]
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_Media Tables & Dates|Media Tables & Dates]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 46 edges
2. `jsonError()` - 25 edges
3. `formatNumber()` - 15 edges
4. `MediaType` - 13 edges
5. `Skeleton()` - 12 edges
6. `loadRecords()` - 12 edges
7. `getDashboard()` - 12 edges
8. `getConstituencyAnalytics()` - 12 edges
9. `parseFilters()` - 11 edges
10. `formatDisplayDate()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyPrint()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/services/constituency.ts
- `GET()` --calls--> `getDashboard()`  [EXTRACTED]
  src/app/api/dashboard/route.ts → src/services/analytics.ts

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "Shared UI Primitives"
Cohesion: 0.06
Nodes (50): inter, metadata, Providers(), LoadingState(), DateRangePicker(), DateRangePickerProps, presets, MultiSelect() (+42 more)

### Community 1 - "Representative Profile Pages"
Cohesion: 0.06
Nodes (60): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase (+52 more)

### Community 2 - "Excel Data Pipeline"
Cohesion: 0.11
Nodes (18): classifyEntity(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractConstituency(), extractDistrict(), GEO_PATH, getDistrictLookup() (+10 more)

### Community 3 - "District Analytics UI"
Cohesion: 0.07
Nodes (49): MediaTab(), ConstituencyPage(), MediaTab(), printEmptyDescription(), PrintTab(), DistrictPage(), GlobalFilters(), UpMapProps (+41 more)

### Community 4 - "REST API & Analytics"
Cohesion: 0.09
Nodes (42): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), buildLookup(), canonicalizeConstituency() (+34 more)

### Community 6 - "App Shell & Navigation"
Cohesion: 0.08
Nodes (42): ConstituencyCache, parseDate(), parseIndianDateString(), endOfCalendarDay(), formatCalendarDate(), formatDisplayDateLong(), parseCalendarDate(), startOfCalendarDay() (+34 more)

### Community 7 - "Media Tables & Dates"
Cohesion: 0.07
Nodes (44): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+36 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (43): cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord (+35 more)

## Knowledge Gaps
- **62 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Shared UI Primitives` to `Representative Profile Pages`, `Media Tables & Dates`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `MediaType` connect `District Analytics UI` to `Representative Profile Pages`, `Excel Data Pipeline`, `REST API & Analytics`, `Media Tables & Dates`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Excel Data Pipeline` to `Representative Profile Pages`, `Community 10`, `District Analytics UI`, `Media Tables & Dates`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Shared UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.061815336463223784 - nodes in this community are weakly interconnected._
- **Should `Representative Profile Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05967540574282147 - nodes in this community are weakly interconnected._