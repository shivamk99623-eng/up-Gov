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
import type { MediaRecord, MediaType } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="whitespace-nowrap text-muted-foreground">
      {formatDisplayDate(value)}
    </span>
  );
}

function LinkCell({ url }: { url: string }) {
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
  value: (r) => r.url,
  cell: (r) => <LinkCell url={r.url} />,
});

const numCol = (
  id: string,
  header: string,
  pick: (r: MediaRecord) => number,
): DataTableColumn<MediaRecord> => ({
  id,
  header,
  enableSorting: true,
  value: pick,
  className: "tabular-nums text-right",
  headerClassName: "text-right",
  cell: (r) => <span className="tabular-nums">{formatNumber(pick(r))}</span>,
});

function youtubeColumns(): DataTableColumn<MediaRecord>[] {
  return [
    serialNumberColumn<MediaRecord>(),
    headlineCol(),
    {
      id: "channel",
      header: "Channel",
      value: (r) => r.rawChannel,
      cell: (r) => <span>{r.rawChannel || "—"}</span>,
    },
    {
      id: "profile",
      header: "Profile",
      enableSorting: true,
      value: (r) => r.profile ?? "",
      cell: (r) => <span className="font-medium">{r.profile ?? "—"}</span>,
    },
    dateCol(),
    numCol("views", "Views", (r) => r.views),
    numCol("likes", "Likes", (r) => r.likes),
    numCol("comments", "Comments", (r) => r.comments),
    numCol("shares", "Shares", (r) => r.shares),
    sentimentCol(),
    {
      id: "language",
      header: "Language",
      enableSorting: true,
      value: (r) => r.language,
      cell: (r) => <span className="uppercase">{r.language}</span>,
    },
    linkCol(),
  ];
}

function onlineColumns(): DataTableColumn<MediaRecord>[] {
  return [
    serialNumberColumn<MediaRecord>(),
    headlineCol(),
    {
      id: "publisher",
      header: "Publisher",
      enableSorting: true,
      value: (r) => r.profile ?? "",
      cell: (r) => <span className="font-medium">{r.profile ?? "—"}</span>,
    },
    {
      id: "location",
      header: "Location",
      value: (r) => r.location ?? "",
      cell: (r) => <span>{r.location ?? "—"}</span>,
    },
    dateCol(),
    {
      id: "language",
      header: "Language",
      enableSorting: true,
      value: (r) => r.language,
      cell: (r) => <span className="uppercase">{r.language}</span>,
    },
    sentimentCol(),
    {
      id: "content",
      header: "Content Preview",
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
      id: "profile",
      header: "Profile",
      enableSorting: true,
      value: (r) => r.profile ?? "",
      cell: (r) => <span className="font-medium">{r.profile ?? "—"}</span>,
    },
    {
      id: "content",
      header: "Content",
      value: (r) => r.content,
      cell: (r) => (
        <span className="line-clamp-2 max-w-[340px] text-muted-foreground">
          {r.content || "—"}
        </span>
      ),
    },
    dateCol(),
    numCol("engagement", "Engagement", (r) => r.totalEngagement),
    numCol("likes", "Likes", (r) => r.likes),
    numCol("comments", "Comments", (r) => r.comments),
    numCol("shares", "Shares", (r) => r.shares),
    sentimentCol(),
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
  /** Extra columns prepended to the table (e.g. linked-person columns). */
  extraColumns?: DataTableColumn<MediaRecord>[];
  exportName?: string;
  maxHeight?: number;
}

export function MediaTabTable({
  records,
  mediaType,
  district,
  extraColumns,
  exportName,
  maxHeight,
}: MediaTabTableProps) {
  const [sentiment, setSentiment] = React.useState<string>("All");
  const [language, setLanguage] = React.useState<string>("All");

  const languages = React.useMemo(
    () => Array.from(new Set(records.map((r) => r.language))).sort(),
    [records],
  );

  const filtered = React.useMemo(
    () =>
      records.filter(
        (r) =>
          (sentiment === "All" || r.sentiment === sentiment) &&
          (language === "All" || r.language === language),
      ),
    [records, sentiment, language],
  );

  const columns = React.useMemo(
    () => [...(extraColumns ?? []), ...COLUMN_BUILDERS[mediaType]()],
    [mediaType, extraColumns],
  );

  return (
    <DataTable
      data={filtered}
      columns={columns}
      getRowId={(r) => r.id}
      {...(maxHeight != null ? { maxHeight } : {})}
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
        <>
          <Select value={sentiment} onValueChange={setSentiment}>
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
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All languages</SelectItem>
              {languages.map((l) => (
                <SelectItem key={l} value={l} className="uppercase">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
