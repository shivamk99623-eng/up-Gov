# Graph Report - up  (2026-06-20)

## Corpus Check
- 78 files · ~30,167 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 522 nodes · 1539 edges · 14 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1bb64de8`
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
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `warmDataCaches()` - 22 edges
3. `jsonError()` - 21 edges
4. `Sentiment` - 16 edges
5. `formatNumber()` - 15 edges
6. `loadRecords()` - 14 edges
7. `compactMpKey()` - 14 edges
8. `ensureCache()` - 14 edges
9. `loadPrintRecords()` - 14 edges
10. `getConstituencyOptions()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `register()` --calls--> `listAllMpBioMembers()`  [INFERRED]
  src/instrumentation.ts → src/lib/mp-bio-parser.ts
- `register()` --calls--> `getMLADirectory()`  [INFERRED]
  src/instrumentation.ts → src/services/representatives.ts
- `GET()` --calls--> `getConstituencyOptions()`  [INFERRED]
  src/app/api/constituency/filters/route.ts → src/services/constituency.ts
- `GET()` --calls--> `getConstituencyPrint()`  [INFERRED]
  src/app/api/constituency/print/route.ts → src/services/constituency.ts
- `GET()` --calls--> `getFilterOptions()`  [INFERRED]
  src/app/api/filters/route.ts → src/services/analytics.ts

## Import Cycles
- None detected.

## Communities (14 total, 0 thin omitted)

### Community 0 - "App Pages & Layout"
Cohesion: 0.07
Nodes (42): DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart(), TopDistrictsChart(), TopNewsChart(), MediaTab() (+34 more)

### Community 1 - "Data Parsers"
Cohesion: 0.21
Nodes (16): GET(), GET(), GET(), jsonError(), parseFilters(), warmDataCaches(), GET(), GET() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (22): classifyEntity(), constituencyFromTags(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractConstituency(), extractDistrict(), GEO_PATH (+14 more)

### Community 3 - "Representatives"
Cohesion: 0.08
Nodes (43): DetailBody(), DetailField(), DetailGrid(), DetailSection(), RecordDetailModal(), RecordDetailModalProps, MediaBadge(), SentimentBadge() (+35 more)

### Community 4 - "Tables & Modals"
Cohesion: 0.12
Nodes (29): isKnownLanguage(), buildLookup(), canonicalizeMlaName(), canonicalizeMpName(), DATA_ROOT, dirLatestMtime(), ensureCache(), fileSlug() (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (58): BioCache, cleanText(), ensureCache(), listAllMlaBioMembers(), loadJson(), lookupMlaBio(), MLA_FILE, MLABioRecord (+50 more)

### Community 6 - "Filter UI"
Cohesion: 0.09
Nodes (33): DateRangePicker(), DateRangePickerProps, presets, MultiSelect(), MultiSelectProps, Option, SearchableSelectProps, HeaderProps (+25 more)

### Community 7 - "Table Primitives"
Cohesion: 0.06
Nodes (65): HomePage(), ChartCard(), ChartCardProps, SummaryCard(), SummaryCardProps, grid, MediaCountChart(), MediaSentimentChart() (+57 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (19): formatCalendarDate(), isKnownDistrict(), listDistrictNamesFromPrint(), loadAllPrintRecords(), loadDistrictPrintRecords(), loadPrintRecords(), parseDate(), parseIndianDateString() (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (17): startOfCalendarDay(), filterRecords(), loadRecords(), filterPrintRecords(), isKnownConstituency(), loadConstituencyPrintRecords(), resolveConstituencyToken(), getMedia() (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (41): cleanText(), colIndex(), coreVariants(), DATA_FILE, ensureCache(), GovCache, GovernmentMemberKind, GovernmentMemberRecord (+33 more)

### Community 11 - "Community 11"
Cohesion: 0.83
Nodes (4): toGeoName(), districtMatchKeys(), matchesDistrict(), resolveDistrictScope()

### Community 12 - "Community 12"
Cohesion: 0.23
Nodes (7): inter, metadata, Providers(), AppShell(), Emblem(), links, SidebarNav()

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **70 isolated node(s):** `HouseFilter`, `HOUSE_TABS`, `MLA_FILE`, `RawMlaEntry`, `BioCache` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Table Primitives` to `Representatives`, `Community 12`, `Filter UI`, `Community 14`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `Sentiment` connect `App Pages & Layout` to `Data Parsers`, `Community 2`, `Representatives`, `Tables & Modals`, `Community 5`, `Filter UI`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `House` connect `Community 10` to `App Pages & Layout`, `Community 5`, `Table Primitives`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `warmDataCaches()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`warmDataCaches()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `jsonError()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`jsonError()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `HouseFilter`, `HOUSE_TABS`, `MLA_FILE` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.06588235294117648 - nodes in this community are weakly interconnected._