"use client";

import { Loader2 } from "lucide-react";
import { useGlobalFiltersLoading } from "@/lib/use-global-filters-loading";
import { useGlobalSearchStatus } from "@/lib/use-global-search-status";
import { formatNumber } from "@/lib/utils";

/**
 * Single global loading / search status strip under the header.
 * Filter apply and search share this one place — nowhere else.
 */
export function GlobalFilterStatusBar({
  resultCount,
}: {
  resultCount?: number;
}) {
  const { isLoading } = useGlobalFiltersLoading();
  const { searchInput, search, isWorking, isActive } = useGlobalSearchStatus();

  if (isLoading) {
    return (
      <div
        className="border-t border-border/60 bg-muted/30 px-4 py-2 text-xs text-muted-foreground lg:px-6"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {isWorking && searchInput.trim()
            ? <>Searching for &ldquo;{searchInput.trim()}&rdquo;&hellip;</>
            : <>Applying filters&hellip;</>}
        </span>
      </div>
    );
  }

  if (!searchInput.trim() && !isActive) return null;

  return (
    <div
      className="border-t border-border/60 bg-muted/30 px-4 py-2 text-xs text-muted-foreground lg:px-6"
      role="status"
      aria-live="polite"
    >
      {isActive ? (
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
