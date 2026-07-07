# Graph Report - up  (2026-07-07)

## Corpus Check
- 99 files · ~36,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 665 nodes · 2290 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1294fa0f`
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
4. `buildSqlWhere()` - 23 edges
5. `queryTableRecords()` - 23 edges
6. `getDashboard()` - 22 edges
7. `parseJsonStringArray()` - 20 edges
8. `aggregateFilteredStats()` - 20 edges
9. `queryDigitalMedia()` - 20 edges
10. `applyConstituencyScope()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `applyConstituencyScope()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/news-repository.ts
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

## Communities (21 total, 1 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.18
Nodes (15): ChartCard(), SummaryCard(), SummaryCardProps, grid, MediaCountChart(), MediaSentimentChart(), baseTooltip, CHART_COLORS (+7 more)

### Community 1 - "Data Parsers"
Cohesion: 0.07
Nodes (62): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+54 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (43): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+35 more)

### Community 3 - "Representatives"
Cohesion: 0.08
Nodes (58): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), ConstituencyPage(), ConstituencyScopePanel(), PrintSummaryTable(), hasActiveTableFilters() (+50 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.06
Nodes (49): DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), MultiSelect(), MultiSelectProps, Option, SearchableSelectProps (+41 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (26): parseDistrictNames(), baseDigitalFields(), buildHeadline(), columnsForKind(), DIGITAL_TABLES, DigitalMediaKind, extractNewsArrayFields(), inferPrintScope() (+18 more)

### Community 6 - "Filter UI"
Cohesion: 0.11
Nodes (32): entitySearchLikePatterns(), tokenizeSearch(), addSentimentCount(), buildEntitySqlPrefilter(), buildSearchSqlPrefilter(), buildSqlWhere(), DashboardValueRollupMode, DIGITAL_SORT (+24 more)

### Community 7 - "Table Primitives"
Cohesion: 0.18
Nodes (25): formatCalendarDate(), aggregateFilteredStats(), aggRowColumns(), applyConstituencyScope(), countAndSentimentSql(), dailyTrendCountsSql(), emptySentimentBreakdown(), loadAllDigitalRecords() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (15): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (8): ChartCardProps, MPBioDetails(), Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (19): HomePage(), SentimentDonut(), DistrictMediaTabs(), useMLA(), useMLAs(), useMP(), useMPs(), useRepresentativeSelection() (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (34): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+26 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (25): endOfCalendarDay(), startOfCalendarDay(), DistrictRef, jsonArrayContains(), parseFirstLink(), parseJsonStringArray(), parsePersonNameArray(), isKnownLanguage() (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (57): GET(), GET(), GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination() (+49 more)

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (14): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), EChart() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (11): EmptyState(), ErrorState(), LoadingState(), cn(), formatCompact(), percent(), Badge(), BadgeProps (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.38
Nodes (14): getDb(), isKnownDistrict(), tableForKind(), aggregateDashboardValueCounts(), buildDashboardDistrictSummary(), buildPrintCountIndex(), bumpDistrictSummary(), dashboardAggColumns() (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (10): DB_PATH, buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, listKnownDistricts(), resolveDistrictName(), toGeoName(), bumpEntityDistrictCounts() (+2 more)

## Knowledge Gaps
- **89 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 17` to `App Pages & Layout`, `Community 2`, `Representatives`, `Tables & Modals`, `Community 8`, `Community 9`, `Community 10`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Representatives` to `Community 2`, `Community 5`, `Filter UI`, `Table Primitives`, `Community 13`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `normalizeSearchFilter()` connect `Representatives` to `Tables & Modals`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.0741745816372682 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08455625436757512 - nodes in this community are weakly interconnected._