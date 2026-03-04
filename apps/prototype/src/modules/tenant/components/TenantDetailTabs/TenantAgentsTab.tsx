/**
 * Tenant detail Agents tab: list of agents with links to agent detail.
 */

import { Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, Phone, MessageSquare, Mail } from 'lucide-react';
import { Card, CardHeader, CardBody, DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ViewButton, PillTag } from '../../../../shared/ui';
import type { TenantAgentRow } from '../../../../shared/types';

interface TenantAgentsTabProps {
  agents: TenantAgentRow[];
}

const channelIcons: Record<string, typeof Phone> = { voice: Phone, chat: MessageSquare, email: Mail };

/** Renders tenant-assigned agents with channel/status and deep-link actions. */
export function TenantAgentsTab({ agents }: TenantAgentsTabProps) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin/');
  const agentLinkBase = isAdmin ? `/admin/tenants/${id}` : `/tenants/${id}`;

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
                  return (
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
