import * as React from "react";
import { formatNumber, percent } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
  total?: number;
  loading?: boolean;
}

export function SummaryCard({
  label,
  value,
  icon,
  accent = "var(--primary)",
  total,
  loading,
}: SummaryCardProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-20" />
        <Skeleton className="mt-3 h-3 w-16" />
      </Card>
    );
  }

  return (
    <Card className="group relative min-w-[9.5rem] overflow-hidden p-4 transition-shadow hover:shadow-md">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
            {formatNumber(value)}
          </p>
          {total !== undefined && total > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {percent(value, total)}% of total
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in srgb, ${accent} 12%, white)`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
