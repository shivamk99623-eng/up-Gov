# Graph Report - up  (2026-07-07)

## Corpus Check
- 99 files · ~36,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 632 nodes · 2156 edges · 18 communities (17 shown, 1 thin omitted)
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 56 edges
2. `getDb()` - 32 edges
3. `jsonError()` - 28 edges
4. `buildSqlWhere()` - 19 edges
5. `applyConstituencyScope()` - 19 edges
6. `useFilterStore` - 19 edges
7. `formatNumber()` - 19 edges
8. `getDashboard()` - 18 edges
9. `parseFilters()` - 17 edges
10. `queryTableRecords()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `applyConstituencyScope()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/news-repository.ts
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `GET()` --calls--> `getFilterOptions()`  [INFERRED]
  src/app/api/filters/route.ts → src/services/analytics.ts
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `MpNameIndex` --references--> `MPBioRecord`  [EXTRACTED]
  src/lib/mp-name-matching.ts → src/lib/representatives-db.ts

## Import Cycles
- None detected.

## Communities (18 total, 1 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.24
Nodes (8): grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), Header(), TabsContent, TabsList, TabsTrigger

### Community 1 - "Data Parsers"
Cohesion: 0.10
Nodes (46): EntityMediaStats, FilteredAggregateStats, cleanText(), getMlaBioById(), getMpBioById(), listAllMlaBioMembers(), listAllMpBioMembers(), mapLokRow() (+38 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (51): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+43 more)

### Community 3 - "Representatives"
Cohesion: 0.08
Nodes (58): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), ConstituencyPage(), ConstituencyScopePanel(), hasActiveTableFilters(), mediaEmptyDescription() (+50 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.07
Nodes (40): inter, metadata, Providers(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), MultiSelect() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (38): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+30 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (102): formatCalendarDate(), DB_PATH, getDb(), buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, isKnownDistrict(), listKnownDistricts() (+94 more)

### Community 7 - "Table Primitives"
Cohesion: 0.16
Nodes (7): useMP(), useMPs(), HOUSE_TABS, HouseFilter, MPPageContent(), RepresentativeDetailSkeleton(), Skeleton()

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): ChartCardProps, GovernmentMemberProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (8): useMLA(), useMLAs(), useRepresentativeSelection(), MLAPageContent(), Badge(), BadgeProps, badgeVariants, Separator

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (27): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.44
Nodes (7): ChartCard(), EmptyState(), ErrorState(), LoadingState(), DistrictMediaTabs(), SearchableSelect(), cn()

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (48): GET(), GET(), GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination() (+40 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (20): HomePage(), DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart() (+12 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (11): SummaryCard(), SummaryCardProps, formatCompact(), formatNumber(), percent(), MLADetails(), StatTile(), MPDetails() (+3 more)

## Knowledge Gaps
- **84 isolated node(s):** `SummaryCardProps`, `MediaScope`, `GlobalSearchFieldProps`, `HeaderProps`, `DataTableCellContext` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 12` to `App Pages & Layout`, `Community 2`, `Representatives`, `Tables & Modals`, `Table Primitives`, `Community 9`, `Community 10`, `Community 15`, `Community 16`, `Community 17`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Representatives` to `Data Parsers`, `Community 2`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `normalizeSearchFilter()` connect `Representatives` to `Tables & Modals`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SummaryCardProps`, `MediaScope`, `GlobalSearchFieldProps` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.09725490196078432 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06682692307692308 - nodes in this community are weakly interconnected._