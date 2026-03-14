/**
 * Wizard progress indicator. Steps 1 and 2.
 */

const STEPS = ['Tenant details', 'Select template'];

interface TenantWizardProgressProps {
  currentStep: number;
}

/** Renders progress indicator for the two-step tenant creation wizard. */
export function TenantWizardProgress({ currentStep }: TenantWizardProgressProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)]/80 bg-[var(--bg-elevated)]/40 px-4 py-3">
      <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Onboarding progress</p>
      <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const done = currentStep > stepNum;
        const active = currentStep === stepNum;
        return (
          <div key={label} className="flex items-center gap-2 min-w-0">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                done
                  ? 'bg-[var(--success)] text-white shadow-[0_0_0_2px_rgba(16,185,129,0.25)]'
                  : active
                    ? 'bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white shadow-[0_6px_24px_var(--ds-accent-glow)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {done ? '✓' : stepNum}
            </div>
            <span
              className={`text-sm truncate ${active ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)]'}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-10 h-0.5 rounded ${done ? 'bg-[var(--success)]' : 'bg-[var(--border-subtle)]'}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
