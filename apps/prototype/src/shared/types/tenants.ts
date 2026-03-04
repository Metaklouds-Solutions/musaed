/**
 * Tenant detail types for admin tenant details page.
 */

export interface TenantDetail {
  id: string;
  name: string;
  plan: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  createdAt: string;
  onboardingStep: number;
  onboardingComplete: boolean;
  timezone: string;
  locale: string;
  businessHours: string;
}
