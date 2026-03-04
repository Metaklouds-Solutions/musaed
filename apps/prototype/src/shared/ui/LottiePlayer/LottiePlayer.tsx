/**
 * LottiePlayer: renders Lottie animations from URL or animationData.
 */

import { useState, useEffect, type ReactNode } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

export type LottieAnimationData = object;

interface LottiePlayerProps {
  /** URL to fetch animation JSON (LottieFiles CDN, etc.) */
  src?: string;
  /** Pre-loaded animation data (alternative to src) */
  animationData?: LottieAnimationData;
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Loop animation */
  loop?: boolean;
  /** Additional class name */
  className?: string;
  /** Called when animation loads */
  onLoad?: () => void;
  /** Fallback when load fails (e.g. icon) */
  fallback?: ReactNode;
}

const LOTTIE_ASSETS = {
  empty: 'https://assets2.lottiefiles.com/packages/lf20_u4yrau.json',
  loading: 'https://assets9.lottiefiles.com/packages/lf20_ubnxvomi.json',
  success: 'https://assets10.lottiefiles.com/packages/lf20_success_check.json',
  chart: 'https://assets1.lottiefiles.com/packages/lf20_2pwa4h2d.json',
} as const;

export { LOTTIE_ASSETS };

export function LottiePlayer({
  src,
  animationData,
  width = 120,
  height = 120,
  loop = true,
  className,
  onLoad,
  fallback,
}: LottiePlayerProps) {
  const [data, setData] = useState<LottieAnimationData | null>(animationData ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (animationData) {
      setData(animationData);
      setError(false);
      return;
    }
    if (!src) {
      setData(null);
      return;
    }
    let cancelled = false;
    setError(false);
    fetch(src)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          onLoad?.();
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src, animationData, onLoad]);

  if (error && fallback) return <>{fallback}</>;
  if (error || !data) return null;

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ width, height }}
      aria-hidden
    >
      <Lottie
        animationData={data}
        loop={loop}
        style={{ width, height }}
      />
    </div>
  );
}
