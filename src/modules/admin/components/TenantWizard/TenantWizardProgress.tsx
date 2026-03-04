/**
 * Wizard progress indicator. Steps 1 and 2.
 */

const STEPS = ['Clinic info', 'Deploy agent'];

interface TenantWizardProgressProps {
  currentStep: number;
}

/** Renders progress indicator for the two-step tenant creation wizard. */
export function TenantWizardProgress({ currentStep }: TenantWizardProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const done = currentStep > stepNum;
        const active = currentStep === stepNum;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                done
                  ? 'bg-[var(--success)] text-white'
                  : active
                    ? 'bg-[var(--ds-accent-start)] text-white'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {done ? '✓' : stepNum}
            </div>
            <span
              className={`text-sm ${active ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 rounded ${done ? 'bg-[var(--success)]' : 'bg-[var(--border-subtle)]'}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
