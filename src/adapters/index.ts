/**
 * Adapter entry. VITE_DATA_MODE=local | api. No component may directly access mock data.
 */

import * as localDashboard from './local/dashboard.adapter';
import * as localCalls from './local/calls.adapter';
import * as localBookings from './local/bookings.adapter';
import * as localCustomers from './local/customers.adapter';
import * as localAlerts from './local/alerts.adapter';
import * as localBilling from './local/billing.adapter';
import * as localStaff from './local/staff.adapter';
import * as localSupport from './local/support.adapter';
import * as localReports from './local/reports.adapter';
import * as localAdmin from './local/admin.adapter';
import * as apiDashboard from './api/dashboard.adapter';
import * as apiAdmin from './api/admin.adapter';
import * as apiCalls from './api/calls.adapter';
import * as apiBookings from './api/bookings.adapter';
import * as apiCustomers from './api/customers.adapter';
import * as apiAlerts from './api/alerts.adapter';
import * as apiBilling from './api/billing.adapter';

const dataMode = import.meta.env.VITE_DATA_MODE as string | undefined;
const isLocal = dataMode !== 'api';

export const dashboardAdapter = isLocal ? localDashboard.dashboardAdapter : apiDashboard.dashboardAdapter;
export const callsAdapter = isLocal ? localCalls.callsAdapter : apiCalls.callsAdapter;
export const bookingsAdapter = isLocal ? localBookings.bookingsAdapter : apiBookings.bookingsAdapter;
export const customersAdapter = isLocal ? localCustomers.customersAdapter : apiCustomers.customersAdapter;
export const alertsAdapter = isLocal ? localAlerts.alertsAdapter : apiAlerts.alertsAdapter;
export const billingAdapter = isLocal ? localBilling.billingAdapter : apiBilling.billingAdapter;
export const staffAdapter = isLocal ? localStaff.staffAdapter : localStaff.staffAdapter;
export const supportAdapter = isLocal ? localSupport.supportAdapter : localSupport.supportAdapter;
export const reportsAdapter = isLocal ? localReports.reportsAdapter : localReports.reportsAdapter;
export const adminAdapter = isLocal ? localAdmin.adminAdapter : apiAdmin.adminAdapter;

export type { DashboardMetrics, FunnelStage, TrendPoint } from '../shared/types';
export type { AdminOverviewMetrics, PaymentFailure, UsageAnomaly, ChurnRisk } from '../shared/types';
