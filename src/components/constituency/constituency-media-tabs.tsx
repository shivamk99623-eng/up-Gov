"use client";

import * as React from "react";
import { Globe, Printer } from "lucide-react";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ErrorState } from "@/components/common/states";
import { MediaTabTable } from "@/components/tables/media-tables";
import { PrintSummaryTable } from "@/components/constituency/print-summary-table";
import {
  useConstituencyPrint,
  useFilterOptions,
  useScopedMedia,
} from "@/lib/api-client";
import {
  useMediaTableQueryState,
  bindServerPagination,
  useClampServerPage,
  type MediaTableQueryState,
} from "@/lib/use-media-table-query-state";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/types";

function hasActiveTableFilters(
  search: string,
  sentiment: string,
  language: string | null,
) {
  return !!search.trim() || sentiment !== "All" || !!language;
}

function PrintTab({
  constituency,
  exportName,
  tableMaxHeight,
  mediaQuery,
}: {
  constituency: string | null;
  exportName?: string;
  tableMaxHeight?: number;
  mediaQuery: MediaTableQueryState;
}) {
  const { apiQuery, tableControls } = mediaQuery;
  const { data, isError, isFetching } = useConstituencyPrint(
    constituency,
    apiQuery,
  );

  useClampServerPage(
    data?.total,
    apiQuery.pageSize,
    apiQuery.page,
    tableControls.serverPagination.onPageChange,
  );

  if (isError) return <ErrorState />;

  const filtered = hasActiveTableFilters(
    apiQuery.search,
    apiQuery.sentiment,
    apiQuery.language,
  );

  return (
    <PrintSummaryTable
      records={data?.records ?? []}
      exportName={exportName ?? constituency ?? "all-constituencies-print"}
      maxHeight={tableMaxHeight}
      serverPagination={bindServerPagination(data, apiQuery, tableControls)}
      serverMode
      isLoading={isFetching}
      isSearchPending={tableControls.isSearchPending}
      emptyDescription={
        filtered
          ? "No print records match your search or filters. Try different keywords or clear filters."
          : "There are no print records for the selected constituency."
      }
      searchValue={tableControls.searchValue}
      onSearchChange={tableControls.onSearchChange}
      sortValue={tableControls.sortValue}
      onSortChange={tableControls.onSortChange}
    />
  );
}

function MediaTab({
  constituency,
  mediaType,
  exportName,
  tableMaxHeight,
  mediaQuery,
}: {
  constituency: string | null;
  mediaType: MediaType;
  exportName?: string;
  tableMaxHeight?: number;
  mediaQuery: MediaTableQueryState;
}) {
  const { data: filterOptions } = useFilterOptions();
  const { apiQuery, tableControls } = mediaQuery;
  const { data, isError, isFetching } = useScopedMedia(
    { constituency },
    mediaType,
    apiQuery,
  );

  useClampServerPage(
    data?.total,
    apiQuery.pageSize,
    apiQuery.page,
    tableControls.serverPagination.onPageChange,
  );

  if (isError) return <ErrorState />;

  const label = mediaType === "X" ? "Twitter/X" : mediaType;
  const filtered = hasActiveTableFilters(
    apiQuery.search,
    apiQuery.sentiment,
    apiQuery.language,
  );

  return (
    <MediaTabTable
      records={data?.records ?? []}
      mediaType={mediaType}
      exportName={exportName ?? constituency ?? "all-constituencies"}
      maxHeight={tableMaxHeight}
      serverPagination={bindServerPagination(data, apiQuery, tableControls)}
      serverMode
      isLoading={isFetching}
      isSearchPending={tableControls.isSearchPending}
      emptyDescription={
        filtered
          ? `No ${label} records match your search or filters. Try different keywords or clear filters.`
          : `There are no ${label} records for the selected constituency and filters.`
      }
      searchValue={tableControls.searchValue}
      onSearchChange={tableControls.onSearchChange}
      sortValue={tableControls.sortValue}
      onSortChange={tableControls.onSortChange}
      sentiment={tableControls.sentiment}
      onSentimentChange={tableControls.onSentimentChange}
      language={tableControls.language}
      onLanguageChange={tableControls.onLanguageChange}
      languageOptions={filterOptions?.languages ?? []}
    />
  );
}

/** Print + digital media tabs scoped to a constituency (or all when null). */
export function ConstituencyMediaTabs({
  constituency,
  exportName,
  tableMaxHeight,
}: {
  constituency: string | null;
  exportName?: string;
  tableMaxHeight?: number;
}) {
  const mediaQuery = useMediaTableQueryState();
  const [activeTab, setActiveTab] = React.useState("Print");
  const constrained = tableMaxHeight != null;
  const tabContentClass = cn("mt-3", constrained && "min-h-0 flex-1");
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className={cn(constrained && "flex h-full min-h-0 flex-col")}
    >
      <TabsList>
        <TabsTrigger value="Print" className="gap-2">
          <Printer className="h-4 w-4" /> Print
        </TabsTrigger>
        <TabsTrigger value="YouTube" className="gap-2">
          <FaYoutube className="h-4 w-4" /> YouTube
        </TabsTrigger>
        <TabsTrigger value="Online" className="gap-2">
          <Globe className="h-4 w-4" /> Online
        </TabsTrigger>
        <TabsTrigger value="X" className="gap-2">
          <FaXTwitter className="h-3.5 w-3.5" /> Twitter / X
        </TabsTrigger>
      </TabsList>
      <TabsContent value="Print" className={tabContentClass}>
        {activeTab === "Print" && (
          <PrintTab
            constituency={constituency}
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
      <TabsContent value="YouTube" className={tabContentClass}>
        {activeTab === "YouTube" && (
          <MediaTab
            constituency={constituency}
            mediaType="YouTube"
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
      <TabsContent value="Online" className={tabContentClass}>
        {activeTab === "Online" && (
          <MediaTab
            constituency={constituency}
            mediaType="Online"
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
      <TabsContent value="X" className={tabContentClass}>
        {activeTab === "X" && (
          <MediaTab
            constituency={constituency}
            mediaType="X"
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
