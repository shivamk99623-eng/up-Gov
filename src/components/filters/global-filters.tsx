"use client";

import * as React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "./searchable-select";
import { DateRangePicker } from "./date-range-picker";
import { useFilterStore } from "@/store/filters";
import { useFilterOptions } from "@/lib/api-client";
import { MEDIA_TYPES, SENTIMENTS } from "@/lib/types";

export function GlobalFilters() {
  const f = useFilterStore();
  const { data: options } = useFilterOptions();

  const activeCount = [
    f.district,
    f.mediaType !== "All" ? f.mediaType : null,
    f.sentiment !== "All" ? f.sentiment : null,
    f.language,
    f.dateFrom || f.dateTo ? "date" : null,
    f.search ? "search" : null,
  ].filter(Boolean).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <Badge className="ml-1 h-5 px-1.5">{activeCount}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Global Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <Label>Date Range</Label>
            <DateRangePicker
              from={f.dateFrom}
              to={f.dateTo}
              onChange={f.setDateRange}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label>District</Label>
            <SearchableSelect
              options={(options?.districts ?? []).map((d) => ({
                label: d,
                value: d,
              }))}
              value={f.district}
              onChange={f.setDistrict}
              placeholder="All districts"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Media Type</Label>
            <Select
              value={f.mediaType}
              onValueChange={(v) => f.setMediaType(v as typeof f.mediaType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All media</SelectItem>
                {MEDIA_TYPES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m === "X" ? "Twitter / X" : m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sentiment</Label>
            <Select
              value={f.sentiment}
              onValueChange={(v) => f.setSentiment(v as typeof f.sentiment)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All sentiment</SelectItem>
                {SENTIMENTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Language</Label>
            <SearchableSelect
              options={(options?.languages ?? []).map((l) => ({
                label: l,
                value: l,
              }))}
              value={f.language}
              onChange={f.setLanguage}
              placeholder="All languages"
            />
          </div>
        </div>
        <div className="border-t border-border p-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => f.reset()}
          >
            <RotateCcw className="h-4 w-4" />
            Reset all filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
