/**
 * SuccessFeedback: full-screen overlay with Lottie success animation.
 * Use for post-action feedback (e.g. booking created).
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LottiePlayer, LOTTIE_ASSETS } from '../LottiePlayer';

interface SuccessFeedbackProps {
  /** When true, shows the overlay */
  show: boolean;
  /** Callback when animation completes or user dismisses */
  onComplete: () => void;
  /** Optional message (e.g. "Booking created!") */
  message?: string;
  /** Auto-dismiss after ms (default 2000) */
  duration?: number;
}

export function SuccessFeedback({
  show,
  onComplete,
  message = 'Done!',
  duration = 2000,
}: SuccessFeedbackProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onComplete, duration);
    return () => clearTimeout(t);
  }, [show, onComplete, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onComplete}
          role="alert"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <LottiePlayer
              src={LOTTIE_ASSETS.success}
              width={80}
              height={80}
              loop={false}
            />
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
