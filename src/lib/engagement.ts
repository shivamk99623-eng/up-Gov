/** Parses X/Twitter engagement blob: likes:5,retweets:1,replies:0,quotes:0,... */
export function parseXEngagementsTotal(raw: string | null | undefined): number {
  if (!raw?.trim()) return 0;
  const data = Object.fromEntries(
    raw.split(",").map((item) => {
      const colon = item.indexOf(":");
      if (colon === -1) return [item.trim(), "0"];
      return [
        item.slice(0, colon).trim(),
        item.slice(colon + 1).trim() || "0",
      ];
    }),
  );
  let total = 0;
  for (const key of ["likes", "retweets", "replies", "quotes"] as const) {
    total += Number.parseInt(data[key] ?? "0", 10) || 0;
  }
  return total;
}

export function parseNumericCount(raw: string | null | undefined): number {
  if (!raw?.trim()) return 0;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? n : 0;
}
