"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DetailBody,
  DetailField,
  DetailGrid,
  DetailSection,
  RecordDetailModal,
} from "@/components/common/record-detail-modal";
import { MediaBadge, SentimentBadge } from "@/components/common/sentiment-badge";
import { formatDisplayDate, formatDisplayTimestamp } from "@/lib/dates";
import type { MediaRecord } from "@/lib/types";

function joinList(values: string[]): string {
  return values.length ? values.join(", ") : "—";
}

export function MediaRecordDetailModal({
  record,
  open,
  onOpenChange,
}: {
  record: MediaRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!record) return null;

  return (
    <RecordDetailModal
      open={open}
      onOpenChange={onOpenChange}
      title={record.headline}
      description={record.summary || record.content || undefined}
      badges={
        <>
          <MediaBadge mediaType={record.mediaType} />
          <SentimentBadge sentiment={record.sentiment} />
        </>
      }
      footer={
        record.link ? (
          <Button asChild>
            <a href={record.link} target="_blank" rel="noopener noreferrer">
              Open source <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {(record.content || record.summary) && (
          <DetailSection title="Full content">
            <DetailBody>{record.content || record.summary}</DetailBody>
          </DetailSection>
        )}

        <DetailSection title="Article details">
          <DetailGrid>
            <DetailField label="Summary" value={record.summary} fullWidth />
            {record.mediaType === "Online" && <DetailField label="Authors" value={record.authors || "—"} />}
            <DetailField
              label="Date & Time"
              value={record.date ? formatDisplayTimestamp(record.timestamp) : "—"}
            />
            <DetailField label="Language" value={record.language} />
            {record.mediaType === "YouTube" && (
              <>
                <DetailField label="Channel" value={record.channel || "—"} />
                <DetailField label="Duration" value={record.duration || "—"} />
              </>
            )}
            {record.mediaType === "X" && (
              <DetailField label="Handle" value={record.handles || "—"} />
            )}
            {record.mediaType === "Online" && (
              <DetailField label="Website" value={record.website || "—"} />
            )}
            <DetailField label="District" value={joinList(record.districts)} />
            <DetailField
              label="Constituency"
              value={joinList(record.constituencies)}
            />
            <DetailField label="MLA" value={joinList(record.mla)} />
            <DetailField label="Lok Sabha MP" value={joinList(record.loksabhaMp)} />
            <DetailField
              label="Rajya Sabha MP"
              value={joinList(record.rajyasabhaMp)}
            />
            <DetailField label="Link" value={record.link || "—"} fullWidth />
          </DetailGrid>
        </DetailSection>
      </div>
    </RecordDetailModal>
  );
}
