# Graph Report - up copy  (2026-06-24)

## Corpus Check
- 94 files · ~36,145 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 616 nodes · 2033 edges · 16 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `128d7309`
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
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `GET()` --calls--> `getConstituencyOptions()`  [EXTRACTED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `ConstituencyMediaTabs()` --calls--> `cn()`  [EXTRACTED]
  src/components/constituency/constituency-media-tabs.tsx → src/lib/utils.ts
- `HomePage()` --calls--> `useDashboard()`  [EXTRACTED]
  src/app/page.tsx → src/lib/api-client.ts

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.10
Nodes (44): DB_PATH, getDb(), buildAssemblyLookup(), listLegislativeAssemblies(), normalizeKey(), resolveLegislativeAssemblyFilter(), resolveLegislativeAssemblyToken(), upLegislativeTableExists() (+36 more)

### Community 1 - "Data Parsers"
Cohesion: 0.12
Nodes (37): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (40): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+32 more)

### Community 3 - "Representatives"
Cohesion: 0.07
Nodes (59): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), ConstituencyPage(), ConstituencyScopePanel(), hasActiveTableFilters(), mediaEmptyDescription() (+51 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.07
Nodes (41): inter, metadata, Providers(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), MultiSelect() (+33 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (34): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, dedupeConstituencyNames(), ELECTION_YEARS, getConstituencyDetail() (+26 more)

### Community 6 - "Filter UI"
Cohesion: 0.07
Nodes (85): endOfCalendarDay(), formatCalendarDate(), startOfCalendarDay(), buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, isKnownDistrict(), listKnownDistricts() (+77 more)

### Community 7 - "Table Primitives"
Cohesion: 0.16
Nodes (12): HomePage(), SummaryCard(), SummaryCardProps, formatCompact(), formatNumber(), percent(), MLADetails(), StatTile() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail(), PARTY_TABS (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): ChartCardProps, GovernmentMemberProfile, GovernmentMemberDetails(), MPBioDetails(), Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (15): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), baseTooltip (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (16): ChartCard(), grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), CHART_COLORS, EmptyState(), ErrorState() (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (9): Header(), useMP(), useMPs(), HOUSE_TABS, HouseFilter, MPPageContent(), Badge(), BadgeProps (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (63): GET(), GET(), GET(), GET(), GET(), UpMapProps, jsonError(), parseFilters() (+55 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (5): useMLA(), useMLAs(), useRepresentativeSelection(), MLAPageContent(), Separator

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **79 isolated node(s):** `CONSTITUENCY_ALIASES`, `TABLE_COLUMNS`, `QueryListResult`, `EntityPersonColumn`, `SORT_SQL_COLUMNS` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `Community 2`, `Representatives`, `Tables & Modals`, `Table Primitives`, `Community 9`, `Community 10`, `Community 12`, `Community 14`, `Community 15`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Representatives` to `Community 2`, `Community 11`, `Community 13`, `Filter UI`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `matchesSemanticSearch()` connect `Data Parsers` to `Representatives`, `Tables & Modals`, `Filter UI`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CONSTITUENCY_ALIASES`, `TABLE_COLUMNS`, `QueryListResult` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.09551020408163265 - nodes in this community are weakly interconnected._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.11605937921727395 - nodes in this community are weakly interconnected._