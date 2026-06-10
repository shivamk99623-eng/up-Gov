# Graph Report - up  (2026-06-10)

## Corpus Check
- 75 files · ~28,892 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 491 nodes · 1456 edges · 11 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `161e6469`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App Pages & Layout|App Pages & Layout]]
- [[_COMMUNITY_Data Parsers|Data Parsers]]
- [[_COMMUNITY_Analytics & Client|Analytics & Client]]
- [[_COMMUNITY_Representatives|Representatives]]
- [[_COMMUNITY_Tables & Modals|Tables & Modals]]
- [[_COMMUNITY_API Routes & Services|API Routes & Services]]
- [[_COMMUNITY_Filter UI|Filter UI]]
- [[_COMMUNITY_Table Primitives|Table Primitives]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `jsonError()` - 23 edges
3. `warmDataCaches()` - 22 edges
4. `Sentiment` - 16 edges
5. `formatNumber()` - 15 edges
6. `getConstituencyOptions()` - 15 edges
7. `loadRecords()` - 14 edges
8. `ensureCache()` - 14 edges
9. `loadPrintRecords()` - 13 edges
10. `MediaType` - 13 edges

## Surprising Connections (you probably didn't know these)
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `register()` --calls--> `warmDataCaches()`  [INFERRED]
  src/instrumentation.ts → src/lib/api-helpers.ts
- `register()` --calls--> `loadRecords()`  [INFERRED]
  src/instrumentation.ts → src/lib/excel-parser.ts
- `register()` --calls--> `loadAllPrintRecords()`  [INFERRED]
  src/instrumentation.ts → src/lib/print-parser.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.05
Nodes (73): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase (+65 more)

### Community 1 - "Data Parsers"
Cohesion: 0.09
Nodes (44): formatCalendarDate(), isKnownDistrict(), isKnownLanguage(), toGeoName(), buildLookup(), canonicalizeMlaName(), canonicalizeMpName(), canonicalizeScope() (+36 more)

### Community 2 - "Analytics & Client"
Cohesion: 0.08
Nodes (40): MediaTab(), ConstituencyPage(), MediaTab(), DistrictPage(), GlobalFilters(), UpMapProps, useConstituencyAnalytics(), useConstituencyOptions() (+32 more)

### Community 3 - "Representatives"
Cohesion: 0.06
Nodes (50): BioCache, CareerPosition, cleanText(), ensureCache(), indexRecord(), listAllMpBioMembers(), listLokSabhaBioMembers(), listRajyaSabhaBioMembers() (+42 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.07
Nodes (47): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+39 more)

### Community 5 - "API Routes & Services"
Cohesion: 0.13
Nodes (36): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), warmDataCaches(), filterRecords() (+28 more)

### Community 6 - "Filter UI"
Cohesion: 0.11
Nodes (29): DateRangePicker(), DateRangePickerProps, presets, MultiSelect(), MultiSelectProps, Option, SearchableSelectProps, HeaderProps (+21 more)

### Community 7 - "Table Primitives"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 8 - "Root Layout"
Cohesion: 0.18
Nodes (22): cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (20): classifyEntity(), constituencyFromTags(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractConstituency(), extractDistrict(), GEO_PATH (+12 more)

## Knowledge Gaps
- **66 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `App Pages & Layout` to `Community 9`, `Tables & Modals`, `Filter UI`, `Table Primitives`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `Sentiment` connect `Analytics & Client` to `Data Parsers`, `Representatives`, `Tables & Modals`, `API Routes & Services`, `Filter UI`, `Community 10`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Analytics & Client` to `App Pages & Layout`, `Community 10`, `Tables & Modals`, `API Routes & Services`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `warmDataCaches()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`warmDataCaches()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.05254378648874062 - nodes in this community are weakly interconnected._