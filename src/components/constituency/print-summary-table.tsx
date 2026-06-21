"use client";

import * as React from "react";
import {
  DataTable,
  serialNumberColumn,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { SentimentBadge } from "@/components/common/sentiment-badge";
import { formatDisplayDate } from "@/lib/dates";
import { PrintRecordDetailModal } from "@/components/tables/print-record-detail";
import type { PrintRecord } from "@/lib/types";

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="whitespace-nowrap text-muted-foreground">
      {formatDisplayDate(value)}
    </span>
  );
}

const columns: DataTableColumn<PrintRecord>[] = [
  serialNumberColumn<PrintRecord>(),
  {
    id: "headline",
    header: "Headline",
    enableSorting: true,
    value: (r) => r.headline,
    cell: (r) => (
      <span className="line-clamp-2 max-w-[360px] font-medium text-foreground">
        {r.headline}
      </span>
    ),
  },
  {
    id: "publication",
    header: "Publication",
    enableSorting: true,
    value: (r) => r.publication,
    cell: (r) => r.publication,
  },
  {
    id: "edition",
    header: "Edition",
    enableSorting: true,
    value: (r) => r.edition,
    cell: (r) => r.edition,
  },
  {
    id: "date",
    header: "Date",
    enableSorting: true,
    value: (r) => r.date ?? "",
    exportValue: (r) => (r.date ? formatDisplayDate(r.date) : ""),
    cell: (r) => <DateCell value={r.date} />,
  },
  {
    id: "pageNo",
    header: "Page No.",
    enableSorting: true,
    value: (r) => r.pageNo ?? "",
    cell: (r) => r.pageNo ?? "—",
  },
  {
    id: "sentiment",
    header: "Sentiment",
    enableSorting: true,
    value: (r) => r.sentiment,
    cell: (r) => <SentimentBadge sentiment={r.sentiment} />,
  },
  {
    id: "language",
    header: "Language",
    enableSorting: true,
    value: (r) => r.language,
    cell: (r) => r.language,
  },
  {
    id: "author",
    header: "Author",
    enableSorting: true,
    value: (r) => r.author,
    cell: (r) => r.author || "—",
    defaultHidden: true,
  },
  {
    id: "ccm",
    header: "CCM",
    enableSorting: true,
    value: (r) => r.ccm ?? "",
    cell: (r) => r.ccm ?? "—",
    defaultHidden: true,
  },
];

export function PrintSummaryTable({
  records,
  exportName,
  maxHeight,
  serverPagination,
  serverMode = !!serverPagination,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  isLoading = false,
  emptyDescription,
  isSearchPending = false,
}: {
  records: PrintRecord[];
  exportName?: string;
  maxHeight?: number;
  serverPagination?: React.ComponentProps<typeof DataTable<PrintRecord>>["serverPagination"];
  serverMode?: boolean;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  sortValue?: { id: string; dir: "asc" | "desc" } | null;
  onSortChange?: (sort: { id: string; dir: "asc" | "desc" } | null) => void;
  isLoading?: boolean;
  emptyDescription?: string;
  isSearchPending?: boolean;
}) {
  return (
    <DataTable
      data={records}
      columns={columns}
      getRowId={(r) => r.id}
      exportFileName={exportName ?? "constituency-print"}
      {...(maxHeight != null ? { maxHeight } : {})}
      {...(serverPagination ? { serverPagination } : {})}
      serverMode={serverMode}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      sortValue={sortValue}
      onSortChange={onSortChange}
      isLoading={isLoading}
      emptyDescription={emptyDescription}
      isSearchPending={isSearchPending}
      detailTitle={(r) => r.headline}
      renderDetail={({ row, open, onOpenChange }) => (
        <PrintRecordDetailModal
          record={row}
          open={open}
          onOpenChange={onOpenChange}
        />
      )}
    />
  );
}
