# Graph Report - up  (2026-07-12)

## Corpus Check
- 114 files · ~42,942 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 724 nodes · 2610 edges · 23 communities (22 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62489123`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Data Parsers|Data Parsers]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Representatives|Representatives]]
- [[_COMMUNITY_Tables & Modals|Tables & Modals]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Filter UI|Filter UI]]
- [[_COMMUNITY_Community 7|Community 7]]
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
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 59 edges
2. `getDb()` - 45 edges
3. `jsonError()` - 27 edges
4. `formatNumber()` - 25 edges
5. `runDbOp()` - 24 edges
6. `buildSqlWhere()` - 24 edges
7. `dispatchDbOp()` - 21 edges
8. `useFilterStore` - 21 edges
9. `parseFilters()` - 20 edges
10. `getDashboard()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getConstituencyDetail()`  [INFERRED]
  src/app/api/constituency/detail/route.ts → src/lib/constituency-detail.ts
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET()` --calls--> `applyConstituencyScope()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/news-repository.ts
- `GET()` --calls--> `getFilterOptions()`  [INFERRED]
  src/app/api/filters/route.ts → src/services/analytics.ts
- `GET()` --calls--> `getLegislativeAssemblyDetail()`  [INFERRED]
  src/app/api/legislative/detail/route.ts → src/lib/legislative-detail.ts

## Import Cycles
- None detected.

## Communities (23 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (14): useMLAs(), useMPs(), House, MPBioProfile, useRepresentativeSelection(), MLAPageContent(), HOUSE_TABS, HouseFilter (+6 more)

### Community 1 - "Data Parsers"
Cohesion: 0.06
Nodes (69): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+61 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (38): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+30 more)

### Community 3 - "Representatives"
Cohesion: 0.16
Nodes (26): EmptyState(), ErrorState(), ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), DistrictMediaTabs() (+18 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.32
Nodes (10): MultiSelectProps, Option, SearchableSelectProps, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (46): HomePage(), ConstituencyPage(), ConstituencyScopePanel(), DistrictPage(), GlobalFilterStatusBar(), GlobalFilters(), GlobalSearchField(), GlobalSearchFieldProps (+38 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (109): assembleDashboard(), DashboardRollups, DashboardStats, mergeKindDailyTrends(), endOfCalendarDay(), formatCalendarDate(), parseCalendarDate(), startOfCalendarDay() (+101 more)

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (19): buildPersonSearchKeywords(), buildRepSelectOption(), entitySearchLikePatterns(), entitySearchTokenGroups(), entitySearchTokens(), expandSpellingVariants(), formatRepOptionLabel(), matchesSemanticSearch() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (10): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav(), Checkbox (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (16): ChartCard(), ChartCardProps, ElectionHistoryCard(), buildCommunityBarItems(), LegislativeAssemblyDetail(), PARTY_TABS, reservationLabel(), useLegislativeAssemblyDetail() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (19): DigitalNewsRecordBase, GlobalFilters, MEDIA_TYPES, MediaQueryResponse, MediaRecord, MediaType, NewsArrayFields, NewsMediaKind (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (62): buildInsights(), buildNameIndex(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail(), listConstituencyDetailNames() (+54 more)

### Community 12 - "Community 12"
Cohesion: 0.28
Nodes (8): SummaryCard(), SummaryCardProps, formatNumber(), percent(), MLADetails(), StatTile(), MPDetails(), StatTile()

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (49): GET(), GET(), dispatchDbOp(), acquire(), createWorker(), ensurePool(), failAllForWorker(), Pending (+41 more)

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (10): SelectContent, SelectItem, SelectTrigger, SheetContent, SheetContentProps, SheetDescription, SheetHeader(), SheetOverlay (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (12): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (8): DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (18): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), baseTooltip (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.27
Nodes (7): grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), TabsContent, TabsList, TabsTrigger

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (8): DateRangePicker(), DateRangePickerProps, presets, formatDisplayDateLong(), Button, ButtonProps, buttonVariants, Label

### Community 22 - "Community 22"
Cohesion: 0.32
Nodes (7): LoadingState(), MultiSelect(), SearchableSelect(), cn(), Badge(), BadgeProps, badgeVariants

## Knowledge Gaps
- **94 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 22` to `Community 0`, `Community 2`, `Representatives`, `Tables & Modals`, `Community 5`, `Community 8`, `Community 9`, `Community 12`, `Community 14`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 21`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Filter UI` to `Data Parsers`, `Community 11`, `Community 13`, `Community 7`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 10` to `Community 2`, `Representatives`, `Community 5`, `Filter UI`, `Community 11`, `Community 13`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `runDbOp()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`runDbOp()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._