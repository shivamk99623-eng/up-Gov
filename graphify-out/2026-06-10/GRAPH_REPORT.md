# Graph Report - up  (2026-06-10)

## Corpus Check
- 73 files · ~27,710 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 469 nodes · 1358 edges · 12 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `24b24571`
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
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `jsonError()` - 23 edges
3. `Sentiment` - 16 edges
4. `formatNumber()` - 15 edges
5. `getConstituencyOptions()` - 15 edges
6. `loadPrintRecords()` - 14 edges
7. `loadRecords()` - 13 edges
8. `MediaType` - 13 edges
9. `Skeleton()` - 12 edges
10. `getDashboard()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyPrint()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/services/constituency.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/filters/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.05
Nodes (55): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase (+47 more)

### Community 1 - "Data Parsers"
Cohesion: 0.06
Nodes (48): endOfCalendarDay(), formatCalendarDate(), formatDisplayDateLong(), parseCalendarDate(), startOfCalendarDay(), classifyEntity(), DATA_PATH, DISTRICT_ALIASES (+40 more)

### Community 2 - "Analytics & Client"
Cohesion: 0.12
Nodes (25): DistrictPage(), DateRangePicker(), GlobalFilters(), SearchableSelect(), Header(), HeaderProps, useDistrictAnalytics(), useFilterOptions() (+17 more)

### Community 3 - "Representatives"
Cohesion: 0.11
Nodes (11): ParsedCache, normalizeGovernmentMemberName(), MediaRecord, RepType, buildMpMediaIndex(), EDUCATIONS, EntityAgg, FEMALE_NAMES (+3 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.10
Nodes (35): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+27 more)

### Community 5 - "API Routes & Services"
Cohesion: 0.08
Nodes (53): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), filterRecords(), loadRecords() (+45 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (56): EmptyState(), ErrorState(), LoadingState(), ConstituencyMediaTabs(), MediaTab(), PrintTab(), DistrictMediaTabs(), MediaScope (+48 more)

### Community 7 - "Table Primitives"
Cohesion: 0.19
Nodes (17): BioCache, CareerPosition, cleanText(), ensureCache(), indexRecord(), listLokSabhaBioMembers(), listRajyaSabhaBioMembers(), loadJson() (+9 more)

### Community 8 - "Root Layout"
Cohesion: 0.18
Nodes (22): cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (8): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav(), TooltipContent

### Community 10 - "Community 10"
Cohesion: 0.23
Nodes (12): listGovernmentMlaMembers(), listAllMpBioMembers(), canonicalizeMlaName(), listMlaNames(), listMpNamesByHouse(), GET(), GET(), collectMlaUnion() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.31
Nodes (10): loadAllPrintRecords(), loadDistrictPrintRecords(), loadMlaPrintRecords(), loadMpPrintRecords(), loadPrintRecords(), printCountsByDistrict(), addSentiment(), sentimentOf() (+2 more)

## Knowledge Gaps
- **65 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Filter UI` to `App Pages & Layout`, `Community 9`, `Analytics & Client`, `Tables & Modals`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `Sentiment` connect `Tables & Modals` to `Data Parsers`, `Analytics & Client`, `Representatives`, `API Routes & Services`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `MediaType` connect `API Routes & Services` to `Data Parsers`, `Analytics & Client`, `Tables & Modals`, `Filter UI`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getConstituencyOptions()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`getConstituencyOptions()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.0526006464883926 - nodes in this community are weakly interconnected._