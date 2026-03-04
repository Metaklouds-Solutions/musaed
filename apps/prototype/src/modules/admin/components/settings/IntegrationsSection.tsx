/**
 * Integrations section. Retell keys, webhooks.
 */

import type { AdminIntegration } from '../../../../adapters/local/settings.adapter';

interface IntegrationsSectionProps {
  integrations: AdminIntegration[];
}

export function IntegrationsSection({ integrations }: IntegrationsSectionProps) {
  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Integrations</h3>
      <p className="text-sm text-[var(--text-muted)]">
        Retell API keys, webhooks, and external services.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div>
              <p className="font-medium text-[var(--text-primary)]">{i.name}</p>
              <p
                className={`text-xs font-semibold uppercase ${
                  i.status === 'connected'
                    ? 'text-[var(--success)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {i.status === 'connected' ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-[var(--ds-primary)] hover:underline"
            >
              {i.status === 'connected' ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
