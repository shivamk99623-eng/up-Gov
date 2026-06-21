"use client";

import * as React from "react";
import type { EChartsOption } from "echarts";
import { EChart, CHART_COLORS, baseTooltip } from "./echart";
import type { MediaBreakdown, SentimentBreakdown } from "@/lib/types";

const grid = { left: 8, right: 16, top: 28, bottom: 8, containLabel: true };

/** Graph 1: Media-wise total news count (YouTube / Online / X). */
export function MediaCountChart({ data }: { data: MediaBreakdown }) {
  const option = React.useMemo<EChartsOption>(
    () => ({
      grid,
      tooltip: { ...baseTooltip, axisPointer: { type: "shadow" } },
      xAxis: {
        type: "category",
        data: ["Print", "YouTube", "Online", "Twitter / X"],
        axisLine: { lineStyle: { color: "#d1d5db" } },
        axisLabel: { color: "#4b5563", fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#eef0f4" } },
        axisLabel: { color: "#6b7280" },
      },
      series: [
        {
          type: "bar",
          barWidth: "46%",
          data: [
            { value: data.print, itemStyle: { color: CHART_COLORS.saffron } },
            { value: data.youtube, itemStyle: { color: CHART_COLORS.youtube } },
            { value: data.online, itemStyle: { color: CHART_COLORS.online } },
            { value: data.x, itemStyle: { color: CHART_COLORS.x } },
          ],
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          label: { show: true, position: "top", color: "#374151", fontWeight: 600 },
        },
      ],
    }),
    [data],
  );
  return <EChart option={option} height={320} />;
}

/** Graph 2: Media + Sentiment analysis (9 grouped categories). */
export function MediaSentimentChart({
  data,
}: {
  data: {
    print?: SentimentBreakdown;
    youtube: SentimentBreakdown;
    online: SentimentBreakdown;
    x: SentimentBreakdown;
  };
}) {
  const print = data.print ?? { positive: 0, negative: 0, neutral: 0 };
  const option = React.useMemo<EChartsOption>(
    () => ({
      grid: { ...grid, bottom: 24 },
      tooltip: { ...baseTooltip, axisPointer: { type: "shadow" } },
      legend: { top: 0, textStyle: { color: "#6b7280" }, icon: "roundRect" },
      xAxis: {
        type: "category",
        data: ["Print", "YouTube", "Online", "Twitter / X"],
        axisLine: { lineStyle: { color: "#d1d5db" } },
        axisLabel: { color: "#4b5563", fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#eef0f4" } },
        axisLabel: { color: "#6b7280" },
      },
      series: [
        {
          name: "Positive",
          type: "bar",
          data: [
            print.positive,
            data.youtube.positive,
            data.online.positive,
            data.x.positive,
          ],
          itemStyle: { color: CHART_COLORS.positive, borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "Negative",
          type: "bar",
          data: [
            print.negative,
            data.youtube.negative,
            data.online.negative,
            data.x.negative,
          ],
          itemStyle: { color: CHART_COLORS.negative, borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "Neutral",
          type: "bar",
          data: [
            print.neutral,
            data.youtube.neutral,
            data.online.neutral,
            data.x.neutral,
          ],
          itemStyle: { color: CHART_COLORS.neutral, borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [data, print],
  );
  return <EChart option={option} height={340} />;
}

export function SentimentDonut({
  data,
  height = 280,
}: {
  data: SentimentBreakdown;
  height?: number;
}) {
  const option = React.useMemo<EChartsOption>(
    () => ({
      tooltip: { ...baseTooltip, trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, icon: "circle", textStyle: { color: "#6b7280" } },
      series: [
        {
          type: "pie",
          radius: ["50%", "74%"],
          center: ["50%", "44%"],
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 15, fontWeight: "bold" } },
          data: [
            { name: "Positive", value: data.positive, itemStyle: { color: CHART_COLORS.positive } },
            { name: "Negative", value: data.negative, itemStyle: { color: CHART_COLORS.negative } },
            { name: "Neutral", value: data.neutral, itemStyle: { color: CHART_COLORS.neutral } },
          ],
        },
      ],
    }),
    [data],
  );
  return <EChart option={option} height={height} />;
}

/** MLA performance radar. */
export function PerformanceRadar({
  performanceScore,
  attendance,
  publicEngagement,
}: {
  performanceScore: number;
  attendance: number;
  publicEngagement: number;
}) {
  const option = React.useMemo<EChartsOption>(
    () => ({
      tooltip: { ...baseTooltip, trigger: "item" },
      radar: {
        indicator: [
          { name: "Performance", max: 100 },
          { name: "Attendance", max: 100 },
          { name: "Engagement", max: 100 },
        ],
        radius: "65%",
        axisName: { color: "#4b5563", fontSize: 12 },
        splitLine: { lineStyle: { color: "#e5e7eb" } },
        splitArea: { areaStyle: { color: ["#fff", "#faf7f7"] } },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: [performanceScore, attendance, publicEngagement],
              areaStyle: { color: "rgba(140,29,24,0.22)" },
              lineStyle: { color: CHART_COLORS.primary, width: 2 },
              itemStyle: { color: CHART_COLORS.primary },
            },
          ],
        },
      ],
    }),
    [performanceScore, attendance, publicEngagement],
  );
  return <EChart option={option} height={280} />;
}
