/** Shared timing defaults for client-side debounce / throttle. */
export const DEBOUNCE = {
  /** Text search inputs (table + global header). */
  SEARCH_MS: 400,
  /** Select / filter changes that may fire in quick succession. */
  FILTER_MS: 300,
  /** Date range inputs while the user is adjusting values. */
  DATE_MS: 500,
} as const;

export const THROTTLE = {
  /** Pagination and rapid repeat actions. */
  ACTION_MS: 300,
  /** Scroll / resize handlers. */
  RESIZE_MS: 150,
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

export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastRan = 0;
  let trailing: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastRan);

    if (remaining <= 0) {
      if (trailing) {
        clearTimeout(trailing);
        trailing = null;
      }
      lastRan = now;
      fn(...args);
      return;
    }

    if (!trailing) {
      trailing = setTimeout(() => {
        lastRan = Date.now();
        trailing = null;
        fn(...args);
      }, remaining);
    }
  };
}
