"use client";

import * as React from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import { useGlobalSearchStatus } from "@/lib/use-global-search-status";
import { useFilterStore } from "@/store/filters";

interface GlobalSearchFieldProps {
  className?: string;
}

export function GlobalSearchField({ className }: GlobalSearchFieldProps) {
  const searchInput = useFilterStore((s) => s.searchInput);
  const setSearchInput = useFilterStore((s) => s.setSearchInput);
  const { isWorking } = useGlobalSearchStatus();
  const showClear = !!searchInput;

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search mentions…"
        className={cn("pl-8", showClear || isWorking ? "pr-9" : undefined)}
        aria-busy={isWorking}
        aria-label="Search mentions"
      />
      {(isWorking || showClear) && (
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isWorking && (
            <Loader2
              className="h-4 w-4 animate-spin text-primary"
              aria-hidden
            />
          )}
          {showClear && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function GlobalSearchStatusBar({
  resultCount,
}: {
  /** Total matches when search has finished (e.g. dashboard totalNews). */
  resultCount?: number;
}) {
  const { searchInput, search, isWorking, isActive } = useGlobalSearchStatus();

  if (!searchInput.trim() && !isActive) return null;

  return (
    <div
      className="border-t border-border/60 bg-muted/30 px-4 py-2 text-xs text-muted-foreground lg:px-6"
      role="status"
      aria-live="polite"
    >
      {isWorking ? (
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Searching for &ldquo;{searchInput.trim()}&rdquo;&hellip;
        </span>
      ) : isActive ? (
        <span>
          {resultCount !== undefined ? (
            <>
              <span className="font-medium text-foreground">
                {formatNumber(resultCount)}
              </span>{" "}
              {resultCount === 1 ? "match" : "matches"} for &ldquo;{search}
              &rdquo;
            </>
          ) : (
            <>Showing results for &ldquo;{search}&rdquo;</>
          )}
        </span>
      ) : null}
    </div>
  );
}
