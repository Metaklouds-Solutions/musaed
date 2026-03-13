/**
 * Admin and Tenant sidebar nav config. Nested structure for expandable groups.
 */

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Bot,
  Phone,
  Headphones,
  CreditCard,
  Settings,
  BarChart3,
  HelpCircle,
  CalendarDays,
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
  { to: '/tenants/me', label: 'common.myTenant', icon: Users },
  { to: '/calls', label: 'common.calls', icon: Phone },
  { to: '/agent', label: 'common.agent', icon: Bot },
  { to: '/staff', label: 'common.staff', icon: UserPlus },
  { to: '/bookings/calendar', label: 'common.calendar', icon: CalendarDays, featureFlag: 'enableCalendar' },
  { to: '/reports', label: 'common.reports', icon: BarChart3, featureFlag: 'enableReports' },
  { to: '/help', label: 'common.helpCenter', icon: HelpCircle },
  { to: '/billing', label: 'common.billing', icon: CreditCard },
  { to: '/settings', label: 'common.settings', icon: Settings },
];
