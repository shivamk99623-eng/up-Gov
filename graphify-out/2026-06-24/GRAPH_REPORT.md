# Graph Report - up copy  (2026-06-24)

## Corpus Check
- 94 files · ~36,145 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 616 nodes · 2033 edges · 15 communities
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
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `jsonError()` - 26 edges
3. `getDb()` - 26 edges
4. `queryTableRecords()` - 22 edges
5. `parseJsonStringArray()` - 20 edges
6. `queryPrintRecords()` - 18 edges
7. `queryDigitalMedia()` - 18 edges
8. `formatNumber()` - 17 edges
9. `parseFilters()` - 16 edges
10. `aggregateFilteredStats()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `MpNameIndex` --references--> `MPBioRecord`  [EXTRACTED]
  src/lib/mp-name-matching.ts → src/lib/representatives-db.ts
- `GET()` --calls--> `jsonError()`  [EXTRACTED]
  src/app/api/constituency/detail/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts

## Import Cycles
- None detected.

## Communities (15 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.08
Nodes (45): createMediaTableQuery(), MediaTableQuery, EntityMediaStats, FilteredAggregateStats, MLABioRecord, MPBioRecord, CareerPosition, ConstituencyAnalyticsResponse (+37 more)

### Community 1 - "Data Parsers"
Cohesion: 0.12
Nodes (35): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (38): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+30 more)

### Community 3 - "Representatives"
Cohesion: 0.07
Nodes (53): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), hasActiveTableFilters(), mediaEmptyDescription(), MediaScope (+45 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.06
Nodes (56): inter, metadata, Providers(), LoadingState(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters() (+48 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (53): GET(), buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS (+45 more)

### Community 6 - "Filter UI"
Cohesion: 0.07
Nodes (81): endOfCalendarDay(), startOfCalendarDay(), buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, isKnownDistrict(), listKnownDistricts(), resolveDistrictName() (+73 more)

### Community 7 - "Table Primitives"
Cohesion: 0.28
Nodes (8): SummaryCard(), SummaryCardProps, formatNumber(), percent(), MLADetails(), StatTile(), MPDetails(), StatTile()

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (14): ChartCard(), CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): ChartCardProps, GovernmentMemberProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (22): HomePage(), DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart() (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (12): grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), EmptyState(), ErrorState(), ConstituencyPage(), ConstituencyScopePanel() (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (6): useMP(), useMPs(), useRepresentativeSelection(), HOUSE_TABS, HouseFilter, MPPageContent()

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (50): GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), resolveConstituencyFilter(), formatCalendarDate() (+42 more)

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (5): useMLA(), useMLAs(), MLAPageContent(), RepresentativeDetailSkeleton(), Skeleton()

## Knowledge Gaps
- **79 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Tables & Modals` to `Community 2`, `Representatives`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 14`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `MediaType` connect `App Pages & Layout` to `Community 2`, `Representatives`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `matchesSemanticSearch()` connect `Data Parsers` to `Representatives`, `Tables & Modals`, `Filter UI`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.08055152394775036 - nodes in this community are weakly interconnected._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.11711711711711711 - nodes in this community are weakly interconnected._