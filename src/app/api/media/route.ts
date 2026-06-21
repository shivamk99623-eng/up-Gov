import { getCombinedDigitalNews } from "@/services/media";
import { createNewsRoute } from "@/lib/news-route-handler";

export const dynamic = "force-dynamic";

/** Aggregates YouTube, X, and Online when `mediaType` is omitted or `All`. */
export const GET = createNewsRoute((filters, pagination) => {
  const mediaType =
    filters.mediaType === "All" ? null : (filters.mediaType ?? null);
  return getCombinedDigitalNews({ ...filters, mediaType }, pagination);
});
