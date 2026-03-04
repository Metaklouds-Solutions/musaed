/**
 * Admin Skills Catalog page. Coming Soon placeholder.
 */

import { BookOpen } from 'lucide-react';
import { PageHeader, Card, CardBody } from '../../../shared/ui';

/** Renders placeholder state for upcoming admin skills management module. */
export function AdminSkillsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills Catalog"
        description="Manage and assign skills to voice agents. Browse, enable, and prioritize skills per agent."
      />
      <Card className="flex flex-col items-center justify-center py-16">
        <CardBody className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl bg-(--bg-elevated) p-4">
            <BookOpen className="h-12 w-12 text-(--text-muted)" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-(--text-primary)">
              Coming Soon
            </h2>
            <p className="max-w-md text-sm text-(--text-muted)">
              The Skills Catalog will let you browse available skills, enable them per agent,
              and set priority order. Stay tuned.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
