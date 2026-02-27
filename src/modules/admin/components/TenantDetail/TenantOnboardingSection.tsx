/**
 * Tenant onboarding section: step, complete.
 */

import { Card, CardHeader, CardBody, Badge } from '../../../../shared/ui';
import type { TenantDetail } from '../../../../shared/types';

const STEPS = ['Clinic info', 'Owner setup', 'Agent deploy', 'Go live'];

interface TenantOnboardingSectionProps {
  tenant: TenantDetail;
}

export function TenantOnboardingSection({ tenant }: TenantOnboardingSectionProps) {
  const currentStep = Math.min(tenant.onboardingStep, STEPS.length);
  return (
    <Card variant="glass">
      <CardHeader className="text-base font-semibold text-[var(--text-primary)]">
        Onboarding
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge status={tenant.onboardingComplete ? 'active' : 'pending'}>
            {tenant.onboardingComplete ? 'Complete' : 'In progress'}
          </Badge>
          <span className="text-sm text-[var(--text-muted)]">
            Step {currentStep} of {STEPS.length}
          </span>
        </div>
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((label, i) => {
            const done = i < currentStep;
            const current = i === currentStep - 1 && !tenant.onboardingComplete;
            return (
              <li
                key={label}
                className={`text-sm px-2 py-1 rounded ${
                  done
                    ? 'bg-[rgba(34,197,94,0.1)] text-green-600'
                    : current
                      ? 'bg-[rgba(234,179,8,0.1)] text-amber-600'
                      : 'text-[var(--text-muted)]'
                }`}
              >
                {i + 1}. {label}
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}
