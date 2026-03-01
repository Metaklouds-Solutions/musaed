/**
 * Adapter entry. VITE_DATA_MODE=local | api. No component may directly access mock data.
 * When api mode: dashboard, calls, bookings, customers, alerts, billing, admin use api adapters.
 * staff, support, reports, runs, tenants, agents: local only (api stubs not yet implemented).
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
import * as localRuns from './local/runs.adapter';
import * as localTenants from './local/tenants.adapter';
import * as localAgents from './local/agents.adapter';
import * as localExport from './local/export.adapter';
import * as localAudit from './local/audit.adapter';
import * as localSearch from './local/search.adapter';
import * as localSettings from './local/settings.adapter';
import * as localFeatureFlags from './local/featureFlags.adapter';
import * as localWebhooks from './local/webhooks.adapter';
import * as localABTest from './local/abTest.adapter';
import * as localTwoFactor from './local/twoFactor.adapter';
import * as localGdpr from './local/gdpr.adapter';
import * as localMaintenance from './local/maintenance.adapter';
import * as localSoftDelete from './local/softDelete.adapter';
import * as localStaffProfile from './local/staffProfile.adapter';
import * as localPms from './local/pms.adapter';
import * as localLocations from './local/locations.adapter';
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
export const staffAdapter = localStaff.staffAdapter;
export const supportAdapter = localSupport.supportAdapter;
export const reportsAdapter = localReports.reportsAdapter;
export const adminAdapter = isLocal ? localAdmin.adminAdapter : apiAdmin.adminAdapter;
export const runsAdapter = localRuns.runsAdapter;
export const tenantsAdapter = localTenants.tenantsAdapter;
export const agentsAdapter = localAgents.agentsAdapter;
export const exportAdapter = localExport.exportAdapter;
export const auditAdapter = localAudit.auditAdapter;
export const searchAdapter = localSearch.searchAdapter;
export const settingsAdapter = localSettings.settingsAdapter;
export const featureFlagsAdapter = localFeatureFlags.featureFlagsAdapter;
export const webhooksAdapter = localWebhooks.webhooksAdapter;
export const abTestAdapter = localABTest.abTestAdapter;
export const twoFactorAdapter = localTwoFactor.twoFactorAdapter;
export const gdprAdapter = localGdpr.gdprAdapter;
export const maintenanceAdapter = localMaintenance.maintenanceAdapter;
export const softDeleteAdapter = localSoftDelete.softDeleteAdapter;
export const staffProfileAdapter = localStaffProfile.staffProfileAdapter;
export const pmsAdapter = localPms.pmsAdapter;
export const locationsAdapter = localLocations.locationsAdapter;
export { MAINTENANCE_CHANGED } from './local/maintenance.adapter';
export { SOFT_DELETE_CHANGED } from './local/softDelete.adapter';

export type { DashboardMetrics, FunnelStage, TrendPoint } from '../shared/types';
export type { AdminOverviewMetrics, PaymentFailure, UsageAnomaly, ChurnRisk } from '../shared/types';
export type { SearchResult, SearchResultType } from './local/search.adapter';
export type { AgentPromptConfig } from './local/settings.adapter';
export type { ScheduledReportConfig } from './local/reports.adapter';
export type { CalendarAppointment, CalendarAvailability } from './local/bookings.adapter';
export type { FeatureFlags, FeatureFlagKey } from './local/featureFlags.adapter';
export type { ABTestConfig } from './local/abTest.adapter';
