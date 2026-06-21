"use client";

import * as React from "react";
import {
  Newspaper,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Globe,
  Landmark,
  Printer,
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
import { ConstituencyMediaTabs } from "@/components/constituency/constituency-media-tabs";
import { ConstituencyDetail } from "@/components/constituency/constituency-detail";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/states";
import { CHART_COLORS } from "@/components/charts/echart";
import {
  useConstituencyAnalytics,
  useConstituencyOptions,
} from "@/lib/api-client";

const ALL_CONSTITUENCIES = "All";

export default function ConstituencyPage() {
  const [constituency, setConstituency] = React.useState<string | null>(null);
  const { data: options } = useConstituencyOptions();

  const activeConstituency = constituency ?? ALL_CONSTITUENCIES;
  const analytics = useConstituencyAnalytics(activeConstituency);
  const a = analytics.data;

  const selectOptions = React.useMemo(
    () => [
      { label: "All Constituencies", value: ALL_CONSTITUENCIES },
      ...(options?.constituencies ?? []).map((c) => ({
        label: c,
        value: c,
      })),
    ],
    [options?.constituencies],
  );

  const handleConstituencyChange = (value: string | null) => {
    if (!value || value === ALL_CONSTITUENCIES) {
      setConstituency(null);
      return;
    }
    setConstituency(value);
  };

  const selectedLabel =
    constituency ??
    (options?.constituencies.length
      ? "All Constituencies"
      : "All Constituencies");

  return (
    <>
      <Header
        title="Constituency Analytics"
        subtitle="Constituency profile, elections, and media coverage"
        hideDistrictFilter
      />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 lg:p-6">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Landmark className="h-4 w-4 text-primary" />
              Select Constituency
            </div>
            <div className="sm:w-80">
              <SearchableSelect
                options={selectOptions}
                value={constituency ?? ALL_CONSTITUENCIES}
                onChange={handleConstituencyChange}
                placeholder="All Constituencies"
                searchPlaceholder="Search constituencies…"
                clearable={false}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              Showing data for{" "}
              <span className="font-semibold text-foreground">
                {selectedLabel}
              </span>
            </span>
          </CardContent>
        </Card>

        {analytics.isError ? (
          <ErrorState message={(analytics.error as Error)?.message} />
        ) : (
          <>
                    <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
              <SummaryCard
                label="Print Articles"
                value={a?.printTotal ?? 0}
                loading={analytics.isLoading}
                icon={<Printer className="h-5 w-5" />}
                accent={CHART_COLORS.saffron}
              />
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
            {constituency && (
              <ConstituencyDetail constituency={constituency} />
            )}

  

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Media-wise Total News Count"
                description={
                  constituency
                    ? `Distribution across platforms for ${constituency}`
                    : "Distribution across platforms for all constituencies"
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

            <Card>
              <CardContent className="p-4 lg:p-5">
                <ConstituencyMediaTabs
                  constituency={constituency}
                  exportName={constituency ?? "all-constituencies"}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
