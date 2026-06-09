"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
  User,
  Globe,
  Award,
  TrendingUp,
  MessageSquare,
  Landmark,
  Newspaper,
} from "lucide-react";
import { FaXTwitter, FaFacebookF, FaInstagram } from "react-icons/fa6";
import { Header } from "@/components/layout/header";
import { ChartCard } from "@/components/cards/chart-card";
import { SearchableSelect } from "@/components/filters/searchable-select";
import {
  MediaCountChart,
  SentimentDonut,
} from "@/components/charts/district-charts";
import { DistrictMediaTabs } from "@/components/district/district-media-tabs";
import { GovernmentMemberDetails } from "@/components/representatives/government-member-details";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { useMPs } from "@/lib/api-client";
import { cn, formatNumber } from "@/lib/utils";
import type { MP, House } from "@/lib/types";

type HouseFilter = "All" | House;

function StatTile({
  label,
  value,
  suffix,
  icon,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ background: `color-mix(in srgb, ${accent} 14%, white)`, color: accent }}
        >
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
        {formatNumber(value)}
        {suffix && <span className="text-base font-semibold">{suffix}</span>}
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-primary hover:bg-accent"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </a>
  );
}

function HouseBadge({ house }: { house: House }) {
  return (
    <Badge variant={house === "Lok Sabha" ? "default" : "online"}>
      {house}
    </Badge>
  );
}

function MPDetails({ mp }: { mp: MP }) {
  return (
    <div className="space-y-6">
      {/* Profile & biography cards are temporarily hidden. */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-bold text-foreground">{mp.name}</h2>
        <HouseBadge house={mp.house} />
        <Badge variant="secondary">{mp.constituency}</Badge>
        <Badge variant="outline">{mp.district}</Badge>
        <Badge>{mp.party}</Badge>
      </div>

      <GovernmentMemberDetails
        profile={mp.governmentProfile}
        fallbackName={mp.name}
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatTile
          label="Total Engagement"
          value={mp.totalEngagement}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="#2563eb"
        />
        <StatTile
          label="Media Mentions"
          value={mp.mediaMentions}
          icon={<MessageSquare className="h-4 w-4" />}
          accent="#ff7722"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Media-wise Coverage"
          description="Linked mentions by media type"
        >
          <MediaCountChart data={mp.media} />
        </ChartCard>
        <ChartCard
          title="Media Sentiment Breakdown"
          description={`${formatNumber(mp.mediaMentions)} total mentions`}
        >
          <SentimentDonut data={mp.sentiment} height={300} />
        </ChartCard>
      </div>

      <Card>
        <CardContent className="p-4 lg:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Related Media Coverage
              </h3>
              <p className="text-xs text-muted-foreground">
                Print and digital mentions linked to {mp.name}.
              </p>
            </div>
          </div>
          <DistrictMediaTabs
            entity={mp.name}
            exportName={mp.name}
            printSource="mp"
          />
        </CardContent>
      </Card>
    </div>
  );
}

const HOUSE_TABS: { id: HouseFilter; label: string }[] = [
  { id: "All", label: "All Members" },
  { id: "Lok Sabha", label: "Lok Sabha" },
  { id: "Rajya Sabha", label: "Rajya Sabha" },
];

export default function MPPage() {
  const { data, isLoading, isError } = useMPs();
  const [house, setHouse] = React.useState<HouseFilter>("All");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const allMps = React.useMemo(() => data?.mps ?? [], [data]);
  const mps = React.useMemo(
    () =>
      house === "All"
        ? allMps
        : allMps.filter((m) => m.houses.includes(house)),
    [allMps, house],
  );
  const selected = allMps.find((m) => m.id === selectedId) ?? null;

  // Reset selection if it no longer matches the active house filter.
  React.useEffect(() => {
    if (selected && house !== "All" && !selected.houses.includes(house)) {
      setSelectedId(null);
    }
  }, [house, selected]);

  const counts = React.useMemo(
    () => ({
      lok: allMps.filter((m) => m.houses.includes("Lok Sabha")).length,
      rajya: allMps.filter((m) => m.houses.includes("Rajya Sabha")).length,
    }),
    [allMps],
  );

  return (
    <>
      <Header
        title="MP Directory"
        subtitle="Members of Parliament from Uttar Pradesh — Lok Sabha & Rajya Sabha"
        showGlobalFilters={false}
      />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 lg:p-6">
        <Card>
          <CardContent className="space-y-4 p-4">
            {/* House selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <Landmark className="h-4 w-4 text-primary" />
                House
              </span>
              {HOUSE_TABS.map((t) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant={house === t.id ? "default" : "outline"}
                  onClick={() => setHouse(t.id)}
                  className="gap-2"
                >
                  {t.label}
                  {t.id === "Lok Sabha" && (
                    <Badge variant="secondary" className="ml-0.5">
                      {counts.lok}
                    </Badge>
                  )}
                  {t.id === "Rajya Sabha" && (
                    <Badge variant="secondary" className="ml-0.5">
                      {counts.rajya}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* MP selector */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-primary" />
                Select MP
              </div>
              <div className="sm:w-[26rem]">
                <SearchableSelect
                  options={mps.map((m) => ({
                    label: `${m.name} — ${m.constituency}`,
                    value: m.id,
                  }))}
                  value={selectedId}
                  onChange={setSelectedId}
                  placeholder={`Choose an MP${house === "All" ? "" : ` (${house})`}…`}
                  searchPlaceholder="Search by name or constituency…"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isError ? (
          <ErrorState />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-[560px] w-full rounded-xl lg:col-span-1" />
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          </div>
        ) : selected ? (
          <div className="animate-fade-in">
            <MPDetails mp={selected} />
          </div>
        ) : (
          <>
            <EmptyState
              icon={<Landmark className="h-6 w-6" />}
              title="Select an MP to view their profile"
              description="Choose a Member of Parliament to see their details, contact information, social media, performance analytics and related media coverage."
            />
            {/* Quick pick grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mps.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-12 w-12 rounded-full ring-1 ring-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.constituency} · {m.party}
                    </p>
                  </div>
                  <HouseBadge house={m.house} />
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
