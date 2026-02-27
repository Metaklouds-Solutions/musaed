/**
 * Centered modal. Overlay + content panel. Not full screen.
 */

import { useEffect, useRef, type ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODAL_OPEN_MS = 200;
const MODAL_CLOSE_MS = 150;

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** Max width in rem (default 28) */
  maxWidthRem?: number;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  maxWidthRem = 28,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const focusable = getFocusableElements(panel);
      if (focusable.length > 0) focusable[0].focus();
    }
    return () => {
      if (previousActiveRef.current?.focus) {
        previousActiveRef.current.focus();
      }
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const content = (
    <>
      <div
        role="presentation"
        className="fixed inset-0 z-40 transition-opacity ease-in"
        style={{
          backgroundColor: 'var(--overlay-bg)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transitionDuration: open ? `${MODAL_OPEN_MS}ms` : `${MODAL_CLOSE_MS}ms`,
        }}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          className
        )}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        <div
          className={cn(
            'w-full overflow-hidden rounded-[var(--radius-card)] card-glass',
            'transition-all duration-200 ease-out'
          )}
          style={{
            maxWidth: `${maxWidthRem}rem`,
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1)' : 'scale(0.96)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

export function ModalHeader({
  title,
  onClose,
  className,
}: {
  title: string;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between shrink-0 px-5 py-4 border-b border-[var(--separator)]',
        className
      )}
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-[var(--text-muted)]"
        aria-label="Close"
      >
        <X className="w-5 h-5" aria-hidden />
      </button>
    </div>
  );
}
