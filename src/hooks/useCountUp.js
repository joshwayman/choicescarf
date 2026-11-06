import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Animates a number from its current value to `target` over a fixed
 * duration (ease-out), so big numbers take no longer than small ones.
 * Jumps straight to the target when the user prefers reduced motion.
 */
export function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    if (from === target) return undefined;

    const instant = prefersReducedMotion();
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = instant ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (target - from) * eased);

      current.current = next;
      setValue(next);

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
