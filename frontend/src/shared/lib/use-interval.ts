import { useEffect, useRef } from 'react';

/**
 * Runs callback on a fixed interval with cleanup on unmount or delay change.
 */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) {
      return;
    }
    const id = window.setInterval(() => savedCallback.current(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}
