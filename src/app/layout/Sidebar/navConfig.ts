/**
 * Admin and Tenant sidebar nav config. Nested structure for expandable groups.
 */

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Bot,
  Headphones,
  Phone,
  FileText,
  BookOpen,
  CreditCard,
  Settings,
  Activity,
  BarChart3,
  HelpCircle,
  CalendarDays,
  FlaskConical,
} from 'lucide-react';
import type { NavItem } from './types';

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin/overview', label: 'common.dashboard', icon: LayoutDashboard },
  { to: '/admin/tenants', label: 'common.tenants', icon: Users },
  { to: '/admin/agents', label: 'common.agent', icon: Bot },
  { to: '/admin/sandbox', label: 'common.agentSandbox', icon: FlaskConical },
  { to: '/admin/staff', label: 'common.staff', icon: UserPlus },
  { to: '/admin/support', label: 'common.supportInbox', icon: Headphones },
  { to: '/admin/calls', label: 'common.calls', icon: Phone },
  { to: '/admin/runs', label: 'common.runsLogs', icon: FileText },
  { to: '/admin/skills', label: 'common.skillsCatalog', icon: BookOpen },
  { to: '/admin/billing', label: 'common.billing', icon: CreditCard },
  { to: '/admin/system', label: 'common.systemHealth', icon: Activity },
  { to: '/admin/settings', label: 'common.settings', icon: Settings },
];

export const TENANT_NAV: NavItem[] = [
  { to: '/tenants/me', label: 'common.myTenant', icon: Users },
  { to: '/dashboard', label: 'common.dashboard', icon: LayoutDashboard },
  { to: '/calls', label: 'common.calls', icon: Phone },
  { to: '/agent', label: 'common.agent', icon: Bot },
  { to: '/staff', label: 'common.staff', icon: UserPlus },
  { to: '/bookings/calendar', label: 'common.calendar', icon: CalendarDays, featureFlag: 'enableCalendar' },
  { to: '/reports', label: 'common.reports', icon: BarChart3, featureFlag: 'enableReports' },
  { to: '/help', label: 'common.helpCenter', icon: HelpCircle },
  { to: '/billing', label: 'common.billing', icon: CreditCard },
  { to: '/settings', label: 'common.settings', icon: Settings },
];
