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
import { CallsPage, CallDetailPage } from '../modules/calls';
import { BookingsPage } from '../modules/bookings';
import { CustomersPage, CustomerDetailPage } from '../modules/customers';
import { AlertsPage } from '../modules/alerts';
import { BillingPage } from '../modules/billing';
import {
  AdminOverviewPage,
  AdminTenantsPage,
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
              { path: 'agent', element: <Placeholder title="Agent" description="Agent overview, skills, sync status." /> },
              { path: 'staff', element: <Placeholder title="Staff" description="Staff table, add staff, CSV import." /> },
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
              { path: 'tenants/add', element: <Placeholder title="Add Tenant" description="Tenant creation wizard." /> },
              { path: 'tenants/:id', element: <Placeholder title="Tenant Details" description="Tenant profile, settings, onboarding." /> },
              { path: 'agents', element: <Placeholder title="Agents" description="Retell agent catalog, assign to tenant." /> },
              { path: 'agents/:id', element: <Placeholder title="Agent Details" description="Skills, locale, status, sync." /> },
              { path: 'staff', element: <Placeholder title="Staff" description="Cross-tenant staff, add, CSV import." /> },
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
