/**
 * Clears all tenant, agent, and operational data from the database.
 * Keeps: subscription_plans, agent_templates (needed for creating agents).
 * Removes: tenants, agent_instances, agent_channel_deployments, users,
 * tenant_staff, invite_tokens, refresh_tokens, call_sessions, bookings,
 * agent_runs, run_events, customers, support_tickets, alerts, report_snapshots,
 * processed_events, notifications, provider_availability, maintenance, admin_config.
 *
 * Run from apps/backend: node clear-db.js
 * Requires MONGODB_URI in .env
 *
 * After running, execute: npm run seed
 * to recreate admin user and demo tenant (or add real data manually).
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required. Set it in .env');
  process.exit(1);
}

const COLLECTIONS_TO_CLEAR = [
  'tenants',
  'tenant_staff',
  'agent_instances',
  'agent_channel_deployments',
  'users',
  'invite_tokens',
  'refreshtokens',
  'call_sessions',
  'bookings',
  'agent_runs',
  'run_events',
  'customers',
  'support_tickets',
  'alerts',
  'report_snapshots',
  'processed_events',
  'notifications',
  'provider_availability',
  'maintenance',
  'admin_config',
  'audit_entries',
];

async function clearDb() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    for (const name of COLLECTIONS_TO_CLEAR) {
      try {
        const coll = db.collection(name);
        const count = await coll.countDocuments();
        if (count > 0) {
          await coll.deleteMany({});
          console.log(`  Cleared ${name}: ${count} documents`);
        }
      } catch (err) {
        if (err.codeName === 'NamespaceNotFound') {
          // Collection doesn't exist, skip
        } else {
          console.warn(`  Warning: ${name}: ${err.message}`);
        }
      }
    }

    console.log('\nDatabase cleared. Run "npm run seed" to recreate admin and demo tenant.');
  } catch (err) {
    console.error('Clear failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  }
}

clearDb();
