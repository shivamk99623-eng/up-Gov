"use client";

import * as React from "react";
import { DEBOUNCE } from "./debounce-throttle";

/** Returns a debounced copy of `value` that updates after `delay` ms of stability. */
export function useDebouncedValue<T>(value: T, delay: number = DEBOUNCE.SEARCH_MS): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Local state paired with a debounced value — useful for search inputs. */
export function useDebouncedState(
  initial = "",
  delay: number = DEBOUNCE.SEARCH_MS,
) {
  const [value, setValue] = React.useState(initial);
  const debouncedValue = useDebouncedValue(value, delay);
  return [value, setValue, debouncedValue] as const;
}

/** Stable debounced wrapper around a callback. */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number = DEBOUNCE.SEARCH_MS,
): T {
  const callbackRef = React.useRef(callback);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ) as T;
}

/** True while `value` has not yet settled to its debounced form. */
export function useIsDebouncing(value: string, debounced: string): boolean {
  return value !== debounced;
}
