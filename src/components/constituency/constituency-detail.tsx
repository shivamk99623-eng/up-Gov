"use client";

import * as React from "react";
import {
  Landmark,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/cards/chart-card";
import {
  CommunityBarChart,
  VoteComparisonChart,
  type CommunityBarItem,
} from "@/components/charts/constituency-charts";
import { ElectionHistoryCard } from "@/components/constituency/election-history-table";
import { ErrorState } from "@/components/common/states";
import { useConstituencyDetail } from "@/lib/api-client";
import { formatNumber } from "@/lib/utils";
import type { ConstituencyDetailResponse, ConstituencyPartyOrg } from "@/lib/types";

const PARTY_TABS = [
  { key: "bjp" as const, label: "BJP", color: "#ff7722" },
  { key: "sp" as const, label: "SP", color: "#e11d48" },
  { key: "bsp" as const, label: "BSP", color: "#2563eb" },
  { key: "inc" as const, label: "INC", color: "#138808" },
];

function buildCommunityBarItems(
  caste: ConstituencyDetailResponse["caste"],
  totalPopulation: number | null,
): CommunityBarItem[] {
  const items: CommunityBarItem[] = [];
  let usedPct = 0;

  const topTwo = [caste.mostPopulated, caste.secondMajority].filter(
    (s): s is NonNullable<typeof s> => !!s && s.percentage != null,
  );

  for (const segment of topTwo) {
    usedPct += segment.percentage!;
    items.push({
      label: segment.label,
      percentage: segment.percentage!,
      population: totalPopulation
        ? Math.round((totalPopulation * segment.percentage!) / 100)
        : null,
    });
  }

  const othersPct = Math.max(0, Math.round((100 - usedPct) * 10) / 10);
  if (othersPct > 0) {
    items.push({
      label: "Others",
      percentage: othersPct,
      population: totalPopulation
        ? Math.round((totalPopulation * othersPct) / 100)
        : null,
    });
  }

  return items;
}

function reservationLabel(status: string | null): string {
  if (!status) return "General";
  const s = status.toUpperCase();
  if (s === "SC" || s.includes("SC")) return "SC";
  if (s === "ST" || s.includes("ST")) return "ST";
  return "General";
}

function InsightCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-2 text-sm font-semibold leading-snug text-foreground"
        style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}
      >
        {value}
      </p>
    </div>
  );
}

function OrgField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary/30 px-3 py-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {value ?? "Not available"}
      </p>
    </div>
  );
}

function PartyOrgPanel({ org }: { org: ConstituencyPartyOrg; color: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <OrgField label="Jiladhyaksha" value={org.jiladhyaksha} />
      <OrgField label="Mahanagar President" value={org.mahanagar} />
      <OrgField label="Mandal Structure" value={org.mandal} />
      <OrgField label="District Representative (Jilapratinidhi)" value={org.jilapratinidhi} />
      <OrgField label="Booth Organization Status" value={org.boothadhyaksha} />
    </div>
  );
}

export function ConstituencyDetail({ constituency }: { constituency: string }) {
  const { data, isLoading, isError, error } = useConstituencyDetail(constituency);

  if (isError) {
    return <ErrorState message={(error as Error)?.message ?? "Failed to load constituency detail"} />;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  const communityBars = buildCommunityBarItems(data.caste, data.totalPopulation);
  const reservation = reservationLabel(data.reservationStatus);
  const latest = data.elections[0];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Landmark className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {data.constituencyName}
          </h2>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-primary"
          >
            <Shield className="mr-1 h-3 w-3" />
            {reservation}
          </Badge>
        </div>

        {/* <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <div className="border-l-2 border-primary/40 pl-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Population
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {data.totalPopulation ? formatNumber(data.totalPopulation) : "—"}
            </p>
          </div>
          {latest?.winnerParty && (
            <div className="border-l-2 border-[#ff7722]/50 pl-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {latest.year} Winner
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">{latest.winnerParty}</p>
              {latest.winnerName && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {latest.winnerName}
                </p>
              )}
            </div>
          )}
          {latest?.winningMargin != null && (
            <div className="border-l-2 border-border pl-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Winning Margin
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {formatNumber(latest.winningMargin)}
              </p>
            </div>
          )}
        </div> */}

        {/* {data.assemblySegments.length > 0 && (
          <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Assembly segments · </span>
            {data.assemblySegments.join(" · ")}
          </p>
        )} */}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          Political Summary & Insights
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.insights.map((insight, i) => (
            <InsightCard
              key={insight.label}
              label={insight.label}
              value={insight.value}
              accent={["#8c1d18", "#ff7722", "#2563eb", "#138808", "#7c3aed", "#0891b2"][i % 6]}
            />
          ))}
        </div>
      </section>

  

      <ElectionHistoryCard elections={data.elections} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Party Organization Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bjp">
            <TabsList className="flex h-auto flex-wrap gap-1">
              {PARTY_TABS.map((p) => (
                <TabsTrigger key={p.key} value={p.key}>
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {PARTY_TABS.map((p) => (
              <TabsContent key={p.key} value={p.key}>
                <PartyOrgPanel org={data.partyOrganization[p.key]} color={p.color} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Community Composition"
          description="Top two communities by share; remaining groups combined as Others"
        >
          {communityBars.length > 0 ? (
            <CommunityBarChart items={communityBars} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No composition data available
            </p>
          )}
        </ChartCard>
        <ChartCard
          title="Vote Comparison"
          description="Total votes polled across elections"
        >
          <VoteComparisonChart elections={data.elections} />
        </ChartCard>
      </section>
    </div>
  );
}
