"use client";

import * as React from "react";
import type { EChartsOption } from "echarts";
import { EChart, CHART_COLORS, baseTooltip } from "./echart";
import type {
  NameCount,
  TrendPoint,
  MediaBreakdown,
  NewsItem,
} from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";
import { formatCompact } from "@/lib/utils";

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
            { name: "Print", value: data.print, itemStyle: { color: CHART_COLORS.saffron } },
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
        data: data.map((d) => formatDisplayDate(d.date)),
        axisLine: { lineStyle: { color: "#d1d5db" } },
        axisLabel: { color: "#6b7280", fontSize: 10, rotate: 35 },
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
          name: "Print",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data.map((d) => d.print),
          lineStyle: { width: 2, color: CHART_COLORS.saffron },
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

/** Truncates a headline for use as a chart axis label. */
function shortHeadline(text: string, max = 46): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Opens a news URL in a new tab (adds https:// when the sheet omits the scheme). */
function openNewsUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return;
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

type EChartsClickParams = {
  componentType?: string;
  dataIndex?: number;
  value?: string | number;
  data?: { url?: string; value?: number };
};

function newsIndexFromClick(params: EChartsClickParams): number | undefined {
  if (params.componentType === "series" && typeof params.dataIndex === "number") {
    return params.dataIndex;
  }
  if (params.componentType === "yAxis" && params.value != null) {
    const v = String(params.value);
    const pipe = v.indexOf("|");
    if (pipe >= 0) {
      const n = Number.parseInt(v.slice(0, pipe), 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

const newsTooltipCss =
  "max-width:min(420px,92vw)!important;white-space:normal!important;word-break:break-word!important;overflow-wrap:anywhere!important;line-height:1.45!important;";

/**
 * Top news ranked by engagement. Each bar is a single news item; clicking it
 * opens the original source link in a new tab.
 */
export function TopNewsChart({
  items,
  tone,
}: {
  items: NewsItem[];
  tone: "positive" | "negative";
}) {
  const color = tone === "positive" ? CHART_COLORS.positive : CHART_COLORS.negative;
  const gradTo = tone === "positive" ? "#15803d" : "#b91c1c";

  // Sort ascending so the most-engaging item appears at the top of the chart.
  const sorted = React.useMemo(
    () => [...items].sort((a, b) => a.engagement - b.engagement),
    [items],
  );

  const sortedRef = React.useRef(sorted);
  sortedRef.current = sorted;

  const chartRef = React.useRef<{
    off: (event: string) => void;
    on: (event: string, handler: (params: unknown) => void) => void;
  } | null>(null);

  const bindNewsClick = React.useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = (params: unknown) => {
      const p = params as EChartsClickParams;
      const idx = newsIndexFromClick(p);
      const fromData =
        p.data && typeof p.data === "object" ? p.data.url : undefined;
      const it = idx != null ? sortedRef.current[idx] : undefined;
      const url = fromData ?? it?.url;
      if (url) openNewsUrl(url);
    };

    chart.off("click");
    chart.on("click", handler);
  }, []);

  React.useEffect(() => {
    bindNewsClick();
  }, [bindNewsClick, sorted]);

  const handleChartReady = React.useCallback(
    (instance: unknown) => {
      chartRef.current = instance as typeof chartRef.current;
      bindNewsClick();
    },
    [bindNewsClick],
  );

  const option = React.useMemo<EChartsOption>(
    () => ({
      grid: { left: 4, right: 48, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...baseTooltip,
        trigger: "item",
        confine: true,
        appendToBody: true,
        extraCssText: newsTooltipCss,
        formatter: (p: unknown) => {
          const idx = (p as { dataIndex: number }).dataIndex;
          const it = sorted[idx];
          if (!it) return "";
          const media = it.mediaType === "X" ? "Twitter / X" : it.mediaType;
          const headline = escapeHtml(it.headline || "(No headline)");
          return [
            `<div style="font-weight:600;margin-bottom:6px">${headline}</div>`,
            `<div style="opacity:.85;font-size:11px">${escapeHtml(media)} · ${escapeHtml(it.district)} · ${escapeHtml(it.date ? formatDisplayDate(it.date) : "")}</div>`,
            `<div style="margin-top:6px;font-size:11px">Engagement: <b>${formatCompact(it.engagement)}</b> · Views: <b>${formatCompact(it.views)}</b></div>`,
            `<div style="margin-top:6px;font-size:11px;color:#93c5fd">Click bar or headline to open source ↗</div>`,
          ].join("");
        },
      },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#eef0f4" } },
        axisLabel: { color: "#6b7280", formatter: (v: number) => formatCompact(v) },
      },
      yAxis: {
        type: "category",
        data: sorted.map((it, i) => `${i}|${shortHeadline(it.headline)}`),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#374151",
          fontSize: 11,
          width: 220,
          overflow: "truncate",
          formatter: (val: string) => val.split("|").slice(1).join("|"),
        },
        triggerEvent: true,
      },
      series: [
        {
          type: "bar",
          cursor: "pointer",
          data: sorted.map((it) => ({
            value: it.engagement,
            url: it.url,
          })),
          barWidth: "60%",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: gradTo },
                { offset: 1, color },
              ],
            },
            borderRadius: [0, 5, 5, 0],
          },
          label: {
            show: true,
            position: "right",
            color: "#6b7280",
            fontSize: 11,
            formatter: (p: unknown) => {
              const param = p as { value?: number; data?: { value?: number } };
              const v =
                typeof param.value === "number"
                  ? param.value
                  : (param.data?.value ?? 0);
              return formatCompact(v);
            },
          },
        },
      ],
    }),
    [sorted, color, gradTo],
  );

  return (
    <EChart option={option} height={380} onChartReady={handleChartReady} />
  );
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
