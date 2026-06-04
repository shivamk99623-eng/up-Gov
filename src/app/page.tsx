"use client";

import * as React from "react";
import { ArrowLeft, Newspaper, Globe, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Header } from "@/components/layout/header";
import { SummaryCard } from "@/components/cards/summary-card";
import { ChartCard } from "@/components/cards/chart-card";
import { UpMap } from "@/components/home/up-map";
import { DistrictMediaTabs } from "@/components/district/district-media-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TopDistrictsChart,
  MediaDistributionChart,
  DailyTrendChart,
  HorizontalCountChart,
  TopNewsChart,
} from "@/components/charts/dashboard-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/states";
import { CHART_COLORS } from "@/components/charts/echart";
import { useDashboard } from "@/lib/api-client";
import { cn, formatNumber } from "@/lib/utils";

/** Fixed slot height for map / district drill-down (prevents layout jump). */
const MAP_SLOT_HEIGHT = 520;

export default function HomePage() {
  const { data, isLoading, isError, error } = useDashboard();
  // District drilled into via the map (replaces the map with media tables).
  const [mapDistrict, setMapDistrict] = React.useState<string | null>(null);

  const drilled = data?.districtSummary.find(
    (d) => d.district === mapDistrict,
  );

  return (
    <>
      <Header
        title="Media Monitoring Overview"
        subtitle="Statewide media intelligence across YouTube, Twitter/X and online news"
      />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 lg:p-6">
        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
          <SummaryCard
            label="Total News"
            value={data?.totalNews ?? 0}
            loading={isLoading}
            icon={<Newspaper className="h-5 w-5" />}
            accent={CHART_COLORS.primary}
          />
          <SummaryCard
            label="YouTube"
            value={data?.youtubeCount ?? 0}
            total={data?.totalNews}
            loading={isLoading}
            icon={<FaYoutube className="h-5 w-5" />}
            accent={CHART_COLORS.youtube}
          />
          <SummaryCard
            label="Twitter / X"
            value={data?.xCount ?? 0}
            total={data?.totalNews}
            loading={isLoading}
            icon={<FaXTwitter className="h-4 w-4" />}
            accent={CHART_COLORS.x}
          />
          <SummaryCard
            label="Online News"
            value={data?.onlineCount ?? 0}
            total={data?.totalNews}
            loading={isLoading}
            icon={<Globe className="h-5 w-5" />}
            accent={CHART_COLORS.online}
          />
          <SummaryCard
            label="Positive"
            value={data?.positiveCount ?? 0}
            total={data?.totalNews}
            loading={isLoading}
            icon={<ThumbsUp className="h-5 w-5" />}
            accent={CHART_COLORS.positive}
          />
          <SummaryCard
            label="Negative"
            value={data?.negativeCount ?? 0}
            total={data?.totalNews}
            loading={isLoading}
            icon={<ThumbsDown className="h-5 w-5" />}
            accent={CHART_COLORS.negative}
          />
          <SummaryCard
            label="Neutral"
            value={data?.neutralCount ?? 0}
            total={data?.totalNews}
            loading={isLoading}
            icon={<Minus className="h-5 w-5" />}
            accent={CHART_COLORS.neutral}
          />
        </section>

        {isError ? (
          <ErrorState message={(error as Error)?.message} />
        ) : (
          <>
            {/* Map + media distribution */}
            <section
              className={cn(
                "grid grid-cols-1 gap-6",
                mapDistrict ? "lg:grid-cols-2" : "lg:grid-cols-3",
              )}
            >
              <ChartCard
                title={
                  mapDistrict
                    ? `${mapDistrict} — Media Mentions`
                    : "Uttar Pradesh District Map"
                }
                description={
                  mapDistrict
                    ? "YouTube, Online and Twitter/X mentions for the selected district"
                    : "Colour intensity reflects total news volume. Hover for details, click a district to drill down."
                }
                className="lg:col-span-2"
                contentClassName={mapDistrict ? "min-h-0" : "p-2"}
                action={
                  mapDistrict ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setMapDistrict(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to map
                    </Button>
                  ) : undefined
                }
              >
                {isLoading ? (
                  <Skeleton className="h-[520px] w-full rounded-lg" />
                ) : (
                  <div
                    className="flex flex-col overflow-hidden"
                    style={{ height: MAP_SLOT_HEIGHT }}
                  >
                    {mapDistrict ? (
                      <>
                        {drilled && (
                          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2 text-xs">
                            <Badge variant="secondary">
                              Total {formatNumber(drilled.total)}
                            </Badge>
                            <Badge variant="youtube">
                              YouTube {formatNumber(drilled.youtube)}
                            </Badge>
                            <Badge variant="online">
                              Online {formatNumber(drilled.online)}
                            </Badge>
                            <Badge variant="x">
                              Twitter/X {formatNumber(drilled.x)}
                            </Badge>
                          </div>
                        )}
                        <div className="min-h-0 flex-1 overflow-hidden">
                          <DistrictMediaTabs
                            district={mapDistrict}
                            tableMaxHeight={MAP_SLOT_HEIGHT - 120}
                          />
                        </div>
                      </>
                    ) : (
                      <UpMap
                        districtSummary={data!.districtSummary}
                        onDistrictClick={setMapDistrict}
                      />
                    )}
                  </div>
                )}
              </ChartCard>

              {!mapDistrict  && <ChartCard
                title="Media Source Distribution"
                description="Share of mentions by platform"
              >
                {isLoading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (
                  <MediaDistributionChart data={data!.mediaDistribution} />
                )}
              </ChartCard>}
            </section>

            {/* Top positive / negative news */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 [contain:paint]">
              <ChartCard
                title="Top 10 Positive News"
                description="Most-engaging positive mentions · click a bar to open the source"
              >
                {isLoading ? (
                  <Skeleton className="h-[380px] w-full" />
                ) : data!.topPositiveNews.length === 0 ? (
                  <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">
                    No positive news for the current filters.
                  </div>
                ) : (
                  <TopNewsChart items={data!.topPositiveNews} tone="positive" />
                )}
              </ChartCard>
              <ChartCard
                title="Top 10 Negative News"
                description="Most-engaging negative mentions · click a bar to open the source"
              >
                {isLoading ? (
                  <Skeleton className="h-[380px] w-full" />
                ) : data!.topNegativeNews.length === 0 ? (
                  <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">
                    No negative news for the current filters.
                  </div>
                ) : (
                  <TopNewsChart items={data!.topNegativeNews} tone="negative" />
                )}
              </ChartCard>
            </section>

            {/* Daily trend */}
            <ChartCard
              title="Daily News Trend"
              description="Volume of mentions over time by media source"
            >
              {isLoading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : (
                <DailyTrendChart data={data!.dailyTrend} />
              )}
            </ChartCard>

            {/* Top districts + top profiles */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Top 10 Districts by News Count"
                description="Districts with highest media coverage"
              >
                {isLoading ? (
                  <Skeleton className="h-[360px] w-full" />
                ) : (
                  <TopDistrictsChart data={data!.topDistricts} />
                )}
              </ChartCard>
              <ChartCard
                title="Top Profiles"
                description="Most active accounts & channels"
              >
                {isLoading ? (
                  <Skeleton className="h-[360px] w-full" />
                ) : (
                  <HorizontalCountChart
                    data={data!.topProfiles}
                    color={CHART_COLORS.saffron}
                    height={360}
                  />
                )}
              </ChartCard>
            </section>
          </>
        )}
      </main>
    </>
  );
}
