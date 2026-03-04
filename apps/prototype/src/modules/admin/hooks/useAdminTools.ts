/**
 * Admin tools hook. List and CRUD for tool definitions.
 */

import { useMemo, useState, useCallback } from 'react';
import { toolsAdapter } from '../../../adapters';
import type { ToolDefinition } from '../../../shared/types';

export function useAdminTools() {
  const [refreshKey, setRefreshKey] = useState(0);

  const tools = useMemo(() => toolsAdapter.list(), [refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const getTool = useCallback((id: string) => toolsAdapter.get(id), []);

  const createTool = useCallback(
    (data: Omit<ToolDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = toolsAdapter.create(data);
      refetch();
      return created;
    },
    [refetch]
  );

  const updateTool = useCallback(
    (id: string, patch: Partial<Omit<ToolDefinition, 'id' | 'createdAt'>>) => {
      const updated = toolsAdapter.update(id, patch);
      refetch();
      return updated;
    },
    [refetch]
  );

  const toggleActive = useCallback(
    (id: string) => {
      toolsAdapter.toggleActive(id);
      refetch();
    },
    [refetch]
  );

  const deleteTool = useCallback(
    (id: string) => {
      const ok = toolsAdapter.delete(id);
      refetch();
      return ok;
    },
    [refetch]
  );

  return {
    tools,
    refetch,
    getTool,
    createTool,
    updateTool,
    toggleActive,
    deleteTool,
  };
}
