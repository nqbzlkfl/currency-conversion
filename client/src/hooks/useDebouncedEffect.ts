import { useEffect, useRef } from 'react';

export function useDebouncedEffect(
  callback: () => void,
  delayMs: number,
  deps: ReadonlyArray<unknown>,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      callbackRef.current();
    }, delayMs);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayMs, ...deps]);
}
