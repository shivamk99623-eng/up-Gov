import { createNewsRoute } from "@/lib/news-route-handler";

export const dynamic = "force-dynamic";

export const GET = createNewsRoute((filters, pagination) => {
  const mediaType =
    filters.mediaType === "All" ? null : (filters.mediaType ?? null);
  return {
    op: "combinedDigitalNews",
    filters: { ...filters, mediaType },
    pagination,
  };
});
