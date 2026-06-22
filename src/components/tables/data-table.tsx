"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Download,
  Eye,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { matchesSemanticSearch } from "@/lib/name-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/common/states";
import { DEBOUNCE, THROTTLE } from "@/lib/debounce-throttle";
import {
  useDebouncedValue,
  useThrottledCallback,
} from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

export interface DataTableCellContext {
  /** Index within the current page (0-based). */
  rowIndex: number;
  /** Serial number across paginated rows (1-based). */
  globalIndex: number;
}

/** Sr. No. column using the table's own 1-based row index (not source data). */
export function serialNumberColumn<T>(
  className = "w-16 tabular-nums",
): DataTableColumn<T> {
  return {
    id: "srNo",
    header: "Sr. No.",
    cell: (_row, ctx) => (
      <span className="tabular-nums text-muted-foreground">
        {ctx?.globalIndex ?? "—"}
      </span>
    ),
    className,
  };
}

export interface DataTableColumn<T> {
  id: string;
  header: string;
  /** Rendered cell content. */
  cell: (row: T, ctx?: DataTableCellContext) => React.ReactNode;
  /** Plain value used for sorting / searching. */
  value?: (row: T) => string | number | null | undefined;
  /** Optional export-only value (e.g. formatted dates); falls back to `value`. */
  exportValue?: (row: T) => string | number | null | undefined;
  enableSorting?: boolean;
  defaultHidden?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Optional expanded-row renderer. */
  renderExpanded?: (row: T) => React.ReactNode;
  /** Opens a detail modal for the row (adds an Actions column). */
  renderDetail?: (ctx: {
    row: T;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => React.ReactNode;
  /** Show the View action column (default: true when renderDetail is set). */
  showActionColumn?: boolean;
  detailTitle?: (row: T) => string;
  exportFileName?: string;
  pageSize?: number;
  /** When set, pagination is driven by the API instead of client-side slicing. */
  serverPagination?: {
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  /** Disables client-side search/sort; use with `serverPagination`. */
  serverMode?: boolean;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  sortValue?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Caps table body height (px) and adds an inner scroll; omit for page-level scroll only. */
  maxHeight?: number;
  /** Toolbar slot rendered on the left (e.g. extra filters). */
  toolbarStart?: React.ReactNode;
  /** Shows loading state in the table body while keeping toolbar and headers visible. */
  isLoading?: boolean;
  /** Custom message when there are no rows (server mode). */
  emptyDescription?: string;
  /** True while a debounced server search is waiting to refetch. */
  isSearchPending?: boolean;
}

type SortState = { id: string; dir: "asc" | "desc" } | null;

const VIEW_COL_WIDTH = 72;

export function DataTable<T>({
  data,
  columns,
  getRowId,
  renderExpanded,
  renderDetail,
  showActionColumn = true,
  detailTitle,
  exportFileName = "export",
  pageSize: initialPageSize = 50,
  serverPagination,
  serverMode = false,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  maxHeight,
  toolbarStart,
  isLoading = false,
  emptyDescription,
  isSearchPending = false,
}: DataTableProps<T>) {
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, DEBOUNCE.SEARCH_MS);
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [hidden, setHidden] = React.useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id)),
  );
  const [detailRow, setDetailRow] = React.useState<T | null>(null);

  const visibleColumns = columns.filter((c) => !hidden.has(c.id));
  const showAction = !!(renderDetail && showActionColumn);
  const tableColSpan =
    visibleColumns.length + (renderExpanded ? 1 : 0) + (showAction ? 1 : 0);

  const activeSearch = serverMode ? (searchValue ?? "") : searchInput;
  const filterSearch = serverMode ? (searchValue ?? "") : debouncedSearch;
  const activeSort = serverMode ? (sortValue ?? null) : sort;

  const throttledClientPageChange = useThrottledCallback(
    (nextPage: number) => setPage(nextPage),
    THROTTLE.ACTION_MS,
  );

  const valueOf = React.useCallback(
    (row: T, col: DataTableColumn<T>) => {
      if (col.value) return col.value(row);
      return null;
    },
    [],
  );

  const filtered = React.useMemo(() => {
    if (serverMode) return data;
    const q = filterSearch.trim();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((c) => {
        const v = c.value?.(row);
        return v != null && matchesSemanticSearch(q, String(v));
      }),
    );
  }, [data, columns, filterSearch, serverMode]);

  const sorted = React.useMemo(() => {
    if (serverMode) return filtered;
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.value) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.value!(a);
      const bv = col.value!(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort, columns, serverMode]);

  const pageCount = serverPagination
    ? Math.max(1, Math.ceil(serverPagination.total / serverPagination.pageSize))
    : Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = serverPagination
    ? Math.min(serverPagination.page - 1, pageCount - 1)
    : Math.min(page, pageCount - 1);
  const pageRows = React.useMemo(
    () =>
      serverPagination
        ? sorted
        : sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize, serverPagination],
  );
  const totalRecords = serverPagination?.total ?? sorted.length;

  React.useEffect(() => {
    if (!serverPagination && !serverMode) setPage(0);
  }, [filterSearch, sort, pageSize, serverPagination, serverMode]);

  const handleSearchChange = (value: string) => {
    if (serverMode) onSearchChange?.(value);
    else setSearchInput(value);
  };

  const toggleSort = (id: string) => {
    const next: SortState = !activeSort || activeSort.id !== id
      ? { id, dir: "asc" }
      : activeSort.dir === "asc"
        ? { id, dir: "desc" }
        : null;
    if (serverMode) {
      onSortChange?.(next);
      serverPagination?.onPageChange(1);
      return;
    }
    setSort(next);
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const useVirtualization = maxHeight != null;
  const rowVirtualizer = useVirtualizer({
    count: pageRows.length,
    enabled: useVirtualization,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildExportRows = React.useCallback(() => {
    const cols = visibleColumns;
    return sorted.map((row, rowIdx) => {
      const obj: Record<string, string | number> = {};
      for (const c of cols) {
        if (c.id === "srNo") {
          obj[c.header] = rowIdx + 1;
          continue;
        }
        const v = c.exportValue?.(row) ?? c.value?.(row);
        obj[c.header] = v == null ? "" : v;
      }
      return obj;
    });
  }, [sorted, visibleColumns]);

  const exportCsv = () => {
    const rows = buildExportRows();
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const escape = (val: string | number) => {
      const s = String(val).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    triggerDownload(blob, `${exportFileName}.csv`);
  };

  const exportExcel = async () => {
    const rows = buildExportRows();
    if (!rows.length) return;
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {renderDetail && detailRow
        ? renderDetail({
            row: detailRow,
            open: true,
            onOpenChange: (open) => {
              if (!open) setDetailRow(null);
            },
          })
        : null}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={activeSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search table…"
            className="pl-8"
          />
        </div>
        {toolbarStart}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={!hidden.has(c.id)}
                onCheckedChange={(checked) =>
                  setHidden((prev) => {
                    const next = new Set(prev);
                    if (checked) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })
                }
                onSelect={(e) => e.preventDefault()}
              >
                {c.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">CSV</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={exportExcel}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Excel</span>
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        {(isLoading || isSearchPending) && pageRows.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-20 bg-background/40" />
        )}
        <div
          ref={scrollRef}
          className={cn(
            "overflow-x-auto",
            maxHeight != null && "overflow-y-auto overscroll-contain",
          )}
          style={maxHeight != null ? { maxHeight } : undefined}
        >
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10 bg-secondary shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                {renderExpanded && (
                  <th className="w-10 border-b border-border bg-secondary" />
                )}
                {visibleColumns.map((c) => {
                  const active = activeSort?.id === c.id;
                  return (
                    <th
                      key={c.id}
                      className={cn(
                        "h-11 border-b border-border bg-secondary px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        c.headerClassName,
                      )}
                    >
                        {c.enableSorting ? (
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort(c.id)}
                          >
                            {c.header}
                            {active ? (
                              activeSort!.dir === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                })}
                {showAction && (
                  <th
                    className="h-11 border-b border-l border-border bg-secondary px-2 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    style={{ width: VIEW_COL_WIDTH, minWidth: VIEW_COL_WIDTH }}
                  >
                    View
                  </th>
                )}
              </tr>
            </thead>
            <tbody className={cn((isLoading || isSearchPending) && pageRows.length > 0 && "opacity-60")}>
                {isLoading && pageRows.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`loading-${i}`} className="border-b border-border">
                      {renderExpanded && (
                        <td className="px-2 py-3">
                          <div className="mx-auto h-4 w-4 animate-pulse rounded bg-muted" />
                        </td>
                      )}
                      {visibleColumns.map((c) => (
                        <td key={c.id} className="px-3 py-3">
                          <div className="h-4 animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                      {showAction && (
                        <td className="px-2 py-3">
                          <div className="mx-auto h-8 w-8 animate-pulse rounded bg-muted" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan}>
                      <EmptyState
                        title="No records"
                        description={
                          emptyDescription ??
                          "No rows match the current search and filters."
                        }
                        className="border-0 bg-transparent"
                      />
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const virtualItems = useVirtualization
                      ? rowVirtualizer.getVirtualItems()
                      : null;
                    const rowIndices = virtualItems
                      ? virtualItems.map((vi) => vi.index)
                      : pageRows.map((_, i) => i);
                    const paddingTop =
                      virtualItems && virtualItems.length
                        ? virtualItems[0].start
                        : 0;
                    const paddingBottom =
                      virtualItems && virtualItems.length
                        ? rowVirtualizer.getTotalSize() -
                          virtualItems[virtualItems.length - 1].end
                        : 0;

                    return (
                      <>
                        {paddingTop > 0 && (
                          <tr aria-hidden>
                            <td
                              style={{ height: paddingTop }}
                              colSpan={tableColSpan}
                            />
                          </tr>
                        )}
                        {rowIndices.map((rowIndex) => {
                          const row = pageRows[rowIndex];
                          const id = getRowId(row);
                          const isExpanded = expanded.has(id);
                          return (
                            <React.Fragment key={id}>
                              <tr
                                data-index={rowIndex}
                                ref={
                                  useVirtualization
                                    ? rowVirtualizer.measureElement
                                    : undefined
                                }
                                className="border-b border-border bg-card transition-colors hover:bg-secondary/50"
                              >
                                {renderExpanded && (
                                  <td className="px-2 text-center align-middle">
                                    <button
                                      onClick={() => toggleExpand(id)}
                                      className="rounded p-1 text-muted-foreground hover:bg-secondary"
                                      aria-label="Expand row"
                                    >
                                      <ChevronDown
                                        className={cn(
                                          "h-4 w-4 transition-transform",
                                          isExpanded && "rotate-180",
                                        )}
                                      />
                                    </button>
                                  </td>
                                )}
                                {visibleColumns.map((c) => (
                                  <td
                                    key={c.id}
                                    className={cn(
                                      "overflow-hidden px-3 py-2.5 align-middle",
                                      c.className,
                                    )}
                                  >
                                    {c.cell(row, {
                                      rowIndex,
                                      globalIndex:
                                        safePage * pageSize + rowIndex + 1,
                                    })}
                                  </td>
                                ))}
                                {showAction && (
                                  <ViewActionCell
                                    row={row}
                                    detailTitle={detailTitle}
                                    onView={setDetailRow}
                                  />
                                )}
                              </tr>
                              {renderExpanded && isExpanded && (
                                <tr className="bg-secondary/30">
                                  <td
                                    colSpan={tableColSpan}
                                    className="px-4 py-3"
                                  >
                                    {renderExpanded(row)}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {paddingBottom > 0 && (
                          <tr aria-hidden>
                            <td
                              style={{ height: paddingBottom }}
                              colSpan={tableColSpan}
                            />
                          </tr>
                        )}
                      </>
                    );
                  })()
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div>
          {totalRecords.toLocaleString("en-IN")} records ·{" "}
          {totalRecords === 0
            ? 0
            : serverPagination
              ? (serverPagination.page - 1) * serverPagination.pageSize + 1
              : safePage * pageSize + 1}
          –
          {totalRecords === 0
            ? 0
            : serverPagination
              ? Math.min(
                  serverPagination.page * serverPagination.pageSize,
                  totalRecords,
                )
              : Math.min((safePage + 1) * pageSize, sorted.length)}{" "}
          shown
        </div>
        <div className="flex items-center gap-3">
          <select
            value={serverPagination?.pageSize ?? pageSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (serverPagination) serverPagination.onPageSizeChange(next);
              else {
                setPageSize(next);
                throttledClientPageChange(0);
              }
            }}
            className="h-8 rounded-md border border-input bg-card px-2 text-sm"
          >
            {[25, 50, 100, 200, 500].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage === 0}
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(serverPagination.page - 1);
                } else {
                  throttledClientPageChange(Math.max(0, safePage - 1));
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 tabular-nums">
              {safePage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= pageCount - 1}
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(serverPagination.page + 1);
                } else {
                  throttledClientPageChange(Math.min(pageCount - 1, safePage + 1));
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewActionCell<T>({
  row,
  detailTitle,
  onView,
}: {
  row: T;
  detailTitle?: (row: T) => string;
  onView: (row: T) => void;
}) {
  return (
    <td
      className="border-l border-border px-2 text-center align-middle"
      style={{ width: VIEW_COL_WIDTH, minWidth: VIEW_COL_WIDTH }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
        onClick={() => onView(row)}
        title={detailTitle ? `View ${detailTitle(row)}` : "View details"}
        aria-label={detailTitle ? `View ${detailTitle(row)}` : "View details"}
      >
        <Eye className="h-4 w-4" />
      </Button>
    </td>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
