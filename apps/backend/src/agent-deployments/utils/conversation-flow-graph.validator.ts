import { BadRequestException } from '@nestjs/common';

/**
 * Ensures no conversation-flow edge points from a node to itself.
 * Retell rejects such edges at publish time; this fails deploy earlier with a clear message.
 *
 * @param conversationFlow - The `conversationFlow` object from a Retell flow template
 */
export function validateConversationFlowNoSelfLoopEdges(
  conversationFlow: Record<string, unknown>,
): void {
  const nodes = conversationFlow.nodes;
  if (!Array.isArray(nodes)) {
    return;
  }

  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    const node = raw as Record<string, unknown>;
    const nodeId = node.id;
    if (typeof nodeId !== 'string' || nodeId.length === 0) {
      continue;
    }
    const edges = node.edges;
    if (!Array.isArray(edges)) {
      continue;
    }
    for (const rawEdge of edges) {
      if (!rawEdge || typeof rawEdge !== 'object' || Array.isArray(rawEdge)) {
        continue;
      }
      const edge = rawEdge as Record<string, unknown>;
      const destination = edge.destination_node_id;
      if (typeof destination !== 'string') {
        continue;
      }
      if (destination === nodeId) {
        const edgeId =
          typeof edge.id === 'string' && edge.id.length > 0
            ? edge.id
            : '(missing edge id)';
        throw new BadRequestException(
          `Edge destination node id cannot be the same as the source node id: ${edgeId} (source node: ${nodeId})`,
        );
      }
    }
  }
}
