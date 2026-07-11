"use client";

import * as React from "react";
import {
  ArrowLeft,
  Newspaper,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Printer,
} from "lucide-react";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Header } from "@/components/layout/header";
import { SummaryCard } from "@/components/cards/summary-card";
import { ChartCard } from "@/components/cards/chart-card";
import { UpMap } from "@/components/home/up-map";
import { DistrictMediaTabs } from "@/components/district/district-media-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useGlobalSearchStatus } from "@/lib/use-global-search-status";
import { cn, formatNumber } from "@/lib/utils";

/** Fixed slot height for map / district drill-down (prevents layout jump). */
const MAP_SLOT_HEIGHT = 820;

export default function HomePage() {
  const { data, isLoading, isError, error } = useDashboard();
  const { isActive, isWorking } = useGlobalSearchStatus();
  const loading = isLoading && !data;
  const [showMediaTabs, setShowMediaTabs] = React.useState(false);
  // District drilled into via the map (replaces the map with media tables).
  const [mapDistrict, setMapDistrict] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!data) {
      setShowMediaTabs(false);
      return;
    }
    const schedule =
      typeof requestIdleCallback === "function"
        ? requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 150);
    const cancel =
      typeof cancelIdleCallback === "function"
        ? cancelIdleCallback
        : clearTimeout;
    const id = schedule(() => setShowMediaTabs(true));
    return () => cancel(id as number);
  }, [data]);

  const drilled = data?.districtSummary.find(
    (d) => d.district === mapDistrict,
  );

  return (
    <>
      <Header
        title="Media Monitoring Overview"
        subtitle="Statewide media intelligence across print, YouTube, Twitter/X and online news"
        searchResultCount={
          isActive && !isWorking ? data?.totalNews : undefined
        }
      />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 lg:p-6">
        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          <SummaryCard
            label="Total News"
            value={data?.totalNews ?? 0}
            loading={loading}
            icon={<Newspaper className="h-5 w-5" />}
            accent={CHART_COLORS.primary}
          />
          <SummaryCard
            label="Print"
            value={data?.printCount ?? 0}
            total={data?.totalNews}
            loading={loading}
            icon={<Printer className="h-5 w-5" />}
            accent={CHART_COLORS.saffron}
          />
          <SummaryCard
            label="YouTube"
            value={data?.youtubeCount ?? 0}
            total={data?.totalNews}
            loading={loading}
            icon={<FaYoutube className="h-5 w-5" />}
            accent={CHART_COLORS.youtube}
          />
          <SummaryCard
            label="Twitter / X"
            value={data?.xCount ?? 0}
            total={data?.totalNews}
            loading={loading}
            icon={<FaXTwitter className="h-4 w-4" />}
            accent={CHART_COLORS.x}
          />
          <SummaryCard
            label="Online News"
            value={data?.onlineCount ?? 0}
            total={data?.totalNews}
            loading={loading}
            icon={<Globe className="h-5 w-5" />}
            accent={CHART_COLORS.online}
          />
          <SummaryCard
            label="Positive"
            value={data?.positiveCount ?? 0}
            total={data?.totalNews}
            loading={loading}
            icon={<ThumbsUp className="h-5 w-5" />}
            accent={CHART_COLORS.positive}
          />
          <SummaryCard
            label="Negative"
            value={data?.negativeCount ?? 0}
            total={data?.totalNews}
            loading={loading}
            icon={<ThumbsDown className="h-5 w-5" />}
            accent={CHART_COLORS.negative}
          />
          <SummaryCard
            label="Neutral"
            value={data?.neutralCount ?? 0}
            total={data?.totalNews}
            loading={loading}
            icon={<Minus className="h-5 w-5" />}
            accent={CHART_COLORS.neutral}
          />
        </section>

        {isError && !data ? (
          <ErrorState message={(error as Error)?.message} />
        ) : (
          <>
            {/* Map + media distribution */}
            <section
              className={cn(
                "grid grid-cols-1 gap-6 lg:grid-cols-2" 
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
                    ? "Print, YouTube, Online and Twitter/X mentions for the selected district"
                    : "Colour intensity reflects total news volume. Hover for details, click a district to drill down."
                }
                className="lg:col-span-2"
                contentClassName={mapDistrict ? "min-h-0" : "p-1"}
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
                {loading ? (
                  <Skeleton className="h-[720px] w-full rounded-lg" />
                ) : (
                  <div
                    className="flex flex-col overflow-hidden"
                    // style={{ height: MAP_SLOT_HEIGHT }}
                  >
                    {mapDistrict ? (
                      <>
                        {drilled && (
                          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2 text-xs">
                            <Badge variant="secondary">
                              Total {formatNumber(drilled.total)}
                            </Badge>
                            <Badge variant="outline">
                              Print {formatNumber(drilled.print)}
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
                        height={MAP_SLOT_HEIGHT}
                      />
                    )}
                  </div>
                )}
              </ChartCard>

              {/* {!mapDistrict  && <ChartCard
                title="Media Source Distribution"
                description="Share of mentions by platform"
              >
                {loading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (
                  <MediaDistributionChart data={data!.mediaDistribution} />
                )}
              </ChartCard>} */}
            </section>

            {/* All media coverage — deferred so dashboard SQL finishes first */}
            <Card>
              <CardContent className="p-4 lg:p-5">
                {showMediaTabs ? (
                  <DistrictMediaTabs exportName="overview-media" />
                ) : (
                  <Skeleton className="h-64 w-full" />
                )}
              </CardContent>
            </Card>

            {/* Top positive / negative news */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 [contain:paint]">
              <ChartCard
                title="Top 10 Positive News"
                description="Most-engaging positive mentions · click a bar to open the source"
              >
                {loading ? (
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
                {loading ? (
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
              {loading ? (
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
                {loading ? (
                  <Skeleton className="h-[360px] w-full" />
                ) : (
                  <TopDistrictsChart data={data!.topDistricts} />
                )}
              </ChartCard>
              <ChartCard
                title="Top Profiles"
                description="Most active accounts & channels"
              >
                {loading ? (
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
