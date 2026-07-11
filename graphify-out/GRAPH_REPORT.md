# Graph Report - up  (2026-07-11)

## Corpus Check
- 113 files · ~42,307 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 736 nodes · 2637 edges · 20 communities (19 shown, 1 thin omitted)
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
- `GET()` --calls--> `getConstituencyDetail()`  [INFERRED]
  src/app/api/constituency/detail/route.ts → src/lib/constituency-detail.ts
- `GET()` --calls--> `applyConstituencyScope()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/news-repository.ts
- `GET()` --calls--> `getLegislativeAssemblyDetail()`  [INFERRED]
  src/app/api/legislative/detail/route.ts → src/lib/legislative-detail.ts
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (20): ChartCard(), EmptyState(), ErrorState(), LoadingState(), DistrictMediaTabs(), GlobalFilterUpdatingMain(), SearchableSelect(), Header() (+12 more)

### Community 1 - "Data Parsers"
Cohesion: 0.05
Nodes (89): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+81 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (41): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+33 more)

### Community 3 - "Representatives"
Cohesion: 0.22
Nodes (11): grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), ConstituencyPage(), ConstituencyScopePanel(), useConstituencyAnalytics(), useConstituencyOptions() (+3 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.33
Nodes (8): GlobalFilterLoadingBar(), GlobalFilterStatusBar(), GlobalSearchField(), GlobalSearchFieldProps, GlobalSearchStatusBar(), HeaderProps, useGlobalSearchStatus(), Input

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (14): MultiSelect(), MultiSelectProps, Option, SearchableSelectProps, Button, ButtonProps, buttonVariants, Command (+6 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (115): UpMapProps, endOfCalendarDay(), formatCalendarDate(), startOfCalendarDay(), DB_PATH, getDb(), parseXEngagementsTotal(), buildDistrictLookup() (+107 more)

### Community 7 - "Community 7"
Cohesion: 0.23
Nodes (8): DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (19): ChartCardProps, ElectionHistoryCard(), buildCommunityBarItems(), LegislativeAssemblyDetail(), PARTY_TABS, reservationLabel(), useLegislativeAssemblyDetail(), ConstituencyPartyOrg (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (52): GET(), buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS (+44 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (51): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), hasActiveTableFilters(), mediaEmptyDescription(), MediaScope (+43 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (64): GET(), GET(), dispatchDbOp(), acquire(), createWorker(), ensurePool(), failAllForWorker(), Pending (+56 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (11): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (19): DistrictPage(), GlobalFilters(), useDistrictAnalytics(), useGlobalFilterQuery(), debounce, normalizeSearchFilter(), useApiFilterState(), useGlobalFiltersPending() (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (16): DateRangePicker(), DateRangePickerProps, presets, MEDIA_TYPES, SENTIMENTS, Label, SelectContent, SelectItem (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (18): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), baseTooltip (+10 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (13): HomePage(), SummaryCard(), SummaryCardProps, useDashboard(), formatCompact(), formatNumber(), percent(), MLADetails() (+5 more)

## Knowledge Gaps
- **97 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 2`, `Representatives`, `Tables & Modals`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 12`, `Community 16`, `Community 19`, `Community 20`, `Community 22`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Filter UI` to `Data Parsers`, `Community 11`, `Community 13`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `normalizeSearchFilter()` connect `Community 17` to `Community 12`, `Tables & Modals`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `runDbOp()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`runDbOp()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11201079622132254 - nodes in this community are weakly interconnected._