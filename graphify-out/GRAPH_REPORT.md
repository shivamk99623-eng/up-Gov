# Graph Report - up  (2026-06-10)

## Corpus Check
- 74 files · ~28,507 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 482 nodes · 1397 edges · 12 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `829519a9`
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
6. `loadRecords()` - 13 edges
7. `loadPrintRecords()` - 13 edges
8. `MediaType` - 13 edges
9. `resolveConstituencyToken()` - 12 edges
10. `Skeleton()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `GET()` --calls--> `jsonError()`  [EXTRACTED]
  src/app/api/mp/route.ts → src/lib/api-helpers.ts
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mp/page.tsx → src/lib/utils.ts
- `MPDetails()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mp/page.tsx → src/lib/utils.ts
- `buildDistrictSummary()` --calls--> `toGeoName()`  [EXTRACTED]
  src/services/analytics.ts → src/lib/excel-parser.ts

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.06
Nodes (63): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, grid, MediaCountChart(), MediaSentimentChart() (+55 more)

### Community 1 - "Data Parsers"
Cohesion: 0.06
Nodes (54): formatCalendarDate(), classifyEntity(), constituencyFromTags(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractConstituency(), extractDistrict() (+46 more)

### Community 2 - "Analytics & Client"
Cohesion: 0.07
Nodes (48): MediaTab(), ConstituencyPage(), MediaTab(), DistrictPage(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters() (+40 more)

### Community 3 - "Representatives"
Cohesion: 0.07
Nodes (38): ParsedCache, listAllMpBioMembers(), MPBioRecord, buildMpNameIndex(), compactMpKey(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames() (+30 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.09
Nodes (41): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+33 more)

### Community 5 - "API Routes & Services"
Cohesion: 0.11
Nodes (39): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), filterRecords(), loadRecords() (+31 more)

### Community 6 - "Filter UI"
Cohesion: 0.29
Nodes (11): MultiSelect(), MultiSelectProps, Option, SearchableSelectProps, Command, CommandEmpty, CommandGroup, CommandInput (+3 more)

### Community 7 - "Table Primitives"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 8 - "Root Layout"
Cohesion: 0.10
Nodes (39): cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord (+31 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (12): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), MediaBreakdown (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.23
Nodes (8): DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

## Knowledge Gaps
- **66 isolated node(s):** `HouseFilter`, `HOUSE_TABS`, `DATA_PATH`, `GEO_PATH`, `DISTRICT_TO_GEO` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `App Pages & Layout` to `Analytics & Client`, `Tables & Modals`, `Filter UI`, `Table Primitives`, `Community 9`, `Community 11`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Sentiment` connect `Tables & Modals` to `Data Parsers`, `Analytics & Client`, `Representatives`, `API Routes & Services`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Analytics & Client` to `App Pages & Layout`, `Data Parsers`, `Tables & Modals`, `API Routes & Services`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getConstituencyOptions()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`getConstituencyOptions()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `HouseFilter`, `HOUSE_TABS`, `DATA_PATH` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.06427771556550951 - nodes in this community are weakly interconnected._