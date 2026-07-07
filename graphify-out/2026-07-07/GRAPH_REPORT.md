# Graph Report - up  (2026-07-07)

## Corpus Check
- 99 files · ~36,597 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 660 nodes · 2262 edges · 17 communities (16 shown, 1 thin omitted)
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 56 edges
2. `getDb()` - 32 edges
3. `jsonError()` - 28 edges
4. `queryTableRecords()` - 23 edges
5. `buildSqlWhere()` - 22 edges
6. `parseJsonStringArray()` - 20 edges
7. `queryDigitalMedia()` - 20 edges
8. `getDashboard()` - 20 edges
9. `aggregateFilteredStats()` - 19 edges
10. `formatNumber()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
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

## Communities (17 total, 1 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.18
Nodes (15): ChartCard(), grid, MediaCountChart(), MediaSentimentChart(), baseTooltip, CHART_COLORS, EChart(), EChartProps (+7 more)

### Community 1 - "Data Parsers"
Cohesion: 0.07
Nodes (67): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+59 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (44): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+36 more)

### Community 3 - "Representatives"
Cohesion: 0.09
Nodes (47): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), ConstituencyPage(), ConstituencyScopePanel(), PrintSummaryTable(), hasActiveTableFilters() (+39 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.07
Nodes (49): DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), GlobalSearchField(), GlobalSearchFieldProps, GlobalSearchStatusBar(), HeaderProps (+41 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (28): UpMapProps, formatCalendarDate(), baseDigitalFields(), buildHeadline(), DIGITAL_TABLES, DigitalMediaKind, normalizeSentiment(), parseTimestamp() (+20 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (108): constituencyDedupeKey(), buildConstituencyLookup(), CONSTITUENCY_ALIASES, isKnownConstituency(), listConstituencies(), normalizeKey(), resolveConstituencyFilter(), resolveConstituencyToken() (+100 more)

### Community 7 - "Table Primitives"
Cohesion: 0.32
Nodes (10): MultiSelectProps, Option, SearchableSelectProps, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): ChartCardProps, GovernmentMemberProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (20): SentimentDonut(), EmptyState(), ErrorState(), LoadingState(), DistrictMediaTabs(), MultiSelect(), useMLA(), useMLAs() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (25): buildInsights(), buildNameIndex(), cleanText(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail(), listConstituencyDetailNames() (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (58): GET(), GET(), GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination() (+50 more)

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (19): HomePage(), SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart() (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **87 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 10` to `App Pages & Layout`, `Community 2`, `Representatives`, `Tables & Modals`, `Table Primitives`, `Community 9`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 13` to `Community 2`, `Representatives`, `Tables & Modals`, `Community 5`, `Filter UI`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `normalizeSearchFilter()` connect `Tables & Modals` to `Representatives`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.0669710806697108 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08282828282828283 - nodes in this community are weakly interconnected._