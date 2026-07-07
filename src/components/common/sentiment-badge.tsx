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
  const map: Record<
    MediaType,
    { variant: "youtube" | "x" | "online" | "secondary"; label: string }
  > = {
    YouTube: { variant: "youtube", label: "YouTube" },
    X: { variant: "x", label: "Twitter / X" },
    Online: { variant: "online", label: "Online" },
    Print: { variant: "secondary", label: "Print" },
  };
  const { variant, label } = map[mediaType];
  return <Badge variant={variant}>{label}</Badge>;
}
