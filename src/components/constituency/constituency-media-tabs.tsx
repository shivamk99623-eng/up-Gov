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
import { PrintSummaryTable } from "@/components/constituency/print-summary-table";
import { useConstituencyPrint, useScopedMedia } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/types";

function PrintTab({
  constituency,
  exportName,
  tableMaxHeight,
}: {
  constituency: string | null;
  exportName?: string;
  tableMaxHeight?: number;
}) {
  const { data, isLoading, isError } = useConstituencyPrint(constituency);
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
        description="There are no print records for the selected constituency."
      />
    );
  }
  return (
    <PrintSummaryTable
      records={data.records}
      exportName={exportName ?? constituency ?? "all-constituencies-print"}
      maxHeight={tableMaxHeight}
    />
  );
}

function MediaTab({
  constituency,
  mediaType,
  exportName,
  tableMaxHeight,
}: {
  constituency: string | null;
  mediaType: MediaType;
  exportName?: string;
  tableMaxHeight?: number;
}) {
  const { data, isLoading, isError } = useScopedMedia(
    { constituency },
    mediaType,
  );
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
        description="There are no records for this media type in the selected constituency and filters."
      />
    );
  }
  return (
    <MediaTabTable
      records={data.records}
      mediaType={mediaType}
      exportName={exportName ?? constituency ?? "all-constituencies"}
      maxHeight={tableMaxHeight}
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
          constituency={constituency}
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="YouTube" className={tabContentClass}>
        <MediaTab
          constituency={constituency}
          mediaType="YouTube"
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="Online" className={tabContentClass}>
        <MediaTab
          constituency={constituency}
          mediaType="Online"
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
      <TabsContent value="X" className={tabContentClass}>
        <MediaTab
          constituency={constituency}
          mediaType="X"
          exportName={exportName}
          tableMaxHeight={tableMaxHeight}
        />
      </TabsContent>
    </Tabs>
  );
}
