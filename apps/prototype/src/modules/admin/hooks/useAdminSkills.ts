/**
 * Admin skills hook. List, CRUD, and tool linking for skill definitions.
 */

import { useMemo, useState, useCallback } from 'react';
import { skillsAdapter } from '../../../adapters';
import type { SkillDefinition } from '../../../shared/types';

export function useAdminSkills() {
  const [refreshKey, setRefreshKey] = useState(0);

  const skills = useMemo(() => skillsAdapter.list(), [refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const getSkill = useCallback((id: string) => skillsAdapter.get(id), []);

  const createSkill = useCallback(
    (data: Omit<SkillDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = skillsAdapter.create(data);
      refetch();
      return created;
    },
    [refetch]
  );

  const updateSkill = useCallback(
    (id: string, patch: Partial<Omit<SkillDefinition, 'id' | 'createdAt'>>) => {
      const updated = skillsAdapter.update(id, patch);
      refetch();
      return updated;
    },
    [refetch]
  );

  const toggleActive = useCallback(
    (id: string) => {
      skillsAdapter.toggleActive(id);
      refetch();
    },
    [refetch]
  );

  const deleteSkill = useCallback(
    (id: string) => {
      const ok = skillsAdapter.delete(id);
      refetch();
      return ok;
    },
    [refetch]
  );

  const getLinkedTools = useCallback((skillId: string) => skillsAdapter.getLinkedTools(skillId), []);

  const linkTool = useCallback(
    (skillId: string, toolId: string, options?: { nodeReference?: string; isRequired?: boolean }) => {
      const link = skillsAdapter.linkTool(skillId, toolId, options);
      refetch();
      return link;
    },
    [refetch]
  );

  const unlinkTool = useCallback(
    (skillId: string, toolId: string) => {
      const ok = skillsAdapter.unlinkTool(skillId, toolId);
      refetch();
      return ok;
    },
    [refetch]
  );

  return {
    skills,
    refetch,
    getSkill,
    createSkill,
    updateSkill,
    toggleActive,
    deleteSkill,
    getLinkedTools,
    linkTool,
    unlinkTool,
  };
}
