import { Badge } from "@/components/ui/badge";
import type { MediaType, Sentiment } from "@/lib/types";

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const variant =
    sentiment === "Positive"
      ? "positive"
      : sentiment === "Negative"
        ? "negative"
        : "neutral";
  return <Badge variant={variant}>{sentiment}</Badge>;
}

export function MediaBadge({ mediaType }: { mediaType: MediaType }) {
  const map = {
    YouTube: { variant: "youtube" as const, label: "YouTube" },
    X: { variant: "x" as const, label: "Twitter / X" },
    Online: { variant: "online" as const, label: "Online" },
  };
  const { variant, label } = map[mediaType];
  return <Badge variant={variant}>{label}</Badge>;
}
