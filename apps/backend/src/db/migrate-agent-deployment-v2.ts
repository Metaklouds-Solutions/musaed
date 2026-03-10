import mongoose, { Types } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

type MigrationMode = 'migrate' | 'rollback';

interface AgentInstanceRecord {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  channel?: string;
  status?: string;
  retellAgentId?: string | null;
  retellLlmId?: string | null;
  channelsEnabled?: string[];
  templateVersion?: number;
  name?: string;
  deletedAt?: Date | null;
}

interface DeploymentRecord {
  _id?: Types.ObjectId;
  tenantId: Types.ObjectId;
  agentInstanceId: Types.ObjectId;
  channel: string;
  provider: string;
  status: string;
  retellAgentId: string | null;
  retellConversationFlowId: string | null;
  flowSnapshot: Record<string, unknown>;
  error: string | null;
  createdBy: Types.ObjectId | null;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BackupEntry {
  _id?: Types.ObjectId;
  runId: string;
  mode: 'migrate';
  createdAt: Date;
  agentInstanceId: Types.ObjectId;
  previousFields: {
    channelsEnabled?: string[] | undefined;
    templateVersion?: number | undefined;
    name?: string | undefined;
  };
  createdDeploymentIds: Types.ObjectId[];
}

const CHANNEL_VALUES = new Set(['chat', 'voice', 'email']);

/**
 * Parses migration mode from process arguments.
 */
function readModeFromArgs(): MigrationMode {
  const raw = process.argv[2]?.trim().toLowerCase();
  if (raw === 'rollback') {
    return 'rollback';
  }
  return 'migrate';
}

/**
 * Returns requested migration run id for rollback mode.
 */
function readRunIdFromArgs(): string | null {
  const arg = process.argv.find((value) => value.startsWith('--runId='));
  if (!arg) {
    return null;
  }
  const runId = arg.replace('--runId=', '').trim();
  return runId.length > 0 ? runId : null;
}

/**
 * Safely resolves a channel from legacy instance data.
 */
function resolveLegacyChannel(instance: AgentInstanceRecord): string {
  const channel = typeof instance.channel === 'string' ? instance.channel : 'chat';
  return CHANNEL_VALUES.has(channel) ? channel : 'chat';
}

/**
 * Returns deployment status mapped from instance status.
 */
function mapDeploymentStatus(instanceStatus: string | undefined): string {
  if (instanceStatus === 'active' || instanceStatus === 'partially_deployed') {
    return 'active';
  }
  if (instanceStatus === 'failed') {
    return 'failed';
  }
  return 'pending';
}

/**
 * Executes the forward migration for agent deployment v2 fields and records.
 */
async function runMigration(runId: string): Promise<void> {
  const agentInstances = mongoose.connection.collection('agent_instances');
  const deployments = mongoose.connection.collection('agent_channel_deployments');
  const backups = mongoose.connection.collection('agent_instance_migration_backups');

  const cursor = agentInstances.find<AgentInstanceRecord>({ deletedAt: null });
  let processed = 0;
  let createdDeployments = 0;
  let updatedInstances = 0;

  while (await cursor.hasNext()) {
    const instance = await cursor.next();
    if (!instance) {
      continue;
    }
    const defaultChannel = resolveLegacyChannel(instance);
    const channelsEnabled =
      Array.isArray(instance.channelsEnabled) && instance.channelsEnabled.length > 0
        ? instance.channelsEnabled
        : [defaultChannel];
    const normalizedChannels = channelsEnabled.filter((channel) => CHANNEL_VALUES.has(channel));
    const nextChannels = normalizedChannels.length > 0 ? normalizedChannels : [defaultChannel];

    const updates: Record<string, unknown> = {};
    const previousFields: BackupEntry['previousFields'] = {};
    if (!Array.isArray(instance.channelsEnabled) || instance.channelsEnabled.length === 0) {
      previousFields.channelsEnabled = instance.channelsEnabled;
      updates.channelsEnabled = nextChannels;
    }
    if (typeof instance.templateVersion !== 'number') {
      previousFields.templateVersion = instance.templateVersion;
      updates.templateVersion = 1;
    }
    if (typeof instance.name !== 'string') {
      previousFields.name = instance.name;
      updates.name = '';
    }

    const createdDeploymentIds: Types.ObjectId[] = [];
    for (const channel of nextChannels) {
      const existingDeployment = await deployments.findOne({
        tenantId: instance.tenantId,
        agentInstanceId: instance._id,
        channel,
        deletedAt: null,
      });
      if (existingDeployment) {
        continue;
      }

      const deployment: DeploymentRecord = {
        tenantId: instance.tenantId,
        agentInstanceId: instance._id,
        channel,
        provider: 'retell',
        status: mapDeploymentStatus(instance.status),
        retellAgentId: channel === defaultChannel ? instance.retellAgentId ?? null : null,
        retellConversationFlowId: channel === defaultChannel ? instance.retellLlmId ?? null : null,
        flowSnapshot: {},
        error: null,
        createdBy: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const insertResult = await deployments.insertOne(deployment);
      createdDeploymentIds.push(insertResult.insertedId);
      createdDeployments += 1;
    }

    if (Object.keys(updates).length > 0) {
      await agentInstances.updateOne({ _id: instance._id }, { $set: updates });
      updatedInstances += 1;
    }

    if (Object.keys(previousFields).length > 0 || createdDeploymentIds.length > 0) {
      const backupEntry: BackupEntry = {
        runId,
        mode: 'migrate',
        createdAt: new Date(),
        agentInstanceId: instance._id,
        previousFields,
        createdDeploymentIds,
      };
      await backups.insertOne(backupEntry);
    }

    processed += 1;
  }

  console.log(
    JSON.stringify({
      runId,
      mode: 'migrate',
      processed,
      updatedInstances,
      createdDeployments,
    }),
  );
}

/**
 * Rolls back a prior migration run using persisted backup entries.
 */
async function runRollback(runId: string): Promise<void> {
  const agentInstances = mongoose.connection.collection('agent_instances');
  const deployments = mongoose.connection.collection('agent_channel_deployments');
  const backups = mongoose.connection.collection('agent_instance_migration_backups');
  const rollbackEntries = await backups
    .find<BackupEntry>({ runId, mode: 'migrate' })
    .sort({ createdAt: -1 })
    .toArray();

  if (rollbackEntries.length === 0) {
    throw new Error(`No migration backup entries found for runId=${runId}`);
  }

  let restoredInstances = 0;
  let deletedDeployments = 0;

  for (const entry of rollbackEntries) {
    if (entry.createdDeploymentIds.length > 0) {
      const deletionResult = await deployments.deleteMany({
        _id: { $in: entry.createdDeploymentIds },
      });
      deletedDeployments += deletionResult.deletedCount ?? 0;
    }

    const fieldsToRestore = entry.previousFields;
    if (Object.keys(fieldsToRestore).length > 0) {
      const setFields: Record<string, unknown> = {};
      const unsetFields: Record<string, ''> = {};
      for (const [key, value] of Object.entries(fieldsToRestore)) {
        if (typeof value === 'undefined') {
          unsetFields[key] = '';
        } else {
          setFields[key] = value;
        }
      }
      const updatePayload: Record<string, unknown> = {};
      if (Object.keys(setFields).length > 0) {
        updatePayload.$set = setFields;
      }
      if (Object.keys(unsetFields).length > 0) {
        updatePayload.$unset = unsetFields;
      }
      if (Object.keys(updatePayload).length > 0) {
        await agentInstances.updateOne({ _id: entry.agentInstanceId }, updatePayload);
        restoredInstances += 1;
      }
    }
  }

  console.log(
    JSON.stringify({
      runId,
      mode: 'rollback',
      restoredInstances,
      deletedDeployments,
    }),
  );
}

/**
 * Entrypoint for migration/rollback script.
 */
async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim().length === 0) {
    throw new Error('MONGODB_URI is required');
  }

  const mode = readModeFromArgs();
  const runId = readRunIdFromArgs() ?? new Types.ObjectId().toString();
  await mongoose.connect(uri);
  try {
    if (mode === 'rollback') {
      await runRollback(runId);
    } else {
      await runMigration(runId);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown migration error';
  console.error(JSON.stringify({ error: message }));
  process.exit(1);
});
