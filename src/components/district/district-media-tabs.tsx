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
import type { DataTableColumn } from "@/components/tables/data-table";
import { PrintSummaryTable } from "@/components/constituency/print-summary-table";
import { useFilterOptions, usePrint, useScopedMedia } from "@/lib/api-client";
import {
  useMediaTableQueryState,
  bindServerPagination,
  useClampServerPage,
  type MediaTableQueryState,
} from "@/lib/use-media-table-query-state";
import { cn } from "@/lib/utils";
import type { DigitalMediaType, MediaRecord } from "@/lib/types";

function printEmptyDescription(
  entity: string | undefined,
  district: string | undefined,
  printSource: "district" | "mla" | "mp" | undefined,
  hasActiveFilters: boolean,
): string {
  if (hasActiveFilters) {
    return "No print records match your search or filters. Try different keywords or clear filters.";
  }
  if (entity && printSource === "mla") {
    return `No MLA print mentions for ${entity}.`;
  }
  if (entity && printSource === "mp") {
    return `No MP print mentions for ${entity}.`;
  }
  if (district && printSource === "district") {
    return `No district print mentions for ${district}.`;
  }
  if (entity) {
    return `No print mentions for ${entity}.`;
  }
  if (district) {
    return `No print mentions for ${district}.`;
  }
  return "There are no print records for the current selection.";
}

function hasActiveTableFilters(
  search: string,
  sentiment: string,
  language: string | null,
) {
  return (
    !!search.trim() ||
    sentiment !== "All" ||
    !!language
  );
}

function PrintTab({
  district,
  constituency,
  entity,
  printSource,
  exportName,
  tableMaxHeight,
  mediaQuery,
}: {
  district?: string;
  constituency?: string;
  entity?: string;
  printSource?: "district" | "mla" | "mp";
  exportName?: string;
  tableMaxHeight?: number;
  mediaQuery: MediaTableQueryState;
}) {
  const { apiQuery, tableControls } = mediaQuery;
  const { data, isError, isFetching } = usePrint(
    { district, constituency, entity, printSource },
    apiQuery,
  );

  useClampServerPage(
    data?.total,
    apiQuery.pageSize,
    apiQuery.page,
    tableControls.serverPagination.onPageChange,
  );

  if (isError && !data) return <ErrorState />;

  const filtered = hasActiveTableFilters(
    apiQuery.search,
    apiQuery.sentiment,
    apiQuery.language,
  );

  return (
    <PrintSummaryTable
      records={data?.records ?? []}
      exportName={exportName ?? district ?? constituency ?? "print"}
      maxHeight={tableMaxHeight}
      serverPagination={bindServerPagination(data, apiQuery, tableControls)}
      serverMode
      isLoading={isFetching}
      isSearchPending={tableControls.isSearchPending}
      emptyDescription={printEmptyDescription(
        entity,
        district,
        printSource,
        filtered,
      )}
      searchValue={tableControls.searchValue}
      onSearchChange={tableControls.onSearchChange}
      sortValue={tableControls.sortValue}
      onSortChange={tableControls.onSortChange}
    />
  );
}

interface MediaScope {
  district?: string;
  entity?: string;
}

function mediaEmptyDescription(
  mediaType: DigitalMediaType,
  scope: MediaScope,
  hasActiveFilters: boolean,
): string {
  const label = mediaType === "X" ? "Twitter/X" : mediaType;
  if (hasActiveFilters) {
    return `No ${label} records match your search or filters. Try different keywords or clear filters.`;
  }
  if (scope.entity) {
    return `No ${label} coverage is linked to ${scope.entity} in the data.`;
  }
  return `There are no ${label} records for the selected district and filters.`;
}

function MediaTab({
  scope,
  mediaType,
  extraColumns,
  exportName,
  tableMaxHeight,
  mediaQuery,
}: {
  scope: MediaScope;
  mediaType: DigitalMediaType;
  extraColumns?: DataTableColumn<MediaRecord>[];
  exportName?: string;
  tableMaxHeight?: number;
  mediaQuery: MediaTableQueryState;
}) {
  const { data: filterOptions } = useFilterOptions();
  const { apiQuery, tableControls } = mediaQuery;
  const { data, isError, isFetching } = useScopedMedia(
    scope,
    mediaType,
    apiQuery,
  );

  useClampServerPage(
    data?.total,
    apiQuery.pageSize,
    apiQuery.page,
    tableControls.serverPagination.onPageChange,
  );

  if (isError && !data) return <ErrorState />;

  const filtered = hasActiveTableFilters(
    apiQuery.search,
    apiQuery.sentiment,
    apiQuery.language,
  );

  return (
    <MediaTabTable
      records={data?.records ?? []}
      mediaType={mediaType}
      extraColumns={extraColumns}
      exportName={exportName ?? scope.entity ?? scope.district}
      maxHeight={tableMaxHeight}
      serverPagination={bindServerPagination(data, apiQuery, tableControls)}
      serverMode
      isLoading={isFetching}
      isSearchPending={tableControls.isSearchPending}
      emptyDescription={mediaEmptyDescription(mediaType, scope, filtered)}
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

/** Print + digital media tabs with feature-rich tables. */
export function DistrictMediaTabs({
  district,
  entity,
  constituency,
  printSource,
  extraColumns,
  exportName,
  tableMaxHeight,
}: {
  district?: string;
  entity?: string;
  constituency?: string;
  printSource?: "district" | "mla" | "mp";
  extraColumns?: DataTableColumn<MediaRecord>[];
  exportName?: string;
  tableMaxHeight?: number;
}) {
  const mediaQuery = useMediaTableQueryState();
  const [activeTab, setActiveTab] = React.useState("Print");
  const scope: MediaScope = entity ? { entity } : { district };
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
            district={district}
            constituency={constituency}
            entity={entity}
            printSource={printSource}
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
      <TabsContent value="YouTube" className={tabContentClass}>
        {activeTab === "YouTube" && (
          <MediaTab
            scope={scope}
            mediaType="YouTube"
            extraColumns={extraColumns}
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
      <TabsContent value="Online" className={tabContentClass}>
        {activeTab === "Online" && (
          <MediaTab
            scope={scope}
            mediaType="Online"
            extraColumns={extraColumns}
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
      <TabsContent value="X" className={tabContentClass}>
        {activeTab === "X" && (
          <MediaTab
            scope={scope}
            mediaType="X"
            extraColumns={extraColumns}
            exportName={exportName}
            tableMaxHeight={tableMaxHeight}
            mediaQuery={mediaQuery}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
