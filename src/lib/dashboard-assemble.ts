import type { DashboardResponse } from "@/lib/types";
import type { getDashboardRollups, getDashboardStats } from "@/services/analytics";

type DashboardStats = ReturnType<typeof getDashboardStats>;
type DashboardRollups = ReturnType<typeof getDashboardRollups>;

function mergeKindDailyTrends(
  printDaily: Map<string, number>,
  youtubeDaily: Map<string, number>,
  xDaily: Map<string, number>,
  onlineDaily: Map<string, number>,
): DashboardResponse["dailyTrend"] {
  const map = new Map<
    string,
    DashboardResponse["dailyTrend"][number]
  >();

  const bump = (
    date: string,
    kind: "print" | "YouTube" | "X" | "Online",
    count: number,
  ) => {
    let p = map.get(date);
    if (!p) {
      p = { date, total: 0, print: 0, youtube: 0, x: 0, online: 0 };
      map.set(date, p);
    }
    p.total += count;
    if (kind === "print") p.print += count;
    else if (kind === "YouTube") p.youtube += count;
    else if (kind === "X") p.x += count;
    else p.online += count;
  };

  for (const [date, count] of printDaily) bump(date, "print", count);
  for (const [date, count] of youtubeDaily) bump(date, "YouTube", count);
  for (const [date, count] of xDaily) bump(date, "X", count);
  for (const [date, count] of onlineDaily) bump(date, "Online", count);

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Merge parallel worker results without touching SQLite on the main thread. */
export function assembleDashboard(
  stats: DashboardStats,
  rollups: DashboardRollups,
): DashboardResponse {
  return {
    totalNews:
      stats.youtubeCount +
      stats.xCount +
      stats.onlineCount +
      stats.printCount,
    printCount: stats.printCount,
    youtubeCount: stats.youtubeCount,
    xCount: stats.xCount,
    onlineCount: stats.onlineCount,
    positiveCount: stats.positiveCount,
    negativeCount: stats.negativeCount,
    neutralCount: stats.neutralCount,
    districtSummary: rollups.districtSummary,
    topDistricts: rollups.topDistricts,
    topPositiveNews: rollups.topPositiveNews,
    topNegativeNews: rollups.topNegativeNews,
    mediaDistribution: {
      print: stats.printCount,
      youtube: stats.youtubeCount,
      x: stats.xCount,
      online: stats.onlineCount,
    },
    dailyTrend: mergeKindDailyTrends(
      new Map(stats.printDaily),
      new Map(stats.youtubeDaily),
      new Map(stats.xDaily),
      new Map(stats.onlineDaily),
    ),
    topProfiles: rollups.topProfiles,
    topChannels: rollups.topChannels,
    languageDistribution: rollups.languageDistribution,
    dateRange: rollups.dateRange,
    lastUpdated: new Date().toISOString(),
  };
}
