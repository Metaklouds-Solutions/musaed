/**
 * Deep-link routing. Tenant and admin route trees with RoleGuards.
 */

import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { RequireAuth, TenantGuard, AdminGuard, DefaultRedirect } from './guards';
import { MainLayout } from './layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { DashboardPage } from '../modules/dashboard';
import { StaffPage } from '../modules/staff';
import { AgentPage } from '../modules/agent';
import { CallsPage, CallDetailPage } from '../modules/calls';
import { BookingsPage } from '../modules/bookings';
import { CustomersPage, CustomerDetailPage } from '../modules/customers';
import { AlertsPage } from '../modules/alerts';
import { BillingPage } from '../modules/billing';
import {
  AdminOverviewPage,
  AdminTenantsPage,
  AdminTenantDetailPage,
  AdminStaffPage,
  AdminAgentsPage,
  AdminAgentDetailPage,
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
              { path: 'reports', element: <Placeholder title="Reports" description="Outcomes and performance metrics." /> },
              { path: 'help', element: <Placeholder title="Help Center" description="Create ticket, my tickets." /> },
              { path: 'help/tickets/:id', element: <Placeholder title="Ticket" description="Ticket chat thread." /> },
              { path: 'bookings', element: <BookingsPage /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'customers/:id', element: <CustomerDetailPage /> },
              { path: 'alerts', element: <AlertsPage /> },
              { path: 'billing', element: <BillingPage /> },
              { path: 'settings', element: <Placeholder title="Settings" description="Clinic profile, business hours, notifications." /> },
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
              { path: 'staff', element: <AdminStaffPage /> },
              { path: 'support', element: <Placeholder title="Support Inbox" description="Unified tickets, filters, assign." /> },
              { path: 'calls', element: <Placeholder title="Calls" description="Cross-tenant call list." /> },
              { path: 'calls/:id', element: <Placeholder title="Call Detail" description="Transcript, outcome, recording." /> },
              { path: 'runs', element: <Placeholder title="Runs & Logs" description="Agent runs, cost view." /> },
              { path: 'runs/:id', element: <Placeholder title="Run Events" description="Debug console." /> },
              { path: 'skills', element: <Placeholder title="Skills Catalog" description="Coming soon." /> },
              { path: 'billing', element: <Placeholder title="Billing" description="Tenant plans, usage." /> },
              { path: 'settings', element: <Placeholder title="Settings" description="Admin users, integrations, retention." /> },
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
