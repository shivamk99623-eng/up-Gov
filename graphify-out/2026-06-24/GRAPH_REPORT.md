# Graph Report - up copy  (2026-06-24)

## Corpus Check
- 94 files · ~36,171 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 615 nodes · 2030 edges · 14 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4eda815f`
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `jsonError()` - 26 edges
3. `getDb()` - 25 edges
4. `queryTableRecords()` - 22 edges
5. `parseJsonStringArray()` - 20 edges
6. `queryPrintRecords()` - 18 edges
7. `queryDigitalMedia()` - 18 edges
8. `formatNumber()` - 17 edges
9. `parseFilters()` - 16 edges
10. `aggregateFilteredStats()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `GET()` --calls--> `jsonError()`  [EXTRACTED]
  src/app/api/constituency/detail/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (14 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.20
Nodes (22): EmptyState(), ErrorState(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), DistrictMediaTabs(), hasActiveTableFilters() (+14 more)

### Community 1 - "Data Parsers"
Cohesion: 0.09
Nodes (55): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+47 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (37): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+29 more)

### Community 3 - "Representatives"
Cohesion: 0.10
Nodes (27): debounce, throttle, buildPersonSearchKeywords(), buildRepSelectOption(), entitySearchLikePatterns(), expandSpellingVariants(), formatRepOptionLabel(), matchesSemanticSearch() (+19 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.06
Nodes (56): inter, metadata, Providers(), LoadingState(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters() (+48 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (33): GET(), buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS (+25 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (95): endOfCalendarDay(), formatCalendarDate(), parseCalendarDate(), startOfCalendarDay(), DB_PATH, getDb(), buildDistrictLookup(), DISTRICT_ALIASES (+87 more)

### Community 7 - "Table Primitives"
Cohesion: 0.28
Nodes (8): SummaryCard(), SummaryCardProps, formatNumber(), percent(), MLADetails(), StatTile(), MPDetails(), StatTile()

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (21): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (22): ChartCard(), ChartCardProps, SentimentDonut(), useMLA(), useMLAs(), useMP(), useMPs(), GovernmentMemberProfile (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (20): HomePage(), DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (6): grid, MediaCountChart(), MediaSentimentChart(), CHART_COLORS, DistrictPage(), useDistrictAnalytics()

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (74): GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), appendMediaTableQuery(), createMediaTableQuery() (+66 more)

### Community 14 - "Community 14"
Cohesion: 0.35
Nodes (11): Header(), buildMediaParams(), mediaEndpoint(), mergeTableFilters(), useConstituencyPrint(), useGlobalFilterQuery(), usePrint(), useScopedMedia() (+3 more)

## Knowledge Gaps
- **79 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Tables & Modals` to `App Pages & Layout`, `Community 2`, `Representatives`, `Community 8`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 13` to `App Pages & Layout`, `Community 2`, `Filter UI`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `matchesSemanticSearch()` connect `Representatives` to `Tables & Modals`, `Filter UI`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.08531073446327683 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09855072463768116 - nodes in this community are weakly interconnected._