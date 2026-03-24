/**
 * Nav item types for Admin and Tenant sidebars.
 * Supports flat and nested (group) structure.
 */

import type { ComponentType } from 'react';

export type FeatureFlagKey = 'enableReports' | 'enableCalendar';

/** Base nav item shape. Use NavLeafItem or NavGroupItem for narrowed types. */
export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  /** Nested items (e.g. Tenants > Add, Directory). Rendered as expandable group. */
  children?: NavItem[];
  /** Hide this item when the feature flag is false. */
  featureFlag?: FeatureFlagKey | string;
}

/** Nav item with required children. Use for expandable groups. */
export type NavGroupItem = NavItem & { children: NavItem[] };

/** Nav item without children. Use for leaf items. */
export type NavLeafItem = NavItem & { children?: never };

/** Type guard: true when item has non-empty children. */
export function isNavGroupItem(item: NavItem): item is NavGroupItem {
  return Boolean(item.children && item.children.length > 0);
}
