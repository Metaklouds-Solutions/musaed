import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useInView } from 'motion/react';

export interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  format,
  decimals = 0,
  duration = 1,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 80,
    damping: 20,
    duration,
  });
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      if (!ref.current) return;
      const rounded = decimals > 0
        ? parseFloat(latest.toFixed(decimals))
        : Math.round(latest);
      ref.current.textContent = format ? format(rounded) : rounded.toLocaleString();
    });
    return unsubscribe;
  }, [spring, format, decimals]);

  const initial = format ? format(0) : '0';

  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  );
}
