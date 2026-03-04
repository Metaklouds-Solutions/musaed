/**
 * Scheduled reports section. Configure weekly/monthly email digest.
 */

import { useState, useCallback } from 'react';
import type { ScheduledReportConfig } from '../../../../adapters/local/reports.adapter';
import { Mail, Plus, Trash2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface ScheduledReportsSectionProps {
  config: ScheduledReportConfig;
  onChange: (config: ScheduledReportConfig) => void;
}

/** Renders scheduled-report preferences for cadence, recipients, and delivery day. */
export function ScheduledReportsSection({ config, onChange }: ScheduledReportsSectionProps) {
  const [newEmail, setNewEmail] = useState('');

  const handleToggle = useCallback(
    (enabled: boolean) => {
      onChange({ ...config, enabled });
    },
    [config, onChange]
  );

  const handleFrequencyChange = useCallback(
    (frequency: 'weekly' | 'monthly') => {
      onChange({ ...config, frequency });
    },
    [config, onChange]
  );

  const handleDayOfWeekChange = useCallback(
    (dayOfWeek: number) => {
      onChange({ ...config, dayOfWeek });
    },
    [config, onChange]
  );

  const handleDayOfMonthChange = useCallback(
    (dayOfMonth: number) => {
      onChange({ ...config, dayOfMonth: Math.max(1, Math.min(31, dayOfMonth)) });
    },
    [config, onChange]
  );

  const handleAddRecipient = useCallback(() => {
    const email = newEmail.trim().toLowerCase();
    if (!email || config.recipients.includes(email)) return;
    onChange({ ...config, recipients: [...config.recipients, email] });
    setNewEmail('');
  }, [config, newEmail, onChange]);

  const handleRemoveRecipient = useCallback(
    (email: string) => {
      onChange({ ...config, recipients: config.recipients.filter((r) => r !== email) });
    },
    [config, onChange]
  );

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Mail size={18} aria-hidden />
        Scheduled Reports
      </h3>
      <p className="text-sm text-[var(--text-muted)]">
        Configure weekly or monthly email digest with platform metrics. Actual delivery requires backend integration.
      </p>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          className="accent-[var(--ds-primary)]"
        />
        <span className="text-sm text-[var(--text-secondary)]">Enable scheduled reports</span>
      </label>

      {config.enabled && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Frequency</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduled-frequency"
                  checked={config.frequency === 'weekly'}
                  onChange={() => handleFrequencyChange('weekly')}
                  className="accent-[var(--ds-primary)]"
                />
                <span className="text-sm">Weekly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduled-frequency"
                  checked={config.frequency === 'monthly'}
                  onChange={() => handleFrequencyChange('monthly')}
                  className="accent-[var(--ds-primary)]"
                />
                <span className="text-sm">Monthly</span>
              </label>
            </div>
          </div>

          {config.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Day of week</label>
              <select
                value={config.dayOfWeek ?? 1}
                onChange={(e) => handleDayOfWeekChange(parseInt(e.target.value, 10))}
                aria-label="Day of week for weekly report"
                className="w-full max-w-[200px] px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {config.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Day of month</label>
              <input
                type="number"
                min={1}
                max={31}
                value={config.dayOfMonth ?? 1}
                onChange={(e) => handleDayOfMonthChange(parseInt(e.target.value, 10) || 1)}
                aria-label="Day of month for monthly report"
                className="w-20 px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Recipients</label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
                placeholder="admin@example.com"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={handleAddRecipient}
                className="px-3 py-2 rounded-lg bg-[var(--ds-primary)] text-white text-sm font-medium hover:opacity-90 flex items-center gap-1"
              >
                <Plus size={16} aria-hidden />
                Add
              </button>
            </div>
            {config.recipients.length > 0 && (
              <ul className="space-y-1">
                {config.recipients.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm"
                  >
                    <span className="text-[var(--text-secondary)]">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)]"
                      aria-label={`Remove ${email}`}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
