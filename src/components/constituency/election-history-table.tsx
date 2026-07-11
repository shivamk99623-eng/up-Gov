"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { ConstituencyElectionResult } from "@/lib/types";

export function ElectionHistoryTable({
  elections,
  emptyLabel = "No election data available",
}: {
  elections: ConstituencyElectionResult[];
  emptyLabel?: string;
}) {
  if (!elections.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-3 pr-3 font-medium">Year</th>
            <th className="pb-3 pr-3 font-medium">Winner</th>
            <th className="pb-3 pr-3 font-medium">Party</th>
            <th className="pb-3 pr-3 font-medium">Caste</th>
            <th className="pb-3 pr-3 font-medium text-right">Winner Votes</th>
            <th className="pb-3 pr-3 font-medium">Runner-up</th>
            <th className="pb-3 pr-3 font-medium text-right">Margin</th>
            {/* <th className="pb-3 pr-3 font-medium text-right">Total Votes</th> */}
            <th className="pb-3 font-medium text-right">Candidates</th>
          </tr>
        </thead>
        <tbody>
          {elections.map((e) => (
            <tr key={e.year} className="border-b border-border/60 last:border-0">
              <td className="py-3 pr-3 font-bold text-primary">{e.year}</td>
              <td className="py-3 pr-3 font-medium">{e.winnerName ?? "—"}</td>
              <td className="py-3 pr-3">
                {e.winnerParty ? (
                  <Badge variant="outline">{e.winnerParty}</Badge>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-3 pr-3 text-muted-foreground">
                {e.winningCandidateCaste ?? "—"}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums">
                {e.winningCandidateVotes != null
                  ? formatNumber(e.winningCandidateVotes)
                  : "—"}
              </td>
              <td className="py-3 pr-3">
                {e.runnerUpName ? (
                  <span>
                    {e.runnerUpName}
                    {e.runnerUpParty ? (
                      <span className="text-muted-foreground">
                        {" "}
                        ({e.runnerUpParty})
                      </span>
                    ) : null}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums font-medium">
                {e.winningMargin != null ? formatNumber(e.winningMargin) : "—"}
              </td>
                {/* <td className="py-3 pr-3 text-right tabular-nums">
                  {e.totalVotesPolled != null ? formatNumber(e.totalVotesPolled) : "—"}
                </td> */}
              <td className="py-3 text-right tabular-nums">
                {e.totalCandidates ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ElectionHistoryCard({
  elections,
  title = "Election History",
}: {
  elections: ConstituencyElectionResult[];
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ElectionHistoryTable elections={elections} />
      </CardContent>
    </Card>
  );
}
