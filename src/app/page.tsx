"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Newspaper, Globe, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Header } from "@/components/layout/header";
import { SummaryCard } from "@/components/cards/summary-card";
import { ChartCard } from "@/components/cards/chart-card";
import { UpMap } from "@/components/home/up-map";
import {
  TopDistrictsChart,
  MediaDistributionChart,
  DailyTrendChart,
  HorizontalCountChart,
} from "@/components/charts/dashboard-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/states";
import { CHART_COLORS } from "@/components/charts/echart";
import { useDashboard } from "@/lib/api-client";
import { useFilterStore } from "@/store/filters";

export default function HomePage() {
  const router = useRouter();
  const setDistrict = useFilterStore((s) => s.setDistrict);
  const { data, isLoading, isError, error } = useDashboard();

  const handleDistrict = (district: string) => {
    setDistrict(district);
    router.push("/district");
  };

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
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ChartCard
                title="Uttar Pradesh District Map"
                description="Colour intensity reflects total news volume. Hover for details, click to drill down."
                className="lg:col-span-2"
                contentClassName="p-2"
              >
                {isLoading ? (
                  <Skeleton className="h-[520px] w-full rounded-lg" />
                ) : (
                  <UpMap
                    districtSummary={data!.districtSummary}
                    onDistrictClick={handleDistrict}
                  />
                )}
              </ChartCard>

              <ChartCard
                title="Media Source Distribution"
                description="Share of mentions by platform"
              >
                {isLoading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (
                  <MediaDistributionChart data={data!.mediaDistribution} />
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
