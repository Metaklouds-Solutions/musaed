/**
 * Form to create a new support ticket.
 */

import { useState } from 'react';
import { Button } from '../../../shared/ui';
import type { SupportTicket } from '../../../shared/types/entities';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

const CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'billing', label: 'Billing' },
  { value: 'general', label: 'General' },
  { value: 'feature', label: 'Feature Request' },
];

const PRIORITIES: { value: SupportTicket['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

interface CreateTicketFormProps {
  tenantId: string;
  authorId: string;
  onSubmit: (data: {
    title: string;
    category: string;
    priority: SupportTicket['priority'];
    initialMessage: string;
  }) => void;
  onCancel: () => void;
}

export function CreateTicketForm({
  tenantId,
  authorId,
  onSubmit,
  onCancel,
}: CreateTicketFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    onSubmit({
      title: title.trim(),
      category,
      priority,
      initialMessage: message.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Subject *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of your issue"
          className={inputClass}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
            className={inputClass}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Message *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue in detail…"
          rows={4}
          className={`${inputClass} resize-none`}
          required
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={!title.trim() || !message.trim()}>
          Create Ticket
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
