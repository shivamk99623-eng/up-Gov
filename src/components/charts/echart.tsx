"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Lazy-load echarts-for-react so the (large) charting bundle is only fetched
// on the client when a chart actually mounts.
const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type EChartsInstance = {
  off: (event: string, handler?: (params: unknown) => void) => void;
  on: (event: string, handler: (params: unknown) => void) => void;
  resize?: () => void;
};

interface EChartProps {
  option: EChartsOption;
  height?: number | string;
  className?: string;
  /** Called once the chart instance is ready (also after dynamic import loads). */
  onChartReady?: (instance: EChartsInstance) => void;
  onEvents?: Record<string, (params: unknown) => void>;
}

export function EChart({
  option,
  height = 320,
  className,
  onChartReady,
  onEvents,
}: EChartProps) {
  const chartRef = React.useRef<EChartsInstance | null>(null);
  const [chartReady, setChartReady] = React.useState(false);

  const handleChartReady = React.useCallback(
    (instance: unknown) => {
      chartRef.current = instance as EChartsInstance;
      setChartReady(true);
      onChartReady?.(chartRef.current);
    },
    [onChartReady],
  );

  // Resize on window changes only (autoResize uses size-sensor and retriggers on
  // unrelated layout shifts while scrolling, which flickers other charts).
  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chartReady || !chart?.resize) return;
    let tid: ReturnType<typeof setTimeout>;
    const onWinResize = () => {
      clearTimeout(tid);
      tid = setTimeout(() => chart.resize?.(), 200);
    };
    window.addEventListener("resize", onWinResize);
    return () => {
      clearTimeout(tid);
      window.removeEventListener("resize", onWinResize);
    };
  }, [chartReady]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%", minHeight: height, minWidth: 0 }}
      className={cn("shrink-0", className)}
      notMerge
      lazyUpdate
      autoResize={false}
      opts={{ renderer: "canvas" }}
      onChartReady={handleChartReady}
      onEvents={onEvents}
    />
  );
}

/** Shared UP government chart palette. */
export const CHART_COLORS = {
  primary: "#8c1d18",
  saffron: "#ff7722",
  green: "#138808",
  blue: "#2563eb",
  youtube: "#ff0000",
  x: "#1d1d1f",
  online: "#2563eb",
  positive: "#16a34a",
  negative: "#dc2626",
  neutral: "#f59e0b",
  palette: [
    "#8c1d18",
    "#ff7722",
    "#2563eb",
    "#138808",
    "#7c3aed",
    "#0891b2",
    "#db2777",
    "#ca8a04",
    "#475569",
    "#dc2626",
    "#0d9488",
    "#9333ea",
  ],
};

export const baseTooltip = {
  trigger: "axis" as const,
  backgroundColor: "rgba(24,24,27,0.95)",
  borderColor: "transparent",
  textStyle: { color: "#fff", fontSize: 12 },
  padding: [8, 12],
};
