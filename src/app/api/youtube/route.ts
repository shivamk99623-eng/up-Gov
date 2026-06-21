import { getYouTubeNews } from "@/services/media";
import { createNewsRoute } from "@/lib/news-route-handler";

export const GET = createNewsRoute((filters, pagination) =>
  getYouTubeNews(filters, pagination),
);

export const dynamic = "force-dynamic";
