/**
 * Placeholder page for routes not yet implemented. Shows title and "Coming soon" message.
 */

import { PageHeader } from '../../shared/ui';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description = 'Coming soon.' }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center">
        <p className="text-[var(--text-muted)] text-sm">{description}</p>
      </div>
    </div>
  );
}
