/**
 * Modal showing keyboard shortcuts. Opened with ? key.
 */

import { Modal, ModalHeader } from '../../shared/ui';
import { useTranslation } from 'react-i18next';

interface ShortcutRow {
  keys: string;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function KeyboardShortcutsHelp({ open, onClose, isAdmin }: KeyboardShortcutsHelpProps) {
  const { t } = useTranslation();

  const shortcuts: ShortcutRow[] = [
    { keys: '⌘K / Ctrl+K', description: t('shortcuts.commandPalette', 'Command palette') },
    { keys: 'G D', description: t('shortcuts.goDashboard', 'Go to Dashboard') },
    { keys: 'G C', description: t('shortcuts.goCalls', 'Go to Calls') },
    { keys: 'G S', description: isAdmin ? t('shortcuts.goSupport', 'Go to Support inbox') : t('shortcuts.goHelp', 'Go to Help Center') },
    ...(isAdmin
      ? [
          { keys: 'G T', description: t('shortcuts.goTenants', 'Go to Tenants') },
          { keys: 'G O', description: t('shortcuts.goOverview', 'Go to Admin overview') },
        ]
      : []),
    { keys: '?', description: t('shortcuts.showHelp', 'Show this help') },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('shortcuts.title', 'Keyboard Shortcuts')} maxWidthRem={28}>
      <ModalHeader
        title={t('shortcuts.title', 'Keyboard Shortcuts')}
        onClose={onClose}
      />
      <div className="p-6 space-y-3">
        {shortcuts.map((row) => (
          <div
            key={row.keys}
            className="flex items-center justify-between gap-4 py-2 border-b border-[var(--border-subtle)] last:border-0"
          >
            <span className="text-sm text-[var(--text-secondary)]">
              {row.description}
            </span>
            <kbd className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)]">
              {row.keys}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
