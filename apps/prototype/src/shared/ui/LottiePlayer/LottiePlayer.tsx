/**
 * LottiePlayer: renders Lottie animations from URL or animationData.
 */

import { useState, useEffect, type ReactNode } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

export type LottieAnimationData = object;

interface LottiePlayerProps {
  /** URL to fetch animation JSON, or a pre-bundled animation object */
  src?: string | LottieAnimationData;
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

function createPulseAnimation(color: [number, number, number, number]): LottieAnimationData {
  return {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: 'Pulse Dot',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Dot',
        sr: 1,
        ks: {
          o: { a: 0, k: 88 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [72, 72, 100], e: [102, 102, 100] },
              { t: 45, s: [102, 102, 100], e: [72, 72, 100] },
              { t: 90, s: [72, 72, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [84, 84] },
                p: { a: 0, k: [0, 0] },
                nm: 'Ellipse Path 1',
                mn: 'ADBE Vector Shape - Ellipse',
                hd: false,
              },
              {
                ty: 'fl',
                c: { a: 0, k: color },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1',
                mn: 'ADBE Vector Graphic - Fill',
                hd: false,
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
                sk: { a: 0, k: 0 },
                sa: { a: 0, k: 0 },
                nm: 'Transform',
              },
            ],
            nm: 'Ellipse 1',
            np: 3,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: 'ADBE Vector Group',
            hd: false,
          },
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0,
      },
    ],
  };
}

const LOTTIE_ASSETS = {
  empty: createPulseAnimation([0.63, 0.66, 0.72, 1]),
  loading: createPulseAnimation([0.99, 0.7, 0.23, 1]),
  success: createPulseAnimation([0.2, 0.75, 0.41, 1]),
  chart: createPulseAnimation([0.2588, 0.5216, 0.9569, 1]),
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
    if (typeof src !== 'string') {
      setData(src);
      setError(false);
      onLoad?.();
      return;
    }
    let cancelled = false;
    setError(false);
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load Lottie asset: ${res.status}`);
        return res.json();
      })
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
