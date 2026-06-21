"use client";

import * as React from "react";
import {
  Landmark,
  Users,
  Shield,
  TrendingUp,
  Vote,
  Building2,
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

function PartyOrgPanel({ org, color }: { org: ConstituencyPartyOrg; color: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <OrgField label="Jiladhyaksha" value={org.jiladhyaksha} />
      <OrgField label="Mahanagar President" value={org.mahanagar} />
      <OrgField label="Mandal Structure" value={org.mandal} />
      <OrgField label="District Representative (Jilapratinidhi)" value={org.jilapratinidhi} />
      <OrgField label="Booth Organization Status" value={org.boothadhyaksha} />
      {/* <div
        className="flex items-center rounded-md px-3 py-2.5 sm:col-span-2"
        style={{ background: `color-mix(in srgb, ${color} 8%, white)` }}
      >
        <Building2 className="mr-2 h-4 w-4" style={{ color }} />
        <span className="text-xs text-muted-foreground">
          Organizational data as recorded in the constituency dataset
        </span>
      </div> */}
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

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <Card className="overflow-hidden border-primary/20">
        <div className="h-1.5 bg-gradient-to-r from-primary via-[#ff7722] to-primary/60" />
        <CardContent className="p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Landmark className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
                  {data.constituencyName}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/5 text-primary"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {reservation}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 lg:gap-6">
              <div className="rounded-xl border border-border bg-secondary/40 px-5 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Total Population
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {data.totalPopulation ? formatNumber(data.totalPopulation) : "—"}
                </p>
              </div>
              {data.elections[0]?.winnerParty && (
                <div className="rounded-xl border border-border bg-secondary/40 px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Vote className="h-3.5 w-3.5" />
                    2024 Winner
                  </div>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {data.elections[0].winnerParty}
                  </p>
                  {data.elections[0].winnerName && (
                    <p className="text-xs text-muted-foreground">
                      {data.elections[0].winnerName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Political Insights */}
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

      {/* Charts */}
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

      {/* Election History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Election History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Year</th>
                <th className="pb-3 pr-4 font-medium">Winner</th>
                <th className="pb-3 pr-4 font-medium">Party</th>
                <th className="pb-3 pr-4 font-medium text-right">Total Votes</th>
                <th className="pb-3 font-medium text-right">Candidates</th>
              </tr>
            </thead>
            <tbody>
              {data.elections.map((e) => (
                <tr key={e.year} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 font-bold text-primary">{e.year}</td>
                  <td className="py-3 pr-4 font-medium">{e.winnerName ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {e.winnerParty ? (
                      <Badge variant="outline">{e.winnerParty}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {e.totalVotesPolled ? formatNumber(e.totalVotesPolled) : "—"}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {e.totalCandidates ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Party Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Party Organization Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bjp">
            <TabsList className="flex h-auto flex-wrap gap-1">
              {PARTY_TABS.map((p) => (
                <TabsTrigger
                  key={p.key}
                  value={p.key}
                  className="data-[state=active]:border-b-2"
                  style={
                    {
                      "--tw-ring-color": p.color,
                    } as React.CSSProperties
                  }
                >
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
    </div>
  );
}
