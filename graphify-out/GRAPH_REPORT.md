# Graph Report - up  (2026-06-22)

## Corpus Check
- 92 files · ~32,689 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 562 nodes · 1787 edges · 16 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `45d2f5e0`
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
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `jsonError()` - 25 edges
3. `getDb()` - 19 edges
4. `queryPrintRecords()` - 19 edges
5. `queryDigitalMedia()` - 19 edges
6. `formatNumber()` - 17 edges
7. `queryTableRecords()` - 16 edges
8. `parseFilters()` - 15 edges
9. `parseJsonStringArray()` - 15 edges
10. `MediaType` - 15 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/filters/route.ts → src/lib/api-helpers.ts
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

## Communities (16 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.17
Nodes (7): useMLA(), useMLAs(), useRepresentativeSelection(), MLAPageContent(), Badge(), BadgeProps, badgeVariants

### Community 1 - "Data Parsers"
Cohesion: 0.08
Nodes (57): DB_PATH, getDb(), buildMpNameIndex(), compactMpKey(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMpNameIndex() (+49 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (38): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+30 more)

### Community 3 - "Representatives"
Cohesion: 0.07
Nodes (57): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), ConstituencyPage(), hasActiveTableFilters(), mediaEmptyDescription(), MediaTab() (+49 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.07
Nodes (40): inter, metadata, Providers(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), MultiSelect() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (26): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+18 more)

### Community 6 - "Filter UI"
Cohesion: 0.07
Nodes (74): GET(), formatCalendarDate(), buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, isKnownDistrict(), listKnownDistricts(), resolveDistrictName() (+66 more)

### Community 7 - "Table Primitives"
Cohesion: 0.18
Nodes (11): ChartCard(), ChartCardProps, GovernmentMemberProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (15): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (6): useMP(), useMPs(), HOUSE_TABS, HouseFilter, MPPageContent(), Separator

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (23): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), UpMapProps (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (11): grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), baseTooltip, EChart(), EChartProps, EChartsInstance (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.27
Nodes (9): EmptyState(), ErrorState(), LoadingState(), DistrictMediaTabs(), MediaScope, SearchableSelect(), cn(), Checkbox (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (41): GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), buildConstituencyLookup(), CONSTITUENCY_ALIASES (+33 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (14): HomePage(), SummaryCard(), SummaryCardProps, CHART_COLORS, UpMap(), Header(), formatNumber(), percent() (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **73 isolated node(s):** `GET`, `GET`, `GET`, `HouseFilter`, `HOUSE_TABS` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 12` to `App Pages & Layout`, `Community 2`, `Representatives`, `Tables & Modals`, `Table Primitives`, `Community 8`, `Community 9`, `Community 11`, `Community 15`, `Community 18`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Representatives` to `Community 2`, `Filter UI`, `Community 10`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Filter UI` to `Data Parsers`, `Community 10`, `Community 2`, `Community 12`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.08294930875576037 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09219858156028368 - nodes in this community are weakly interconnected._