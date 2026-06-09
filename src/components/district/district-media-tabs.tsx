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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { MediaTabTable } from "@/components/tables/media-tables";
import type { DataTableColumn } from "@/components/tables/data-table";
import { PrintSummaryTable } from "@/components/constituency/print-summary-table";
import { usePrint, useScopedMedia } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { MediaRecord, MediaType } from "@/lib/types";

function printEmptyDescription(
  entity: string | undefined,
  district: string | undefined,
  printSource: "district" | "mla" | "mp" | undefined,
): string {
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
  return "There are no print records for the current selection and filters.";
}

function PrintTab({
  district,
  constituency,
  entity,
  printSource,
  exportName,
  tableMaxHeight,
}: {
  district?: string;
  constituency?: string;
  entity?: string;
  printSource?: "district" | "mla" | "mp";
  exportName?: string;
  tableMaxHeight?: number;
}) {
  const { data, isLoading, isError } = usePrint({
    district,
    constituency,
    entity,
    printSource,
  });
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-[800px] w-full rounded-xl" />
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!data || data.records.length === 0) {
    return (
      <EmptyState
        title="No print mentions"
        description={printEmptyDescription(entity, district, printSource)}
      />
    );
  }
  return (
    <PrintSummaryTable
      records={data.records}
      exportName={exportName ?? district ?? constituency ?? "print"}
      maxHeight={tableMaxHeight}
    />
  );
}

interface MediaScope {
  /** Scope by district (respects global filters). */
  district?: string;
  /** Scope by linked person (matched on the Keyword column). */
  entity?: string;
}

function MediaTab({
  scope,
  mediaType,
  extraColumns,
  exportName,
  tableMaxHeight,
}: {
  scope: MediaScope;
  mediaType: MediaType;
  extraColumns?: DataTableColumn<MediaRecord>[];
  exportName?: string;
  tableMaxHeight?: number;
}) {
  const { data, isLoading, isError } = useScopedMedia(scope, mediaType);
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-[800px] w-full rounded-xl" />
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!data || data.records.length === 0) {
    const label = mediaType === "X" ? "Twitter/X" : mediaType;
    return (
      <EmptyState
        title={`No ${label} mentions`}
        description={
          scope.entity
            ? `No ${label} coverage is linked to ${scope.entity} in the data.`
            : "There are no records for this media type in the selected district and filters."
        }
      />
    );
  }
  return (
    <MediaTabTable
      records={data.records}
      mediaType={mediaType}
      extraColumns={extraColumns}
      exportName={exportName ?? scope.entity ?? scope.district}
      maxHeight={tableMaxHeight}
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
  /** Limits print to district, MLA, or MP folders. */
  printSource?: "district" | "mla" | "mp";
  extraColumns?: DataTableColumn<MediaRecord>[];
  exportName?: string;
  /** Caps table scroll height (e.g. home map drill-down slot). */
  tableMaxHeight?: number;
}) {
  const scope: MediaScope = entity ? { entity } : { district };
  const constrained = tableMaxHeight != null;
  const tabContentClass = cn("mt-3", constrained && "min-h-0 flex-1");
  return (
    <Tabs
      defaultValue="Print"
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
        <PrintTab
          district={district}
          constituency={constituency}
          entity={entity}
          printSource={printSource}
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="YouTube" className={tabContentClass}>
        <MediaTab
          scope={scope}
          mediaType="YouTube"
          extraColumns={extraColumns}
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="Online" className={tabContentClass}>
        <MediaTab
          scope={scope}
          mediaType="Online"
          extraColumns={extraColumns}
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="X" className={tabContentClass}>
        <MediaTab
          scope={scope}
          mediaType="X"
          extraColumns={extraColumns}
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
    </Tabs>
  );
}
