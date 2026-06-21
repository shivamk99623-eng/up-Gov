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
import { formatDisplayDate } from "@/lib/dates";
import type { MediaRecord } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

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

  const engagement = record.likes + record.comments + record.shares;

  return (
    <RecordDetailModal
      open={open}
      onOpenChange={onOpenChange}
      title={record.headline}
      description={record.content || undefined}
      badges={
        <>
          <MediaBadge mediaType={record.mediaType} />
          <SentimentBadge sentiment={record.sentiment} />
          {record.entityName ? (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
              {record.entityName}
              {record.entityType ? ` · ${record.entityType}` : ""}
            </span>
          ) : null}
        </>
      }
      footer={
        record.url ? (
          <Button asChild>
            <a href={record.url} target="_blank" rel="noopener noreferrer">
              Open source <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {(record.content || record.headline) && (
          <DetailSection title="Full content">
            <DetailBody>
              {record.content || record.headline}
            </DetailBody>
          </DetailSection>
        )}

        <DetailSection title="Overview">
          <DetailGrid>
            <DetailField
              label="Date"
              value={record.date ? formatDisplayDate(record.date) : "—"}
            />
            <DetailField label="Language" value={record.language} />
            <DetailField label="District" value={record.district || "—"} />
            <DetailField label="Profile" value={record.profile || "—"} />
            <DetailField label="Channel" value={record.rawChannel || "—"} />
            <DetailField label="Category" value={record.category || "—"} />
            <DetailField label="Keyword" value={record.keyword || "—"} fullWidth />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Engagement">
          <DetailGrid>
            <DetailField
              label="Total engagement"
              value={formatNumber(record.totalEngagement)}
            />
            <DetailField label="Interactions" value={formatNumber(engagement)} />
            <DetailField label="Views" value={formatNumber(record.views)} />
            <DetailField
              label="Impressions"
              value={formatNumber(record.impressions)}
            />
            <DetailField label="Likes" value={formatNumber(record.likes)} />
            <DetailField label="Comments" value={formatNumber(record.comments)} />
            <DetailField label="Shares" value={formatNumber(record.shares)} />
            <DetailField
              label="Followers / Rank"
              value={
                record.followersRank != null
                  ? formatNumber(record.followersRank)
                  : "—"
              }
            />
          </DetailGrid>
        </DetailSection>

      </div>
    </RecordDetailModal>
  );
}
