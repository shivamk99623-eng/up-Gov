# Graph Report - up  (2026-06-22)

## Corpus Check
- 92 files · ~32,689 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 613 nodes · 1987 edges · 19 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b90a2cc6`
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `queryPrintRecords()` - 26 edges
3. `jsonError()` - 25 edges
4. `queryDigitalMedia()` - 24 edges
5. `getDb()` - 23 edges
6. `warmDataCaches()` - 21 edges
7. `parseJsonStringArray()` - 18 edges
8. `formatNumber()` - 17 edges
9. `queryTableRecords()` - 16 edges
10. `parseFilters()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `GET()` --calls--> `getConstituencyDetail()`  [EXTRACTED]
  src/app/api/constituency/detail/route.ts → src/lib/constituency-detail.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (19 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.12
Nodes (9): useMLA(), useMLAs(), GovernmentMemberProfile, MPBioProfile, MLAPageContent(), GovernmentMemberDetails(), MPBioDetails(), RepresentativeDetailSkeleton() (+1 more)

### Community 1 - "Data Parsers"
Cohesion: 0.07
Nodes (73): buildMpNameIndex(), compactMpKey(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMpNameIndex(), lookupAlias(), MpNameIndex (+65 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (36): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+28 more)

### Community 3 - "Representatives"
Cohesion: 0.16
Nodes (28): ConstituencyPage(), DistrictPage(), appendPagination(), buildMediaParams(), buildScopedMediaUrl(), mediaEndpoint(), mergeTableFilters(), useConstituencyAnalytics() (+20 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.16
Nodes (14): GlobalFilters(), MEDIA_TYPES, SENTIMENTS, Label, SelectContent, SelectItem, SelectTrigger, SheetContent (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (28): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+20 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (87): buildConstituencyLookup(), CONSTITUENCY_ALIASES, isKnownConstituency(), listConstituencies(), normalizeKey(), resolveConstituencyToken(), formatCalendarDate(), DB_PATH (+79 more)

### Community 7 - "Table Primitives"
Cohesion: 0.19
Nodes (8): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav(), TooltipContent

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (27): ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, CommunityBarChart(), CommunityBarItem, CommunityPieChart(), grid (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (16): HomePage(), useMP(), useMPs(), MP, MPListItem, useRepresentativeSelection(), formatNumber(), MLADetails() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (21): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), grid (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (21): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), DistrictMediaTabs(), hasActiveTableFilters(), mediaEmptyDescription() (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.36
Nodes (7): EmptyState(), ErrorState(), LoadingState(), cn(), Badge(), BadgeProps, badgeVariants

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (65): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), warmDataCaches() (+57 more)

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (11): MultiSelect(), MultiSelectProps, Option, SearchableSelectProps, Command, CommandEmpty, CommandGroup, CommandInput (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.24
Nodes (10): Header(), debounce, throttle, useDebouncedState(), useDebouncedValue(), useIsDebouncing(), useThrottledCallback(), MediaTableQueryState (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.23
Nodes (8): DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (7): DateRangePickerProps, presets, HeaderProps, Button, ButtonProps, buttonVariants, Input

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (7): Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **75 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 12` to `App Pages & Layout`, `Community 2`, `Tables & Modals`, `Table Primitives`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 13` to `Representatives`, `Community 2`, `Community 11`, `Filter UI`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Filter UI` to `Data Parsers`, `Community 2`, `Community 11`, `Community 13`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.06993670886075949 - nodes in this community are weakly interconnected._