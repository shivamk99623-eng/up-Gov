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
  Users,
} from "lucide-react";
import { FaXTwitter, FaFacebookF, FaInstagram } from "react-icons/fa6";
import { Header } from "@/components/layout/header";
import { ChartCard } from "@/components/cards/chart-card";
import { SearchableSelect } from "@/components/filters/searchable-select";
import {
  MediaCountChart,
  SentimentDonut,
} from "@/components/charts/district-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/states";
import { DistrictMediaTabs } from "@/components/district/district-media-tabs";
import { GovernmentMemberDetails } from "@/components/representatives/government-member-details";
import { MPBioDetails } from "@/components/representatives/mp-bio-details";
import { Newspaper } from "lucide-react";
import { useMLAs } from "@/lib/api-client";
import { useRepresentativeSelection } from "@/lib/use-representative-selection";
import { cn, formatNumber } from "@/lib/utils";
import type { MLA } from "@/lib/types";

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

function MLADetails({ mla }: { mla: MLA }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{mla.constituency}</Badge>
        <Badge variant="outline">{mla.district}</Badge>
        <Badge>{mla.party}</Badge>
      </div>

      {mla.bioProfile ? (
        <MPBioDetails profile={mla.bioProfile} fallbackName={mla.name} />
      ) : (
        <GovernmentMemberDetails
          profile={mla.governmentProfile}
          fallbackName={mla.name}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatTile
          label="Total Engagement"
          value={mla.totalEngagement}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="#2563eb"
        />
        <StatTile
          label="Media Mentions"
          value={mla.mediaMentions}
          icon={<MessageSquare className="h-4 w-4" />}
          accent="#ff7722"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Media-wise Coverage"
          description="Linked mentions by media type"
        >
          <MediaCountChart data={mla.media} />
        </ChartCard>
        <ChartCard
          title="Media Sentiment Breakdown"
          description={`${formatNumber(mla.mediaMentions)} total mentions`}
        >
          <SentimentDonut data={mla.sentiment} height={300} />
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
                Print and digital mentions linked to {mla.name}.
              </p>
            </div>
          </div>
          <DistrictMediaTabs
            entity={mla.name}
            exportName={mla.name}
            printSource="mla"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function MLAPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 lg:p-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-[560px] w-full rounded-xl" />
        </div>
      }
    >
      <MLAPageContent />
    </React.Suspense>
  );
}

function MLAPageContent() {
  const { data, isLoading, isError } = useMLAs();
  const { selectedId, setSelectedId } = useRepresentativeSelection();

  const mlas = data?.mlas ?? [];
  const selected = mlas.find((m) => m.id === selectedId) ?? null;

  return (
    <>
      <Header
        title="MLA Directory"
        subtitle="Members of the Legislative Assembly from Uttar Pradesh — Vidhan Sabha"
        showGlobalFilters={false}
      />
      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 lg:p-6">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Select MLA
            </div>
            <div className="sm:w-96">
              <SearchableSelect
                options={mlas.map((m) => ({
                  label: `${m.name} — ${m.constituency}`,
                  value: m.id,
                }))}
                value={selectedId}
                onChange={setSelectedId}
                placeholder="Choose an MLA…"
                searchPlaceholder="Search by name or constituency…"
                disabled={isLoading}
              />
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
            <MLADetails mla={selected} />
          </div>
        ) : (
          <>
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="Select an MLA to view their profile"
              description="Choose a Member of the Legislative Assembly to see their details, career timeline, performance analytics and related media coverage."
            />
            {/* Quick pick grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mlas.map((m) => (
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
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.constituency} · {m.party}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
