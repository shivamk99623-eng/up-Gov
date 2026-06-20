"use client";

import * as React from "react";
import type { EChartsOption } from "echarts";
import { EChart, CHART_COLORS } from "@/components/charts/echart";
import { Skeleton } from "@/components/ui/skeleton";
import type { DistrictSummary } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

let mapRegistered = false;

interface UpMapProps {
  districtSummary: DistrictSummary[];
  onDistrictClick?: (district: string) => void;
  height?: number;
}

export function UpMap({
  districtSummary,
  onDistrictClick,
  height = 720,
}: UpMapProps) {
  const [ready, setReady] = React.useState(mapRegistered);
  /** Every region name from GeoJSON — used so all districts appear on the map. */
  const [geoNames, setGeoNames] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const echarts = await import("echarts");
      const res = await fetch("/geo/up-districts.geojson");
      const geo = await res.json();
      const names: string[] = [];
      // ECharts binds series data to regions via `properties.name`. This
      // GeoJSON only has `properties.district`, so copy it across before
      // registering, otherwise no district matches the data.
      for (const f of geo.features ?? []) {
        if (f.properties?.district) {
          if (!f.properties.name) {
            f.properties.name = f.properties.district;
          }
          names.push(f.properties.district);
        }
      }
      if (!mapRegistered) {
        echarts.registerMap("UP", geo);
        mapRegistered = true;
      }
      if (!cancelled) {
        setGeoNames(names);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data, maxVal } = React.useMemo(() => {
    const byRegion = new Map<string, DistrictSummary>();
    for (const d of districtSummary) {
      byRegion.set(d.geoName, d);
      byRegion.set(d.district, d);
    }
    const max = districtSummary.reduce((m, d) => Math.max(m, d.total), 0);
    const regions = geoNames.length > 0 ? geoNames : [...byRegion.keys()];
    return {
      maxVal: max,
      data: regions.map((name) => {
        const s = byRegion.get(name);
        return {
          name,
          dt_name: name.slice(0, 3),
          value: s?.total ?? 0,
          summary: s,
        };
      }),
    };
  }, [districtSummary, geoNames]);

  const option = React.useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(24,24,27,0.96)",
        borderColor: "transparent",
        padding: 0,
        textStyle: { color: "#fff" },
        formatter: (params: unknown) => {
          const p = params as {
            name: string;
            data?: { summary?: DistrictSummary };
          };
          const s = p.data?.summary;
          if (!s) {
            return `<div style="padding:10px 12px;font-size:12px">
              <strong>${p.name}</strong><br/>No media mentions</div>`;
          }
          return `<div style="padding:10px 14px;min-width:170px;font-size:12px;line-height:1.7">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${s.district}</div>
            <div style="display:flex;justify-content:space-between"><span>Total</span><b>${formatNumber(s.total)}</b></div>
            <div style="display:flex;justify-content:space-between;color:#ff7722"><span>Print</span><b>${formatNumber(s.print)}</b></div>
            <div style="display:flex;justify-content:space-between;color:#ff8a8a"><span>YouTube</span><b>${formatNumber(s.youtube)}</b></div>
            <div style="display:flex;justify-content:space-between;color:#d4d4d8"><span>Twitter / X</span><b>${formatNumber(s.x)}</b></div>
            <div style="display:flex;justify-content:space-between;color:#93c5fd"><span>Online</span><b>${formatNumber(s.online)}</b></div>
          </div>`;
        },
      },
      visualMap: {
        type: "continuous",
        min: 0,
        max: maxVal || 1,
        left: 12,
        bottom: 12,
        calculable: true,
        text: ["High", "Low"],
        inRange: {
          color: ["#fce9e4", "#e9a89f", "#c45a4e", "#8c1d18", "#5c100c"],
        },
        textStyle: { color: "#6b7280", fontSize: 11 },
        itemWidth: 12,
        itemHeight: 90,
      },
      series: [
        {
          name: "UP Districts",
          type: "map",
          map: "UP",
          roam: true,
          scaleLimit: { min: 1, max: 6 },
          // Print the district-wise total news count on districts that have data.
          label: {
            show: true,
            color: "#1a1c23",
            fontSize: 10,
            fontWeight: "bold",
            formatter: (p: unknown) => {
              const d = (p as { data?: { dt_name?: string } }).data;
              return d && typeof d.dt_name === "string"
                ? String(d.dt_name)
                : "";
            },
          },
          emphasis: {
            label: {
              show: true,
              color: "#1a1c23",
              fontWeight: "bold",
              formatter: (p: unknown) => {
                const params = p as {
                  name: string;
                  data?: { summary?: DistrictSummary };
                };
                const s = params.data?.summary;
                return s ? `${s.district}\n${formatNumber(s.total)}` : params.name;
              },
            },
            itemStyle: {
              areaColor: CHART_COLORS.saffron,
              borderColor: "#1a1c23",
              borderWidth: 1,
            },
          },
          itemStyle: {
            areaColor: "#f1f3f7",
            borderColor: "#c7cbd3",
            borderWidth: 0.5,
          },
          select: {
            itemStyle: { areaColor: CHART_COLORS.saffron },
          },
          data,
        },
      ],
    }),
    [data, maxVal],
  );

  const onEvents = React.useMemo(
    () => ({
      click: (params: unknown) => {
        const p = params as { data?: { summary?: DistrictSummary } };
        const district = p.data?.summary?.district;
        if (district && onDistrictClick) onDistrictClick(district);
      },
    }),
    [onDistrictClick],
  );

  if (!ready) {
    return (
      <Skeleton
        className="w-full rounded-lg"
        style={{ height }}
      />
    );
  }

  return <EChart option={option} height={height} onEvents={onEvents} />;
}
