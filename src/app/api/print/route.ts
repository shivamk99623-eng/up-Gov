import { getPrintNews } from "@/services/media";
import { createNewsRoute } from "@/lib/news-route-handler";

export const dynamic = "force-dynamic";

export const GET = createNewsRoute((filters, pagination) =>
  getPrintNews(filters, pagination),
);
