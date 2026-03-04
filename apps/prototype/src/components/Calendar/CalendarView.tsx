/**
 * Calendar view. FullCalendar with appointments and staff availability.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import arLocale from '@fullcalendar/core/locales/ar';
import { Calendar } from 'lucide-react';
import { getCalendarEvents } from './calendarEvents';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  tenantId: string | undefined;
  className?: string;
}

export function CalendarView({ tenantId, className }: CalendarViewProps) {
  const { t, i18n } = useTranslation();
  const events = useCallback(
    (fetchInfo: { start: Date; end: Date }) => getCalendarEvents(tenantId, fetchInfo.start, fetchInfo.end),
    [tenantId]
  );

  if (!tenantId) {
    return (
      <div className={cn('rounded-[var(--radius-card)] card-glass p-8 text-center', className)}>
        <Calendar className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" aria-hidden />
        <p className="text-[var(--text-muted)]">{t('calendar.signInToView')}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-[var(--radius-card)] card-glass overflow-hidden', className)}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        locales={[arLocale]}
        locale={i18n.language?.split('-')[0] || 'en'}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek',
        }}
        events={events}
        height="auto"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        nowIndicator
        navLinks
        editable={false}
        selectable={false}
        dayMaxEvents={3}
        moreLinkClick="popover"
      />
    </div>
  );
}
