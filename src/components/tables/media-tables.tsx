"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { DataTable, serialNumberColumn, type DataTableColumn } from "./data-table";
import { formatDisplayTimestamp } from "@/lib/dates";
import {
  Heart,
  Repeat2,
  MessageCircle,
  Quote,
  Eye,
  Bookmark,
} from "lucide-react";
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


const formatCount = (value: string | null) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="whitespace-nowrap text-muted-foreground">
      {value}
    </span>
  );
}

function EngagementCell({ value }: { value: string | null }) {
  if (!value) {
    return <span>—</span>;
  }
  console.log(value);
  const data = Object.fromEntries(
    value.split(",").map((item) => {
      const [key, value] = item.split(":");
      return [key, value];
    })
  );
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <div className="flex items-center gap-1">
        <Heart className="h-4 w-4 text-red-500" />
        {formatCount(data.likes)}
      </div>

      {/* <div className="flex items-center gap-1">
        <Repeat2 className="h-4 w-4 text-green-500" />
        {data.retweets || 0}
      </div> */}

     {data.comments && <div className="flex items-center gap-1">
        <MessageCircle className="h-4 w-4 text-blue-500" />
        {formatCount(data.comments)}
      </div>}

      {/* <div className="flex items-center gap-1">
        <Quote className="h-4 w-4 text-purple-500" />
        {data.quotes || 0}
      </div> */}

     {data.views && <div className="flex items-center gap-1">
        <Eye className="h-4 w-4 text-gray-500" />
        {formatCount(data.views)}
      </div>}

      {/* <div className="flex items-center gap-1">
        <Bookmark className="h-4 w-4 text-yellow-500" />
        {data.bookmarks || 0}
      </div> */}
    </div>
  )
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
  exportValue: (r) => (r.timestamp ? formatDisplayTimestamp(r.timestamp) : ""),
  cell: (r) => <DateCell value={formatDisplayTimestamp(r.timestamp)} />,
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
    {
      id: "engagements",
      header: "Engagements",
      headerClassName: "w-[180px]",
      enableSorting: true,
      value: (r) => (r.mediaType === "X" ? r.engagements : null) ?? "",
      cell: (r) => <EngagementCell value={r.mediaType === "YouTube" ? `likes:${r.likeCount},comments:${r.commentCount}`: null} />,
    },
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
    dateCol(),
    languageCol(),
    sentimentCol(),
    // {
    //   id: "content",
    //   header: "Content Preview",
    //   enableSorting: true,
    //   value: (r) => r.content,
    //   cell: (r) => (
    //     <span className="line-clamp-2 max-w-[360px] text-muted-foreground">
    //       {r.content || "—"}
    //     </span>
    //   ),
    // },
    authorsCol(),
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
    // {
    //   id: "content",
    //   header: "Content",
    //   enableSorting: true,
    //   value: (r) => r.content,
    //   cell: (r) => (
    //     <span className="line-clamp-2 max-w-[340px] text-muted-foreground">
    //       {r.content || "—"}
    //     </span>
    //   ),
    // },
    dateCol(),
    sentimentCol(),
    languageCol(),
    //  "engagements": "likes:5,retweets:1,replies:0,quotes:0,views:1780,bookmarks:0",
    {
      id: "engagements",
      header: "Engagements",
      headerClassName: "w-[180px]",
      enableSorting: true,
      value: (r) => (r.mediaType === "X" ? r.engagements : null) ?? "",
      cell: (r) => <EngagementCell value={r.mediaType === "X" ? r.engagements : null} />,
    },
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
