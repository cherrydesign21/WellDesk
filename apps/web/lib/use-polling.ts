'use client';

import { useEffect, useRef } from 'react';

// Runs `fn` immediately, then on an interval, and again whenever the tab
// regains focus/visibility. App Router layouts persist across client-side
// navigation (they don't remount), so without this a fetch-once-on-mount
// effect only ever refreshes on login or a hard page reload.
export function usePolling(fn: () => void, intervalMs: number) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    fnRef.current();
    const interval = setInterval(() => fnRef.current(), intervalMs);

    function onFocus() {
      fnRef.current();
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') fnRef.current();
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);
}
