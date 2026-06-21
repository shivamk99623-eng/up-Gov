import { getXNews } from "@/services/media";
import { createNewsRoute } from "@/lib/news-route-handler";

export const GET = createNewsRoute((filters, pagination) =>
  getXNews(filters, pagination),
);

export const dynamic = "force-dynamic";
