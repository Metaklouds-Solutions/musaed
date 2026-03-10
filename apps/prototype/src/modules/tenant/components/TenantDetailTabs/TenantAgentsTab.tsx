/**
 * Tenant detail Agents tab: list of agents and per-channel deployment visibility.
 */

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, Phone, MessageSquare, Mail } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ViewButton,
  PillTag,
  Button,
} from '../../../../shared/ui';
import { agentsAdapter } from '../../../../adapters';
import type { TenantAgentRow, ChannelDeploymentSummary } from '../../../../shared/types';
import { ApiClientError } from '../../../../lib/apiClient';

interface TenantAgentsTabProps {
  agents: TenantAgentRow[];
}

const channelIcons: Record<string, typeof Phone> = { voice: Phone, chat: MessageSquare, email: Mail };

function mapApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 0) {
      return 'Cannot reach backend API. Please check server status and retry.';
    }
    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to view deployment details.';
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and retry.';
    }
    return error.message || 'Failed to load deployment details.';
  }
  return error instanceof Error ? error.message : 'Failed to load deployment details.';
}

/** Renders tenant-assigned agents with channel/status and deep-link actions. */
export function TenantAgentsTab({ agents }: TenantAgentsTabProps) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin/');
  const agentLinkBase = isAdmin ? `/admin/tenants/${id}` : `/tenants/${id}`;
  const [deploymentsByAgent, setDeploymentsByAgent] = useState<
    Record<string, ChannelDeploymentSummary[]>
  >({});
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [startStateByAgent, setStartStateByAgent] = useState<
    Record<string, { loading: boolean; error: string | null; success: string | null }>
  >({});

  const agentIds = useMemo(() => agents.map((agent) => agent.id), [agents]);

  useEffect(() => {
    if (agentIds.length === 0) {
      setDeploymentsByAgent({});
      return;
    }
    let cancelled = false;
    async function loadAllDeployments() {
      setLoadingDeployments(true);
      setDeploymentError(null);
      try {
        const entries = await Promise.all(
          agentIds.map(async (agentId) => {
            const deployments = isAdmin
              ? await agentsAdapter.getDeployments(agentId)
              : await agentsAdapter.getTenantDeployments(agentId);
            return [agentId, deployments] as const;
          }),
        );
        if (cancelled) {
          return;
        }
        setDeploymentsByAgent(Object.fromEntries(entries));
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        setDeploymentError(mapApiErrorMessage(error));
      } finally {
        if (!cancelled) {
          setLoadingDeployments(false);
        }
      }
    }
    loadAllDeployments().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [agentIds, isAdmin, retryKey]);

  async function handleStartConversation(agentId: string, channel: 'chat' | 'voice') {
    setStartStateByAgent((current) => ({
      ...current,
      [agentId]: { loading: true, error: null, success: null },
    }));
    try {
      const result = await agentsAdapter.startConversation(agentId, {
        channel,
        tenantId: isAdmin ? id : undefined,
      });
      setStartStateByAgent((current) => ({
        ...current,
        [agentId]: {
          loading: false,
          error: null,
          success: `Started ${result.channel} conversation at ${new Date(result.startedAt).toLocaleTimeString()}.`,
        },
      }));
    } catch (error: unknown) {
      setStartStateByAgent((current) => ({
        ...current,
        [agentId]: { loading: false, error: mapApiErrorMessage(error), success: null },
      }));
    }
  }

  if (agents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-card)] card-glass p-8 text-center"
      >
        <p className="text-[var(--text-muted)] text-sm">No agents assigned yet.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Bot className="w-5 h-5" aria-hidden />
          Agents
        </CardHeader>
        <CardBody className="p-0">
          {deploymentError && (
            <div className="px-4 pt-4 space-y-2">
              <p className="text-sm text-[var(--error)]">{deploymentError}</p>
              <button
                type="button"
                onClick={() => {
                  if (!loadingDeployments) setRetryKey((value) => value + 1);
                }}
                className="text-xs font-medium text-[var(--ds-primary)] hover:underline"
                disabled={loadingDeployments}
              >
                Retry
              </button>
            </div>
          )}
          {loadingDeployments && (
            <p className="px-4 pt-4 text-sm text-[var(--text-muted)]">Loading deployment status...</p>
          )}
          <DataTable minWidth="min-w-[640px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Voice</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Last synced</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a) => {
                  const Icon = channelIcons[a.channel] ?? Bot;
                  const deployments = deploymentsByAgent[a.id] ?? [];
                  const activeStartChannels = deployments
                    .filter(
                      (deployment) =>
                        deployment.status === 'active' &&
                        (deployment.channel === 'chat' || deployment.channel === 'voice'),
                    )
                    .map((deployment) => deployment.channel);
                  const preferredStartChannel: 'chat' | 'voice' | null = activeStartChannels.includes(
                    'chat',
                  )
                    ? 'chat'
                    : activeStartChannels.includes('voice')
                      ? 'voice'
                      : null;
                  const startState = startStateByAgent[a.id] ?? {
                    loading: false,
                    error: null,
                    success: null,
                  };
                  return (
                    <Fragment key={a.id}>
                      <TableRow key={a.id} className="border-t border-[var(--border-subtle)]/50 first:border-t-0">
                        <TableCell className="font-medium text-[var(--text-primary)]">{a.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <Icon className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
                            {a.channel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <PillTag variant="status">{a.status}</PillTag>
                        </TableCell>
                        <TableCell className="text-[var(--text-secondary)] text-sm">{a.voice}</TableCell>
                        <TableCell className="text-[var(--text-secondary)] text-sm">{a.language}</TableCell>
                        <TableCell className="text-[var(--text-muted)] text-sm">{a.lastSynced}</TableCell>
                        <TableCell>
                          {id && (
                            <Link to={`${agentLinkBase}/agents/${a.id}`}>
                              <ViewButton aria-label={`View ${a.name}`} />
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                      {deployments.length > 0 && (
                        <TableRow className="border-t border-[var(--border-subtle)]/30 bg-[var(--bg-elevated)]/20">
                          <TableCell colSpan={7}>
                            <div className="space-y-1 py-1">
                              {deployments.map((deployment) => (
                                <div
                                  key={deployment.id}
                                  className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]"
                                >
                                  <PillTag variant="plan">{deployment.channel}</PillTag>
                                  <PillTag
                                    variant={
                                      deployment.status === 'failed'
                                        ? 'outcomeFailed'
                                        : deployment.status === 'active'
                                          ? 'status'
                                          : 'role'
                                    }
                                  >
                                    {deployment.status}
                                  </PillTag>
                                  <span>Provider: {deployment.provider}</span>
                                  <span>Agent: {deployment.retellAgentId ?? '—'}</span>
                                  {deployment.error && (
                                    <span className="text-[var(--error)]">Error: {deployment.error}</span>
                                  )}
                                </div>
                              ))}
                              {preferredStartChannel && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartConversation(a.id, preferredStartChannel)}
                                    loading={startState.loading}
                                    disabled={startState.loading}
                                  >
                                    Start {preferredStartChannel} conversation
                                  </Button>
                                  {startState.success && (
                                    <span className="text-xs text-[var(--success)]">
                                      {startState.success}
                                    </span>
                                  )}
                                  {startState.error && (
                                    <span className="text-xs text-[var(--error)]">
                                      {startState.error}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </DataTable>
        </CardBody>
      </Card>
    </motion.div>
  );
}
