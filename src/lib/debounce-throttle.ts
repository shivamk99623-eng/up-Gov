/** Shared timing defaults for client-side debounce. */
export const DEBOUNCE = {
  /** Text search inputs (table + global header). */
  SEARCH_MS: 500,
  /** Select / filter changes that may fire in quick succession. */
  FILTER_MS: 300,
  /** Date range inputs while the user is adjusting values. */
  DATE_MS: 500,
} as const;

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
}

