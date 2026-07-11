import { createNewsRoute } from "@/lib/news-route-handler";

export const dynamic = "force-dynamic";

export const GET = createNewsRoute((filters, pagination) => ({
  op: "onlineNews",
  filters,
  pagination,
}));
