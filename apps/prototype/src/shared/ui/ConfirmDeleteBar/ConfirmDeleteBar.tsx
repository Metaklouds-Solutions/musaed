import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../Button';

interface ConfirmDeleteBarProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** Dialog title, e.g. "Delete tenant" or "Disable tenant". Default: "Delete tenant" */
  title?: string;
  /** Custom body message. Default: "Are you sure you want to delete X? This action cannot be undone." */
  bodyMessage?: string;
  /** Confirm button label. Default: "Delete" */
  confirmLabel?: string;
  /** Button variant: danger (red) or primary (green for enable). Default: "danger" */
  variant?: 'danger' | 'primary';
}

export function ConfirmDeleteBar({
  open,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
  title = 'Delete tenant',
  bodyMessage,
  confirmLabel = 'Delete',
  variant = 'danger',
}: ConfirmDeleteBarProps) {
  const message =
    bodyMessage ?? `Are you sure you want to delete ${itemName}? This action cannot be undone.`;
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    cancelRef.current?.focus();
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-[70] flex justify-center p-4 pointer-events-none"
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirm delete"
              className="pointer-events-auto w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden"
            >
              <div className="flex items-start gap-4 p-5">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40">
                <Button
                  ref={cancelRef}
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={
                    variant === 'primary'
                      ? 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 cursor-pointer'
                      : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 cursor-pointer'
                  }
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {loading ? 'Processing...' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
