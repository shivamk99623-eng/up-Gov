import { format } from "date-fns";

const CALENDAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses `yyyy-MM-dd` as a local calendar date. Avoids `new Date("yyyy-MM-dd")`,
 * which is interpreted as UTC and can shift the displayed day by timezone.
 */
export function parseCalendarDate(value: string): Date {
  const m = value.trim().match(CALENDAR_DATE_RE);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(value);
}

/** Start of local calendar day (ms) for filter range "from". */
export function startOfCalendarDay(value: string): number {
  return parseCalendarDate(value).getTime();
}

/** End of local calendar day (ms) for filter range "to". */
export function endOfCalendarDay(value: string): number {
  const d = parseCalendarDate(value);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** `yyyy-MM-dd` in local timezone from a timestamp. */
export function formatCalendarDate(ts: number): string {
  return format(new Date(ts), "yyyy-MM-dd");
}

/** Indian display format for tables and tooltips (DD/MM/YYYY). */
export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseCalendarDate(value), "dd/MM/yyyy");
  } catch {
    return value;
  }
}

/** Readable range labels (e.g. date picker button). */
export function formatDisplayDateLong(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return format(parseCalendarDate(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}
