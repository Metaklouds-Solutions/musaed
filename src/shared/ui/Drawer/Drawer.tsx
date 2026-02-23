/**
 * Reusable drawer: slides in from left or right, backdrop, focus trap, ESC close.
 * Sharp edges, glassmorphism via CSS tokens. No business logic.
 */

import {
  useEffect,
  useRef,
  type ReactNode,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DRAWER_OPEN_MS = 220;
const DRAWER_CLOSE_MS = 180;

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** Width in rem (default 22) */
  widthRem?: number;
  /** Which side the drawer slides in from (default 'left') */
  side?: 'left' | 'right';
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  className,
  widthRem = 22,
  side = 'left',
}: DrawerProps) {
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
          transitionDuration: open ? `${DRAWER_OPEN_MS}ms` : `${DRAWER_CLOSE_MS}ms`,
        }}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col overflow-hidden ease-out transition-transform',
          side === 'left'
            ? 'left-0 border-r border-[var(--glass-panel-border)]'
            : 'right-0 border-l border-[var(--glass-panel-border)]',
          className
        )}
        style={{
          width: `${widthRem}rem`,
          maxWidth: '100vw',
          background: 'var(--glass-panel-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: 'var(--drawer-shadow)',
          transform:
            side === 'left'
              ? open ? 'translateX(0)' : 'translateX(-100%)'
              : open ? 'translateX(0)' : 'translateX(100%)',
          transitionDuration: open ? `${DRAWER_OPEN_MS}ms` : `${DRAWER_CLOSE_MS}ms`,
          transitionTimingFunction: open ? 'ease-out' : 'ease-in',
        }}
      >
        {children}
      </div>
    </>
  );

  return createPortal(content, document.body);
}

export function DrawerHeader({
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
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Close"
      >
        <X className="w-5 h-5" aria-hidden />
      </button>
    </div>
  );
}
