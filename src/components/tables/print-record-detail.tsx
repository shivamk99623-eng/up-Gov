"use client";

import {
  DetailField,
  DetailGrid,
  DetailSection,
  RecordDetailModal,
} from "@/components/common/record-detail-modal";
import { SentimentBadge } from "@/components/common/sentiment-badge";
import { formatDisplayDate } from "@/lib/dates";
import type { PrintRecord } from "@/lib/types";

const SOURCE_LABELS: Record<PrintRecord["sourceType"], string> = {
  constituency: "Constituency",
  district: "District",
  mp: "Member of Parliament",
  mla: "Member of Legislative Assembly",
};

export function PrintRecordDetailModal({
  record,
  open,
  onOpenChange,
}: {
  record: PrintRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!record) return null;

  return (
    <RecordDetailModal
      open={open}
      onOpenChange={onOpenChange}
      title={record.headline}
      description={`${record.publication}${record.edition ? ` · ${record.edition}` : ""}`}
      badges={
        <>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
            Print · {SOURCE_LABELS[record.sourceType]}
          </span>
          <SentimentBadge sentiment={record.sentiment} />
        </>
      }
    >
      <div className="space-y-6">
        <DetailSection title="Article details">
          <DetailGrid>
            <DetailField
              label="Headline"
              value={record.headline}
              fullWidth
            />
            <DetailField label="Publication" value={record.publication} />
            <DetailField label="Edition" value={record.edition || "—"} />
            <DetailField label="Author" value={record.author || "—"} />
            <DetailField
              label="Page no."
              value={record.pageNo != null ? String(record.pageNo) : "—"}
            />
            <DetailField
              label="Date"
              value={record.date ? formatDisplayDate(record.date) : "—"}
            />
            <DetailField label="Language" value={record.language} />
            <DetailField label="CCM" value={record.ccm || "—"} />
            <DetailField
              label="Serial no."
              value={record.srNo != null ? String(record.srNo) : "—"}
            />
          </DetailGrid>
        </DetailSection>
      </div>
    </RecordDetailModal>
  );
}
