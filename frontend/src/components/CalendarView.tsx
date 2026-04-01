import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calendarAPI } from '../lib/api';
import { ChevronLeft, ChevronRight, Scale, Clock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  type: 'hearing' | 'deadline';
  title: string;
  date: string;
  meta: Record<string, string | undefined>;
  case: { id: string; title: string; suitNumber: string };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-events', year, month],
    queryFn: () => calendarAPI.getEvents({ year, month }),
  });

  const events: CalendarEvent[] = data?.data?.events ?? [];

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const handlePrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const handleNext = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const eventsForDay = (day: number) => {
    const d = new Date(year, month - 1, day);
    return events.filter((e) => isSameDay(new Date(e.date), d));
  };

  const selectedEvents = selectedDay
    ? events.filter((e) => isSameDay(new Date(e.date), selectedDay))
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upcoming hearings and deadlines</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-base font-semibold text-gray-900 min-w-[160px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading…</div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Empty leading cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-50 bg-gray-50/40" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayDate = new Date(year, month - 1, day);
                const dayEvents = eventsForDay(day);
                const isToday = isSameDay(dayDate, today);
                const isSelected = selectedDay ? isSameDay(dayDate, selectedDay) : false;
                const hearings = dayEvents.filter((e) => e.type === 'hearing');
                const deadlines = dayEvents.filter((e) => e.type === 'deadline');

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : dayDate)}
                    className={`h-24 border-b border-r border-gray-100 p-1.5 text-left align-top transition-colors ${
                      isSelected
                        ? 'bg-blue-50 ring-2 ring-inset ring-blue-400'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>

                    <div className="space-y-0.5 overflow-hidden">
                      {hearings.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="text-[10px] leading-tight bg-blue-100 text-blue-800 rounded px-1 truncate"
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      ))}
                      {deadlines.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="text-[10px] leading-tight bg-amber-100 text-amber-800 rounded px-1 truncate"
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 4 && (
                        <div className="text-[10px] text-gray-400 px-1">
                          +{dayEvents.length - 4} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="px-4 py-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Hearing
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Deadline
            </span>
          </div>
        </div>

        {/* Sidebar: selected day events or full month list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              {selectedDay
                ? selectedDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                : `${MONTHS[month - 1]} events`}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {(selectedDay ? selectedEvents : events).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                {selectedDay ? 'No events on this day.' : 'No events this month.'}
              </div>
            ) : (
              (selectedDay ? selectedEvents : events).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const date = new Date(event.date);
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            event.type === 'hearing' ? 'bg-blue-100' : 'bg-amber-100'
          }`}
        >
          {event.type === 'hearing' ? (
            <Scale className="w-3 h-3 text-blue-600" />
          ) : (
            <Clock className="w-3 h-3 text-amber-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
          <p className="text-xs text-gray-500 truncate">{event.case.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {dateStr} · {timeStr}
            {event.type === 'hearing' && event.meta.courtRoom && ` · ${event.meta.courtRoom}`}
          </p>
          {event.type === 'deadline' && event.meta.status && (
            <span
              className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                event.meta.status === 'OVERDUE'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {event.meta.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
