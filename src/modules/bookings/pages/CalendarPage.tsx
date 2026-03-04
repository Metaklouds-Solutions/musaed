/**
 * Bookings calendar page. Month view with appointments and availability.
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../shared/ui';
import { CalendarView } from '../../../components/Calendar';
import { useSession } from '../../../app/session/SessionContext';

export function CalendarPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const tenantId = user?.role === 'ADMIN' ? undefined : user?.tenantId;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('calendar.title')}
        description={t('calendar.description')}
      />
      <CalendarView tenantId={tenantId} />
    </div>
  );
}
