import { validateConversationFlowNoSelfLoopEdges } from './conversation-flow-graph.validator';

describe('validateConversationFlowNoSelfLoopEdges', () => {
  it('does not throw when all edges leave the source node', () => {
    validateConversationFlowNoSelfLoopEdges({
      nodes: [
        {
          id: 'node-a',
          edges: [
            {
              id: 'edge-a-to-b',
              destination_node_id: 'node-b',
            },
          ],
        },
        {
          id: 'node-b',
          edges: [],
        },
      ],
    });
  });

  it('throws when an edge destination equals the source node id', () => {
    expect(() =>
      validateConversationFlowNoSelfLoopEdges({
        nodes: [
          {
            id: 'node-reschedule-new-time',
            edges: [
              {
                id: 'edge-reschedule-unavailable',
                destination_node_id: 'node-reschedule-new-time',
              },
            ],
          },
        ],
      }),
    ).toThrow(
      'Edge destination node id cannot be the same as the source node id: edge-reschedule-unavailable (source node: node-reschedule-new-time)',
    );
  });
});
