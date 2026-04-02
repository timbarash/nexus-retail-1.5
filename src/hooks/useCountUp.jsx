import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 800, delay = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic for that "settling" feel
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(eased * target);
        if (progress < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);

  return value;
}

export function CountUp({ value, decimals = 0, prefix = '', suffix = '', duration = 800, delay = 0 }) {
  const animated = useCountUp(typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0, duration, delay);
  const formatted = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString();
  return <>{prefix}{formatted}{suffix}</>;
}
