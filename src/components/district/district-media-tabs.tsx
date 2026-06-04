"use client";

import * as React from "react";
import { Globe } from "lucide-react";
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
import { useScopedMedia } from "@/lib/api-client";
import type { MediaRecord, MediaType } from "@/lib/types";

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

/** Three media tabs (YouTube / Online / Twitter-X) with feature-rich tables. */
export function DistrictMediaTabs({
  district,
  entity,
  extraColumns,
  exportName,
  tableMaxHeight,
}: {
  district?: string;
  entity?: string;
  extraColumns?: DataTableColumn<MediaRecord>[];
  exportName?: string;
  /** Caps table scroll height (e.g. home map drill-down slot). */
  tableMaxHeight?: number;
}) {
  const scope: MediaScope = entity ? { entity } : { district };
  return (
    <Tabs defaultValue="YouTube" className="flex h-full min-h-0 flex-col">
      <TabsList>
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
      <TabsContent value="YouTube" className="mt-3 min-h-0 flex-1">
        <MediaTab
          scope={scope}
          mediaType="YouTube"
          extraColumns={extraColumns}
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="Online" className="mt-3 min-h-0 flex-1">
        <MediaTab
          scope={scope}
          mediaType="Online"
          extraColumns={extraColumns}
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="X" className="mt-3 min-h-0 flex-1">
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
