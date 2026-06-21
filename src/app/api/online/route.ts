import { getOnlineNews } from "@/services/media";
import { createNewsRoute } from "@/lib/news-route-handler";

export const GET = createNewsRoute((filters, pagination) =>
  getOnlineNews(filters, pagination),
);

export const dynamic = "force-dynamic";
