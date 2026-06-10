# Graph Report - up  (2026-06-10)

## Corpus Check
- 74 files · ~28,408 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 487 nodes · 1413 edges · 10 communities
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

## Communities (10 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.07
Nodes (58): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, grid, MediaCountChart(), MediaSentimentChart() (+50 more)

### Community 1 - "Data Parsers"
Cohesion: 0.06
Nodes (60): endOfCalendarDay(), formatCalendarDate(), parseCalendarDate(), startOfCalendarDay(), classifyEntity(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO (+52 more)

### Community 2 - "Analytics & Client"
Cohesion: 0.06
Nodes (48): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), baseTooltip (+40 more)

### Community 3 - "Representatives"
Cohesion: 0.07
Nodes (38): ParsedCache, listAllMpBioMembers(), MPBioRecord, buildMpNameIndex(), compactMpKey(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames() (+30 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.11
Nodes (34): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+26 more)

### Community 5 - "API Routes & Services"
Cohesion: 0.12
Nodes (36): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), filterRecords(), isKnownDistrict() (+28 more)

### Community 6 - "Filter UI"
Cohesion: 0.07
Nodes (41): DateRangePicker(), DateRangePickerProps, presets, MultiSelect(), MultiSelectProps, Option, SearchableSelectProps, HeaderProps (+33 more)

### Community 7 - "Table Primitives"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 8 - "Root Layout"
Cohesion: 0.09
Nodes (40): cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord (+32 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (8): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav(), TooltipContent

## Knowledge Gaps
- **66 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `App Pages & Layout` to `Analytics & Client`, `Tables & Modals`, `Filter UI`, `Table Primitives`, `Community 9`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `Sentiment` connect `Tables & Modals` to `Data Parsers`, `Analytics & Client`, `Representatives`, `API Routes & Services`, `Filter UI`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Representatives` to `Data Parsers`, `Analytics & Client`, `Tables & Modals`, `API Routes & Services`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getConstituencyOptions()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`getConstituencyOptions()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.06867305061559507 - nodes in this community are weakly interconnected._