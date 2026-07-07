# Graph Report - up  (2026-07-07)

## Corpus Check
- 100 files · ~37,024 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 636 nodes · 2166 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb4d807c`
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
1. `cn()` - 56 edges
2. `getDb()` - 33 edges
3. `jsonError()` - 28 edges
4. `buildSqlWhere()` - 20 edges
5. `applyConstituencyScope()` - 19 edges
6. `formatNumber()` - 19 edges
7. `useFilterStore` - 19 edges
8. `getDashboard()` - 18 edges
9. `parseFilters()` - 17 edges
10. `queryTableRecords()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `applyConstituencyScope()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/news-repository.ts
- `GET()` --calls--> `getConstituencyDetail()`  [EXTRACTED]
  src/app/api/constituency/detail/route.ts → src/lib/constituency-detail.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (21 total, 1 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.25
Nodes (11): ChartCard(), grid, MediaCountChart(), MediaSentimentChart(), CHART_COLORS, ErrorState(), ConstituencyPage(), ConstituencyScopePanel() (+3 more)

### Community 1 - "Data Parsers"
Cohesion: 0.08
Nodes (57): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+49 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (43): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+35 more)

### Community 3 - "Representatives"
Cohesion: 0.09
Nodes (54): EmptyState(), ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), DistrictMediaTabs(), hasActiveTableFilters() (+46 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.13
Nodes (21): DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), HeaderProps, MEDIA_TYPES, SENTIMENTS, Button (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (10): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav(), Checkbox (+2 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (97): GET(), formatCalendarDate(), DB_PATH, getDb(), parseXEngagementsTotal(), buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO (+89 more)

### Community 7 - "Table Primitives"
Cohesion: 0.14
Nodes (8): SentimentDonut(), useMP(), useMPs(), MP, MPListItem, HOUSE_TABS, HouseFilter, MPPageContent()

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (11): ChartCardProps, GovernmentMemberProfile, MPBioProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (7): useMLA(), useMLAs(), MLA, useRepresentativeSelection(), MLAPageContent(), RepresentativeDetailSkeleton(), Skeleton()

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (44): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+36 more)

### Community 12 - "Community 12"
Cohesion: 0.32
Nodes (7): LoadingState(), MultiSelect(), SearchableSelect(), cn(), Badge(), BadgeProps, badgeVariants

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (64): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), isKnownLanguage() (+56 more)

### Community 14 - "Community 14"
Cohesion: 0.32
Nodes (10): MultiSelectProps, Option, SearchableSelectProps, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (17): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), baseTooltip (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (9): HomePage(), SummaryCard(), SummaryCardProps, formatNumber(), percent(), MLADetails(), StatTile(), MPDetails() (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.23
Nodes (8): DataTableCellContext, DataTableProps, SortState, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

### Community 20 - "Community 20"
Cohesion: 0.43
Nodes (5): GlobalSearchField(), GlobalSearchFieldProps, GlobalSearchStatusBar(), useGlobalSearchStatus(), Input

## Knowledge Gaps
- **84 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 12` to `App Pages & Layout`, `Community 2`, `Representatives`, `Tables & Modals`, `Community 5`, `Table Primitives`, `Community 9`, `Community 10`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 19`, `Community 20`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 13` to `Community 2`, `Representatives`, `Filter UI`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `normalizeSearchFilter()` connect `Representatives` to `Community 20`, `Tables & Modals`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.08408249603384453 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08708272859216255 - nodes in this community are weakly interconnected._