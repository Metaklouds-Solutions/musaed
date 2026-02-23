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
              { path: 'bookings', element: <BookingsPage /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'customers/:id', element: <CustomerDetailPage /> },
              { path: 'alerts', element: <AlertsPage /> },
              { path: 'billing', element: <BillingPage /> },
            ],
          },
          {
            path: 'admin',
            element: <AdminGuard />,
            children: [
              { index: true, element: <Navigate to="/admin/overview" replace /> },
              { path: 'overview', element: <AdminOverviewPage /> },
              { path: 'tenants', element: <AdminTenantsPage /> },
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
