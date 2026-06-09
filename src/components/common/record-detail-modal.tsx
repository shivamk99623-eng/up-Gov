"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RecordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  badges?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function RecordDetailModal({
  open,
  onOpenChange,
  title,
  description,
  badges,
  footer,
  children,
}: RecordDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="border-b border-border bg-gradient-to-r from-primary/8 via-card to-card px-6 pb-4 pt-6">
          <DialogHeader className="space-y-3 text-left">
            {badges ? (
              <div className="flex flex-wrap items-center gap-2">{badges}</div>
            ) : null}
            <DialogTitle className="text-xl font-semibold leading-snug text-foreground">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <>
            <Separator />
            <div className="flex flex-wrap items-center justify-end gap-2 bg-secondary/30 px-6 py-4">
              {footer}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function DetailSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      ) : null}
      {children}
    </section>
  );
}

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
  );
}

export function DetailField({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-secondary/25 px-3.5 py-3",
        fullWidth && "sm:col-span-2",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">
        {value ?? <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

export function DetailBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card px-4 py-3.5 text-sm leading-relaxed text-foreground">
      {children}
    </div>
  );
}
