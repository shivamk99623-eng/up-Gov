# Graph Report - up  (2026-07-11)

## Corpus Check
- 113 files · ~42,175 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 735 nodes · 2631 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55d56861`
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 60 edges
2. `getDb()` - 43 edges
3. `jsonError()` - 32 edges
4. `formatNumber()` - 25 edges
5. `runDbOp()` - 24 edges
6. `buildSqlWhere()` - 23 edges
7. `useFilterStore` - 22 edges
8. `parseFilters()` - 21 edges
9. `useGlobalFiltersLoading()` - 20 edges
10. `getDashboard()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `applyConstituencyScope()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/news-repository.ts
- `GET()` --calls--> `getLegislativeAssemblyDetail()`  [INFERRED]
  src/app/api/legislative/detail/route.ts → src/lib/legislative-detail.ts
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `GET()` --calls--> `runDbOp()`  [INFERRED]
  src/app/api/constituency/detail/route.ts → src/lib/db-worker/pool.ts

## Import Cycles
- None detected.

## Communities (21 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (13): EmptyState(), ErrorState(), LoadingState(), GlobalFilterUpdatingMain(), SearchableSelect(), useMP(), useMPs(), useRepresentativeSelection() (+5 more)

### Community 1 - "Data Parsers"
Cohesion: 0.05
Nodes (90): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+82 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (42): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+34 more)

### Community 3 - "Representatives"
Cohesion: 0.19
Nodes (23): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), hasActiveTableFilters(), mediaEmptyDescription(), MediaScope (+15 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.31
Nodes (11): DistrictPage(), buildMediaParams(), mergeTableFilters(), useConstituencyPrint(), useDistrictAnalytics(), useGlobalFilterQuery(), usePrint(), useApiFilterState() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (11): MultiSelect(), MultiSelectProps, Option, SearchableSelectProps, Command, CommandEmpty, CommandGroup, CommandInput (+3 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (108): UpMapProps, endOfCalendarDay(), formatCalendarDate(), startOfCalendarDay(), DB_PATH, getDb(), parseXEngagementsTotal(), buildDistrictLookup() (+100 more)

### Community 7 - "Community 7"
Cohesion: 0.20
Nodes (10): useDebouncedCallback(), DataTable(), DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (4): inter, metadata, Providers(), AppShell()

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): ChartCardProps, useMLA(), useMLAs(), MLAPageContent(), GovernmentMemberDetails(), MPBioDetails(), PersonElectionHistoryCard(), Badge() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.60
Nodes (3): Emblem(), links, SidebarNav()

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (48): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, listConstituencyDetailNames() (+40 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (43): buildConstituencyLookup(), CONSTITUENCY_ALIASES, isKnownConstituency(), listConstituencies(), normalizeKey(), resolveConstituencyFilter(), resolveConstituencyToken(), appendMediaTableQuery() (+35 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (54): GET(), GET(), dispatchDbOp(), acquire(), createWorker(), ensurePool(), failAllForWorker(), Pending (+46 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (27): ChartCard(), CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail() (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 17 - "Community 17"
Cohesion: 0.26
Nodes (13): GlobalFilterLoadingBar(), debounce, normalizeSearchFilter(), ApiFilterValues, useDebouncedState(), useDebouncedValue(), GLOBAL_FILTER_QUERY_ROOTS, useFilterDrivenFetching() (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (24): DateRangePicker(), DateRangePickerProps, presets, GlobalFilterStatusBar(), GlobalFilters(), GlobalSearchField(), GlobalSearchFieldProps, GlobalSearchStatusBar() (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (24): HomePage(), DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart() (+16 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (11): SummaryCard(), SummaryCardProps, formatCompact(), formatNumber(), percent(), MLADetails(), StatTile(), MPDetails() (+3 more)

## Knowledge Gaps
- **97 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 2`, `Representatives`, `Community 5`, `Community 7`, `Community 9`, `Community 10`, `Community 15`, `Community 16`, `Community 19`, `Community 20`, `Community 22`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Filter UI` to `Data Parsers`, `Community 11`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `normalizeSearchFilter()` connect `Community 17` to `Representatives`, `Tables & Modals`, `Filter UI`, `Community 13`, `Community 19`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `runDbOp()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`runDbOp()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._