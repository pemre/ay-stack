import { type RefObject, useEffect, useRef } from "react";

/**
 * Observes size changes on the element referenced by `ref`
 * and calls `callback` (debounced) whenever the element resizes.
 *
 * @param {React.RefObject} ref      — ref to the DOM element to observe
 * @param {Function}        callback — called on resize (receives ResizeObserverEntry)
 * @param {number}          delay    — debounce delay in ms (default 100)
 */
export function useResizeObserver(
  ref: RefObject<HTMLElement | null>,
  callback: (entry: ResizeObserverEntry) => void,
  delay = 100,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callback(entries[0]);
      }, delay);
    });

    observer.observe(element);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [ref, callback, delay]);
}
