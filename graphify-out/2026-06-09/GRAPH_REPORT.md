# Graph Report - up  (2026-06-09)

## Corpus Check
- 71 files · ~26,153 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 448 nodes · 1268 edges · 13 communities
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
- [[_COMMUNITY_Home Dashboard Charts|Home Dashboard Charts]]
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_Media Tables & Dates|Media Tables & Dates]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

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
- `LoadingState()` --calls--> `cn()`  [EXTRACTED]
  src/components/common/states.tsx → src/lib/utils.ts
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

## Communities (13 total, 0 thin omitted)

### Community 0 - "Shared UI Primitives"
Cohesion: 0.06
Nodes (48): inter, metadata, Providers(), DateRangePicker(), DateRangePickerProps, presets, MultiSelect(), MultiSelectProps (+40 more)

### Community 1 - "Representative Profile Pages"
Cohesion: 0.06
Nodes (56): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, DailyTrendChart(), HorizontalCountChart(), MediaDistributionChart() (+48 more)

### Community 2 - "Excel Data Pipeline"
Cohesion: 0.12
Nodes (15): classifyEntity(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractConstituency(), extractDistrict(), GEO_PATH, getDistrictLookup() (+7 more)

### Community 3 - "District Analytics UI"
Cohesion: 0.07
Nodes (41): EChartsClickParams, gridBase, ConstituencyMediaTabs(), MediaTab(), PrintTab(), ConstituencyPage(), DistrictMediaTabs(), MediaScope (+33 more)

### Community 4 - "REST API & Analytics"
Cohesion: 0.11
Nodes (38): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), filterRecords(), isKnownDistrict() (+30 more)

### Community 5 - "Home Dashboard Charts"
Cohesion: 0.27
Nodes (11): cleanText(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord, isHeaderRow(), lookupGovernmentMember() (+3 more)

### Community 6 - "App Shell & Navigation"
Cohesion: 0.11
Nodes (28): buildLookup(), canonicalizeMlaName(), canonicalizeMpName(), canonicalizeScope(), DATA_ROOT, dirLatestMtime(), ensureCache(), filterPrintRecords() (+20 more)

### Community 7 - "Media Tables & Dates"
Cohesion: 0.13
Nodes (25): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+17 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (16): buildLookup(), canonicalizeConstituency(), CONSTITUENCY_ALIASES, CONSTITUENCY_DIR, ConstituencyCache, dirLatestMtime(), ensureCache(), isKnownConstituency() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (20): ParsedCache, listMpNamesByHouse(), House, MediaRecord, RepType, GET(), GET(), addSentiment() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (25): DataTable(), DataTableCellContext, DataTableColumn, DataTableProps, SortState, COLUMN_BUILDERS, dateCol(), headlineCol() (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.60
Nodes (5): parseDate(), parseIndianDateString(), formatCalendarDate(), parseDate(), parseIndianDateString()

### Community 13 - "Community 13"
Cohesion: 0.83
Nodes (4): toGeoName(), districtMatchKeys(), matchesDistrict(), resolveDistrictScope()

## Knowledge Gaps
- **61 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Shared UI Primitives` to `District Analytics UI`, `Representative Profile Pages`, `Community 11`, `Media Tables & Dates`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Community 10` to `Excel Data Pipeline`, `District Analytics UI`, `REST API & Analytics`, `Media Tables & Dates`, `Community 11`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `MediaType` connect `District Analytics UI` to `Excel Data Pipeline`, `Community 11`, `REST API & Analytics`, `Media Tables & Dates`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Shared UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.06459627329192547 - nodes in this community are weakly interconnected._
- **Should `Representative Profile Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.0645933014354067 - nodes in this community are weakly interconnected._