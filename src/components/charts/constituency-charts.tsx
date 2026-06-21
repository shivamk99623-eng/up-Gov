"use client";

import * as React from "react";
import type { EChartsOption } from "echarts";
import { EChart, CHART_COLORS, baseTooltip } from "./echart";
import type { ConstituencyElectionResult } from "@/lib/types";

const PARTY_COLORS: Record<string, string> = {
  BJP: "#ff7722",
  SP: "#e11d48",
  BSP: "#2563eb",
  INC: "#138808",
  RLD: "#7c3aed",
  AAP: "#0891b2",
};

function partyColor(party: string | null): string {
  if (!party) return CHART_COLORS.palette[8];
  const key = party.toUpperCase().replace(/\s+/g, "");
  for (const [k, color] of Object.entries(PARTY_COLORS)) {
    if (key.includes(k)) return color;
  }
  return CHART_COLORS.palette[Math.abs(party.length) % CHART_COLORS.palette.length];
}

const grid = { left: 8, right: 16, top: 36, bottom: 8, containLabel: true };

export interface CommunityBarItem {
  label: string;
  percentage: number;
  population: number | null;
}

export function CommunityBarChart({ items }: { items: CommunityBarItem[] }) {
  const data = items.filter((s) => s.label && s.percentage > 0);
  const option = React.useMemo<EChartsOption>(
    () => ({
      grid: { ...grid, bottom: 24 },
      tooltip: {
        ...baseTooltip,
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const p = (Array.isArray(params) ? params[0] : params) as {
            name?: string;
            value?: number;
            data?: { population?: number | null };
          };
          const pop =
            p?.data?.population != null
              ? `<br/>Population: ${p.data.population.toLocaleString("en-IN")}`
              : "";
          return `${p?.name ?? ""}: ${p?.value ?? 0}%${pop}`;
        },
      },
      xAxis: {
        type: "category",
        data: data.map((s) => s.label),
        axisLine: { lineStyle: { color: "#d1d5db" } },
        axisLabel: { color: "#4b5563", fontWeight: 600, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        max: 100,
        splitLine: { lineStyle: { color: "#eef0f4" } },
        axisLabel: { color: "#6b7280", formatter: "{value}%" },
      },
      series: [
        {
          type: "bar",
          barWidth: "46%",
          data: data.map((s, i) => ({
            value: s.percentage,
            name: s.label,
            population: s.population,
            itemStyle: {
              color:
                s.label === "Others"
                  ? CHART_COLORS.neutral
                  : CHART_COLORS.palette[i % CHART_COLORS.palette.length],
              borderRadius: [6, 6, 0, 0],
            },
          })),
          label: {
            show: true,
            position: "top",
            formatter: "{c}%",
            fontSize: 11,
            fontWeight: 600,
            color: "#374151",
          },
        },
      ],
    }),
    [data],
  );
  if (!data.length) return null;
  return <EChart option={option} height={300} />;
}

export function VoteComparisonChart({
  elections,
}: {
  elections: ConstituencyElectionResult[];
}) {
  const ordered = [...elections].reverse();
  const option = React.useMemo<EChartsOption>(
    () => ({
      grid: { ...grid, bottom: 24 },
      tooltip: {
        ...baseTooltip,
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      xAxis: {
        type: "category",
        data: ordered.map((e) => String(e.year)),
        axisLine: { lineStyle: { color: "#d1d5db" } },
        axisLabel: { color: "#4b5563", fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#eef0f4" } },
        axisLabel: {
          color: "#6b7280",
          formatter: (v: number) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : String(v),
        },
      },
      series: [
        {
          type: "bar",
          barWidth: "46%",
          data: ordered.map((e) => ({
            value: e.totalVotesPolled ?? 0,
            itemStyle: {
              color: partyColor(e.winnerParty),
              borderRadius: [6, 6, 0, 0],
            },
          })),
          label: {
            show: true,
            position: "top",
            fontSize: 10,
            color: "#6b7280",
          },
        },
      ],
    }),
    [ordered],
  );
  return <EChart option={option} height={300} />;
}
