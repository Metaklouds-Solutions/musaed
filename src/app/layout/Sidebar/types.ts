/**
 * Nav item types for Admin and Tenant sidebars.
 * Supports flat and nested (group) structure.
 */

import type { ComponentType } from 'react';

export type FeatureFlagKey = 'enableReports' | 'enableCalendar';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Nested items (e.g. Tenants > Add, Directory). Rendered as expandable group. */
  children?: NavItem[];
  /** Hide this item when the feature flag is false. */
  featureFlag?: FeatureFlagKey;
}
