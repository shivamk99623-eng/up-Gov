# Graph Report - src  (2026-06-04)

## Corpus Check
- 56 files · ~19,076 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 299 nodes · 791 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28ec3f5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `jsonError()` - 13 edges
3. `formatNumber()` - 13 edges
4. `MediaType` - 11 edges
5. `Skeleton()` - 10 edges
6. `getDashboard()` - 10 edges
7. `useFilterStore` - 10 edges
8. `Badge()` - 9 edges
9. `Button` - 9 edges
10. `loadRecords()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  app/mla/page.tsx → lib/utils.ts
- `MLADetails()` --calls--> `formatNumber()`  [EXTRACTED]
  app/mla/page.tsx → lib/utils.ts
- `StatTile()` --calls--> `formatNumber()`  [EXTRACTED]
  app/mp/page.tsx → lib/utils.ts
- `MPDetails()` --calls--> `formatNumber()`  [EXTRACTED]
  app/mp/page.tsx → lib/utils.ts
- `HomePage()` --calls--> `cn()`  [EXTRACTED]
  app/page.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (35): EmptyState(), ErrorState(), LoadingState(), DateRangePickerProps, presets, MultiSelect(), MultiSelectProps, Option (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (28): ChartCard(), ChartCardProps, grid, MediaCountChart(), MediaSentimentChart(), SentimentDonut(), SearchableSelect(), useMLAs() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (22): classifyEntity(), DATA_PATH, DISTRICT_ALIASES, DISTRICT_TO_GEO, extractDistrict(), GEO_PATH, getDistrictLookup(), parseDate() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (28): SentimentBadge(), DistrictMediaTabs(), MediaScope, MediaTab(), DistrictPage(), GlobalFilters(), Header(), useDistrictAnalytics() (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (26): GET(), GET(), GET(), jsonError(), parseFilters(), formatCalendarDate(), filterRecords(), isKnownDistrict() (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (24): HomePage(), SummaryCard(), SummaryCardProps, DailyTrendChart(), EChartsClickParams, gridBase, HorizontalCountChart(), MediaDistributionChart() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (22): inter, metadata, Providers(), DateRangePicker(), AppShell(), HeaderProps, Emblem(), links (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (18): endOfCalendarDay(), formatDisplayDate(), formatDisplayDateLong(), parseCalendarDate(), startOfCalendarDay(), DataTable(), DataTableColumn, COLUMN_BUILDERS (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

## Knowledge Gaps
- **51 isolated node(s):** `inter`, `metadata`, `HouseFilter`, `HOUSE_TABS`, `ChartCardProps` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 3`, `Community 5`, `Community 6`, `Community 8`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `MediaType` connect `Community 3` to `Community 2`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `MediaRecord` connect `Community 2` to `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `inter`, `metadata`, `HouseFilter` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08897959183673469 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08902439024390243 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06219512195121951 - nodes in this community are weakly interconnected._