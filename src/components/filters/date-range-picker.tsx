"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
  className?: string;
}

const presets = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const label =
    from && to
      ? `${format(new Date(from), "dd MMM yyyy")} – ${format(
          new Date(to),
          "dd MMM yyyy",
        )}`
      : from
        ? `From ${format(new Date(from), "dd MMM yyyy")}`
        : to
          ? `Until ${format(new Date(to), "dd MMM yyyy")}`
          : "All dates";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start gap-2 font-normal", className)}
        >
          <Calendar className="h-4 w-4 opacity-70" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.days}
              variant="secondary"
              size="sm"
              onClick={() => {
                onChange(
                  format(subDays(new Date(), p.days), "yyyy-MM-dd"),
                  format(new Date(), "yyyy-MM-dd"),
                );
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>From</Label>
            <Input
              type="date"
              value={from ?? ""}
              max={to ?? undefined}
              onChange={(e) => onChange(e.target.value || null, to)}
            />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input
              type="date"
              value={to ?? ""}
              min={from ?? undefined}
              onChange={(e) => onChange(from, e.target.value || null)}
            />
          </div>
        </div>
        <div className="flex justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null, null)}
          >
            Clear
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
