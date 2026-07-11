"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { PersonElectionHistory } from "@/lib/types";

function resultTone(winLose: string | null): string {
  const v = (winLose ?? "").toLowerCase();
  if (v === "win") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (v === "lose") return "border-rose-200 bg-rose-50 text-rose-800";
  return "";
}

export function PersonElectionHistoryCard({
  history,
  title = "Election Results",
}: {
  history: PersonElectionHistory | null | undefined;
  title?: string;
}) {
  if (!history?.elections?.length) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{title}</CardTitle>
        {history.caste && (
          <Badge variant="outline">Caste: {history.caste}</Badge>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Year</th>
              <th className="pb-3 pr-4 font-medium">Party</th>
              <th className="pb-3 pr-4 font-medium">Result</th>
              <th className="pb-3 font-medium text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {history.elections.map((e) => (
              <tr key={e.year} className="border-b border-border/60 last:border-0">
                <td className="py-3 pr-4 font-bold text-primary">{e.year}</td>
                <td className="py-3 pr-4">
                  {e.party ? <Badge variant="outline">{e.party}</Badge> : "—"}
                </td>
                <td className="py-3 pr-4">
                  {e.winLose ? (
                    <Badge variant="outline" className={resultTone(e.winLose)}>
                      {e.winLose}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {e.margin != null ? formatNumber(e.margin) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
