"use client";

import {
  Briefcase,
  CalendarDays,
  GraduationCap,
  History,
  Landmark,
  User,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { House, MPBioProfile } from "@/lib/types";

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

function CareerTimeline({
  positions,
  reverse = false,
}: {
  positions: MPBioProfile["careerTimeline"];
  reverse?: boolean;
}) {
  if (positions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No career timeline available.</p>
    );
  }

  const items = reverse ? [...positions].reverse() : positions;

  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => (
        <li key={`${item.period}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
          {index < items.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[7px] top-3 h-[calc(100%-4px)] w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden
            className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-card"
          />
          <div className="min-w-0 flex-1">
            {item.period ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {item.period}
              </p>
            ) : null}
            <p
              className="mt-1 text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: item.position }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function MPBioDetails({
  profile,
  fallbackName,
  house,
  reverseTimeline = false,
}: {
  profile: MPBioProfile | null;
  fallbackName: string;
  /** Omit for Vidhan Sabha / MLA profiles. */
  house?: House | null;
  /** When true, newest career entries appear first (MP page). */
  reverseTimeline?: boolean;
}) {
  const constituency =
    profile?.constituency ??
    (house === "Rajya Sabha" ? "Rajya Sabha — Uttar Pradesh" : null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-4 lg:p-5 max-h-[650px] overflow-y-auto">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Member Details</h3>
          </div>
          <DetailRow
            icon={<User className="h-4 w-4" />}
            label="Name"
            value={profile?.fullName ?? fallbackName}
          />
          <DetailRow
            icon={<Landmark className="h-4 w-4" />}
            label="Constituency"
            value={constituency}
          />
          <DetailRow
            icon={<Users className="h-4 w-4" />}
            label="Party Name"
            value={profile?.partyFname ?? null}
          />
          <DetailRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="DoB"
            value={profile?.dateOfBirth ?? null}
          />
          <DetailRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Education"
            value={profile?.education ?? null}
          />
          <DetailRow
            icon={<Briefcase className="h-4 w-4" />}
            label="Profession"
            value={profile?.profession ?? null}
          />
        </CardContent>
      </Card>

      <Card >
        <CardContent className="p-4 lg:p-5 max-h-[650px] overflow-y-auto">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Career Timeline</h3>
          </div>
          <CareerTimeline
            positions={profile?.careerTimeline ?? []}
            reverse={reverseTimeline}
          />
        </CardContent>
      </Card>
    </div>
  );
}
