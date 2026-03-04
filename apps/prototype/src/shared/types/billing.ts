/**
 * Billing (tenant) overview. Used by billing adapter and billing module only.
 */

export interface BillingOverview {
  plan: string;
  minutesUsed: number;
  creditBalance: number;
  estimatedSavings: number;
  netROI: number;
}
