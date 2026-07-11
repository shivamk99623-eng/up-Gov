/**
 * Sync handlers that run inside the SQLite worker thread.
 * Keep this module free of Next.js request APIs.
 */
import { getDashboard, getDashboardRollups, getDashboardStats, getDistrictAnalytics, getFilterOptions } from "@/services/analytics";
import {
  getConstituencyAnalytics,
  getConstituencyOptions,
  getConstituencyPrint,
} from "@/services/constituency";
import { getConstituencyDetail } from "@/lib/constituency-detail";
import { getLegislativeAssemblyDetail } from "@/lib/legislative-detail";
import {
  getCombinedDigitalNews,
  getOnlineNews,
  getPrintNews,
  getXNews,
  getYouTubeNews,
} from "@/services/media";
import {
  getMLAById,
  getMLAList,
  getMPById,
  getMPList,
} from "@/services/representatives";
import type { DbWorkerOp } from "./types";

export function dispatchDbOp(payload: DbWorkerOp): unknown {
  switch (payload.op) {
    case "dashboard":
      return getDashboard(payload.filters);
    case "dashboardStats":
      return getDashboardStats(payload.filters);
    case "dashboardRollups":
      return getDashboardRollups(payload.filters);
    case "district":
      return getDistrictAnalytics(payload.district, payload.filters);
    case "filterOptions":
      return getFilterOptions();
    case "constituencyAnalytics":
      return getConstituencyAnalytics(payload.constituency, payload.filters);
    case "constituencyPrint":
      return getConstituencyPrint(
        payload.constituency,
        payload.filters,
        payload.pagination,
      );
    case "constituencyOptions":
      return getConstituencyOptions(payload.scope);
    case "constituencyDetail":
      return getConstituencyDetail(payload.name);
    case "legislativeDetail":
      return getLegislativeAssemblyDetail(payload.name);
    case "mpList": {
      const all = getMPList();
      const mps = payload.house
        ? all.filter((m) => m.house === payload.house)
        : all;
      return { total: mps.length, mps };
    }
    case "mpById":
      return getMPById(payload.id, payload.house, payload.filters);
    case "mlaList": {
      const mlas = getMLAList();
      return { total: mlas.length, mlas };
    }
    case "mlaById":
      return getMLAById(payload.id, payload.filters);
    case "printNews":
      return getPrintNews(payload.filters, payload.pagination);
    case "youtubeNews":
      return getYouTubeNews(payload.filters, payload.pagination);
    case "xNews":
      return getXNews(payload.filters, payload.pagination);
    case "onlineNews":
      return getOnlineNews(payload.filters, payload.pagination);
    case "combinedDigitalNews":
      return getCombinedDigitalNews(payload.filters, payload.pagination);
    default: {
      const _exhaustive: never = payload;
      throw new Error(`Unknown db worker op: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
