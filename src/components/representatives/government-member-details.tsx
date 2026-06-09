"use client";

import { Briefcase, GraduationCap, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { GovernmentMemberProfile } from "@/lib/types";

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
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

export function GovernmentMemberDetails({
  profile,
  fallbackName,
}: {
  profile: GovernmentMemberProfile | null;
  fallbackName: string;
}) {
  const name = profile?.name ?? fallbackName;

  return (
    <Card>
      <CardContent className="space-y-3 p-4 lg:p-5">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Member Details</h3>
        </div>
        <DetailRow
          icon={<User className="h-4 w-4" />}
          label="Name"
          value={name}
        />
        <DetailRow
          icon={<Briefcase className="h-4 w-4" />}
          label="Current Employment"
          value={profile?.currentEmployment ?? null}
        />
        <DetailRow
          icon={<GraduationCap className="h-4 w-4" />}
          label="Highest Qualification"
          value={profile?.highestQualification ?? null}
        />
      </CardContent>
    </Card>
  );
}
