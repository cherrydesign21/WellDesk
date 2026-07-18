'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const rafId = requestAnimationFrame(() => {
        setDisplay(value);
        prevValue.current = value;
      });
      return () => cancelAnimationFrame(rafId);
    }

    const start = prevValue.current;
    const change = value - start;
    if (change === 0) return;

    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + change * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevValue.current = value;
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return <>{display}</>;
}
