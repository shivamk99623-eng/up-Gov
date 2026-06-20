# Graph Report - up  (2026-06-11)

## Corpus Check
- 78 files · ~30,167 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 524 nodes · 1545 edges · 21 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9e2a229`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App Pages & Layout|App Pages & Layout]]
- [[_COMMUNITY_Data Parsers|Data Parsers]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Representatives|Representatives]]
- [[_COMMUNITY_Tables & Modals|Tables & Modals]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Filter UI|Filter UI]]
- [[_COMMUNITY_Table Primitives|Table Primitives]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `warmDataCaches()` - 22 edges
3. `jsonError()` - 21 edges
4. `Sentiment` - 16 edges
5. `formatNumber()` - 15 edges
6. `loadRecords()` - 14 edges
7. `compactMpKey()` - 14 edges
8. `ensureCache()` - 14 edges
9. `loadPrintRecords()` - 14 edges
10. `getConstituencyOptions()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `LoadingState()` --calls--> `cn()`  [EXTRACTED]
  src/components/common/states.tsx → src/lib/utils.ts
- `register()` --calls--> `listAllMpBioMembers()`  [INFERRED]
  src/instrumentation.ts → src/lib/mp-bio-parser.ts
- `register()` --calls--> `getMLADirectory()`  [INFERRED]
  src/instrumentation.ts → src/services/representatives.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `warmDataCaches()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (21 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.12
Nodes (28): ConstituencyMediaTabs(), MediaTab(), PrintTab(), MediaScope, MediaTab(), printEmptyDescription(), PrintTab(), useConstituencyPrint() (+20 more)

### Community 1 - "Data Parsers"
Cohesion: 0.09
Nodes (51): GET(), GET(), GET(), jsonError(), parseFilters(), warmDataCaches(), filterRecords(), isKnownDistrict() (+43 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (21): classifyEntity(), constituencyFromTags(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractConstituency(), extractDistrict(), GEO_PATH (+13 more)

### Community 3 - "Representatives"
Cohesion: 0.09
Nodes (41): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+33 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.10
Nodes (36): formatCalendarDate(), isKnownLanguage(), toGeoName(), buildLookup(), canonicalizeMlaName(), canonicalizeMpName(), canonicalizeScope(), DATA_ROOT (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (56): BioCache, cleanText(), ensureCache(), listAllMlaBioMembers(), loadJson(), lookupMlaBio(), MLA_FILE, MLABioRecord (+48 more)

### Community 6 - "Filter UI"
Cohesion: 0.19
Nodes (13): HeaderProps, MEDIA_TYPES, SENTIMENTS, SelectContent, SelectItem, SelectTrigger, SheetContent, SheetContentProps (+5 more)

### Community 7 - "Table Primitives"
Cohesion: 0.14
Nodes (15): ChartCard(), ChartCardProps, useMLAs(), GovernmentMemberProfile, MPBioProfile, MLAPage(), MLAPageContent(), GovernmentMemberDetails() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (19): HomePage(), DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart() (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (12): DistrictMediaTabs(), useMPs(), useRepresentativeSelection(), formatNumber(), MLADetails(), StatTile(), HOUSE_TABS, HouseFilter (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (42): cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord (+34 more)

### Community 11 - "Community 11"
Cohesion: 0.23
Nodes (9): DateRangePicker(), DateRangePickerProps, presets, MultiSelect(), cn(), Checkbox, Input, Label (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.20
Nodes (8): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav(), Separator

### Community 13 - "Community 13"
Cohesion: 0.32
Nodes (10): MultiSelectProps, Option, SearchableSelectProps, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 15 - "Community 15"
Cohesion: 0.23
Nodes (8): DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

### Community 16 - "Community 16"
Cohesion: 0.31
Nodes (8): SummaryCard(), SummaryCardProps, ConstituencyPage(), SearchableSelect(), useConstituencyAnalytics(), useConstituencyOptions(), percent(), Skeleton()

### Community 17 - "Community 17"
Cohesion: 0.31
Nodes (9): EmptyState(), ErrorState(), LoadingState(), DistrictPage(), GlobalFilters(), Header(), useDistrictAnalytics(), useFilterOptions() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (6): grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), MediaBreakdown, SentimentBreakdown

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 20 - "Community 20"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

## Knowledge Gaps
- **71 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+66 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `App Pages & Layout`, `Representatives`, `Filter UI`, `Table Primitives`, `Community 8`, `Community 9`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 19`, `Community 20`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Sentiment` connect `App Pages & Layout` to `Data Parsers`, `Community 2`, `Representatives`, `Tables & Modals`, `Community 5`, `Filter UI`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `House` connect `Community 10` to `App Pages & Layout`, `Community 9`, `Community 5`, `Table Primitives`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `warmDataCaches()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`warmDataCaches()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _71 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.12436974789915967 - nodes in this community are weakly interconnected._