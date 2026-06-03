"use client";

import * as React from "react";
import {
  Newspaper,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Globe,
  MapPinned,
} from "lucide-react";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Header } from "@/components/layout/header";
import { ChartCard } from "@/components/cards/chart-card";
import { SummaryCard } from "@/components/cards/summary-card";
import { SearchableSelect } from "@/components/filters/searchable-select";
import {
  MediaCountChart,
  MediaSentimentChart,
} from "@/components/charts/district-charts";
import { MediaTabTable } from "@/components/tables/media-tables";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { CHART_COLORS } from "@/components/charts/echart";
import {
  useDistrictAnalytics,
  useFilterOptions,
  useMedia,
} from "@/lib/api-client";
import { useFilterStore } from "@/store/filters";
import type { MediaType } from "@/lib/types";

function MediaTab({
  district,
  mediaType,
}: {
  district: string;
  mediaType: MediaType;
}) {
  const { data, isLoading, isError } = useMedia(district, mediaType);
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!data || data.records.length === 0) {
    return (
      <EmptyState
        title={`No ${mediaType === "X" ? "Twitter/X" : mediaType} mentions`}
        description="There are no records for this media type in the selected district and filters."
      />
    );
  }
  return (
    <MediaTabTable
      records={data.records}
      mediaType={mediaType}
      district={district}
    />
  );
}

export default function DistrictPage() {
  const district = useFilterStore((s) => s.district);
  const setDistrict = useFilterStore((s) => s.setDistrict);
  const { data: options } = useFilterOptions();

  // Use "All" to drive the two overview graphs regardless of selection.
  const analytics = useDistrictAnalytics(district ?? "All");
  const a = analytics.data;

  return (
    <>
      <Header
        title="District Analytics"
        subtitle="Media performance and sentiment breakdown by district"
      />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 lg:p-6">
        {/* District selector */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPinned className="h-4 w-4 text-primary" />
              Select District
            </div>
            <div className="sm:w-80">
              <SearchableSelect
                options={(options?.districts ?? []).map((d) => ({
                  label: d,
                  value: d,
                }))}
                value={district}
                onChange={setDistrict}
                placeholder="Choose a district…"
                searchPlaceholder="Search districts…"
              />
            </div>
            {district && (
              <span className="text-sm text-muted-foreground">
                Showing analytics for{" "}
                <span className="font-semibold text-foreground">{district}</span>
              </span>
            )}
          </CardContent>
        </Card>

        {analytics.isError ? (
          <ErrorState message={(analytics.error as Error)?.message} />
        ) : (
          <>
            {/* Summary cards (only when a district is selected) */}
            {district && (
              <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                <SummaryCard
                  label="Total News"
                  value={a?.total ?? 0}
                  loading={analytics.isLoading}
                  icon={<Newspaper className="h-5 w-5" />}
                  accent={CHART_COLORS.primary}
                />
                <SummaryCard
                  label="Positive"
                  value={a?.sentiment.positive ?? 0}
                  total={a?.total}
                  loading={analytics.isLoading}
                  icon={<ThumbsUp className="h-5 w-5" />}
                  accent={CHART_COLORS.positive}
                />
                <SummaryCard
                  label="Negative"
                  value={a?.sentiment.negative ?? 0}
                  total={a?.total}
                  loading={analytics.isLoading}
                  icon={<ThumbsDown className="h-5 w-5" />}
                  accent={CHART_COLORS.negative}
                />
                <SummaryCard
                  label="Neutral"
                  value={a?.sentiment.neutral ?? 0}
                  total={a?.total}
                  loading={analytics.isLoading}
                  icon={<Minus className="h-5 w-5" />}
                  accent={CHART_COLORS.neutral}
                />
                <SummaryCard
                  label="YouTube"
                  value={a?.media.youtube ?? 0}
                  total={a?.total}
                  loading={analytics.isLoading}
                  icon={<FaYoutube className="h-5 w-5" />}
                  accent={CHART_COLORS.youtube}
                />
                <SummaryCard
                  label="Online"
                  value={a?.media.online ?? 0}
                  total={a?.total}
                  loading={analytics.isLoading}
                  icon={<Globe className="h-5 w-5" />}
                  accent={CHART_COLORS.online}
                />
                <SummaryCard
                  label="Twitter / X"
                  value={a?.media.x ?? 0}
                  total={a?.total}
                  loading={analytics.isLoading}
                  icon={<FaXTwitter className="h-4 w-4" />}
                  accent={CHART_COLORS.x}
                />
              </section>
            )}

            {/* Overview graphs */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Media-wise Total News Count"
                description={
                  district
                    ? `Distribution across platforms for ${district}`
                    : "Statewide distribution across platforms"
                }
              >
                {analytics.isLoading || !a ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (
                  <MediaCountChart data={a.media} />
                )}
              </ChartCard>
              <ChartCard
                title="Media + Sentiment Analysis"
                description="Sentiment breakdown within each media source"
              >
                {analytics.isLoading || !a ? (
                  <Skeleton className="h-[340px] w-full" />
                ) : (
                  <MediaSentimentChart data={a.mediaSentiment} />
                )}
              </ChartCard>
            </section>

            {/* Tabbed tables */}
            {district ? (
              <Card>
                <CardContent className="p-4 lg:p-5">
                  <Tabs defaultValue="YouTube">
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
                    <TabsContent value="YouTube">
                      <MediaTab district={district} mediaType="YouTube" />
                    </TabsContent>
                    <TabsContent value="Online">
                      <MediaTab district={district} mediaType="Online" />
                    </TabsContent>
                    <TabsContent value="X">
                      <MediaTab district={district} mediaType="X" />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={<MapPinned className="h-6 w-6" />}
                title="Select a district to explore mentions"
                description="Choose a district above to view detailed YouTube, Online and Twitter/X media tables with search, sorting and export."
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
