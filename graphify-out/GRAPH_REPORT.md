# Graph Report - up  (2026-06-22)

## Corpus Check
- 93 files · ~35,334 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 604 nodes · 1971 edges · 17 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fbd5a9bc`
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
2. `jsonError()` - 26 edges
3. `getDb()` - 22 edges
4. `queryTableRecords()` - 22 edges
5. `parseJsonStringArray()` - 18 edges
6. `queryPrintRecords()` - 18 edges
7. `queryDigitalMedia()` - 18 edges
8. `formatNumber()` - 17 edges
9. `parseFilters()` - 16 edges
10. `aggregateFilteredStats()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getFilterOptions()`  [INFERRED]
  src/app/api/filters/route.ts → src/services/analytics.ts
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mla/page.tsx → src/lib/utils.ts
- `MLADetails()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mla/page.tsx → src/lib/utils.ts
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mp/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (17 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.24
Nodes (8): EmptyState(), ErrorState(), LoadingState(), ConstituencyMediaTabs(), MultiSelect(), cn(), Checkbox, TooltipContent

### Community 1 - "Data Parsers"
Cohesion: 0.15
Nodes (31): getDb(), EntityMediaStats, FilteredAggregateStats, cleanText(), getMlaBioById(), getMpBioById(), listAllMlaBioMembers(), listAllMpBioMembers() (+23 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (41): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+33 more)

### Community 3 - "Representatives"
Cohesion: 0.10
Nodes (37): hasActiveTableFilters(), MediaTab(), PrintTab(), hasActiveTableFilters(), mediaEmptyDescription(), MediaScope, MediaTab(), printEmptyDescription() (+29 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.12
Nodes (19): inter, metadata, Providers(), DateRangePicker(), GlobalFilters(), AppShell(), HeaderProps, Emblem() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (34): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+26 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (85): endOfCalendarDay(), formatCalendarDate(), formatDisplayDateLong(), parseCalendarDate(), startOfCalendarDay(), DB_PATH, buildDistrictLookup(), DISTRICT_ALIASES (+77 more)

### Community 7 - "Table Primitives"
Cohesion: 0.18
Nodes (10): ChartCardProps, GovernmentMemberProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (14): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (17): SentimentDonut(), DistrictMediaTabs(), useMLA(), useMLAs(), useMP(), useMPs(), useRepresentativeSelection(), MLADetails() (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (22): HomePage(), SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart() (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.35
Nodes (7): ChartCard(), grid, MediaCountChart(), MediaSentimentChart(), CHART_COLORS, SearchableSelect(), Header()

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (35): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+27 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (42): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), applyConstituencyScope() (+34 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (52): ConstituencyPage(), DistrictPage(), buildMediaParams(), mediaEndpoint(), mergeTableFilters(), useConstituencyAnalytics(), useConstituencyOptions(), useConstituencyPrint() (+44 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (17): DateRangePickerProps, presets, MultiSelectProps, Option, SearchableSelectProps, Button, ButtonProps, buttonVariants (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **79 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `App Pages & Layout` to `Community 2`, `Representatives`, `Tables & Modals`, `Table Primitives`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 14` to `Community 2`, `Representatives`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `matchesSemanticSearch()` connect `Community 12` to `Representatives`, `Filter UI`, `Community 15`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08627450980392157 - nodes in this community are weakly interconnected._
- **Should `Representatives` be split into smaller, more focused modules?**
  _Cohesion score 0.09608843537414966 - nodes in this community are weakly interconnected._