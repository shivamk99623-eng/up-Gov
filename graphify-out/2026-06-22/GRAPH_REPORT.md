# Graph Report - up  (2026-06-22)

## Corpus Check
- 93 files · ~33,882 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 592 nodes · 1907 edges · 16 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1906ba60`
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `jsonError()` - 24 edges
3. `queryTableRecords()` - 20 edges
4. `getDb()` - 19 edges
5. `parseJsonStringArray()` - 18 edges
6. `queryPrintRecords()` - 18 edges
7. `queryDigitalMedia()` - 18 edges
8. `formatNumber()` - 17 edges
9. `MediaType` - 15 edges
10. `useFilterStore` - 15 edges

## Surprising Connections (you probably didn't know these)
- `GET` --calls--> `queryDigitalMedia()`  [INFERRED]
  src/app/api/media/route.ts → src/lib/news-repository.ts
- `MultiSelect()` --calls--> `cn()`  [EXTRACTED]
  src/components/filters/multi-select.tsx → src/lib/utils.ts
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mla/page.tsx → src/lib/utils.ts
- `MLADetails()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/mla/page.tsx → src/lib/utils.ts
- `MLAPageContent()` --calls--> `useRepresentativeSelection()`  [EXTRACTED]
  src/app/mla/page.tsx → src/lib/use-representative-selection.ts

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.29
Nodes (8): grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), CHART_COLORS, DistrictMediaTabs(), SearchableSelect(), Header()

### Community 1 - "Data Parsers"
Cohesion: 0.12
Nodes (36): getDb(), MpNameIndex, EntityMediaStats, cleanText(), getMlaBioById(), getMpBioById(), listAllMlaBioMembers(), listAllMpBioMembers() (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (40): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+32 more)

### Community 3 - "Representatives"
Cohesion: 0.07
Nodes (59): ConstituencyMediaTabs(), hasActiveTableFilters(), MediaTab(), PrintTab(), ConstituencyPage(), hasActiveTableFilters(), mediaEmptyDescription(), MediaScope (+51 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.07
Nodes (41): inter, metadata, Providers(), DateRangePicker(), DateRangePickerProps, presets, GlobalFilters(), MultiSelect() (+33 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (31): buildInsights(), buildNameIndex(), cleanText(), constituencyDedupeKey(), ConstituencyRow, ELECTION_YEARS, getConstituencyDetail(), normalizeKey() (+23 more)

### Community 6 - "Filter UI"
Cohesion: 0.07
Nodes (79): formatCalendarDate(), DB_PATH, buildDistrictLookup(), DISTRICT_ALIASES, DISTRICT_TO_GEO, isKnownDistrict(), listKnownDistricts(), resolveDistrictName() (+71 more)

### Community 7 - "Table Primitives"
Cohesion: 0.13
Nodes (13): ChartCardProps, useMLA(), useMLAs(), GovernmentMemberProfile, MLAPageContent(), GovernmentMemberDetails(), MPBioDetails(), Card (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (13): ChartCard(), CommunityBarChart(), CommunityBarItem, grid, PARTY_COLORS, VoteComparisonChart(), buildCommunityBarItems(), ConstituencyDetail() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (7): useMP(), useMPs(), useRepresentativeSelection(), HOUSE_TABS, HouseFilter, MPPageContent(), Separator

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (15): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), baseTooltip (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (8): EmptyState(), ErrorState(), LoadingState(), cn(), Badge(), BadgeProps, badgeVariants, Checkbox

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (33): buildMlaNameIndex(), buildMpNameIndex(), buildNameIndex(), CORE_REPLACEMENTS, expandSpellingVariants(), extractAliasNames(), getMlaNameIndex(), getMpNameIndex() (+25 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (66): GET(), GET(), GET(), GET(), UpMapProps, jsonError(), parseFilters(), parsePagination() (+58 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (11): HomePage(), SummaryCard(), SummaryCardProps, formatCompact(), formatNumber(), percent(), MLADetails(), StatTile() (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **78 isolated node(s):** `HouseFilter`, `HOUSE_TABS`, `CONSTITUENCY_ALIASES`, `DistrictRef`, `SPELLING_VARIANTS` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `App Pages & Layout`, `Community 2`, `Representatives`, `Tables & Modals`, `Table Primitives`, `Community 8`, `Community 9`, `Community 10`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 13` to `Community 2`, `Representatives`, `Filter UI`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `matchesSemanticSearch()` connect `Community 12` to `Representatives`, `Tables & Modals`, `Filter UI`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `HouseFilter`, `HOUSE_TABS`, `CONSTITUENCY_ALIASES` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09142857142857143 - nodes in this community are weakly interconnected._