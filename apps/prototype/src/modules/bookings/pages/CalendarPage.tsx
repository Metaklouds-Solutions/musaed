/**
 * Bookings calendar page. Month view with appointments and availability.
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader, Button } from '../../../shared/ui';
import { CalendarView } from '../../../components/Calendar';
import { useSession } from '../../../app/session/SessionContext';

export function CalendarPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const tenantId = user?.role === 'ADMIN' ? undefined : user?.tenantId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title={t('calendar.title')}
          description={t('calendar.description')}
        />
        <Link to="/bookings">
          <Button variant="secondary">View bookings list</Button>
        </Link>
      </div>
      <CalendarView tenantId={tenantId} />
    </div>
  );
}
