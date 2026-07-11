# Graph Report - up  (2026-07-11)

## Corpus Check
- 113 files · ~42,358 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 713 nodes · 2568 edges · 22 communities (21 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ad73c89`
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 59 edges
2. `getDb()` - 43 edges
3. `jsonError()` - 27 edges
4. `formatNumber()` - 25 edges
5. `runDbOp()` - 24 edges
6. `buildSqlWhere()` - 23 edges
7. `useFilterStore` - 21 edges
8. `parseFilters()` - 20 edges
9. `getDashboard()` - 20 edges
10. `dispatchDbOp()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getConstituencyDetail()`  [INFERRED]
  src/app/api/constituency/detail/route.ts → src/lib/constituency-detail.ts
- `GET()` --calls--> `applyConstituencyScope()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/news-repository.ts
- `GET()` --calls--> `getLegislativeAssemblyDetail()`  [INFERRED]
  src/app/api/legislative/detail/route.ts → src/lib/legislative-detail.ts
- `GET()` --calls--> `runDbOp()`  [INFERRED]
  src/app/api/constituency/detail/route.ts → src/lib/db-worker/pool.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/detail/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (22 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (21): ChartCard(), SentimentDonut(), DistrictMediaTabs(), GlobalFilterStatusBar(), useMLA(), useMLAs(), useMP(), useMPs() (+13 more)

### Community 1 - "Data Parsers"
Cohesion: 0.09
Nodes (52): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+44 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (44): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+36 more)

### Community 3 - "Representatives"
Cohesion: 0.20
Nodes (23): ErrorState(), ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), hasActiveTableFilters(), mediaEmptyDescription() (+15 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.17
Nodes (22): buildPersonSearchKeywords(), buildRepSelectOption(), compactPersonKeyWithTitle(), entitySearchLikePatterns(), entitySearchTokenGroups(), entitySearchTokens(), expandPersonNameVariants(), expandSpellingVariants() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (20): EmptyState(), LoadingState(), MultiSelect(), MultiSelectProps, Option, SearchableSelect(), SearchableSelectProps, cn() (+12 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (95): formatCalendarDate(), getDb(), parseXEngagementsTotal(), buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, isKnownDistrict(), listKnownDistricts() (+87 more)

### Community 7 - "Community 7"
Cohesion: 0.23
Nodes (8): DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (4): inter, metadata, Providers(), AppShell()

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (9): ChartCardProps, MPBioProfile, MPBioDetails(), Card, CardContent, CardDescription, CardFooter, CardHeader (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (7): ElectionHistoryCard(), buildCommunityBarItems(), LegislativeAssemblyDetail(), PARTY_TABS, reservationLabel(), useLegislativeAssemblyDetail(), LegislativeAssemblyDetailResponse

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (58): buildInsights(), buildNameIndex(), constituencyDedupeKey(), ConstituencyRow, ELECTION_YEARS, getConstituencyDetail(), normalizeKey(), resolveConstituencyDetailName() (+50 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (34): buildMediaParams(), ListPagination, mediaEndpoint(), mergeTableFilters(), usePrint(), appendMediaTableQuery(), createMediaTableQuery(), MediaTableQuery (+26 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (71): GET(), GET(), dispatchDbOp(), acquire(), createWorker(), ensurePool(), failAllForWorker(), Pending (+63 more)

### Community 14 - "Community 14"
Cohesion: 0.60
Nodes (3): Emblem(), links, SidebarNav()

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (12): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (22): HomePage(), DistrictPage(), Header(), useDashboard(), useDistrictAnalytics(), useGlobalFilterQuery(), debounce, normalizeSearchFilter() (+14 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (21): DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), GlobalSearchField(), GlobalSearchFieldProps, GlobalSearchStatusBar(), HeaderProps (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (26): SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart() (+18 more)

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (4): ConstituencyPage(), ConstituencyScopePanel(), useConstituencyAnalytics(), useConstituencyOptions()

## Knowledge Gaps
- **92 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+87 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 5` to `Community 0`, `Community 2`, `Representatives`, `Community 7`, `Community 9`, `Community 14`, `Community 16`, `Community 17`, `Community 19`, `Community 20`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Filter UI` to `Data Parsers`, `Community 11`, `Tables & Modals`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 13` to `Community 2`, `Representatives`, `Filter UI`, `Community 12`, `Community 17`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `runDbOp()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`runDbOp()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _92 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08534850640113797 - nodes in this community are weakly interconnected._