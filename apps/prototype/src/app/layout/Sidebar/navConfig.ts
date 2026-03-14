/**
 * Admin and Tenant sidebar nav config. Nested structure for expandable groups.
 */

import {
  LayoutDashboard,
  Users,
  Phone,
  Headphones,
  CreditCard,
  Settings,
  BarChart3,
  CalendarDays,
  Building2,
} from 'lucide-react';
import type { NavItem } from './types';

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin/overview', label: 'common.dashboard', icon: LayoutDashboard },
  { to: '/admin/tenants', label: 'common.tenants', icon: Users },
  { to: '/admin/support', label: 'common.supportInbox', icon: Headphones },
  { to: '/admin/billing', label: 'common.billing', icon: CreditCard },
  { to: '/admin/settings', label: 'common.settings', icon: Settings },
];

export const TENANT_NAV: NavItem[] = [
  { to: '/dashboard', label: 'common.dashboard', icon: LayoutDashboard },
  { to: '/tenants/me', label: 'common.clinic', icon: Building2 },
  { to: '/calls', label: 'common.calls', icon: Phone },
  { to: '/bookings/calendar', label: 'common.calendar', icon: CalendarDays, featureFlag: 'enableCalendar' },
  { to: '/reports', label: 'common.reports', icon: BarChart3, featureFlag: 'enableReports' },
  { to: '/billing', label: 'common.billing', icon: CreditCard },
  { to: '/settings', label: 'common.settings', icon: Settings },
];
