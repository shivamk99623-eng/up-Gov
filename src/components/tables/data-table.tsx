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
  FileSpreadsheet,
  Search,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  /** Rendered cell content. */
  cell: (row: T) => React.ReactNode;
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
  exportFileName?: string;
  pageSize?: number;
  /** Max height of the scrollable table body (px). */
  maxHeight?: number;
  /** Toolbar slot rendered on the left (e.g. extra filters). */
  toolbarStart?: React.ReactNode;
}

type SortState = { id: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  data,
  columns,
  getRowId,
  renderExpanded,
  exportFileName = "export",
  pageSize: initialPageSize = 50,
  maxHeight = 800,
  toolbarStart,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [hidden, setHidden] = React.useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id)),
  );

  const visibleColumns = columns.filter((c) => !hidden.has(c.id));

  const valueOf = React.useCallback(
    (row: T, col: DataTableColumn<T>) => {
      if (col.value) return col.value(row);
      return null;
    },
    [],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((c) => {
        const v = c.value?.(row);
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [data, columns, search]);

  const sorted = React.useMemo(() => {
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
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = React.useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize],
  );

  React.useEffect(() => {
    setPage(0);
  }, [search, sort, pageSize]);

  // Virtualize the rows of the current page.
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: pageRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    overscan: 20,
  });

  const toggleSort = (id: string) => {
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: "asc" };
      if (prev.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  };

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
    return sorted.map((row) => {
      const obj: Record<string, string | number> = {};
      for (const c of cols) {
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div
          ref={scrollRef}
          className="overflow-auto overscroll-contain [contain:layout]"
          style={{ maxHeight }}
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
              <tr className="border-b border-border">
                {renderExpanded && <th className="w-10" />}
                {visibleColumns.map((c) => {
                  const active = sort?.id === c.id;
                  return (
                    <th
                      key={c.id}
                      className={cn(
                        "h-11 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground",
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
                            sort!.dir === "asc" ? (
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
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (renderExpanded ? 1 : 0)}>
                    <EmptyState
                      title="No records"
                      description="No rows match the current search and filters."
                      className="border-0 bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                (() => {
                  const items = rowVirtualizer.getVirtualItems();
                  const paddingTop = items.length ? items[0].start : 0;
                  const paddingBottom = items.length
                    ? rowVirtualizer.getTotalSize() -
                      items[items.length - 1].end
                    : 0;
                  return (
                    <>
                      {paddingTop > 0 && (
                        <tr>
                          <td
                            style={{ height: paddingTop }}
                            colSpan={
                              visibleColumns.length + (renderExpanded ? 1 : 0)
                            }
                          />
                        </tr>
                      )}
                      {items.map((vi) => {
                        const row = pageRows[vi.index];
                        const id = getRowId(row);
                        const isExpanded = expanded.has(id);
                        return (
                          <React.Fragment key={id}>
                            <tr className="border-b border-border transition-colors hover:bg-secondary/50">
                              {renderExpanded && (
                                <td className="px-2 text-center">
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
                                  className={cn("px-3 py-2.5 align-middle", c.className)}
                                >
                                  {c.cell(row)}
                                </td>
                              ))}
                            </tr>
                            {renderExpanded && isExpanded && (
                              <tr className="bg-secondary/30">
                                <td
                                  colSpan={visibleColumns.length + 1}
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
                        <tr>
                          <td
                            style={{ height: paddingBottom }}
                            colSpan={
                              visibleColumns.length + (renderExpanded ? 1 : 0)
                            }
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
          {sorted.length.toLocaleString("en-IN")} records ·{" "}
          {sorted.length === 0
            ? 0
            : safePage * pageSize + 1}
          –{Math.min((safePage + 1) * pageSize, sorted.length)} shown
        </div>
        <div className="flex items-center gap-3">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
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
              onClick={() => setPage((p) => Math.max(0, p - 1))}
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
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
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
