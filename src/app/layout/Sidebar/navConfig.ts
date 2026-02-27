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
} from 'lucide-react';
import type { NavItem } from './types';

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin/overview', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tenants', label: 'Tenants', icon: Users },
  { to: '/admin/agents', label: 'Agents', icon: Bot },
  { to: '/admin/staff', label: 'Staff', icon: UserPlus },
  { to: '/admin/support', label: 'Support Inbox', icon: Headphones },
  { to: '/admin/calls', label: 'Calls', icon: Phone },
  { to: '/admin/runs', label: 'Runs & Logs', icon: FileText },
  { to: '/admin/skills', label: 'Skills Catalog', icon: BookOpen },
  { to: '/admin/billing', label: 'Billing', icon: CreditCard },
  { to: '/admin/system', label: 'System Health', icon: Activity },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { to: '/admin/settings', label: 'Admin Users', icon: Settings },
      { to: '/admin/settings', label: 'Integrations', icon: Activity },
      { to: '/admin/settings', label: 'Retention Policies', icon: FileText },
    ],
  },
];

export const TENANT_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calls', label: 'Calls', icon: Phone },
  { to: '/agent', label: 'Agent', icon: Bot },
  { to: '/staff', label: 'Staff', icon: UserPlus },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/help', label: 'Help Center', icon: HelpCircle },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];
