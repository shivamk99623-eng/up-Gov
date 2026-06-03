"use client";

import * as React from "react";
import type { EChartsOption } from "echarts";
import { EChart, CHART_COLORS, baseTooltip } from "./echart";
import type { NameCount, TrendPoint, MediaBreakdown } from "@/lib/types";

const gridBase = { left: 8, right: 16, top: 24, bottom: 8, containLabel: true };

export function TopDistrictsChart({ data }: { data: NameCount[] }) {
  const option = React.useMemo<EChartsOption>(() => {
    const sorted = [...data].sort((a, b) => a.count - b.count);
    return {
      grid: { ...gridBase, left: 4 },
      tooltip: { ...baseTooltip, trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: { type: "value", splitLine: { lineStyle: { color: "#eef0f4" } } },
      yAxis: {
        type: "category",
        data: sorted.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: sorted.map((d) => d.count),
          barWidth: "58%",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: "#b8312c" },
                { offset: 1, color: "#8c1d18" },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
          label: { show: true, position: "right", color: "#6b7280", fontSize: 11 },
        },
      ],
    };
  }, [data]);
  return <EChart option={option} height={360} />;
}

export function MediaDistributionChart({ data }: { data: MediaBreakdown }) {
  const option = React.useMemo<EChartsOption>(
    () => ({
      tooltip: {
        ...baseTooltip,
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: { bottom: 0, icon: "circle", textStyle: { color: "#6b7280" } },
      series: [
        {
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "44%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: "bold" },
          },
          data: [
            { name: "YouTube", value: data.youtube, itemStyle: { color: CHART_COLORS.youtube } },
            { name: "Twitter / X", value: data.x, itemStyle: { color: CHART_COLORS.x } },
            { name: "Online", value: data.online, itemStyle: { color: CHART_COLORS.online } },
          ],
        },
      ],
    }),
    [data],
  );
  return <EChart option={option} height={320} />;
}

export function DailyTrendChart({ data }: { data: TrendPoint[] }) {
  const option = React.useMemo<EChartsOption>(
    () => ({
      grid: gridBase,
      tooltip: { ...baseTooltip },
      legend: {
        top: 0,
        right: 0,
        icon: "roundRect",
        textStyle: { color: "#6b7280", fontSize: 11 },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.map((d) => d.date),
        axisLine: { lineStyle: { color: "#d1d5db" } },
        axisLabel: { color: "#6b7280", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#eef0f4" } },
        axisLabel: { color: "#6b7280" },
      },
      series: [
        {
          name: "Total",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data.map((d) => d.total),
          lineStyle: { width: 3, color: CHART_COLORS.primary },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(140,29,24,0.25)" },
                { offset: 1, color: "rgba(140,29,24,0.01)" },
              ],
            },
          },
        },
        {
          name: "YouTube",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data.map((d) => d.youtube),
          lineStyle: { width: 2, color: CHART_COLORS.youtube },
        },
        {
          name: "Twitter / X",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data.map((d) => d.x),
          lineStyle: { width: 2, color: CHART_COLORS.x },
        },
        {
          name: "Online",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data.map((d) => d.online),
          lineStyle: { width: 2, color: CHART_COLORS.online },
        },
      ],
    }),
    [data],
  );
  return <EChart option={option} height={320} />;
}

export function HorizontalCountChart({
  data,
  color = CHART_COLORS.saffron,
  height = 300,
}: {
  data: NameCount[];
  color?: string;
  height?: number;
}) {
  const option = React.useMemo<EChartsOption>(() => {
    const sorted = [...data].sort((a, b) => a.count - b.count);
    return {
      grid: { ...gridBase, left: 4 },
      tooltip: { ...baseTooltip, trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: { type: "value", splitLine: { lineStyle: { color: "#eef0f4" } } },
      yAxis: {
        type: "category",
        data: sorted.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#4b5563", width: 110, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: sorted.map((d) => d.count),
          barWidth: "55%",
          itemStyle: { color, borderRadius: [0, 5, 5, 0] },
          label: { show: true, position: "right", color: "#6b7280", fontSize: 11 },
        },
      ],
    };
  }, [data, color]);
  return <EChart option={option} height={height} />;
}
