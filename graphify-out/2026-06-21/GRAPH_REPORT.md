# Graph Report - up  (2026-06-21)

## Corpus Check
- 91 files · ~32,437 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 607 nodes · 1970 edges · 14 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b90a2cc6`
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `queryPrintRecords()` - 26 edges
3. `jsonError()` - 25 edges
4. `queryDigitalMedia()` - 24 edges
5. `getDb()` - 23 edges
6. `warmDataCaches()` - 21 edges
7. `parseJsonStringArray()` - 18 edges
8. `formatNumber()` - 17 edges
9. `queryTableRecords()` - 16 edges
10. `parseFilters()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET()` --calls--> `getConstituencyDetail()`  [EXTRACTED]
  src/app/api/constituency/detail/route.ts → src/lib/constituency-detail.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `warmDataCaches()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/lib/api-helpers.ts
- `GET()` --calls--> `jsonError()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/lib/api-helpers.ts

## Import Cycles
- None detected.

## Communities (14 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.13
Nodes (12): HomePage(), useMLA(), useMLAs(), MLA, formatNumber(), MLADetails(), MLAPageContent(), StatTile() (+4 more)

### Community 1 - "Data Parsers"
Cohesion: 0.07
Nodes (76): DB_PATH, getDb(), warmDb(), buildMpNameIndex(), compactMpKey(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames() (+68 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (32): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+24 more)

### Community 3 - "Representatives"
Cohesion: 0.08
Nodes (57): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), PrintSummaryTable(), DistrictMediaTabs(), hasActiveTableFilters(), mediaEmptyDescription() (+49 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.05
Nodes (57): EmptyState(), ErrorState(), LoadingState(), DateRangePicker(), DateRangePickerProps, presets, MultiSelect(), MultiSelectProps (+49 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (27): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+19 more)

### Community 6 - "Filter UI"
Cohesion: 0.06
Nodes (72): buildConstituencyLookup(), CONSTITUENCY_ALIASES, isKnownConstituency(), listConstituencies(), normalizeKey(), resolveConstituencyToken(), endOfCalendarDay(), formatCalendarDate() (+64 more)

### Community 7 - "Table Primitives"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (13): CommunityBarChart(), CommunityBarItem, CommunityPieChart(), grid, PARTY_COLORS, PartyTrendChart(), VoteComparisonChart(), buildCommunityBarItems() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (8): useMP(), useMPs(), MP, useRepresentativeSelection(), HOUSE_TABS, HouseFilter, MPPageContent(), Separator

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (23): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), grid (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (10): ChartCardProps, GovernmentMemberProfile, MPBioProfile, GovernmentMemberDetails(), Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (7): ChartCard(), SummaryCard(), SummaryCardProps, ConstituencyPage(), useConstituencyOptions(), percent(), Skeleton()

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (78): GET(), GET(), GET(), GET(), jsonError(), parseFilters(), parsePagination(), warmDataCaches() (+70 more)

## Knowledge Gaps
- **75 isolated node(s):** `GET`, `GET`, `GET`, `inter`, `metadata` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Tables & Modals` to `App Pages & Layout`, `Community 2`, `Representatives`, `Table Primitives`, `Community 9`, `Community 10`, `Community 11`, `Community 12`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 13` to `Community 2`, `Representatives`, `Filter UI`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Filter UI` to `Data Parsers`, `Community 2`, `Representatives`, `Community 13`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GET`, `GET`, `GET` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.06798623063683305 - nodes in this community are weakly interconnected._