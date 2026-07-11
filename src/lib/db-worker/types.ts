import type {
  ConstituencyScope,
  GlobalFilters,
  House,
  MediaType,
} from "@/lib/types";
import type { PaginationParams } from "@/lib/news-repository";

/** Operations executed inside the SQLite worker thread. */
export type DbWorkerOp =
  | { op: "dashboard"; filters: GlobalFilters }
  | { op: "district"; district: string; filters: GlobalFilters }
  | { op: "filterOptions" }
  | {
      op: "constituencyAnalytics";
      constituency: string;
      filters: GlobalFilters;
    }
  | {
      op: "constituencyPrint";
      constituency: string | null;
      filters: GlobalFilters;
      pagination: PaginationParams;
    }
  | { op: "constituencyOptions"; scope: ConstituencyScope }
  | { op: "constituencyDetail"; name: string }
  | { op: "legislativeDetail"; name: string }
  | { op: "mpList"; house?: House }
  | { op: "mpById"; id: string; house?: House; filters: GlobalFilters }
  | { op: "mlaList" }
  | { op: "mlaById"; id: string; filters: GlobalFilters }
  | {
      op: "printNews";
      filters: GlobalFilters;
      pagination: PaginationParams;
    }
  | {
      op: "youtubeNews";
      filters: GlobalFilters;
      pagination: PaginationParams;
    }
  | {
      op: "xNews";
      filters: GlobalFilters;
      pagination: PaginationParams;
    }
  | {
      op: "onlineNews";
      filters: GlobalFilters;
      pagination: PaginationParams;
    }
  | {
      op: "combinedDigitalNews";
      filters: GlobalFilters & { mediaType?: MediaType | "All" | null };
      pagination: PaginationParams;
    };

export type DbWorkerRequest = {
  id: number;
  payload: DbWorkerOp;
};

export type DbWorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };
