"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { DataTable, serialNumberColumn, type DataTableColumn } from "./data-table";
import { formatDisplayDate } from "@/lib/dates";
import { SentimentBadge } from "@/components/common/sentiment-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaRecordDetailModal } from "@/components/tables/media-record-detail";
import type { MediaRecord, MediaType, Sentiment } from "@/lib/types";

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="whitespace-nowrap text-muted-foreground">
      {formatDisplayDate(value)}
    </span>
  );
}

function LinkCell({ url }: { url: string | null }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      Open <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function Headline({ text }: { text: string }) {
  return (
    <span className="line-clamp-2 max-w-[320px] font-medium text-foreground">
      {text}
    </span>
  );
}

const headlineCol = (): DataTableColumn<MediaRecord> => ({
  id: "headline",
  header: "Headline",
  enableSorting: true,
  value: (r) => r.headline,
  cell: (r) => <Headline text={r.headline} />,
});

const dateCol = (): DataTableColumn<MediaRecord> => ({
  id: "date",
  header: "Date",
  enableSorting: true,
  value: (r) => r.timestamp ?? 0,
  exportValue: (r) => (r.date ? formatDisplayDate(r.date) : ""),
  cell: (r) => <DateCell value={r.date} />,
});

const sentimentCol = (): DataTableColumn<MediaRecord> => ({
  id: "sentiment",
  header: "Sentiment",
  enableSorting: true,
  value: (r) => r.sentiment,
  cell: (r) => <SentimentBadge sentiment={r.sentiment} />,
});

const linkCol = (): DataTableColumn<MediaRecord> => ({
  id: "link",
  header: "Link",
  value: (r) => r.link ?? "",
  cell: (r) => <LinkCell url={r.link} />,
});

const authorsCol = (): DataTableColumn<MediaRecord> => ({
  id: "authors",
  header: "Authors",
  enableSorting: true,
  value: (r) => r.authors,
  cell: (r) => <span className="font-medium">{r.authors || "—"}</span>,
});

const languageCol = (): DataTableColumn<MediaRecord> => ({
  id: "language",
  header: "Language",
  enableSorting: true,
  value: (r) => r.language,
  cell: (r) => <span className="uppercase">{r.language}</span>,
});

function youtubeColumns(): DataTableColumn<MediaRecord>[] {
  return [
    serialNumberColumn<MediaRecord>(),
    headlineCol(),
    {
      id: "channel",
      header: "Channel",
      enableSorting: true,
      value: (r) => (r.mediaType === "YouTube" ? r.channel : null) ?? "",
      cell: (r) => (
        <span>{r.mediaType === "YouTube" ? r.channel || "—" : "—"}</span>
      ),
    },
    authorsCol(),
    dateCol(),
    {
      id: "duration",
      header: "Duration",
      enableSorting: true,
      value: (r) => (r.mediaType === "YouTube" ? r.duration : null) ?? "",
      cell: (r) => (
        <span>{r.mediaType === "YouTube" ? r.duration || "—" : "—"}</span>
      ),
    },
    sentimentCol(),
    languageCol(),
    linkCol(),
  ];
}

function onlineColumns(): DataTableColumn<MediaRecord>[] {
  return [
    serialNumberColumn<MediaRecord>(),
    headlineCol(),
    {
      id: "website",
      header: "Website",
      enableSorting: true,
      value: (r) => (r.mediaType === "Online" ? r.website : null) ?? "",
      cell: (r) => (
        <span className="font-medium">
          {r.mediaType === "Online" ? r.website || "—" : "—"}
        </span>
      ),
    },
    authorsCol(),
    dateCol(),
    languageCol(),
    sentimentCol(),
    {
      id: "content",
      header: "Content Preview",
      enableSorting: true,
      value: (r) => r.content,
      cell: (r) => (
        <span className="line-clamp-2 max-w-[360px] text-muted-foreground">
          {r.content || "—"}
        </span>
      ),
    },
    linkCol(),
  ];
}

function twitterColumns(): DataTableColumn<MediaRecord>[] {
  return [
    serialNumberColumn<MediaRecord>(),
    headlineCol(),
    {
      id: "handles",
      header: "Handle",
      enableSorting: true,
      value: (r) => (r.mediaType === "X" ? r.handles : null) ?? "",
      cell: (r) => (
        <span className="font-medium">
          {r.mediaType === "X" ? r.handles || "—" : "—"}
        </span>
      ),
    },
    authorsCol(),
    {
      id: "content",
      header: "Content",
      enableSorting: true,
      value: (r) => r.content,
      cell: (r) => (
        <span className="line-clamp-2 max-w-[340px] text-muted-foreground">
          {r.content || "—"}
        </span>
      ),
    },
    dateCol(),
    sentimentCol(),
    languageCol(),
    linkCol(),
  ];
}

const COLUMN_BUILDERS: Record<MediaType, () => DataTableColumn<MediaRecord>[]> = {
  YouTube: youtubeColumns,
  Online: onlineColumns,
  X: twitterColumns,
};

interface MediaTabTableProps {
  records: MediaRecord[];
  mediaType: MediaType;
  district?: string;
  extraColumns?: DataTableColumn<MediaRecord>[];
  exportName?: string;
  maxHeight?: number;
  serverPagination?: React.ComponentProps<typeof DataTable<MediaRecord>>["serverPagination"];
  serverMode?: boolean;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  sortValue?: { id: string; dir: "asc" | "desc" } | null;
  onSortChange?: (sort: { id: string; dir: "asc" | "desc" } | null) => void;
  sentiment?: Sentiment | "All";
  onSentimentChange?: (sentiment: Sentiment | "All") => void;
  language?: string | null;
  onLanguageChange?: (language: string | null) => void;
  languageOptions?: string[];
  isLoading?: boolean;
  emptyDescription?: string;
  isSearchPending?: boolean;
}

export function MediaTabTable({
  records,
  mediaType,
  district,
  extraColumns,
  exportName,
  maxHeight,
  serverPagination,
  serverMode = !!serverPagination,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  sentiment = "All",
  onSentimentChange,
  language = null,
  onLanguageChange,
  languageOptions = [],
  isLoading = false,
  emptyDescription,
  isSearchPending = false,
}: MediaTabTableProps) {
  const columns = React.useMemo(
    () => [...(extraColumns ?? []), ...COLUMN_BUILDERS[mediaType]()],
    [mediaType, extraColumns],
  );

  return (
    <DataTable
      data={records}
      columns={columns}
      getRowId={(r) => r.id}
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
      exportFileName={`${exportName ?? district ?? "media"}-${mediaType}`
        .toLowerCase()
        .replace(/\s+/g, "-")}
      detailTitle={(r) => r.headline}
      renderDetail={({ row, open, onOpenChange }) => (
        <MediaRecordDetailModal
          record={row}
          open={open}
          onOpenChange={onOpenChange}
        />
      )}
      toolbarStart={
        onSentimentChange || onLanguageChange ? (
          <>
            {onSentimentChange && (
              <Select
                value={sentiment}
                onValueChange={(v) =>
                  onSentimentChange(v as Sentiment | "All")
                }
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All sentiment</SelectItem>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Negative">Negative</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onLanguageChange && (
              <Select
                value={language ?? "All"}
                onValueChange={(v) =>
                  onLanguageChange(v === "All" ? null : v)
                }
              >
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All languages</SelectItem>
                  {languageOptions.map((l) => (
                    <SelectItem key={l} value={l} className="uppercase">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        ) : undefined
      }
    />
  );
}
