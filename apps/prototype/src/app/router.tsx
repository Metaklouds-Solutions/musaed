/**
 * Deep-link routing. Tenant and admin route trees with RoleGuards.
 * Route-level code splitting via React.lazy + Suspense.
 * ErrorBoundary on every route group for graceful crash recovery.
 */

import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { SessionProvider } from './session/SessionContext';
import { RequireAuth, TenantGuard, AdminGuard, DefaultRedirect, FeatureFlagGuard, TenantOrAdminGuard, TenantMeRedirect, TenantScopeGuard } from './guards';
import { MainLayout } from './layout/MainLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SetupPasswordPage = lazy(() => import('./pages/SetupPasswordPage').then(m => ({ default: m.SetupPasswordPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const LinkExpiredPage = lazy(() => import('./pages/LinkExpiredPage').then(m => ({ default: m.LinkExpiredPage })));

const DashboardPage = lazy(() => import('../modules/dashboard').then(m => ({ default: m.DashboardPage })));
const CallsPage = lazy(() => import('../modules/calls').then(m => ({ default: m.CallsPage })));
const CallDetailPage = lazy(() => import('../modules/calls').then(m => ({ default: m.CallDetailPage })));
const BookingsPage = lazy(() => import('../modules/bookings').then(m => ({ default: m.BookingsPage })));
const CalendarPage = lazy(() => import('../modules/bookings').then(m => ({ default: m.CalendarPage })));
const CustomersPage = lazy(() => import('../modules/customers').then(m => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import('../modules/customers').then(m => ({ default: m.CustomerDetailPage })));
const AlertsPage = lazy(() => import('../modules/alerts').then(m => ({ default: m.AlertsPage })));
const TicketDetailPage = lazy(() => import('../modules/help').then(m => ({ default: m.TicketDetailPage })));
const ReportsPage = lazy(() => import('../modules/reports').then(m => ({ default: m.ReportsPage })));
const BillingPage = lazy(() => import('../modules/billing').then(m => ({ default: m.BillingPage })));
const SettingsPage = lazy(() => import('../modules/settings').then(m => ({ default: m.SettingsPage })));
const AdminOverviewPage = lazy(() => import('../modules/admin').then(m => ({ default: m.AdminOverviewPage })));
const AdminTenantsPage = lazy(() => import('../modules/admin').then(m => ({ default: m.AdminTenantsPage })));
const AdminSupportPage = lazy(() => import('../modules/admin').then(m => ({ default: m.AdminSupportPage })));
const AdminBillingPage = lazy(() => import('../modules/admin').then(m => ({ default: m.AdminBillingPage })));
const AdminSettingsPage = lazy(() => import('../modules/admin').then(m => ({ default: m.AdminSettingsPage })));

const TenantDetailPage = lazy(() => import('../modules/tenant').then(m => ({ default: m.TenantDetailPage })));
const AgentDetailPage = lazy(() => import('../modules/tenant').then(m => ({ default: m.AgentDetailPage })));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}

/**
 * Wraps lazy-loaded page components with Suspense + ErrorBoundary.
 */
function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Root layout: must wrap `<Outlet />` with SessionProvider here — not around `<RouterProvider>`.
 * React Router renders matched routes outside parents of RouterProvider, so context placed
 * only above RouterProvider does not reach `RequireAuth`, `MainLayout`, or pages.
 */
function RootLayout() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <PageSuspense><LoginPage /></PageSuspense>,
      },
      {
        path: '/auth/setup-password',
        element: <PageSuspense><SetupPasswordPage /></PageSuspense>,
      },
      {
        path: '/auth/forgot-password',
        element: <PageSuspense><ForgotPasswordPage /></PageSuspense>,
      },
      {
        path: '/auth/reset-password',
        element: <PageSuspense><ResetPasswordPage /></PageSuspense>,
      },
      {
        path: '/auth/link-expired',
        element: <PageSuspense><LinkExpiredPage /></PageSuspense>,
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
                  { path: 'dashboard', element: <PageSuspense><DashboardPage /></PageSuspense> },
                  { path: 'calls', element: <PageSuspense><CallsPage /></PageSuspense> },
                  { path: 'calls/:id', element: <PageSuspense><CallDetailPage /></PageSuspense> },
                  { path: 'agent', element: <Navigate to="/reports?tab=agent" replace /> },
                  { path: 'staff', element: <Navigate to="/settings?tab=team" replace /> },
                  { path: 'reports', element: <FeatureFlagGuard flag="enableReports"><PageSuspense><ReportsPage /></PageSuspense></FeatureFlagGuard> },
                  { path: 'help', element: <Navigate to="/settings?tab=support" replace /> },
                  { path: 'help/tickets/:id', element: <PageSuspense><TicketDetailPage /></PageSuspense> },
                  { path: 'bookings', element: <PageSuspense><BookingsPage /></PageSuspense> },
                  { path: 'bookings/calendar', element: <FeatureFlagGuard flag="enableCalendar"><PageSuspense><CalendarPage /></PageSuspense></FeatureFlagGuard> },
                  { path: 'customers', element: <PageSuspense><CustomersPage /></PageSuspense> },
                  { path: 'customers/:id', element: <PageSuspense><CustomerDetailPage /></PageSuspense> },
                  { path: 'alerts', element: <PageSuspense><AlertsPage /></PageSuspense> },
                  { path: 'billing', element: <PageSuspense><BillingPage /></PageSuspense> },
                  { path: 'settings', element: <PageSuspense><SettingsPage /></PageSuspense> },
                ],
              },
              {
                path: 'tenants',
                element: <TenantOrAdminGuard />,
                children: [
                  { path: 'me', element: <TenantMeRedirect /> },
                  {
                    path: ':id',
                    element: <TenantScopeGuard />,
                    children: [
                      { index: true, element: <PageSuspense><TenantDetailPage /></PageSuspense> },
                      { path: 'agents/:agentId', element: <PageSuspense><AgentDetailPage /></PageSuspense> },
                    ],
                  },
                ],
              },
              {
                path: 'admin',
                element: <AdminGuard />,
                children: [
                  { index: true, element: <Navigate to="/admin/overview" replace /> },
                  { path: 'overview', element: <PageSuspense><AdminOverviewPage /></PageSuspense> },
                  { path: 'tenants', element: <PageSuspense><AdminTenantsPage /></PageSuspense> },
                  { path: 'tenants/:id', element: <PageSuspense><TenantDetailPage /></PageSuspense> },
                  { path: 'tenants/:id/agents/:agentId', element: <PageSuspense><AgentDetailPage /></PageSuspense> },
                  { path: 'tenants/:id/calls/:callId', element: <PageSuspense><CallDetailPage /></PageSuspense> },
                  { path: 'support', element: <PageSuspense><AdminSupportPage /></PageSuspense> },
                  { path: 'support/:id', element: <PageSuspense><AdminSupportPage /></PageSuspense> },
                  { path: 'billing', element: <PageSuspense><AdminBillingPage /></PageSuspense> },
                  { path: 'settings', element: <PageSuspense><AdminSettingsPage /></PageSuspense> },
                  { path: '*', element: <Navigate to="/admin/overview" replace /> },
                ],
              },
            ],
          },
        ],
      },
    { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
