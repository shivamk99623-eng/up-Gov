# Graph Report - up  (2026-06-22)

## Corpus Check
- 93 files · ~33,050 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 591 nodes · 1881 edges · 17 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef4d0b06`
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `jsonError()` - 25 edges
3. `getDb()` - 19 edges
4. `queryPrintRecords()` - 19 edges
5. `queryDigitalMedia()` - 19 edges
6. `queryTableRecords()` - 18 edges
7. `parseJsonStringArray()` - 17 edges
8. `formatNumber()` - 17 edges
9. `parseFilters()` - 15 edges
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

## Communities (17 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.19
Nodes (5): SentimentDonut(), useMLA(), useMLAs(), MLAPageContent(), Separator

### Community 1 - "Data Parsers"
Cohesion: 0.13
Nodes (36): DB_PATH, getDb(), MpNameIndex, cleanText(), getMlaBioById(), getMpBioById(), listAllMlaBioMembers(), listAllMpBioMembers() (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (40): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+32 more)

### Community 3 - "Representatives"
Cohesion: 0.08
Nodes (49): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), hasActiveTableFilters(), mediaEmptyDescription(), MediaScope (+41 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.07
Nodes (40): inter, metadata, Providers(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), MultiSelect() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (23): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, ELECTION_YEARS, getConstituencyDetail(), normalizeKey() (+15 more)

### Community 6 - "Filter UI"
Cohesion: 0.07
Nodes (76): GET(), formatCalendarDate(), buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, isKnownDistrict(), listKnownDistricts(), resolveDistrictName() (+68 more)

### Community 7 - "Table Primitives"
Cohesion: 0.18
Nodes (10): ChartCardProps, GovernmentMemberProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (6): useMP(), useMPs(), useRepresentativeSelection(), HOUSE_TABS, HouseFilter, MPPageContent()

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (41): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), ConstituencyPage() (+33 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (19): grid, MediaCountChart(), MediaSentimentChart(), baseTooltip, CHART_COLORS, EChart(), EChartProps, EChartsInstance (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (39): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), compactMpKey(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex() (+31 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (40): GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), dedupeConstituencyNames(), listConstituencyDetailNames() (+32 more)

### Community 14 - "Community 14"
Cohesion: 0.31
Nodes (10): HomePage(), ChartCard(), EmptyState(), ErrorState(), LoadingState(), useDashboard(), cn(), Badge() (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (10): SummaryCard(), SummaryCardProps, formatNumber(), percent(), MLADetails(), StatTile(), MPDetails(), StatTile() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **77 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 14` to `App Pages & Layout`, `Community 2`, `Representatives`, `Tables & Modals`, `Table Primitives`, `Community 9`, `Community 11`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 10` to `Community 2`, `Representatives`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Filter UI` to `Community 2`, `Data Parsers`, `Community 10`, `Representatives`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.12804878048780488 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09306122448979592 - nodes in this community are weakly interconnected._