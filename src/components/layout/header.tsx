"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GlobalFilters } from "@/components/filters/global-filters";
import { DateRangePicker } from "@/components/filters/date-range-picker";
import { SidebarNav, Emblem } from "./sidebar-nav";
import {
  GlobalSearchField,
  GlobalSearchStatusBar,
} from "./global-search-field";
import { DEBOUNCE } from "@/lib/debounce-throttle";
import { normalizeSearchFilter } from "@/lib/search-filter";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useFilterStore } from "@/store/filters";

interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Show the global filter controls (Filters button, search, date range). */
  showGlobalFilters?: boolean;
  /** Hide the redundant District field inside the filter drawer. */
  hideDistrictFilter?: boolean;
  /** Match count shown in the search status bar after a search completes. */
  searchResultCount?: number;
}

export function Header({
  title,
  subtitle,
  showGlobalFilters = true,
  hideDistrictFilter = false,
  searchResultCount,
}: HeaderProps) {
  const { searchInput, setSearch, dateFrom, dateTo, setDateRange } =
    useFilterStore();
  const debouncedSearch = useDebouncedValue(searchInput, DEBOUNCE.SEARCH_MS);
  const [mobileNav, setMobileNav] = React.useState(false);

  React.useEffect(() => {
    setSearch(normalizeSearchFilter(debouncedSearch) ?? "");
  }, [debouncedSearch, setSearch]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Sheet open={mobileNav} onOpenChange={setMobileNav}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="px-1">
                <Emblem />
              </div>
            </SheetHeader>
            <div className="py-4">
              <SidebarNav onNavigate={() => setMobileNav(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight text-foreground lg:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {showGlobalFilters && (
          <div className="hidden items-center gap-2 md:flex">
            <GlobalSearchField className="w-56 lg:w-64" />
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onChange={setDateRange}
            />
          </div>
        )}

        {showGlobalFilters && (
          <GlobalFilters hideDistrict={hideDistrictFilter} />
        )}
      </div>

      {showGlobalFilters && (
        <div className="px-4 pb-3 md:hidden">
          <GlobalSearchField className="w-full" />
        </div>
      )}

      {showGlobalFilters && (
        <GlobalSearchStatusBar resultCount={searchResultCount} />
      )}
    </header>
  );
}
