/**
 * Deep-link routing. Tenant and admin route trees with RoleGuards.
 */

import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { RequireAuth, TenantGuard, AdminGuard, DefaultRedirect, FeatureFlagGuard } from './guards';
import { MainLayout } from './layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { DashboardPage } from '../modules/dashboard';
import { StaffPage } from '../modules/staff';
import { AgentPage } from '../modules/agent';
import { CallsPage, CallDetailPage } from '../modules/calls';
import { BookingsPage, CalendarPage } from '../modules/bookings';
import { CustomersPage, CustomerDetailPage } from '../modules/customers';
import { AlertsPage } from '../modules/alerts';
import { HelpCenterPage, TicketDetailPage } from '../modules/help';
import { ReportsPage } from '../modules/reports';
import { BillingPage } from '../modules/billing';
import { SettingsPage } from '../modules/settings';
import {
  AdminOverviewPage,
  AdminTenantsPage,
  AdminTenantDetailPage,
  AdminStaffPage,
  AdminAgentsPage,
  AdminAgentDetailPage,
  AdminAgentSandboxPage,
  AdminSupportPage,
  AdminRunsPage,
  AdminRunDetailPage,
  AdminSkillsPage,
  AdminBillingPage,
  AdminSettingsPage,
  AdminSystemPage,
} from '../modules/admin';

const Placeholder = (props: { title: string; description?: string }) => (
  <PlaceholderPage {...props} />
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DefaultRedirect /> },
          {
            element: <TenantGuard />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'calls', element: <CallsPage /> },
              { path: 'calls/:id', element: <CallDetailPage /> },
              { path: 'agent', element: <AgentPage /> },
              { path: 'staff', element: <StaffPage /> },
              { path: 'reports', element: <FeatureFlagGuard flag="enableReports"><ReportsPage /></FeatureFlagGuard> },
              { path: 'help', element: <HelpCenterPage /> },
              { path: 'help/tickets/:id', element: <TicketDetailPage /> },
              { path: 'bookings', element: <BookingsPage /> },
              { path: 'bookings/calendar', element: <FeatureFlagGuard flag="enableCalendar"><CalendarPage /></FeatureFlagGuard> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'customers/:id', element: <CustomerDetailPage /> },
              { path: 'alerts', element: <AlertsPage /> },
              { path: 'billing', element: <BillingPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
          {
            path: 'admin',
            element: <AdminGuard />,
            children: [
              { index: true, element: <Navigate to="/admin/overview" replace /> },
              { path: 'overview', element: <AdminOverviewPage /> },
              { path: 'tenants', element: <AdminTenantsPage /> },
              { path: 'tenants/:id', element: <AdminTenantDetailPage /> },
              { path: 'agents', element: <AdminAgentsPage /> },
              { path: 'agents/:id', element: <AdminAgentDetailPage /> },
              { path: 'sandbox', element: <AdminAgentSandboxPage /> },
              { path: 'staff', element: <AdminStaffPage /> },
              { path: 'support', element: <AdminSupportPage /> },
              { path: 'support/:id', element: <AdminSupportPage /> },
              { path: 'calls', element: <Placeholder title="Calls" description="Cross-tenant call list." /> },
              { path: 'calls/:id', element: <Placeholder title="Call Detail" description="Transcript, outcome, recording." /> },
              { path: 'runs', element: <AdminRunsPage /> },
              { path: 'runs/:id', element: <AdminRunDetailPage /> },
              { path: 'skills', element: <AdminSkillsPage /> },
              { path: 'billing', element: <AdminBillingPage /> },
              { path: 'settings', element: <AdminSettingsPage /> },
              { path: 'system', element: <AdminSystemPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
